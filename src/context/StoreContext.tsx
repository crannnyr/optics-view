import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Store {
  id: string | null; // null for main store
  name: string;
  slug: string | null;
  themeColor: string;
  logoUrl: string | null;
  isRetailer: boolean;
}

interface StoreContextType {
  store: Store;
  loading: boolean;
  storeNotFound: boolean; // <--- New Flag for Error Handling
}

const defaultStore: Store = {
  id: null,
  name: 'OpticsView',
  slug: null,
  themeColor: '#0d2818',
  logoUrl: null,
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
      const hostname = window.location.hostname;
      const pathname = window.location.pathname;
      const pathSegment = pathname.split('/')[1]; // Gets the first part (e.g., "joshua-store")
      
      const reservedPaths = ['admin', 'retailer', 'login', 'auth', 'legal-privacy', 'legal-terms', 'privacy-policy', 'terms-conditions'];
      
      // EXCLUSION LIST: Treat these domains as "Main App" (check slug instead of domain)
      const isMainDomain = 
        hostname === 'opticsview.store' || 
        hostname === 'localhost' || 
        hostname.includes('vercel.app') || 
        hostname.includes('bolt.host') ||
        hostname.includes('netlify.app') ||
        hostname.includes('lovableproject.com');

      let profile = null;
      let isLookingForStore = false;

      // 1. Check Custom Domain (Only if NOT a main/dev domain)
      if (!isMainDomain) { 
         isLookingForStore = true;
         // Use maybeSingle() to prevent 406 errors if not found
         const { data } = await supabase
          .from('profiles')
          .select('id, store_name, store_slug, theme_color, logo_url')
          .eq('custom_domain', hostname)
          .eq('role', 'retailer')
          .maybeSingle(); // <--- Critical Fix
         profile = data;
      }
      
      // 2. Check Slug path (if no profile found yet and not a system route)
      else if (pathSegment && !reservedPaths.includes(pathSegment)) {
         isLookingForStore = true;
         const { data } = await supabase
          .from('profiles')
          .select('id, store_name, store_slug, theme_color, logo_url')
          .eq('store_slug', pathSegment)
          .eq('role', 'retailer')
          .maybeSingle(); // <--- Critical Fix
         profile = data;
      }

      if (profile) {
        setStore({
          id: profile.id,
          name: profile.store_name || 'Retailer Store',
          slug: profile.store_slug,
          themeColor: profile.theme_color || '#0d2818',
          logoUrl: profile.logo_url,
          isRetailer: true
        });
      } else if (isLookingForStore) {
        // If we were looking for a specific store (domain or slug) but didn't find one
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