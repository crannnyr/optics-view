import { useEffect, useRef, Fragment } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, CartItem } from '../lib/supabase';

import { useHome } from './home/hooks/useHome';
import ProductCard from './home/ProductCard';
import HomeHeader from './home/sections/HomeHeader';
import HomeHero from './home/sections/HomeHero';
import CategoryFilter from './home/sections/CategoryFilter';
import SearchBar from './home/sections/SearchBar';
import DailyVendorModal from './home/sections/DailyVendorModal';
import HomeFooter from './home/sections/HomeFooter';
import Cart from './Cart';
import AuthModal from './AuthModal';
import RetailerModal from './RetailerModal';

interface HomeProps {
  user: any;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, qty: number, selectedColor?: string, selectedType?: string) => void;
  onRemoveFromCart: (id: string, selectedColor?: string, selectedType?: string) => void;
  onClearCart: () => void;
  onNavigateToOrders: () => void;
  onNavigateToCheckout: () => void;
  onNavigateToVendor: () => void;
  onViewProduct: (product: Product) => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
  autoOpenAuth?: boolean;
  onAutoAuthHandled?: () => void;
}

function ProductSkeleton() {
  return (
    <div className="group animate-pulse">
      <div className="bg-gradient-to-br from-gray-200 to-gray-100 aspect-square mb-4 rounded-sm" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function Home({
  user, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart, onClearCart,
  onNavigateToOrders, onNavigateToCheckout, onNavigateToVendor, onViewProduct, onNavigateToPrivacy, onNavigateToTerms,
  autoOpenAuth, onAutoAuthHandled,
}: HomeProps) {

  const {
    store, filteredProducts, productsLoading,
    loadingMore, hasMore, loadMore,
    selectedCategory, setSelectedCategory,
    isCartOpen, setIsCartOpen,
    isAuthOpen, setIsAuthOpen, isUserMenuOpen, setIsUserMenuOpen,
    isRetailerModalOpen, setIsRetailerModalOpen,
    handleSignOut, handleCheckout, categories, hasApplied,
  } = useHome({ user, autoOpenAuth, onAutoAuthHandled, onNavigateToCheckout });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <div className="min-h-screen bg-white relative flex flex-col">

      <HomeHeader
        user={user} store={store} isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen} onNavigateToOrders={onNavigateToOrders}
        onNavigateToVendor={onNavigateToVendor}
        handleSignOut={handleSignOut} setIsAuthOpen={setIsAuthOpen}
      />

      <main className="flex-grow w-full">
        <HomeHero
          themeColor={store.themeColor}
          onRetailerClick={() => setIsRetailerModalOpen(true)}
          hasApplied={hasApplied}
          user={user}
        />

        <SearchBar themeColor={store.themeColor} onViewDetails={onViewProduct} />

        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          themeColor={store.themeColor}
        />

        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
            {productsLoading
              ? Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)
              : filteredProducts.map((product, idx) => (
                  <Fragment key={product.id}>
                    <ProductCard
                      product={product}
                      onAddToCart={onAddToCart}
                      onViewDetails={onViewProduct}
                    />
                    {/* Mobile-only banner, right after the first row (2 items
                        on the mobile grid-cols-2 layout). col-span-2 makes it
                        take the full row by itself; md:hidden removes it from
                        the grid entirely on desktop, so the 3-col layout
                        continues uninterrupted there. */}
                    {idx === 1 && (
                      <a
                        key="china-banner"
                        href="https://qafrica.store/recommendations"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="col-span-2 md:hidden flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-sm shadow-sm"
                      >
                        <span className="text-lg leading-none">🇨🇳</span>
                        <span
                          className="text-xs font-bold tracking-wide uppercase"
                          style={{ animation: 'blink 1.4s ease-in-out infinite' }}
                        >
                          🔥 Hot — Click to Order Directly from China
                        </span>
                      </a>
                    )}
                  </Fragment>
                ))
            }
          </div>

          <div ref={sentinelRef} className="h-1 w-full" />

          {loadingMore && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}

          {!hasMore && !productsLoading && filteredProducts.length > 0 && (
            <p className="text-center text-xs text-gray-300 tracking-widest uppercase py-8">
              All products loaded
            </p>
          )}

          {!productsLoading && filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-sm text-gray-400 tracking-wider">No products found</p>
            </div>
          )}
        </section>
      </main>

      <HomeFooter
        store={store}
        onNavigateToPrivacy={onNavigateToPrivacy}
        onNavigateToTerms={onNavigateToTerms}
      />

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:opacity-90 transition-transform hover:scale-105 z-40"
        style={{ backgroundColor: store.themeColor }}
      >
        <ShoppingBag size={24} />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
            {cartItemCount}
          </span>
        )}
      </button>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart}
        onUpdateQuantity={onUpdateQuantity} onRemove={onRemoveFromCart}
        onCheckout={() => { setIsCartOpen(false); onNavigateToCheckout(); }} />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)}
        onViewTerms={onNavigateToTerms} onViewPrivacy={onNavigateToPrivacy} />

      <RetailerModal isOpen={isRetailerModalOpen} onClose={() => setIsRetailerModalOpen(false)}
        referringRetailerId={store.id} />

      <DailyVendorModal themeColor={store.themeColor} onNavigateToVendor={onNavigateToVendor} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}} />
    </div>
  );
}
