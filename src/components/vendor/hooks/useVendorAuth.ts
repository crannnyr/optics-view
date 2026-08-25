import { useState, useEffect } from 'react';
import { vendorSupabase } from '../../../lib/vendorSupabase';

// Session here is entirely independent of the main storefront's — it lives
// under its own storage key, so a shopper signed into the store is NOT
// signed into the vendor area and vice versa.
export function useVendorAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorSupabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = vendorSupabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  return { user, loading };
}
