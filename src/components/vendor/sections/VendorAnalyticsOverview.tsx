import { Eye, ShoppingBag, Users, Wallet, Clock, Package, TrendingUp, MousePointerClick } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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

const AD_STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused_no_funds: 'Paused — out of funds',
  paused_by_vendor: 'Paused',
};

export default function VendorAnalyticsOverview({ vendor, themeColor }: { vendor: VendorAccount; themeColor: string }) {
  const { analytics, loading } = useVendorAnalytics(vendor);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-100 rounded-xl" />
        ))}
      </div>
    );
  }

  const trendHasData = analytics.salesTrend.some(t => t.units > 0);

  return (
    <div className="space-y-8">
      {/* Laptop gets a 4-across grid instead of stretching the same 3-col
          layout used on tablet — keeps cards from looking oversized on
          wide screens. */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Package size={14} />} label="Live Products" value={String(analytics.liveProducts)} themeColor={themeColor} />
        <StatCard icon={<Eye size={14} />} label="Total Views" value={analytics.totalViews.toLocaleString()} themeColor={themeColor} />
        <StatCard icon={<ShoppingBag size={14} />} label="Units Sold" value={analytics.unitsSold.toLocaleString()} themeColor={themeColor} />
        <StatCard icon={<Users size={14} />} label="Active Resellers" value={String(analytics.activeResellers)} themeColor={themeColor} />
        <StatCard icon={<Clock size={14} />} label="Orders Pending" value={String(analytics.pendingOrders)} themeColor={themeColor} />
        <StatCard icon={<Wallet size={14} />} label="Wallet Balance" value={`₦${analytics.walletBalance.toLocaleString()}`} themeColor={themeColor} />
        <StatCard icon={<Wallet size={14} />} label="Total Earned" value={`₦${analytics.totalEarned.toLocaleString()}`} themeColor={themeColor} />
        {analytics.ads && (
          <StatCard
            icon={<MousePointerClick size={14} />}
            label={`Ad — ${AD_STATUS_LABEL[analytics.ads.status] || analytics.ads.status}`}
            value={`${analytics.ads.clicks} clicks`}
            themeColor={themeColor}
          />
        )}
      </div>

      {/* Sales trend — the new headline analytics tool: 14 days of units
          sold, so a vendor can actually see momentum rather than just a
          single lifetime total. */}
      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Units Sold — Last 14 Days</p>
        {!trendHasData ? (
          <p className="text-sm text-gray-400">No sales in the last 14 days yet.</p>
        ) : (
          <div className="h-52 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.salesTrend} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  labelFormatter={d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  formatter={(value: any) => [`${value} sold`, '']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <Line type="monotone" dataKey="units" stroke={themeColor} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {analytics.ads && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <TrendingUp size={13} />
          {analytics.ads.clicks > 0
            ? `Your ad has been clicked ${analytics.ads.clicks} time${analytics.ads.clicks === 1 ? '' : 's'} for ₦${analytics.ads.totalSpent.toLocaleString()} spent so far — see the Ads tab for full detail.`
            : `Your ad has ${analytics.ads.impressions} view${analytics.ads.impressions === 1 ? '' : 's'} so far, no clicks yet — see the Ads tab for full detail.`}
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Your Top Products</p>
        {analytics.topProducts.length === 0 ? (
          <p className="text-sm text-gray-400">No live products yet — post one to start seeing analytics here.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-w-4xl">
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
