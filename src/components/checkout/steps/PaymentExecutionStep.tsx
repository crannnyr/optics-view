import { PaystackButton } from 'react-paystack';
import { CreditCard, ShieldCheck, AlertTriangle, Smartphone, CheckCircle, Copy, Loader2 } from 'lucide-react';

// The bank account name on file sometimes displays differently depending on
// the sender's banking app cache — both of these are valid and correspond
// to the same business account. Same warning used in the retailer flow.
const VALID_ACCOUNT_NAMES = ['OpticsView', 'Nnebedum Joshua'];

interface PaymentExecutionStepProps {
  paymentMethod: 'paystack' | 'transfer';
  paystackConfig: any;
  payableAmount: number;
  transferDetails: { bank: string; number: string; name: string };
  senderName: string;
  setSenderName: (name: string) => void;
  copied: boolean;
  loading: boolean;
  themeColor?: string;
  handlePaystackSuccess: (reference: any) => void;
  handlePaystackClose: () => void;
  handleCopyAccount: () => void;
  handleTransferComplete: () => void;
}

export default function PaymentExecutionStep({
  paymentMethod,
  paystackConfig,
  payableAmount,
  transferDetails,
  senderName,
  setSenderName,
  copied,
  loading,
  themeColor = '#0d2818',
  handlePaystackSuccess,
  handlePaystackClose,
  handleCopyAccount,
  handleTransferComplete
}: PaymentExecutionStepProps) {
  return (
    <div className="animate-in fade-in zoom-in-95 duration-300">
      {paymentMethod === 'paystack' && paystackConfig ? (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
            <CreditCard size={32} />
          </div>
          <div>
            <h3 className="text-lg font-medium">Complete Card Payment</h3>
            <p className="text-sm text-gray-500 mt-1">
              Click the button below to launch the secure payment window.
            </p>
            <p className="text-xs text-amber-600 mt-2">
              If you close the payment window your order will be cancelled — you can retry from this screen.
            </p>
          </div>

          {/* Wrapper forces correct styles since PaystackButton strips custom style prop */}
          <div
            className="w-full rounded shadow-lg overflow-hidden"
            style={{ backgroundColor: themeColor }}
          >
            <PaystackButton
              {...paystackConfig}
              onSuccess={handlePaystackSuccess}
              onClose={handlePaystackClose}
              className="w-full py-4 text-sm font-bold tracking-widest hover:opacity-90 transition-opacity"
              style={{ backgroundColor: 'transparent', color: '#ffffff', width: '100%', border: 'none', cursor: 'pointer' }}
              text={`PAY NOW — ₦${payableAmount.toLocaleString()}`}
            />
          </div>

          <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
            <ShieldCheck size={12} />
            SECURED BY PAYSTACK
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex gap-3">
            <AlertTriangle className="text-orange-600 shrink-0" size={20} />
            <div>
              <h4 className="text-sm font-bold text-orange-800 uppercase">Warning</h4>
              <p className="text-xs text-orange-800 mt-1">
                Fake receipts or fraudulent transfer attempts will result in an immediate and permanent account ban.
              </p>
            </div>
          </div>

          <div className="bg-gray-900 text-white p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Smartphone size={100} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Transfer Details</p>

            <div className="space-y-4 relative z-10">
              <div>
                <p className="text-[10px] text-gray-400">BANK NAME</p>
                <p className="text-lg font-medium">{transferDetails.bank}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">ACCOUNT NUMBER</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-mono font-bold tracking-wider">{transferDetails.number}</p>
                  <button
                    onClick={handleCopyAccount}
                    className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    {copied
                      ? <CheckCircle size={16} className="text-green-400" />
                      : <Copy size={16} />
                    }
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-gray-400">ACCOUNT NAME</p>
                <p className="text-lg font-medium">{transferDetails.name}</p>
              </div>
            </div>
          </div>

          {/* Account name mismatch warning — bank apps can show either name */}
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">
                The account name on your banking app may show as either{' '}
                <strong>{VALID_ACCOUNT_NAMES[0]}</strong> or <strong>{VALID_ACCOUNT_NAMES[1]}</strong> —
                both are correct and belong to us. <strong>Do not send</strong> if the name shown
                doesn't match either of these.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase text-gray-500 mb-2">
              Sender Name (name on your bank account) *
            </label>
            <input
              type="text"
              value={senderName}
              onChange={e => setSenderName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-bold mb-2">Amount to Transfer</p>
            <p className="text-3xl font-light" style={{ color: themeColor }}>
              ₦{payableAmount.toLocaleString()}
            </p>
          </div>

          <button
            onClick={handleTransferComplete}
            disabled={loading || !senderName.trim()}
            className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: themeColor }}
          >
            {loading
              ? <Loader2 className="animate-spin" size={16} />
              : <CheckCircle size={16} />
            }
            I HAVE MADE THE TRANSFER
          </button>
        </div>
      )}
    </div>
  );
}
