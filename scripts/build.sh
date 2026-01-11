#!/bin/bash

set -e

echo "Building CasperFlow smart contracts..."

# Build stCSPR token contract
echo "Building stCSPR token contract..."
cd contracts/stcspr-token
cargo build --release --target wasm32-unknown-unknown
cd ../..

# Build staking pool contract
echo "Building staking pool contract..."
cd contracts/staking-pool
cargo build --release --target wasm32-unknown-unknown
cd ../..

echo "Build complete!"
echo "Contracts built:"
echo "  - stcspr-token: contracts/stcspr-token/target/wasm32-unknown-unknown/release/stcspr_token.wasm"
echo "  - staking-pool: contracts/staking-pool/target/wasm32-unknown-unknown/release/staking_pool.wasm"
