// Currency utility for admin panel
// Conversion rates from USD
export const EXCHANGE_RATES = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149.5,
  AUD: 1.53,
  CAD: 1.36,
  CHF: 0.87,
  CNY: 7.24,
  INR: 83.1,
  NGN: 1500,
  KES: 158,
  GHS: 14.5,
  EGP: 48,
  ZAR: 18.4,
  BRL: 4.97,
  MXN: 17.05,
};

export const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  CNY: "¥",
  INR: "₹",
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  EGP: "E£",
  ZAR: "R",
  BRL: "R$",
  MXN: "$",
};

/**
 * Format price with currency symbol
 * @param {number} price - Price value
 * @param {string} currency - Currency code (e.g., 'USD', 'NGN')
 * @returns {string} - Formatted price string
 */
export const formatPriceWithCurrency = (price, currency = "USD") => {
  const numPrice = parseFloat(price) || 0;
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  // No decimals for currencies that don't use them
  if (["JPY", "VND", "KRW"].includes(currency)) {
    return `${symbol}${Math.round(numPrice).toLocaleString()}`;
  }

  // Two decimals for standard currencies
  return `${symbol}${numPrice.toFixed(2)}`;
};

/**
 * Convert price from one currency to another
 * @param {number} price - Price value
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {number} - Converted price
 */
export const convertPrice = (
  price,
  fromCurrency = "USD",
  toCurrency = "USD",
) => {
  if (fromCurrency === toCurrency) return price;

  const numPrice = parseFloat(price) || 0;
  const fromRate = EXCHANGE_RATES[fromCurrency] || 1;
  const toRate = EXCHANGE_RATES[toCurrency] || 1;

  return (numPrice / fromRate) * toRate;
};
