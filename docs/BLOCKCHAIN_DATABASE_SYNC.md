# Blockchain-Database Synchronization

## Problem Statement

The EventVax platform had two disconnected check-in systems:

1. **QR Scanner Flow**: Updated blockchain ✅, but NOT database ❌
2. **Manual Check-in Button**: Updated database ✅, but NOT blockchain ❌

This caused inconsistent data where EventDashboard statistics (which query the database) didn't reflect actual blockchain check-ins.

## Solution Architecture

### Unified Check-in Flow

Both check-in methods now follow this pattern:

```
1. Perform blockchain check-in (source of truth)
2. Wait for transaction confirmation
3. Sync check-in to database via API
4. Update UI state
```

## Implementation Details

### 1. Backend Sync Endpoint

**File**: `server/routes/verification.js`

```javascript
POST /api/verification/sync-checkin
```

**Purpose**: Sync blockchain check-in to database

**Request Body**:
```json
{
  "eventId": 1,
  "attendee": "0x123...",
  "txHash": "0xabc..."
}
```

**Database Update**:
- Sets `verified = 1` (checked in)
- Stores transaction hash for audit trail
- Matches by `event_id` and `wallet_address`

### 2. QR Scanner Check-in

**File**: `src/pages/QRScannerCheckin.jsx`

**Flow**:
1. Scan QR code
2. Validate signature and event match
3. Call `verifyAndCheckIn()` on QRVerificationSystem contract
4. Wait for transaction receipt
5. **NEW**: Call sync endpoint to update database
6. Display success with POAP award notification

**Code Addition**:
```javascript
const receipt = await tx.wait();

// Sync blockchain check-in to database
await fetch(`${API_BASE_URL}/api/verification/sync-checkin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: qrData.eventId,
    attendee: qrData.attendee,
    txHash: receipt.hash
  })
});
```

### 3. Manual Check-in Button

**File**: `src/pages/EventDashboard.jsx`

**Flow**:
1. Click "Check In" button on guest row
2. Connect wallet and get signer
3. Fetch blockchain event ID from database
4. Call `batchCheckIn()` on QRVerificationSystem contract
5. Wait for transaction receipt
6. **NEW**: Call sync endpoint to update database
7. Update local state to reflect check-in

**Code Changes**:
```javascript
// Batch check-in via blockchain
const tx = await contract.batchCheckIn(
  blockchainEventId,
  [guest.fullWallet],
  [tierId]
);
const receipt = await tx.wait();

// Update database
await fetch(`${API_BASE_URL}/api/verification/sync-checkin`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: blockchainEventId,
    attendee: guest.fullWallet,
    txHash: receipt.hash
  })
});
```

## Benefits

### 1. Single Source of Truth
- Blockchain is the authoritative source
- Database mirrors blockchain state
- No data inconsistencies

### 2. Accurate Dashboard Statistics
- Total tickets sold
- Checked-in count
- Attendance rate
- All metrics reflect actual blockchain state

### 3. Audit Trail
- Transaction hashes stored in database
- Can verify any check-in on-chain
- Immutable proof of attendance

### 4. POAP Integration
- POAPs awarded automatically during blockchain check-in
- No separate relayer needed for QR scanner flow
- Manual check-in also triggers POAP via contract

## Data Flow Diagram

```
┌─────────────────┐
│  QR Scanner     │
│  or Manual      │
│  Check-in       │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ QRVerificationSystem    │
│ Contract                │
│ - verifyAndCheckIn()    │
│ - batchCheckIn()        │
│ - Awards POAP           │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Transaction Receipt     │
│ (txHash)                │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Sync API Endpoint       │
│ /api/verification/      │
│ sync-checkin            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Database Update         │
│ - verified = 1          │
│ - transaction_hash      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ EventDashboard          │
│ Shows accurate stats    │
└─────────────────────────┘
```

## Testing Checklist

- [ ] QR scanner check-in updates database
- [ ] Manual check-in button performs blockchain transaction
- [ ] Dashboard statistics reflect blockchain state
- [ ] Transaction hashes stored correctly
- [ ] POAPs awarded in both flows
- [ ] Error handling for sync failures
- [ ] Rate limiting works correctly
- [ ] Duplicate check-in prevention

## Error Handling

### Sync Failure Scenarios

1. **Network Error**: Blockchain succeeds, database sync fails
   - User is checked in on-chain (source of truth)
   - Database can be synced later via admin tool
   - Transaction hash available for manual verification

2. **Database Error**: Blockchain succeeds, database unavailable
   - Same as above
   - Logged for admin review

3. **Blockchain Error**: Transaction reverts
   - No database update occurs
   - User sees error message
   - Can retry check-in

## Future Enhancements

1. **Blockchain Event Listener**: Automatically sync check-ins by listening to CheckInCompleted events
2. **Reconciliation Job**: Periodic job to sync any missed check-ins
3. **Admin Dashboard**: View and manually sync discrepancies
4. **Webhook Notifications**: Alert organizers of check-ins in real-time

## Migration Notes

### Existing Data
- Old check-ins in database without blockchain transactions remain valid
- New check-ins will have transaction hashes
- Consider running reconciliation to mark old data

### Deployment Steps
1. Deploy updated backend with sync endpoint
2. Deploy updated frontend with sync calls
3. Test both check-in flows
4. Monitor logs for sync errors
5. Run reconciliation if needed

## Contract Requirements

The QRVerificationSystem contract must have:
- `verifyAndCheckIn()` - For QR scanner flow
- `batchCheckIn()` - For manual check-in flow
- `VERIFIER_ROLE` - Granted to organizer wallets
- POAP integration enabled

## Configuration

### Environment Variables
```bash
# Frontend
VITE_API_URL=http://localhost:8080

# Backend
PORT=8080
AVALANCHE_RPC=https://api.avax-test.network/ext/bc/C/rpc
```

### Contract Addresses
See `src/config/contracts.js` for deployed contract addresses.

## Conclusion

This implementation ensures that blockchain and database remain synchronized, providing accurate statistics and a reliable audit trail for all check-ins. Both QR scanner and manual check-in flows now follow the same pattern: blockchain first, then database sync.
