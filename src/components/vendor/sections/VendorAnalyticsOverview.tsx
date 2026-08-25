import { Eye, ShoppingBag, Users, Wallet, Clock, Package } from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { useVendorAnalytics } from '../hooks/useVendorAnalytics';

function StatCard({ icon, label, value, themeColor }: { icon: React.ReactNode; label: string; value: string; themeColor: string }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2" style={{ color: themeColor }}>
        {icon}
        <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      </div>
      <p className="text-xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function VendorAnalyticsOverview({ vendor, themeColor }: { vendor: VendorAccount; themeColor: string }) {
  const { analytics, loading } = useVendorAnalytics(vendor);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={<Package size={14} />} label="Live Products" value={String(analytics.liveProducts)} themeColor={themeColor} />
        <StatCard icon={<Eye size={14} />} label="Total Views" value={analytics.totalViews.toLocaleString()} themeColor={themeColor} />
        <StatCard icon={<ShoppingBag size={14} />} label="Units Sold" value={analytics.unitsSold.toLocaleString()} themeColor={themeColor} />
        <StatCard icon={<Users size={14} />} label="Active Resellers" value={String(analytics.activeResellers)} themeColor={themeColor} />
        <StatCard icon={<Clock size={14} />} label="Orders Pending" value={String(analytics.pendingOrders)} themeColor={themeColor} />
        <StatCard icon={<Wallet size={14} />} label="Wallet Balance" value={`₦${analytics.walletBalance.toLocaleString()}`} themeColor={themeColor} />
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Your Top Products</p>
        {analytics.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No live products yet — post one to start seeing analytics here.</p>
        ) : (
          <div className="space-y-2 max-w-2xl">
            {analytics.topProducts.map(p => (
              <div key={p.id} className="flex items-center gap-4 border border-gray-100 rounded-lg p-3">
                <img src={p.image_url} alt={p.name} className="w-12 h-12 object-contain bg-gray-50 rounded shrink-0" />
                <p className="text-sm font-medium text-gray-800 flex-1 truncate">{p.name}</p>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{p.views_count.toLocaleString()} views</p>
                  <p className="text-[11px] text-gray-400">{p.unitsSold} sold</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
