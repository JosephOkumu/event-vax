# Resale Marketplace Fix Summary

## Problem Identified

The error `missing revert data (action="estimateGas")` was caused by:

1. **Wrong Token ID Usage**: Frontend was using `tokenId` instead of `tierId` for ERC1155 tokens
2. **Missing Ownership Verification**: No check if user actually owns the ticket before attempting to list
3. **ERC1155 vs ERC721 Confusion**: The system uses ERC1155 (semi-fungible) where `tierId` (0, 1, 2) IS the token ID

## Changes Made

### 1. Frontend (`src/pages/QuantamTicketResale.tsx`)

**Interface Update:**
```typescript
interface Ticket {
  tierId: string  // Changed from tokenId
  quantity?: number  // Added for ERC1155 balance
  // ... other fields
}
```

**Ownership Verification:**
- Now fetches on-chain balance using `balanceOf(address, tierId)` before displaying tickets
- Only shows tickets the user actually owns
- Verifies ownership again before listing

**Listing Function:**
- Uses `ticket.tierId` instead of `ticket.tokenId`
- Checks balance before attempting to list
- Better error handling with specific error messages

### 2. Backend (`server/routes/tickets.js`)

**API Response:**
- Ensures `tier_id` field is included in response
- Uses case-insensitive wallet address comparison

## How ERC1155 Works in EventVax

```
Event Created → TicketNFT Contract Deployed
                ↓
Tiers Created:  tierId 0 = Regular
                tierId 1 = VIP  
                tierId 2 = VVIP
                ↓
User Buys → Mints tokens with tierId
            (Multiple users can own same tierId)
                ↓
Resale → Lists using tierId (not unique token ID)
```

## Important Notes

### Anti-Scalping Features in Marketplace:
1. **1-Day Lock Period**: Tickets can be listed immediately but cannot be PURCHASED until 1 day after listing
2. **Price Cap**: Maximum 120% of original price
3. **Resale Limit**: Maximum 3 resales per ticket
4. **Royalties**: 1.5% to organizer, 2.5% platform fee

### Testing the Fix:

1. **Connect Wallet**: Ensure you're on Fuji testnet
2. **Check Tickets**: Only tickets you own on-chain will appear
3. **List Ticket**: Click list - should succeed if you own the ticket
4. **Buy Ticket**: Must wait 1 day after listing due to lock period

## Verification Steps

To verify a ticket can be listed:

```javascript
// Check ownership
const balance = await ticketContract.balanceOf(userAddress, tierId)
console.log('Balance:', balance.toString())

// Check approval
const isApproved = await ticketContract.isApprovedForAll(userAddress, marketplaceAddress)
console.log('Approved:', isApproved)

// Check original price (for price cap)
const originalPrice = await marketplace.originalPrices(ticketContract, tierId)
console.log('Original Price:', ethers.formatEther(originalPrice))
```

## Next Steps

If you still encounter issues:

1. **Check Console**: Look for specific error messages
2. **Verify Contract Address**: Ensure ticket has valid `contract_address`
3. **Check Tier ID**: Ensure `tier_id` is 0, 1, or 2
4. **Test on Snowtrace**: Verify the ticket contract exists and you own tokens

## Contract Addresses (Fuji Testnet)

- Marketplace: `0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51`
- EventFactory: `0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0`

Each event has its own TicketNFT contract deployed via the factory.
