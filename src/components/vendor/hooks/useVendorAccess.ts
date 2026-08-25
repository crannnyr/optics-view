import { useState, useEffect, useCallback } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';

export interface VendorAccount {
  id: string;
  business_name: string;
  status: 'active' | 'suspended' | 'blocked';
}

export function useVendorAccess(user: any) {
  const [vendor, setVendor] = useState<VendorAccount | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!user) { setVendor(null); setLoading(false); return; }
    setLoading(true);
    supabase
      .from('vendor_registrations')
      .select('id, business_name, status')
      .eq('profile_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setVendor(data as VendorAccount | null);
        setLoading(false);
      });
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { vendor, loading, refresh };
}
