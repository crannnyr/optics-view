import { useState, useEffect, useCallback } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { VendorAccount } from './useVendorAccess';

export interface MyFulfillment {
  id: string;
  order_id: string;
  status: 'pending_approval' | 'approved' | 'ready_to_ship' | 'shipped' | 'failed_delivery' | 'cancelled_no_response';
  ship_by: string | null;
  ready_at: string | null;
  shipped_at: string | null;
  created_at: string;
  orders: {
    customer_name: string;
    customer_phone_1: string | null;
    shipping_state: string;
    shipping_city: string;
    shipping_lga: string;
    shipping_area: string;
    shipping_landmark: string | null;
  } | null;
}

const SELECT = `
  id, order_id, status, ship_by, ready_at, shipped_at, created_at,
  orders ( customer_name, customer_phone_1, shipping_state, shipping_city, shipping_lga, shipping_area, shipping_landmark )
`;

export function useVendorFulfillments(vendor: VendorAccount) {
  const [fulfillments, setFulfillments] = useState<MyFulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vendor_order_fulfillments')
      .select(SELECT)
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false });
    setFulfillments((data as any) || []);
    setLoading(false);
  }, [vendor.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // First step after approval — acknowledges the order without yet
  // confirming physical dispatch. Clears the 48h auto-cancel deadline.
  const markReady = async (fulfillment: MyFulfillment) => {
    setMarkingId(fulfillment.id);
    const now = new Date().toISOString();
    await supabase
      .from('vendor_order_fulfillments')
      .update({ status: 'ready_to_ship', ready_at: now })
      .eq('id', fulfillment.id);
    setFulfillments(prev => prev.map(f => f.id === fulfillment.id ? { ...f, status: 'ready_to_ship', ready_at: now } : f));
    setMarkingId(null);
  };

  const markShipped = async (fulfillment: MyFulfillment) => {
    setMarkingId(fulfillment.id);
    const now = new Date().toISOString();
    await supabase
      .from('vendor_order_fulfillments')
      .update({ status: 'shipped', shipped_at: now })
      .eq('id', fulfillment.id);
    setFulfillments(prev => prev.map(f => f.id === fulfillment.id ? { ...f, status: 'shipped', shipped_at: now } : f));
    setMarkingId(null);
  };

  return { fulfillments, loading, markingId, markReady, markShipped };
}
