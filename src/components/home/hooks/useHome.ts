import { useState, useEffect } from 'react';
import { supabase, Product } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
}

export function useHome({ user }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ slug: string; name: string; image: string | null }[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

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

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    setProductsLoading(true);
    try {
      const { data: baseProducts, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) { console.error('Error loading products:', error); return; }
      if (!baseProducts) return;

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
    } catch (err) {
      console.error('Products fetch failed:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadCategories = async () => {
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
      if (!cats) return;

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
