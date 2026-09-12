import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Product } from './supabase';

interface SeaMinTier {
  max_price: number | null;
  min_fee_ngn: number;
}

export interface ImportShippingRates {
  air_ngn_per_gram: number;
  sea_usd_per_cbm: number;
  sea_min_tiers: SeaMinTier[];
  heavy_flat_fee_ngn: number;
}

const FALLBACK_RATES: ImportShippingRates = {
  air_ngn_per_gram: 80,
  sea_usd_per_cbm: 550,
  sea_min_tiers: [
    { max_price: 2000, min_fee_ngn: 1500 },
    { max_price: 10000, min_fee_ngn: 2500 },
    { max_price: null, min_fee_ngn: 3500 },
  ],
  heavy_flat_fee_ngn: 30000,
};

export function useImportShippingRates(): ImportShippingRates {
  const [rates, setRates] = useState<ImportShippingRates>(FALLBACK_RATES);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'import_shipping_rates')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setRates(data.value as ImportShippingRates);
      });
    return () => { cancelled = true; };
  }, []);

  return rates;
}

function seaMinimumFor(price: number, tiers: SeaMinTier[]): number {
  for (const tier of tiers) {
    if (tier.max_price === null || price < tier.max_price) return tier.min_fee_ngn;
  }
  return tiers[tiers.length - 1]?.min_fee_ngn ?? 0;
}

/**
 * Air fee: flat NGN per gram of the product's weight. Simple, no currency
 * conversion, no minimum — matches the flat retail rate already decided.
 */
export function calculateAirFee(product: Product, rates: ImportShippingRates): number {
  const grams = (product.weight_kg ?? 0) * 1000;
  return Math.round(grams * rates.air_ngn_per_gram);
}

/**
 * Sea fee: item's box volume (CBM) × $/CBM rate, converted at the
 * customer-facing USD rate, floored at a tiered minimum so small/cheap
 * items aren't charged a flat fee sized for mid-value items.
 */
export function calculateSeaFee(product: Product, rates: ImportShippingRates, usdToNgn: number): number {
  const cbm = ((product.length_cm ?? 0) * (product.width_cm ?? 0) * (product.height_cm ?? 0)) / 1_000_000;
  const freightUsd = cbm * rates.sea_usd_per_cbm;
  const freightNgn = freightUsd * usdToNgn;
  const minimum = seaMinimumFor(product.price, rates.sea_min_tiers);
  return Math.round(Math.max(freightNgn, minimum));
}

/**
 * True for products admin has flagged as ship_only (bulky/heavy items,
 * washing machines etc.) — these skip the fly/sea customer choice entirely
 * and use a flat subsidized rate instead of either formula.
 */
export function isHeavyShipOnly(product: Product): boolean {
  return product.import_type === 'ship';
}
