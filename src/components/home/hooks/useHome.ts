import { useState, useEffect } from 'react';
import { supabase, Product, CartItem } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';

interface UseHomeProps {
  user: any;
}

export function useHome({ user }: UseHomeProps) {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modal States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isRetailerModalOpen, setIsRetailerModalOpen] = useState(false);
  
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [store.id]);

  // Handle auto-opening checkout after successful login
  useEffect(() => {
    if (user && pendingCheckout) {
      setPendingCheckout(false);
      setIsCheckoutOpen(true);
    }
  }, [user, pendingCheckout]);

  // Filter products when category changes
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      setFilteredProducts(products.filter(p => p.product_type === selectedCategory));
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
        // Fetch custom retailer prices if viewing through a retailer's store
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

  const categoryDescriptions = {
    all: 'All smart glasses including audio-only and video cam. All models support calls.',
    video: 'AI glasses with video capabilities, object recognition, and calls.',
    audio_only: 'Audio-only smart glasses with call support.',
    combo: 'Personal offers - get 2 items at a discounted price.'
  };

  return {
    store,
    products,
    filteredProducts,
    selectedCategory,
    setSelectedCategory,
    isCartOpen,
    setIsCartOpen,
    isCheckoutOpen,
    setIsCheckoutOpen,
    isAuthOpen,
    setIsAuthOpen,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isRetailerModalOpen,
    setIsRetailerModalOpen,
    orderSuccess,
    setOrderSuccess,
    handleSignOut,
    handleCheckout,
    categoryDescriptions
  };
}
