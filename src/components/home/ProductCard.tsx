import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, ImageOff } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

function formatSoldCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const { store } = useStore();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0
    ? product.images.slice(0, 5)
    : [product.image_url];

  const isPopular = product.units_sold >= 1000;

  useEffect(() => { setImgError(false); }, [currentImageIdx]);

  // Auto-shuffle disabled — was cycling every 5s regardless of interaction,
  // adding unnecessary re-renders/load. Manual arrows still work below.

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="group" ref={cardRef}>
      <div
        onClick={() => onViewDetails(product)}
        className="relative bg-gray-100 mb-4 overflow-hidden cursor-pointer aspect-square"
      >
        {!imgError ? (
          <img
            src={images[currentImageIdx]}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-300">
            <ImageOff size={32} />
            <span className="text-[10px] mt-2 tracking-wider">Image unavailable</span>
          </div>
        )}

        {/* Popular indicator — small static tag, top-left corner. No animation,
            kept minimal so it reads as a quiet signal rather than a banner. */}
        {isPopular && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm">
            Trending
          </div>
        )}

        <div
          className="absolute bottom-0 right-0 bg-white px-3 py-2.5 text-[8px] tracking-[0.2em] font-light border-l border-t border-gray-200"
          style={{ color: store.themeColor }}
        >
          {store.name.toUpperCase()}
        </div>

        {images.length > 1 && !imgError && (
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

      <div className="flex justify-between items-center gap-2">
        <div className="flex-1 text-left">
          <h3
            onClick={() => onViewDetails(product)}
            className="text-sm font-light mb-1 cursor-pointer hover:opacity-70"
            style={{ color: store.themeColor }}
          >
            {product.name}
          </h3>
          <p className="text-base font-medium" style={{ color: store.themeColor }}>
            ₦{product.price.toLocaleString()}
          </p>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className="text-white px-3 py-1.5 text-[10px] tracking-wider hover:opacity-90 transition-opacity flex items-center gap-1.5"
            style={{ backgroundColor: store.themeColor }}
          >
            <ShoppingBag size={12} />
            BUY
          </button>
          <span className={`text-[10px] ${isPopular ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
            {formatSoldCount(product.units_sold)} sold
          </span>
        </div>
      </div>
    </div>
  );
}