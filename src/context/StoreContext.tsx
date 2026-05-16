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
}

const defaultStore: Store = {
  id: null,
  name: 'OpticsView',
  slug: null,
  themeColor: '#0d2818',
  // Main store logo — shown in header for non-retailer stores
  logoUrl: 'https://dpioixansygkjdbphfdj.supabase.co/storage/v1/object/public/hero-images/IMG-20260516-WA0000.jpg',
  isRetailer: false
};

const StoreContext = createContext<StoreContextType>({
  store: defaultStore,
  loading: true,
  storeNotFound: false
});

export function useStore() {
  return useContext(StoreContext);
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(defaultStore);
  const [loading, setLoading] = useState(true);
  const [storeNotFound, setStoreNotFound] = useState(false);

  useEffect(() => {
    const identifyStore = async () => {
      const hostname    = window.location.hostname;
      const pathname    = window.location.pathname;
      const pathSegment = pathname.split('/')[1];

      const reservedPaths = [
        'admin', 'retailer', 'login', 'auth',
        'legal-privacy', 'legal-terms', 'privacy-policy', 'terms-conditions'
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

      // 1. Check Custom Domain
      if (!isMainDomain) {
        isLookingForStore = true;
        const { data } = await supabase
          .from('profiles')
          .select('id, store_name, store_slug, theme_color, logo_url')
          .eq('custom_domain', hostname)
          .eq('role', 'retailer')
          .maybeSingle();
        profile = data;
      }

      // 2. Check Slug path
      else if (pathSegment && !reservedPaths.includes(pathSegment)) {
        isLookingForStore = true;
        const { data } = await supabase
          .from('profiles')
          .select('id, store_name, store_slug, theme_color, logo_url')
          .eq('store_slug', pathSegment)
          .eq('role', 'retailer')
          .maybeSingle();
        profile = data;

        if (profile) {
          const { data: reg } = await supabase
            .from('retailer_registrations')
            .select('is_blocked')
            .eq('store_slug', pathSegment)
            .maybeSingle();
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

      setLoading(false);
    };

    identifyStore();
  }, []);

  return (
    <StoreContext.Provider value={{ store, loading, storeNotFound }}>
      {children}
    </StoreContext.Provider>
  );
}