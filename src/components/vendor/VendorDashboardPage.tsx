import { useState } from 'react';
import { ArrowLeft, Loader2, Store, AlertTriangle } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { useVendorAccess } from './hooks/useVendorAccess';
import { useVendorManifest } from './hooks/useVendorManifest';
import { useVendorProgramRules } from './useVendorProgramRules';
import VendorAnalyticsOverview from './sections/VendorAnalyticsOverview';
import PostProductForm from './sections/PostProductForm';
import MyProductsList from './sections/MyProductsList';
import VendorOrdersList from './sections/VendorOrdersList';

interface VendorDashboardPageProps {
  user: any;
  onBack: () => void;
  onNavigateToVendorSignup: () => void;
}

const TABS = [
  { key: 'overview' as const, label: 'Overview' },
  { key: 'post' as const, label: 'Post a Product' },
  { key: 'products' as const, label: 'My Products' },
  { key: 'orders' as const, label: 'My Orders' },
];

export default function VendorDashboardPage({ user, onBack, onNavigateToVendorSignup }: VendorDashboardPageProps) {
  useVendorManifest();
  const { store } = useStore();
  const { vendor, loading } = useVendorAccess(user);
  const { rules } = useVendorProgramRules();
  const [tab, setTab] = useState<typeof TABS[number]['key']>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
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
      </div>
    );
  }

  if (vendor.status !== 'active') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={40} className="text-red-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-800 mb-2">Your vendor account is {vendor.status}</h2>
        <p className="text-sm text-gray-500 mb-2 max-w-sm">
          This usually happens after repeated failed deliveries. To reactivate your account, a fee of ₦50,000 applies.
        </p>
        <p className="text-sm text-gray-500 mb-6 max-w-sm">Contact support to arrange reactivation.</p>
        <button onClick={onBack} className="text-xs tracking-widest underline text-gray-400 hover:text-gray-600">
          BACK TO STORE
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-16">
        <button onClick={onBack} className="flex items-center gap-2 text-xs tracking-widest hover:opacity-70 transition-opacity mb-6" style={{ color: store.themeColor }}>
          <ArrowLeft size={16} /> BACK
        </button>

        <div className="mb-6 md:mb-8">
          <p className="text-xs uppercase tracking-wide text-gray-400">Vendor Dashboard</p>
          <h1 className="text-xl md:text-2xl font-light text-gray-900">{vendor.business_name}</h1>
        </div>

        <div className="flex gap-1 sm:gap-2 border-b border-gray-100 mb-6 md:mb-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0"
              style={tab === t.key ? { borderColor: store.themeColor, color: store.themeColor } : { borderColor: 'transparent', color: '#9ca3af' }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <VendorAnalyticsOverview vendor={vendor} themeColor={store.themeColor} />}
        {tab === 'post' && (
          <PostProductForm
            vendor={vendor}
            rules={rules}
            themeColor={store.themeColor}
            onPosted={() => { setRefreshKey(k => k + 1); setTab('products'); }}
          />
        )}
        {tab === 'products' && <MyProductsList vendor={vendor} refreshKey={refreshKey} />}
        {tab === 'orders' && <VendorOrdersList vendor={vendor} themeColor={store.themeColor} />}
      </div>
    </div>
  );
}
