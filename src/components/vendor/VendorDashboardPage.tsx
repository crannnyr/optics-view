import { useState, useCallback } from 'react';
import { LayoutDashboard, PlusCircle, Package, Truck, Sparkles, Loader2, Store, AlertTriangle, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../context/StoreContext';
import { useVendorAccess, VendorAccount } from './hooks/useVendorAccess';
import { useVendorManifest } from './hooks/useVendorManifest';
import { useVendorPromotion } from './hooks/useVendorPromotion';
import { useVendorProgramRules, VendorProgramRules } from './useVendorProgramRules';
import VendorAnalyticsOverview from './sections/VendorAnalyticsOverview';
import PostProductForm from './sections/PostProductForm';
import MyProductsList from './sections/MyProductsList';
import VendorOrdersList from './sections/VendorOrdersList';
import PromotionPaywall from './sections/PromotionPaywall';

interface VendorDashboardPageProps {
  user: any;
  onNavigateToVendorSignup: () => void;
}

type TabKey = 'overview' | 'post' | 'products' | 'orders' | 'campaign';

const TABS: { key: TabKey; label: string; short: string; icon: typeof LayoutDashboard }[] = [
  { key: 'overview', label: 'Overview',       short: 'Home',     icon: LayoutDashboard },
  { key: 'post',     label: 'Post a Product', short: 'Post',     icon: PlusCircle },
  { key: 'products', label: 'My Products',    short: 'Products', icon: Package },
  { key: 'orders',   label: 'My Orders',      short: 'Orders',   icon: Truck },
  { key: 'campaign', label: 'Campaign',       short: 'Campaign', icon: Sparkles },
];

function CenteredState({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">{children}</div>;
}

export default function VendorDashboardPage({ user, onNavigateToVendorSignup }: VendorDashboardPageProps) {
  useVendorManifest();
  const { store } = useStore();
  const { vendor, loading } = useVendorAccess(user);
  const { rules } = useVendorProgramRules();

  if (!user || loading) {
    return <CenteredState><Loader2 size={32} className="animate-spin text-gray-300" /></CenteredState>;
  }

  if (!vendor) {
    return (
      <CenteredState>
        <Store size={40} className="text-gray-300 mb-4" />
        <h2 className="text-lg font-medium text-gray-800 mb-2">You're not registered as a vendor yet</h2>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">Register first to start posting products.</p>
        <button
          onClick={onNavigateToVendorSignup}
          className="text-white px-6 py-3 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity"
          style={{ backgroundColor: store.themeColor }}
        >
          Become a Vendor
        </button>
      </CenteredState>
    );
  }

  if (vendor.status !== 'active') {
    return (
      <CenteredState>
        <AlertTriangle size={40} className="text-red-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-800 mb-2">Your vendor account is {vendor.status}</h2>
        <p className="text-sm text-gray-500 mb-2 max-w-sm">
          This usually happens after repeated failed deliveries. To reactivate your account, a fee of ₦50,000 applies.
        </p>
        <p className="text-sm text-gray-500 max-w-sm">Contact support to arrange reactivation.</p>
      </CenteredState>
    );
  }

  return <VendorDashboardShell user={user} vendor={vendor} rules={rules} themeColor={store.themeColor} />;
}

interface ShellProps {
  user: any;
  vendor: VendorAccount;
  rules: VendorProgramRules;
  themeColor: string;
}

function VendorDashboardShell({ user, vendor, rules, themeColor }: ShellProps) {
  const { promotion, loading: promoLoading, refresh: refreshPromo } = useVendorPromotion(vendor, rules);
  const [tab, setTab] = useState<TabKey>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [draftCount, setDraftCount] = useState(0);

  const hasActivePromotion = !!promotion;

  const handlePosted = useCallback((needsPayment: boolean) => {
    setRefreshKey(k => k + 1);
    if (needsPayment) {
      setDraftCount(c => c + 1);
      setTab('campaign');
    } else {
      setTab('products');
    }
  }, []);

  const daysLeft = promotion?.ends_at
    ? Math.max(0, Math.ceil((new Date(promotion.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-gray-400">Vendor Dashboard</p>
            <h1 className="text-sm sm:text-base font-medium text-gray-900 truncate">{vendor.business_name}</h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!promoLoading && (
              hasActivePromotion ? (
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  <Sparkles size={11} /> Campaign active · {daysLeft}d left
                </span>
              ) : (
                <button
                  onClick={() => setTab('campaign')}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors"
                >
                  Start campaign
                </button>
              )
            )}
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 md:flex md:gap-8">
        <nav className="hidden md:block w-52 shrink-0">
          <div className="sticky top-24 space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                  style={active ? { backgroundColor: `${themeColor}0f`, color: themeColor } : { color: '#6b7280' }}
                >
                  <Icon size={16} /> {t.label}
                </button>
              );
            })}
          </div>
        </nav>

        <nav className="md:hidden flex gap-1.5 overflow-x-auto -mx-4 px-4 mb-5 pb-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 border transition-colors"
                style={active
                  ? { backgroundColor: themeColor, color: 'white', borderColor: themeColor }
                  : { backgroundColor: 'white', color: '#6b7280', borderColor: '#e5e7eb' }}
              >
                <Icon size={13} /> {t.short}
              </button>
            );
          })}
        </nav>

        <main className="flex-1 min-w-0 bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
          {tab === 'overview' && <VendorAnalyticsOverview vendor={vendor} themeColor={themeColor} />}

          {tab === 'post' && (
            <PostProductForm
              vendor={vendor}
              rules={rules}
              themeColor={themeColor}
              hasActivePromotion={hasActivePromotion}
              onPosted={handlePosted}
            />
          )}

          {tab === 'products' && <MyProductsList vendor={vendor} refreshKey={refreshKey} />}
          {tab === 'orders' && <VendorOrdersList vendor={vendor} themeColor={themeColor} />}

          {tab === 'campaign' && (
            promoLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
            ) : hasActivePromotion ? (
              <div className="max-w-md rounded-xl border-2 border-green-200 bg-green-50 p-6">
                <Sparkles size={22} className="text-green-600 mb-3" />
                <h2 className="text-base font-semibold text-green-900 mb-1">Your Sold Out Campaign is running</h2>
                <p className="text-sm text-green-800 mb-3">
                  {daysLeft} day{daysLeft === 1 ? '' : 's'} left. Your products are getting top placement,
                  and your packaging materials ship monthly.
                </p>
                <p className="text-xs text-green-700">Track how it's performing from the Overview tab.</p>
              </div>
            ) : (
              <PromotionPaywall
                vendor={vendor}
                rules={rules}
                userEmail={user.email}
                themeColor={themeColor}
                pendingProductCount={draftCount}
                onActivated={() => { refreshPromo(); setRefreshKey(k => k + 1); setDraftCount(0); }}
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}
