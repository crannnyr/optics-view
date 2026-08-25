import { useEffect } from 'react';

// The main site's manifest.webmanifest is auto-injected into <head> by
// vite-plugin-pwa. Swapping its href while a vendor page is mounted lets
// "Install App" on these routes install a separately-branded vendor PWA
// (own name/icon/start_url) instead of the main storefront one — restored
// on unmount so leaving the vendor section goes back to the main identity.
export function useVendorManifest() {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) return;

    const originalHref = link.href;
    link.href = '/vendor-manifest.webmanifest';

    return () => { link.href = originalHref; };
  }, []);
}
