import { CreditCard, PieChart, ArrowRight } from 'lucide-react';

interface PaymentPlanStepProps {
  paymentMode: 'full' | 'installment';
  setPaymentMode: (mode: 'full' | 'installment') => void;
  totalOrderAmount: number;
  payableAmount: number;
  remainingBalance: number;
  handlePlanSelection: () => void;
  themeColor?: string;
}

export default function PaymentPlanStep({
  paymentMode,
  setPaymentMode,
  totalOrderAmount,
  payableAmount,
  remainingBalance,
  handlePlanSelection,
  themeColor = '#0d2818'
}: PaymentPlanStepProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <p className="text-xs uppercase text-gray-500 font-bold mb-4">Select Payment Plan</p>
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => setPaymentMode('full')}
            className={`p-4 border rounded-lg text-center transition-all ${
              paymentMode === 'full' 
                ? 'ring-2 ring-offset-2' 
                : 'hover:border-gray-400'
            }`}
            style={paymentMode === 'full' ? { borderColor: themeColor, ringColor: themeColor } : {}}
          >
            <div className="flex justify-center mb-2">
               <CreditCard size={24} style={{ color: paymentMode === 'full' ? themeColor : '#9ca3af' }} />
            </div>
            <p className="font-bold text-sm">Pay Full</p>
            <p className="text-xs text-gray-500 mt-1">₦{totalOrderAmount.toLocaleString()}</p>
          </button>

          <button 
            onClick={() => setPaymentMode('installment')}
            className={`p-4 border rounded-lg text-center transition-all ${
              paymentMode === 'installment' 
                ? 'ring-2 ring-offset-2' 
                : 'hover:border-gray-400'
            }`}
            style={paymentMode === 'installment' ? { borderColor: themeColor, ringColor: themeColor } : {}}
          >
            <div className="flex justify-center mb-2">
               <PieChart size={24} style={{ color: paymentMode === 'installment' ? themeColor : '#9ca3af' }} />
            </div>
            <p className="font-bold text-sm">Pay Half</p>
            <p className="text-xs text-gray-500 mt-1">₦{Math.ceil(totalOrderAmount/2).toLocaleString()}</p>
          </button>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-100">
         <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Due Now:</span>
            <span className="text-xl font-bold" style={{ color: themeColor }}>
               ₦{payableAmount.toLocaleString()}
            </span>
         </div>
         {paymentMode === 'installment' && (
            <p className="text-[10px] text-gray-500 mt-2 text-right">
               Balance of ₦{remainingBalance.toLocaleString()} due before delivery.
            </p>
         )}
      </div>

      <button 
        onClick={handlePlanSelection}
        className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-2"
        style={{ backgroundColor: themeColor }}
      >
        PROCEED TO PAYMENT <ArrowRight size={16} />
      </button>
    </div>
  );
}
