import { CartItem } from './supabase';
import {
  calculateAirFee, calculateSeaFee, isHeavyShipOnly, quantityDiscountRate,
  ImportShippingRates, ShippingDiscountSettings
} from './importShippingCalc';

// Shared import (admin-sourced, supplier 'jumia'/'shein') shipping
// calculation for the checkout total. Vendor products never touch this —
// they keep using the existing per-state delivery_settings flow in
// useCheckout.ts, completely untouched and unaffected by anything here.
//
// Each import line is priced on its own real weight/dimensions and the
// method the customer picked on the product page (air_express/air_normal/
// sea), or the flat heavy rate for ship_only bulky items. Two discounts can
// apply, and they stack multiplicatively:
//   1. Admin's global per-method % discount (Settings → any method)
//   2. Automatic quantity discount — air methods only, applied per cart
//      line based on THAT line's own quantity, discounting every unit after
//      the first (see quantityDiscountRate in importShippingCalc.ts)

export type ImportShippingMethod = 'air_express' | 'air_normal' | 'sea' | 'heavy';

export interface ImportShippingLine {
  cartItemIndex: number;
  productName: string;
  method: ImportShippingMethod;
  quantity: number;
  fullPriceUnitFee: number;   // before any discount
  lineTotal: number;          // after admin + quantity discounts
  discountAmount: number;     // fullPriceUnitFee*quantity - lineTotal
}

export interface ImportShippingBreakdown {
  hasImportItems: boolean;
  lines: ImportShippingLine[];
  total: number;
  totalDiscount: number;
}

export function calculateImportShipping(
  items: CartItem[],
  rates: ImportShippingRates,
  usdToNgn: number,
  discounts: ShippingDiscountSettings
): ImportShippingBreakdown {
  const lines: ImportShippingLine[] = [];

  items.forEach((item, cartItemIndex) => {
    if (!isImportProduct(item)) return;

    const heavy = isHeavyShipOnly(item.product);
    const method: ImportShippingMethod = heavy ? 'heavy' : (item.selectedShipping ?? 'sea');
    const quantity = item.quantity;

    const fullPriceUnitFee = heavy
      ? rates.heavy_flat_fee_ngn
      : method === 'sea'
        ? calculateSeaFee(item.product, rates)
        : calculateAirFee(item.product, rates, method, usdToNgn);

    const adminPct = discounts[method] ?? 0;
    const unitFeeAfterAdmin = fullPriceUnitFee * (1 - adminPct / 100);

    let lineTotal: number;
    if (method === 'air_express' || method === 'air_normal') {
      // First unit full price (after admin discount only); every unit after
      // that also gets the quantity-tier discount on top.
      const qtyRate = quantityDiscountRate(quantity);
      const extraUnits = Math.max(quantity - 1, 0);
      lineTotal = unitFeeAfterAdmin + extraUnits * unitFeeAfterAdmin * (1 - qtyRate);
    } else {
      lineTotal = unitFeeAfterAdmin * quantity;
    }

    lineTotal = Math.round(lineTotal);
    const fullLineTotal = fullPriceUnitFee * quantity;

    lines.push({
      cartItemIndex,
      productName: item.product.name,
      method,
      quantity,
      fullPriceUnitFee,
      lineTotal,
      discountAmount: Math.round(fullLineTotal - lineTotal),
    });
  });

  return {
    hasImportItems: lines.length > 0,
    lines,
    total: lines.reduce((sum, l) => sum + l.lineTotal, 0),
    totalDiscount: lines.reduce((sum, l) => sum + l.discountAmount, 0),
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
