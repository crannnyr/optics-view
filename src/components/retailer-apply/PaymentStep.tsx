import { useState } from 'react';
import { Loader2, Building2, Copy, CheckCircle, AlertTriangle, ArrowLeft, Clock, RefreshCw, Zap, XCircle } from 'lucide-react';
import { PaystackButton } from 'react-paystack';
import { supabase } from '../../lib/supabase';

type ManualState = 'warning' | 'details' | 'sent';

// The bank account name on file sometimes displays differently depending on
// the sender's banking app cache — both of these are valid and correspond
// to the same business account.
const VALID_ACCOUNT_NAMES = ['OpticsView', 'Nnebedum Joshua'];

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
  const [manualState, setManualState] = useState<ManualState>('warning');
  const [senderName, setSenderName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Paystack's popup calls onClose whenever it closes without a successful
  // charge — declined card, cancelled, network drop, etc. It doesn't tell us
  // which, so we show one clear, non-alarming message either way. The
  // registration row is untouched (still pending), so retrying just re-opens
  // the same reference.
  const [paymentFailed, setPaymentFailed] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePaystackPopupClosed = () => {
    setPaymentFailed(true);
    onPaystackClose();
  };

  const handleSent = async () => {
    if (!senderName.trim()) return;
    setSubmitting(true);
    await supabase
      .from('retailer_registrations')
      .update({ sender_name: senderName.trim(), payment_method: 'transfer' })
      .eq('email', formData.email)
      .eq('payment_status', 'pending');
    setSubmitting(false);
    setManualState('sent');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMsg('');
    const { data } = await supabase
      .from('retailer_registrations')
      .select('payment_status')
      .eq('email', formData.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.payment_status === 'verified') {
      window.location.href = '/retailer';
    } else {
      setStatusMsg('Payment not confirmed yet. Please wait a few more minutes and try again.');
    }
    setChecking(false);
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
        <div className="flex justify-between font-bold text-[#0d2818] border-t pt-3 text-base">
          <span>Total Due</span>
          <span>₦{totalDue.toLocaleString()}</span>
        </div>
      </div>

      {/* Payment mode toggle — Paystack flagged as the fastest option */}
      {bothEnabled && (
        <div className="flex gap-3 mb-2">
          <button
            onClick={() => { setPaymentMode('paystack'); setManualState('warning'); }}
            className={`relative flex-1 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
              paymentMode === 'paystack'
                ? 'border-[#0d2818] bg-[#0d2818] text-white'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <span
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full ${
                paymentMode === 'paystack' ? 'bg-amber-400 text-[#0d2818]' : 'bg-amber-100 text-amber-700'
              }`}
            >
              <Zap size={9} className="fill-current" /> FASTEST
            </span>
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
      {bothEnabled && (
        <p className="text-[11px] text-gray-400 text-center mb-6">
          Card payment activates your store instantly. Bank transfer requires manual review.
        </p>
      )}
      {!bothEnabled && <div className="mb-6" />}

      {/* ── PAYSTACK ─────────────────────────────────────────── */}
      {paymentMode === 'paystack' && paymentSettings.enable_paystack && paystackConfig && (
        <>
          {paymentFailed && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mb-4 flex items-start gap-2.5">
              <XCircle size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Payment didn't go through</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Your registration is still saved — nothing was charged. Please try again below.
                </p>
              </div>
            </div>
          )}

          <PaystackButton
            {...paystackConfig}
            text={loading ? 'PROCESSING...' : `PAY ₦${totalDue.toLocaleString()}`}
            onSuccess={(ref: any) => { setPaymentFailed(false); onPaystackSuccess(ref); }}
            onClose={handlePaystackPopupClosed}
            className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded-lg transition-opacity disabled:opacity-50 mb-3"
            disabled={loading}
          />
          <p className="text-center text-xs text-gray-400">
            🔒 Secured by Paystack · Redirected to dashboard on success
          </p>
        </>
      )}

      {/* ── TRANSFER ─────────────────────────────────────────── */}
      {paymentMode === 'transfer' && paymentSettings.enable_transfer && (
        <>
          {/* WARNING STATE */}
          {manualState === 'warning' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={20} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900 mb-2">Read before proceeding</p>
                    <ul className="text-sm text-amber-800 space-y-1.5">
                      <li>• Only proceed if you are <strong>ready to transfer right now</strong></li>
                      <li>• Submitting a fake or unverifiable transaction will result in a <strong>permanent account ban</strong></li>
                      <li>• If you are not ready, click the back button and return when you are</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPaymentMode('paystack')}
                  className="flex-1 py-3 border-2 border-gray-200 text-sm text-gray-600 rounded-lg hover:border-gray-300 flex items-center justify-center gap-2"
                >
                  <ArrowLeft size={14} /> Go Back
                </button>
                <button
                  onClick={() => setManualState('details')}
                  className="flex-1 py-3 bg-[#0d2818] text-white text-sm font-medium rounded-lg hover:opacity-90"
                >
                  I'm Ready — Show Details
                </button>
              </div>
            </div>
          )}

          {/* DETAILS STATE */}
          {manualState === 'details' && (
            <div className="space-y-4">
              <div className="bg-[#0d2818] text-white rounded-lg p-5 space-y-4">
                <p className="text-xs uppercase tracking-widest text-white/60 mb-2">Transfer To</p>
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
                <label className="block text-xs uppercase text-gray-500 mb-1.5">
                  Sender Name (name on your bank account) *
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
                />
              </div>

              <button
                onClick={handleSent}
                disabled={!senderName.trim() || submitting}
                className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                  : "I've Sent the Payment"
                }
              </button>
            </div>
          )}

          {/* SENT STATE */}
          {manualState === 'sent' && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                <CheckCircle size={32} className="mx-auto text-green-600 mb-3" />
                <p className="font-semibold text-green-900 mb-1">Transfer Submitted</p>
                <p className="text-sm text-green-800">
                  Our team will confirm your payment. This usually takes <strong>under 5 minutes</strong> during business hours.
                  Once confirmed, you will be automatically routed to your retailer dashboard.
                </p>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center gap-3">
                <Clock size={16} className="text-gray-400 shrink-0" />
                <p className="text-xs text-gray-500">
                  You can close this window and come back — your registration is safely saved.
                  Click "Check Status" anytime to see if you've been approved.
                </p>
              </div>

              {statusMsg && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  {statusMsg}
                </p>
              )}

              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="w-full border-2 border-[#0d2818] text-[#0d2818] py-4 text-sm font-medium rounded-lg hover:bg-[#0d2818] hover:text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {checking
                  ? <><Loader2 size={16} className="animate-spin" /> Checking...</>
                  : <><RefreshCw size={16} /> Check Status</>
                }
              </button>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="mt-5 flex items-center gap-2 justify-center text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Activating your store...
        </div>
      )}
    </div>
  );
}
