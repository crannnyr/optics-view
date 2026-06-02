import { useState, useEffect } from 'react';
import { supabase, Product } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
}

// ── Cache helpers ─────────────────────────────────────────────────────────────
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) { sessionStorage.removeItem(key); return null; }
    // Never serve empty arrays from cache — treat as miss
    if (Array.isArray(data) && data.length === 0) { sessionStorage.removeItem(key); return null; }
    return data as T;
  } catch { return null; }
}

function setCache(key: string, data: unknown) {
  // Don't cache empty arrays — a failed/empty fetch should never poison the cache
  if (Array.isArray(data) && data.length === 0) return;
  try { sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() })); } catch { /* storage full */ }
}

export function useHome({ user }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ slug: string; name: string; image: string | null }[]>([]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);

  const [orderSuccess, setOrderSuccess] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [store.id]);

  useEffect(() => {
    if (user?.email) {
      supabase
        .from('retailer_registrations')
        .select('id')
        .eq('email', user.email)
        .limit(1)
        .maybeSingle()
        .then(({ data }) => setHasApplied(!!data));
    } else {
      setHasApplied(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  }, [user, pendingCheckout]);

  // Single source of truth for filtering
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    const cacheKey = `products_${store.id ?? 'main'}`;

    // Paint from cache immediately
    const cached = getCached<Product[]>(cacheKey);
    if (cached) setProducts(cached);

    try {
      const { data: baseProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // On fetch failure, keep whatever was already in state (cache hit or empty)
      if (error) { console.error('Error loading products:', error); return; }
      if (!baseProducts || baseProducts.length === 0) return;

      let finalProducts: Product[] = baseProducts;

      if (store.isRetailer && store.id) {
        const { data: reg } = await supabase
          .from('retailer_registrations')
          .select('selected_categories')
          .eq('store_slug', store.slug)
          .maybeSingle();

        const selectedCats: string[] = reg?.selected_categories ?? [];
        const categoryFiltered = selectedCats.length > 0
          ? baseProducts.filter(p => selectedCats.includes(p.category))
          : baseProducts;

        const { data: customPrices } = await supabase
          .from('retailer_products')
          .select('product_id, custom_price')
          .eq('retailer_id', store.id);

        finalProducts = categoryFiltered.map((p) => {
          const custom = customPrices?.find((cp) => cp.product_id === p.id);
          return custom ? { ...p, price: custom.custom_price } : p;
        });
      }

      setProducts(finalProducts);
      setCache(cacheKey, finalProducts);
    } catch (err) {
      // Network/auth error — silently keep cached data, don't wipe the grid
      console.error('Products fetch failed, keeping cached data:', err);
    }
  };

  const loadCategories = async () => {
    const cacheKey = `categories_${store.id ?? 'main'}`;

    const cached = getCached<{ slug: string; name: string; image: string | null }[]>(cacheKey);
    if (cached) setCategories(cached);

    try {
      let query = supabase.from('categories').select('slug, name').order('sort_order');

      if (store.isRetailer && store.slug) {
        const { data: reg } = await supabase
          .from('retailer_registrations')
          .select('selected_categories')
          .eq('store_slug', store.slug)
          .maybeSingle();

        const selectedCats: string[] = reg?.selected_categories ?? [];
        if (selectedCats.length > 0) query = query.in('slug', selectedCats);
      }

      const { data: cats } = await query;
      if (!cats || cats.length === 0) return;

      const withImages = await Promise.all(
        cats.map(async (cat) => {
          const { data: product } = await supabase
            .from('products')
            .select('images, image_url')
            .eq('category', cat.slug)
            .eq('is_active', true)
            .limit(1)
            .single();
          const image = product?.images?.[0] || product?.image_url || null;
          return { ...cat, image };
        })
      );

      setCategories(withImages);
      setCache(cacheKey, withImages);
    } catch (err) {
      console.error('Categories fetch failed, keeping cached data:', err);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      setPendingCheckout(true);
      setIsAuthOpen(true);
    } else {
      setIsCheckoutOpen(true);
    }
  };

  return {
    store,
    products,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    categories,
    hasApplied,
    isCartOpen, setIsCartOpen,
    isCheckoutOpen, setIsCheckoutOpen,
    isAuthOpen, setIsAuthOpen,
    isUserMenuOpen, setIsUserMenuOpen,
    isRetailerModalOpen, setIsRetailerModalOpen,
    orderSuccess, setOrderSuccess,
    handleSignOut,
    handleCheckout,
  };
}
