import { useState } from 'react';
import { X, MapPin } from 'lucide-react';
import { ProfileData } from './hooks/useCustomerProfile';

interface ShippingAddressModalProps {
  profile: ProfileData;
  themeColor: string;
  onClose: () => void;
  onSave: (fields: Partial<ProfileData>) => Promise<void>;
}

// Manages a single default address stored on the shopper's profile — not a
// multi-address book (OpticsView's checkout only ever collects one shipping
// destination per order today). This gives "Shipping Address" in the quick
// actions grid something real to manage, and is a natural spot to later
// wire in checkout prefill.
export default function ShippingAddressModal({ profile, themeColor, onClose, onSave }: ShippingAddressModalProps) {
  const [form, setForm] = useState({
    default_state: profile.default_state || '',
    default_city: profile.default_city || '',
    default_area: profile.default_area || '',
    default_lga: profile.default_lga || '',
    default_landmark: profile.default_landmark || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <MapPin size={18} style={{ color: themeColor }} /> Shipping Address
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          <p className="text-xs text-gray-500 -mt-1 mb-2">
            Save your usual delivery details so checkout is faster next time.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">State</label>
              <input
                value={form.default_state}
                onChange={e => setForm({ ...form, default_state: e.target.value })}
                className="w-full border border-gray-200 p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">LGA</label>
              <input
                value={form.default_lga}
                onChange={e => setForm({ ...form, default_lga: e.target.value })}
                className="w-full border border-gray-200 p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">City</label>
            <input
              value={form.default_city}
              onChange={e => setForm({ ...form, default_city: e.target.value })}
              className="w-full border border-gray-200 p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Area</label>
            <input
              value={form.default_area}
              onChange={e => setForm({ ...form, default_area: e.target.value })}
              className="w-full border border-gray-200 p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Landmark (optional)</label>
            <input
              value={form.default_landmark}
              onChange={e => setForm({ ...form, default_landmark: e.target.value })}
              className="w-full border border-gray-200 p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-gray-400"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full text-white py-3 text-sm font-medium rounded-full mt-2 hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: themeColor }}
          >
            {saving ? 'Saving…' : 'Save Address'}
          </button>
        </div>
      </div>
    </div>
  );
}
