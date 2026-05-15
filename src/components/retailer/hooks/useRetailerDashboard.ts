import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export function useRetailerDashboard() {
  const [profile, setProfile]           = useState<any>(null);
  const [registration, setRegistration] = useState<any>(null);
  const [wallet, setWallet]             = useState<any>(null);
  const [loading, setLoading]           = useState(true);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const [{ data: prof }, { data: reg }, { data: wal }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase
        .from('retailer_registrations')
        .select('*')
        .eq('email', user.email)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from('retailer_wallets')
        .select('*')
        .eq('retailer_id', user.id)
        .maybeSingle(),
    ]);

    if (prof) setProfile(prof);
    if (reg)  setRegistration(reg);
    setWallet(wal ?? { balance: 0, total_earned: 0 });
    setLoading(false);
  };

  return { profile, registration, wallet, loading, reload: loadAll };
}