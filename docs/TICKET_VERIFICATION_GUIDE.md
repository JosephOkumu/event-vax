# EventVax Ticket Verification - User Guide

## Overview

EventVax uses blockchain-based QR codes for secure ticket verification at event entrances. Each ticket generates a unique, scannable QR code that verifies ownership on the Avalanche blockchain.

## For Attendees (Ticket Holders)

### Step 1: Purchase & Mint Ticket
1. Browse events at `/event`
2. Select an event and click "Mint Ticket"
3. Connect your Core Wallet or compatible Web3 wallet
4. Choose ticket tier (Regular/VIP/VVIP)
5. Confirm transaction on Avalanche Fuji Testnet
6. Ticket minted as NFT to your wallet

### Step 2: View Your Tickets
1. Navigate to `/ticket` page
2. Connect your wallet
3. See all your purchased tickets

Each ticket displays:
- Event details (name, date, venue)
- Ticket type and seat number
- QR code for entry
- Transaction hash on blockchain

### Step 3: Event Entry
1. Open your ticket on `/ticket` page
2. Show the QR code to event staff
3. Staff scans the QR code
4. Blockchain verification happens automatically
5. Upon successful check-in, you receive a POAP (Proof of Attendance Protocol) NFT

## For Event Organizers (Verifiers)

### Step 1: Access Verification System
1. Navigate to `/qrcode` page
2. Connect wallet with verifier permissions
3. Ensure you're on Avalanche Fuji Testnet

### Step 2: Verify Tickets
1. Scan attendee's QR code (or manually enter ticket data)
2. System displays ticket information:
   - Event name
   - Ticket ID
   - Owner address
   - Transaction hash
3. Click "Verify on Avalanche"

Smart contract checks:
- ✅ Ticket exists on blockchain
- ✅ Ticket not already used
- ✅ Owner address matches
- ✅ Event is active

### Step 3: Check-In Process
- **Success**: Ticket marked as checked-in, POAP auto-minted
- **Failure**: Error message displays reason (invalid ticket, already used, etc.)

## QR Code Structure

Each QR code contains:
```
/qrcode?contract=0x...&token=14&owner=0x5f5E...&event=1
```

Parameters:
- `contract`: Ticket NFT contract address
- `token`: Unique token ID
- `owner`: Wallet address of ticket holder
- `event`: Event ID

## Security Features

### Blockchain Verification
- All tickets stored as NFTs on Avalanche
- Immutable ownership records
- Transparent transaction history

### Anti-Fraud Protection
- Each ticket can only be used once
- QR codes linked to specific wallet addresses
- Real-time blockchain validation
- Prevents screenshot sharing and duplication

### POAP Distribution
- Automatic POAP minting upon check-in
- Proof of attendance stored on-chain
- Collectible NFT for attendees

## Troubleshooting

### "Ticket Not Found"
- Ensure wallet is connected
- Verify you're on correct network (Avalanche Fuji)
- Check transaction was confirmed on blockchain

### "Already Checked In"
- Ticket has been used for entry
- Each ticket valid for single entry only
- Contact event organizer if error

### "Wrong Network"
- Switch to Avalanche Fuji Testnet
- Click "Switch to Avalanche Fuji" button
- Confirm network change in wallet

### QR Code Not Displaying
- Refresh the page
- Ensure stable internet connection
- Check browser console for errors

## Technical Details

- **Blockchain**: Avalanche C-Chain (Fuji Testnet)
- **Network ID**: 43113
- **Transaction Speed**: ~2 seconds
- **Gas Fees**: Minimal (< $0.01 per transaction)

### Smart Contracts
- **EventFactory**: `0x53687CccF774FDa60fE2bd4720237fbb8e4fd02c`
- **QR Verification**: `0xd04E0B0959Ceb4f5Be7e29fc0d072368C1EC0e06`
- **Explorer**: [Snowtrace Testnet](https://testnet.snowtrace.io/)

## Best Practices

### For Attendees
- Keep wallet secure and backed up
- Don't share QR code screenshots
- Arrive early for smooth check-in
- Ensure phone is charged

### For Organizers
- Test verification system before event
- Have backup internet connection
- Train staff on verification process
- Monitor check-in dashboard

## Support

For technical issues or questions:
- Check documentation at `/docs`
- Contact support: [support@eventvax.com](mailto:support@eventvax.com)
- Join Discord community
- View transaction on Snowtrace explorer

---

**Note**: Currently, the QR code URL points to `/verify` which doesn't exist. Update line 154 in `Ticket.jsx` to use `/qrcode` instead for proper verification flow.