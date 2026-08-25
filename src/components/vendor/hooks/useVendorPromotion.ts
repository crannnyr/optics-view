import { useState, useEffect, useCallback } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { PAYSTACK_PUBLIC_KEY } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/email';
import { VendorAccount } from './useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';

export interface Promotion {
  id: string;
  status: 'pending' | 'active' | 'expired' | 'failed';
  amount: number;
  starts_at: string | null;
  ends_at: string | null;
}

export function useVendorPromotion(vendor: VendorAccount, rules: VendorProgramRules) {
  const [promotion, setPromotion] = useState<Promotion | null>(null);
  const [loading, setLoading] = useState(true);
  const [paystackConfig, setPaystackConfig] = useState<any>(null);
  const [preparing, setPreparing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vendor_promotions')
      .select('id, status, amount, starts_at, ends_at')
      .eq('vendor_id', vendor.id)
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString())
      .maybeSingle();
    setPromotion((data as Promotion) || null);
    setLoading(false);
  }, [vendor.id]);

  useEffect(() => { refresh(); }, [refresh]);

  // Creates the pending promotion row up front so the Paystack reference is
  // already persisted before the popup opens — if the vendor abandons or the
  // payment fails, the row simply stays 'pending' and nothing is unlocked.
  const preparePayment = useCallback(async (email: string) => {
    setPreparing(true);
    const reference = `PROMO-${vendor.id.slice(0, 8)}-${Date.now()}`;

    const { data, error } = await supabase
      .from('vendor_promotions')
      .insert({
        vendor_id: vendor.id,
        amount: rules.promo_intro_price,
        list_price: rules.promo_list_price,
        is_intro_offer: true,
        status: 'pending',
        paystack_reference: reference,
      })
      .select('id')
      .single();

    setPreparing(false);
    if (error || !data) return null;

    const config = {
      reference,
      email,
      amount: rules.promo_intro_price * 100,
      publicKey: PAYSTACK_PUBLIC_KEY,
      metadata: { promotion_id: data.id, vendor_id: vendor.id, type: 'vendor_promotion' },
    };
    setPaystackConfig(config);
    return { config, promotionId: data.id };
  }, [vendor.id, rules.promo_intro_price, rules.promo_list_price]);

  // Called only by Paystack's success callback. Activates the promotion and
  // releases any draft product applications into the admin review queue —
  // this is the single point where a submission becomes visible to admin.
  const confirmPayment = useCallback(async (reference: string) => {
    const { data: promo } = await supabase
      .from('vendor_promotions')
      .select('id')
      .eq('paystack_reference', reference)
      .single();

    if (!promo) return false;

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + rules.promo_duration_days * 24 * 60 * 60 * 1000);

    await supabase
      .from('vendor_promotions')
      .update({
        status: 'active',
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
      })
      .eq('id', promo.id);

    // Campaign includes top placement, so boost anything already live.
    await supabase.rpc('apply_vendor_boost', {
      p_vendor_id: vendor.id,
      p_until: endsAt.toISOString(),
    });

    const { data: released } = await supabase
      .from('vendor_product_applications')
      .update({
        status: 'pending_review',
        promotion_id: promo.id,
        submitted_at: new Date().toISOString(),
      })
      .eq('vendor_id', vendor.id)
      .eq('status', 'draft')
      .select('id, name');

    // Admin is notified only here — never on an unpaid or failed attempt.
    if (released && released.length > 0) {
      sendEmail({
        type: 'notification',
        to_email: 'admin',
        to_name: 'Admin',
        data: {
          subject: `New vendor submission from ${vendor.business_name}`,
          title: 'New vendor product awaiting review',
          message: `${vendor.business_name} completed their Sold Out Campaign payment and submitted ${released.length} product(s) for review: ${released.map(r => r.name).join(', ')}.`,
        },
      }).catch(() => {});
    }

    await refresh();
    return true;
  }, [vendor.id, vendor.business_name, rules.promo_duration_days, refresh]);

  return { promotion, loading, paystackConfig, preparing, preparePayment, confirmPayment, refresh };
}
