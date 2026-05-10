import { CheckCircle, Smartphone, XCircle } from 'lucide-react';
import { Order } from '../../../lib/supabase';

interface OrderVerificationListProps {
  orders: Order[];
  verifyPayment: (orderId: string, valid: boolean) => void;
  setSelectedOrder: (order: Order) => void;
  statusLoading: string | null;
}

export default function OrderVerificationList({
  orders,
  verifyPayment,
  setSelectedOrder,
  statusLoading
}: OrderVerificationListProps) {
  return (
    <div className="grid gap-4">
       {orders.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded border border-gray-100">
             <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
             <p className="text-gray-500 font-medium">All transfers verified!</p>
             <p className="text-xs text-gray-400">No pending manual payments found.</p>
          </div>
       ) : (
          orders.map(order => (
             <div key={order.id} className="bg-white border-l-4 border-orange-400 shadow-sm rounded-r p-6 flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                   <div className="flex items-center gap-2 mb-2">
                      <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
                         <Smartphone size={12} /> TRANSFER CLAIMED
                      </span>
                      <span className="text-xs text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                   </div>
                   <h3 className="font-bold text-lg text-[#0d2818]">{order.customer_name}</h3>
                   <p className="text-sm text-gray-600 mb-4">{order.customer_email} • {order.customer_phone}</p>

                   <div className="bg-gray-50 p-3 rounded text-sm border border-gray-100">
                      <div className="flex justify-between mb-1">
                         <span className="text-gray-500">Amount Claimed Sent:</span>
                         <span className="font-bold text-lg">₦{order.payment_type === 'installment' ? (order.total_amount / 2).toLocaleString() : order.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                         <span>Date:</span>
                         <span>{new Date(order.created_at).toLocaleString()}</span>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col justify-center gap-3 min-w-[200px]">
                   <button 
                     onClick={() => verifyPayment(order.id, true)}
                     disabled={statusLoading === order.id}
                     className="w-full bg-green-600 text-white py-3 rounded text-xs font-bold tracking-wider hover:bg-green-700 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      <CheckCircle size={16} /> CONFIRM PAYMENT
                   </button>
                   <button 
                     onClick={() => verifyPayment(order.id, false)}
                     disabled={statusLoading === order.id}
                     className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded text-xs font-bold tracking-wider hover:bg-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
                   >
                      <XCircle size={16} /> REJECT (FAKE)
                   </button>
                   <button 
                     onClick={() => setSelectedOrder(order)}
                     className="text-xs text-gray-400 underline hover:text-black text-center"
                   >
                      View Full Order Details
                   </button>
                </div>
             </div>
          ))
       )}
    </div>
  );
}
