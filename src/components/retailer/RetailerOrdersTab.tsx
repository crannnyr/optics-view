import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Clock, CheckCircle, Truck, XCircle, Info } from 'lucide-react';

interface Props { profile: any; }

export default function RetailerOrdersTab({ profile }: Props) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (profile) fetchOrders(); }, [profile]);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('retailer_id', profile.id)
      .order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, JSX.Element> = {
      delivered: <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs"><CheckCircle size={12}/> Delivered</span>,
      shipped:   <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs"><Truck size={12}/> Shipped</span>,
      approved:  <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs"><CheckCircle size={12}/> Approved</span>,
      cancelled: <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs"><XCircle size={12}/> Cancelled</span>,
    };
    return map[status] ?? <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs"><Clock size={12}/> Pending</span>;
  };

  if (loading) return <div className="p-8 text-center text-xs text-gray-400">LOADING ORDERS...</div>;

  return (
    <div className="space-y-4">
      {/* Credit note */}
      <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
        <Info size={14} className="text-blue-600 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Your profit is credited to your wallet once an order is marked as <strong>Shipped</strong>.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded-lg">
          <Package size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No orders yet</p>
          <p className="text-xs text-gray-400 mt-1">Share your store link to start selling</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Your Profit</th>
                  <th className="px-4 py-3 text-center">Credited</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {new Date(order.created_at).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 text-xs">{order.customer_name}</td>
                    <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                    <td className="px-4 py-3 text-right text-xs">₦{order.total_amount?.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-xs">
                      {order.retailer_profit
                        ? <span className="text-green-600">+₦{order.retailer_profit.toLocaleString()}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-center">
                      {order.profit_credited
                        ? <CheckCircle size={14} className="mx-auto text-green-500" />
                        : <Clock size={14} className="mx-auto text-gray-300" />
                      }
                    </td>
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