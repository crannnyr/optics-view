import { hasVendorItems } from './hooks/useOrders';

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved:    'bg-blue-100 text-blue-800 border-blue-200',
  shipped:     'bg-purple-100 text-purple-800 border-purple-200',
  delivered:   'bg-green-100 text-green-800 border-green-200',
  rejected:    'bg-red-100 text-red-800 border-red-200',
  unavailable: 'bg-orange-100 text-orange-800 border-orange-200',
  refunded:    'bg-gray-100 text-gray-600 border-gray-200',
};

interface Props {
  orders: any[];
  onSelectOrder: (order: any) => void;
}

export default function OrdersList({ orders, onSelectOrder }: Props) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-200 rounded bg-gray-50">
        <p className="text-gray-400 text-xs italic">No orders found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => (
        <div
          key={order.id}
          onClick={() => onSelectOrder(order)}
          className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:border-[#0d2818] hover:shadow-sm transition-all gap-4 rounded"
        >
          <div className="flex items-start gap-4">
            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${order.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'}`} />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-[10px] text-gray-400">#{order.id.slice(0, 8)}</span>
                <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {order.status}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded border ${
                  order.payment_method === 'paystack'
                    ? 'bg-blue-50 text-blue-600 border-blue-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200'
                }`}>
                  {order.payment_method === 'paystack' ? 'Paystack' : 'Transfer'}
                </span>
                {order.retailer_slug && (
                  <span className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded">
                    {order.retailer_slug}
                  </span>
                )}
                {hasVendorItems(order) && (
                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded">
                    + vendor items
                  </span>
                )}
              </div>
              <p className="text-sm font-medium text-[#0d2818]">{order.customer_name}</p>
              <p className="text-[10px] text-gray-400">
                {new Date(order.created_at).toLocaleDateString('en-NG')} · {order.items?.length || 0} items
              </p>
            </div>
          </div>

          <div className="text-right min-w-[120px]">
            <p className="font-medium text-sm text-[#0d2818]">₦{(order.total_amount || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
              {order.payment_method === 'paystack' ? 'Auto-approved' : order.manual_payment_verified ? 'Verified' : 'Unverified'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}