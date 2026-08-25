import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { VendorAccount } from './useVendorAccess';

export interface VendorAnalytics {
  liveProducts: number;
  totalViews: number;
  unitsSold: number;
  activeResellers: number;
  walletBalance: number;
  totalEarned: number;
  pendingOrders: number;
  topProducts: { id: string; name: string; image_url: string; views_count: number; unitsSold: number }[];
}

const EMPTY: VendorAnalytics = {
  liveProducts: 0, totalViews: 0, unitsSold: 0, activeResellers: 0,
  walletBalance: 0, totalEarned: 0, pendingOrders: 0, topProducts: [],
};

export function useVendorAnalytics(vendor: VendorAccount) {
  const [analytics, setAnalytics] = useState<VendorAnalytics>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);

      const { data: liveApps } = await supabase
        .from('vendor_product_applications')
        .select('product_id')
        .eq('vendor_id', vendor.id)
        .eq('status', 'live');

      const productIds = (liveApps || []).map(a => a.product_id).filter(Boolean) as string[];

      if (productIds.length === 0) {
        const { data: wallet } = await supabase
          .from('vendor_wallets').select('balance, total_earned').eq('vendor_id', vendor.id).maybeSingle();
        if (!cancelled) {
          setAnalytics({ ...EMPTY, walletBalance: wallet?.balance || 0, totalEarned: wallet?.total_earned || 0 });
          setLoading(false);
        }
        return;
      }

      const [productsRes, orderItemsRes, resellersRes, walletRes, pendingRes] = await Promise.all([
        supabase.from('products').select('id, name, image_url, views_count').in('id', productIds),
        supabase.from('order_items').select('product_id, quantity').in('product_id', productIds),
        supabase.from('retailer_products').select('retailer_id').in('product_id', productIds),
        supabase.from('vendor_wallets').select('balance, total_earned').eq('vendor_id', vendor.id).maybeSingle(),
        supabase.from('vendor_order_fulfillments').select('id', { count: 'exact', head: true })
          .eq('vendor_id', vendor.id).in('status', ['pending_approval', 'approved']),
      ]);

      const products = productsRes.data || [];
      const orderItems = orderItemsRes.data || [];
      const resellers = resellersRes.data || [];

      const unitsByProduct: Record<string, number> = {};
      orderItems.forEach(oi => { unitsByProduct[oi.product_id] = (unitsByProduct[oi.product_id] || 0) + oi.quantity; });

      const totalViews = products.reduce((sum, p) => sum + (p.views_count || 0), 0);
      const unitsSold = orderItems.reduce((sum, oi) => sum + oi.quantity, 0);
      const activeResellers = new Set(resellers.map(r => r.retailer_id)).size;

      const topProducts = [...products]
        .map(p => ({ id: p.id, name: p.name, image_url: p.image_url, views_count: p.views_count || 0, unitsSold: unitsByProduct[p.id] || 0 }))
        .sort((a, b) => b.views_count - a.views_count)
        .slice(0, 5);

      if (!cancelled) {
        setAnalytics({
          liveProducts: productIds.length,
          totalViews,
          unitsSold,
          activeResellers,
          walletBalance: walletRes.data?.balance || 0,
          totalEarned: walletRes.data?.total_earned || 0,
          pendingOrders: pendingRes.count || 0,
          topProducts,
        });
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [vendor.id]);

  return { analytics, loading };
}
