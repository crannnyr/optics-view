import { useState, useEffect } from 'react';
import { ArrowLeft, Plane, Package, Percent } from 'lucide-react';
import { supabase, ImportFeeTier } from '../lib/supabase';
import { useStore } from '../context/StoreContext';

interface ShippingExplainerProps {
  onBack: () => void;
}

export default function ShippingExplainer({ onBack }: ShippingExplainerProps) {
  const { store } = useStore();
  const [tiers, setTiers] = useState<ImportFeeTier[]>([]);

  useEffect(() => {
    supabase
      .from('import_fee_tiers')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setTiers(data ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-white pb-16">
      <div className="sticky top-0 bg-white/95 backdrop-blur z-20 border-b px-4 md:px-6 py-3 md:py-4">
        <button onClick={onBack} className="flex items-center gap-2 text-xs md:text-sm hover:opacity-70" style={{ color: store.themeColor }}>
          <ArrowLeft size={18} />
          <span className="tracking-widest">BACK</span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-light mb-2" style={{ color: store.themeColor }}>
          How Is Shipping Calculated?
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          For imported items sourced from China, one flat fee covers the whole journey — no
          separate customs surprise at delivery.
        </p>

        <div className="flex items-start gap-3 mb-8 p-4 bg-gray-50 rounded-lg">
          <Plane size={20} className="shrink-0 mt-0.5" style={{ color: store.themeColor }} />
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">One combined fee, paid upfront</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Each import item's shipping and clearance fee is shown at checkout before you pay —
              it covers the full journey from China to your pickup station, with nothing extra to
              pay on arrival.
            </p>
          </div>
        </div>

        {tiers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <Package size={16} style={{ color: store.themeColor }} /> Fee tiers by item size
            </h2>
            <div className="space-y-2">
              {tiers.map(tier => (
                <div key={tier.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3">
                  <span className="text-sm text-gray-700">{tier.name}</span>
                  <span className="text-sm font-medium" style={{ color: store.themeColor }}>
                    ₦{(tier.shipping_fee + tier.clearance_fee).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              A product's size is set by its listing — larger or bulkier items (like small
              appliances) fall into a higher tier automatically.
            </p>
          </div>
        )}

        <div className="flex items-start gap-3 mb-8 p-4 bg-gray-50 rounded-lg">
          <Percent size={20} className="shrink-0 mt-0.5" style={{ color: store.themeColor }} />
          <div>
            <p className="text-sm font-medium text-gray-800 mb-1">Ordering more than one import item?</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Only the single most expensive item in your cart is charged its full fee — every
              other import item gets a discount off its own fee, since batching items together
              barely adds to the handling cost per extra piece.
            </p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-800 mb-1">Delivery method</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Import orders are collected at a pickup station near you rather than delivered to
            your door — this keeps the flat fee accurate and avoids extra last-mile charges that
            vary by address.
          </p>
        </div>
      </div>
    </div>
  );
}
