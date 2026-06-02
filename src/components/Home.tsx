import { ShoppingBag } from 'lucide-react';
import { Product, CartItem } from '../lib/supabase';

import { useHome } from './home/hooks/useHome';
import ProductCard from './home/ProductCard';
import HomeHeader from './home/sections/HomeHeader';
import HomeHero from './home/sections/HomeHero';
import CategoryFilter from './home/sections/CategoryFilter';
import HomeFooter from './home/sections/HomeFooter';
import Cart from './Cart';
import Checkout from './Checkout';
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
  onViewProduct: (product: Product) => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

function ProductSkeleton() {
  return (
    <div className="group animate-pulse">
      <div className="bg-gray-200 aspect-square mb-4 rounded-sm" />
      <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function Home({
  user, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart, onClearCart,
  onNavigateToOrders, onViewProduct, onNavigateToPrivacy, onNavigateToTerms
}: HomeProps) {

  const {
    store, filteredProducts, productsLoading,
    selectedCategory, setSelectedCategory,
    isCartOpen, setIsCartOpen, isCheckoutOpen, setIsCheckoutOpen,
    isAuthOpen, setIsAuthOpen, isUserMenuOpen, setIsUserMenuOpen,
    isRetailerModalOpen, setIsRetailerModalOpen, orderSuccess, setOrderSuccess,
    handleSignOut, handleCheckout, categories, hasApplied,
  } = useHome({ user });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white relative flex flex-col">

      <HomeHeader
        user={user} store={store} isUserMenuOpen={isUserMenuOpen}
        setIsUserMenuOpen={setIsUserMenuOpen} onNavigateToOrders={onNavigateToOrders}
        handleSignOut={handleSignOut} setIsAuthOpen={setIsAuthOpen}
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

        {orderSuccess && (
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <div className="p-4 bg-green-50 border border-green-200 text-center animate-in fade-in zoom-in duration-300">
              <p className="text-xs tracking-wider text-green-800 uppercase font-medium">Order placed successfully</p>
            </div>
          </div>
        )}

        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-8 md:gap-x-8 md:gap-y-12">
            {productsLoading
              ? Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)
              : filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onViewDetails={onViewProduct}
                  />
                ))
            }
          </div>
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
        onUpdateQuantity={onUpdateQuantity} onRemove={onRemoveFromCart} onCheckout={handleCheckout} />

      <Checkout isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} items={cart}
        onSuccess={() => {
          onClearCart(); setIsCheckoutOpen(false); setOrderSuccess(true);
          setTimeout(() => setOrderSuccess(false), 3000);
        }} />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)}
        onViewTerms={onNavigateToTerms} onViewPrivacy={onNavigateToPrivacy} />

      <RetailerModal isOpen={isRetailerModalOpen} onClose={() => setIsRetailerModalOpen(false)}
        referringRetailerId={store.id} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      `}} />
    </div>
  );
}
