# Currency Conversion Implementation Guide

## Already Updated ✅
1. **Profile.jsx** - Currency selector
2. **CreateEvent.jsx** - Price input with currency conversion
3. **Home.jsx** - Event price display

## Pages That Need Updates

### 1. MintNFT.jsx
**Lines to update:**
- Line 137: `{ trait_type: "Price", value: \`${selected.price} AVAX\` }`
- Display prices in selected currency

**Add at top:**
```javascript
import { useCurrency } from '../utils/currency.jsx';
```

**In component:**
```javascript
const { format, toAVAX } = useCurrency();
```

**Update price display:**
```javascript
{ trait_type: "Price", value: format(selected.price) }
```

**Update transaction:**
```javascript
const price = toAVAX(eventData.ticketPrices[selectedTicketType]);
const totalCost = ethers.parseEther((parseFloat(price) * ticketQuantity).toString());
```

### 2. Myevent.jsx
Check if it displays prices and update similarly.

### 3. Ticket.jsx / Ticketsell.jsx
Check if they display prices and update.

### 4. QuantumTicketResale.tsx
Check for price displays.

## Quick Implementation Pattern

For any page displaying prices:

```javascript
// 1. Import
import { useCurrency } from '../utils/currency.jsx';

// 2. Use hook
const { format, convert, toAVAX, currency } = useCurrency();

// 3. Display prices
<span>{format(avaxAmount)}</span>

// 4. For transactions (convert back to AVAX)
const avaxAmount = toAVAX(userInput);
const wei = ethers.parseEther(avaxAmount);
```

## Testing
1. Go to Profile
2. Change currency to KSH or USDT
3. Navigate to each page
4. Verify prices display in selected currency
5. Test transactions still work (they use AVAX internally)
