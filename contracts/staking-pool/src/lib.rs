#![no_std]
#![no_main]

extern crate alloc;

use alloc::{string::String, vec::Vec};
use casper_contract::{
    contract_api::{runtime, storage, system},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    CLType, CLValue, EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, Parameter,
    PublicKey, U256, U512, URef, account::AccountHash, runtime_args, RuntimeArgs, ContractHash,
};

// Storage keys
const TOKEN_CONTRACT_KEY: &str = "stcspr_token_contract";
const TOTAL_STAKED_KEY: &str = "total_staked";
const TOTAL_REWARDS_KEY: &str = "total_rewards";
const INSTANT_POOL_KEY: &str = "instant_unstake_pool";
const VALIDATOR_LIST_KEY: &str = "validator_list";
const EXCHANGE_RATE_KEY: &str = "exchange_rate"; // stCSPR to CSPR rate
const AUTO_COMPOUND_ENABLED_KEY: &str = "auto_compound_enabled";

// Constants
const INSTANT_UNSTAKE_FEE_BP: u64 = 50; // 0.5% fee in basis points
const MIN_STAKE_AMOUNT: u64 = 1_000_000_000; // 1 CSPR minimum

#[no_mangle]
pub extern "C" fn init() {
    let token_contract: ContractHash = runtime::get_named_arg("token_contract");

    // Initialize storage
    runtime::put_key(TOKEN_CONTRACT_KEY, storage::new_uref(token_contract).into());
    runtime::put_key(TOTAL_STAKED_KEY, storage::new_uref(U512::zero()).into());
    runtime::put_key(TOTAL_REWARDS_KEY, storage::new_uref(U512::zero()).into());
    runtime::put_key(INSTANT_POOL_KEY, storage::new_uref(U512::zero()).into());
    runtime::put_key(EXCHANGE_RATE_KEY, storage::new_uref(U512::from(1_000_000_000u64)).into()); // 1:1 initially
    runtime::put_key(AUTO_COMPOUND_ENABLED_KEY, storage::new_uref(true).into());
}

#[no_mangle]
pub extern "C" fn deposit() {
    let amount: U512 = runtime::get_named_arg("amount");
    let caller = runtime::get_caller();

    // Validate minimum stake
    if amount < U512::from(MIN_STAKE_AMOUNT) {
        runtime::revert(casper_types::ApiError::User(200)); // Amount too small
    }

    // Transfer CSPR from user to contract
    let contract_purse = system::get_purse();
    system::transfer_from_purse_to_purse(
        runtime::get_caller(),
        contract_purse,
        amount,
        None,
    )
    .unwrap_or_revert();

    // Calculate stCSPR to mint based on exchange rate
    let exchange_rate = get_exchange_rate();
    let stcspr_amount = calculate_stcspr_amount(amount, exchange_rate);

    // Mint stCSPR tokens to user
    let token_contract = get_token_contract();
    runtime::call_contract::<()>(
        token_contract,
        "mint",
        runtime_args! {
            "recipient" => caller,
            "amount" => stcspr_amount,
        },
    );

    // Update total staked
    update_total_staked(amount, true);

    // Smart validator routing - distribute stake
    distribute_to_validators(amount);
}

#[no_mangle]
pub extern "C" fn withdraw() {
    let stcspr_amount: U512 = runtime::get_named_arg("amount");
    let instant: bool = runtime::get_named_arg("instant");
    let caller = runtime::get_caller();

    // Calculate CSPR to return based on exchange rate (includes rewards)
    let exchange_rate = get_exchange_rate();
    let cspr_amount = calculate_cspr_amount(stcspr_amount, exchange_rate);

    if instant {
        // Instant unstake from liquidity pool
        let pool_balance = get_instant_pool_balance();

        // Calculate fee
        let fee = (cspr_amount * U512::from(INSTANT_UNSTAKE_FEE_BP)) / U512::from(10000);
        let net_amount = cspr_amount - fee;

        if pool_balance < net_amount {
            runtime::revert(casper_types::ApiError::User(201)); // Insufficient pool liquidity
        }

        // Burn stCSPR
        let token_contract = get_token_contract();
        runtime::call_contract::<()>(
            token_contract,
            "burn",
            runtime_args! {
                "account" => caller,
                "amount" => stcspr_amount,
            },
        );

        // Transfer CSPR to user
        let contract_purse = system::get_purse();
        system::transfer_from_purse_to_account(contract_purse, caller, net_amount, None)
            .unwrap_or_revert();

        // Update pool balance
        update_instant_pool(net_amount, false);
    } else {
        // Standard unstake - initiate unbonding
        let token_contract = get_token_contract();
        runtime::call_contract::<()>(
            token_contract,
            "burn",
            runtime_args! {
                "account" => caller,
                "amount" => stcspr_amount,
            },
        );

        // In a full implementation, would call undelegate and queue withdrawal
        // For hackathon demo, we'll transfer immediately
        let contract_purse = system::get_purse();
        system::transfer_from_purse_to_account(contract_purse, caller, cspr_amount, None)
            .unwrap_or_revert();
    }

    update_total_staked(cspr_amount, false);
}

#[no_mangle]
pub extern "C" fn compound_rewards() {
    // Auto-compound accumulated rewards
    // In production, this would be called by a keeper/bot regularly

    let total_rewards = get_total_rewards();
    if total_rewards == U512::zero() {
        return;
    }

    // Restake rewards by delegating to validators
    distribute_to_validators(total_rewards);

    // Update exchange rate to reflect compounded value
    update_exchange_rate();

    // Reset rewards counter
    set_total_rewards(U512::zero());
}

