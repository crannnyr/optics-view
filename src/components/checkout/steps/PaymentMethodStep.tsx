import { CreditCard, Smartphone, ArrowRight, Loader2, Zap, RotateCcw } from 'lucide-react';

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
  isRetryMode?: boolean;
}

export default function PaymentMethodStep({
  payableAmount,
  settings,
  setPaymentMethod,
  createOrder,
  loading,
  themeColor = '#0d2818',
  isRetryMode = false
}: PaymentMethodStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {isRetryMode && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-800 text-xs rounded-lg p-3">
          <RotateCcw size={14} className="shrink-0" />
          <span>Resuming payment for your existing order — your shipping details are already saved.</span>
        </div>
      )}

      <p className="text-center text-sm text-gray-600 mb-6">
        How would you like to pay <strong>₦{payableAmount.toLocaleString()}</strong>?
      </p>

      <div className="space-y-3">
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
                     <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded mt-1">
                       <Zap size={9} className="fill-current" /> FASTEST
                     </span>
                     <p className="text-[10px] text-gray-500 mt-1">Secured by Paystack · instant confirmation</p>
                  </div>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>
         )}

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
                     <p className="font-bold text-sm">Bank Transfer</p>
                     <p className="text-[10px] text-gray-500 mt-1">Requires manual verification — usually under 5 minutes</p>
                  </div>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
            </button>
         )}
      </div>

      {loading && (
         <div className="text-center pt-4">
            <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: themeColor }} />
            <p className="text-xs text-gray-500">{isRetryMode ? 'Preparing payment...' : 'Initializing order...'}</p>
         </div>
      )}
    </div>
  );
}