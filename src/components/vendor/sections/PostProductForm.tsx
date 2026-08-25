import { Loader2, CheckCircle2, Truck } from 'lucide-react';
import { VendorAccount } from '../hooks/useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';
import { useVendorCategories } from '../hooks/useVendorCategories';
import { usePostProductForm } from '../hooks/usePostProductForm';
import PhotoUploadSlot from './PhotoUploadSlot';
import VariantsEditor from './VariantsEditor';

interface PostProductFormProps {
  vendor: VendorAccount;
  rules: VendorProgramRules;
  themeColor: string;
  hasActivePromotion: boolean;
  onPosted: (needsPayment: boolean) => void;
}

export default function PostProductForm({ vendor, rules, themeColor, hasActivePromotion, onPosted }: PostProductFormProps) {
  const { categories, loading: categoriesLoading } = useVendorCategories(rules.allowed_category_ids);
  const { form, setField, variants, setVariants, submitting, error, handleSubmit } =
    usePostProductForm({ vendor, rules, hasActivePromotion, onSuccess: onPosted });

  const itemTypes = categories.find(c => c.id === form.category_id)?.item_types || [];

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        {hasActivePromotion
          ? "Your product won't go live immediately — our team reviews every submission first. You'll get an email once it's approved."
          : `Next step after this is your Sold Out Campaign — ₦${rules.promo_intro_price.toLocaleString()} for your first month. Your product is saved until then.`}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Category</label>
          <select
            required value={form.category_id} disabled={categoriesLoading}
            onChange={e => { setField('category_id', e.target.value); setField('item_type_id', ''); }}
            className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black"
          >
            <option value="">{categoriesLoading ? 'Loading...' : 'Select...'}</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Item Type</label>
          <select
            required value={form.item_type_id} disabled={!form.category_id}
            onChange={e => setField('item_type_id', e.target.value)}
            className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black disabled:opacity-50"
          >
            <option value="">Select...</option>
            {itemTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-1.5">Product Name</label>
        <input required value={form.name} onChange={e => setField('name', e.target.value)}
          className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="e.g. Men's Cotton Joggers" />
      </div>

      <div>
        <label className="block text-xs uppercase text-gray-500 mb-1.5">Description</label>
        <textarea rows={3} value={form.description} onChange={e => setField('description', e.target.value)}
          className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black resize-none" placeholder="Material, fit, what makes it worth stocking..." />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PhotoUploadSlot
          label="Photo 1 — Required"
          hint="Pure white background, product only, no text or watermark."
          value={form.photo_url_1}
          onChange={url => setField('photo_url_1', url)}
          themeColor={themeColor}
        />
        <PhotoUploadSlot
          label="Photo 2 — Required"
          hint="A second angle or lifestyle shot of the product."
          value={form.photo_url_2}
          onChange={url => setField('photo_url_2', url)}
          themeColor={themeColor}
        />
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">Your Price (₦)</label>
          <input required type="number" min="1" value={form.vendor_price} onChange={e => setField('vendor_price', e.target.value)}
            className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">
            In Stock <span className="text-gray-400 normal-case text-[10px]">(how many you have)</span>
          </label>
          <input required type="number" min={1} max={rules.max_quantity} value={form.total_quantity}
            onChange={e => setField('total_quantity', e.target.value)}
            className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1.5">
            Weight/item <span className="text-gray-400 normal-case text-[10px]">(optional, for shipping)</span>
          </label>
          <input type="number" step="0.1" max={rules.max_weight_kg} value={form.weight_kg}
            onChange={e => setField('weight_kg', e.target.value)}
            className="w-full border p-2.5 text-sm rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="kg" />
        </div>
      </div>

      <VariantsEditor variants={variants} setVariants={setVariants} themeColor={themeColor} />

      <div className="flex items-start gap-2.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <Truck size={15} className="mt-0.5 shrink-0" style={{ color: themeColor }} />
        Once approved, you'll ship any order for this product yourself, within {rules.ship_window_hours} hours of it being approved.
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full text-white py-3.5 text-sm font-semibold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: themeColor }}
      >
        {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
        {submitting ? 'Saving...' : hasActivePromotion ? 'Submit for Review' : 'Save & Continue to Campaign'}
      </button>
    </form>
  );
}
