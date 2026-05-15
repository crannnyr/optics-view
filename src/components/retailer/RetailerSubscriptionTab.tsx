import { useState, useEffect } from 'react';
import { supabase, PAYSTACK_PUBLIC_KEY } from '../../lib/supabase';
import {
  Calendar, Clock, CheckCircle, AlertTriangle, Globe,
  Store, Plus, CreditCard, Building2, Copy, Loader2,
  Bell, BellOff, RefreshCw, ChevronRight, Info
} from 'lucide-react';
import { PaystackButton } from 'react-paystack';

interface Props {
  profile: any;
  registration: any;
  onRegistrationUpdate: () => void;
}

type PayMethod = 'paystack' | 'transfer';
type Section = 'overview' | 'categories' | 'domain' | 'payment';

const CATEGORY_RATE = 5000;
const DOMAIN_COSTS: Record<string, number> = {
  store: 12950,
  shop: 12950,
  com: 30000,
};

export default function RetailerSubscriptionTab({ profile, registration, onRegistrationUpdate }: Props) {
  const [allCategories, setAllCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [transferDetails, setTransferDetails] = useState({ bank: '', number: '', name: '' });
  const [payMethod, setPayMethod] = useState<PayMethod>('paystack');
  const [paySettings, setPaySettings] = useState({ enable_paystack: true, enable_transfer: true });
  const [section, setSection] = useState<Section>('overview');
  const [loading, setLoading] = useState(false);

  // Category add state
  const [categoriesToAdd, setCategoriesToAdd] = useState<string[]>([]);

  // Domain upgrade state
  const [domainType, setDomainType] = useState<'store' | 'shop' | 'com'>('store');
  const [domainName, setDomainName] = useState('');

  // Manual transfer state
  const [senderName, setSenderName] = useState('');
  const [copied, setCopied] = useState(false);
  const [manualStep, setManualStep] = useState<'confirm' | 'details' | 'sent'>('confirm');
  const [statusMsg, setStatusMsg] = useState('');
  const [checking, setChecking] = useState(false);

  // Paystack config
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [confirmedAmount, setConfirmedAmount] = useState(0);

  useEffect(() => {
    fetchAllCategories();
    fetchSettings();
  }, []);

  const fetchAllCategories = async () => {
    const { data } = await supabase.from('categories').select('id, name, slug').order('sort_order');
    if (data) setAllCategories(data);
  };

  const fetchSettings = async () => {
    const [{ data: m }, { data: t }] = await Promise.all([
      supabase.from('app_settings').select('value').eq('key', 'payment_methods').single(),
      supabase.from('app_settings').select('value').eq('key', 'transfer_details').single(),
    ]);
    if (m?.value) setPaySettings(m.value);
    if (t?.value) setTransferDetails(t.value);
  };

  // ── Derived state ──────────────────────────────────────────
  const currentCategories: string[] = registration?.selected_categories ?? [];
  const isSubdomain = registration?.domain_type === 'subdomain';
  const isCustomDomainPending = registration?.domain_type === 'custom' && !registration?.domain_confirmed;
  const isCustomDomainLive = registration?.domain_type === 'custom' && registration?.domain_confirmed;
  const subStatus: string = registration?.subscription_status ?? 'pending';
  const trialEndsAt: string | null = registration?.trial_ends_at ?? null;
  const nextBilling: string | null = registration?.next_billing_date ?? null;

  const daysRemaining = (() => {
    const target = trialEndsAt || nextBilling;
    if (!target) return null;
    const diff = new Date(target).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const newCategoryCount = currentCategories.length + categoriesToAdd.length;
  const subscriptionAmount = newCategoryCount * CATEGORY_RATE;
  const domainUpgradeAmount = section === 'domain' ? DOMAIN_COSTS[domainType] : 0;
  const totalAmount = section === 'categories'
    ? subscriptionAmount
    : section === 'domain'
      ? domainUpgradeAmount
      : 0;

  const availableCatsToAdd = allCategories.filter(
    c => !currentCategories.includes(c.slug) && !categoriesToAdd.includes(c.slug)
  );

  // ── Helpers ───────────────────────────────────────────────
  const statusColor = {
    trial: 'bg-blue-100 text-blue-700 border-blue-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    suspended: 'bg-red-100 text-red-700 border-red-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
  }[subStatus] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  const statusLabel = {
    trial: 'Free Trial',
    active: 'Active',
    suspended: 'Suspended',
    pending: 'Pending',
  }[subStatus] ?? subStatus;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Build paystack config ──────────────────────────────────
  const buildPaystackConfig = async (amount: number, metadata: any) => {
    const reference = section === 'categories'
      ? `SUB-${registration.id}-${Date.now()}`
      : `DOM-${registration.id}-${Date.now()}`;

    return {
      reference,
      email: profile.email,
      amount: amount * 100,
      publicKey: PAYSTACK_PUBLIC_KEY,
      metadata: { registration_id: registration.id, ...metadata },
    };
  };

  const handleProceedToPayment = async () => {
    if (totalAmount <= 0) return;
    setConfirmedAmount(totalAmount);
    const config = await buildPaystackConfig(totalAmount, {
      categories_to_add: categoriesToAdd,
      domain_type: section === 'domain' ? domainType : null,
      domain_name: section === 'domain' ? domainName : null,
    });
    setPaystackConfig(config);
    setSection('payment');
  };

  // ── Manual submit ──────────────────────────────────────────
  const handleManualSent = async () => {
    if (!senderName.trim()) return;
    setLoading(true);
    const reference = section === 'categories'
      ? `SUB-${registration.id}-${Date.now()}`
      : `DOM-${registration.id}-${Date.now()}`;

    await supabase.from('subscription_payments').insert({
      registration_id: registration.id,
      retailer_email: profile.email,
      amount: confirmedAmount,
      payment_method: 'transfer',
      paystack_reference: reference,
      sender_name: senderName.trim(),
      plan: registration.subscription_plan ?? 'monthly',
      categories_to_add: categoriesToAdd,
      status: 'pending',
    });
    setLoading(false);
    setManualStep('sent');
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMsg('');
    const { data } = await supabase
      .from('subscription_payments')
      .select('status')
      .eq('registration_id', registration.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.status === 'verified') {
      onRegistrationUpdate();
    } else {
      setStatusMsg('Not confirmed yet. Admin is reviewing — please wait.');
    }
    setChecking(false);
  };

  // ── Paystack success ───────────────────────────────────────
  const handlePaystackSuccess = async (ref: any) => {
    setLoading(true);
    await supabase.from('subscription_payments').insert({
      registration_id: registration.id,
      retailer_email: profile.email,
      amount: confirmedAmount,
      payment_method: 'paystack',
      paystack_reference: ref.reference,
      plan: registration.subscription_plan ?? 'monthly',
      categories_to_add: categoriesToAdd,
      status: 'verified',
      verified_at: new Date().toISOString(),
    });

    if (categoriesToAdd.length > 0) {
      await supabase
        .from('retailer_registrations')
        .update({ selected_categories: [...currentCategories, ...categoriesToAdd] })
        .eq('id', registration.id);
    }

    if (section === 'domain' && domainName) {
      await supabase
        .from('retailer_registrations')
        .update({
          domain_type: 'custom',
          custom_domain: `${domainName}.${domainType}`,
          domain_confirmed: false,
        })
        .eq('id', registration.id);
    }

    setLoading(false);
    onRegistrationUpdate();
  };

  // ── OVERVIEW ──────────────────────────────────────────────
  if (section === 'overview') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        {/* Status card */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Subscription</p>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            {daysRemaining !== null && (
              <div className="text-right">
                <p className="text-2xl font-bold text-[#0d2818]">{daysRemaining}</p>
                <p className="text-xs text-gray-400">days remaining</p>
              </div>
            )}
          </div>

          {trialEndsAt && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Clock size={14} />
              <span>Trial ends: <strong>{new Date(trialEndsAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
            </div>
          )}
          {nextBilling && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Calendar size={14} />
              <span>Next billing: <strong>{new Date(nextBilling).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
            </div>
          )}

          {daysRemaining !== null && daysRemaining <= 7 && daysRemaining > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2 mt-3">
              <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">Your subscription expires soon. Renew to keep your store live.</p>
            </div>
          )}
          {daysRemaining === 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2 mt-3">
              <AlertTriangle size={14} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-xs text-red-800">Your subscription has expired. Your store is currently offline.</p>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-[#0d2818]">Your Categories</p>
            <span className="text-xs text-gray-400">₦{CATEGORY_RATE.toLocaleString()}/month each</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {currentCategories.length === 0 ? (
              <p className="text-xs text-gray-400">No categories selected</p>
            ) : (
              currentCategories.map(slug => (
                <span key={slug} className="px-3 py-1 bg-[#0d2818]/10 text-[#0d2818] text-xs rounded-full font-medium">
                  {slug}
                </span>
              ))
            )}
          </div>
          {availableCatsToAdd.length > 0 && (
            <button
              onClick={() => setSection('categories')}
              className="flex items-center gap-2 text-xs text-[#0d2818] border border-[#0d2818] px-4 py-2 rounded hover:bg-[#0d2818] hover:text-white transition-colors"
            >
              <Plus size={12} /> Add Categories
            </button>
          )}
        </div>

        {/* Domain */}
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm font-medium text-[#0d2818] mb-3">Domain</p>
          {isSubdomain && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Current</p>
                <p className="text-sm font-mono">opticsview.store/{profile?.store_slug}</p>
              </div>
              <button
                onClick={() => setSection('domain')}
                className="flex items-center gap-1.5 text-xs text-[#0d2818] border border-[#0d2818] px-3 py-2 rounded hover:bg-[#0d2818] hover:text-white transition-colors"
              >
                <Globe size={12} /> Upgrade Domain
              </button>
            </div>
          )}
          {isCustomDomainPending && (
            <div className="flex items-center gap-2 text-amber-700">
              <Clock size={14} />
              <div>
                <p className="text-sm font-mono">{registration.custom_domain}</p>
                <p className="text-xs text-amber-600">Pending — admin is connecting your domain</p>
              </div>
            </div>
          )}
          {isCustomDomainLive && (
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle size={14} />
              <p className="text-sm font-mono">{registration.custom_domain}</p>
            </div>
          )}
        </div>

        {/* Auto-renew */}
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[#0d2818]">Auto-Renew</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {registration?.card_last4
                  ? `Card ending ···· ${registration.card_last4}`
                  : 'No card saved yet'}
              </p>
            </div>
            {registration?.card_authorization_code ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                <CheckCircle size={12} /> Enabled
              </span>
            ) : (
              <button
                onClick={() => setSection('payment')}
                className="text-xs text-[#0d2818] border border-[#0d2818] px-3 py-2 rounded hover:bg-[#0d2818] hover:text-white transition-colors"
              >
                Save Card
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── ADD CATEGORIES ─────────────────────────────────────────
  if (section === 'categories') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSection('overview'); setCategoriesToAdd([]); }} className="p-2 hover:bg-gray-100 rounded-full">
            ←
          </button>
          <h3 className="text-base font-medium text-[#0d2818]">Add Categories</h3>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">You can add categories but not remove them. Each category adds ₦{CATEGORY_RATE.toLocaleString()}/month to your subscription.</p>
        </div>

        {/* Current categories (read-only) */}
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Current</p>
          <div className="flex flex-wrap gap-2">
            {currentCategories.map(slug => (
              <span key={slug} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {slug}
              </span>
            ))}
          </div>
        </div>

        {/* Available to add */}
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Available to Add</p>
          <div className="space-y-2">
            {availableCatsToAdd.map(cat => {
              const selected = categoriesToAdd.includes(cat.slug);
              return (
                <button
                  key={cat.id}
                  onClick={() =>
                    setCategoriesToAdd(prev =>
                      selected ? prev.filter(s => s !== cat.slug) : [...prev, cat.slug]
                    )
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 text-sm transition-all ${
                    selected
                      ? 'border-[#0d2818] bg-[#0d2818]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium text-[#0d2818]">{cat.name}</span>
                  <span className="text-xs text-gray-400">+₦{CATEGORY_RATE.toLocaleString()}/mo</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        {categoriesToAdd.length > 0 && (
          <div className="bg-white border-2 border-[#0d2818]/20 rounded-lg p-4">
            <div className="flex justify-between text-sm mb-2 text-gray-600">
              <span>Total categories after</span>
              <span>{newCategoryCount}</span>
            </div>
            <div className="flex justify-between font-bold text-[#0d2818] border-t pt-2">
              <span>New monthly rate</span>
              <span>₦{subscriptionAmount.toLocaleString()}/mo</span>
            </div>
          </div>
        )}

        <button
          onClick={handleProceedToPayment}
          disabled={categoriesToAdd.length === 0}
          className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          Continue to Payment <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  // ── DOMAIN UPGRADE ─────────────────────────────────────────
  if (section === 'domain') {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <button onClick={() => setSection('overview')} className="p-2 hover:bg-gray-100 rounded-full">←</button>
          <h3 className="text-base font-medium text-[#0d2818]">Upgrade Domain</h3>
        </div>

        <div className="space-y-3">
          {(['store', 'shop', 'com'] as const).map(ext => (
            <button
              key={ext}
              onClick={() => setDomainType(ext)}
              className={`w-full p-4 rounded-lg border-2 text-left flex justify-between items-center transition-all ${
                domainType === ext ? 'border-[#0d2818] bg-[#0d2818]/5' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="font-mono text-sm text-gray-700">yourbrand.{ext}</span>
              <span className="font-bold text-[#0d2818] text-sm">₦{DOMAIN_COSTS[ext].toLocaleString()}</span>
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-400 mb-1.5">Your Domain Name</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={domainName}
              onChange={e => setDomainName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="yourbrand"
              className="flex-1 border-2 border-gray-200 p-3 text-sm rounded-lg focus:border-[#0d2818] outline-none"
            />
            <span className="text-sm text-gray-500 font-medium">.{domainType}</span>
          </div>
          {domainName && (
            <p className="text-xs text-gray-400 mt-1">Preview: <span className="font-mono text-[#0d2818]">{domainName}.{domainType}</span></p>
          )}
        </div>

        <button
          onClick={handleProceedToPayment}
          disabled={!domainName.trim()}
          className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Pay ₦{DOMAIN_COSTS[domainType].toLocaleString()} — Upgrade Domain
        </button>
      </div>
    );
  }

  // ── PAYMENT ────────────────────────────────────────────────
  if (section === 'payment') {
    const bothEnabled = paySettings.enable_paystack && paySettings.enable_transfer;

    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setSection(categoriesToAdd.length > 0 ? 'categories' : 'domain');
              setManualStep('confirm');
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >←</button>
          <h3 className="text-base font-medium text-[#0d2818]">Payment</h3>
        </div>

        {/* Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm space-y-2">
          {categoriesToAdd.length > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Adding {categoriesToAdd.length} {categoriesToAdd.length === 1 ? 'category' : 'categories'}</span>
              <span>₦{confirmedAmount.toLocaleString()}/mo</span>
            </div>
          )}
          {domainName && (
            <div className="flex justify-between text-gray-600">
              <span>Domain: {domainName}.{domainType}</span>
              <span>₦{confirmedAmount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-[#0d2818] border-t pt-2 text-base">
            <span>Total</span>
            <span>₦{confirmedAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Method toggle */}
        {bothEnabled && manualStep === 'confirm' && (
          <div className="flex gap-3">
            <button
              onClick={() => setPayMethod('paystack')}
              className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                payMethod === 'paystack' ? 'border-[#0d2818] bg-[#0d2818] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              Card / Paystack
            </button>
            <button
              onClick={() => setPayMethod('transfer')}
              className={`flex-1 py-3 text-sm font-medium rounded-lg border-2 transition-all ${
                payMethod === 'transfer' ? 'border-[#0d2818] bg-[#0d2818] text-white' : 'border-gray-200 text-gray-600'
              }`}
            >
              Bank Transfer
            </button>
          </div>
        )}

        {/* Paystack */}
        {payMethod === 'paystack' && paySettings.enable_paystack && paystackConfig && (
          <>
            <PaystackButton
              {...paystackConfig}
              text={loading ? 'Processing...' : `PAY ₦${confirmedAmount.toLocaleString()}`}
              onSuccess={(ref: any) => handlePaystackSuccess(ref)}
              onClose={() => {}}
              className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            />
            <p className="text-center text-xs text-gray-400">🔒 Secured by Paystack</p>
          </>
        )}

        {/* Manual transfer */}
        {payMethod === 'transfer' && paySettings.enable_transfer && (
          <>
            {manualStep === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">Before you proceed</p>
                  <ul className="text-xs text-amber-800 space-y-1">
                    <li>• Only proceed if you are ready to transfer now</li>
                    <li>• Fake or unverifiable transfers result in account suspension</li>
                    <li>• Transfers are reviewed by admin within 24 hours</li>
                  </ul>
                </div>
                <button
                  onClick={() => setManualStep('details')}
                  className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90"
                >
                  I'm Ready — Show Transfer Details
                </button>
              </div>
            )}

            {manualStep === 'details' && (
              <div className="space-y-4">
                <div className="bg-[#0d2818] text-white rounded-lg p-5 space-y-4">
                  <p className="text-xs uppercase tracking-widest text-white/60">Transfer To</p>
                  {[
                    ['Bank', transferDetails.bank],
                    ['Account Number', transferDetails.number],
                    ['Account Name', transferDetails.name],
                    ['Amount', `₦${confirmedAmount.toLocaleString()}`],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-white/60">{label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-sm">{value}</span>
                        {label === 'Account Number' && (
                          <button
                            onClick={() => handleCopy(value)}
                            className="p-1 bg-white/10 rounded hover:bg-white/20"
                          >
                            {copied ? <CheckCircle size={13} className="text-green-400" /> : <Copy size={13} />}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-xs uppercase text-gray-400 mb-1.5">
                    Sender Name (your bank account name) *
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
                  onClick={handleManualSent}
                  disabled={!senderName.trim() || loading}
                  className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                  I've Sent the Payment
                </button>
              </div>
            )}

            {manualStep === 'sent' && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 text-center">
                  <CheckCircle size={28} className="mx-auto text-green-600 mb-2" />
                  <p className="font-semibold text-green-900 mb-1">Transfer Submitted</p>
                  <p className="text-sm text-green-800">
                    Admin will review and confirm within 24 hours. Your subscription will be updated automatically.
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
                  {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                  Check Status
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  return null;
}