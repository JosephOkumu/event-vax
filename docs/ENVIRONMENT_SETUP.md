# Environment Configuration Guide

## Overview

EventVerse requires environment variables for three main components:
1. **Frontend** (React + Vite)
2. **Backend Server** (Node.js + Express)
3. **Smart Contracts** (Foundry)

## Quick Setup

### 1. Root Directory (.env)

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Frontend variables (VITE_ prefix required)
VITE_API_URL=http://localhost:8080
VITE_CHAIN_ID=43113
VITE_NETWORK_NAME=Avalanche Fuji Testnet
```

### 2. Server Directory (server/.env)

```bash
cd server
cp .env.example .env
```

**Required:** Get Pinata JWT token:
1. Sign up at https://pinata.cloud (free)
2. Go to API Keys section
3. Create new key
4. Copy the JWT token
5. Paste in `PINATA_SECRET_JWT`

### 3. Contracts Directory (contracts/.env)

```bash
cd contracts
cp .env.example .env
```

**Required for deployment:**
1. Get testnet AVAX: https://faucet.avax.network/
2. Add your wallet private key
3. Get Snowtrace API key: https://snowtrace.io/myapikey

## Detailed Configuration

### Frontend Environment Variables

Location: `/event-vax/.env`

```env
# API Configuration
VITE_API_URL=http://localhost:8080

# Blockchain Network
VITE_CHAIN_ID=43113
VITE_NETWORK_NAME=Avalanche Fuji Testnet

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
```

**Note:** Vite only exposes variables with `VITE_` prefix to the frontend.

### Backend Environment Variables

Location: `/event-vax/server/.env`

```env
# Server
PORT=8080

# Blockchain
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc

# IPFS (Pinata - Recommended)
PINATA_SECRET_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Contract Addresses (Already deployed)
EVENT_FACTORY=0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0
METADATA_REGISTRY=0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241
# ... (see .env.example for all addresses)
```

### Smart Contracts Environment Variables

Location: `/event-vax/contracts/.env`

```env
# Network
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Deployment Wallet
PRIVATE_KEY=your_private_key_without_0x_prefix

# Verification
SNOWTRACE_API_KEY=your_snowtrace_api_key
```

## Getting API Keys

### Pinata (IPFS Storage)

1. Visit: https://app.pinata.cloud/register
2. Sign up (free tier: 1GB storage)
3. Go to: API Keys → New Key
4. Copy the JWT token
5. Paste in `server/.env` as `PINATA_SECRET_JWT`

### Snowtrace (Contract Verification)

1. Visit: https://snowtrace.io/register
2. Create account
3. Go to: https://snowtrace.io/myapikey
4. Create API key
5. Paste in `contracts/.env` as `SNOWTRACE_API_KEY`

### Testnet AVAX (For Testing)

1. Visit: https://faucet.avax.network/
2. Select "Fuji (C-Chain)"
3. Enter your wallet address
4. Request tokens (0.5 AVAX per request)

## Security Best Practices

### ⚠️ NEVER Commit These Files:
- `.env`
- `server/.env`
- `contracts/.env`

### ✅ Safe to Commit:
- `.env.example`
- `server/.env.example`
- `contracts/.env.example`

### 🔒 Protect Your Keys:
- Never share private keys
- Never commit `.env` files
- Use different keys for testnet/mainnet
- Rotate keys regularly

## Verification Checklist

### Frontend
- [ ] `.env` file created
- [ ] `VITE_API_URL` points to backend
- [ ] `VITE_CHAIN_ID` is 43113 (Fuji)

### Backend
- [ ] `server/.env` file created
- [ ] `PINATA_SECRET_JWT` configured
- [ ] `PORT` is 8080
- [ ] All contract addresses present

### Contracts
- [ ] `contracts/.env` file created (only if deploying)
- [ ] `PRIVATE_KEY` added
- [ ] `SNOWTRACE_API_KEY` added
- [ ] Wallet has testnet AVAX

## Testing Configuration

### Test Backend Connection:
```bash
cd server
npm run dev
# Should see: 🚀 Server running on port 8080
```

### Test Frontend:
```bash
npm run dev
# Should see: Local: http://localhost:5173
```

### Test IPFS Upload:
```bash
curl -X POST http://localhost:8080/api/metadata/upload \
  -H "Content-Type: application/json" \
  -d '{"type":"POAP","metadata":{"name":"Test"}}'
```

## Troubleshooting

### "PINATA_SECRET_JWT not configured"
- Check `server/.env` exists
- Verify JWT token is correct
- Restart server after adding

### "No wallet detected"
- Install MetaMask extension
- Connect wallet to Fuji testnet
- Add Fuji network if not present

### "Insufficient balance"
- Get testnet AVAX from faucet
- Wait for transaction confirmation
- Check balance in MetaMask

## Production Deployment

For production, update:

1. **Frontend:**
```env
VITE_API_URL=https://api.eventverse.io
VITE_CHAIN_ID=43114  # Mainnet
```

2. **Backend:**
```env
AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
NODE_ENV=production
```

3. **Contracts:**
```env
MAINNET_RPC_URL=https://api.avax.network/ext/bc/C/rpc
# Use mainnet contract addresses
```

## Support

For issues:
1. Check `.env.example` files for correct format
2. Verify all required keys are present
3. Restart services after changes
4. Check console for specific error messages
