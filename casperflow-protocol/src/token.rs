use odra::prelude::*;
use odra::casper_types::U256;

#[odra::module]
pub struct StCSPRToken {
    name: Var<String>,
    symbol: Var<String>,
    decimals: Var<u8>,
    total_supply: Var<U256>,
    balances: Mapping<Address, U256>,
    allowances: Mapping<(Address, Address), U256>,
    staking_pool: Var<Address>,
}

#[odra::module]
impl StCSPRToken {
    pub fn init(&mut self, staking_pool: Address) {
        self.name.set(String::from("Staked CSPR"));
        self.symbol.set(String::from("stCSPR"));
        self.decimals.set(9);
        self.total_supply.set(U256::zero());
        self.staking_pool.set(staking_pool);
    }

    pub fn name(&self) -> String {
        self.name.get_or_default()
    }

    pub fn symbol(&self) -> String {
        self.symbol.get_or_default()
    }

    pub fn decimals(&self) -> u8 {
        self.decimals.get_or_default()
    }

    pub fn total_supply(&self) -> U256 {
        self.total_supply.get_or_default()
    }

    pub fn balance_of(&self, account: Address) -> U256 {
        self.balances.get(&account).unwrap_or(U256::zero())
    }

    pub fn transfer(&mut self, recipient: Address, amount: U256) {
        let sender = self.env().caller();
        self._transfer(sender, recipient, amount);
    }

    pub fn approve(&mut self, spender: Address, amount: U256) {
        let owner = self.env().caller();
        self.allowances.set(&(owner, spender), amount);
    }

    pub fn transfer_from(&mut self, owner: Address, recipient: Address, amount: U256) {
        let spender = self.env().caller();
        let current_allowance = self.allowances.get(&(owner, spender)).unwrap_or(U256::zero());

        if current_allowance < amount {
            self.env().revert(Error::InsufficientAllowance);
        }

        self.allowances.set(&(owner, spender), current_allowance - amount);
        self._transfer(owner, recipient, amount);
    }

    pub fn mint(&mut self, recipient: Address, amount: U256) {
        let caller = self.env().caller();
        let staking_pool = self.staking_pool.get_or_revert_with(Error::Unauthorized);

        if caller != staking_pool {
            self.env().revert(Error::Unauthorized);
        }

        let balance = self.balance_of(recipient);
        self.balances.set(&recipient, balance + amount);

        let total = self.total_supply();
        self.total_supply.set(total + amount);
    }

    pub fn burn(&mut self, account: Address, amount: U256) {
        let caller = self.env().caller();
        let staking_pool = self.staking_pool.get_or_revert_with(Error::Unauthorized);

        if caller != staking_pool {
            self.env().revert(Error::Unauthorized);
        }

        let balance = self.balance_of(account);
        if balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }

        self.balances.set(&account, balance - amount);

        let total = self.total_supply();
        self.total_supply.set(total - amount);
    }

    fn _transfer(&mut self, sender: Address, recipient: Address, amount: U256) {
        let sender_balance = self.balance_of(sender);
        if sender_balance < amount {
            self.env().revert(Error::InsufficientBalance);
        }

        let recipient_balance = self.balance_of(recipient);

        self.balances.set(&sender, sender_balance - amount);
        self.balances.set(&recipient, recipient_balance + amount);
    }
}

#[odra::odra_error]
pub enum Error {
    InsufficientBalance = 1,
    Unauthorized = 2,
    InsufficientAllowance = 3,
}
