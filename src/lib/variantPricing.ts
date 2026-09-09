import { Product } from './supabase';

/**
 * Computes the effective unit price for a product with a specific variant
 * selection — base price (or wholesale price, if applicable) plus whatever
 * delta each selected color/type/size option carries. A selected option
 * with no matching key in the delta map contributes 0 (most options don't
 * change the price; only some, like a bigger storage tier or a premium
 * finish, do).
 */
export function getVariantAdjustedPrice(
  product: Product,
  selectedColor?: string,
  selectedType?: string,
  selectedSize?: string,
  useWholesale = false
): number {
  const base = useWholesale && product.wholesale_price ? product.wholesale_price : product.price;

  const colorDelta = selectedColor ? (product.color_option_deltas?.[selectedColor] ?? 0) : 0;
  const typeDelta = selectedType ? (product.type_option_deltas?.[selectedType] ?? 0) : 0;
  const sizeDelta = selectedSize ? (product.size_option_deltas?.[selectedSize] ?? 0) : 0;

  return base + colorDelta + typeDelta + sizeDelta;
}

/** Delta for a single option, for inline "+₦X" display next to a variant button. */
export function getOptionDelta(
  product: Product,
  kind: 'color' | 'type' | 'size',
  optionLabel: string
): number {
  const map = kind === 'color' ? product.color_option_deltas
    : kind === 'type' ? product.type_option_deltas
    : product.size_option_deltas;
  return map?.[optionLabel] ?? 0;
}
