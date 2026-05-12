import { Loader2, Building2 } from 'lucide-react';
import { PaystackButton } from 'react-paystack';

interface Props {
  paystackConfig: any;
  loading: boolean;
  totalDue: number;
  formData: { storeName: string; email: string; domainType: string };
  paymentMode: 'paystack' | 'transfer';
  setPaymentMode: (m: 'paystack' | 'transfer') => void;
  paymentSettings: { enable_paystack: boolean; enable_transfer: boolean };
  transferDetails: { bank: string; number: string; name: string };
  onPaystackSuccess: () => void;
  onPaystackClose: () => void;
}

export default function PaymentStep({
  paystackConfig, loading, totalDue, formData,
  paymentMode, setPaymentMode, paymentSettings,
  transferDetails, onPaystackSuccess, onPaystackClose,
}: Props) {
  const bothEnabled = paymentSettings.enable_paystack && paymentSettings.enable_transfer;

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-light text-[#0d2818] mb-2">Complete Payment</h2>
      <p className="text-sm text-gray-500 mb-6">Your registration is saved — complete payment to activate your store</p>

      {/* Order recap */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Store</span><span className="font-medium text-[#0d2818]">{formData.storeName}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Email</span><span className="font-mono text-xs">{formData.email}</span>
        </div>
        <div className="flex justify-between font-bold text-[#0d2818] border-t pt-2 text-base">
          <span>Total</span><span>₦{totalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment mode toggle */}
      {bothEnabled && (
        <div className="flex gap-3 mb-6">
          {paymentSettings.enable_paystack && (
            <button
              onClick={() => setPaymentMode('paystack')}
              className={`flex-1 py-3 text-sm font-medium rounded border-2 transition-all ${
                paymentMode === 'paystack' ? 'border-[#0d2818] bg-[#0d2818] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              Card / Paystack
            </button>
          )}
          {paymentSettings.enable_transfer && (
            <button
              onClick={() => setPaymentMode('transfer')}
              className={`flex-1 py-3 text-sm font-medium rounded border-2 transition-all ${
                paymentMode === 'transfer' ? 'border-[#0d2818] bg-[#0d2818] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              Bank Transfer
            </button>
          )}
        </div>
      )}

      {/* Paystack */}
      {paymentMode === 'paystack' && paymentSettings.enable_paystack && paystackConfig && (
        <PaystackButton
          {...paystackConfig}
          text={loading ? 'PROCESSING...' : `PAY ₦${totalDue.toLocaleString()}`}
          onSuccess={onPaystackSuccess}
          onClose={onPaystackClose}
          className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded disabled:opacity-50"
          disabled={loading}
        />
      )}

      {/* Transfer */}
      {paymentMode === 'transfer' && paymentSettings.enable_transfer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Building2 size={16} className="text-blue-700" />
            <p className="text-sm font-semibold text-blue-900">Transfer Details</p>
          </div>
          {[
            ['Bank', transferDetails.bank],
            ['Account Number', transferDetails.number],
            ['Account Name', transferDetails.name],
            ['Amount', `₦${totalDue.toLocaleString()}`],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-500">{label}</span>
              <span className="font-mono font-semibold text-[#0d2818] select-all">{value}</span>
            </div>
          ))}
          <p className="text-xs text-blue-700 mt-3 border-t border-blue-200 pt-3">
            After transferring, send your receipt to us for manual verification. Your store will be activated within 24 hours.
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-2 justify-center text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Processing registration...
        </div>
      )}
    </div>
  );
}
