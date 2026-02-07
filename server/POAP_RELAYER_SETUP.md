# POAP Relayer Setup

## Overview
Backend service that automatically mints POAPs using the event organizer's wallet.

## Setup Steps

### 1. Run Database Migration
```bash
cd server
node migrate-poap-system.js
```

### 2. How It Works

1. **User requests POAP** via "Request POAP" button in ticket view
2. **Backend creates request** in `poap_requests` table with status `pending`
3. **Relayer processes** pending requests every 30 seconds
4. **Fetches organizer wallet** from events table (creator_address)
5. **Checks onchain** if POAP already claimed (prevents duplicates)
6. **Mints POAP** using event organizer's wallet
7. **Updates status** to `issued` with transaction hash

## Status Flow
- `not_requested` → User hasn't requested yet
- `pending` → Request queued for processing
- `processing` → Transaction submitted
- `issued` → POAP minted successfully
- `failed` → Failed after 3 retries

## API Endpoints

### Request POAP
```
POST /api/poap/request
Body: { eventId, walletAddress }
```

### Check Status
```
GET /api/poap/status/:eventId/:walletAddress
```

## Security
- Uses event organizer's wallet (creator_address from events table)
- Organizer must have VERIFIER_ROLE on POAP contract
- Attendees cannot self-mint
- Idempotent: checks `claimed()` before minting
- Rate limited: 2s between mints
- Retry logic: 3 attempts before marking failed
