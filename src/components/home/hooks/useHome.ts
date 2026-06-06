import { useState, useEffect } from 'react';
import { supabase, Product, markIntentionalSignOut } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
  // When true, open the auth modal automatically — set by App.tsx after
  // any session expiry so the user can sign back in without hunting for the button.
  autoOpenAuth?: boolean;
  onAutoAuthHandled?: () => void;
}

export function useHome({ user, autoOpenAuth, onAutoAuthHandled }: UseHomeProps) {
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

  const [orderSuccess,    setOrderSuccess]    = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);
  const [hasApplied,      setHasApplied]      = useState(false);

  // ── Auto-open auth modal after session expiry ─────────────────────────────
  // App.tsx sets autoOpenAuth=true when a session expires unexpectedly.
  // We open the modal, then call onAutoAuthHandled to reset the flag so it
  // doesn't re-trigger if the component re-renders.
  useEffect(() => {
    if (autoOpenAuth) {
      setIsAuthOpen(true);
      onAutoAuthHandled?.();
    }
  }, [autoOpenAuth]);

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
  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      if (store.isRetailer && store.id) {
        const [
          { data: baseProducts, error },
          { data: reg },
          { data: customPrices },
        ] = await Promise.all([
          supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
          supabase.from('retailer_registrations').select('selected_categories').eq('store_slug', store.slug).maybeSingle(),
          supabase.from('retailer_products').select('product_id, custom_price').eq('retailer_id', store.id),
        ]);

        if (error) throw error;
        if (!baseProducts) return;

        const selectedCats: string[] = reg?.selected_categories ?? [];
        const categoryFiltered = selectedCats.length > 0
          ? baseProducts.filter(p => selectedCats.includes(p.category))
          : baseProducts;

        const finalProducts: Product[] = categoryFiltered.map(p => {
          const custom = customPrices?.find(cp => cp.product_id === p.id);
          return custom ? { ...p, price: custom.custom_price } : p;
        });

        setProducts(finalProducts);
      } else {
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

  // ── 1D: N+1 fix — 2 parallel queries instead of 1+N ─────────────────────
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
        supabase.from('products').select('category, images, image_url').eq('is_active', true),
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

  // ── Sign out ──────────────────────────────────────────────────────────────
  // markIntentionalSignOut() flags this as a deliberate user action so
  // App.tsx does NOT treat the resulting SIGNED_OUT event as a session expiry.
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
