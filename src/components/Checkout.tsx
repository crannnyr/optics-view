import { useState, useEffect } from 'react';
import { supabase, CartItem, PAYSTACK_PUBLIC_KEY } from '../lib/supabase';
import { PaystackButton } from 'react-paystack';
import { X, Loader2, CreditCard, PieChart, CheckCircle, Smartphone, AlertTriangle, Copy, ArrowRight, ShieldCheck } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onSuccess: () => void;
}

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

export default function Checkout({ isOpen, onClose, items, onSuccess }: CheckoutProps) {
  const { store } = useStore();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // Step 3 is now Method Selection, 4 is Payment
  const [loading, setLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'full' | 'installment'>('full');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'transfer'>('paystack');
  const [shippingData, setShippingData] = useState({ state: '', city: '', area: '' });
  const [processingMessage, setProcessingMessage] = useState('');
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState({ enable_paystack: true, enable_transfer: true });
  const [copied, setCopied] = useState(false);

  // Transfer Details (Now dynamic from database)
  const [transferDetails, setTransferDetails] = useState({
    bank: "OPay",
    number: "9069149803",
    name: "Optics View Store"
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPaymentMode('full');
      setPaystackConfig(null);
      setCurrentOrderId(null);
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    // Fetch Payment Methods
    const { data: methodData } = await supabase.from('app_settings').select('*').eq('key', 'payment_methods').single();
    if (methodData?.value) {
      setSettings(methodData.value);
    }

    // Fetch Transfer Details (NEW)
    const { data: transferData } = await supabase.from('app_settings').select('*').eq('key', 'transfer_details').single();
    if (transferData?.value) {
      setTransferDetails(transferData.value);
    }
  };

  // --- Calculations ---
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
   
  const calculateShipping = () => {
    if (totalItems <= 5) return 4950;
    if (totalItems <= 30) return 7800;
    if (totalItems <= 100) return 10000;
    return 15000;
  };

  const subtotal = items.reduce((sum, item) => {
    const threshold = item.product.wholesale_min_qty || 7;
    const price = (item.quantity >= threshold && item.product.wholesale_price) 
      ? item.product.wholesale_price 
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const totalOrderAmount = subtotal + calculateShipping();
  const payableAmount = paymentMode === 'full' 
    ? totalOrderAmount 
    : Math.ceil(totalOrderAmount / 2);
  const remainingBalance = totalOrderAmount - payableAmount;

  // --- Handlers ---
  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePlanSelection = () => {
    // If only one method is enabled, skip selection step
    if (settings.enable_paystack && !settings.enable_transfer) {
      setPaymentMethod('paystack');
      createOrder('paystack');
    } else if (!settings.enable_paystack && settings.enable_transfer) {
      setPaymentMethod('transfer');
      createOrder('transfer');
    } else {
      // Both enabled, let user choose
      setStep(3);
    }
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(transferDetails.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createOrder = async (method: 'paystack' | 'transfer') => {
    setLoading(true);
    setProcessingMessage('Creating secure order...');
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const orderReference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          customer_name: user.user_metadata.full_name || 'Customer',
          customer_email: user.email,
          customer_phone: user.user_metadata.phone || '',
          customer_address: `${shippingData.city}, ${shippingData.state} (${shippingData.area})`,
          shipping_state: shippingData.state,
          shipping_city: shippingData.city,
          shipping_area: shippingData.area,
          total_amount: totalOrderAmount,
          status: 'pending',
          payment_type: paymentMode,
          payment_method: method,
          manual_payment_verified: false,
          amount_paid: 0,
          remaining_balance: totalOrderAmount,
          is_fully_paid: false,
          paystack_reference: orderReference,
          retailer_id: store.id,
          retailer_slug: store.slug
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      setCurrentOrderId(order.id);

      // Create Order Items
      const orderItems = items.map(item => {
        const threshold = item.product.wholesale_min_qty || 7;
        return {
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          price: (item.quantity >= threshold && item.product.wholesale_price) 
            ? item.product.wholesale_price 
            : item.product.price,
          selected_color: item.selectedColor || null,
          selected_type: item.selectedType || null
        };
      });

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      if (method === 'paystack') {
        // Prepare Paystack Config
        setPaystackConfig({
          reference: orderReference,
          email: user.email!,
          amount: payableAmount * 100,
          publicKey: PAYSTACK_PUBLIC_KEY,
          metadata: {
            order_id: order.id,
            payment_type: paymentMode,
            retailer_id: store.id
          }
        });
      }

      setStep(4);
      setLoading(false);
      setProcessingMessage('');

    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to create order. Please try again.');
      setLoading(false);
    }
  };

  const handleTransferComplete = async () => {
    setLoading(true);
    setProcessingMessage('Recording transaction...');
    
    try {
      // Create a pending payment record for admin to verify
      await supabase.from('payments').insert({
        order_id: currentOrderId,
        amount: payableAmount,
        paystack_reference: `MANUAL-${Date.now()}`,
        status: 'pending',
        payment_number: 1,
        is_balance_payment: false
      });

      setProcessingMessage('Order placed! Awaiting verification.');
      
      setTimeout(() => {
        onSuccess();
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Payment record error:', error);
      alert('Failed to record payment. Please contact support.');
      setLoading(false);
    }
  };

  const handlePaystackSuccess = async (reference: any) => {
    setLoading(true);
    setProcessingMessage('Verifying payment...');

    try {
      await supabase.from('payments').insert({
        order_id: currentOrderId,
        amount: payableAmount,
        paystack_reference: reference.reference,
        status: 'pending',
        payment_number: 1,
        is_balance_payment: false
      });

      // Quick update to say we used paystack
      await supabase.from('orders').update({ payment_verified_via: 'paystack' }).eq('id', currentOrderId);

      setProcessingMessage('Payment successful! 🎉');
      setTimeout(() => {
        onSuccess();
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Payment record error:', error);
      onSuccess(); // Close anyway, webhook will handle it
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg relative max-h-[90vh] overflow-y-auto rounded-lg shadow-2xl">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-light tracking-wider" style={{ color: store.themeColor }}>
              {step === 1 && 'SHIPPING DETAILS'}
              {step === 2 && 'PAYMENT PLAN'}
              {step === 3 && 'SELECT METHOD'}
              {step === 4 && (paymentMethod === 'paystack' ? 'CARD PAYMENT' : 'TRANSFER DETAILS')}
            </h2>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`h-1 w-8 rounded-full transition-colors ${i <= step ? 'bg-gray-800' : 'bg-gray-200'}`} style={i <= step ? { backgroundColor: store.themeColor } : {}} />
              ))}
            </div>
          </div>
          <button onClick={onClose} disabled={loading} className="text-gray-400 hover:text-black transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8">
            
          {/* STEP 1: SHIPPING */}
          {step === 1 && (
            <form onSubmit={handleShippingSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs uppercase text-gray-500 mb-2">State</label>
                    <select 
                      required
                      value={shippingData.state}
                      onChange={e => setShippingData({...shippingData, state: e.target.value})}
                      className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white transition-colors outline-none focus:border-black"
                    >
                      <option value="">Select...</option>
                      {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs uppercase text-gray-500 mb-2">City</label>
                    <input 
                      required
                      type="text"
                      value={shippingData.city}
                      onChange={e => setShippingData({...shippingData, city: e.target.value})}
                      className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
                      placeholder="e.g. Lekki"
                    />
                 </div>
              </div>
              
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-2">Closest Bus Stop / Area</label>
                <input 
                  required
                  type="text"
                  value={shippingData.area}
                  onChange={e => setShippingData({...shippingData, area: e.target.value})}
                  className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
                  placeholder="e.g. Chevron Drive, Lekki Phase 1"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items ({totalItems})</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>₦{calculateShipping().toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                  <span>Total</span>
                  <span>₦{totalOrderAmount.toLocaleString()}</span>
                </div>
              </div>

              <button 
                className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 transition-opacity rounded mt-2"
                style={{ backgroundColor: store.themeColor }}
              >
                CONTINUE
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT PLAN */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold mb-4">Select Payment Plan</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPaymentMode('full')}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      paymentMode === 'full' 
                        ? 'ring-2 ring-offset-2' 
                        : 'hover:border-gray-400'
                    }`}
                    style={paymentMode === 'full' ? { borderColor: store.themeColor, ringColor: store.themeColor } : {}}
                  >
                    <div className="flex justify-center mb-2">
                       <CreditCard size={24} style={{ color: paymentMode === 'full' ? store.themeColor : '#9ca3af' }} />
                    </div>
                    <p className="font-bold text-sm">Pay Full</p>
                    <p className="text-xs text-gray-500 mt-1">₦{totalOrderAmount.toLocaleString()}</p>
                  </button>
                  
                  <button 
                    onClick={() => setPaymentMode('installment')}
                    className={`p-4 border rounded-lg text-center transition-all ${
                      paymentMode === 'installment' 
                        ? 'ring-2 ring-offset-2' 
                        : 'hover:border-gray-400'
                    }`}
                    style={paymentMode === 'installment' ? { borderColor: store.themeColor, ringColor: store.themeColor } : {}}
                  >
                    <div className="flex justify-center mb-2">
                       <PieChart size={24} style={{ color: paymentMode === 'installment' ? store.themeColor : '#9ca3af' }} />
                    </div>
                    <p className="font-bold text-sm">Pay Half</p>
                    <p className="text-xs text-gray-500 mt-1">₦{Math.ceil(totalOrderAmount/2).toLocaleString()}</p>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-100">
                 <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Due Now:</span>
                    <span className="text-xl font-bold" style={{ color: store.themeColor }}>
                       ₦{payableAmount.toLocaleString()}
                    </span>
                 </div>
                 {paymentMode === 'installment' && (
                    <p className="text-[10px] text-gray-500 mt-2 text-right">
                       Balance of ₦{remainingBalance.toLocaleString()} due before delivery.
                    </p>
                 )}
              </div>

              <button 
                onClick={handlePlanSelection}
                className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-2"
                style={{ backgroundColor: store.themeColor }}
              >
                PROCEED TO PAYMENT <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* STEP 3: METHOD SELECTION */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <p className="text-center text-sm text-gray-600 mb-6">How would you like to pay <strong>₦{payableAmount.toLocaleString()}</strong>?</p>
              
              <div className="space-y-3">
                 {settings.enable_transfer && (
                    <button 
                      onClick={() => { setPaymentMethod('transfer'); createOrder('transfer'); }}
                      className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all hover:shadow-md"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700">
                             <Smartphone size={20} />
                          </div>
                          <div className="text-left">
                             <p className="font-bold text-sm">Instant Bank Transfer</p>
                             <span className="inline-block px-2 py-0.5 bg-green-100 text-green-800 text-[10px] font-bold rounded mt-1">FASTEST</span>
                          </div>
                       </div>
                       <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
                    </button>
                 )}

                 {settings.enable_paystack && (
                    <button 
                      onClick={() => { setPaymentMethod('paystack'); createOrder('paystack'); }}
                      className="w-full p-4 border border-gray-200 rounded-lg flex items-center justify-between hover:border-black group transition-all hover:shadow-md"
                    >
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                             <CreditCard size={20} />
                          </div>
                          <div className="text-left">
                             <p className="font-bold text-sm">Pay with Card</p>
                             <p className="text-[10px] text-gray-500">Secured by Paystack</p>
                          </div>
                       </div>
                       <ArrowRight size={16} className="text-gray-300 group-hover:text-black" />
                    </button>
                 )}
              </div>

              {loading && (
                 <div className="text-center pt-4">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" style={{ color: store.themeColor }} />
                    <p className="text-xs text-gray-500">Initializing order...</p>
                 </div>
              )}
            </div>
          )}

          {/* STEP 4: PAYMENT EXECUTION */}
          {step === 4 && (
            <div className="animate-in fade-in zoom-in-95 duration-300">
               {paymentMethod === 'paystack' && paystackConfig ? (
                  <div className="text-center space-y-6">
                     <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-600 mb-4">
                        <CreditCard size={32} />
                     </div>
                     <div>
                        <h3 className="text-lg font-medium">Complete Card Payment</h3>
                        <p className="text-sm text-gray-500 mt-1">Click the button below to launch the secure payment window.</p>
                     </div>
                     <PaystackButton 
                        {...paystackConfig}
                        text="PAY NOW"
                        onSuccess={handlePaystackSuccess}
                        onClose={() => alert("Payment cancelled")}
                        className="w-full text-white py-4 text-sm font-bold tracking-widest hover:opacity-90 rounded shadow-lg"
                        style={{ backgroundColor: store.themeColor }}
                     />
                     <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400">
                        <ShieldCheck size={12} />
                        SECURED BY PAYSTACK
                     </div>
                  </div>
               ) : (
                  <div className="space-y-6">
                     <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex gap-3">
                        <AlertTriangle className="text-orange-600 shrink-0" size={20} />
                        <div>
                           <h4 className="text-sm font-bold text-orange-800 uppercase">Warning</h4>
                           <p className="text-xs text-orange-800 mt-1">
                              Fake receipts or fraudulent transfer attempts will result in an immediate and permanent account ban.
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
                        <p className="text-3xl font-light" style={{ color: store.themeColor }}>
                           ₦{payableAmount.toLocaleString()}
                        </p>
                     </div>

                     <button 
                        onClick={handleTransferComplete}
                        disabled={loading}
                        className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 rounded flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{ backgroundColor: store.themeColor }}
                     >
                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={16} />}
                        I HAVE MADE THE TRANSFER
                     </button>
                  </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}