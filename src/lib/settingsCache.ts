import { useState, useEffect } from 'react';
import { supabase } from './supabase';

// Several hooks (currency rates, shipping rates/discounts/caps, timing
// toggle) each independently re-fetched the same rarely-changing
// app_settings rows on every single mount — meaning every product page
// view, every checkout session, fired its own redundant round-trip for
// data that barely ever changes. At any real concurrency this is pure
// waste. This shares one in-memory cache (with a short TTL so admin edits
// still show up reasonably quickly) across every consumer in the session.
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useAppSetting<T>(key: string, fallback: T): T {
  const cached = cache.get(key);
  const [value, setValue] = useState<T>(cached ? cached.value : fallback);

  useEffect(() => {
    const entry = cache.get(key);
    const isFresh = entry && (Date.now() - entry.timestamp < CACHE_TTL_MS);

    if (isFresh) {
      setValue(entry.value);
      return;
    }

    let cancelled = false;
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        if (data?.value) {
          cache.set(key, { value: data.value, timestamp: Date.now() });
          setValue(data.value as T);
        }
      });
    return () => { cancelled = true; };
  }, [key]);

  return value;
}
