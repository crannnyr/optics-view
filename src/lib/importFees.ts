import { CartItem } from './supabase';
import { calculateAirFee, calculateSeaFee, isHeavyShipOnly, ImportShippingRates } from './importShippingCalc';

// Shared import (admin-sourced, supplier 'jumia'/'shein') shipping
// calculation for the checkout total. Vendor products never touch this —
// they keep using the existing per-state delivery_settings flow in
// useCheckout.ts, completely untouched and unaffected by anything here.
//
// Each import line is priced on its own real weight/dimensions and the
// method the customer picked on the product page (air or sea), or the flat
// heavy rate for ship_only bulky items. There is no cart-wide discount —
// unlike the old flat-tier system, this pricing already reflects each
// item's actual footprint, so no additional adjustment is layered on top.

export type ImportShippingMethod = 'air_express' | 'air_normal' | 'sea' | 'heavy';

export interface ImportShippingLine {
  cartItemIndex: number;
  productName: string;
  method: ImportShippingMethod;
  quantity: number;
  unitFee: number;
  lineTotal: number;
}

export interface ImportShippingBreakdown {
  hasImportItems: boolean;
  lines: ImportShippingLine[];
  total: number;
}

export function calculateImportShipping(
  items: CartItem[],
  rates: ImportShippingRates,
  usdToNgn: number
): ImportShippingBreakdown {
  const lines: ImportShippingLine[] = [];

  items.forEach((item, cartItemIndex) => {
    if (!isImportProduct(item)) return;

    const heavy = isHeavyShipOnly(item.product);
    const method: ImportShippingMethod = heavy ? 'heavy' : (item.selectedShipping ?? 'sea');

    const unitFee = heavy
      ? rates.heavy_flat_fee_ngn
      : method === 'sea'
        ? calculateSeaFee(item.product, rates)
        : calculateAirFee(item.product, rates, method, usdToNgn);

    lines.push({
      cartItemIndex,
      productName: item.product.name,
      method,
      quantity: item.quantity,
      unitFee,
      lineTotal: unitFee * item.quantity,
    });
  });

  return {
    hasImportItems: lines.length > 0,
    lines,
    total: lines.reduce((sum, l) => sum + l.lineTotal, 0),
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
