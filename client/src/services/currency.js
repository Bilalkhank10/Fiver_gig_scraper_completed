export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', rate: 1, label: 'USD ($)' },
  PKR: { code: 'PKR', symbol: '₨', rate: 290.75, label: 'PKR (₨)' },
  INR: { code: 'INR', symbol: '₹', rate: 86.5, label: 'INR (₹)' },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, label: 'EUR (€)' },
  GBP: { code: 'GBP', symbol: '£', rate: 0.78, label: 'GBP (£)' }
};

export function formatPrice(amountInUsd, currencyCode = 'USD', customRate = null) {
  if (amountInUsd == null || isNaN(amountInUsd)) return '--';
  const conf = CURRENCIES[currencyCode] || CURRENCIES.USD;
  const rate = customRate || conf.rate;
  const converted = Math.round(Number(amountInUsd) * rate);
  return `${conf.symbol}${converted.toLocaleString()}`;
}
