#![no_std]
#![no_main]

extern crate alloc;

use alloc::string::String;
use casper_contract::{
    contract_api::{runtime, storage},
    unwrap_or_revert::UnwrapOrRevert,
};
use casper_types::{
    CLType, CLValue, EntryPoint, EntryPointAccess, EntryPointType, EntryPoints, Key, Parameter,
    U256, URef, account::AccountHash, runtime_args, RuntimeArgs,
};

// Token metadata
const TOKEN_NAME: &str = "Staked CSPR";
const TOKEN_SYMBOL: &str = "stCSPR";
const TOKEN_DECIMALS: u8 = 9;

// Contract storage keys
const TOTAL_SUPPLY_KEY: &str = "total_supply";
const BALANCES_KEY: &str = "balances";
const ALLOWANCES_KEY: &str = "allowances";
const STAKING_POOL_KEY: &str = "staking_pool";

#[no_mangle]
pub extern "C" fn init() {
    let total_supply: U256 = U256::zero();
    let staking_pool: AccountHash = runtime::get_named_arg("staking_pool");

    runtime::put_key(TOTAL_SUPPLY_KEY, storage::new_uref(total_supply).into());
    runtime::put_key(STAKING_POOL_KEY, storage::new_uref(staking_pool).into());
}

#[no_mangle]
pub extern "C" fn name() {
    let name = String::from(TOKEN_NAME);
    runtime::ret(CLValue::from_t(name).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn symbol() {
    let symbol = String::from(TOKEN_SYMBOL);
    runtime::ret(CLValue::from_t(symbol).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn decimals() {
    runtime::ret(CLValue::from_t(TOKEN_DECIMALS).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn total_supply() {
    let total_supply_uref: URef = runtime::get_key(TOTAL_SUPPLY_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let total_supply: U256 = storage::read(total_supply_uref).unwrap_or_revert().unwrap_or_revert();
    runtime::ret(CLValue::from_t(total_supply).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn balance_of() {
    let account: AccountHash = runtime::get_named_arg("account");
    let balance = get_balance(&account);
    runtime::ret(CLValue::from_t(balance).unwrap_or_revert());
}

#[no_mangle]
pub extern "C" fn transfer() {
    let recipient: AccountHash = runtime::get_named_arg("recipient");
    let amount: U256 = runtime::get_named_arg("amount");
    let sender = runtime::get_caller();

    _transfer(&sender, &recipient, amount);
}

#[no_mangle]
pub extern "C" fn mint() {
    // Only staking pool can mint
    let caller = runtime::get_caller();
    let staking_pool = get_staking_pool();

    if caller != staking_pool {
        runtime::revert(casper_types::ApiError::User(100)); // Unauthorized
    }

    let recipient: AccountHash = runtime::get_named_arg("recipient");
    let amount: U256 = runtime::get_named_arg("amount");

    _mint(&recipient, amount);
}

#[no_mangle]
pub extern "C" fn burn() {
    // Only staking pool can burn
    let caller = runtime::get_caller();
    let staking_pool = get_staking_pool();

    if caller != staking_pool {
        runtime::revert(casper_types::ApiError::User(100)); // Unauthorized
    }

    let account: AccountHash = runtime::get_named_arg("account");
    let amount: U256 = runtime::get_named_arg("amount");

    _burn(&account, amount);
}

// Helper functions
fn get_balance(account: &AccountHash) -> U256 {
    let balances_dict_key = runtime::get_key(BALANCES_KEY).unwrap_or_revert();
    let balances_uref = balances_dict_key.into_uref().unwrap_or_revert();

    storage::dictionary_get(balances_uref, &account.to_string())
        .unwrap_or_revert()
        .unwrap_or(U256::zero())
}

fn set_balance(account: &AccountHash, balance: U256) {
    let balances_dict_key = runtime::get_key(BALANCES_KEY).unwrap_or_revert();
    let balances_uref = balances_dict_key.into_uref().unwrap_or_revert();

    storage::dictionary_put(balances_uref, &account.to_string(), balance);
}

fn get_staking_pool() -> AccountHash {
    let staking_pool_uref: URef = runtime::get_key(STAKING_POOL_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    storage::read(staking_pool_uref).unwrap_or_revert().unwrap_or_revert()
}

fn _transfer(sender: &AccountHash, recipient: &AccountHash, amount: U256) {
    let sender_balance = get_balance(sender);
    if sender_balance < amount {
        runtime::revert(casper_types::ApiError::User(101)); // Insufficient balance
    }

    let recipient_balance = get_balance(recipient);

    set_balance(sender, sender_balance - amount);
    set_balance(recipient, recipient_balance + amount);
}

fn _mint(account: &AccountHash, amount: U256) {
    let balance = get_balance(account);
    set_balance(account, balance + amount);

    let total_supply_uref: URef = runtime::get_key(TOTAL_SUPPLY_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let total_supply: U256 = storage::read(total_supply_uref).unwrap_or_revert().unwrap_or_revert();
    storage::write(total_supply_uref, total_supply + amount);
}

fn _burn(account: &AccountHash, amount: U256) {
    let balance = get_balance(account);
    if balance < amount {
        runtime::revert(casper_types::ApiError::User(101)); // Insufficient balance
    }

    set_balance(account, balance - amount);

    let total_supply_uref: URef = runtime::get_key(TOTAL_SUPPLY_KEY)
        .unwrap_or_revert()
        .into_uref()
        .unwrap_or_revert();
    let total_supply: U256 = storage::read(total_supply_uref).unwrap_or_revert().unwrap_or_revert();
    storage::write(total_supply_uref, total_supply - amount);
}

#[no_mangle]
pub extern "C" fn call() {
    let staking_pool: AccountHash = runtime::get_named_arg("staking_pool");

    let mut entry_points = EntryPoints::new();

    entry_points.add_entry_point(EntryPoint::new(
        "init",
        vec![Parameter::new("staking_pool", CLType::Key)],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "name",
        vec![],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "symbol",
        vec![],
        CLType::String,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "decimals",
        vec![],
        CLType::U8,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "total_supply",
        vec![],
        CLType::U256,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "balance_of",
        vec![Parameter::new("account", CLType::Key)],
        CLType::U256,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "transfer",
        vec![
            Parameter::new("recipient", CLType::Key),
            Parameter::new("amount", CLType::U256),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "mint",
        vec![
            Parameter::new("recipient", CLType::Key),
            Parameter::new("amount", CLType::U256),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    entry_points.add_entry_point(EntryPoint::new(
        "burn",
        vec![
            Parameter::new("account", CLType::Key),
            Parameter::new("amount", CLType::U256),
        ],
        CLType::Unit,
        EntryPointAccess::Public,
        EntryPointType::Contract,
    ));

    let (contract_hash, _) = storage::new_contract(
        entry_points,
        None,
        Some("stcspr_token_package".to_string()),
        None,
    );

    runtime::put_key("stcspr_token", contract_hash.into());

    // Initialize the contract
    runtime::call_contract::<()>(contract_hash, "init", runtime_args! {
        "staking_pool" => staking_pool,
    });
}
