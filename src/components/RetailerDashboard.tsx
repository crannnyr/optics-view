import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LayoutDashboard, Package, ShoppingBag, Wallet,
  Loader2, ExternalLink, Copy, Check, Store,
  Clock, RefreshCw, AlertTriangle, BookOpen, LayoutTemplate, CreditCard
} from 'lucide-react';
import RetailerOverview from './retailer/RetailerOverview';
import RetailerProductsTab from './retailer/RetailerProductsTab';
import RetailerOrdersTab from './retailer/RetailerOrdersTab';
import RetailerWalletTab from './retailer/RetailerWalletTab';
import RetailerHeroTab from './retailer/RetailerHeroTab';
import RetailerSubscriptionTab from './retailer/RetailerSubscriptionTab';

type ActiveTab = 'overview' | 'catalog' | 'orders' | 'wallet' | 'store' | 'subscription';

export default function RetailerDashboard() {
  const [profile, setProfile]           = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [wallet, setWallet]             = useState<any>({ balance: 0, total_earned: 0 });
  const [loading, setLoading]           = useState(true);
  const [activeTab, setActiveTab]       = useState<ActiveTab>('overview');
  const [copiedUrl, setCopiedUrl]       = useState(false);
  const [checking, setChecking]         = useState(false);
  const [statusMsg, setStatusMsg]       = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: prof }, { data: reg }, { data: wal }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('retailer_registrations')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('retailer_wallets')
        .select('*')
        .eq('retailer_id', user.id)
        .maybeSingle(),
    ]);

    if (prof) setProfile(prof);
    if (reg)  setRegistration(reg);
    setWallet(wal ?? { balance: 0, total_earned: 0 });
    setLoading(false);
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMsg('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setChecking(false); return; }

    const { data } = await supabase
      .from('retailer_registrations')
      .select('payment_status, is_blocked')
      .eq('email', user.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data?.payment_status === 'verified' && !data?.is_blocked) {
      window.location.reload();
    } else if (data?.is_blocked) {
      setStatusMsg('Your store has been suspended. Please contact support.');
    } else {
      setStatusMsg('Payment not confirmed yet. Please wait and try again shortly.');
    }
    setChecking(false);
  };

  const getStoreUrl = () => {
    if (!profile) return '';
    if (registration?.domain_type === 'custom' && registration?.domain_confirmed) {
      return `https://${registration.custom_domain}`;
    }
    return `${window.location.origin}/${profile?.store_slug}`;
  };

  const copyStoreUrl = () => {
    navigator.clipboard.writeText(getStoreUrl());
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#0d2818]" />
      </div>
    );
  }

  // ── Blocked ───────────────────────────────────────────────
  if (registration?.is_blocked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border-t-4 border-red-500 rounded-lg p-8 max-w-md w-full text-center shadow-lg">
          <AlertTriangle size={40} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Store Suspended</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your store has been suspended by the admin. Please contact support to resolve this.
          </p>
          <a href="/" className="block w-full bg-[#0d2818] text-white py-3 text-sm rounded hover:opacity-90">
            Return to Main Store
          </a>
        </div>
      </div>
    );
  }

  // ── Pending Payment Gate ──────────────────────────────────
  if (!registration || registration.payment_status !== 'verified') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white border rounded-xl p-8 max-w-md w-full shadow-lg">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-amber-600" />
            </div>
            <h2 className="text-xl font-semibold text-[#0d2818] mb-2">Payment Pending</h2>
            <p className="text-sm text-gray-500">
              Your retailer application is saved. Your dashboard will be available once your payment is confirmed.
            </p>
          </div>

          {registration?.payment_method === 'transfer' && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-800">
              <p className="font-medium mb-1">Bank Transfer Selected</p>
              <p className="text-xs">
                Our team is reviewing your transfer. This usually takes <strong>under 5 minutes</strong> during business hours.
              </p>
            </div>
          )}

          {statusMsg && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-center">
              {statusMsg}
            </p>
          )}

          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
          >
            {checking
              ? <><Loader2 size={16} className="animate-spin" /> Checking...</>
              : <><RefreshCw size={16} /> Check Approval Status</>
            }
          </button>

          <a href="/" className="block text-center text-xs text-gray-400 hover:text-gray-600 underline">
            Return to Store
          </a>
        </div>
      </div>
    );
  }

  // ── Full Dashboard ────────────────────────────────────────
  const isCustomDomainPending =
    registration?.domain_type === 'custom' && !registration?.domain_confirmed;

  const tabs = [
    { key: 'overview',      icon: <LayoutDashboard size={15} />, label: 'Overview' },
    { key: 'catalog',       icon: <BookOpen size={15} />,        label: 'Catalog' },
    { key: 'orders',        icon: <ShoppingBag size={15} />,     label: 'Orders' },
    { key: 'wallet',        icon: <Wallet size={15} />,          label: 'Wallet' },
    { key: 'store',         icon: <LayoutTemplate size={15} />,  label: 'My Banner' },
    { key: 'subscription',  icon: <CreditCard size={15} />,      label: 'Subscription' },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-[#0d2818] text-white px-6 py-6 shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Store size={18} className="opacity-70" />
                <h1 className="text-lg font-medium tracking-wide">{profile?.store_name}</h1>
              </div>
              <p className="text-xs opacity-50">Retailer Dashboard · {profile?.email}</p>
            </div>

            {/* Store URL */}
            {isCustomDomainPending ? (
              <div className="bg-amber-500/20 border border-amber-400/30 rounded-lg px-4 py-3 text-sm">
                <p className="text-amber-200 font-medium text-xs">Custom Domain Pending</p>
                <p className="text-white/70 text-xs mt-0.5">
                  You'll be notified once <span className="font-mono">{registration.custom_domain}</span> is connected.
                </p>
              </div>
            ) : (
              <div className="bg-white/10 rounded-lg p-3 flex items-center gap-3 border border-white/10">
                <div className="hidden sm:block">
                  <p className="text-[10px] opacity-50 uppercase tracking-wider">Your Store</p>
                  <p className="text-xs font-mono opacity-90">
                    {getStoreUrl().replace('https://', '').replace('http://', '')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyStoreUrl} className="p-2 hover:bg-white/20 rounded transition-colors">
                    {copiedUrl ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <a
                    href={getStoreUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-white/20 rounded transition-colors"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`pb-3 px-3 text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'text-white border-b-2 border-white font-medium'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
        {activeTab === 'overview' && (
          <RetailerOverview profile={profile} wallet={wallet} registration={registration} />
        )}

        {activeTab === 'catalog' && (
          <RetailerProductsTab profile={profile} registration={registration} />
        )}

        {activeTab === 'orders' && <RetailerOrdersTab profile={profile} />}

        {activeTab === 'wallet' && (
          <RetailerWalletTab profile={profile} wallet={wallet} onWalletUpdate={loadData} />
        )}

        {activeTab === 'store' && <RetailerHeroTab profile={profile} />}

        {activeTab === 'subscription' && (
          <RetailerSubscriptionTab
            profile={profile}
            registration={registration}
            onRegistrationUpdate={loadData}
          />
        )}
      </main>
    </div>
  );
}