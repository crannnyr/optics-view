import { CreditCard, Smartphone, ArrowRight, Loader2 } from 'lucide-react';

interface PaymentMethodStepProps {
  payableAmount: number;
  settings: {
    enable_paystack: boolean;
    enable_transfer: boolean;
  };
  setPaymentMethod: (method: 'paystack' | 'transfer') => void;
  createOrder: (method: 'paystack' | 'transfer') => void;
  loading: boolean;
  themeColor?: string;
}

export default function PaymentMethodStep({
  payableAmount,
  settings,
  setPaymentMethod,
  createOrder,
  loading,
  themeColor = '#0d2818'
}: PaymentMethodStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <p className="text-center text-sm text-gray-600 mb-6">
        How would you like to pay <strong>₦{payableAmount.toLocaleString()}</strong>?
      </p>

      <div className="space-y-3">
         {settings.enable_transfer && (
            <button 
              onClick={() => { setPaymentMethod('transfer'); createOrder('transfer'); }}
              className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all hover:shadow-md"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                     <Smartphone size={20} />
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-sm">Instant Bank Transfer</p>
                     <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded mt-1">FASTEST</span>
                  </div>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>
         )}

         {settings.enable_paystack && (
            <button 
              onClick={() => { setPaymentMethod('paystack'); createOrder('paystack'); }}
              className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all hover:shadow-md"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                     <CreditCard size={20} />
                  </div>
                  <div className="text-left">
                     <p className="font-bold text-sm">Pay with Card</p>
                     <p className="text-[10px] text-gray-500">Secured by Paystack</p>
                  </div>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>
         )}
      </div>

      {loading && (
         <div className="text-center pt-4">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: themeColor }} />
            <p className="text-xs text-gray-500">Initializing order...</p>
         </div>
      )}
    </div>
  );
}
