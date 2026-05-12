import { Loader2, Building2, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';
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
  onPaystackSuccess: (ref: any) => void;
  onPaystackClose: () => void;
}

export default function PaymentStep({
  paystackConfig, loading, totalDue, formData,
  paymentMode, setPaymentMode, paymentSettings,
  transferDetails, onPaystackSuccess, onPaystackClose,
}: Props) {
  const bothEnabled = paymentSettings.enable_paystack && paymentSettings.enable_transfer;
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-8">
      <h2 className="text-2xl font-light text-[#0d2818] mb-1">Complete Payment</h2>
      <p className="text-sm text-gray-400 mb-6">
        Your registration is saved — complete payment to activate your store.
      </p>

      {/* Order recap */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6 space-y-2 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Store</span>
          <span className="font-medium text-[#0d2818]">{formData.storeName}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Email</span>
          <span className="font-mono text-xs">{formData.email}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Domain</span>
          <span className="text-xs font-medium">
            {formData.domainType === 'subdomain' ? 'opticsview.store/yourstore' : `.${formData.domainType}`}
          </span>
        </div>
        <div className="flex justify-between font-bold text-[#0d2818] border-t pt-3 text-base">
          <span>Total Due</span>
          <span>₦{totalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment mode toggle — only show if both enabled */}
      {bothEnabled && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setPaymentMode('paystack')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
              paymentMode === 'paystack'
                ? 'border-[#0d2818] bg-[#0d2818] text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Card / Paystack
          </button>
          <button
            onClick={() => setPaymentMode('transfer')}
            className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
              paymentMode === 'transfer'
                ? 'border-[#0d2818] bg-[#0d2818] text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            Bank Transfer
          </button>
        </div>
      )}

      {/* Paystack */}
      {paymentMode === 'paystack' && paymentSettings.enable_paystack && paystackConfig && (
        <>
          <PaystackButton
            {...paystackConfig}
            text={loading ? 'PROCESSING...' : `PAY ₦${totalDue.toLocaleString()}`}
            onSuccess={(ref: any) => onPaystackSuccess(ref)}
            onClose={onPaystackClose}
            className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50 mb-3"
            disabled={loading}
          />
          <p className="text-center text-xs text-gray-400">
            🔒 Secured by Paystack · You'll be redirected to your dashboard on success
          </p>
        </>
      )}

      {/* Bank Transfer */}
      {paymentMode === 'transfer' && paymentSettings.enable_transfer && (
        <div className="space-y-3">
          <div className="bg-[#0d2818] text-white rounded-lg p-5 space-y-4">
            <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Transfer Details</p>
            {[
              ['Bank', transferDetails.bank],
              ['Account Number', transferDetails.number],
              ['Account Name', transferDetails.name],
              ['Amount', `₦${totalDue.toLocaleString()}`],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-white/60">{label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-sm select-all">{value}</span>
                  {label === 'Account Number' && (
                    <button
                      onClick={() => handleCopy(value)}
                      className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {copied
                        ? <CheckCircle size={13} className="text-green-400" />
                        : <Copy size={13} />
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>After transferring:</strong> Send your receipt to us via WhatsApp or email.
              Your store will be reviewed and activated within <strong>24 hours</strong>.
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-5 flex items-center gap-2 justify-center text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Activating your store...
        </div>
      )}
    </div>
  );
}