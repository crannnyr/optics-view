import { X } from 'lucide-react';

interface CheckoutHeaderProps {
  step: 1 | 2 | 3;
  paymentMethod: 'paystack' | 'transfer';
  themeColor?: string;
  loading: boolean;
  onClose: () => void;
}

export default function CheckoutHeader({
  step,
  paymentMethod,
  themeColor = '#0d2818',
  loading,
  onClose
}: CheckoutHeaderProps) {
  const titles: Record<1 | 2 | 3, string> = {
    1: 'SHIPPING DETAILS',
    2: 'SELECT PAYMENT METHOD',
    3: paymentMethod === 'paystack' ? 'CARD PAYMENT' : 'TRANSFER DETAILS',
  };

  return (
    <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
      <div>
        <h2 className="text-lg font-light tracking-wider uppercase" style={{ color: themeColor }}>
          {titles[step]}
        </h2>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gray-800' : 'bg-gray-200'}`}
              style={i <= step ? { backgroundColor: themeColor } : {}}
            />
          ))}
        </div>
      </div>
      <button
        onClick={onClose}
        disabled={loading}
        className="text-gray-400 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <X size={24} />
      </button>
    </div>
  );
}