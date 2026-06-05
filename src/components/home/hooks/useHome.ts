import { useState, useEffect } from 'react';
import { supabase, Product } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
}

export function useHome({ user }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts]                 = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories]             = useState<{ slug: string; name: string; image: string | null }[]>([]);
  const [productsLoading, setProductsLoading]   = useState(true);

  const [isCartOpen,          setIsCartOpen]          = useState(false);
  const [isCheckoutOpen,      setIsCheckoutOpen]      = useState(false);
  const [isAuthOpen,          setIsAuthOpen]          = useState(false);
  const [isUserMenuOpen,      setIsUserMenuOpen]      = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);

  const [orderSuccess,     setOrderSuccess]     = useState(false);
  const [pendingCheckout,  setPendingCheckout]  = useState(false);
  const [hasApplied,       setHasApplied]       = useState(false);

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

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  // ── 1C: Parallelized product loading ─────────────────────────────────────
  // For retailer stores: all 3 queries fire simultaneously instead of waiting
  // in a sequential chain. Total wait = slowest query, not sum of all queries.
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      if (store.isRetailer && store.id) {
        // All three queries fire at the same time — no sequential waiting
        const [
          { data: baseProducts, error },
          { data: reg },
          { data: customPrices },
        ] = await Promise.all([
          supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false }),
          supabase
            .from('retailer_registrations')
            .select('selected_categories')
            .eq('store_slug', store.slug)
            .maybeSingle(),
          supabase
            .from('retailer_products')
            .select('product_id, custom_price')
            .eq('retailer_id', store.id),
        ]);

        if (error) throw error;
        if (!baseProducts) return;

        // Filter by selected categories (client-side, instant)
        const selectedCats: string[] = reg?.selected_categories ?? [];
        const categoryFiltered =
          selectedCats.length > 0
            ? baseProducts.filter(p => selectedCats.includes(p.category))
            : baseProducts;

        // Apply custom pricing (client-side, instant)
        const finalProducts: Product[] = categoryFiltered.map(p => {
          const custom = customPrices?.find(cp => cp.product_id === p.id);
          return custom ? { ...p, price: custom.custom_price } : p;
        });

        setProducts(finalProducts);
      } else {
        // Main store — single clean query
        const { data: baseProducts, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setProducts(baseProducts ?? []);
      }
    } catch (err) {
      console.error('Products fetch failed:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // ── 1D: N+1 category image fix ────────────────────────────────────────────
  // Old approach: 1 categories query + 1 query PER category = N+1 round-trips.
  // New approach: 1 categories query + 1 products query, grouped client-side.
  // Total is always 2 queries (or 3 for retailer stores) regardless of how
  // many categories exist.
  const loadCategories = async () => {
    try {
      let catSlugs: string[] = [];

      // For retailer stores, find which categories they carry first
      if (store.isRetailer && store.slug) {
        const { data: reg } = await supabase
          .from('retailer_registrations')
          .select('selected_categories')
          .eq('store_slug', store.slug)
          .maybeSingle();
        catSlugs = reg?.selected_categories ?? [];
      }

      // Fire categories + all product images in parallel — 2 queries at once
      const [catsRes, imagesRes] = await Promise.all([
        (() => {
          let q = supabase.from('categories').select('slug, name').order('sort_order');
          if (catSlugs.length > 0) q = q.in('slug', catSlugs);
          return q;
        })(),
        supabase
          .from('products')
          .select('category, images, image_url')
          .eq('is_active', true),
      ]);

      if (!catsRes.data) return;

      // Build a category → first image map in JS — O(n), runs in microseconds
      const imageBySlug = new Map<string, string | null>();
      for (const p of imagesRes.data ?? []) {
        if (!imageBySlug.has(p.category)) {
          imageBySlug.set(p.category, p.images?.[0] ?? p.image_url ?? null);
        }
      }

      setCategories(
        catsRes.data.map(cat => ({
          ...cat,
          image: imageBySlug.get(cat.slug) ?? null,
        })),
      );
    } catch (err) {
      console.error('Categories fetch failed:', err);
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
    productsLoading,
    selectedCategory,
    setSelectedCategory,
    categories,
    hasApplied,
    isCartOpen,          setIsCartOpen,
    isCheckoutOpen,      setIsCheckoutOpen,
    isAuthOpen,          setIsAuthOpen,
    isUserMenuOpen,      setIsUserMenuOpen,
    isRetailerModalOpen, setIsRetailerModalOpen,
    orderSuccess,        setOrderSuccess,
    handleSignOut,
    handleCheckout,
  };
}
