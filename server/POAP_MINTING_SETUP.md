# POAP Minting Setup Guide

## Overview
This guide will help you set up automatic POAP minting for event attendees.

## Prerequisites
- A wallet with AVAX on Fuji testnet (for gas fees)
- Access to the POAP contract admin wallet

## Step 1: Create Relayer Wallet

### Option A: Use Existing Wallet
If you have a wallet you want to use:
```bash
# Add to server/.env
RELAYER_PRIVATE_KEY=your_private_key_here
```

### Option B: Create New Wallet
```bash
# Run this in server/ directory
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

Copy the private key and add to `server/.env`:
```
RELAYER_PRIVATE_KEY=0x...your_private_key...
```

## Step 2: Fund the Relayer Wallet

The relayer needs AVAX to pay for gas fees when minting POAPs.

1. Get the relayer address from server logs (it will show when server starts)
2. Send test AVAX from Fuji faucet: https://faucet.avax.network/
3. Recommended: 1-2 AVAX for testing

## Step 3: Grant VERIFIER_ROLE

The relayer needs permission to mint POAPs on the contract.

### Using Foundry (Recommended)

```bash
cd contracts

# Set environment variables
export RELAYER_ADDRESS=<address_from_step_1>
export ADMIN_PRIVATE_KEY=<your_admin_private_key>

# Grant role
cast send $POAP \
  "grantRole(bytes32,address)" \
  $(cast keccak "VERIFIER") \
  $RELAYER_ADDRESS \
  --rpc-url $FUJI_RPC_URL \
  --private-key $ADMIN_PRIVATE_KEY
```

### Using Remix or Etherscan

1. Go to: https://testnet.snowtrace.io/address/0xF149868fab5D3886e33a9096ae8d08C19A5bcC40#writeContract
2. Connect wallet (must be contract admin)
3. Call `grantRole`:
   - `role`: `0x...` (keccak256 of "VERIFIER")
   - `account`: Your relayer address

## Step 4: Verify Setup

Restart your server:
```bash
cd server
npm run dev
```

Look for these logs:
```
✅ POAP Relayer wallet initialized: 0x...
🚀 POAP Relayer started - checking every 30 seconds
```

If you see warnings:
- `⚠️ RELAYER_PRIVATE_KEY not set` → Add private key to .env
- `⚠️ Relayer does not have VERIFIER_ROLE` → Complete Step 3

## Step 5: Test POAP Minting

1. Create an event with POAP configured
2. Purchase a ticket
3. Check in the attendee from Event Dashboard
4. Watch server logs for:
   ```
   📋 Processing 1 pending POAP requests...
   🔄 Minting POAP for 0x1234...5678
   ⏳ Waiting for confirmation: 0xabc...
   ✅ POAP minted: Event 1, User 0x1234...5678
   ```

## Troubleshooting

### "POAP minting disabled"
- Add `RELAYER_PRIVATE_KEY` to `server/.env`

### "does not have VERIFIER_ROLE"
- Complete Step 3 to grant permissions

### "insufficient funds for gas"
- Fund relayer wallet with AVAX (Step 2)

### "execution reverted: AlreadyClaimed"
- POAP already minted for this user (this is normal)

### Check POAP Status
Query the database:
```bash
cd server
sqlite3 data/events.db "SELECT * FROM poap_requests ORDER BY created_at DESC LIMIT 10;"
```

Status values:
- `pending` - Waiting to be minted
- `processing` - Transaction sent, waiting for confirmation
- `issued` - Successfully minted ✅
- `failed` - Failed after 3 retries ❌

## Environment Variables Summary

Add these to `server/.env`:
```env
# Required for POAP minting
RELAYER_PRIVATE_KEY=0x...your_private_key...

# Already configured
POAP=0xF149868fab5D3886e33a9096ae8d08C19A5bcC40
```

## Security Notes

⚠️ **IMPORTANT**:
- Never commit `.env` file to git
- Keep private keys secure
- Use a dedicated wallet for the relayer
- Only fund with necessary AVAX for gas fees
- Regularly monitor relayer wallet balance

## Support

If you encounter issues:
1. Check server logs for error messages
2. Verify all environment variables are set
3. Confirm relayer has VERIFIER_ROLE
4. Ensure relayer wallet has AVAX balance
