import { useState, useEffect, useCallback } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { PAYSTACK_PUBLIC_KEY } from '../../../lib/supabase';
import { VendorAccount } from './useVendorAccess';

export const AD_CLICK_COST = 15;
export const AD_MIN_TOPUP = 1000;

export interface VendorAd {
  id: string;
  product_id: string;
  status: 'active' | 'paused_no_funds' | 'paused_by_vendor';
  impressions: number;
  clicks: number;
  total_spent: number;
  created_at: string;
}

export interface AdEligibleProduct {
  product_id: string;
  name: string;
  photo_url_1: string;
}

export function useVendorAds(vendor: VendorAccount) {
  const [ad, setAd] = useState<VendorAd | null>(null);
  const [balance, setBalance] = useState(0);
  const [eligibleProducts, setEligibleProducts] = useState<AdEligibleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [preparingTopup, setPreparingTopup] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [{ data: adData }, { data: walletData }, { data: productsData }] = await Promise.all([
      supabase.from('vendor_ads').select('id, product_id, status, impressions, clicks, total_spent, created_at').eq('vendor_id', vendor.id).maybeSingle(),
      supabase.from('vendor_ad_wallets').select('balance').eq('vendor_id', vendor.id).maybeSingle(),
      supabase.from('vendor_product_applications').select('product_id, name, photo_url_1').eq('vendor_id', vendor.id).eq('status', 'live').not('product_id', 'is', null),
    ]);
    setAd((adData as VendorAd) || null);
    setBalance(walletData?.balance || 0);
    setEligibleProducts((productsData as AdEligibleProduct[]) || []);
    setLoading(false);
  }, [vendor.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Creates the pending top-up transaction before opening Paystack, same
  // pattern used elsewhere in this app (reference persisted up front).
  const prepareTopup = useCallback(async (email: string, amount: number) => {
    if (amount < AD_MIN_TOPUP) return null;
    setPreparingTopup(true);
    const reference = `ADTOPUP-${vendor.id.slice(0, 8)}-${Date.now()}`;
    const { error } = await supabase.from('vendor_ad_wallet_transactions').insert({
      vendor_id: vendor.id,
      type: 'topup',
      amount,
      status: 'pending',
      paystack_reference: reference,
    });
    setPreparingTopup(false);
    if (error) return null;
    return {
      reference,
      email,
      amount: amount * 100,
      publicKey: PAYSTACK_PUBLIC_KEY,
      metadata: { vendor_id: vendor.id, type: 'vendor_ad_topup' },
    };
  }, [vendor.id]);

  const confirmTopup = useCallback(async (reference: string) => {
    const { data, error } = await supabase.rpc('confirm_vendor_ad_topup', { p_reference: reference });
    if (error || !data?.ok) return false;
    await refresh();
    return true;
  }, [refresh]);

  const selectProduct = useCallback(async (productId: string) => {
    const { data, error } = await supabase.rpc('set_vendor_ad_product', {
      p_vendor_id: vendor.id,
      p_product_id: productId,
    });
    if (error || !data?.ok) return false;
    await refresh();
    return true;
  }, [vendor.id, refresh]);

  const setPaused = useCallback(async (paused: boolean) => {
    const { data, error } = await supabase.rpc('set_vendor_ad_pause', {
      p_vendor_id: vendor.id,
      p_paused: paused,
    });
    if (error || !data?.ok) return false;
    await refresh();
    return true;
  }, [vendor.id, refresh]);

  return {
    ad, balance, eligibleProducts, loading, preparingTopup,
    prepareTopup, confirmTopup, selectProduct, setPaused, refresh,
  };
}
