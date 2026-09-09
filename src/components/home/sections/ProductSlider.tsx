import { useEffect, useState } from 'react';
import { supabase, Product } from '../../../lib/supabase';
import CompactProductCard from '../CompactProductCard';

export type SliderMode = 'trending' | 'under_3000' | 'under_5000' | 'under_10000';

interface ProductSliderProps {
  mode: SliderMode;
  storeId?: string | null;
  isRetailer: boolean;
  onViewDetails: (product: Product) => void;
  /** When set to a real category (not 'all'), the slider's own query is
   * scoped to that category too — "Trending now" on the Footwear tab shows
   * trending footwear, not site-wide trending. */
  category?: string;
}

const MODE_CONFIG: Record<SliderMode, { title: string; maxPrice: number | null }> = {
  trending:     { title: 'Trending now',    maxPrice: null },
  under_3000:   { title: 'Under ₦3,000',    maxPrice: 3000 },
  under_5000:   { title: 'Under ₦5,000',    maxPrice: 5000 },
  under_10000:  { title: 'Under ₦10,000',   maxPrice: 10000 },
};

// Self-contained horizontal slider. Each instance fetches its own small set
// of products independently of the main paginated grid — trending sorts by
// units_sold, price-tier sliders sort by newest within the price ceiling.
// Renders nothing while loading or if a tier turns up empty, so an empty
// "Under ₦3,000" section never leaves a blank gap in the page.
export default function ProductSlider({ mode, isRetailer, onViewDetails, category }: ProductSliderProps) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const config = MODE_CONFIG[mode];
  const categoryFilter = category && category !== 'all' ? category : null;

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      let query = supabase
        .from('products_feed')
        .select('*')
        .eq('is_active', true)
        .limit(12);

      if (categoryFilter) query = query.eq('category', categoryFilter);

      if (config.maxPrice !== null) {
        query = query.lte('price', config.maxPrice).order('created_at', { ascending: false });
      } else {
        query = query.order('units_sold', { ascending: false });
      }

      const { data } = await query;
      if (!cancelled) setProducts(data ?? []);
    };

    load();
    return () => { cancelled = true; };
  }, [mode, config.maxPrice, categoryFilter]);

  // Price-tier sliders don't make sense on a retailer's own storefront
  // (custom pricing per retailer isn't reflected in this quick fetch), so
  // only "Trending now" shows there.
  if (isRetailer && mode !== 'trending') return null;

  if (!products || products.length === 0) return null;

  const title = categoryFilter && mode === 'trending' ? `Trending in this category` : config.title;

  return (
    <section className="py-6">
      <h2 className="text-base font-light text-gray-800 px-4 mb-3">{title}</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4" style={{ scrollbarWidth: 'none' }}>
        {products.map(product => (
          <CompactProductCard key={product.id} product={product} onViewDetails={onViewDetails} />
        ))}
      </div>
    </section>
  );
}
