use odra::prelude::*;
use odra::casper_types::{U512, bytesrepr::ToBytes};
use crate::token::StCSPRToken;

const INSTANT_UNSTAKE_FEE_BP: u64 = 50; // 0.5% in basis points
const MIN_STAKE_AMOUNT: u64 = 1_000_000_000; // 1 CSPR minimum

#[odra::module]
pub struct StakingPool {
    token: SubModule<StCSPRToken>,
    total_staked: Var<U512>,
    total_rewards: Var<U512>,
    instant_pool: Var<U512>,
    exchange_rate: Var<U512>,  // stCSPR to CSPR rate (in 10^9)
}

#[odra::module]
impl StakingPool {
    pub fn init(&mut self) {
        let pool_address = self.env().self_address();
        self.token.init(pool_address);
        self.total_staked.set(U512::zero());
        self.total_rewards.set(U512::zero());
        self.instant_pool.set(U512::zero());
        self.exchange_rate.set(U512::from(1_000_000_000u64)); // 1:1 initially
    }

    #[odra(payable)]
    pub fn deposit(&mut self) {
        let amount = self.env().attached_value();
        let caller = self.env().caller();

        if amount < U512::from(MIN_STAKE_AMOUNT) {
            self.env().revert(Error::AmountTooSmall);
        }

        // Calculate stCSPR to mint based on exchange rate
        let exchange_rate = self.exchange_rate.get_or_default();
        let stcspr_amount = self.calculate_stcspr_amount(amount, exchange_rate);

        // Mint stCSPR tokens
        self.token.mint(caller, stcspr_amount);

        // Update total staked
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total + amount);
    }

    pub fn withdraw(&mut self, stcspr_amount: U512, instant: bool) {
        let caller = self.env().caller();
        let exchange_rate = self.exchange_rate.get_or_default();
        let cspr_amount = self.calculate_cspr_amount(stcspr_amount, exchange_rate);

        // Convert U512 to U256 for burn
        let stcspr_u256 = self.u512_to_u256(stcspr_amount);

        // Burn stCSPR
        self.token.burn(caller, stcspr_u256);

        if instant {
            // Instant unstake with fee
            let fee = cspr_amount * U512::from(INSTANT_UNSTAKE_FEE_BP) / U512::from(10000);
            let net_amount = cspr_amount - fee;

            let pool_balance = self.instant_pool.get_or_default();
            if pool_balance < net_amount {
                self.env().revert(Error::InsufficientPoolLiquidity);
            }

            // Update pool
            self.instant_pool.set(pool_balance - net_amount);

            // Transfer CSPR to user
            self.env().transfer_tokens(&caller, &net_amount);
        } else {
            // Standard unstake - transfer immediately (in production would queue for unbonding)
            self.env().transfer_tokens(&caller, &cspr_amount);
        }

        // Update total staked
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total - cspr_amount);
    }

    #[odra(payable)]
    pub fn add_instant_liquidity(&mut self) {
        let amount = self.env().attached_value();
        let pool_balance = self.instant_pool.get_or_default();
        self.instant_pool.set(pool_balance + amount);
    }

    pub fn compound_rewards(&mut self) {
        let rewards = self.total_rewards.get_or_default();
        if rewards == U512::zero() {
            return;
        }

        // Add rewards to total staked (simulating restaking)
        let total = self.total_staked.get_or_default();
        self.total_staked.set(total + rewards);

        // Update exchange rate to reflect compounded value
        self.update_exchange_rate();

        // Reset rewards
        self.total_rewards.set(U512::zero());
    }

    // View functions
    pub fn get_total_staked(&self) -> U512 {
        self.total_staked.get_or_default()
    }

    pub fn get_exchange_rate(&self) -> U512 {
        self.exchange_rate.get_or_default()
    }

    pub fn get_instant_pool_balance(&self) -> U512 {
        self.instant_pool.get_or_default()
    }

    pub fn get_stcspr_balance(&self, account: Address) -> odra::casper_types::U256 {
        self.token.balance_of(account)
    }

    pub fn get_stcspr_token_name(&self) -> String {
        self.token.name()
    }

    // Helper functions
    fn calculate_stcspr_amount(&self, cspr_amount: U512, exchange_rate: U512) -> odra::casper_types::U256 {
        let result = (cspr_amount * U512::from(1_000_000_000u64)) / exchange_rate;
        self.u512_to_u256(result)
    }

    fn calculate_cspr_amount(&self, stcspr_amount: U512, exchange_rate: U512) -> U512 {
        (stcspr_amount * exchange_rate) / U512::from(1_000_000_000u64)
    }

    fn update_exchange_rate(&mut self) {
        let total_staked = self.total_staked.get_or_default();
        let total_supply_u256 = self.token.total_supply();
        let total_supply = self.u256_to_u512(total_supply_u256);

        if total_supply > U512::zero() {
            let new_rate = (total_staked * U512::from(1_000_000_000u64)) / total_supply;
            self.exchange_rate.set(new_rate);
        }
    }

    fn u512_to_u256(&self, value: U512) -> odra::casper_types::U256 {
        let bytes = value.to_bytes().unwrap_or_default();
        odra::casper_types::U256::from_little_endian(&bytes)
    }

    fn u256_to_u512(&self, value: odra::casper_types::U256) -> U512 {
        let mut bytes = [0u8; 32];
        value.to_little_endian(&mut bytes);
        U512::from_little_endian(&bytes)
    }
}

#[odra::odra_error]
pub enum Error {
    AmountTooSmall = 100,
    InsufficientPoolLiquidity = 101,
}
