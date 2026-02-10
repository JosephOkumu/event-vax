# 🚀 Eventverse Deployment Information

## Network Details
- **Network:** Avalanche Fuji Testnet
- **Chain ID:** 43113
- **Deployment Date:** January 2025 (Updated)

## Deployed Contract Addresses

### Core Contracts

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| **EventFactory** | `0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0` | [View](https://testnet.snowtrace.io/address/0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0) |
| **TicketNFT Implementation** | `0x520B9d1C86d2dD58b5929AC159aF06508160aDec` | [View](https://testnet.snowtrace.io/address/0x520B9d1C86d2dD58b5929AC159aF06508160aDec) |
| **EventManager** | `0x5876444b87757199Cd08f44193Bf7741FDA01EAD` | [View](https://testnet.snowtrace.io/address/0x5876444b87757199Cd08f44193Bf7741FDA01EAD) |
| **Marketplace** | `0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51` | [View](https://testnet.snowtrace.io/address/0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51) |

### Additional Systems

| Contract | Address | Explorer Link |
|----------|---------|---------------|
| **QRVerificationSystem** | `0x89dABaf2dC7aF4C06AF993E083115952cCd67E86` | [View](https://testnet.snowtrace.io/address/0x89dABaf2dC7aF4C06AF993E083115952cCd67E86) |
| **POAP** | `0x323A6ddC3390192013bfe09Ea7d677c7469078c4` | [View](https://testnet.snowtrace.io/address/0x323A6ddC3390192013bfe09Ea7d677c7469078c4) |
| **EventBadge** | `0xCB3c41286536004dee308520B4D1F64de20157DB` | [View](https://testnet.snowtrace.io/address/0xCB3c41286536004dee308520B4D1F64de20157DB) |
| **MetadataRegistry** | `0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241` | [View](https://testnet.snowtrace.io/address/0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241) |

## Gas Costs

Total deployment cost: **0.000000000024289622 ETH** (~12.1M gas)

## Frontend Integration

Import contract addresses in your frontend:

```javascript
import { CONTRACTS, NETWORK } from './config/contracts';

// Use EventFactory as main entry point
const eventFactory = new ethers.Contract(
  CONTRACTS.EVENT_FACTORY,
  EventFactoryABI,
  signer
);
```

## Key Features

- ✅ All contracts verified on Snowtrace
- ✅ EIP-1167 minimal proxy pattern for gas efficiency
- ✅ Role-based access control
- ✅ Emergency pause functionality
- ✅ QR code verification system
- ✅ POAP and badge rewards

## Next Steps

1. Update frontend configuration with contract addresses
2. Test event creation flow
3. Verify QR code generation
4. Test marketplace functionality
5. Deploy frontend to production
