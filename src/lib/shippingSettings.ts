import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Global admin toggle (Settings > Delivery) controlling whether the
// "Flight 20–30 days · Sea 60–90 days" line shows on import product pages.
// Defaults to true so the UI doesn't flash empty while loading.
export function useShippingTimingEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'show_shipping_timing')
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value?.enabled !== undefined) setEnabled(data.value.enabled);
      });
    return () => { cancelled = true; };
  }, []);

  return enabled;
}
