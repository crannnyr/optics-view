import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ShoppingBag, ImageOff } from 'lucide-react';
import { Product, supabase } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
  isSponsored?: boolean;
}

function formatSoldCount(count: number): string {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return count.toLocaleString();
}

export default function ProductCard({ product, onAddToCart, onViewDetails, isSponsored = false }: ProductCardProps) {
  const { store } = useStore();
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [imgError, setImgError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const images = product.images && product.images.length > 0
    ? product.images.slice(0, 5)
    : [product.image_url];

  const isPopular = product.units_sold >= 1000;

  useEffect(() => { setImgError(false); }, [currentImageIdx]);

  // Fire once per mount when this card is showing as sponsored — approximates
  // an "impression". Fire-and-forget: shopper's experience never waits on it,
  // and a failure here shouldn't be visible to them.
  useEffect(() => {
    if (isSponsored) {
      supabase.rpc('record_ad_impression', { p_product_id: product.id }).then(() => {}, () => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSponsored, product.id]);

  const handleViewDetails = () => {
    if (isSponsored) {
      supabase.rpc('record_ad_click', { p_product_id: product.id }).then(() => {}, () => {});
    }
    onViewDetails(product);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div ref={cardRef} className="group bg-white border border-gray-100 rounded-lg overflow-hidden flex flex-col">
      <div
        onClick={handleViewDetails}
        className="relative bg-gray-100 overflow-hidden cursor-pointer aspect-square"
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
            <ImageOff size={28} />
            <span className="text-[9px] mt-2 tracking-wider">Image unavailable</span>
          </div>
        )}

        {/* Popular indicator — small static tag, top-left corner. No animation,
            kept minimal so it reads as a quiet signal rather than a banner. */}
        {isPopular && (
          <div className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm">
            Trending
          </div>
        )}

        {isSponsored && (
          <div className="absolute top-2 right-2 bg-white/90 text-gray-500 text-[8px] font-medium tracking-wider uppercase px-1.5 py-0.5 rounded-sm border border-gray-200">
            Sponsored
          </div>
        )}

        {!!product.import_fee_tier_id && (
          <div className={`absolute ${isPopular ? 'top-8' : 'top-2'} left-2 bg-red-50 text-red-600 text-[8px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-sm`}>
            🇨🇳 Import
          </div>
        )}

        <div
          className="absolute bottom-1.5 right-1.5 bg-white/95 px-1.5 py-1 text-[7px] tracking-[0.15em] font-light rounded-sm"
          style={{ color: store.themeColor }}
        >
          {store.name.toUpperCase()}
        </div>

        {images.length > 1 && !imgError && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
            >
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-1.5 left-1.5 flex gap-1">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className="w-1 h-1 rounded-full transition-colors"
                  style={{ backgroundColor: idx === currentImageIdx ? store.themeColor : 'rgba(255,255,255,0.6)' }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="p-2.5 flex flex-col flex-1">
        {/* Fixed two-line height (leading-tight * 2 lines) so every card in a
            row lands the same height regardless of name length — short
            names leave a little empty space, long ones wrap to two lines
            and clip with an ellipsis rather than overflowing the card. */}
        <h3
          onClick={handleViewDetails}
          title={product.name}
          className="text-[11px] leading-tight text-gray-700 cursor-pointer hover:opacity-70 line-clamp-2 mb-1.5"
          style={{ minHeight: '2.4em' }}
        >
          {product.name}
        </h3>

        <p className="text-sm font-semibold mb-0.5" style={{ color: store.themeColor }}>
          ₦{product.price.toLocaleString()}
        </p>

        <p className={`text-[10px] mb-2.5 ${isPopular ? 'text-amber-500 font-medium' : 'text-gray-400'}`}>
          {formatSoldCount(product.units_sold)} sold
        </p>

        <button
          onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
          className="mt-auto w-full text-white py-2 text-[10px] tracking-wider rounded-full hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
          style={{ backgroundColor: store.themeColor }}
        >
          <ShoppingBag size={11} />
          ADD TO CART
        </button>
      </div>
    </div>
  );
}
