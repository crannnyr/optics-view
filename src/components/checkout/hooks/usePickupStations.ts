import { useState, useEffect, useCallback } from 'react';
import { supabase, PickupStation } from '../../../lib/supabase';

// The state picker (NIGERIAN_STATES) uses "FCT - Abuja" while the pickup
// stations table (sourced from Jumia's own location data) uses
// "Federal Capital Territory". Everything else lines up by name already.
export function normalizeStateForPickup(state: string): string {
  return state === 'FCT - Abuja' ? 'Federal Capital Territory' : state;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface NearbyStation extends PickupStation {
  distanceKm: number;
}

export function usePickupStations(state: string) {
  const [stateStations, setStateStations] = useState<PickupStation[]>([]);
  const [loadingStations, setLoadingStations] = useState(false);

  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [nearestByLocation, setNearestByLocation] = useState<NearbyStation[] | null>(null);

  // Load every pickup station for the currently selected state. The full
  // table is only ~450 rows, so per-state fetch + client-side text search
  // is simpler and fast enough than building server-side full-text search.
  useEffect(() => {
    if (!state) {
      setStateStations([]);
      return;
    }

    let cancelled = false;
    setLoadingStations(true);

    supabase
      .from('pickup_stations')
      .select('id, name, state, address, landmark, latitude, longitude')
      .eq('state', normalizeStateForPickup(state))
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (!error && data) setStateStations(data as PickupStation[]);
        setLoadingStations(false);
      });

    return () => { cancelled = true; };
  }, [state]);

  // Filters the already-loaded state list by name/address/landmark. Falls
  // back to the full state list (rather than an empty result) when nothing
  // matches, so the person always has something to pick from.
  const searchStations = useCallback((query: string): { results: PickupStation[]; isFallback: boolean } => {
    const q = query.trim().toLowerCase();
    if (!q) return { results: stateStations, isFallback: false };

    const matches = stateStations.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q) ||
      (s.landmark ?? '').toLowerCase().includes(q)
    );

    return matches.length > 0
      ? { results: matches, isFallback: false }
      : { results: stateStations, isFallback: true };
  }, [stateStations]);

  // Uses the browser's geolocation to find the 3 closest pickup stations
  // nationally (not limited to the selected state — someone near a state
  // border may be closer to a station just across it).
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support location access.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const { data, error } = await supabase
          .from('pickup_stations')
          .select('id, name, state, address, landmark, latitude, longitude')
          .eq('is_active', true);

        if (error || !data) {
          setLocationError("Couldn't load pickup stations. Please try searching manually.");
          setLocating(false);
          return;
        }

        const withDistance: NearbyStation[] = (data as PickupStation[])
          .map(s => ({ ...s, distanceKm: haversineKm(latitude, longitude, s.latitude, s.longitude) }))
          .sort((a, b) => a.distanceKm - b.distanceKm)
          .slice(0, 3);

        setNearestByLocation(withDistance);
        setLocating(false);
      },
      (err) => {
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? 'Location access was denied. Turn it on in your browser settings, or search manually below.'
            : "Couldn't get your location. Please search manually below."
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return {
    stateStations,
    loadingStations,
    searchStations,
    requestLocation,
    locating,
    locationError,
    nearestByLocation,
  };
}
