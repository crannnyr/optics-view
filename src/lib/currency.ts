import { useAppSetting } from './settingsCache';

interface CurrencyRates {
  usd_to_ngn: number;
  cny_to_ngn: number;
}

const FALLBACK_RATES: CurrencyRates = { usd_to_ngn: 1320, cny_to_ngn: 198 };

// Admin-editable reference rates stored in app_settings, used only for the
// informational "$X USD / ¥Y CNY" line on import product pages — never used
// to calculate anything actually charged. Cached across the session (see
// settingsCache.ts) so every product page visit doesn't re-fetch this.
export function useCurrencyRates(): CurrencyRates {
  return useAppSetting('currency_rates', FALLBACK_RATES);
}

export function formatUsd(ngnAmount: number, rates: CurrencyRates): string {
  return `$${(ngnAmount / rates.usd_to_ngn).toFixed(2)}`;
}

export function formatCny(ngnAmount: number, rates: CurrencyRates): string {
  return `¥${(ngnAmount / rates.cny_to_ngn).toFixed(2)}`;
}
