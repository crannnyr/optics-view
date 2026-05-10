import { X } from 'lucide-react';

interface CheckoutHeaderProps {
  step: 1 | 2 | 3 | 4;
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
  return (
    <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-lg">
      <div>
        <h2 className="text-lg font-light tracking-wider uppercase" style={{ color: themeColor }}>
          {step === 1 && 'SHIPPING DETAILS'}
          {step === 2 && 'PAYMENT PLAN'}
          {step === 3 && 'SELECT METHOD'}
          {step === 4 && (paymentMethod === 'paystack' ? 'CARD PAYMENT' : 'TRANSFER DETAILS')}
        </h2>
        <div className="flex gap-1 mt-1">
          {[1, 2, 3, 4].map(i => (
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
