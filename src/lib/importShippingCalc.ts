import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Product } from './supabase';

interface SeaMinTier {
  max_price: number | null;
  min_fee_ngn: number;
}

interface AirTierRate {
  usd_per_kg: number;
  clearance_ngn_per_kg: number;
}

export type AirTier = 'air_express' | 'air_normal';

export interface ImportShippingRates {
  air_express: AirTierRate;
  air_normal: AirTierRate;
  sea_ngn_per_cbm: number;
  sea_min_tiers: SeaMinTier[];
  heavy_flat_fee_ngn: number;
}

const FALLBACK_RATES: ImportShippingRates = {
  air_express: { usd_per_kg: 15, clearance_ngn_per_kg: 1500 },
  air_normal: { usd_per_kg: 10, clearance_ngn_per_kg: 1000 },
  sea_ngn_per_cbm: 450000,
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
 * Air fee: two tiers, both priced as $/kg (converted at the customer-facing
 * USD rate) plus a flat NGN/kg clearance fee on top.
 *   Express (2-3 days from ship time): $15/kg + ₦1,500/kg clearance
 *   Normal: $10/kg + ₦1,000/kg clearance
 */
export function calculateAirFee(
  product: Product,
  rates: ImportShippingRates,
  tier: AirTier,
  usdToNgn: number
): number {
  const kg = product.weight_kg ?? 0;
  const tierRate = rates[tier];
  const freightNgn = kg * tierRate.usd_per_kg * usdToNgn;
  const clearanceNgn = kg * tierRate.clearance_ngn_per_kg;
  return Math.round(freightNgn + clearanceNgn);
}

/**
 * Sea fee: item's box volume (CBM) × flat NGN/CBM rate (already bundles
 * freight + clearance + handling + margin — no currency conversion needed),
 * floored at a tiered minimum so small/cheap items aren't charged a flat fee
 * sized for mid-value items.
 */
export function calculateSeaFee(product: Product, rates: ImportShippingRates): number {
  const cbm = ((product.length_cm ?? 0) * (product.width_cm ?? 0) * (product.height_cm ?? 0)) / 1_000_000;
  const freightNgn = cbm * rates.sea_ngn_per_cbm;
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
