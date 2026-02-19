# Currency Localization Feature

This document explains how to implement and use the location-based currency system in the frontend application.

## Overview

The currency localization system automatically detects the user's location based on their IP address and displays prices in the appropriate currency. Users can also manually change their currency preference from the header dropdown.

## Architecture

### Files Created

1. **`utils/currency.js`** - Core currency utilities
   - Currency mapping by country code
   - Live exchange rates
   - Conversion functions

2. **`context/CurrencyContext.js`** - React Context for global currency state
   - Auto-detects user location via IP geolocation
   - Stores user's currency preference in localStorage
   - Provides `useCurrency()` hook

3. **`components/CurrencySelector.js`** - UI component
   - Dropdown to select different currencies
   - Shows current currency symbol and code
   - Persists selection in localStorage

4. **`hooks/usePriceFormatter.js`** - Custom hook
   - Formats prices based on selected currency
   - Handles currency conversion
   - Returns formatted price string with symbol

5. **`components/Price.js`** - React component
   - Simple wrapper for price display
   - Can be used throughout the app

## How It Works

### 1. Automatic Location Detection

When the app loads, `CurrencyContext` automatically:

- Fetches user's country code from IP using `ipapi.co` (free, no API key required)
- Maps country code to corresponding currency
- Checks if user has manually selected a currency in localStorage
- If not, saves the auto-detected currency

```javascript
// Example: User from India automatically gets INR (₹)
// User from Germany automatically gets EUR (€)
// User from Japan automatically gets JPY (¥)
```

### 2. Using the Currency System

#### Option A: Using the `usePriceFormatter` Hook

```javascript
import usePriceFormatter from "../hooks/usePriceFormatter";

const ProductCard = ({ product }) => {
  const formattedPrice = usePriceFormatter(product.price);

  return (
    <div>
      <h3>{product.name}</h3>
      <p>Price: {formattedPrice}</p> {/* Shows: $99.99 or €92.08 or ₹8309.19 */}
    </div>
  );
};
```

#### Option B: Using the `Price` Component

```javascript
import Price from "../components/Price";

const ProductCard = ({ product }) => {
  return (
    <div>
      <h3>{product.name}</h3>
      <p>
        Price: <Price price={product.price} />
      </p>
    </div>
  );
};
```

#### Option C: Using the `useCurrency` Hook Directly

```javascript
import { useCurrency } from "../context/CurrencyContext";
import { convertCurrency } from "../utils/currency";

const OrderSummary = ({ orderData }) => {
  const { currency } = useCurrency();

  // Get current currency info
  console.log(currency.code); // "EUR"
  console.log(currency.symbol); // "€"
  console.log(currency.name); // "Euro"

  // Convert prices manually if needed
  const convertedPrice = convertCurrency(100, "USD", currency.code);
  return (
    <div>
      Total: {currency.symbol}
      {convertedPrice.toFixed(2)}
    </div>
  );
};
```

## Supported Currencies

The system supports **30+ currencies** across:

- **Americas**: USD (US), CAD (Canada), MXN (Mexico), BRL (Brazil)
- **Europe**: EUR (EU countries), GBP (UK), CHF (Switzerland), SEK (Sweden), NOK (Norway), DKK (Denmark)
- **Asia**: INR (India), JPY (Japan), CNY (China), SGD (Singapore), HKD (Hong Kong), MYR (Malaysia), THB (Thailand), PHP (Philippines), VND (Vietnam), KRW (South Korea)
- **Oceania**: AUD (Australia), NZD (New Zealand)
- **Africa**: ZAR (South Africa)
- **Middle East**: AED (UAE), SAR (Saudi Arabia)

## Exchange Rates

Exchange rates are stored in `utils/currency.js` as a simple object relative to USD (base rate = 1):

```javascript
const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  INR: 83.1,
  // ... etc
};
```

### Updating Exchange Rates

For **production**, replace static rates with live API:

```javascript
// In CurrencyContext.js or a separate service
const response = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
const rates = await response.json();
```

## Implementation Steps for Existing Components

### Step 1: Update Product Components

**Before:**

```javascript
<span>${product.price.toFixed(2)}</span>
```

**After:**

```javascript
import Price from "../components/Price";

<Price price={product.price} />;
```

### Step 2: Update Order/Cart Components

**Before:**

```javascript
<div>Total: ${cartTotal.toFixed(2)}</div>
```

**After:**

```javascript
import usePriceFormatter from "../hooks/usePriceFormatter";

const CartSummary = ({ cartTotal }) => {
  const formattedTotal = usePriceFormatter(cartTotal);
  return <div>Total: {formattedTotal}</div>;
};
```

### Step 3: Update Admin Dashboard (if needed)

The admin panel has its own styling, so update it separately or reuse the `formatPrice` utility:

```javascript
import { formatPrice } from "../utils/currency";

// In admin dashboard
const displayPrice = formatPrice(productPrice, "USD"); // Or user's country code
```

## Key Features

✅ **Automatic Detection** - Detects user location from IP  
✅ **Manual Override** - Users can select any currency  
✅ **Persistent Preference** - Saves selection in localStorage  
✅ **30+ Currencies** - Covers most countries  
✅ **Proper Formatting** - Handles non-decimal currencies (JPY, VND, KRW)  
✅ **Easy Integration** - Simple hooks and components  
✅ **Performance** - Minimal re-renders, efficient conversion

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires localStorage support
- Uses fetch API for IP geolocation

## Known Limitations

1. **Exchange Rates**: Static rates in code (update periodically or use live API)
2. **IP Geolocation**: Relies on IP-based detection (may be inaccurate for VPN users)
3. **Backend Prices**: Currently assumes all backend prices are in USD
4. **Admin Panel**: Not yet integrated (separate React app)
5. **Payment Processing**: May need to pass currency info to payment gateway

## Future Enhancements

1. Integrate live exchange rate API (XE API, Open Exchange Rates, etc.)
2. Add currency-aware payment processing
3. Store currency preference in user profile (backend)
4. Add currency formatting in admin panel
5. support for cryptocurrency (BTC, ETH, etc.)
6. Real-time rate updates

## Testing

```javascript
// Test in browser console
import { useCurrency } from "./context/CurrencyContext";

const { currency } = useCurrency();
console.log(currency); // { code: "EUR", symbol: "€", name: "Euro", countryCode: "DE" }
```

## Troubleshooting

### Issue: Currency not changing

**Solution**: Check localStorage for `userCurrency` key, clear it to reset.

### Issue: Wrong currency detected

**Solution**: Use CurrencySelector dropdown to manually select correct currency.

### Issue: Prices showing as "NaN"

**Solution**: Ensure all prices from API are valid numbers, not strings.

## Support

For integration help, see example implementations in:

- `ProductCard.js`
- `OrderDetailScreen.js`
- `CartScreen.js`
