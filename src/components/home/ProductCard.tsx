import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from 'lucide-react';
import { supabase, Product, Review } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { store } = useStore();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const descriptionRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0 
    ? product.images.slice(0, 5)
    : [product.image_url];

  // Auto-slide image carousel
  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentImageIdx((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // Fetch product reviews
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

  // Handle clicking outside the expanded description
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (descriptionRef.current && !descriptionRef.current.contains(e.target as Node)) {
        setShowFullDescription(false);
      }
    };

    if (showFullDescription) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        className="relative bg-gray-100 mb-4 overflow-hidden cursor-pointer aspect-square"
      >
        <img
          src={images[currentImageIdx]}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

          {/* Inline Reviews */}
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
