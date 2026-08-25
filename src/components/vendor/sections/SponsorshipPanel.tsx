import { useState } from 'react';
import { PaystackButton } from 'react-paystack';
import { Loader2, TrendingUp, Search, EyeOff, CheckCircle2 } from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';
import { useVendorSponsorship } from '../hooks/useVendorSponsorship';

interface SponsorshipPanelProps {
  vendor: VendorAccount;
  rules: VendorProgramRules;
  userEmail: string;
  themeColor: string;
}

export default function SponsorshipPanel({ vendor, rules, userEmail, themeColor }: SponsorshipPanelProps) {
  const { sponsorship, loading, paystackConfig, preparing, preparePayment, confirmPayment } =
    useVendorSponsorship(vendor, rules);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysLeft = sponsorship?.ends_at
    ? Math.max(0, Math.ceil((new Date(sponsorship.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleSuccess = async (ref: any) => {
    setVerifying(true);
    const ok = await confirmPayment(ref.reference);
    setVerifying(false);
    if (!ok) setError("Payment went through but we couldn't activate it. Contact support with your reference.");
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  if (sponsorship) {
    return (
      <div className="max-w-md rounded-xl border-2 border-green-200 bg-green-50 p-6">
        <CheckCircle2 size={22} className="text-green-600 mb-3" />
        <h2 className="text-base font-semibold text-green-900 mb-1">Sponsorship active</h2>
        <p className="text-sm text-green-800">
          {daysLeft} day{daysLeft === 1 ? '' : 's'} left. Your products are being surfaced ahead of
          others in listings and alongside related items.
        </p>
      </div>
    );
  }

  const benefits = [
    { icon: <TrendingUp size={15} />, title: 'Top of the listings', body: 'Your products rank above non-sponsored ones in category and browse pages.' },
    { icon: <Search size={15} />, title: 'Surfaced alongside related items', body: 'When shoppers view something similar, your product gets suggested next to it.' },
    { icon: <EyeOff size={15} />, title: 'No "Sponsored" label', body: 'Shoppers never see an ad tag. Your product simply appears where they\'re already looking.' },
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">Sponsor your products</h2>
        <p className="text-sm text-gray-500">
          Keep your products in front of shoppers after your intro campaign ends.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-semibold text-gray-900">₦{rules.sponsorship_price.toLocaleString()}</span>
          <span className="text-sm text-gray-400">/ {rules.sponsorship_duration_days} days</span>
        </div>

        <div className="space-y-3">
          {benefits.map(b => (
            <div key={b.title} className="flex gap-3">
              <div className="shrink-0 mt-0.5" style={{ color: themeColor }}>{b.icon}</div>
              <div>
                <p className="text-sm font-medium text-gray-800">{b.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{b.body}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-gray-400">
          Applies to every product you currently have live.
        </p>

        {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

        {verifying ? (
          <div className="w-full py-3 flex items-center justify-center gap-2 text-sm text-gray-500">
            <Loader2 size={15} className="animate-spin" /> Activating...
          </div>
        ) : paystackConfig ? (
          <div className="rounded-full overflow-hidden" style={{ backgroundColor: themeColor }}>
          <PaystackButton
            {...paystackConfig}
            text={`Pay ₦${rules.sponsorship_price.toLocaleString()}`}
            onSuccess={handleSuccess}
            onClose={() => setError('Payment was cancelled.')}
            className="w-full text-white py-3 text-sm font-semibold hover:opacity-90 transition-opacity"
          />
          </div>
        ) : (
          <button
            onClick={async () => {
              setError(null);
              const ok = await preparePayment(userEmail);
              if (!ok) setError('Could not start the payment. Please try again.');
            }}
            disabled={preparing}
            className="w-full text-white py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: themeColor }}
          >
            {preparing && <Loader2 size={15} className="animate-spin" />}
            {preparing ? 'Preparing...' : `Sponsor for ₦${rules.sponsorship_price.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}
