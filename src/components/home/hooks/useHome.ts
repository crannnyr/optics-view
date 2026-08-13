import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Product, markIntentionalSignOut } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
  autoOpenAuth?: boolean;
  onAutoAuthHandled?: () => void;
}

const PAGE_SIZE = 12;
const HERO_CACHE_KEY = 'ov_hero_settings';

export function useHome({ user, autoOpenAuth, onAutoAuthHandled }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts]                 = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories]             = useState<{ slug: string; name: string; image: string | null }[]>([]);
  const [productsLoading, setProductsLoading]   = useState(true);

  // Pagination state
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount]   = useState(0);

  // For retailer stores we fetch all (usually small filtered set).
  // For the main store we paginate.
  const isRetailerStore = store.isRetailer && !!store.id;

  const [isCartOpen,          setIsCartOpen]          = useState(false);
  const [isCheckoutOpen,      setIsCheckoutOpen]      = useState(false);
  const [isAuthOpen,          setIsAuthOpen]          = useState(false);
  const [isUserMenuOpen,      setIsUserMenuOpen]      = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);

  const [orderSuccess,    setOrderSuccess]    = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [hasApplied,      setHasApplied]      = useState(false);

  // Retailer category whitelist — fetched once and reused
  const retailerCatsRef = useRef<string[]>([]);
  const customPricesRef = useRef<{ product_id: string; custom_price: number }[]>([]);

  // ── Auto-open auth after session expiry ───────────────────────────────────
  useEffect(() => {
    if (autoOpenAuth) {
      setIsAuthOpen(true);
      onAutoAuthHandled?.();
    }
  }, [autoOpenAuth]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    loadProducts(1, 'all', true);
    loadCategories();
  }, [store.id]);

  // ── Retailer application check ────────────────────────────────────────────
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

  // ── Pending checkout after auth ───────────────────────────────────────────
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  }, [user, pendingCheckout]);

  // ── Category filter ───────────────────────────────────────────────────────
  // When category changes reset pagination and re-fetch
  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    loadProducts(1, selectedCategory, true);
  }, [selectedCategory]);

  // ── Product loader ────────────────────────────────────────────────────────
  const loadProducts = useCallback(async (
    pageNum: number,
    category: string,
    isReset: boolean
  ) => {
    if (pageNum === 1) {
      setProductsLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const from = (pageNum - 1) * PAGE_SIZE;
      const to   = from + PAGE_SIZE - 1;

      if (isRetailerStore) {
        // Retailer: fetch supporting data once on reset
        if (isReset) {
          const [{ data: reg }, { data: customPrices }] = await Promise.all([
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
          retailerCatsRef.current  = reg?.selected_categories ?? [];
          customPricesRef.current  = customPrices ?? [];
        }

        const catSlugs = retailerCatsRef.current;

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (category !== 'all') {
          query = query.eq('category', category);
        } else if (catSlugs.length > 0) {
          query = query.in('category', catSlugs);
        }

        const { data: baseProducts, count, error } = await query;
        if (error) throw error;
        if (!baseProducts) return;

        setTotalCount(count ?? 0);
        setHasMore(to < (count ?? 0) - 1);

        const finalProducts: Product[] = baseProducts.map(p => {
          const custom = customPricesRef.current.find(cp => cp.product_id === p.id);
          return custom ? { ...p, price: custom.custom_price } : p;
        });

        setProducts(prev => isReset ? finalProducts : [...prev, ...finalProducts]);

      } else {
        // Main store: paginated fetch
        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(from, to);

        if (category !== 'all') {
          query = query.eq('category', category);
        }

        const { data: baseProducts, count, error } = await query;
        if (error) throw error;

        setTotalCount(count ?? 0);
        setHasMore(to < (count ?? 0) - 1);
        setProducts(prev => isReset ? (baseProducts ?? []) : [...prev, ...(baseProducts ?? [])]);
      }

    } catch (err) {
      console.error('Products fetch failed:', err);
    } finally {
      setProductsLoading(false);
      setLoadingMore(false);
    }
  }, [store.id, store.slug, store.isRetailer, isRetailerStore]);

  // filteredProducts is just products — filtering is now done server-side
  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  // ── Load more (called by infinite scroll sentinel) ────────────────────────
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage, selectedCategory, false);
  }, [page, loadingMore, hasMore, selectedCategory, loadProducts]);

  // ── Categories ────────────────────────────────────────────────────────────
  const loadCategories = async () => {
    try {
      let catSlugs: string[] = [];

      if (store.isRetailer && store.slug) {
        const { data: reg } = await supabase
          .from('retailer_registrations')
          .select('selected_categories')
          .eq('store_slug', store.slug)
          .maybeSingle();
        catSlugs = reg?.selected_categories ?? [];
      }

      const [catsRes, imagesRes] = await Promise.all([
        (() => {
          let q = supabase.from('categories').select('slug, name').order('sort_order');
          if (catSlugs.length > 0) q = q.in('slug', catSlugs);
          return q;
        })(),
        // Capped and ordered by newest — enough rows to cover a thumbnail for
        // every category without pulling the entire active product table on
        // every home page load. No caching layer, just a sane row limit.
        supabase
          .from('products')
          .select('category, images, image_url')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(80),
      ]);

      if (!catsRes.data) return;

      const imageBySlug = new Map<string, string | null>();
      for (const p of imagesRes.data ?? []) {
        if (!imageBySlug.has(p.category)) {
          imageBySlug.set(p.category, p.images?.[0] ?? p.image_url ?? null);
        }
      }

      setCategories(
        catsRes.data.map(cat => ({ ...cat, image: imageBySlug.get(cat.slug) ?? null }))
      );
    } catch (err) {
      console.error('Categories fetch failed:', err);
    }
  };

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    markIntentionalSignOut();
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
    loadingMore,
    hasMore,
    loadMore,
    totalCount,
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
