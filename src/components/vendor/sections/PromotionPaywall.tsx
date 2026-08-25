import { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import { Check, Loader2, TrendingUp, Package, BarChart3, Sparkles } from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';
import { useVendorPromotion } from '../hooks/useVendorPromotion';

interface PromotionPaywallProps {
  vendor: VendorAccount;
  rules: VendorProgramRules;
  userEmail: string;
  themeColor: string;
  pendingProductCount: number;
  onActivated: () => void;
}

export default function PromotionPaywall({
  vendor, rules, userEmail, themeColor, pendingProductCount, onActivated,
}: PromotionPaywallProps) {
  const { paystackConfig, preparing, preparePayment, confirmPayment } = useVendorPromotion(vendor, rules);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savings = rules.promo_list_price - rules.promo_intro_price;
  const discountPct = Math.round((savings / rules.promo_list_price) * 100);

  const included = [
    { icon: <TrendingUp size={15} />, title: 'Top placement for a month', body: `Your products get pushed to the top where shoppers actually see them — for ${rules.promo_duration_days} days.` },
    { icon: <Package size={15} />, title: 'Free packaging materials, monthly', body: 'We send you branded packaging every month so your orders go out looking professional. No extra charge.' },
    { icon: <BarChart3 size={15} />, title: 'Full performance tracking', body: 'Views, units sold, and how many retailers are reselling you — live from your dashboard.' },
  ];

  const handleSuccess = async (ref: any) => {
    setVerifying(true);
    setError(null);
    const ok = await confirmPayment(ref.reference);
    setVerifying(false);
    if (ok) onActivated();
    else setError("Payment went through but we couldn't activate the campaign. Please contact support with your reference.");
  };

  return (
    <div className="max-w-2xl">
      <div className="rounded-2xl border-2 overflow-hidden" style={{ borderColor: themeColor }}>
        <div className="px-6 py-5 text-white" style={{ backgroundColor: themeColor }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={15} />
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold">The Sold Out Campaign</p>
          </div>
          <h2 className="text-xl md:text-2xl font-light leading-snug">
            Every vendor here starts with the Sold Out Campaign
          </h2>
          <p className="text-xs text-white/70 mt-2 leading-relaxed">
            It's how you bag your first sell-out. We push to move at least{' '}
            {rules.promo_target_units} units of your product in your first month —
            and {rules.promo_vendor_count}+ vendors have already started this way.
          </p>
        </div>

        <div className="p-6 space-y-5 bg-white">
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-gray-900">₦{rules.promo_intro_price.toLocaleString()}</span>
              <span className="text-base text-gray-400 line-through">₦{rules.promo_list_price.toLocaleString()}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-green-100 text-green-700 mb-1">
              Save ₦{savings.toLocaleString()} · {discountPct}% off
            </span>
          </div>
          <p className="text-xs text-gray-500 -mt-3">
            Intro rate for your first campaign. Renews at the standard ₦{rules.promo_list_price.toLocaleString()}/month.
          </p>

          <div className="space-y-3 pt-2">
            {included.map(item => (
              <div key={item.title} className="flex gap-3">
                <div className="shrink-0 mt-0.5" style={{ color: themeColor }}>{item.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{item.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600 flex gap-2">
            <Check size={14} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
            {pendingProductCount > 0
              ? `Your ${pendingProductCount} saved product${pendingProductCount > 1 ? 's go' : ' goes'} to our team for review as soon as this payment clears.`
              : 'Your campaign starts the moment this payment clears.'}
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

          {verifying ? (
            <div className="w-full py-3.5 flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 size={15} className="animate-spin" /> Activating your campaign...
            </div>
          ) : paystackConfig ? (
            <PaystackButton
              {...paystackConfig}
              text={`Pay ₦${rules.promo_intro_price.toLocaleString()} & Start My Campaign`}
              onSuccess={handleSuccess}
              onClose={() => setError('Payment was cancelled. Your product is saved — you can pay whenever you\'re ready.')}
              className="w-full text-white py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
              style={{ backgroundColor: themeColor }}
            />
          ) : (
            <button
              onClick={async () => {
                setError(null);
                const result = await preparePayment(userEmail);
                if (!result) setError('Could not start the payment. Please try again.');
              }}
              disabled={preparing}
              className="w-full text-white py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColor }}
            >
              {preparing && <Loader2 size={15} className="animate-spin" />}
              {preparing ? 'Preparing...' : `Pay ₦${rules.promo_intro_price.toLocaleString()} & Start My Campaign`}
            </button>
          )}

          <p className="text-[11px] text-gray-400 text-center">Secure card payment via Paystack.</p>
        </div>
      </div>
    </div>
  );
}
