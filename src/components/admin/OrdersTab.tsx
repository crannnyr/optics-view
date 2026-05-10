import { useState, useEffect } from 'react';
import { supabase, Order } from '../../lib/supabase';
import OrdersList from './OrdersList';
import OrderDetailModal from './OrderDetailModal';
import { CreditCard, Smartphone, AlertTriangle, CheckCircle, XCircle, Search, Filter } from 'lucide-react';

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [viewMode, setViewMode] = useState<'active' | 'verify' | 'history'>('active');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);
   
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*, products(name, images, image_url))')
      .order('created_at', { ascending: false });
    if (data) setOrders(data as any);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setStatusLoading(orderId);
    
    const updateData: any = { status: newStatus };
    
    // Add timestamps based on status
    if (newStatus === 'shipped') updateData.shipped_at = new Date().toISOString();
    if (newStatus === 'delivered') updateData.delivered_at = new Date().toISOString();
    if (newStatus === 'rejected') updateData.rejected_at = new Date().toISOString();
    
    // Automatic verification if moving to approved
    if (newStatus === 'approved') updateData.manual_payment_verified = true;
    
    await supabase.from('orders').update(updateData).eq('id', orderId);
    await fetchOrders();
    setStatusLoading(null);
  };

  const verifyPayment = async (orderId: string, valid: boolean) => {
    if (!confirm(valid ? "Confirm payment received?" : "Mark as Fake/Unpaid? This will reject the order.")) return;
    
    setStatusLoading(orderId);
    
    try {
      if (valid) {
        // 1. Find the pending payment record for this order
        const { data: pendingPayment } = await supabase
          .from('payments')
          .select('*')
          .eq('order_id', orderId)
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(1)
          .single();

        if (pendingPayment) {
          // 2. Update payment status to 'verified' (this triggers our database function)
          await supabase
            .from('payments')
            .update({ 
              status: 'verified',
              verified_at: new Date().toISOString()
            })
            .eq('id', pendingPayment.id);
        }

        // 3. Update order verification flags
        await supabase
          .from('orders')
          .update({ 
            manual_payment_verified: true, 
            payment_verified_via: 'admin_manual'
          })
          .eq('id', orderId);

      } else {
        // Payment is fake/rejected
        await supabase
          .from('orders')
          .update({
            status: 'rejected',
            manual_payment_verified: false,
            rejection_reason: 'Payment verification failed'
          })
          .eq('id', orderId);
          
        // Also mark the payment as rejected
        await supabase
          .from('payments')
          .update({ status: 'rejected' })
          .eq('order_id', orderId)
          .eq('status', 'pending');
      }

      await fetchOrders();
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Failed to verify payment. Please try again.');
    } finally {
      setStatusLoading(null);
    }
  };

  // Enhanced filtering logic
  const filteredOrders = orders.filter(order => {
    // 1. VIEW MODE FILTER
    if (viewMode === 'verify') {
       // Only show pending transfers or unverified manual payments
       return (order.payment_method === 'transfer' && !order.manual_payment_verified && order.status !== 'rejected');
    }
    
    if (viewMode === 'active') {
      if (!['pending', 'approved', 'shipped', 'pickup'].includes(order.status)) return false;
    } else if (viewMode === 'history') {
      if (!['delivered', 'rejected'].includes(order.status)) return false;
    }
    
    // 2. TEXT SEARCH FILTER
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesName = order.customer_name?.toLowerCase().includes(query);
      const matchesEmail = order.customer_email?.toLowerCase().includes(query);
      const matchesOrderId = order.id.toLowerCase().includes(query);
      const matchesRef = order.paystack_reference?.toLowerCase().includes(query);
      
      if (!matchesName && !matchesEmail && !matchesOrderId && !matchesRef) return false;
    }
    
    // 3. DATE FILTER
    if (dateFilter === 'today') {
      const today = new Date().toDateString();
      const orderDate = new Date(order.created_at).toDateString();
      if (today !== orderDate) return false;
    } else if (dateFilter === 'custom' && customDateRange.start && customDateRange.end) {
      const orderDate = new Date(order.created_at);
      const start = new Date(customDateRange.start);
      const end = new Date(customDateRange.end);
      end.setHours(23, 59, 59, 999);
      if (orderDate < start || orderDate > end) return false;
    }
    
    // 4. STATUS FILTER (Only for Active/History)
    if (viewMode !== 'verify' && statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-light text-[#0d2818]">Order Management</h2>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-6 border-b border-gray-200 pb-4 mb-6 overflow-x-auto">
        <button
          onClick={() => setViewMode('active')}
          className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap ${
            viewMode === 'active'
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Active Orders
        </button>
        
        <button
          onClick={() => setViewMode('verify')}
          className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap flex items-center gap-2 ${
            viewMode === 'verify'
              ? 'border-b-2 border-orange-500 font-bold text-orange-600'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <AlertTriangle size={14} /> Verify Payments
          {/* Badge count for unverified transfers */}
          {orders.filter(o => o.payment_method === 'transfer' && !o.manual_payment_verified && o.status !== 'rejected').length > 0 && (
             <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full text-[10px]">
                {orders.filter(o => o.payment_method === 'transfer' && !o.manual_payment_verified && o.status !== 'rejected').length}
             </span>
          )}
        </button>

        <button
          onClick={() => setViewMode('history')}
          className={`text-xs uppercase tracking-widest pb-1 transition-colors whitespace-nowrap ${
            viewMode === 'history'
              ? 'border-b-2 border-[#0d2818] font-bold text-[#0d2818]'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          History
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border rounded-sm p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
           <Search className="absolute left-3 top-3 text-gray-400" size={16} />
           <input
             type="text"
             placeholder="Search by name, email, Order ID, or Paystack Ref..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full border pl-10 p-3 text-sm focus:border-[#0d2818] outline-none rounded"
           />
        </div>
        
        {/* Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase text-gray-500 mb-2">Date</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white rounded"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {viewMode !== 'verify' && (
             <div>
               <label className="block text-xs uppercase text-gray-500 mb-2">Status</label>
               <select
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none bg-white rounded"
               >
                 <option value="all">All Statuses</option>
                 <option value="pending">Pending</option>
                 <option value="approved">Approved</option>
                 <option value="shipped">Shipped</option>
                 <option value="delivered">Delivered</option>
                 <option value="rejected">Rejected</option>
               </select>
             </div>
          )}
          
          {/* Results Count */}
          <div className="flex items-end">
            <div className="text-sm text-gray-600">
              <span className="font-bold text-[#0d2818]">{filteredOrders.length}</span> orders found
            </div>
          </div>
        </div>
        
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-2">Start Date</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({...customDateRange, start: e.target.value})}
                className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none rounded"
              />
            </div>
            <div>
              <label className="block text-xs uppercase text-gray-500 mb-2">End Date</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({...customDateRange, end: e.target.value})}
                className="w-full border p-2 text-sm focus:border-[#0d2818] outline-none rounded"
              />
            </div>
          </div>
        )}
      </div>

      {/* SPECIAL VIEW: VERIFICATION LIST */}
      {viewMode === 'verify' ? (
        <div className="grid gap-4">
           {filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded border border-gray-100">
                 <CheckCircle className="mx-auto text-green-500 mb-2" size={32} />
                 <p className="text-gray-500 font-medium">All transfers verified!</p>
                 <p className="text-xs text-gray-400">No pending manual payments found.</p>
              </div>
           ) : (
              filteredOrders.map(order => (
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
      ) : (
        /* STANDARD ORDER LIST VIEW */
        <OrdersList
          orders={filteredOrders}
          onSelectOrder={setSelectedOrder}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStatus={updateStatus}
          statusLoading={statusLoading}
        />
      )}
    </div>
  );
}