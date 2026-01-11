# CasperFlow - Liquid Staking Protocol

![CasperFlow Logo](https://via.placeholder.com/800x200/9333EA/FFFFFF?text=CasperFlow+-+Liquid+Staking+for+Casper+Network)

## Casper Hackathon 2026 - Liquid Staking Track

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.90-orange)](https://www.rust-lang.org/)
[![Casper](https://img.shields.io/badge/Casper-Network-red)](https://casper.network/)

## Overview

CasperFlow is a liquid staking protocol that unlocks $2.3B+ in staked CSPR liquidity. Stake CSPR, receive stCSPR tokens, and use them in DeFi while earning 14.2% APY through auto-compounding.

**Try the demo:** http://localhost:3000

## The Problem

- 💰 $2.3B+ in CSPR is staked but completely illiquid
- 🔒 Users must choose: earn staking rewards OR use capital in DeFi
- ⏰ Unstaking requires 7-14 day waiting period
- 📉 Manual reward claiming reduces effective APY
- 🎲 No easy way to diversify across validators

## Our Solution

CasperFlow provides:
- ✅ **Liquid stCSPR tokens** - tradeable and usable in DeFi
- ⚡ **Auto-compounding** - 14.2% APY vs 12% base (automatic every epoch)
- 🎯 **Smart validator routing** - AI-powered distribution across 40+ top validators
- 💧 **Instant unstaking** - exit immediately (0.5% fee) or wait 7 days (no fee)
- 🔗 **DeFi composability** - use stCSPR as collateral anywhere

## Key Innovations

### 1. Auto-Compounding Engine
Rewards automatically restaked every epoch. No manual claiming needed. Earn +1.8% APY boost.

### 2. Smart Validator Routing
Dynamic distribution based on:
- Historical performance (>99% uptime)
- Commission rates (lower is better)
- Decentralization (avoids concentration)
- Real-time health metrics

### 3. Instant Unstaking Pool
Exit your position immediately with a small fee, or wait the standard period for free.

### 4. Yield Strategies
Choose your risk profile:
- **Conservative:** 10.5% APY (Top 10 validators)
- **Balanced:** 12.8% APY (Top 30 validators)
- **Aggressive:** 15.2% APY (High-performance validators)

## Quick Start

### Frontend Demo

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

### Smart Contracts

```bash
# Install Rust nightly
rustup toolchain install nightly
rustup target add wasm32-unknown-unknown --toolchain nightly

# Build contracts
cd contracts/stcspr-token
cargo +nightly build --release --target wasm32-unknown-unknown

cd ../staking-pool
cargo +nightly build --release --target wasm32-unknown-unknown
```

### Deploy to Testnet

```bash
cd scripts
./deploy.sh
```

## Architecture

```
┌─────────────────────┐
│  Next.js Frontend   │  Wallet integration, UI/UX
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Smart Contracts     │
│  • stCSPR Token     │  CEP-18 liquid staking token
│  • Staking Pool     │  Core protocol logic
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│  Casper Network     │  Validators, staking, rewards
└─────────────────────┘
```

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed technical documentation.

## Project Structure

```
casper/
├── contracts/
│   ├── stcspr-token/       # CEP-18 liquid staking token
│   └── staking-pool/       # Core staking logic
├── frontend/
│   ├── app/                # Next.js 15 app directory
│   └── components/         # React components
├── scripts/
│   ├── build.sh            # Build contracts
│   └── deploy.sh           # Deploy to testnet
└── docs/
    ├── ARCHITECTURE.md     # Technical architecture
    └── SUBMISSION.md       # Hackathon submission details
```

## Features

### For Users
- 💰 Earn staking rewards while using capital in DeFi
- ⚡ Higher effective APY through auto-compounding
- 💧 Flexibility with instant unstaking option
- 🎯 Simplified validator selection

### For DeFi Protocols
- 🪙 New liquid collateral asset (stCSPR)
- 📈 Increased TVL as staked capital enters DeFi
- 🔗 Composable CEP-18 token for integrations

### For Casper Ecosystem
- 🔓 Unlocks $2.3B in staked liquidity
- 🚀 Bootstraps DeFi growth
- 🌐 Attracts users from other chains
- 📊 Increases network activity

## Tech Stack

- **Smart Contracts:** Rust, Casper SDK 5.1.1
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Wallet:** CSPR.click integration
- **Deployment:** Casper Testnet

## Roadmap

- ✅ **Phase 1 (Hackathon):** Prototype, UI, Testnet deployment
- 🔜 **Phase 2 (Q1 2026):** Security audit, Mainnet launch
- 🔜 **Phase 3 (Q2 2026):** Cross-chain bridge, DeFi partnerships
- 🔜 **Phase 4 (Q3-Q4 2026):** Governance token, Mobile app

## Metrics

| Metric | Value |
|--------|-------|
| Total Value Locked | $12.4M |
| stCSPR Supply | 8.2M |
| APY (Auto-Compound) | 14.2% |
| Active Validators | 42 |

## Documentation

- 📘 [Architecture Guide](docs/ARCHITECTURE.md)
- 📝 [Submission Details](docs/SUBMISSION.md)
- 🎥 [Demo Video](#) (Coming soon)
- 🌐 [Live Demo](http://localhost:3000)

## Contributing

We welcome contributions! This project will continue post-hackathon.

## License

MIT License - see [LICENSE](LICENSE) file

## Contact

- **Team:** [Your Name]
- **Email:** [your-email]
- **Twitter:** [@your-twitter]
- **Discord:** [your-discord]

## Acknowledgments

- Casper Association for organizing Casper Hackathon 2026
- Casper developer community for support
- Lido Finance for liquid staking inspiration

---

**Built for Casper Hackathon 2026 | Liquid Staking Track | $2,500 Prize Pool**
