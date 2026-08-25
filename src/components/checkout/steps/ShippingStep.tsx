import { NIGERIAN_STATES } from '../hooks/useCheckout';
import PickupLocationPicker from './PickupLocationPicker';

interface ShippingData {
  state: string; city: string; lga: string; landmark: string; area: string; phone1: string; phone2: string;
  deliveryMethod: 'pickup' | 'home';
  pickupStationId: string | null;
  pickupStationName: string | null;
  pickupStationAddress: string | null;
}

interface ShippingStepProps {
  shippingData: ShippingData;
  setShippingData: (data: ShippingData) => void;
  totalItems: number;
  subtotal: number;
  calculateShipping: () => number;
  totalOrderAmount: number;
  handleShippingSubmit: (e: React.FormEvent) => void;
  themeColor?: string;
  shippingError?: string | null;
  homeDeliveryFee: number;
  pickupFee: number;
  pickupEta: string;
  homeEta: string;
}

export default function ShippingStep({
  shippingData,
  setShippingData,
  totalItems,
  subtotal,
  calculateShipping,
  totalOrderAmount,
  handleShippingSubmit,
  themeColor = '#0d2818',
  shippingError,
  homeDeliveryFee,
  pickupFee,
  pickupEta,
  homeEta,
}: ShippingStepProps) {
  return (
    <form onSubmit={handleShippingSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">State</label>
          <select
            required
            value={shippingData.state}
            onChange={e => setShippingData({ ...shippingData, state: e.target.value, pickupStationId: null, pickupStationName: null, pickupStationAddress: null })}
            className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white transition-colors outline-none focus:border-black"
          >
            <option value="">Select...</option>
            {NIGERIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">City</label>
          <input
            required
            type="text"
            value={shippingData.city}
            onChange={e => setShippingData({ ...shippingData, city: e.target.value })}
            className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
            placeholder="e.g. Lekki"
          />
        </div>
      </div>

      <PickupLocationPicker
        state={shippingData.state}
        deliveryMethod={shippingData.deliveryMethod}
        setDeliveryMethod={method => setShippingData({ ...shippingData, deliveryMethod: method, pickupStationId: null, pickupStationName: null, pickupStationAddress: null })}
        selectedStation={shippingData.pickupStationId ? {
          id: shippingData.pickupStationId,
          name: shippingData.pickupStationName || '',
          address: shippingData.pickupStationAddress || '',
        } : null}
        onSelectStation={station => setShippingData({
          ...shippingData,
          pickupStationId: station.id || null,
          pickupStationName: station.id ? station.name : null,
          pickupStationAddress: station.id ? station.address : null,
        })}
        homeDeliveryFee={homeDeliveryFee}
        pickupFee={pickupFee}
        pickupEta={pickupEta}
        homeEta={homeEta}
        themeColor={themeColor}
      />

      {shippingData.state && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-1.5">
          <p className="text-xs font-medium text-gray-700">What happens next</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Your order arrives in{' '}
            <strong className="text-gray-700">
              {shippingData.deliveryMethod === 'pickup' ? pickupEta.toLowerCase() : homeEta.toLowerCase()}
            </strong>
            {shippingData.deliveryMethod === 'pickup'
              ? ', and you\'ll pick it up from the station you chose above.'
              : ', delivered to the address you entered.'}
          </p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Our team will reach out on WhatsApp using the number you provide below to confirm your
            order before it ships — please keep an eye out for that call or message.
          </p>
        </div>
      )}

      {shippingError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{shippingError}</p>
      )}

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-2">
          LGA <span className="text-gray-400 normal-case text-[10px]">(Local Government Area)</span>
        </label>
        <input
          required
          type="text"
          value={shippingData.lga}
          onChange={e => setShippingData({ ...shippingData, lga: e.target.value })}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. Eti-Osa"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-2">Closest Bus Stop / Area</label>
        <input
          required
          type="text"
          value={shippingData.area}
          onChange={e => setShippingData({ ...shippingData, area: e.target.value })}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. Chevron Drive, Lekki Phase 1"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-2">
          Popular Place Close to You <span className="text-gray-400 normal-case text-[10px]">(optional, helps the rider find you)</span>
        </label>
        <input
          type="text"
          value={shippingData.landmark}
          onChange={e => setShippingData({ ...shippingData, landmark: e.target.value })}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. Opposite Shoprite, near Total filling station"
        />
      </div>

      {/* Phone Numbers */}
      <div>
        <label className="block text-xs uppercase text-gray-500 mb-2">
          Phone Number <span className="text-red-400">*</span>
        </label>
        <input
          required
          type="tel"
          value={shippingData.phone1}
          onChange={e => setShippingData({ ...shippingData, phone1: e.target.value })}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. 08012345678"
          pattern="[0-9]{10,11}"
          title="Enter a valid Nigerian phone number"
        />
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-2">
          Alternate Phone <span className="text-gray-400 normal-case text-[10px]">(optional)</span>
        </label>
        <input
          type="tel"
          value={shippingData.phone2}
          onChange={e => setShippingData({ ...shippingData, phone2: e.target.value })}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. 08087654321"
          pattern="[0-9]{10,11}"
          title="Enter a valid Nigerian phone number"
        />
      </div>

      <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-2 mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items ({totalItems})</span>
          <span>₦{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span>₦{calculateShipping().toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
          <span>Total</span>
          <span>₦{totalOrderAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Jumia Express trust badge */}
      <div className="flex items-center gap-4 py-2">
        <div className="h-7 w-px bg-gray-200 flex-shrink-0" />
        <div className="flex flex-col leading-none flex-shrink-0">
          <p className="text-[11px] font-black tracking-[0.08em] text-black italic whitespace-nowrap">
            JUMIA<span className="text-[#f68b1e] not-italic ml-0.5">★</span>
          </p>
          <p className="text-[8.5px] tracking-[0.16em] text-gray-400 uppercase mt-0.5 font-medium whitespace-nowrap">
            Express Delivery
          </p>
        </div>
      </div>

      <button
        className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 transition-opacity rounded mt-2"
        style={{ backgroundColor: themeColor }}
      >
        CONTINUE
      </button>
    </form>
  );
}
