// Static, approximate exchange rates to USD — for DISPLAY ESTIMATES ONLY.
// Never use these for actual charge amounts; those always come from Duffel
// in the offer's real currency. Refresh manually if rates drift noticeably.
export const USD_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  IDR: 15800,
  THB: 36,
  SGD: 1.35,
  MYR: 4.7,
  JPY: 156,
  KRW: 1380,
  AUD: 1.52,
  CAD: 1.37,
  VND: 25400,
  PHP: 58,
  INR: 84,
  AED: 3.67,
  CNY: 7.25,
  HKD: 7.82,
  TWD: 32,
  NZD: 1.65,
  CHF: 0.9,
};

// Convert an amount from one currency to another via USD as a pivot.
// Returns null (not a guess) when either currency isn't in the table.
export function convertApprox(amount: number, from: string, to: string): number | null {
  const fromRate = USD_RATES[from?.toUpperCase()];
  const toRate = USD_RATES[to?.toUpperCase()];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

// Curated currencies relevant to this Thailand/SEA-focused site's routes.
export const DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'SGD', 'THB', 'IDR'] as const;
