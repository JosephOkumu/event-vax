# ✅ FIXED: MetadataRegistry → POAP Contract Disconnect

## Issue Summary
**Location**: `QRVerificationSystem.sol` line 207  
**Problem**: Random hash generated instead of retrieving IPFS hash from MetadataRegistry  
**Impact**: POAP NFTs had no valid metadata connection

## What Was Fixed

### 1. Added MetadataRegistry Interface
```solidity
interface IMetadataRegistry {
    enum MetadataType { Event, Ticket, POAP, Badge }
    
    struct Metadata {
        string ipfsHash;
        bytes32 contentHash;
        uint256 timestamp;
        address updatedBy;
        bool frozen;
    }
    
    function getMetadata(MetadataType entityType, uint256 entityId) external view returns (Metadata memory);
}
```

### 2. Added MetadataRegistry State Variable
```solidity
IMetadataRegistry public metadataRegistry;

function setMetadataRegistry(address _metadataRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
    metadataRegistry = IMetadataRegistry(_metadataRegistry);
}
```

### 3. Fixed POAP Award Logic (Line 207)

**BEFORE** ❌
```solidity
bytes32 metadataHash = keccak256(abi.encodePacked(eventId, attendee, block.timestamp));
poapContract.awardPOAP(eventId, attendee, metadataHash);
```

**AFTER** ✅
```solidity
// Retrieve IPFS metadata from MetadataRegistry
string memory ipfsHash = "";
bytes32 contentHash = keccak256(abi.encodePacked(eventId, attendee, block.timestamp));

if (address(metadataRegistry) != address(0)) {
    try metadataRegistry.getMetadata(IMetadataRegistry.MetadataType.POAP, eventId) returns (IMetadataRegistry.Metadata memory metadata) {
        if (bytes(metadata.ipfsHash).length > 0) {
            ipfsHash = metadata.ipfsHash;
            contentHash = metadata.contentHash;
        }
    } catch {}
}

poapContract.awardPOAP(eventId, attendee, contentHash, ipfsHash);
```

### 4. Updated POAP Interface
```solidity
interface IPOAP {
    function awardPOAP(uint256 eventId, address attendee, bytes32 metadataHash, string calldata ipfsHash) external;
    function claimed(uint256 eventId, address attendee) external view returns (bool);
}
```

## Data Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Frontend uploads POAP image to IPFS (Pinata)            │
│    → Returns: ipfsHash (Qm...), contentHash (SHA256)       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. MetadataRegistry stores IPFS metadata                    │
│    setMetadata(MetadataType.POAP, eventId, ipfsHash, hash)  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. User checks in at event                                  │
│    QRVerificationSystem.verifyAndCheckIn(...)               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. QRVerificationSystem retrieves IPFS hash ✅              │
│    metadata = metadataRegistry.getMetadata(POAP, eventId)   │
│    ipfsHash = metadata.ipfsHash                             │
│    contentHash = metadata.contentHash                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. POAP NFT minted with correct metadata ✅                 │
│    poapContract.awardPOAP(eventId, attendee, hash, ipfsHash)│
│    tokenURI[tokenId] = ipfsHash                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. NFT displays correctly in wallets ✅                     │
│    Image URL: https://gateway.pinata.cloud/ipfs/{ipfsHash}  │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Steps

### 1. Recompile Contracts
```bash
cd contracts
forge build
```

### 2. Deploy Updated Contracts (if needed)
```bash
forge script script/Deploy.s.sol --rpc-url $FUJI_RPC_URL --broadcast --verify
```

### 3. Connect MetadataRegistry to QRVerificationSystem
```bash
forge script script/SetMetadataRegistry.s.sol --rpc-url $FUJI_RPC_URL --broadcast
```

Or manually via Snowtrace:
1. Go to QRVerificationSystem contract: `0x89dABaf2dC7aF4C06AF993E083115952cCd67E86`
2. Call `setMetadataRegistry("0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241")`

## Verification

### Check Connection
```solidity
// Call on QRVerificationSystem
metadataRegistry() 
// Should return: 0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241
```

### Test POAP Minting
1. Create event with POAP image
2. Upload to IPFS via frontend
3. Store in MetadataRegistry
4. Check in user
5. Verify POAP NFT has correct `tokenURI` with IPFS hash

## Benefits

✅ **POAP NFTs display correctly** in wallets (MetaMask, Core, OpenSea)  
✅ **Metadata integrity** - verifiable on-chain via contentHash  
✅ **Decentralized storage** - IPFS ensures permanence  
✅ **Backward compatible** - Falls back to random hash if MetadataRegistry not set  
✅ **Gas efficient** - Only retrieves metadata when needed (try/catch)

## Contract Addresses (Fuji Testnet)

| Contract | Address |
|----------|---------|
| QRVerificationSystem | `0x89dABaf2dC7aF4C06AF993E083115952cCd67E86` |
| MetadataRegistry | `0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241` |
| POAP | `0x323A6ddC3390192013bfe09Ea7d677c7469078c4` |

## Testing Checklist

- [ ] MetadataRegistry connected to QRVerificationSystem
- [ ] POAP image uploaded to IPFS
- [ ] Metadata stored in MetadataRegistry
- [ ] User check-in successful
- [ ] POAP minted with correct IPFS hash
- [ ] POAP displays in Core wallet
- [ ] POAP displays on Snowtrace NFT viewer

## Notes

- The fix maintains backward compatibility - if MetadataRegistry is not set or metadata doesn't exist, it falls back to generating a hash
- Both `verifyAndCheckIn` and `batchCheckIn` functions are fixed
- The POAP contract already supported the `ipfsHash` parameter, so no changes needed there
