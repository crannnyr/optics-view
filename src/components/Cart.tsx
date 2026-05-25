import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../lib/supabase';
import { useStore } from '../context/StoreContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number, selectedColor?: string, selectedType?: string) => void;
  onRemove: (id: string, selectedColor?: string, selectedType?: string) => void;
  onCheckout: () => void;
}

export default function Cart({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
}: CartProps) {
  const { store } = useStore();

  if (!isOpen) return null;

  // Wholesale only applies on the main store, never on retailer stores
  const wholesaleEnabled = !store.isRetailer;

  const subtotal = items.reduce((sum, item) => {
    const isWholesale = wholesaleEnabled && item.quantity >= 7 && item.product.wholesale_price;
    const priceToUse = isWholesale ? item.product.wholesale_price! : item.product.price;
    return sum + (priceToUse * item.quantity);
  }, 0);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const calculateShipping = (count: number) => {
    if (count === 0) return 0;
    if (count <= 5) return 4950;
    if (count <= 30) return 7800;
    if (count <= 100) return 10000;
    return 15000;
  };

  const shippingFee = calculateShipping(totalItems);
  const total = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-light tracking-wide text-[#0d2818]">your bag ({totalItems})</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="text-xs tracking-widest">your bag is empty</p>
            </div>
          ) : (
            items.map((item) => {
              const itemKey = `${item.product.id}-${item.selectedColor ?? ''}-${item.selectedType ?? ''}`;
              const isWholesale = wholesaleEnabled && item.quantity >= 7 && item.product.wholesale_price;

              return (
                <div key={itemKey} className="flex gap-4">
                  <div className="w-20 h-20 bg-gray-50 shrink-0">
                    <img
                      src={item.product.images?.[0] || item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-sm font-medium text-[#0d2818]">{item.product.name}</h3>
                        <p className="text-sm font-medium">
                          ₦{(isWholesale ? item.product.wholesale_price! : item.product.price).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.product.description}</p>

                      {(item.selectedColor || item.selectedType) && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedColor && (
                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                              {item.selectedColor}
                            </span>
                          )}
                          {item.selectedType && (
                            <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700">
                              {item.selectedType}
                            </span>
                          )}
                        </div>
                      )}

                      {isWholesale && (
                        <p className="text-[10px] text-green-700 font-medium mt-1">Wholesale Discount Applied</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1, item.selectedColor, item.selectedType)}
                          className="p-1 hover:bg-gray-50"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-xs">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1, item.selectedColor, item.selectedType)}
                          className="p-1 hover:bg-gray-50"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => onRemove(item.product.id, item.selectedColor, item.selectedType)}
                        className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2"
                      >
                        remove
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && (
          <div className="p-6 bg-gray-50 border-t border-gray-100 space-y-4">
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping ({totalItems} items)</span>
                <span>₦{shippingFee.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex justify-between text-lg font-medium text-[#0d2818] pt-4 border-t border-gray-200">
              <span>Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>

            <button
              onClick={onCheckout}
              className="w-full bg-[#0d2818] text-white py-4 text-xs tracking-[0.2em] hover:bg-[#1a3d28] transition-colors"
            >
              PROCEED TO CHECKOUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
