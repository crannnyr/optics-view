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

  // Modal States
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

  // Check if user already has a retailer application
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

  // Auto-open checkout after login
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  }, [user, pendingCheckout]);

  // Filter products by category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.category === selectedCategory));
    }
  }, [selectedCategory, products]);

  const loadProducts = async () => {
    const { data: baseProducts, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) console.error('Error loading products:', error);

    if (baseProducts) {
      if (store.isRetailer && store.id) {
        const { data: customPrices } = await supabase
          .from('retailer_products')
          .select('product_id, custom_price')
          .eq('retailer_id', store.id);

        const mergedProducts = baseProducts.map((p) => {
          const custom = customPrices?.find((cp) => cp.product_id === p.id);
          return custom ? { ...p, price: custom.custom_price } : p;
        });

        setProducts(mergedProducts);
        setFilteredProducts(mergedProducts);
      } else {
        setProducts(baseProducts);
        setFilteredProducts(baseProducts);
      }
    }
  };

  const loadCategories = async () => {
    const { data: cats } = await supabase
      .from('categories')
      .select('slug, name')
      .order('sort_order');
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