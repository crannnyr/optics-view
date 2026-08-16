import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Store {
  id: string | null;
  name: string;
  slug: string | null;
  themeColor: string;
  logoUrl: string | null;
  isRetailer: boolean;
}

interface StoreContextType {
  store: Store;
  loading: boolean;
  storeNotFound: boolean;
  storeError: boolean;
}

const defaultStore: Store = {
  id: null,
  name: 'OpticsView',
  slug: null,
  themeColor: '#0d2818',
  logoUrl: 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/hero-images/IMG-20260516-WA0000.jpg',
  isRetailer: false,
};

const StoreContext = createContext<StoreContextType>({
  store: defaultStore,
  loading: true,
  storeNotFound: false,
  storeError: false,
});

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore]               = useState<Store>(defaultStore);
  const [loading, setLoading]           = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);
  // True when identifyStore() fails due to network or Supabase error.
  // App.tsx reads this to show a recoverable error screen instead of
  // spinning forever.
  const [storeError, setStoreError]     = useState(false);

  useEffect(() => {
    const identifyStore = async () => {
      try {
        const hostname    = window.location.hostname;
        const pathname    = window.location.pathname;
        const pathSegment = pathname.split('/')[1];

        const reservedPaths = [
          'admin', 'retailer', 'login', 'auth',
          // Add top-level app routes here to avoid interpreting them as
          // retailer store slugs. Missing entries (e.g. `checkout`) caused
          // /checkout to be treated as a retailer slug and produced the
          // "store not found" page.
          'checkout', 'orders', 'cart', 'product',
          'legal-privacy', 'legal-terms', 'privacy-policy', 'terms-conditions',
        ];

        const isMainDomain =
          hostname === 'opticsview.store' ||
          hostname === 'localhost' ||
          hostname.includes('vercel.app') ||
          hostname.includes('bolt.host') ||
          hostname.includes('netlify.app') ||
          hostname.includes('lovableproject.com');

        let profile = null;
        let isLookingForStore = false;

        const isReserved = !!pathSegment && reservedPaths.includes(pathSegment);

        // 1. Custom domain: only look up a retailer if the path is NOT a reserved route.
        //    This allows something like https://example.com/checkout to render the app checkout.
        if (!isMainDomain && !isReserved) {
          isLookingForStore = true;
          const { data, error } = await supabase
            .from('profiles')
            .select('id, store_name, store_slug, theme_color, logo_url')
            .eq('custom_domain', hostname)
            .eq('role', 'retailer')
            .maybeSingle();
          if (error) throw error;
          profile = data;
        }

        // 2. Main domain slug path: only lookup retailer if pathSegment exists and is not reserved.
        else if (isMainDomain && pathSegment && !isReserved) {
          isLookingForStore = true;
          const { data, error } = await supabase
            .from('profiles')
            .select('id, store_name, store_slug, theme_color, logo_url')
            .eq('store_slug', pathSegment)
            .eq('role', 'retailer')
            .maybeSingle();
          if (error) throw error;
          profile = data;

          if (profile) {
            const { data: reg, error: regError } = await supabase
              .from('retailer_registrations')
              .select('is_blocked')
              .eq('store_slug', pathSegment)
              .maybeSingle();
            if (regError) throw regError;
            if (reg?.is_blocked) {
              setStoreNotFound(true);
              setLoading(false);
              return;
            }
          }
        }

        if (profile) {
          setStore({
            id: profile.id,
            name: profile.store_name || 'Retailer Store',
            slug: profile.store_slug,
            themeColor: profile.theme_color || '#0d2818',
            logoUrl: profile.logo_url,
            isRetailer: true,
          });
        } else if (isLookingForStore) {
          setStoreNotFound(true);
        }

      } catch (err) {
        // Network failure or Supabase error — surface it so the user
        // sees a clear message with a retry option instead of an
        // infinite spinner.
        console.error('Store identification failed:', err);
        setStoreError(true);
      } finally {
        // Always clears the spinner — no matter what happens above,
        // the user is never left on an infinite loading screen.
        setLoading(false);
      }
    };

    identifyStore();
  }, []);

  return (
    <StoreContext.Provider value={{ store, loading, storeNotFound, storeError }}>
      {children}
    </StoreContext.Provider>
  );
}
