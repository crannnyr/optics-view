import { NIGERIAN_STATES } from '../hooks/useCheckout';

interface ShippingStepProps {
  shippingData: { state: string; city: string; area: string };
  setShippingData: (data: { state: string; city: string; area: string }) => void;
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
              onChange={e => setShippingData({...shippingData, state: e.target.value})}
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
              onChange={e => setShippingData({...shippingData, city: e.target.value})}
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
          onChange={e => setShippingData({...shippingData, area: e.target.value})}
          className="w-full border p-3 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black"
          placeholder="e.g. Chevron Drive, Lekki Phase 1"
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

      <button 
        className="w-full text-white py-4 text-xs tracking-widest font-bold hover:opacity-90 transition-opacity rounded mt-2"
        style={{ backgroundColor: themeColor }}
      >
        CONTINUE
      </button>
    </form>
  );
}
