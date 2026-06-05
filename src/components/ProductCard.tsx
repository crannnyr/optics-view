import { Product } from '../../lib/supabase';
import { ShoppingBag, Star } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onViewDetails: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onViewDetails }: ProductCardProps) {
  const displayImage = product.images?.[0] || product.image_url;

  const calculateDiscount = () => {
    if (!product.wholesale_price) return 0;
    return Math.round(((product.price - product.wholesale_price) / product.price) * 100);
  };

  return (
    <div className="group">
      <div
        className="relative overflow-hidden bg-gray-50 mb-4 cursor-pointer"
        onClick={() => onAddToCart(product)}
      >
        <img
          src={displayImage}
          alt={product.name}
          className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
          // Only download this image when it's about to enter the viewport.
          // Prevents all product images competing with the hero on first load.
          loading="lazy"
          decoding="async"
        />

        {/* Wholesale Badge */}
        {product.wholesale_price && (
          <div className="absolute top-2 left-2 bg-[#0d2818] text-white text-[10px] px-2 py-1 tracking-wider">
            -{calculateDiscount()}% WHOLESALE
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white text-[#0d2818] px-4 py-2 text-xs tracking-widest flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
            <ShoppingBag size={14} />
            ADD TO CART
          </div>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-sm font-medium tracking-wide text-[#0d2818] mb-1">
          {product.name}
        </h3>

        <div className="mb-3 flex items-center justify-center gap-2">
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ₦{product.compare_at_price.toLocaleString()}
            </span>
          )}
          <p className="text-xs text-gray-900 font-light">
            ₦{product.price.toLocaleString()}
          </p>
        </div>

        {product.wholesale_price && (
          <p className="text-[10px] text-green-700 mb-2">
            (Bulk: ₦{product.wholesale_price.toLocaleString()})
          </p>
        )}

        <button
          onClick={() => onViewDetails(product)}
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-gray-400 hover:text-[#0d2818] border-b border-transparent hover:border-[#0d2818] pb-0.5 transition-colors"
        >
          <Star size={10} className="fill-current" />
          See Reviews
        </button>
      </div>
    </div>
  );
}
