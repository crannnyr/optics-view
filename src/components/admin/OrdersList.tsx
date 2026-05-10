import { Order } from '../../lib/supabase';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrdersListProps {
  orders: any[]; // Using any to accomodate the joined query structure
  onSelectOrder: (order: any) => void;
}

export default function OrdersList({ orders, onSelectOrder }: OrdersListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'pickup': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm bg-gray-50">
        <p className="text-gray-400 text-xs italic">No orders found in this view.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        // Safe defaults if fields are missing (backwards compatibility)
        const isInstallment = order.payment_type === 'installment';
        const total = order.total_amount || 0;
        const paid = order.amount_paid || 0;
        const percentPaid = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
        const isFullyPaid = order.is_fully_paid || (!isInstallment); // Full payments are fully paid by default logic

        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row md:items-center justify-between cursor-pointer hover:border-[#0d2818] hover:shadow-md transition-all group gap-4"
          >
            {/* Left: Status & Info */}
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                order.status === 'pending' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-300'
              }`} />
              
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-gray-400">
                    #{order.id.slice(0, 8)}
                  </span>
                  <span className={`text-[10px] uppercase px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                  {/* Payment Badge */}
                  {isInstallment && (
                    <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded border flex items-center gap-1 ${isFullyPaid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                      {isFullyPaid ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                      {isFullyPaid ? 'Paid' : 'Partial'}
                    </span>
                  )}
                </div>
                
                <h3 className="text-sm font-medium text-[#0d2818] group-hover:underline decoration-[#0d2818]/50 underline-offset-2">
                  {order.customer_name}
                </h3>
                <p className="text-[10px] text-gray-400">
                  {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} items
                </p>
              </div>
            </div>

            {/* Right: Payment Details */}
            <div className="text-right min-w-[140px]">
              <p className="font-medium text-sm text-[#0d2818]">₦{total.toLocaleString()}</p>
              
              {isInstallment ? (
                <div className="mt-1">
                  <div className="flex justify-end items-center gap-1 text-[10px] text-gray-500 mb-1">
                    <span>{percentPaid}% Paid</span>
                    <span>(₦{paid.toLocaleString()})</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden ml-auto max-w-[140px]">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-[#0d2818]' : 'bg-orange-500'}`} 
                      style={{ width: `${percentPaid}%` }}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">Full Payment</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}