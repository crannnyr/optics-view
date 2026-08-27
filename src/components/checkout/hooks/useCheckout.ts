import { useState, useEffect } from 'react';
import { supabase, CartItem, PAYSTACK_PUBLIC_KEY } from '../../../lib/supabase';
import { useStore } from '../../../context/StoreContext';
import { sendEmail } from '../../../lib/email';

export const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", 
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", 
  "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", 
  "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", 
  "Taraba", "Yobe", "Zamfara"
];

// Preset list for the "which bank are you transferring FROM" selector on manual
// payment (Badge 2). CBN-licensed commercial + non-interest banks only — no
// fintechs/OPay/Kuda/etc, per instruction that Moniepoint is the sole fintech
// exception. Heritage Bank intentionally excluded: its licence was revoked by
// the CBN on 3 June 2024 and it is in liquidation, so it's no longer a valid
// sending bank. Keep this list to institutions actually verified as currently
// licensed — do not add entries without checking current CBN status first.
export const SENDER_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "First City Monument Bank (FCMB)", "Globus Bank",
  "Guaranty Trust Bank (GTBank)", "Jaiz Bank", "Keystone Bank", "Lotus Bank",
  "Optimus Bank", "Parallex Bank", "Polaris Bank", "Premium Trust Bank",
  "Providus Bank", "Signature Bank", "Stanbic IBTC Bank",
  "Standard Chartered Bank", "Sterling Bank", "SunTrust Bank", "Taj Bank",
  "The Alternative Bank", "Titan Trust Bank", "Union Bank of Nigeria",
  "United Bank for Africa (UBA)", "Unity Bank", "Wema Bank", "Zenith Bank",
] as const;

// The one fintech exception, called out separately in the UI from the
// commercial-bank list above.
export const SENDER_BANK_FINTECH_EXCEPTION = "Moniepoint" as const;

interface ShippingData {
  state: string; city: string; lga: string; landmark: string; area: string; phone1: string; phone2: string;
  deliveryMethod: 'pickup' | 'home';
  pickupStationId: string | null;
  pickupStationName: string | null;
  pickupStationAddress: string | null;
}

export interface ShippingConfig {
  pickup_fee_default: number;
  home_fee: number;
  pickup_eta_min_days: number;
  pickup_eta_max_days: number;
  home_eta_min_days: number;
  home_eta_max_days: number;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  pickup_fee_default: 1000,
  home_fee: 6500,
  pickup_eta_min_days: 2,
  pickup_eta_max_days: 4,
  home_eta_min_days: 5,
  home_eta_max_days: 7,
};

interface RetryOrder {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  payment_method: string;
  paystack_reference: string | null;
}

interface UseCheckoutProps {
  isOpen: boolean;
  items: CartItem[];
  onSuccess: () => void;
  retryOrderId?: string | null;
}

