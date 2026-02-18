#!/bin/bash

# 🔧 Quick Fix Deployment Script
# Fixes: MetadataRegistry → POAP Contract Disconnect

set -e

echo "🚀 Deploying MetadataRegistry Fix..."
echo ""

# Load environment
source .env

# Check required variables
if [ -z "$PRIVATE_KEY" ] || [ -z "$AVALANCHE_FUJI_RPC_URL" ]; then
    echo "❌ Error: PRIVATE_KEY and FUJI_RPC_URL must be set in .env"
    exit 1
fi

# Contract addresses
QR_VERIFICATION="0x3B0D12949501E1977Ad4fC65b322500798e87b4A"
METADATA_REGISTRY="0x7F3F53565021CE22899Edd489e9A1C16B952c0ba"

echo "📋 Configuration:"
echo "   QRVerificationSystem: $QR_VERIFICATION"
echo "   MetadataRegistry: $METADATA_REGISTRY"
echo ""

# Step 1: Recompile contracts
echo "🔨 Step 1: Recompiling contracts..."
forge build
echo "✅ Compilation complete"
echo ""

# Step 2: Run connection script
echo "🔗 Step 2: Connecting MetadataRegistry to QRVerificationSystem..."
forge script script/SetMetadataRegistry.s.sol \
    --rpc-url $AVALANCHE_FUJI_RPC_URL \
    --broadcast \
    --verify \
    -vvvv

echo ""
echo "✅ Fix deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Verify connection: Call metadataRegistry() on QRVerificationSystem"
echo "   2. Test POAP minting with IPFS metadata"
echo "   3. Check POAP displays correctly in Core wallet"
echo ""
echo "📚 Documentation: See METADATA_REGISTRY_FIX.md for details"
