import { ArrowLeft, Loader2 } from 'lucide-react';
import { RetailerFormData } from './useRetailerModal';

interface Props {
  formData: RetailerFormData;
  setFormData: (d: any) => void;
  loading: boolean;
  domainPreview: string;
  totalDue: number;
  generateSlug: (name: string) => string;
  onBack: () => void;
  onSubmit: () => void;
}

const RESERVED = ['admin','api','auth','dashboard','checkout','cart','login','signup','retailer','account','settings'];

export default function DetailsStep({
  formData, setFormData, loading, domainPreview,
  totalDue, generateSlug, onBack, onSubmit
}: Props) {
  const slug = generateSlug(formData.storeName || '');
  const slugInvalid = formData.storeName && (RESERVED.includes(slug) || slug.length < 3);

  return (
    <div className="p-6 md:p-8">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-[#0d2818] text-sm mb-6">
        <ArrowLeft size={16} /> Back
      </button>

      <h2 className="text-2xl font-light text-[#0d2818] mb-6">Registration Details</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Store Name *</label>
          <input
            required
            type="text"
            value={formData.storeName}
            onChange={e => setFormData({ ...formData, storeName: e.target.value })}
            placeholder="e.g. John's Optical Store"
            className="w-full border-2 border-gray-200 p-3 text-sm rounded focus:border-[#0d2818] outline-none"
          />
          {formData.storeName && (
            <p className={`text-xs mt-1 ${slugInvalid ? 'text-red-500' : 'text-gray-400'}`}>
              {slugInvalid ? '⚠ Name reserved or too short' : `Store URL: ${domainPreview}`}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Email *</label>
          <input
            required
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            className="w-full border-2 border-gray-200 p-3 text-sm rounded focus:border-[#0d2818] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Phone *</label>
          <input
            required
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="08012345678"
            className="w-full border-2 border-gray-200 p-3 text-sm rounded focus:border-[#0d2818] outline-none"
          />
        </div>

        {/* Total reminder */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount Due Today</span>
          <span className="font-bold text-[#0d2818]">
            {totalDue === 0 ? 'FREE' : `₦${totalDue.toLocaleString()}`}
          </span>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading || !formData.storeName || !formData.email || !formData.phone || !!slugInvalid}
          className="w-full bg-[#0d2818] text-white py-4 text-sm font-medium tracking-wide hover:opacity-90 rounded disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'PROCEED TO PAYMENT'}
        </button>
      </div>
    </div>
  );
}
