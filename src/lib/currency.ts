import { useState, useEffect } from 'react';
import { supabase } from './supabase';

interface CurrencyRates {
  usd_to_ngn: number;
  cny_to_ngn: number;
}

const FALLBACK_RATES: CurrencyRates = { usd_to_ngn: 1320, cny_to_ngn: 198 };

// Admin-editable reference rates stored in app_settings, used only for the
// informational "$X USD / ¥Y CNY" line on import product pages — never used
// to calculate anything actually charged. Falls back to a reasonable
// hardcoded rate if the settings row is missing so the UI never breaks.
export function useCurrencyRates(): CurrencyRates {
  const [rates, setRates] = useState<CurrencyRates>(FALLBACK_RATES);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'currency_rates')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setRates(data.value as CurrencyRates);
      });
    return () => { cancelled = true; };
  }, []);

  return rates;
}

export function formatUsd(ngnAmount: number, rates: CurrencyRates): string {
  return `$${(ngnAmount / rates.usd_to_ngn).toFixed(2)}`;
}

export function formatCny(ngnAmount: number, rates: CurrencyRates): string {
  return `¥${(ngnAmount / rates.cny_to_ngn).toFixed(2)}`;
}
