import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// A second client pointed at the same project but with its own auth storage
// key. Supabase persists the session under this key, so signing in as a
// shopper on the main store does NOT sign you into the vendor area, and
// signing out of one doesn't kill the other. Every vendor-side query must
// go through this client, otherwise RLS would evaluate against the main
// app's session instead of the vendor's.
export const vendorSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'optics-view-vendor-auth',
    persistSession: true,
    autoRefreshToken: true,
  },
});
