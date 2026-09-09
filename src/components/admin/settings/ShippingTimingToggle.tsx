import { useState, useEffect } from 'react';
import { Plane, Ship } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Self-contained: fetches and saves app_settings.show_shipping_timing
// directly rather than threading through useSettings' bigger state — this
// is a single on/off switch, not worth wiring into that shared hook.
export default function ShippingTimingToggle() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'show_shipping_timing')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value?.enabled !== undefined) setEnabled(data.value.enabled);
        setLoading(false);
      });
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setSaving(true);
    await supabase.from('app_settings').upsert({ key: 'show_shipping_timing', value: { enabled: next } });
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="bg-white border rounded-sm p-6 mb-6 flex items-center justify-between">
      <div className="flex items-start gap-3">
        <div className="flex gap-1 text-gray-400 mt-0.5">
          <Plane size={16} />
          <Ship size={16} />
        </div>
        <div>
          <p className="font-medium text-sm text-[#0d2818]">Flight/Sea shipping timing on product pages</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Shows the "Flight 20–30 days · Sea 60–90 days" line on every import product's detail page.
          </p>
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={saving}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${enabled ? 'bg-[#0d2818]' : 'bg-gray-300'}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </div>
  );
}
