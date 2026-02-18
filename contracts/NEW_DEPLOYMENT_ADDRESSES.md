# 🚀 New Deployment Addresses (Fuji Testnet)

## Deployment Date
**Date:** $(date)

## Contract Addresses

| Contract | Address |
|----------|---------|
| **TicketNFT Implementation** | `0x298d5a630E27Ca5A9Ea19100e1821EDCc941C77C` |
| **EventManager** | `0x4dED553549A2D25Ee6f16b93F2937f640B79B9dc` |
| **Marketplace** | `0x26278A733300f45c517Fac8c6Bab80de1F39b8b0` |
| **EventFactory** | `0x29fb81C7484540fFEB82a47592A3b3Fc420a4bE4` |
| **MetadataRegistry** | `0x7F3F53565021CE22899Edd489e9A1C16B952c0ba` |
| **QRVerificationSystem** | `0x3B0D12949501E1977Ad4fC65b322500798e87b4A` |
| **POAP** | `0x3A50393F1403299971a5ea5c82fFEe4187af1df2` |
| **EventBadge** | `0xa19AD3898551012e7375778f0F44dFF47418ba82` |

## ✅ What's Fixed

1. **QRVerificationSystem** now has `setMetadataRegistry()` function
2. **MetadataRegistry** is properly connected to QRVerificationSystem during deployment
3. All contracts verified on Snowtrace

## 📝 Next Steps

### 1. Update README.md
Replace the old contract addresses in the README with these new ones.

### 2. Update Frontend Configuration
Update the contract addresses in your frontend config files:
- `eventvax/src/config/contracts.js` (or similar)
- Any other files that reference contract addresses

### 3. Test the Integration
```bash
# Verify MetadataRegistry is connected
cast call 0x3B0D12949501E1977Ad4fC65b322500798e87b4A \
  "metadataRegistry()" \
  --rpc-url https://api.avax-test.network/ext/bc/C/rpc

# Expected output: 0x7F3F53565021CE22899Edd489e9A1C16B952c0ba
```

## 🔗 Explorer Links

- [TicketNFT](https://testnet.snowtrace.io/address/0x298d5a630E27Ca5A9Ea19100e1821EDCc941C77C)
- [EventManager](https://testnet.snowtrace.io/address/0x4dED553549A2D25Ee6f16b93F2937f640B79B9dc)
- [Marketplace](https://testnet.snowtrace.io/address/0x26278A733300f45c517Fac8c6Bab80de1F39b8b0)
- [EventFactory](https://testnet.snowtrace.io/address/0x29fb81C7484540fFEB82a47592A3b3Fc420a4bE4)
- [MetadataRegistry](https://testnet.snowtrace.io/address/0x7F3F53565021CE22899Edd489e9A1C16B952c0ba)
- [QRVerificationSystem](https://testnet.snowtrace.io/address/0x3B0D12949501E1977Ad4fC65b322500798e87b4A)
- [POAP](https://testnet.snowtrace.io/address/0x3A50393F1403299971a5ea5c82fFEe4187af1df2)
- [EventBadge](https://testnet.snowtrace.io/address/0xa19AD3898551012e7375778f0F44dFF47418ba82)

## 🔄 Old vs New Addresses

| Contract | Old Address | New Address |
|----------|-------------|-------------|
| EventFactory | `0x4FC9267E6Ef419be7700e3936Fc51D2835e257D0` | `0x29fb81C7484540fFEB82a47592A3b3Fc420a4bE4` |
| Marketplace | `0x072c6707E3fd1Bcc2f2177349402Ad5fdeB82F51` | `0x26278A733300f45c517Fac8c6Bab80de1F39b8b0` |
| EventManager | `0x5876444b87757199Cd08f44193Bf7741FDA01EAD` | `0x4dED553549A2D25Ee6f16b93F2937f640B79B9dc` |
| QRVerificationSystem | `0x89dABaf2dC7aF4C06AF993E083115952cCd67E86` | `0x3B0D12949501E1977Ad4fC65b322500798e87b4A` ⭐ |
| POAP | `0x323A6ddC3390192013bfe09Ea7d677c7469078c4` | `0x3A50393F1403299971a5ea5c82fFEe4187af1df2` |
| EventBadge | `0xCB3c41286536004dee308520B4D1F64de20157DB` | `0xa19AD3898551012e7375778f0F44dFF47418ba82` |
| TicketNFT Implementation | `0x520B9d1C86d2dD58b5929AC159aF06508160aDec` | `0x298d5a630E27Ca5A9Ea19100e1821EDCc941C77C` |
| MetadataRegistry | `0xCD2bA7f0941A0A79aC791Fb5D72E493557c37241` | `0x7F3F53565021CE22899Edd489e9A1C16B952c0ba` |

⭐ = Critical update - this contract now has the `setMetadataRegistry()` function