#[no_mangle]
pub extern "C" fn add_instant_liquidity() {
    // Allows users to provide liquidity to instant unstake pool
    let amount: U512 = runtime::get_named_arg("amount");
    let caller = runtime::get_caller();

    let contract_purse = system::get_purse();
    system::transfer_from_purse_to_purse(caller, contract_purse, amount, None)
        .unwrap_or_revert();

    update_instant_pool(amount, true);
}

#[no_mangle]
pub extern "C" fn get_stats() {
    // Return protocol statistics
    let total_staked = get_total_staked();
    let exchange_rate = get_exchange_rate();
    let instant_pool = get_instant_pool_balance();

    // Return as tuple (for demo purposes)
    let stats = alloc::format!(
        "Total Staked: {} CSPR, Exchange Rate: {}, Instant Pool: {} CSPR",
        total_staked, exchange_rate, instant_pool
    );
    runtime::ret(CLValue::from_t(stats).unwrap_or_revert());
}

// Helper functions
fn get_token_contract() -> ContractHash {
    let token_contract_uref: URef = runtime::get_key(TOKEN_CONTRACT_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(token_contract_uref)
        .unwrap_or_revert()
        .unwrap_or_revert()
}

fn get_total_staked() -> U512 {
    let total_staked_uref: URef = runtime::get_key(TOTAL_STAKED_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(total_staked_uref)
        .unwrap_or_revert()
        .unwrap_or_revert()
}

fn update_total_staked(amount: U512, increase: bool) {
    let total_staked_uref: URef = runtime::get_key(TOTAL_STAKED_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let current = get_total_staked();
    let new_total = if increase {
        current + amount
    } else {
        current - amount
    };
    storage::write(total_staked_uref, new_total);
}

fn get_total_rewards() -> U512 {
    let rewards_uref: URef = runtime::get_key(TOTAL_REWARDS_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(rewards_uref).unwrap_or_revert().unwrap_or_revert()
}

fn set_total_rewards(amount: U512) {
    let rewards_uref: URef = runtime::get_key(TOTAL_REWARDS_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::write(rewards_uref, amount);
}

fn get_instant_pool_balance() -> U512 {
    let pool_uref: URef = runtime::get_key(INSTANT_POOL_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(pool_uref).unwrap_or_revert().unwrap_or_revert()
}

fn update_instant_pool(amount: U512, increase: bool) {
    let pool_uref: URef = runtime::get_key(INSTANT_POOL_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let current = get_instant_pool_balance();
    let new_balance = if increase {
        current + amount
    } else {
        current - amount
    };
    storage::write(pool_uref, new_balance);
}

fn get_exchange_rate() -> U512 {
    let rate_uref: URef = runtime::get_key(EXCHANGE_RATE_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(rate_uref).unwrap_or_revert().unwrap_or_revert()
}

fn update_exchange_rate() {
    // Exchange rate = (Total CSPR + Rewards) / Total stCSPR
    // As rewards compound, stCSPR becomes more valuable
    let rate_uref: URef = runtime::get_key(EXCHANGE_RATE_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();

    let token_contract = get_token_contract();
    let total_supply: U256 = runtime::call_contract(token_contract, "total_supply", runtime_args! {});
    let total_staked = get_total_staked();

    if total_supply > U256::zero() {
        // Rate increases as rewards accumulate
        let new_rate = (total_staked * U512::from(1_000_000_000u64)) / U512::from(total_supply.as_u128());
        storage::write(rate_uref, new_rate);
    }
}

fn calculate_stcspr_amount(cspr_amount: U512, exchange_rate: U512) -> U256 {
    // stCSPR = CSPR / exchange_rate
    let result = (cspr_amount * U512::from(1_000_000_000u64)) / exchange_rate;
    U256::from(result.as_u128())
}

fn calculate_cspr_amount(stcspr_amount: U512, exchange_rate: U512) -> U512 {
    // CSPR = stCSPR * exchange_rate
    (stcspr_amount * exchange_rate) / U512::from(1_000_000_000u64)
}

fn distribute_to_validators(amount: U512) {
    // Smart validator routing algorithm
    // For demo: would delegate to top validators based on:
    // 1. Performance score
    // 2. Commission rate
    // 3. Decentralization (avoid concentration)

    // Simplified for hackathon - in production would call actual delegation
    // system::delegate(validator_public_key, amount);
}

#[no_mangle]
pub extern "C" fn call() {
    let token_contract: ContractHash = runtime::get_named_arg("token_contract");

    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "init",
        vec![Parameter::new("token_contract", CLType::Key)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "deposit",
        vec![Parameter::new("amount", CLType::U512)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "withdraw",
        vec![
            Parameter::new("amount", CLType::U512),
            Parameter::new("instant", CLType::Bool),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "compound_rewards",
        vec![],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "add_instant_liquidity",
        vec![Parameter::new("amount", CLType::U512)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "get_stats",
        vec![],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    let (contract_hash, _) = storage::new_contract(
        entry_points,
        None,
        Some("staking_pool_package".to_string()),
        None,
    );

    runtime::put_key("staking_pool", contract_hash.into());

    // Initialize the contract
    runtime::call_contract::<()>(contract_hash, "init", runtime_args! {
        "token_contract" => token_contract,
    });
}
