import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export interface VendorProgramRules {
  min_quantity: number;
  max_quantity: number;
  max_weight_kg: number;
  size_reference: string;
  photos_required: number;
  warehouse_address: string;
  logistics_partners: string[];
  packaging_fee_per_item: number;
  commission_rate_percent: number;
  dropoff_contact_phone: string;
}

const FALLBACK_RULES: VendorProgramRules = {
  min_quantity: 50,
  max_quantity: 350,
  max_weight_kg: 20,
  size_reference: 'Must not exceed the size of a carton of Indomie noodles',
  photos_required: 2,
  warehouse_address: 'Ajah, Lagos',
  logistics_partners: ['GUO Transport', 'GIG Logistics'],
  packaging_fee_per_item: 450,
  commission_rate_percent: 21,
  dropoff_contact_phone: '09069149803',
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
