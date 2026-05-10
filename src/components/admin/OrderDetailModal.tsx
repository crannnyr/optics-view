import { useState, useEffect } from 'react';
import { supabase, Payment } from '../../lib/supabase';
import { X, MapPin, Package, Truck, CheckCircle, Loader2, AlertCircle, Clock, CreditCard } from 'lucide-react';

interface OrderDetailModalProps {
  order: any;
  onClose: () => void;
  onUpdateStatus: (orderId: string, newStatus: string) => void;
  statusLoading: string | null;
}

export default function OrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
  statusLoading
}: OrderDetailModalProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [liveOrder, setLiveOrder] = useState(order);

  useEffect(() => {
    fetchPayments();
  }, [order.id]);

  const fetchPayments = async () => {
    const { data } = await supabase
      .from('payments')
      .select('*, bank_accounts(bank_name, account_number)')
      .eq('order_id', order.id)
      .order('created_at', { ascending: false });
    
    if (data) setPayments(data);
    setLoadingPayments(false);
  };

  const verifyPayment = async (payment: any) => {
    if (!confirm(`Confirm receipt of ₦${payment.amount.toLocaleString()}?`)) return;
    
    setVerifyingId(payment.id);
    
    try {
      // 1. Count existing verified payments
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('id')
        .eq('order_id', liveOrder.id)
        .eq('status', 'verified');

      const paymentNumber = (existingPayments?.length || 0) + 1;

      // 2. Mark payment as verified
      const { error: payError } = await supabase
        .from('payments')
        .update({ 
          status: 'verified',
          verified_at: new Date().toISOString(),
          payment_number: paymentNumber
        })
        .eq('id', payment.id);

      if (payError) throw payError;

      // 3. Update Order Totals
      const newAmountPaid = (Number(liveOrder.amount_paid) || 0) + Number(payment.amount);
      const newRemaining = Math.max(0, Number(liveOrder.total_amount) - newAmountPaid);
      const isFullyPaid = newRemaining === 0;

      const updateData: any = {
        amount_paid: newAmountPaid,
        remaining_balance: newRemaining,
        is_fully_paid: isFullyPaid
      };

      // Add verified_at only on first payment
      if (paymentNumber === 1) {
        updateData.verified_at = new Date().toISOString();
      }

      const { error: orderError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', liveOrder.id);

      if (orderError) throw orderError;

      // 4. Refresh Local State
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'verified', verified_at: new Date().toISOString() } : p));
      setLiveOrder(prev => ({
        ...prev,
        amount_paid: newAmountPaid,
        remaining_balance: newRemaining,
        is_fully_paid: isFullyPaid
      }));

    } catch (err) {
      console.error('Payment verification failed', err);
      alert('Failed to update payment status');
    } finally {
      setVerifyingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'pickup': return 'bg-indigo-100 text-indigo-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const total = liveOrder.total_amount || 0;
  const paid = liveOrder.amount_paid || 0;
  const progress = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
  const isInstallment = liveOrder.payment_type === 'installment';

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto p-0 relative shadow-2xl rounded-sm flex flex-col">
        
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 flex justify-between items-center">
           <div>
             <h2 className="text-xl font-light text-[#0d2818]">Order Details</h2>
             <div className="flex items-center gap-2 text-xs mt-1">
               <span className="font-mono text-gray-500">#{liveOrder.id.slice(0, 8)}</span>
               <span className={`uppercase px-2 py-0.5 rounded font-bold ${getStatusColor(liveOrder.status)}`}>
                 {liveOrder.status}
               </span>
               {isInstallment && (
                 <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded uppercase font-bold flex items-center gap-1">
                   <Clock size={12} /> Installment
                 </span>
               )}
             </div>
           </div>
           <button onClick={onClose} className="bg-gray-100 p-2 rounded-full hover:bg-gray-200 transition-colors">
             <X size={20} />
           </button>
        </div>

        <div className="p-6 space-y-8">
          
          {isInstallment && (
            <div className="bg-[#0d2818]/5 border border-[#0d2818]/10 p-6 rounded-sm">
              <h3 className="text-sm font-bold text-[#0d2818] uppercase tracking-wider mb-4 flex items-center gap-2">
                <CreditCard size={16} /> Payment Progress
              </h3>
              
              <div className="flex justify-between items-end mb-2 text-sm">
                <div>
                  <span className="text-gray-500">Paid:</span>
                  <span className="font-bold text-lg text-[#0d2818] ml-2">₦{paid.toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-gray-900 ml-2">₦{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div 
                  className={`h-full transition-all duration-700 ${liveOrder.is_fully_paid ? 'bg-green-600' : 'bg-[#0d2818]'}`} 
                  style={{ width: `${progress}%` }} 
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className={`${liveOrder.is_fully_paid ? 'text-green-600 font-bold' : 'text-orange-600 font-medium'}`}>
                  {liveOrder.is_fully_paid ? 'PAYMENT COMPLETE' : `Outstanding: ₦${liveOrder.remaining_balance?.toLocaleString()}`}
                </span>
                <span className="text-gray-400">{progress}% Funded</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold border-b pb-1">Customer</h3>
              <div className="space-y-1 mb-4">
                <p className="font-medium text-sm">{liveOrder.customer_name}</p>
                <p className="text-xs text-gray-600 font-mono">{liveOrder.customer_email}</p>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                <MapPin size={16} className="mt-0.5 shrink-0 text-[#0d2818]" />
                <div className="leading-relaxed">
                  <p>{liveOrder.customer_address}</p>
                  <p>{liveOrder.shipping_city}, {liveOrder.shipping_state}</p>
                  <p className="font-bold text-gray-900 mt-1">Area: {liveOrder.shipping_area}</p>
                </div>
              </div>
            </div>

            <div>
               <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold border-b pb-1">Transactions</h3>
               {loadingPayments ? (
                 <div className="flex justify-center py-4"><Loader2 className="animate-spin text-gray-300"/></div>
               ) : payments.length === 0 ? (
                 <p className="text-xs text-gray-400 italic">No transactions recorded.</p>
               ) : (
                 <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                   {payments.map(pay => (
                     <div key={pay.id} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                       <div>
                         <p className="font-bold text-[#0d2818]">₦{pay.amount.toLocaleString()}</p>
                         <p className="text-[10px] text-gray-500">{new Date(pay.created_at).toLocaleDateString()}</p>
                         <p className="text-[10px] text-gray-400">{pay.bank_accounts?.bank_name}</p>
                       </div>
                       
                       {pay.status === 'verified' ? (
                         <span className="flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded border border-green-100">
                           <CheckCircle size={10} /> Verified
                         </span>
                       ) : (
                         (isInstallment || !liveOrder.verified_at) && (
                           <button 
                             onClick={() => verifyPayment(pay)}
                             disabled={verifyingId === pay.id}
                             className="bg-[#0d2818] text-white px-3 py-1.5 rounded hover:bg-opacity-90 disabled:opacity-50 transition-colors"
                           >
                             {verifyingId === pay.id ? <Loader2 size={10} className="animate-spin"/> : 'VERIFY'}
                           </button>
                         )
                       )}
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-3 font-bold border-b pb-1">Items Ordered</h3>
            <div className="space-y-2">
              {liveOrder.items.map((item: any, idx: number) => {
                const imgUrl = item.products?.images?.[0] || item.products?.image_url;
                return (
                  <div key={idx} className="flex gap-4 items-center bg-white border border-gray-100 p-2 rounded hover:border-gray-200 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 shrink-0 overflow-hidden rounded">
                      {imgUrl ? (
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-full h-full p-2 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.products?.name}</p>
                      <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-mono text-gray-600">₦{(item.quantity * item.price).toLocaleString()}</p>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase">Grand Total</p>
                <p className="text-xl font-bold text-[#0d2818]">₦{liveOrder.total_amount.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 -mx-6 -mb-6 p-4 border-t border-gray-200 flex justify-end gap-3">
             {statusLoading === liveOrder.id ? (
               <div className="flex items-center gap-2 text-sm text-gray-500 px-4">
                 <Loader2 className="animate-spin" size={16} /> Updating...
               </div>
             ) : (
               <>
                 {liveOrder.status === 'pending' && (
                   <>
                     <button onClick={() => onClose()} className="px-4 py-2 text-xs border bg-white hover:bg-gray-50">CLOSE</button>
                     <button onClick={() => onUpdateStatus(liveOrder.id, 'rejected')} className="px-4 py-2 text-xs bg-red-100 text-red-700 hover:bg-red-200 border border-red-200">REJECT</button>
                     <button onClick={() => onUpdateStatus(liveOrder.id, 'approved')} className="px-6 py-2 text-xs bg-[#0d2818] text-white hover:bg-[#1a3d28]">APPROVE ORDER</button>
                   </>
                 )}
                 {liveOrder.status === 'approved' && (
                   <button onClick={() => onUpdateStatus(liveOrder.id, 'shipped')} className="px-6 py-2 text-xs bg-[#0d2818] text-white hover:bg-[#1a3d28] flex items-center gap-2">
                     <Truck size={14} /> MARK SHIPPED
                   </button>
                 )}
                 {liveOrder.status === 'shipped' && (
                   <button onClick={() => onUpdateStatus(liveOrder.id, 'delivered')} className="px-6 py-2 text-xs bg-green-600 text-white hover:bg-green-700 flex items-center gap-2">
                     <CheckCircle size={14} /> CONFIRM DELIVERY
                   </button>
                 )}
               </>
             )}
          </div>

        </div>
      </div>
    </div>
  );
}