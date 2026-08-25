import { useState, useEffect, useCallback } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { PAYSTACK_PUBLIC_KEY } from '../../../lib/supabase';
import { VendorAccount } from './useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';

export interface Sponsorship {
  id: string;
  status: string;
  amount: number;
  ends_at: string | null;
}

export function useVendorSponsorship(vendor: VendorAccount, rules: VendorProgramRules) {
  const [sponsorship, setSponsorship] = useState<Sponsorship | null>(null);
  const [loading, setLoading] = useState(true);
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [preparing, setPreparing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vendor_sponsorships')
      .select('id, status, amount, ends_at')
      .eq('vendor_id', vendor.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();
    setSponsorship((data as Sponsorship) || null);
    setLoading(false);
  }, [vendor.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const preparePayment = useCallback(async (email: string) => {
    setPreparing(true);
    const reference = `SPON-${vendor.id.slice(0, 8)}-${Date.now()}`;

    const { data, error } = await supabase
      .from('vendor_sponsorships')
      .insert({
        vendor_id: vendor.id,
        amount: rules.sponsorship_price,
        status: 'pending',
        paystack_reference: reference,
      })
      .select('id')
      .single();

    setPreparing(false);
    if (error || !data) return null;

    setPaystackConfig({
      reference,
      email,
      amount: rules.sponsorship_price * 100,
      publicKey: PAYSTACK_PUBLIC_KEY,
      metadata: { sponsorship_id: data.id, vendor_id: vendor.id, type: 'vendor_sponsorship' },
    });
    return true;
  }, [vendor.id, rules.sponsorship_price]);

  const confirmPayment = useCallback(async (reference: string) => {
    const { data: spon } = await supabase
      .from('vendor_sponsorships')
      .select('id')
      .eq('paystack_reference', reference)
      .single();

    if (!spon) return false;

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + rules.sponsorship_duration_days * 24 * 60 * 60 * 1000);

    await supabase
      .from('vendor_sponsorships')
      .update({ status: 'active', starts_at: startsAt.toISOString(), ends_at: endsAt.toISOString() })
      .eq('id', spon.id);

    await supabase.rpc('apply_vendor_boost', {
      p_vendor_id: vendor.id,
      p_until: endsAt.toISOString(),
    });

    await refresh();
    return true;
  }, [vendor.id, rules.sponsorship_duration_days, refresh]);

  return { sponsorship, loading, paystackConfig, preparing, preparePayment, confirmPayment };
}
