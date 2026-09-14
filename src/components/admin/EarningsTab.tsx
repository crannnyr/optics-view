import { useState, useEffect } from 'react';
import { TrendingUp, Loader2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Summary {
  total_product_margin: number;
  total_shipping_collected: number;
  total_delivery_collected: number;
  total_revenue: number;
  order_count: number;
}

interface ProductRow {
  product_id: string;
  product_name: string;
  units_sold: number;
  revenue: number;
  margin: number;
  margin_pct: number;
}

type RangeKey = 'all' | '30d' | '7d';

function rangeToDates(range: RangeKey): { start: string; end: string } {
  const end = new Date().toISOString();
  if (range === 'all') return { start: '2000-01-01', end };
  const days = range === '30d' ? 30 : 7;
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  return { start, end };
}

export default function EarningsTab() {
  const [range, setRange] = useState<RangeKey>('30d');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { start, end } = rangeToDates(range);
    setLoading(true);
    Promise.all([
      supabase.rpc('admin_earnings_summary', { p_start: start, p_end: end }),
      supabase.rpc('admin_earnings_by_product', { p_start: start, p_end: end }),
    ]).then(([summaryRes, productsRes]) => {
      setSummary((summaryRes.data as Summary[])?.[0] || null);
      setProducts((productsRes.data as ProductRow[]) || []);
      setLoading(false);
    });
  }, [range]);

  const totalEstimatedEarnings = summary
    ? summary.total_product_margin + summary.total_shipping_collected + summary.total_delivery_collected
    : 0;

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <TrendingUp size={24} className="text-[#0d2818]" />
          <h2 className="text-xl font-light text-[#0d2818]">Earnings</h2>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {(['7d', '30d', 'all'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${range === r ? 'bg-white shadow text-[#0d2818]' : 'text-gray-500'}`}
            >
              {r === '7d' ? '7 days' : r === '30d' ? '30 days' : 'All time'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
        <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          Product margin is estimated from the markups already in the system: vendor items use
          (sold price − vendor price), admin/import products use (sold price − cost price). Products
          missing cost data show as 100% margin — that means cost isn't recorded, not that it's
          actually free. Shipping/delivery figures only cover orders placed after this tracking was
          added — older orders show ₦0 for those.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-[11px] uppercase text-gray-400 mb-1">Product Margin</p>
              <p className="text-xl font-semibold text-[#0d2818]">₦{(summary?.total_product_margin || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-[11px] uppercase text-gray-400 mb-1">Shipping Fees Collected</p>
              <p className="text-xl font-semibold text-[#0d2818]">₦{(summary?.total_shipping_collected || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white border rounded-lg p-4">
              <p className="text-[11px] uppercase text-gray-400 mb-1">Delivery Fees Collected</p>
              <p className="text-xl font-semibold text-[#0d2818]">₦{(summary?.total_delivery_collected || 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#0d2818] text-white rounded-lg p-4">
              <p className="text-[11px] uppercase text-white/60 mb-1">Est. Total Earnings</p>
              <p className="text-xl font-semibold">₦{totalEstimatedEarnings.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            {summary?.order_count || 0} orders · ₦{(summary?.total_revenue || 0).toLocaleString()} total revenue in this period
          </p>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
                <tr>
                  <th className="text-left px-4 py-3">Product</th>
                  <th className="text-right px-4 py-3">Units Sold</th>
                  <th className="text-right px-4 py-3">Revenue</th>
                  <th className="text-right px-4 py-3">Est. Margin</th>
                  <th className="text-right px-4 py-3">Margin %</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-xs">No sales in this period</td></tr>
                ) : (
                  products.map(p => (
                    <tr key={p.product_id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-800">{p.product_name}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{p.units_sold}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₦{Number(p.revenue).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">₦{Number(p.margin).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-[#0d2818]">{p.margin_pct}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
