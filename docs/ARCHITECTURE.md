# CasperFlow Architecture

## System Overview

CasperFlow is a liquid staking protocol built on Casper Network that enables users to stake CSPR while maintaining liquidity through stCSPR tokens.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  Next.js 15 + Tailwind v4 + TypeScript                     │
│  - Wallet Integration (CSPR.click)                          │
│  - Real-time Analytics Dashboard                            │
│  - Responsive UI for stake/unstake operations               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Smart Contract Layer                       │
│                                                              │
│  ┌──────────────────────┐    ┌──────────────────────┐     │
│  │  Staking Pool        │    │   stCSPR Token       │     │
│  │  Contract            │◄───│   Contract (CEP-18)  │     │
│  │                      │    │                      │     │
│  │  - deposit()         │    │  - mint()            │     │
│  │  - withdraw()        │    │  - burn()            │     │
│  │  - compound()        │    │  - transfer()        │     │
│  │  - get_stats()       │    │  - balance_of()      │     │
│  └──────────────────────┘    └──────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Casper Network Layer                       │
│  - Validators                                               │
│  - Staking Mechanism                                        │
│  - Delegation & Rewards                                     │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. stCSPR Token Contract (CEP-18)
**File:** `contracts/stcspr-token/src/lib.rs`

**Purpose:** ERC-20/CEP-18 compatible liquid staking token

**Key Functions:**
- `mint(recipient, amount)` - Mint new stCSPR tokens (only callable by staking pool)
- `burn(account, amount)` - Burn stCSPR tokens (only callable by staking pool)
- `transfer(recipient, amount)` - Transfer tokens between accounts
- `balance_of(account)` - Query token balance

**Security:**
- Only staking pool contract can mint/burn
- Standard CEP-18 token interface for DeFi compatibility

### 2. Staking Pool Contract
**File:** `contracts/staking-pool/src/lib.rs`

**Purpose:** Core protocol logic for staking, unstaking, and reward management

**Key Functions:**
- `deposit(amount)` - Stake CSPR, receive stCSPR
- `withdraw(amount, instant)` - Burn stCSPR, receive CSPR
- `compound_rewards()` - Auto-compound accumulated rewards
- `add_instant_liquidity(amount)` - Add to instant unstaking pool
- `get_stats()` - Return protocol statistics

**Innovations:**

#### a) Auto-Compounding Engine
```rust
fn compound_rewards() {
    let total_rewards = get_total_rewards();
    distribute_to_validators(total_rewards); // Restake
    update_exchange_rate(); // Increase stCSPR value
}
```
- Automatically restakes rewards every epoch
- No manual claiming needed
- Maximizes APY through continuous compounding

#### b) Smart Validator Routing
```rust
fn distribute_to_validators(amount: U512) {
    // Algorithm considers:
    // 1. Historical performance (>99% uptime preferred)
    // 2. Commission rates (lower is better)
    // 3. Decentralization (avoid over-concentration)
    // 4. Real-time health metrics
}
```
- Dynamic stake distribution
- Optimizes for yield + security + decentralization
- Automatically rebalances based on validator performance

#### c) Instant Unstaking Pool
```rust
fn withdraw(amount, instant: bool) {
    if instant {
        let fee = amount * 0.005; // 0.5% fee
        // Transfer from liquidity pool immediately
    } else {
        // Standard unbonding period (~7 days)
    }
}
```
- Liquidity pool enables instant exits
- Small fee (0.5%) compensates LPs
- Alternative: wait standard unbonding period (no fee)

#### d) Exchange Rate Mechanism
```rust
fn calculate_stcspr_amount(cspr: U512, rate: U512) -> U256 {
    // stCSPR = CSPR / exchange_rate
    // As rewards accumulate, 1 stCSPR > 1 CSPR
}
```
- Exchange rate starts at 1:1
- Increases as rewards compound
- stCSPR becomes more valuable over time
- Users earn through token appreciation

### 3. Frontend Application
**Directory:** `frontend/`

**Tech Stack:**
- Next.js 15 (React 19)
- TypeScript
- Tailwind CSS v4
- CSPR.click Wallet Integration

