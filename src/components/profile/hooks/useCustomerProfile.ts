import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface ProfileData {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  default_state: string | null;
  default_city: string | null;
  default_area: string | null;
  default_lga: string | null;
  default_landmark: string | null;
}

// An order_item counts as "import" purely by its product having a fee tier
// attached — same rule as isImportProduct() in lib/importFees.ts, just
// against the joined order_items shape instead of a live cart.
export function isImportItem(item: any): boolean {
  return !!item.products?.import_fee_tier_id;
}

export function useCustomerProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { setLoading(false); return; }

      setUserId(user.id);

      const [{ data: profileRow, error: profileError }, { data: orderRows, error: ordersError }] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('full_name, email, avatar_url, default_state, default_city, default_area, default_lga, default_landmark')
            .eq('id', user.id)
            .maybeSingle(),
          supabase
            .from('orders')
            .select('*, items:order_items(*, products(name, images, image_url, import_fee_tier_id))')
            .eq('customer_email', user.email)
            .order('created_at', { ascending: false }),
        ]);

      if (profileError) throw profileError;
      if (ordersError) throw ordersError;

      setProfile(profileRow ?? { full_name: user.user_metadata?.full_name ?? null, email: user.email ?? null, avatar_url: null, default_state: null, default_city: null, default_area: null, default_lga: null, default_landmark: null });
      setOrders(orderRows ?? []);
    } catch (err) {
      console.error('Profile fetch failed:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const updateProfile = async (fields: Partial<ProfileData>) => {
    if (!userId) return;
    await supabase.from('profiles').update(fields).eq('id', userId);
    setProfile(prev => prev ? { ...prev, ...fields } : prev);
  };

  return { profile, orders, loading, error, userId, refetch: fetchAll, updateProfile };
}
