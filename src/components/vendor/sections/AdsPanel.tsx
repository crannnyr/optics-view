import { useState, useEffect } from 'react';
import { usePaystackPayment } from 'react-paystack';
import {
  Loader2, MousePointerClick, Eye, Wallet, Pause, Play, Sparkles, CheckCircle2, ImageOff,
} from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';
import { useVendorAds, AD_CLICK_COST, AD_MIN_TOPUP } from '../hooks/useVendorAds';
import { useVendorPromotion } from '../hooks/useVendorPromotion';
import { vendorSupabase } from '../../../lib/vendorSupabase';
import { PAYSTACK_PUBLIC_KEY } from '../../../lib/supabase';

interface AdsPanelProps {
  vendor: VendorAccount;
  rules: VendorProgramRules;
  userEmail: string;
  themeColor: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 text-green-700' },
  paused_no_funds: { label: 'Paused — out of funds', className: 'bg-red-100 text-red-700' },
  paused_by_vendor: { label: 'Paused by you', className: 'bg-gray-100 text-gray-600' },
};

export default function AdsPanel({ vendor, rules, userEmail, themeColor }: AdsPanelProps) {
  const {
    ad, balance, eligibleProducts, loading, preparingTopup,
    prepareTopup, confirmTopup, selectProduct, setPaused,
  } = useVendorAds(vendor);

  const [topupAmount, setTopupAmount] = useState(AD_MIN_TOPUP);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const initializePaystackPopup = usePaystackPayment({ publicKey: PAYSTACK_PUBLIC_KEY });

  const promotedProduct = eligibleProducts.find(p => p.product_id === ad?.product_id);

  const handleTopup = async () => {
    setError(null);
    if (topupAmount < AD_MIN_TOPUP) {
      setError(`Minimum top-up is ₦${AD_MIN_TOPUP.toLocaleString()}.`);
      return;
    }
    const config = await prepareTopup(userEmail, topupAmount);
    if (!config) {
      setError('Could not start the top-up. Please try again.');
      return;
    }
    const { publicKey: _publicKey, ...popupConfig } = config;
    initializePaystackPopup({
      config: popupConfig as any,
      onSuccess: async (ref: any) => {
        const ok = await confirmTopup(ref.reference);
        if (!ok) setError('Payment went through but the top-up failed to apply. Contact support with your reference.');
      },
      onClose: () => setError('Top-up was cancelled — nothing was charged.'),
    });
  };

  const handleSelectProduct = async (productId: string) => {
    setSwitching(true);
    setError(null);
    const ok = await selectProduct(productId);
    setSwitching(false);
    setShowPicker(false);
    if (!ok) setError('Could not start promoting that product. Please try again.');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>;
  }

  const clicksLeftAtCurrentBalance = Math.floor(balance / AD_CLICK_COST);

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">Product Ads</h2>
        <p className="text-sm text-gray-500">
          Promote one product at a time. You only pay when someone actually clicks it —
          ₦{AD_CLICK_COST} per click, no time limit, runs until your balance runs out.
        </p>
      </div>

      {/* Wallet balance */}
      <div className="rounded-xl border border-gray-200 p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${themeColor}15`, color: themeColor }}>
            <Wallet size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Ad Balance</p>
            <p className="text-2xl font-semibold text-gray-900">₦{balance.toLocaleString()}</p>
            <p className="text-[11px] text-gray-400">≈ {clicksLeftAtCurrentBalance} click{clicksLeftAtCurrentBalance === 1 ? '' : 's'} left</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={AD_MIN_TOPUP}
            step={500}
            value={topupAmount}
            onChange={e => setTopupAmount(Number(e.target.value))}
            className="w-28 border-2 border-gray-200 rounded-lg p-2 text-sm text-right focus:border-black outline-none"
          />
          <button
            onClick={handleTopup}
            disabled={preparingTopup}
            className="text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            style={{ backgroundColor: themeColor }}
          >
            {preparingTopup && <Loader2 size={14} className="animate-spin" />}
            Top Up
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

      {/* Currently promoted product */}
      {ad ? (
        <div className="rounded-xl border-2 overflow-hidden" style={{ borderColor: themeColor }}>
          <div className="p-5 flex gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
              {promotedProduct?.photo_url_1
                ? <img src={promotedProduct.photo_url_1} alt="" className="w-full h-full object-cover" />
                : <ImageOff size={20} className="text-gray-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-sm font-medium text-gray-900 truncate">{promotedProduct?.name || 'Product'}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_LABEL[ad.status].className}`}>
                  {STATUS_LABEL[ad.status].label}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                <span className="flex items-center gap-1"><Eye size={13} /> {ad.impressions.toLocaleString()} views</span>
                <span className="flex items-center gap-1"><MousePointerClick size={13} /> {ad.clicks.toLocaleString()} clicks</span>
                <span>₦{ad.total_spent.toLocaleString()} spent</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between gap-3 bg-gray-50">
            <button onClick={() => setShowPicker(s => !s)} className="text-xs font-medium underline hover:text-black text-gray-600">
              Change product
            </button>
            {ad.status === 'paused_by_vendor' ? (
              <button
                onClick={() => setPaused(false)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border-2"
                style={{ borderColor: themeColor, color: themeColor }}
              >
                <Play size={12} /> Resume
              </button>
            ) : ad.status === 'active' ? (
              <button
                onClick={() => setPaused(true)}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border-2 border-gray-300 text-gray-600"
              >
                <Pause size={12} /> Pause
              </button>
            ) : (
              <span className="text-[11px] text-red-600">Top up above to resume</span>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-3">You're not promoting any product yet.</p>
          <button
            onClick={() => setShowPicker(true)}
            className="text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:opacity-90"
            style={{ backgroundColor: themeColor }}
          >
            Choose a Product to Promote
          </button>
        </div>
      )}

      {/* Product picker */}
      {showPicker && (
        <div className="rounded-xl border border-gray-200 p-4 space-y-2">
          <p className="text-xs font-medium text-gray-500 mb-2">Select a live product to promote</p>
          {eligibleProducts.length === 0 && (
            <p className="text-xs text-gray-400">You don't have any live products yet.</p>
          )}
          {eligibleProducts.map(p => (
            <button
              key={p.product_id}
              onClick={() => handleSelectProduct(p.product_id)}
              disabled={switching}
              className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 hover:border-gray-300 text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded bg-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
                {p.photo_url_1
                  ? <img src={p.photo_url_1} alt="" className="w-full h-full object-cover" />
                  : <ImageOff size={14} className="text-gray-300" />}
              </div>
              <span className="text-sm text-gray-800 truncate flex-1">{p.name}</span>
              {switching && <Loader2 size={14} className="animate-spin text-gray-400" />}
            </button>
          ))}
        </div>
      )}

      <SoldOutCampaignUpsell vendor={vendor} rules={rules} userEmail={userEmail} themeColor={themeColor} />
    </div>
  );
}

// Compact, one-time upsell for the original flat-fee Sold Out Campaign —
// still available, still one-time, just no longer the mandatory gate to
// reach the dashboard (that was made skippable). Surfaced here instead.
function SoldOutCampaignUpsell({ vendor, rules, userEmail, themeColor }: AdsPanelProps) {
  const { promotion, loading, preparePayment, confirmPayment } = useVendorPromotion(vendor, rules);
  const [everJoined, setEverJoined] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializePaystackPopup = usePaystackPayment({ publicKey: PAYSTACK_PUBLIC_KEY });

  useEffect(() => {
    // one-off check: has this vendor ever completed the campaign, active or expired?
    vendorSupabase.from('vendor_promotions')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', vendor.id)
      .eq('status', 'active')
      .then(({ count }) => setEverJoined((count || 0) > 0));
  }, [vendor.id]);

  if (loading || everJoined === null || everJoined || promotion) return null;

  const handleJoin = async () => {
    setError(null);
    const result = await preparePayment(userEmail);
    if (!result) { setError('Could not start the payment. Please try again.'); return; }
    const { publicKey: _publicKey, ...popupConfig } = result.config;
    initializePaystackPopup({
      config: popupConfig as any,
      onSuccess: async (ref: any) => {
        setVerifying(true);
        const ok = await confirmPayment(ref.reference);
        setVerifying(false);
        if (!ok) setError("Payment went through but we couldn't activate it. Contact support with your reference.");
        else setEverJoined(true);
      },
      onClose: () => setError('Payment was cancelled.'),
    });
  };

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-2.5">
        <Sparkles size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-900">One-time: Join the Sold Out Campaign</p>
          <p className="text-xs text-amber-700 mt-0.5">
            ₦{rules.promo_intro_price.toLocaleString()} one-off — {rules.promo_duration_days} days of top placement,
            free monthly packaging, and full performance tracking.
          </p>
          {error && <p className="text-xs text-red-600 mt-1.5">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleJoin}
        disabled={verifying}
        className="text-white text-xs font-semibold px-4 py-2.5 rounded-full hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shrink-0"
        style={{ backgroundColor: themeColor }}
      >
        {verifying ? <><Loader2 size={13} className="animate-spin" /> Activating...</> : <><CheckCircle2 size={13} /> Join Now</>}
      </button>
    </div>
  );
}
