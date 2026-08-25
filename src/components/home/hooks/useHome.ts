import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, Product, markIntentionalSignOut } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
  autoOpenAuth?: boolean;
  onAutoAuthHandled?: () => void;
  onNavigateToCheckout: () => void;
}

const PAGE_SIZE = 12;

export function useHome({ user, autoOpenAuth, onAutoAuthHandled, onNavigateToCheckout }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts]                 = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories]             = useState<{ slug: string; name: string; image: string | null }[]>([]);
  const [productsLoading, setProductsLoading]   = useState(true);

  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount]   = useState(0);

  const isRetailerStore = store.isRetailer && !!store.id;

  const [isCartOpen,          setIsCartOpen]          = useState(false);
  const [isAuthOpen,          setIsAuthOpen]          = useState(false);
  const [isUserMenuOpen,      setIsUserMenuOpen]      = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);

  // Set when a signed-out user hits "checkout" — after they sign in, we
  // navigate them to /checkout automatically instead of reopening a modal.
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [hasApplied,      setHasApplied]      = useState(false);

  const retailerCatsRef = useRef<string[]>([]);
  const customPricesRef = useRef<{ product_id: string; custom_price: number }[]>([]);

  useEffect(() => {
    if (autoOpenAuth) {
      setIsAuthOpen(true);
      onAutoAuthHandled?.();
    }
  }, [autoOpenAuth]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    loadProducts(1, 'all', true);
    loadCategories();
  }, [store.id]);

  useEffect(() => {
    if (user?.email) {
      supabase
        .from('retailer_registrations')
        .select('payment_status, payment_method, is_blocked')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          if (!data) {
            setHasApplied(false);
            return;
          }
          const showDashboard =
            data.is_blocked === true ||
            data.payment_status === 'verified' ||
            data.payment_method === 'transfer';
          setHasApplied(showDashboard);
        });
    } else {
      setHasApplied(false);
    }
  }, [user]);

  // ── Pending checkout after auth ───────────────────────────────────────────
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      onNavigateToCheckout();
    }
  }, [user, pendingCheckout]);

  useEffect(() => {
    setPage(1);
    setProducts([]);
    setHasMore(true);
    loadProducts(1, selectedCategory, true);
  }, [selectedCategory]);

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

        // Sponsored products surface first (is_boosted is computed against
        // now(), so expired boosts don't linger), then featured products by
        // display_order, then newest-first.
        let query = supabase
          .from('products_feed')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('is_boosted', { ascending: false })
          .order('display_order', { ascending: false })
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
        // Sponsored products surface first (is_boosted is computed against
        // now(), so expired boosts don't linger), then featured products by
        // display_order, then newest-first.
        let query = supabase
          .from('products_feed')
          .select('*', { count: 'exact' })
          .eq('is_active', true)
          .order('is_boosted', { ascending: false })
          .order('display_order', { ascending: false })
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

  useEffect(() => {
    setFilteredProducts(products);
  }, [products]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    loadProducts(nextPage, selectedCategory, false);
  }, [page, loadingMore, hasMore, selectedCategory, loadProducts]);

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

  const handleSignOut = async () => {
    markIntentionalSignOut();
    await supabase.auth.signOut();
    setIsUserMenuOpen(false);
  };

  // Cart's "PROCEED TO CHECKOUT" button calls this. Signed-in users go
  // straight to /checkout; signed-out users are prompted to sign in first,
  // then get sent to /checkout automatically once they do.
  const handleCheckout = () => {
    setIsCartOpen(false);
    if (!user) {
      setPendingCheckout(true);
      setIsAuthOpen(true);
    } else {
      onNavigateToCheckout();
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
    isAuthOpen,          setIsAuthOpen,
    isUserMenuOpen,      setIsUserMenuOpen,
    isRetailerModalOpen, setIsRetailerModalOpen,
    handleSignOut,
    handleCheckout,
  };
}