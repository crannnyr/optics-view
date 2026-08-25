import { useState } from 'react';
import { MapPin, Truck, Navigation, Search, CheckCircle2, Loader2 } from 'lucide-react';
import { PickupStation } from '../../../lib/supabase';
import { usePickupStations, NearbyStation } from '../hooks/usePickupStations';

export interface SelectedStation {
  id: string;
  name: string;
  address: string;
  landmark?: string;
}

interface PickupLocationPickerProps {
  state: string;
  deliveryMethod: 'pickup' | 'home';
  setDeliveryMethod: (method: 'pickup' | 'home') => void;
  selectedStation: SelectedStation | null;
  onSelectStation: (station: SelectedStation) => void;
  homeDeliveryFee: number;
  pickupFee: number;
  pickupEta: string;
  homeEta: string;
  themeColor?: string;
}

function StationRow({
  station, distanceKm, onSelect, themeColor,
}: { station: PickupStation; distanceKm?: number; onSelect: () => void; themeColor: string }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors bg-white"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-800">{station.name.replace(/^Jumia\s*Pick[\s-]?[Uu]p\s*[Ss]tation[s]?\s*/i, '')}</p>
        {distanceKm !== undefined && (
          <span className="text-[10px] shrink-0 px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${themeColor}1a`, color: themeColor }}>
            {distanceKm < 1 ? `${Math.round(distanceKm * 1000)}m` : `${distanceKm.toFixed(1)}km`} away
          </span>
        )}
      </div>
      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{station.address}</p>
      {station.landmark && <p className="text-[11px] text-gray-400 mt-0.5">Near {station.landmark}</p>}
    </button>
  );
}

export default function PickupLocationPicker({
  state, deliveryMethod, setDeliveryMethod, selectedStation, onSelectStation,
  homeDeliveryFee, pickupFee, pickupEta, homeEta, themeColor = '#0d2818',
}: PickupLocationPickerProps) {
  const [query, setQuery] = useState('');
  const {
    loadingStations, searchStations, requestLocation, locating, locationError, nearestByLocation,
  } = usePickupStations(state);

  const { results, isFallback } = searchStations(query);
  const pick = (s: PickupStation) => onSelectStation({ id: s.id, name: s.name, address: s.address, landmark: s.landmark });

  return (
    <div className="space-y-4">
      <label className="block text-xs uppercase text-gray-500">Delivery Method</label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setDeliveryMethod('pickup')}
          className="p-4 rounded-lg border-2 text-left transition-colors"
          style={deliveryMethod === 'pickup' ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : { borderColor: '#e5e7eb' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <MapPin size={16} style={{ color: deliveryMethod === 'pickup' ? themeColor : '#9ca3af' }} />
            <span className="text-sm font-bold">Pickup Station</span>
          </div>
          <p className="text-xs text-gray-500">₦{pickupFee.toLocaleString()} · via Jumia Express</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{pickupEta}</p>
        </button>

        <button
          type="button"
          onClick={() => setDeliveryMethod('home')}
          className="p-4 rounded-lg border-2 text-left transition-colors"
          style={deliveryMethod === 'home' ? { borderColor: themeColor, backgroundColor: `${themeColor}0d` } : { borderColor: '#e5e7eb' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Truck size={16} style={{ color: deliveryMethod === 'home' ? themeColor : '#9ca3af' }} />
            <span className="text-sm font-bold">Home Delivery</span>
          </div>
          <p className="text-xs text-gray-500">₦{homeDeliveryFee.toLocaleString()}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{homeEta}</p>
        </button>
      </div>

      {deliveryMethod === 'home' && (
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-3">
          Your order will be delivered to the address you enter below, typically within {homeEta.toLowerCase()}.
          Home delivery costs more than pickup because it needs a dedicated rider, and takes longer.
        </p>
      )}

      {deliveryMethod === 'pickup' && (
        <div className="space-y-3">
          {!state ? (
            <p className="text-xs text-gray-400 italic">Select your state above to see nearby pickup points.</p>
          ) : (
            <>
              {selectedStation ? (
                <div className="p-3 rounded-lg border-2 flex items-start justify-between gap-2" style={{ borderColor: themeColor, backgroundColor: `${themeColor}0d` }}>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" style={{ color: themeColor }} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {selectedStation.name.replace(/^Jumia\s*Pick[\s-]?[Uu]p\s*[Ss]tation[s]?\s*/i, '')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{selectedStation.address}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => onSelectStation({ id: '', name: '', address: '' })} className="text-xs underline shrink-0" style={{ color: themeColor }}>
                    Change
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={requestLocation}
                    disabled={locating}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-2.5 text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                    {locating ? 'Finding stations near you...' : 'Use my current location'}
                  </button>

                  {locationError && <p className="text-xs text-red-500">{locationError}</p>}

                  {nearestByLocation && nearestByLocation.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">Closest to you</p>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {nearestByLocation.map((s: NearbyStation) => (
                          <StationRow key={s.id} station={s} distanceKm={s.distanceKm} onSelect={() => pick(s)} themeColor={themeColor} />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Or search by area, city, or landmark"
                      className="w-full border p-2.5 pl-9 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
                    />
                  </div>

                  {loadingStations ? (
                    <p className="text-xs text-gray-400 flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> Loading pickup points...</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto pr-1">
                      {isFallback && (
                        <p className="text-[11px] text-gray-400 italic mb-2">No exact match — here are pickup points in {state}:</p>
                      )}
                      {results.length === 0 ? (
                        <p className="text-xs text-gray-400">No pickup stations found for {state} yet. Try Home Delivery instead.</p>
                      ) : (
                        <div className="grid sm:grid-cols-2 gap-2">
                          {results.slice(0, 20).map(s => (
                            <StationRow key={s.id} station={s} onSelect={() => pick(s)} themeColor={themeColor} />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
