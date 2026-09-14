import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/email';

export interface VendorFulfillment {
  id: string;
  order_id: string;
  vendor_id: string;
  status: 'pending_approval' | 'approved' | 'ready_to_ship' | 'shipped' | 'failed_delivery' | 'cancelled_no_response';
  approved_at: string | null;
  ship_by: string | null;
  ready_at: string | null;
  shipped_at: string | null;
  created_at: string;
  orders: {
    customer_name: string;
    shipping_state: string;
    shipping_city: string;
    shipping_lga: string | null;
    shipping_area: string | null;
    shipping_landmark: string | null;
    total_amount: number;
    created_at: string;
  } | null;
  vendor_registrations: { business_name: string; phone: string; email: string } | null;
}

const SHIP_WINDOW_HOURS = 48;

const SELECT = `
  id, order_id, vendor_id, status, approved_at, ship_by, ready_at, shipped_at, created_at,
  orders ( customer_name, shipping_state, shipping_city, shipping_lga, shipping_area, shipping_landmark, total_amount, created_at ),
  vendor_registrations ( business_name, phone, email )
`;

export function useVendorOrders() {
  const [fulfillments, setFulfillments] = useState<VendorFulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vendor_order_fulfillments')
      .select(SELECT)
      .in('status', ['pending_approval', 'approved'])
      .order('created_at', { ascending: true });
    setFulfillments((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Approval is still the admin gate that starts the vendor's clock (per
  // decision to keep this step). The vendor is notified right here, the
  // moment they can actually act — not at order time, when there's nothing
  // for them to do yet.
  const approve = async (fulfillment: VendorFulfillment) => {
    setProcessingId(fulfillment.id);
    const now = new Date();
    const shipBy = new Date(now.getTime() + SHIP_WINDOW_HOURS * 60 * 60 * 1000);

    await supabase
      .from('vendor_order_fulfillments')
      .update({ status: 'approved', approved_at: now.toISOString(), ship_by: shipBy.toISOString() })
      .eq('id', fulfillment.id);

    const vendor = fulfillment.vendor_registrations;
    const order = fulfillment.orders;
    if (vendor?.email) {
      const shippingAddress = order
        ? `${order.shipping_city}, ${order.shipping_lga || ''}, ${order.shipping_state} · Near ${order.shipping_landmark || order.shipping_area || ''}`
        : '';
      sendEmail({
        type: 'vendor_order_alert',
        to_email: vendor.email,
        to_name: vendor.business_name,
        data: {
          business_name: vendor.business_name,
          order_id: fulfillment.order_id,
          customer_name: order?.customer_name,
          shipping_address: shippingAddress,
          ship_by_display: shipBy.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
        },
      });
    }

    setFulfillments(prev => prev.map(f => f.id === fulfillment.id
      ? { ...f, status: 'approved', approved_at: now.toISOString(), ship_by: shipBy.toISOString() }
      : f));
    setProcessingId(null);
  };

  const markFailedDelivery = async (fulfillment: VendorFulfillment) => {
    setProcessingId(fulfillment.id);
    await supabase
      .from('vendor_order_fulfillments')
      .update({ status: 'failed_delivery', resolved_at: new Date().toISOString() })
      .eq('id', fulfillment.id);

    setFulfillments(prev => prev.filter(f => f.id !== fulfillment.id));
    setProcessingId(null);
  };

  return { fulfillments, loading, processingId, approve, markFailedDelivery, refresh: fetchAll };
}