**Key Features:**
- **Dashboard:** Real-time protocol statistics
- **Staking Interface:** Easy stake/unstake with amount input
- **Yield Strategies:** Conservative / Balanced / Aggressive options
- **Portfolio Analytics:** Track your staked amount, APY, projected earnings
- **Validator Distribution:** Visualize stake distribution
- **Instant vs Standard Unstaking:** Choose your exit strategy

## Data Flow

### Staking Flow
```
1. User connects wallet (CSPR.click)
2. User enters CSPR amount to stake
3. User selects yield strategy (Conservative/Balanced/Aggressive)
4. Frontend calls staking pool contract
5. Contract transfers CSPR from user
6. Contract calculates stCSPR amount based on exchange rate
7. Contract mints stCSPR to user
8. Frontend updates user balance
```

### Unstaking Flow
```
1. User selects unstaking method (Instant or Standard)
2. User enters stCSPR amount to unstake
3. Frontend shows CSPR they'll receive
4. User confirms transaction
5. Contract burns stCSPR from user
6. If instant: Contract transfers CSPR from liquidity pool (with 0.5% fee)
7. If standard: Contract initiates unbonding, CSPR available after ~7 days
8. Frontend updates balances
```

### Auto-Compounding Flow
```
1. Keeper/bot calls compound_rewards() periodically (e.g., every epoch)
2. Contract queries accumulated staking rewards
3. Contract restakes rewards to validators
4. Contract updates exchange rate to reflect new value
5. All stCSPR holders benefit from increased token value
```

## Security Considerations

1. **Access Control:** Only staking pool can mint/burn stCSPR
2. **Slippage Protection:** Exchange rate prevents front-running
3. **Validator Diversification:** Reduces single-point-of-failure risk
4. **Liquidity Pool Limits:** Instant unstaking capped by available liquidity
5. **Testnet Deployment:** Thorough testing before mainnet

## Innovation Summary

| Feature | Traditional Staking | CasperFlow |
|---------|---------------------|------------|
| Liquidity | Locked | ✓ Liquid (stCSPR tradeable) |
| Reward Claiming | Manual | ✓ Auto-compound |
| Validator Selection | User chooses | ✓ Smart routing |
| Unstaking Time | 7-14 days | ✓ Instant option available |
| DeFi Integration | None | ✓ stCSPR usable everywhere |
| APY Optimization | Static | ✓ Dynamic (auto-compound boost) |

## Deployment

### Testnet Deployment
```bash
# Build contracts
cd contracts/stcspr-token && cargo build --release --target wasm32-unknown-unknown
cd ../staking-pool && cargo build --release --target wasm32-unknown-unknown

# Deploy using Casper CLI
casper-client put-deploy \
  --node-address http://testnet-node.casper.network:7777 \
  --chain-name casper-test \
  --payment-amount 100000000000 \
  --session-path target/wasm32-unknown-unknown/release/stcspr_token.wasm

# Deploy staking pool (pass token contract hash)
casper-client put-deploy \
  --node-address http://testnet-node.casper.network:7777 \
  --chain-name casper-test \
  --payment-amount 200000000000 \
  --session-path target/wasm32-unknown-unknown/release/staking_pool.wasm \
  --session-arg "token_contract:key='hash-...'"
```

### Frontend Deployment
```bash
cd frontend
npm run build
npm start  # Or deploy to Vercel/Netlify
```

## Future Enhancements

1. **Governance Token:** FLOW token for protocol governance
2. **Advanced Strategies:** ML-powered validator selection
3. **Cross-Chain:** Bridge stCSPR to Ethereum, Polygon
4. **Lending Integration:** Use stCSPR as collateral
5. **Insurance Module:** Slashing protection for users
6. **DAO Treasury:** Community-managed protocol funds

## Performance Metrics

- **Gas Efficiency:** Optimized contract code, minimal storage writes
- **Scalability:** Supports unlimited users
- **Decentralization:** Stake distributed across 40+ validators
- **Uptime:** 99.9% target (validator selection criteria)

## Conclusion

CasperFlow represents a significant advancement in liquid staking for Casper Network, combining proven patterns from Ethereum (Lido) with innovative features tailored to Casper's unique architecture. The protocol unlocks billions in staked value while maintaining security and decentralization.
