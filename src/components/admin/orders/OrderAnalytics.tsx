import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { ShoppingBag, TrendingUp, Clock, RotateCcw, Store, CreditCard, AlertTriangle } from 'lucide-react';

interface Props { orders: any[]; }

const COLORS = ['#0d2818', '#4ade80', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function OrderAnalytics({ orders }: Props) {
  const stats = useMemo(() => {
    const total      = orders.length;
    const revenue    = orders.filter(o => ['approved','shipped','delivered'].includes(o.status))
                             .reduce((s, o) => s + (o.total_amount || 0), 0);
    const pending    = orders.filter(o => o.status === 'pending').length;
    const delivered  = orders.filter(o => o.status === 'delivered').length;
    const refunded   = orders.filter(o => o.status === 'refunded').length;
    const refundAmt  = orders.filter(o => o.status === 'refunded')
                             .reduce((s, o) => s + (o.refund_amount || 0), 0);
    const unavailable = orders.filter(o => o.status === 'unavailable').length;

    // Payment method split
    const paystack  = orders.filter(o => o.payment_method === 'paystack').length;
    const transfer  = orders.filter(o => o.payment_method === 'transfer').length;

    // Source split
    const mainStore     = orders.filter(o => !o.retailer_id).length;
    const retailerStore = orders.filter(o => !!o.retailer_id).length;

    // Retailer breakdown
    const retailerMap: Record<string, { slug: string; orders: number; revenue: number }> = {};
    orders.filter(o => o.retailer_slug).forEach(o => {
      if (!retailerMap[o.retailer_slug]) retailerMap[o.retailer_slug] = { slug: o.retailer_slug, orders: 0, revenue: 0 };
      retailerMap[o.retailer_slug].orders++;
      retailerMap[o.retailer_slug].revenue += o.total_amount || 0;
    });
    const retailers = Object.values(retailerMap).sort((a, b) => b.orders - a.orders).slice(0, 10);

    // Daily orders — last 14 days
    const daily: Record<string, number> = {};
    const now = Date.now();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      daily[d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })] = 0;
    }
    orders.forEach(o => {
      const d = new Date(o.created_at);
      if (now - d.getTime() < 14 * 86400000) {
        const key = d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' });
        if (key in daily) daily[key]++;
      }
    });
    const dailyData = Object.entries(daily).map(([date, count]) => ({ date, count }));

    // Status breakdown for pie
    const statusMap: Record<string, number> = {};
    orders.forEach(o => { statusMap[o.status] = (statusMap[o.status] || 0) + 1; });
    const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

    return {
      total, revenue, pending, delivered, refunded, refundAmt,
      unavailable, paystack, transfer, mainStore, retailerStore,
      retailers, dailyData, statusData,
    };
  }, [orders]);

  const KPI = ({ icon, label, value, sub, color = 'text-[#0d2818]' }: any) => (
    <div className="bg-white border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-1 text-gray-400">
        {icon}
        <p className="text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-xl font-light text-[#0d2818]">Analytics</h2>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI icon={<ShoppingBag size={14}/>} label="Total Orders"   value={stats.total} />
        <KPI icon={<TrendingUp size={14}/>}  label="Revenue"        value={`₦${stats.revenue.toLocaleString()}`} sub="Approved + shipped + delivered" />
        <KPI icon={<Clock size={14}/>}       label="Pending Action" value={stats.pending} color="text-amber-600" />
        <KPI icon={<RotateCcw size={14}/>}   label="Refunded"       value={`₦${stats.refundAmt.toLocaleString()}`} sub={`${stats.refunded} orders`} color="text-red-600" />
      </div>

      {/* Payment method + Source */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><CreditCard size={13}/> Payment Methods</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[
                { name: 'Paystack', value: stats.paystack },
                { name: 'Transfer', value: stats.transfer },
              ]} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#0d2818" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} orders`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0d2818] inline-block"/>Paystack: {stats.paystack}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"/>Transfer: {stats.transfer}</span>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2"><Store size={13}/> Order Source</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={[
                { name: 'Main Store', value: stats.mainStore },
                { name: 'Retailers', value: stats.retailerStore },
              ]} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                <Cell fill="#0d2818" />
                <Cell fill="#8b5cf6" />
              </Pie>
              <Tooltip formatter={(v: any) => [`${v} orders`]} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-xs text-gray-500 mt-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0d2818] inline-block"/>Main: {stats.mainStore}</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"/>Retailers: {stats.retailerStore}</span>
          </div>
        </div>
      </div>

      {/* Daily orders chart */}
      <div className="bg-white border rounded-lg p-5">
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Orders — Last 14 Days</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={stats.dailyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(v: any) => [`${v} orders`]} />
            <Bar dataKey="count" fill="#0d2818" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Status Breakdown</p>
          <div className="space-y-2">
            {stats.statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-3 text-sm">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1 capitalize text-gray-700">{s.name}</span>
                <span className="font-bold text-[#0d2818]">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Refund tracker */}
        <div className="bg-white border rounded-lg p-5">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={13} className="text-amber-500" /> Refund Tracker
          </p>
          <div className="space-y-3 text-sm">
            {[
              ['Unavailable (pending refund)', stats.unavailable, 'text-amber-600'],
              ['Refunded', stats.refunded, 'text-green-600'],
              ['Total Refunded Amount', `₦${stats.refundAmt.toLocaleString()}`, 'text-red-600'],
            ].map(([label, value, cls]) => (
              <div key={String(label)} className="flex justify-between">
                <span className="text-gray-500">{label}</span>
                <span className={`font-bold ${cls}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Retailer performance */}
      {stats.retailers.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b">
            <p className="text-xs uppercase tracking-widest text-gray-400">Retailer Performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left">Store</th>
                  <th className="px-4 py-3 text-right">Orders</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {stats.retailers.map(r => (
                  <tr key={r.slug} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-[#0d2818]">{r.slug}</td>
                    <td className="px-4 py-3 text-right">{r.orders}</td>
                    <td className="px-4 py-3 text-right font-mono">₦{r.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}