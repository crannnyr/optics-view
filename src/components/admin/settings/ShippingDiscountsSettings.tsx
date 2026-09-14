import { useState, useEffect } from 'react';
import { Percent, Loader2, Save } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Self-contained: fetches and saves app_settings.shipping_discounts
// directly, same pattern as ShippingTimingToggle. A flat % (0-100) per
// method, applied globally to every customer's shipping fee for that
// method. Stacks multiplicatively with the automatic air quantity discount.
interface Discounts {
  air_express: number;
  air_normal: number;
  sea: number;
  heavy: number;
}

const FALLBACK: Discounts = { air_express: 0, air_normal: 0, sea: 0, heavy: 0 };

const METHOD_LABELS: Record<keyof Discounts, string> = {
  air_express: 'Air Express',
  air_normal: 'Air Normal',
  sea: 'Sea',
  heavy: 'Heavy/Bulky items',
};

export default function ShippingDiscountsSettings() {
  const [discounts, setDiscounts] = useState<Discounts>(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'shipping_discounts')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) setDiscounts(data.value as Discounts);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.from('app_settings').upsert({ key: 'shipping_discounts', value: discounts });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (loading) return null;

  return (
    <div className="bg-white border rounded-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-start gap-3">
          <Percent size={16} className="text-gray-400 mt-0.5" />
          <div>
            <p className="font-medium text-sm text-[#0d2818]">Global shipping discounts</p>
            <p className="text-xs text-gray-500 mt-0.5">
              A flat % off every customer's shipping fee for that method. Stacks on top of the
              automatic bulk-quantity discount (air methods only) and shows as a separate line at checkout.
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#0d2818] text-white px-4 py-2 text-xs tracking-widest hover:bg-opacity-90 flex items-center gap-2 rounded disabled:opacity-70 shrink-0"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {saved ? 'SAVED' : 'SAVE'}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(Object.keys(METHOD_LABELS) as (keyof Discounts)[]).map(method => (
          <div key={method}>
            <label className="block text-xs uppercase text-gray-500 mb-2">{METHOD_LABELS[method]}</label>
            <div className="relative">
              <input
                type="number"
                min={0}
                max={100}
                value={discounts[method]}
                onChange={e => setDiscounts({ ...discounts, [method]: Math.max(0, Math.min(100, Number(e.target.value))) })}
                className="w-full border p-2.5 pr-7 text-sm rounded outline-none focus:border-[#0d2818]"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
