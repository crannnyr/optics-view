import { useAppSetting } from './settingsCache';

// Global admin toggle (Settings > Delivery) controlling whether the
// "Flight 20–30 days · Sea 60–90 days" line shows on import product pages.
// Defaults to true so the UI doesn't flash empty while loading. Cached
// across the session (see settingsCache.ts) rather than re-fetched on
// every product page mount.
export function useShippingTimingEnabled(): boolean {
  const setting = useAppSetting('show_shipping_timing', { enabled: true });
  return setting.enabled !== undefined ? setting.enabled : true;
}
