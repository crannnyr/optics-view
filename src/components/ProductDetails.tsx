import { useState, useEffect, useRef } from 'react';
import { supabase, Product, Review, CartItem } from '../lib/supabase';
import { ArrowLeft, Star, ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, TrendingUp } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import Cart from './Cart';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (product: Product, quantity: number, selectedColor?: string, selectedType?: string, selectedSize?: string) => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, qty: number, selectedColor?: string, selectedType?: string, selectedSize?: string) => void;
  onRemoveFromCart: (id: string, selectedColor?: string, selectedType?: string, selectedSize?: string) => void;
  onNavigateToProduct: (product: Product) => void;
  onNavigateToCheckout: () => void;
}

function formatSoldCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

export default function ProductDetails({
  product, onBack, onAddToCart, cart, onUpdateQuantity, onRemoveFromCart,
  onNavigateToProduct, onNavigateToCheckout
}: ProductDetailsProps) {
  const { store } = useStore();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const images = product.images && product.images.length > 0
    ? product.images.slice(0, 5)
    : [product.image_url];

  const hasColors = product.color_options && product.color_options.length > 0;
  const hasTypes  = product.type_options && product.type_options.length > 0;
  const hasSizes  = (product as any).size_options && (product as any).size_options.length > 0;

  useEffect(() => {
    setCurrentImageIdx(0);
    setQuantity(1);
    setShowFullDescription(false);
    setAddedToCart(false);
    setLoadingReviews(true);
    if (hasColors && product.color_options) setSelectedColor(product.color_options[0]);
    else setSelectedColor('');
    if (hasTypes && product.type_options) setSelectedType(product.type_options[0]);
    else setSelectedType('');
    if (hasSizes && (product as any).size_options) setSelectedSize((product as any).size_options[0]);
    else setSelectedSize('');
    fetchReviews();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id]);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('category', product.category)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setCategoryProducts(data); });
  }, [product.category]);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', product.id)
      .order('created_at', { ascending: false });
    if (data) setReviews(data);
    setLoadingReviews(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    const deltaY = Math.abs(touchStartY.current - e.changedTouches[0].clientY);
    if (Math.abs(deltaX) < 80 || Math.abs(deltaX) < deltaY * 1.5) return;
    const currentIdx = categoryProducts.findIndex(p => p.id === product.id);
    if (deltaX > 0 && currentIdx < categoryProducts.length - 1) {
      onNavigateToProduct(categoryProducts[currentIdx + 1]);
    } else if (deltaX < 0 && currentIdx > 0) {
      onNavigateToProduct(categoryProducts[currentIdx - 1]);
    }
  };

  const nextImage = () => setCurrentImageIdx(prev => (prev + 1) % images.length);
  const prevImage = () => setCurrentImageIdx(prev => (prev - 1 + images.length) % images.length);

  const calculateDiscount = () => {
    if (!product.wholesale_price) return 0;
    return Math.round(((product.price - product.wholesale_price) / product.price) * 100);
  };

  const wholesaleMinQty = product.wholesale_min_qty || 7;

  const handleAddToCart = () => {
    if (hasColors && !selectedColor) { alert('Please select a color'); return; }
    if (hasTypes && !selectedType) { alert('Please select a type'); return; }
    if (hasSizes && !selectedSize) { alert('Please select a size'); return; }
    onAddToCart(product, quantity, selectedColor, selectedType, selectedSize);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    // Auth is gated centrally in App.tsx's navigateToCheckout — if the
    // person isn't signed in, they'll land back on home with the login
    // modal open instead of ever seeing checkout.
    onNavigateToCheckout();
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const truncatedDescription = product.description.substring(0, 25);
  const shouldTruncate = product.description.length > 25;
  const suggestedProducts = categoryProducts.filter(p => p.id !== product.id).slice(0, 6);
  const currentCategoryIndex = categoryProducts.findIndex(p => p.id === product.id);
  const totalInCategory = categoryProducts.length;

  const variantBtnStyle = (active: boolean) => ({
    ...(active ? { backgroundColor: store.themeColor, borderColor: store.themeColor } : {}),
  });

  return (
    <div className="min-h-screen bg-white pb-20" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-xs md:text-sm hover:opacity-70" style={{ color: store.themeColor }}>
          <ArrowLeft size={18} />
          <span className="tracking-widest">BACK TO SHOP</span>
        </button>
        {totalInCategory > 1 && (
          <span className="text-[10px] text-gray-400 tracking-wider">
            {currentCategoryIndex + 1} / {totalInCategory} · swipe to browse
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10 grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12">
        <div className="space-y-3 md:space-y-4">
          <div className="relative bg-gray-100 overflow-hidden group">
            <img
              src={images[currentImageIdx]}
              alt={product.name}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute bottom-0 right-0 bg-white px-3 py-3.5 text-[8px] tracking-[0.2em] font-light border-l border-t border-gray-200" style={{ color: store.themeColor }}>
              {store.name.toUpperCase()}
            </div>
            {images.length > 1 && (
              <>
                <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 md:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-2 left-2 flex gap-1.5">
                  {images.map((_, idx) => (
                    <div key={idx} className="w-1.5 h-1.5 rounded-full transition-colors"
                      style={{ backgroundColor: idx === currentImageIdx ? store.themeColor : 'rgba(255,255,255,0.6)' }} />
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button key={idx} onClick={() => setCurrentImageIdx(idx)}
                className="w-16 h-16 md:w-20 md:h-20 shrink-0 border-2 transition-colors"
                style={{ borderColor: idx === currentImageIdx ? store.themeColor : 'transparent' }}>
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <h1 className="text-2xl md:text-3xl font-light mb-2" style={{ color: store.themeColor }}>
            {product.name}
          </h1>

          <div className="flex flex-wrap items-baseline gap-3 md:gap-4 mb-3">
            {product.compare_at_price && product.compare_at_price > product.price && (
              <span className="text-lg md:text-xl text-gray-400 line-through">₦{product.compare_at_price.toLocaleString()}</span>
            )}
            <span className="text-xl md:text-2xl font-medium">₦{product.price.toLocaleString()}</span>
            {!store.isRetailer && product.wholesale_price && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Buy {wholesaleMinQty}+ get {calculateDiscount()}% OFF (₦{product.wholesale_price.toLocaleString()} ea)
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 mb-6 md:mb-8">
            {[1,2,3,4,5].map(star => (
              <Star key={star} size={14} className={star <= 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
            ))}
            <span className="text-xs text-gray-500 ml-2">({reviews.length} reviews)</span>
            <span className="text-gray-300 mx-1.5">·</span>
            <span className={`flex items-center gap-1 text-xs ${product.units_sold >= 1000 ? 'text-amber-500 font-medium' : 'text-gray-500'}`}>
              <TrendingUp size={12} />
              {formatSoldCount(product.units_sold)} sold
            </span>
          </div>

          <div className="mb-6 md:mb-8">
            <p className="text-gray-600 leading-relaxed text-sm">
              {showFullDescription ? product.description : truncatedDescription}
              {shouldTruncate && !showFullDescription && '...'}
              {shouldTruncate && (
                <button onClick={() => setShowFullDescription(!showFullDescription)}
                  className="ml-2 underline hover:opacity-70 text-xs" style={{ color: store.themeColor }}>
                  {showFullDescription ? 'see less' : 'see more'}
                </button>
              )}
            </p>
          </div>

          {(hasColors || hasTypes || hasSizes) && (
            <div className="border-t border-b border-gray-100 py-4 md:py-6 mb-6 md:mb-8 space-y-4">
              {hasColors && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Select Color
                    {selectedColor && <span className="ml-2 normal-case font-medium" style={{ color: store.themeColor }}>— {selectedColor}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.color_options!.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={`px-3 md:px-4 py-2 text-xs md:text-sm border transition-colors ${selectedColor === color ? 'text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                        style={variantBtnStyle(selectedColor === color)}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasTypes && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Select Type
                    {selectedType && <span className="ml-2 normal-case font-medium" style={{ color: store.themeColor }}>— {selectedType}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.type_options!.map(type => (
                      <button key={type} onClick={() => setSelectedType(type)}
                        className={`px-3 md:px-4 py-2 text-xs md:text-sm border transition-colors ${selectedType === type ? 'text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                        style={variantBtnStyle(selectedType === type)}>
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {hasSizes && (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
                    Select Size
                    {selectedSize && <span className="ml-2 normal-case font-medium" style={{ color: store.themeColor }}>— {selectedSize}</span>}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(product as any).size_options.map((size: string) => (
                      <button key={size} onClick={() => setSelectedSize(size)}
                        className={`px-3 md:px-4 py-2 text-xs md:text-sm border transition-colors ${selectedSize === size ? 'text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                        style={variantBtnStyle(selectedSize === size)}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-b border-gray-100 py-4 md:py-6 mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-xs uppercase tracking-wider text-gray-500">Quantity</span>
              <div className="flex items-center border border-gray-300">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-gray-100"><Minus size={14} /></button>
                <span className="w-10 text-center text-sm">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-gray-100"><Plus size={14} /></button>
              </div>
            </div>
            <button onClick={handleAddToCart}
              className="w-full text-white py-3 md:py-4 text-xs tracking-[0.2em] hover:opacity-90 flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: addedToCart ? '#16a34a' : store.themeColor }}>
              <ShoppingBag size={16} />
              {addedToCart ? 'ADDED TO BAG ✓' : 'ADD TO BAG'}
            </button>
          </div>

          <div>
            <h3 className="text-base md:text-lg font-light mb-4 md:mb-6 border-b pb-2">Customer Reviews</h3>
            {loadingReviews ? (
              <p className="text-xs text-gray-400">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No reviews yet.</p>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="bg-gray-50 p-3 md:p-4 rounded-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm" style={{ color: store.themeColor }}>{review.reviewer_name}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 leading-relaxed">{review.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <div className="border-t border-gray-100 py-10">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <h2 className="text-xs tracking-[0.25em] uppercase mb-6" style={{ color: store.themeColor }}>
              You Might Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {suggestedProducts.map(p => (
                <div key={p.id} onClick={() => onNavigateToProduct(p)} className="cursor-pointer group">
                  <div className="aspect-square bg-gray-100 overflow-hidden mb-2 relative">
                    <img src={p.images?.[0] || p.image_url} alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <p className="text-xs font-light truncate" style={{ color: store.themeColor }}>{p.name}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: store.themeColor }}>₦{p.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <button onClick={() => setIsCartOpen(true)}
        className="fixed bottom-8 right-8 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:opacity-90 transition-transform hover:scale-105 z-40"
        style={{ backgroundColor: store.themeColor }}>
        <ShoppingBag size={24} />
        {cartItemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white font-bold">
            {cartItemCount}
          </span>
        )}
      </button>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cart}
        onUpdateQuantity={onUpdateQuantity} onRemove={onRemoveFromCart} onCheckout={handleCheckout} />
    </div>
  );
}