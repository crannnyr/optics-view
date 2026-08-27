import { useState } from 'react';
import { CreditCard, Smartphone, ArrowRight, Loader2, Zap, RotateCcw, Building2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { SENDER_BANKS, SENDER_BANK_FINTECH_EXCEPTION } from '../hooks/useCheckout';

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
  senderBankName: string;
  setSenderBankName: (bank: string) => void;
}

export default function PaymentMethodStep({
  payableAmount,
  settings,
  setPaymentMethod,
  createOrder,
  loading,
  themeColor = '#0d2818',
  isRetryMode = false,
  senderBankName,
  setSenderBankName,
}: PaymentMethodStepProps) {
  // Gates the transfer path: the customer must pick which bank they're
  // sending FROM before we reveal our transfer details. If their bank isn't
  // on the preset commercial-bank list, they're pointed to Paystack instead.
  const [showBankSelect, setShowBankSelect] = useState(false);

  if (showBankSelect) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          onClick={() => setShowBankSelect(false)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-black"
        >
          <ArrowLeft size={12} /> Back
        </button>

        <div className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-700 mb-3">
            <Building2 size={22} />
          </div>
          <h3 className="text-base font-medium">Which bank are you transferring from?</h3>
          <p className="text-xs text-gray-500 mt-1">
            Select your bank to continue to transfer details.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 leading-relaxed">
            We only accept transfers from the banks listed here — <strong>commercial banks only, no fintech apps</strong>.
            If your bank isn't in the list, please use the Paystack (card) option below instead.
          </p>
        </div>

        <select
          value={senderBankName}
          onChange={e => setSenderBankName(e.target.value)}
          className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-black outline-none bg-white"
        >
          <option value="">Select your bank…</option>
          <option value={SENDER_BANK_FINTECH_EXCEPTION}>{SENDER_BANK_FINTECH_EXCEPTION}</option>
          {SENDER_BANKS.map(bank => (
            <option key={bank} value={bank}>{bank}</option>
          ))}
        </select>

        <button
          onClick={() => { setPaymentMethod('transfer'); createOrder('transfer'); }}
          disabled={!senderBankName || loading}
          className="w-full py-4 text-sm font-medium rounded-lg text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ backgroundColor: themeColor }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          Next
        </button>

        {settings.enable_paystack && (
          <p className="text-center text-xs text-gray-400">
            Don't see your bank?{' '}
            <button
              onClick={() => { setShowBankSelect(false); setPaymentMethod('paystack'); createOrder('paystack'); }}
              className="underline hover:text-black"
            >
              Pay with card via Paystack instead
            </button>
          </p>
        )}
      </div>
    );
  }

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
              onClick={() => setShowBankSelect(true)}
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