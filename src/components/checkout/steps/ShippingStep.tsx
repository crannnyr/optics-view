import { NIGERIAN_STATES } from '../hooks/useCheckout';

interface ShippingStepProps {
  shippingData: { state: string; city: string; area: string; phone1: string; phone2: string };
  setShippingData: (data: { state: string; city: string; area: string; phone1: string; phone2: string }) => void;
  totalItems: number;
  subtotal: number;
  calculateShipping: () => number;
  totalOrderAmount: number;
  handleShippingSubmit: (e: React.FormEvent) => void;
  themeColor?: string;
}

export default function ShippingStep({
  shippingData,
  setShippingData,
  totalItems,
  subtotal,
  calculateShipping,
  totalOrderAmount,
  handleShippingSubmit,
  themeColor = '#0d2818'
}: ShippingStepProps) {
  return (
    <form onSubmit={handleShippingSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-2">State</label>
          <select
            required
            value={shippingData.state}
            onChange={e => setShippingData({ ...shippingData, state: e.target.value })}
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
