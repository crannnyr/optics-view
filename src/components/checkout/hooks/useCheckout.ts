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

const ADMIN_EMAIL = 'opticsview1@gmail.com';

interface UseCheckoutProps {
  isOpen: boolean;
  items: CartItem[];
  onSuccess: () => void;
}

export function useCheckout({ isOpen, items, onSuccess }: UseCheckoutProps) {
  const { store } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'transfer'>('paystack');
  const [shippingData, setShippingData] = useState({
    state: '', city: '', area: '', phone1: '', phone2: ''
  });
  const [processingMessage, setProcessingMessage] = useState('');
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [settings, setSettings] = useState({ enable_paystack: true, enable_transfer: true });
  const [copied, setCopied] = useState(false);

  const [transferDetails, setTransferDetails] = useState({
    bank: "OPay",
    number: "9069149803",
    name: "Optics View Store"
  });

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setPaystackConfig(null);
      setCurrentOrderId(null);
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    const { data: methodData } = await supabase.from('app_settings').select('*').eq('key', 'payment_methods').single();
    if (methodData?.value) setSettings(methodData.value);

    const { data: transferData } = await supabase.from('app_settings').select('*').eq('key', 'transfer_details').single();
    if (transferData?.value) setTransferDetails(transferData.value);
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
  const payableAmount = totalOrderAmount;

  // --- Helpers ---
  const fireOrderEmails = (order: any, user: any, method: string) => {
    const shippingAddress = `${shippingData.city}, ${shippingData.state} · ${shippingData.area}`;
    const contactPhones = [shippingData.phone1, shippingData.phone2].filter(Boolean).join(', ');

    // Customer confirmation
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

    // Admin new order alert
    sendEmail({
      type: 'new_order_alert',
      to_email: ADMIN_EMAIL,
      data: {
        order_id: order.id,
        customer_name: user.user_metadata?.full_name || 'Customer',
        customer_email: user.email,
        customer_phone: contactPhones,
        total_amount: totalOrderAmount,
        payment_method: method,
        shipping_address: shippingAddress,
      },
      bypass_limit: true, // Admin alerts always go through
    });
  };

  // --- Handlers ---
  const handleShippingNext = () => {
    if (settings.enable_paystack && !settings.enable_transfer) {
      setPaymentMethod('paystack');
      createOrder('paystack');
    } else if (!settings.enable_paystack && settings.enable_transfer) {
      setPaymentMethod('transfer');
      createOrder('transfer');
    } else {
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
    setLoading(true);
    setProcessingMessage('Creating secure order...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const orderReference = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          user_id: user.id,
          customer_name: user.user_metadata.full_name || 'Customer',
          customer_email: user.email,
          customer_phone: contactPhones,
          customer_phone_1: shippingData.phone1,
          customer_phone_2: shippingData.phone2 || null,
          customer_address: `${shippingData.city}, ${shippingData.state} (${shippingData.area})`,
          shipping_state: shippingData.state,
          shipping_city: shippingData.city,
          shipping_area: shippingData.area,
          total_amount: totalOrderAmount,
          status: 'pending',
          payment_method: method,
          manual_payment_verified: false,
          paystack_reference: orderReference,
          retailer_id: store?.id,
          retailer_slug: store?.slug,
          retailer_profit: Math.max(0, retailerProfit),
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      setCurrentOrderId(order.id);

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

      // Fire order emails immediately after order is created
      fireOrderEmails(order, user, method);

      if (method === 'paystack') {
        setPaystackConfig({
          reference: orderReference,
          email: user.email!,
          amount: payableAmount * 100,
          publicKey: PAYSTACK_PUBLIC_KEY,
          metadata: {
            order_id: order.id,
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

      await supabase.from('orders').update({ payment_verified_via: 'paystack' }).eq('id', currentOrderId);

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

  return {
    store,
    step,
    loading,
    paymentMethod,
    setPaymentMethod,
    shippingData,
    setShippingData,
    processingMessage,
    paystackConfig,
    settings,
    copied,
    transferDetails,
    totalItems,
    subtotal,
    totalOrderAmount,
    payableAmount,
    calculateShipping,
    handleShippingSubmit,
    handleShippingNext,
    handleCopyAccount,
    createOrder,
    handleTransferComplete,
    handlePaystackSuccess
  };
}
