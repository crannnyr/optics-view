import { Product } from './supabase';
import { useAppSetting } from './settingsCache';

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
  return useAppSetting('import_shipping_rates', FALLBACK_RATES);
}

function seaMinimumFor(price: number, tiers: SeaMinTier[]): number {
  for (const tier of tiers) {
    if (tier.max_price === null || price < tier.max_price) return tier.min_fee_ngn;
  }
  return tiers[tiers.length - 1]?.min_fee_ngn ?? 0;
}

// ── Admin-configurable max shipping fee (% of item price) ───────────────
// A hard ceiling on the raw air fee, before any discount is applied. 0
// means "no cap" for that method. Sea/heavy are never capped.
export interface ShippingFeeCaps {
  air_express: number;
  air_normal: number;
}

const FALLBACK_CAPS: ShippingFeeCaps = { air_express: 0, air_normal: 0 };

export function useShippingFeeCaps(): ShippingFeeCaps {
  return useAppSetting('shipping_fee_caps', FALLBACK_CAPS);
}

/**
 * Air fee: two tiers, both priced as $/kg (converted at the customer-facing
 * USD rate) plus a flat NGN/kg clearance fee on top.
 *   Express (2-3 days from ship time): $15/kg + ₦1,500/kg clearance
 *   Normal: $10/kg + ₦1,000/kg clearance
 * If a max-fee cap % is set for this tier, the raw computed fee is ceilinged
 * at (item price × cap%) before any discount runs on top.
 */
export function calculateAirFee(
  product: Product,
  rates: ImportShippingRates,
  tier: AirTier,
  usdToNgn: number,
  caps?: ShippingFeeCaps
): number {
  const kg = product.weight_kg ?? 0;
  const tierRate = rates[tier];
  const freightNgn = kg * tierRate.usd_per_kg * usdToNgn;
  const clearanceNgn = kg * tierRate.clearance_ngn_per_kg;
  let fee = freightNgn + clearanceNgn;

  const capPct = caps?.[tier] ?? 0;
  if (capPct > 0) {
    const maxFee = product.price * (capPct / 100);
    fee = Math.min(fee, maxFee);
  }

  return Math.round(fee);
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

// ── Admin-configurable global shipping discount ─────────────────────────
// A flat % (0-100) per method the admin can set from Settings, applied to
// every customer's shipping fee for that method. Stacks multiplicatively
// with the automatic quantity discount below (air methods only).
export interface ShippingDiscountSettings {
  air_express: number;
  air_normal: number;
  sea: number;
  heavy: number;
}

const FALLBACK_DISCOUNTS: ShippingDiscountSettings = { air_express: 0, air_normal: 0, sea: 0, heavy: 0 };

export function useShippingDiscountSettings(): ShippingDiscountSettings {
  return useAppSetting('shipping_discounts', FALLBACK_DISCOUNTS);
}

// ── Automatic quantity discount (air methods only) ──────────────────────
// The first unit in a cart line always pays full price. Every unit after
// the first gets a discount off ITS OWN unit fee, at a rate that steps up
// with the line's total quantity:
//   2-10 units  → 20% off each unit after the 1st
//   11-20 units → 30% off each unit after the 1st
//   21-49 units → 40% off each unit after the 1st
//   50+ units   → 50% off each unit after the 1st
// Sea and heavy shipping never get this — only air_express/air_normal.
export function quantityDiscountRate(quantity: number): number {
  if (quantity <= 1) return 0;
  if (quantity <= 10) return 0.20;
  if (quantity <= 20) return 0.30;
  if (quantity <= 49) return 0.40;
  return 0.50;
}
