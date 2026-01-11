#!/bin/bash

set -e

echo "🚀 CasperFlow Testnet Deployment Script"
echo "========================================="

# Configuration
TESTNET_NODE="http://testnet-node.casper.network:7777"
CHAIN_NAME="casper-test"
CONTRACT_WASM="wasm/StakingPool.wasm"
PAYMENT_AMOUNT="200000000000" # 200 CSPR

# Check if contract exists
if [ ! -f "$CONTRACT_WASM" ]; then
    echo "❌ Contract WASM not found: $CONTRACT_WASM"
    echo "Run 'cargo odra build' first"
    exit 1
fi

echo "✅ Contract found: $CONTRACT_WASM"

# Check for keys
if [ ! -f "keys/secret_key.pem" ]; then
    echo "📝 Generating new key pair..."
    mkdir -p keys
    casper-client keygen keys
    echo "✅ Keys generated in keys/"
    echo ""
    echo "🔑 Public Key:"
    cat keys/public_key_hex
    echo ""
    echo "⚠️  IMPORTANT: Fund this account with testnet CSPR from faucet!"
    echo "Faucet: https://testnet.cspr.live/tools/faucet"
    echo ""
    read -p "Press Enter after funding your account..."
fi

echo "📤 Deploying StakingPool contract to Casper Testnet..."
echo "Node: $TESTNET_NODE"
echo "Chain: $CHAIN_NAME"
echo ""

# Deploy contract
DEPLOY_HASH=$(casper-client put-deploy \
    --node-address "$TESTNET_NODE" \
    --chain-name "$CHAIN_NAME" \
    --secret-key keys/secret_key.pem \
    --payment-amount "$PAYMENT_AMOUNT" \
    --session-path "$CONTRACT_WASM" \
    | jq -r '.result.deploy_hash')

echo "✅ Deploy submitted!"
echo "Deploy Hash: $DEPLOY_HASH"
echo ""
echo "🔍 Check status at: https://testnet.cspr.live/deploy/$DEPLOY_HASH"
echo ""
echo "⏳ Waiting for deployment to finalize (this may take 1-2 minutes)..."

# Wait for deployment
sleep 90

# Get contract hash
echo "📋 Fetching contract information..."
CONTRACT_HASH=$(casper-client get-deploy \
    --node-address "$TESTNET_NODE" \
    "$DEPLOY_HASH" \
    | jq -r '.result.execution_results[0].result.Success.effect.transforms[] | select(.key | startswith("hash-")) | .key')

if [ -n "$CONTRACT_HASH" ]; then
    echo "✅ Contract deployed successfully!"
    echo ""
    echo "📝 Contract Details:"
    echo "  - Deploy Hash: $DEPLOY_HASH"
    echo "  - Contract Hash: $CONTRACT_HASH"
    echo ""
    echo "  Save these values! Add them to your frontend integration."
    echo ""
    echo "$CONTRACT_HASH" > deployed_contract_hash.txt
    echo "Saved to: deployed_contract_hash.txt"
else
    echo "⚠️  Could not retrieve contract hash. Check deployment status manually."
    echo "URL: https://testnet.cspr.live/deploy/$DEPLOY_HASH"
fi

echo ""
echo "🎉 Deployment complete!"
