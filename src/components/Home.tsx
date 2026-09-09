import { useEffect, useRef, useState, Fragment } from 'react';
import { ShoppingBag } from 'lucide-react';
import { Product, CartItem, supabase } from '../lib/supabase';

import { useHome } from './home/hooks/useHome';
import ProductCard from './home/ProductCard';
import HomeHeader from './home/sections/HomeHeader';
import HomeHero from './home/sections/HomeHero';
import CategoryFilter from './home/sections/CategoryFilter';
import ProductSlider, { SliderMode } from './home/sections/ProductSlider';
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
    <div className="animate-pulse bg-white border border-gray-100 rounded-lg overflow-hidden">
      <div className="bg-gray-100 aspect-square" />
      <div className="p-2.5 space-y-2">
        <div className="h-2.5 bg-gray-200 rounded w-full" />
        <div className="h-2.5 bg-gray-200 rounded w-2/3" />
        <div className="h-3.5 bg-gray-200 rounded w-1/2 mt-2" />
        <div className="h-7 bg-gray-200 rounded-full w-full mt-2" />
      </div>
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

  // Which products currently have an active CPC ad running. Refetched every
  // couple minutes since an ad can pause mid-session (wallet runs out) or a
  // vendor can switch products — a shopper browsing for a while should still
  // see reasonably current sponsorship state.
  const [sponsoredProductIds, setSponsoredProductIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    const fetchSponsored = () => {
      supabase.from('sponsored_products').select('product_id').then(({ data }) => {
        if (cancelled || !data) return;
        setSponsoredProductIds(new Set(data.map((r: { product_id: string }) => r.product_id)));
      });
    };
    fetchSponsored();
    const interval = setInterval(fetchSponsored, 120000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

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
        onViewProduct={onViewProduct}
      />

      <main className="flex-grow w-full">
        <HomeHero
          themeColor={store.themeColor}
          onRetailerClick={() => setIsRetailerModalOpen(true)}
          hasApplied={hasApplied}
          user={user}
        />

        <CategoryFilter
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          themeColor={store.themeColor}
        />

        {/* Trending sits above the grid on every category tab — scoped to
            that category when one is active, site-wide on "All". */}
        {!productsLoading && (
          <ProductSlider
            mode="trending"
            isRetailer={!!store.isRetailer}
            onViewDetails={onViewProduct}
            category={selectedCategory}
          />
        )}

        <section className="max-w-7xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {productsLoading
              ? Array.from({ length: 12 }).map((_, i) => <ProductSkeleton key={i} />)
              : filteredProducts.map((product, idx) => {
                  // A slider break every 3 rows of the mobile 2-col grid (every
                  // 6th item) — cycling through the three price tiers. Trending
                  // already has its own spot above the grid, so it isn't
                  // repeated here. col-span-full breaks it out of the grid to
                  // sit full-width between rows on every screen size. Present
                  // on every category tab, scoped to that category.
                  const showSlider = idx > 0 && idx % 6 === 0;
                  const sliderCycle: SliderMode[] = ['under_5000', 'under_3000', 'under_10000'];
                  const sliderMode = sliderCycle[((idx / 6) - 1) % sliderCycle.length];

                  return (
                    <Fragment key={product.id}>
                      {showSlider && (
                        <div className="col-span-2 md:col-span-3 lg:col-span-4 -mx-4">
                          <ProductSlider mode={sliderMode} isRetailer={!!store.isRetailer} onViewDetails={onViewProduct} category={selectedCategory} />
                        </div>
                      )}
                      <ProductCard
                        product={product}
                        onAddToCart={onAddToCart}
                        onViewDetails={onViewProduct}
                        isSponsored={sponsoredProductIds.has(product.id)}
                      />
                    </Fragment>
                  );
                })
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
