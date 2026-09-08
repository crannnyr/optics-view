import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { Product } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';

interface CompactProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
}

// Smaller sibling of ProductCard, built for horizontal sliders (Trending Now,
// Under ₦X). No add-to-cart button or image carousel — tapping goes straight
// to product details, keeping each card lightweight so more fit on screen.
export default function CompactProductCard({ product, onViewDetails }: CompactProductCardProps) {
  const { store } = useStore();
  const [imgError, setImgError] = useState(false);
  const image = product.images?.[0] || product.image_url;

  return (
    <button
      onClick={() => onViewDetails(product)}
      className="group w-32 sm:w-40 shrink-0 text-left"
    >
      <div className="relative bg-gray-100 mb-2 overflow-hidden aspect-square rounded-lg">
        {!imgError && image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageOff size={20} />
          </div>
        )}
      </div>
      <p
        className="text-[11px] leading-tight text-gray-700 mb-1"
        title={product.name}
        style={{ minHeight: '2.4em' }}
      >
        <span className="line-clamp-2">{product.name}</span>
      </p>
      <p className="text-sm font-semibold" style={{ color: store.themeColor }}>
        ₦{Number(product.price).toLocaleString()}
      </p>
    </button>
  );
}
