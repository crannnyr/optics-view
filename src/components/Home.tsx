import { useState, useEffect, useRef } from 'react';
import { supabase, Product, CartItem, Review } from '../lib/supabase';
import { ShoppingBag, Menu, LogOut, Package, Star, ChevronLeft, ChevronRight, TrendingUp, Grid3x3, Video, Headphones, Gift } from 'lucide-react';
import Cart from './Cart';
import Checkout from './Checkout';
import AuthModal from './AuthModal';
import RetailerModal from './RetailerModal';
import { useStore } from '../context/StoreContext';

interface HomeProps {
  user: any;
  cart: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveFromCart: (id: string) => void;
  onClearCart: () => void;
  onNavigateToOrders: () => void;
  onViewProduct: (product: Product) => void;
  onNavigateToPrivacy: () => void;
  onNavigateToTerms: () => void;
}

// ProductCard Component
function ProductCard({ product, onAddToCart, onViewDetails }: { 
  product: Product; 
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}) {
  const { store } = useStore();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0 
    ? product.images.slice(0, 5)
    : [product.image_url];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', product.id)
        .order('created_at', { ascending: false })
        .limit(2);

      if (data) setReviews(data);
    };
    fetchReviews();
  }, [product.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (descriptionRef.current && !descriptionRef.current.contains(e.target as Node)) {
        setShowFullDescription(false);
      }
    };

    if (showFullDescription) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFullDescription]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength);
  };

  const description = product.description || '';
  const shouldTruncate = description.length > 80;

  const toggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowFullDescription(!showFullDescription);
  };

  return (
    <div className="group">
      <div 
        onClick={() => onViewDetails(product)}
        className="relative bg-gray-100 mb-4 overflow-hidden cursor-pointer"
      >
        <img
          src={images[currentImageIdx]}
          alt={product.name}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
        />

        <div 
          className="absolute bottom-0 right-0 bg-white px-3 py-2.5 text-[8px] tracking-[0.2em] font-light border-l border-t border-gray-200"
          style={{ color: store.themeColor }}
        >
          {store.name.toUpperCase()}
        </div>

        {images.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
            <div className="absolute bottom-2 left-2 flex gap-1.5">
              {images.map((_, idx) => (
                <div 
                  key={idx}
                  className="w-1.5 h-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: idx === currentImageIdx ? store.themeColor : 'rgba(255,255,255,0.6)' }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 text-left">
          <h3 
            onClick={() => onViewDetails(product)}
            className="text-sm font-light mb-1 cursor-pointer hover:opacity-70"
            style={{ color: store.themeColor }}
          >
            {product.name}
          </h3>

          <div 
            ref={descriptionRef}
            onClick={toggleDescription}
            className="text-xs text-gray-500 mb-2 cursor-pointer"
          >
            {showFullDescription ? description : truncateText(description, 80)}
            {shouldTruncate && !showFullDescription && '...'}
          </div>

          <p 
            className="text-base font-medium mb-2"
            style={{ color: store.themeColor }}
          >
            ₦{product.price.toLocaleString()}
          </p>

          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={12} 
                className={star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
              />
            ))}
            {reviews.length > 0 && (
              <span className="text-[10px] text-gray-400 ml-1">({reviews.length})</span>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="space-y-2 mb-3">
              {reviews.slice(0, 2).map((review) => (
                <div key={review.id} className="bg-gray-50 p-2 rounded text-[10px] border border-gray-100">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-bold text-gray-700">{review.reviewer_name}</span>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={8} 
                          className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 line-clamp-2">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="shrink-0 text-white px-4 py-2 text-xs tracking-wider hover:opacity-90 transition-opacity flex items-center gap-2"
          style={{ backgroundColor: store.themeColor }}
        >
          <ShoppingBag size={14} />
          BUY
        </button>
      </div>
    </div>
  );
}

export default function Home({ 
  user, 
  cart, 
  onAddToCart, 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onClearCart,
  onNavigateToOrders,
  onViewProduct,
  onNavigateToPrivacy,
  onNavigateToTerms
}: HomeProps) {
  const { store } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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
        const { data: customPrices } = await supabase
          .from('retailer_products')
          .select('product_id, custom_price')
          .eq('retailer_id', store.id);

        const mergedProducts = baseProducts.map((p) => {
          const custom = customPrices?.find((cp) => cp.product_id === p.id);
          if (custom) {
            return { ...p, price: custom.custom_price };
          }
          return p;
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

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categoryDescriptions = {
    all: 'All smart glasses including audio-only and video cam. All models support calls.',
    video: 'AI glasses with video capabilities, object recognition, and calls.',
    audio_only: 'Audio-only smart glasses with call support.',
    combo: 'Personal offers - get 2 items at a discounted price.'
  };

  return (
    <div className="min-h-screen bg-white relative flex flex-col">

      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 
            className="text-lg font-light tracking-[0.3em]"
            style={{ color: store.themeColor }}
          >
            {store.name.toUpperCase()}
          </h1>

          <div>
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Menu size={24} style={{ color: store.themeColor }} />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border shadow-lg z-50 py-2">
                    <div className="px-4 py-3 border-b mb-2">
                      <p className="text-xs text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium truncate">{user.email}</p>
                    </div>
                    <button 
                      onClick={() => { onNavigateToOrders(); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Package size={16} /> My Purchases
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="text-xs tracking-widest border px-6 py-2 transition-colors hover:text-white"
                style={{ 
                  borderColor: store.themeColor,
                  color: store.themeColor,
                }}
              >
                SIGN IN
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-grow w-full">
        {/* Hero Image Section */}
        <section className="relative w-full h-[260px] md:h-[600px] overflow-hidden">
          <img 
            src="https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/product-images/WhatsApp%20Image%202025-12-20%20at%2010.00.51%20AM.jpeg"
            alt="Smart Glasses Hero"
            className="w-full h-full object-contain"
          />

          {/* Animated Text Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center max-w-3xl px-6">
              <h2 
                className="text-3xl md:text-4xl font-light tracking-[0.3em] text-white mb-3"
                style={{
                  animation: 'fadeInUp 1.2s ease-out forwards',
                  opacity: 0
                }}
              >
                SEE BEYOND
              </h2>
              <p 
                className="text-sm md:text-base text-white leading-relaxed"
                style={{
                  animation: 'fadeInUp 1.2s ease-out 0.4s forwards',
                  opacity: 0
                }}
              >
                AI-powered clarity.
              </p>
            </div>
          </div>
        </section>

        {/* Become a Retailer Button - NOW SHOWS ON ALL STORES */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <button
            onClick={() => setIsRetailerModalOpen(true)}
            className="text-white px-6 py-2.5 text-xs tracking-[0.15em] hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg"
            style={{
              backgroundColor: store.themeColor,
              animation: 'blink 2s ease-in-out infinite'
            }}
          >
            <TrendingUp size={14} />
            BECOME A RETAILER
          </button>
        </section>

        {/* Category Filter with Icons */}
        <section className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex gap-6 justify-center flex-wrap items-center">
            {/* ALL */}
            <button
              onClick={() => setSelectedCategory('all')}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                selectedCategory === 'all'
                  ? 'text-white shadow-lg scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'all' ? { backgroundColor: store.themeColor } : {}}
            >
              <Grid3x3 size={16} className="md:w-6 md:h-6" />
            </button>

            {/* VIDEO */}
            <button
              onClick={() => setSelectedCategory('video')}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                selectedCategory === 'video'
                  ? 'text-white shadow-lg scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'video' ? { backgroundColor: store.themeColor } : {}}
            >
              <Video size={16} className="md:w-6 md:h-6" />
            </button>

            {/* AUDIO ONLY */}
            <button
              onClick={() => setSelectedCategory('audio_only')}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                selectedCategory === 'audio_only'
                  ? 'text-white shadow-lg scale-110'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={selectedCategory === 'audio_only' ? { backgroundColor: store.themeColor } : {}}
            >
              <Headphones size={16} className="md:w-6 md:h-6" />
            </button>

            {/* COMBO */}
            <button
              onClick={() => setSelectedCategory('combo')}
              className={`w-10 h-10 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all ${
                selectedCategory === 'combo'
                  ? 'bg-green-600 text-white shadow-lg scale-110'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              style={{
                animation: selectedCategory !== 'combo' ? 'pulse 1.5s ease-in-out infinite' : 'none'
              }}
            >
              <Gift size={16} className="md:w-6 md:h-6" />
            </button>
          </div>

          {/* Category Description */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto">
              {categoryDescriptions[selectedCategory as keyof typeof categoryDescriptions]}
            </p>
          </div>
        </section>

        {orderSuccess && (
          <div className="max-w-7xl mx-auto px-6 mb-8">
            <div className="p-4 bg-green-50 border border-green-200 text-center">
              <p className="text-xs tracking-wider text-green-800">order placed successfully</p>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {filteredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onAddToCart={onAddToCart}
                onViewDetails={onViewProduct}
              />
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <h2 
            className="text-lg font-light tracking-[0.2em]"
            style={{ color: store.themeColor }}
          >
            {store.name.toUpperCase()}
          </h2>

          <div className="flex gap-8">
            <button 
              onClick={onNavigateToPrivacy}
              className="text-xs text-gray-500 hover:text-black tracking-widest uppercase transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={onNavigateToTerms}
              className="text-xs text-gray-500 hover:text-black tracking-widest uppercase transition-colors"
            >
              Terms & Conditions
            </button>
          </div>

          <a 
            href="mailto:support@opticsview.store"
            className="text-xs text-gray-600 hover:text-black tracking-wide transition-colors"
          >
            support@opticsview.store
          </a>

          <p className="text-[10px] tracking-widest text-gray-400">
            © {new Date().getFullYear()} {store.name.toLowerCase()}. all rights reserved.
          </p>
        </div>
      </footer>

      <button
        onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:opacity-90 transition-transform hover:scale-105 z-40"
        style={{ backgroundColor: store.themeColor }}
      >
        <ShoppingBag size={24} />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
            {cartItemCount}
          </span>
        )}
      </button>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={onUpdateQuantity}
        onRemove={onRemoveFromCart}
        onCheckout={handleCheckout} 
      />

      <Checkout
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onSuccess={() => {
          onClearCart();
          setIsCheckoutOpen(false);
          setOrderSuccess(true);
          setTimeout(() => setOrderSuccess(false), 3000);
        }}
      />

      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => {
          setIsAuthOpen(false);
          setPendingCheckout(false);
        }} 
        onViewTerms={onNavigateToTerms}
        onViewPrivacy={onNavigateToPrivacy}
      />

      {/* UPDATED: Pass store.id as referringRetailerId */}
      <RetailerModal 
        isOpen={isRetailerModalOpen}
        onClose={() => setIsRetailerModalOpen(false)}
        referringRetailerId={store.id}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}} />
    </div>
  );
}