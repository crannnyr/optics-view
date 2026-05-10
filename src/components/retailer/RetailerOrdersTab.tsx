import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';

export default function RetailerOrdersTab({ profile }: { profile: any }) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchOrders();
  }, [profile]);

  const fetchOrders = async () => {
    // Fetch orders assigned to this retailer
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)') // Select items count
      .eq('retailer_id', profile.id)
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded text-xs"><CheckCircle size={12}/> Delivered</span>;
      case 'shipped': return <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-1 rounded text-xs"><Truck size={12}/> Shipped</span>;
      case 'cancelled': return <span className="flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded text-xs"><XCircle size={12}/> Cancelled</span>;
      default: return <span className="flex items-center gap-1 text-yellow-700 bg-yellow-50 px-2 py-1 rounded text-xs"><Clock size={12}/> Pending</span>;
    }
  };

  if (loading) return <div className="p-8 text-center text-xs tracking-widest text-gray-400">LOADING ORDERS...</div>;

  return (
    <div className="space-y-4">
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-gray-200 rounded">
          <Package size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No orders yet</p>
          <p className="text-xs text-gray-400 mt-1">Share your store link to start selling!</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Order Total</th>
                  <th className="px-6 py-4 text-right">Your Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-gray-600">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{order.customer_name}</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4 text-right">₦{order.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {order.retailer_profit ? `+₦${order.retailer_profit.toLocaleString()}` : '—'}
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