export function useCheckout({ isOpen, items, onSuccess, retryOrderId }: UseCheckoutProps) {
  const { store } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'transfer'>('paystack');
  const [shippingData, setShippingData] = useState<ShippingData>({
    state: '', city: '', lga: '', landmark: '', area: '', phone1: '', phone2: '',
    deliveryMethod: 'pickup', pickupStationId: null, pickupStationName: null, pickupStationAddress: null,
  });
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState('');
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState({ enable_paystack: true, enable_transfer: true });
  const [copied, setCopied] = useState(false);

  const [transferDetails, setTransferDetails] = useState({
    bank: "Moniepoint",
    number: "6001470094",
    name: "Opticsview Commerce"
  });

  const [senderName, setSenderName] = useState('');
  const [senderBankName, setSenderBankName] = useState('');
  const [deliveryFees, setDeliveryFees] = useState<Record<string, number>>({});
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig>(DEFAULT_SHIPPING_CONFIG);

  const [retryOrder, setRetryOrder] = useState<RetryOrder | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);
  const isRetryMode = !!retryOrder;

  useEffect(() => {
    if (!isOpen) return;

    setPaystackConfig(null);
    setSenderName('');
    setSenderBankName('');
    setRetryError(null);
    fetchSettings();

    if (retryOrderId) {
      loadRetryOrder(retryOrderId);
    } else {
      setStep(1);
      setCurrentOrderId(null);
      setRetryOrder(null);
      prefillFromLastOrder();
    }
  }, [isOpen, retryOrderId]);

  // Auto-fill shipping details (and pickup station, if they've used one
  // before) from the customer's most recent order, so returning shoppers
  // don't have to retype everything. Only runs for a fresh checkout, never
  // overwrites an in-progress retry order's data.
  const prefillFromLastOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: lastOrder } = await supabase
      .from('orders')
      .select('shipping_state, shipping_city, shipping_lga, shipping_area, shipping_landmark, customer_phone_1, customer_phone_2, delivery_method, pickup_station_id, pickup_station_name, pickup_station_address')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastOrder) return;

    setShippingData(prev => ({
      ...prev,
      state: lastOrder.shipping_state || prev.state,
      city: lastOrder.shipping_city || prev.city,
      lga: lastOrder.shipping_lga || prev.lga,
      area: lastOrder.shipping_area || prev.area,
      landmark: lastOrder.shipping_landmark || prev.landmark,
      phone1: lastOrder.customer_phone_1 || prev.phone1,
      phone2: lastOrder.customer_phone_2 || prev.phone2,
      // Only auto-select a pickup station if they actually used one last
      // time. If their last order was home delivery (or they have no
      // pickup history), leave delivery method/station as default — the
      // station list still works normally, nothing forced.
      ...(lastOrder.delivery_method === 'pickup' && lastOrder.pickup_station_id ? {
        deliveryMethod: 'pickup' as const,
        pickupStationId: lastOrder.pickup_station_id,
        pickupStationName: lastOrder.pickup_station_name,
        pickupStationAddress: lastOrder.pickup_station_address,
      } : {}),
    }));
  };

  const fetchSettings = async () => {
    const { data: methodData } = await supabase.from('app_settings').select('*').eq('key', 'payment_methods').single();
    if (methodData?.value) setSettings(methodData.value);

    const { data: transferData } = await supabase.from('app_settings').select('*').eq('key', 'transfer_details').single();
    if (transferData?.value) setTransferDetails(transferData.value);

    const { data: shippingCfg } = await supabase
      .from('app_settings').select('value').eq('key', 'shipping_config').maybeSingle();
    if (shippingCfg?.value) setShippingConfig({ ...DEFAULT_SHIPPING_CONFIG, ...shippingCfg.value });

    const { data: deliveryData } = await supabase
      .from('delivery_settings')
      .select('state, delivery_fee');
    if (deliveryData) {
      const map: Record<string, number> = {};
      deliveryData.forEach(row => { map[row.state] = row.delivery_fee; });
      setDeliveryFees(map);
    }
  };

  const loadRetryOrder = async (orderId: string) => {
    setLoading(true);
    setProcessingMessage('Loading your order...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: order, error } = await supabase
        .from('orders')
        .select('id, user_id, status, total_amount, payment_method, paystack_reference, shipping_state, shipping_city, shipping_lga, shipping_area, shipping_landmark, customer_phone_1, customer_phone_2, delivery_method, pickup_station_id, pickup_station_name, pickup_station_address')
        .eq('id', orderId)
        .single();

      if (error || !order) throw new Error('Order not found');
      if (order.user_id !== user.id) throw new Error('This order does not belong to you');
      if (order.status !== 'pending') throw new Error('This order can no longer be retried');

      setRetryOrder(order);
      setCurrentOrderId(order.id);
      setShippingData({
        state: order.shipping_state || '',
        city: order.shipping_city || '',
        lga: order.shipping_lga || '',
        landmark: order.shipping_landmark || '',
        area: order.shipping_area || '',
        phone1: order.customer_phone_1 || '',
        phone2: order.customer_phone_2 || '',
        deliveryMethod: (order.delivery_method as 'pickup' | 'home') || 'pickup',
        pickupStationId: order.pickup_station_id || null,
        pickupStationName: order.pickup_station_name || null,
        pickupStationAddress: order.pickup_station_address || null,
      });
      setStep(2);
    } catch (err: any) {
      console.error('Retry order load failed:', err);
      setRetryError(err.message || 'We could not load this order.');
    } finally {
      setLoading(false);
      setProcessingMessage('');
    }
  };

  useEffect(() => {
    setShippingError(null);
  }, [shippingData.deliveryMethod, shippingData.pickupStationId]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const calculateShipping = () => {
    if (!shippingData.state) return 0;

    // Pickup uses the existing per-state delivery_settings fee (flat ₦1,000
    // across every state today), falling back to the configured default.
    // Home delivery is a separate, higher flat fee — the per-state table is
    // deliberately NOT used for it.
    if (shippingData.deliveryMethod === 'pickup') {
      return deliveryFees[shippingData.state] ?? shippingConfig.pickup_fee_default;
    }
    return shippingConfig.home_fee;
  };

  const subtotal = items.reduce((sum, item) => {
    const threshold = item.product.wholesale_min_qty || 7;
    const price = (item.quantity >= threshold && item.product.wholesale_price)
      ? item.product.wholesale_price
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const totalOrderAmount = isRetryMode ? retryOrder!.total_amount : subtotal + calculateShipping();
  const payableAmount = totalOrderAmount;

  // Sends only the customer's own order confirmation. Admin new-order
  // alert emails have been intentionally disabled per request — order
  // volume made the admin inbox/Resend usage too noisy. Nothing is sent
  // to the admin address here anymore, and no Resend call fires for it.
  const fireCustomerConfirmation = (order: any, user: any, method: string) => {
    const shippingAddress = `${shippingData.city}, ${shippingData.lga}, ${shippingData.state} · Near ${shippingData.landmark || shippingData.area}`;

    sendEmail({
      type: 'order_confirmation',
      to_email: user.email,
      to_name: user.user_metadata?.full_name || 'Customer',
      data: {
        customer_name: user.user_metadata?.full_name || 'Customer',
        order_id: order.id,
        total_amount: totalOrderAmount,
        payment_method: method,
        shipping_address: shippingAddress,
      },
    });
  };

  const handleShippingNext = () => {
    if (shippingData.deliveryMethod === 'pickup' && !shippingData.pickupStationId) {
      setShippingError('Please choose a pickup station, or switch to Home Delivery.');
      return;
    }
    setShippingError(null);

    if (settings.enable_paystack && !settings.enable_transfer) {
      // Paystack is the only option — no bank-selection gate applies, skip straight in
      setPaymentMethod('paystack');
      createOrder('paystack');
    } else {
      // Either transfer is available (needs the bank-selection step first) or
      // both methods are available (needs the choice step) — either way, land
      // on step 2 and let PaymentMethodStep decide what to render.
      setStep(2);
    }
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleShippingNext();
  };

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(transferDetails.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createOrder = async (method: 'paystack' | 'transfer') => {
    setPaymentMethod(method);
    setLoading(true);
    setProcessingMessage(isRetryMode ? 'Preparing payment...' : 'Creating secure order...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      let orderId = currentOrderId;
      let orderReference = retryOrder?.paystack_reference || null;

      if (isRetryMode && orderId) {
        if (!orderReference) {
          orderReference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_method: method,
            paystack_reference: orderReference,
            ...(method === 'transfer' ? { sender_bank_name: senderBankName || null } : {}),
          })
          .eq('id', orderId);
        if (updateError) throw updateError;

      } else {
        orderReference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        let retailerProfit = 0;
        if (store?.isRetailer && store?.id) {
          for (const item of items) {
            const costPrice = item.product.dropship_price || item.product.wholesale_price || 0;
            const soldPrice = item.product.price;
            if (soldPrice > costPrice) {
              retailerProfit += (soldPrice - costPrice) * item.quantity;
            }
          }
        }

        const contactPhones = [shippingData.phone1, shippingData.phone2]
          .filter(Boolean)
          .join(', ');

        const isPickup = shippingData.deliveryMethod === 'pickup';
        const customerAddress = isPickup
          ? `Pickup: ${shippingData.pickupStationName} — ${shippingData.pickupStationAddress}`
          : `${shippingData.city}, ${shippingData.lga}, ${shippingData.state} (${shippingData.area})`;

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            user_id: user.id,
            customer_name: user.user_metadata.full_name || 'Customer',
            customer_email: user.email,
            customer_phone: contactPhones,
            customer_phone_1: shippingData.phone1,
            customer_phone_2: shippingData.phone2 || null,
            customer_address: customerAddress,
            shipping_state: shippingData.state,
            shipping_city: shippingData.city,
            shipping_area: shippingData.area,
            shipping_lga: shippingData.lga,
            shipping_landmark: shippingData.landmark || null,
            delivery_method: shippingData.deliveryMethod,
            pickup_station_id: isPickup ? shippingData.pickupStationId : null,
            pickup_station_name: isPickup ? shippingData.pickupStationName : null,
            pickup_station_address: isPickup ? shippingData.pickupStationAddress : null,
            total_amount: totalOrderAmount,
            status: 'pending',
            payment_method: method,
            manual_payment_verified: false,
            paystack_reference: orderReference,
            sender_bank_name: method === 'transfer' ? (senderBankName || null) : null,
            retailer_id: store?.id,
            retailer_slug: store?.slug,
            retailer_profit: Math.max(0, retailerProfit),
          }])
          .select()
          .single();

        if (orderError) throw orderError;
        orderId = order.id;

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

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw itemsError;

        // Admin alert removed — see fireCustomerConfirmation note above.
        // Transfer orders no longer trigger any email at creation time;
        // the admin now finds new orders via the admin panel itself.
      }

      setCurrentOrderId(orderId);

      if (method === 'paystack') {
        setPaystackConfig({
          reference: orderReference,
          email: user.email!,
          amount: payableAmount * 100,
          publicKey: PAYSTACK_PUBLIC_KEY,
          metadata: {
            order_id: orderId,
            retailer_id: store?.id
          }
        });
      }

      setStep(3);
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
      await supabase.from('payments').insert({
        order_id: currentOrderId,
        amount: payableAmount,
        paystack_reference: `MANUAL-${Date.now()}`,
        status: 'pending',
        payment_number: 1,
        is_balance_payment: false
      });

      await supabase
        .from('orders')
        .update({ payment_sender_name: senderName.trim() || null })
        .eq('id', currentOrderId);

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
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('payments').insert({
        order_id: currentOrderId,
        amount: payableAmount,
        paystack_reference: reference.reference,
        status: 'pending',
        payment_number: 1,
        is_balance_payment: false
      });

      await supabase.from('orders')
        .update({ payment_verified_via: 'paystack' })
        .eq('id', currentOrderId);

      // Customer still gets their confirmation — admin alert removed.
      if (user) {
        const { data: order } = await supabase
          .from('orders')
          .select('id, customer_name, customer_email')
          .eq('id', currentOrderId)
          .single();
        if (order) {
          fireCustomerConfirmation(order, user, 'paystack');
        }
      }

      setProcessingMessage('Payment successful! 🎉');
      setTimeout(() => {
        onSuccess();
        setLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Payment record error:', error);
      onSuccess();
    }
  };

  const handlePaystackClose = () => {
    setPaystackConfig(null);
    setStep(2);
  };

  return {
    store,
    step,
    loading,
    paymentMethod,
    setPaymentMethod,
    shippingData,
    setShippingData,
    shippingError,
    processingMessage,
    paystackConfig,
    settings,
    copied,
    transferDetails,
    senderName,
    setSenderName,
    senderBankName,
    setSenderBankName,
    totalItems,
    subtotal,
    totalOrderAmount,
    payableAmount,
    isRetryMode,
    retryError,
    calculateShipping,
    shippingConfig,
    pickupFee: shippingData.state
      ? (deliveryFees[shippingData.state] ?? shippingConfig.pickup_fee_default)
      : shippingConfig.pickup_fee_default,
    handleShippingSubmit,
    handleShippingNext,
    handleCopyAccount,
    createOrder,
    handleTransferComplete,
    handlePaystackSuccess,
    handlePaystackClose,
  };
}