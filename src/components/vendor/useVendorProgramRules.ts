import { useState, useEffect } from 'react';
import { vendorSupabase as supabase } from '../../lib/vendorSupabase';

export interface VendorProgramRules {
  min_quantity: number;
  max_quantity: number;
  max_weight_kg: number;
  photos_required: number;
  ship_window_hours: number;
  warehouse_dropoff_enabled: boolean;
  warehouse_address: string;
  logistics_partners: string[];
  commission_rate_percent: number;
  dropoff_contact_phone: string;
  allowed_category_ids: string[];
  promo_intro_price: number;
  promo_list_price: number;
  promo_duration_days: number;
  promo_target_units: number;
  promo_vendor_count: number;
}

const FALLBACK_RULES: VendorProgramRules = {
  min_quantity: 1,
  max_quantity: 1000,
  max_weight_kg: 20,
  photos_required: 2,
  ship_window_hours: 48,
  warehouse_dropoff_enabled: false,
  warehouse_address: 'Ajah, Lagos',
  logistics_partners: ['GUO Transport', 'GIG Logistics'],
  commission_rate_percent: 21,
  dropoff_contact_phone: '09069149803',
  allowed_category_ids: [],
  promo_intro_price: 5000,
  promo_list_price: 30000,
  promo_duration_days: 30,
  promo_target_units: 100,
  promo_vendor_count: 100,
};

// Rules live in app_settings so admins can tune them without a code change —
// this hook keeps the vendor landing page in sync with whatever is actually
// configured, rather than hardcoding numbers that could drift out of date.
export function useVendorProgramRules() {
  const [rules, setRules] = useState<VendorProgramRules>(FALLBACK_RULES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'vendor_program_rules')
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.value) setRules({ ...FALLBACK_RULES, ...data.value });
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return { rules, loading };
}
