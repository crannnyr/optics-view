import { useEffect, useState } from 'react';
import { supabase, Order, OrderItem, PAYSTACK_PUBLIC_KEY } from '../lib/supabase';
import { usePaystackPayment } from 'react-paystack';
import { 
  ArrowLeft, 
  MapPin, 
  Edit2, 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  CreditCard,
  Loader2,
  X,
  MessageCircle,
  Store,
  Smartphone,
  ArrowRight,
  Copy,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

interface OrderHistoryProps {
  onBack: () => void;
}

interface OrderWithItems extends Order {
  items: (OrderItem & { products: { name: string; image_url: string; images: string[] } })[];
  retailer_slug?: string;
  has_pending_payment?: boolean;
  verified_payment_count?: number;
}

export default function OrderHistory({ onBack }: OrderHistoryProps) {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [filter, setFilter] = useState('all');
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ state: '', city: '', area: '' });
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'select' | 'transfer'>('select');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  // Settings State
  const [settings, setSettings] = useState({ enable_paystack: true, enable_transfer: true });
  const [transferDetails, setTransferDetails] = useState({
    bank: "OPay",
    number: "9069149803",
    name: "Optics View Store"
  });

  // Paystack Hook
  const initializePayment = usePaystackPayment(paystackConfig);

  useEffect(() => {
    fetchOrders();
    fetchSettings();
  }, []);

  // Trigger Paystack popup when config is ready
  useEffect(() => {
    if (paystackConfig) {
      initializePayment(onPaystackSuccess, onPaystackClose);
      setPaymentLoading(false);
    }
  }, [paystackConfig]);

  const fetchSettings = async () => {
    // 1. Methods
    const { data: methodData } = await supabase.from('app_settings').select('value').eq('key', 'payment_methods').single();
    if (methodData?.value) setSettings(methodData.value);

    // 2. Transfer Details
    const { data: transferData } = await supabase.from('app_settings').select('value').eq('key', 'transfer_details').single();
    if (transferData?.value) setTransferDetails(transferData.value);
  };

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Fetch Orders
    const { data: ordersData, error } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items (
          *,
          products ( name, images, image_url )
        )
      `)
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false });

    if (error) console.error(error);

    if (ordersData) {
      const orderIds = ordersData.map(o => o.id);
      
      // 2. Get all payments for these orders (both pending and verified)
      const { data: allPayments } = await supabase
        .from('payments')
        .select('order_id, status')
        .in('order_id', orderIds);

      const processedOrders = ordersData.map((order: any) => {
        const orderPayments = allPayments?.filter(p => p.order_id === order.id) || [];
        const hasPendingPayment = orderPayments.some(p => p.status === 'pending');
        const verifiedCount = orderPayments.filter(p => p.status === 'verified').length;
        
        return {
          ...order,
          has_pending_payment: hasPendingPayment,
          verified_payment_count: verifiedCount
        };
      });

      setOrders(processedOrders);
    }
    setLoading(false);
  };

  // --- Payment Handlers ---

  const handleOpenPaymentModal = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setPaymentStep('select');
    
    // Auto-skip if only one method enabled
    if (settings.enable_paystack && !settings.enable_transfer) {
       preparePaystack(order);
    } else if (!settings.enable_paystack && settings.enable_transfer) {
       setPaymentStep('transfer');
       setIsPaymentModalOpen(true);
    } else {
       // Both enabled
       setIsPaymentModalOpen(true);
    }
  };

  const preparePaystack = (order: OrderWithItems) => {
    setPaymentLoading(true);
    setIsPaymentModalOpen(true);

    const amountToPay = order.remaining_balance || 0;
    
    // Fixed reference format to match webhook expectations: INST-{orderId}-{timestamp}
    setPaystackConfig({
      reference: `INST-${order.id}-${Date.now()}`,
      email: order.customer_email,
      amount: amountToPay * 100,
      publicKey: PAYSTACK_PUBLIC_KEY,
      metadata: {
        order_id: order.id,
        payment_type: 'balance_payment',
        custom_fields: [
          { display_name: "Order ID", variable_name: "order_id", value: order.id },
          { display_name: "Payment Type", variable_name: "payment_type", value: "balance" }
        ]
      }
    });
  };

  const onPaystackSuccess = async (reference: any) => {
    setPaymentLoading(true);
    try {
      // Get the next payment number
      const nextPaymentNumber = (selectedOrder?.verified_payment_count || 0) + 1;
      
      await supabase.from('payments').insert({
        order_id: selectedOrder?.id,
        amount: selectedOrder?.remaining_balance,
        paystack_reference: reference.reference,
        status: 'pending',
        payment_number: nextPaymentNumber,
        is_balance_payment: true
      });

      alert('Payment Successful! Updating records...');
      setIsPaymentModalOpen(false);
      setPaystackConfig(null);
      fetchOrders(); 

    } catch (error) {
      console.error('Payment record error:', error);
      alert('Payment received. Please check your email for confirmation.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const onPaystackClose = () => {
    setPaymentLoading(false);
    setPaystackConfig(null);
  };

  const handleTransferSubmit = async () => {
    setPaymentLoading(true);
    
    try {
      // Get the next payment number
      const nextPaymentNumber = (selectedOrder?.verified_payment_count || 0) + 1;
      
      await supabase.from('payments').insert({
        order_id: selectedOrder?.id,
        amount: selectedOrder?.remaining_balance,
        paystack_reference: `MANUAL-${Date.now()}`,
        status: 'pending',
        payment_number: nextPaymentNumber,
        is_balance_payment: true
      });

      alert('Transfer claim submitted! Admin will verify shortly.');
      setIsPaymentModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error(error);
      alert("Failed to submit claim");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(transferDetails.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- Location Handlers ---

  const handleUpdateLocation = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        shipping_state: editForm.state,
        shipping_city: editForm.city,
        shipping_area: editForm.area
      })
      .eq('id', orderId);

    if (!error) {
      setEditingLocationId(null);
      fetchOrders();
    }
  };

  const startEditing = (order: OrderWithItems) => {
    setEditForm({
      state: order.shipping_state || '',
      city: order.shipping_city || '',
      area: order.shipping_area || ''
    });
    setEditingLocationId(order.id);
  };

  // --- UI Helpers ---

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'approved': return { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, text: 'Approved' };
      case 'shipped': return { color: 'bg-purple-100 text-purple-800', icon: Truck, text: 'Shipped' };
      case 'delivered': return { color: 'bg-green-100 text-green-800', icon: Package, text: 'Delivered' };
      case 'rejected': return { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' };
      default: return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' };
    }
  };

  const getWhatsAppLink = (orderId: string) => {
    const message = `Hi, I need help completing payment for order ${orderId.slice(0, 8)}`;
    return `https://wa.me/2348012345678?text=${encodeURIComponent(message)}`;
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(o => o.status === filter);

  const tabs = ['all', 'pending', 'approved', 'shipped', 'delivered', 'rejected'];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xs tracking-widest">LOADING...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-light tracking-wide text-[#0d2818]">my purchases</h1>
        </div>
        
        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-6 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`py-3 text-xs tracking-widest border-b-2 transition-colors ${
                  filter === tab 
                    ? 'border-[#0d2818] text-[#0d2818] font-medium' 
                    : 'border-transparent text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* List */}
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {filteredOrders.length === 0 && (
          <div className="text-center py-20 opacity-50">
            <Package size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-sm tracking-wider text-gray-400">NO ORDERS FOUND</p>
          </div>
        )}

        {filteredOrders.map(order => {
          const statusConfig = getStatusConfig(order.status);
          const StatusIcon = statusConfig.icon;
          
          const isInstallment = order.payment_type === 'installment';
          const isFullyPaid = order.is_fully_paid;
          const paidAmount = order.amount_paid || 0;
          const totalAmount = order.total_amount || 0;
          const remaining = order.remaining_balance || 0;
          const verifiedCount = order.verified_payment_count || 0;

          // Show payment button if: not fully paid AND no pending payment
          const showPaymentButton = !isFullyPaid && !order.has_pending_payment && remaining > 0;

          return (
            <div key={order.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md rounded-lg">
              {/* Card Header */}
              <div className="p-6 pb-4 flex justify-between items-start border-b border-gray-50">
                <div>
                   <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider mb-2 ${statusConfig.color}`}>
                     <StatusIcon size={12} />
                     {statusConfig.text}
                   </div>
                   <p className="text-[10px] text-gray-400 font-mono mb-1">ID: {order.id.slice(0, 8)}</p>
                   
                   {order.retailer_slug ? (
                      <div className="inline-flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        <Store size={10} />
                        Sold by: <span className="font-bold">{order.retailer_slug}</span>
                      </div>
                   ) : (
                      <div className="inline-flex items-center gap-1 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                        <Store size={10} />
                        Sold by: <span className="font-bold">OpticsView</span>
                      </div>
                   )}
                </div>
                
                <div className="text-right">
                  <p className="font-medium text-[#0d2818]">₦{totalAmount.toLocaleString()}</p>
                  
                  {!isFullyPaid && paidAmount > 0 ? (
                    <div className="mt-2 flex flex-col items-end space-y-1">
                      <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded font-bold">
                        PAID: ₦{paidAmount.toLocaleString()}
                      </span>
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">
                        OWING: ₦{remaining.toLocaleString()}
                      </span>
                      <div className="w-24 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-orange-500" 
                          style={{ width: `${(paidAmount / totalAmount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : !isFullyPaid ? (
                    <div className="mt-2 flex flex-col items-end">
                      <span className="text-[10px] bg-red-50 text-red-600 px-2 py-0.5 rounded font-bold">
                        OWING: ₦{remaining.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              {/* Items */}
              <div className="p-6 space-y-4">
                {order.items?.map((item: any) => {
                  const imgUrl = (item.products?.images && item.products.images.length > 0) 
                    ? item.products.images[0] 
                    : item.products?.image_url;

                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-14 h-14 bg-gray-100 shrink-0 overflow-hidden rounded border border-gray-100">
                        {imgUrl ? (
                          <img 
                            src={imgUrl} 
                            alt={item.products?.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-300">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{item.products?.name}</p>
                        <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity} × ₦{item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Location & Actions */}
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                {/* Balance Payment Button */}
                {!isFullyPaid && (
                    <div className="mb-4 space-y-2">
                      {order.has_pending_payment ? (
                         <div className="w-full bg-yellow-100 text-yellow-800 px-4 py-3 text-xs font-bold flex items-center justify-center gap-2 rounded border border-yellow-200">
                            <Clock size={14} /> PAYMENT VERIFICATION PENDING
                         </div>
                      ) : showPaymentButton ? (
                        <button 
                          onClick={() => handleOpenPaymentModal(order)}
                          className="w-full flex items-center justify-center gap-2 bg-[#0d2818] text-white px-4 py-3 text-xs tracking-widest hover:bg-opacity-90 shadow-sm rounded-sm"
                        >
                          <CreditCard size={14} /> 
                          {verifiedCount === 0 ? 'COMPLETE PAYMENT' : 'PAY BALANCE'} (₦{remaining.toLocaleString()})
                        </button>
                      ) : null}
                      
                 {/* WhatsApp Support Link - only show if payment needed */}
                      {(order.has_pending_payment || showPaymentButton) && (
                        <a
                          href={getWhatsAppLink(order.id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 text-green-600 hover:text-green-700 text-xs transition-colors"
                        >
                          <MessageCircle size={14} />
                          Having payment issues? Click here to reach out
                        </a>
                      )}
                    </div>
                )}

                {/* Location Edit */}
                {editingLocationId === order.id ? (
                  <div className="space-y-3 bg-white p-4 border border-[#0d2818] rounded-sm relative">
                    <p className="text-xs font-bold text-[#0d2818] uppercase tracking-wider">Update Shipping Location</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        placeholder="State"
                        value={editForm.state}
                        onChange={e => setEditForm({...editForm, state: e.target.value})}
                        className="border p-2 text-xs outline-none focus:border-[#0d2818]"
                      />
                      <input 
                        placeholder="City"
                        value={editForm.city}
                        onChange={e => setEditForm({...editForm, city: e.target.value})}
                        className="border p-2 text-xs outline-none focus:border-[#0d2818]"
                      />
                    </div>
                    <input 
                      placeholder="Area (e.g. GIG/GUO Terminal)"
                      value={editForm.area}
                      onChange={e => setEditForm({...editForm, area: e.target.value})}
                      className="w-full border p-2 text-xs outline-none focus:border-[#0d2818]"
                    />
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleUpdateLocation(order.id)} className="bg-[#0d2818] text-white px-4 py-2 text-[10px] tracking-widest hover:opacity-90">SAVE CHANGES</button>
                      <button onClick={() => setEditingLocationId(null)} className="bg-gray-200 text-black px-4 py-2 text-[10px] tracking-widest hover:bg-gray-300">CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 items-start text-gray-600 max-w-[80%]">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="text-xs">
                        {order.shipping_city}, {order.shipping_state} <span className="font-medium">({order.shipping_area})</span>
                      </span>
                    </div>
                    
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => startEditing(order)}
                        className="flex items-center gap-1 text-[#0d2818] text-xs font-medium hover:underline pl-4 border-l border-gray-200 ml-2 shrink-0"
                      >
                        <Edit2 size={12} /> EDIT
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Delivery Disclaimer */}
              {['pending', 'approved'].includes(order.status) && (
                <div className="bg-blue-50 px-4 py-3 flex items-start gap-2 text-[10px] text-blue-800 border-t border-blue-100">
                  <AlertCircle size={12} className="mt-0.5 shrink-0" />
                  <p className="leading-relaxed">Standard delivery takes <strong className="font-medium">7 business days</strong>. International imports may take up to <strong className="font-medium">30 days</strong>.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200 shadow-2xl rounded-lg max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-light text-[#0d2818] mb-1">
              {paymentStep === 'select' ? 'Select Payment Method' : 'Complete Transfer'}
            </h3>
            <p className="text-xs text-gray-500 mb-6">Order #{selectedOrder.id.slice(0,8)} • Balance: ₦{selectedOrder.remaining_balance?.toLocaleString()}</p>

            {/* STEP 1: SELECT METHOD */}
            {paymentStep === 'select' && (
              <div className="space-y-4">
                 {settings.enable_paystack && (
                    <button 
                      onClick={() => preparePaystack(selectedOrder)}
                      disabled={paymentLoading}
                      className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all disabled:opacity-50"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                             <CreditCard size={20} />
                          </div>
                          <div className="text-left">
                             <p className="font-bold text-sm">Pay with Card</p>
                             <p className="text-[10px] text-gray-500">Instant Verification</p>
                          </div>
                       </div>
                       {paymentLoading ? <Loader2 className="animate-spin text-gray-400" size={16}/> : <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />}
                    </button>
                 )}

                 {settings.enable_transfer && (
                    <button 
                      onClick={() => setPaymentStep('transfer')}
                      className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                             <Smartphone size={20} />
                          </div>
                          <div className="text-left">
                             <p className="font-bold text-sm">Bank Transfer</p>
                             <p className="text-[10px] text-gray-500">Manual Verification</p>
                          </div>
                       </div>
                       <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
                    </button>
                 )}
              </div>
            )}

            {/* STEP 2: TRANSFER DETAILS */}
            {paymentStep === 'transfer' && (
              <div className="space-y-6">
                 <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex gap-3">
                    <AlertTriangle className="text-orange-600 shrink-0" size={20} />
                    <div>
                       <h4 className="text-sm font-bold text-orange-800 uppercase">Warning</h4>
                       <p className="text-xs text-orange-800 mt-1">
                          Fake receipts or fraudulent transfer attempts will result in an immediate account ban.
                       </p>
                    </div>
                 </div>

                 <div className="bg-gray-900 text-white p-6 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <Smartphone size={100} />
                    </div>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">Transfer Details</p>
                    
                    <div className="space-y-4 relative z-10">
                       <div>
                          <p className="text-[10px] text-gray-400">BANK NAME</p>
                          <p className="text-lg font-medium">{transferDetails.bank}</p>
                       </div>
                       <div>
                          <p className="text-[10px] text-gray-400">ACCOUNT NUMBER</p>
                          <div className="flex items-center gap-3">
                             <p className="text-2xl font-mono font-bold tracking-wider">{transferDetails.number}</p>
                             <button onClick={handleCopyAccount} className="p-2 bg-white/10 rounded hover:bg-white/20 transition-colors">
                                {copied ? <CheckCircle size={16} className="text-green-400"/> : <Copy size={16} />}
                             </button>
                          </div>
                       </div>
                       <div>
                          <p className="text-[10px] text-gray-400">ACCOUNT NAME</p>
                          <p className="text-lg font-medium">{transferDetails.name}</p>
                       </div>
                    </div>
                 </div>

                 <div className="text-center">
                    <p className="text-sm font-bold mb-2">Amount to Transfer</p>
                    <p className="text-3xl font-light text-[#0d2818]">
                       ₦{selectedOrder.remaining_balance?.toLocaleString()}
                    </p>
                 </div>

                 <button 
                    onClick={handleTransferSubmit}
                    disabled={paymentLoading}
                    className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ backgroundColor: '#0d2818' }}
                 >
                    {paymentLoading ? <Loader2 className="animate-spin" /> : <CheckCircle size={16} />}
                    I HAVE MADE THE TRANSFER
                 </button>
                 
                 <button 
                   onClick={() => setPaymentStep('select')}
                   className="w-full text-xs text-gray-500 hover:text-black underline mt-2"
                 >
                   Back to methods
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}