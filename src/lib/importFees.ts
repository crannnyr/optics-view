import { CartItem, ImportFeeTier } from './supabase';

// Shared shipping+clearance calculation for imported (admin-sourced,
// supplier 'jumia'/'shein') products. Vendor products never touch this —
// they keep using the existing per-state delivery_settings flow in
// useCheckout.ts untouched.
//
// Rule agreed with Jenny: within the import portion of the cart, the
// single MOST EXPENSIVE unit (by its own tier's combined fee) is charged
// in full; every other imported unit — regardless of which product it is —
// is charged at (100 - discount%) of ITS OWN tier's combined fee. This
// mirrors real batching economics (packing more items barely adds handling
// cost per extra unit) while staying simple: each item is always discounted
// against its own fee, never against someone else's.

export interface ImportFeeLine {
  cartItemIndex: number;
  productName: string;
  unitIndex: number; // which physical unit within that line (0-based)
  tierName: string;
  fullFee: number;
  chargedFee: number;
  isFullPriceUnit: boolean;
}

export interface ImportFeeBreakdown {
  hasImportItems: boolean;
  lines: ImportFeeLine[];
  total: number;
  fullPriceUnitLine: ImportFeeLine | null;
}

// Expands cart items into individual physical units (quantity flattened),
// since the "first unit full price, rest discounted" rule operates per
// physical unit, not per distinct product line.
function expandImportUnits(items: CartItem[], tiersById: Map<string, ImportFeeTier>) {
  const units: { cartItemIndex: number; productName: string; unitIndex: number; tier: ImportFeeTier }[] = [];

  items.forEach((item, cartItemIndex) => {
    const tierId = item.product.import_fee_tier_id;
    if (!tierId) return; // not an import product — handled by normal delivery flow
    const tier = tiersById.get(tierId);
    if (!tier) return; // tier not loaded/deleted — fee is skipped rather than guessed

    for (let unitIndex = 0; unitIndex < item.quantity; unitIndex++) {
      units.push({ cartItemIndex, productName: item.product.name, unitIndex, tier });
    }
  });

  return units;
}

export function calculateImportFees(items: CartItem[], tiers: ImportFeeTier[]): ImportFeeBreakdown {
  const tiersById = new Map(tiers.map(t => [t.id, t]));
  const units = expandImportUnits(items, tiersById);

  if (units.length === 0) {
    return { hasImportItems: false, lines: [], total: 0, fullPriceUnitLine: null };
  }

  const withFullFee = units.map(u => ({ ...u, fullFee: u.tier.shipping_fee + u.tier.clearance_fee }));

  // The single most expensive unit across the whole import portion of the
  // cart is the one charged in full — every other unit gets its own
  // tier's discount applied, so a cart of 3 Standard + 1 Oversized item
  // charges the Oversized item in full and discounts the 3 Standard units.
  let fullPriceIdx = 0;
  withFullFee.forEach((u, i) => {
    if (u.fullFee > withFullFee[fullPriceIdx].fullFee) fullPriceIdx = i;
  });

  const lines: ImportFeeLine[] = withFullFee.map((u, i) => {
    const isFullPriceUnit = i === fullPriceIdx;
    const discountPercent = u.tier.additional_item_discount_percent;
    const chargedFee = isFullPriceUnit
      ? u.fullFee
      : Math.round(u.fullFee * (1 - discountPercent / 100));

    return {
      cartItemIndex: u.cartItemIndex,
      productName: u.productName,
      unitIndex: u.unitIndex,
      tierName: u.tier.name,
      fullFee: u.fullFee,
      chargedFee,
      isFullPriceUnit,
    };
  });

  const total = lines.reduce((sum, l) => sum + l.chargedFee, 0);

  return {
    hasImportItems: true,
    lines,
    total,
    fullPriceUnitLine: lines[fullPriceIdx] ?? null,
  };
}

// A cart line counts as "import" purely by having a fee tier attached —
// this stays in sync automatically with whatever the admin has tagged,
// no separate boolean to fall out of date.
export function isImportProduct(item: CartItem): boolean {
  return !!item.product.import_fee_tier_id;
}

export function cartHasImportItems(items: CartItem[]): boolean {
  return items.some(isImportProduct);
}

export function cartHasNonImportItems(items: CartItem[]): boolean {
  return items.some(item => !isImportProduct(item));
}
