import { useState } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';
import { VendorAccount } from './useVendorAccess';
import { VendorProgramRules } from '../useVendorProgramRules';
import { VariantRow } from '../sections/VariantsEditor';

interface UsePostProductFormProps {
  vendor: VendorAccount;
  rules: VendorProgramRules;
  hasActivePromotion: boolean;
  onSuccess: (needsPayment: boolean) => void;
}

const emptyForm = {
  category_id: '', item_type_id: '', name: '', description: '',
  vendor_price: '', total_quantity: '', weight_kg: '',
  photo_url_1: '', photo_url_2: '',
};

export function usePostProductForm({ vendor, rules, hasActivePromotion, onSuccess }: UsePostProductFormProps) {
  const [form, setForm] = useState(emptyForm);
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof emptyForm>(key: K, value: typeof emptyForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.category_id || !form.item_type_id) return 'Please choose a category and item type.';
    if (!form.name.trim()) return 'Please enter a product name.';
    if (!form.photo_url_1 || !form.photo_url_2) return 'Both photos are required.';
    const qty = Number(form.total_quantity);
    if (!qty || qty < 1) return 'Please enter how many you have in stock.';
    if (qty > rules.max_quantity) return `Quantity can't exceed ${rules.max_quantity}.`;
    if (form.weight_kg && Number(form.weight_kg) > rules.max_weight_kg) {
      return `Weight per item should stay under ${rules.max_weight_kg}kg to ship easily by courier.`;
    }
    if (!Number(form.vendor_price) || Number(form.vendor_price) <= 0) {
      return 'Please enter a valid price.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError(null);

    const totalQuantity = Number(form.total_quantity);

    const { data: application, error: insertError } = await supabase
      .from('vendor_product_applications')
      .insert({
        vendor_id: vendor.id,
        category_id: form.category_id,
        item_type_id: form.item_type_id,
        name: form.name.trim(),
        description: form.description.trim() || null,
        photo_url_1: form.photo_url_1,
        photo_url_2: form.photo_url_2,
        vendor_price: Number(form.vendor_price),
        commission_rate: rules.commission_rate_percent,
        total_quantity: totalQuantity,
        weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        status: hasActivePromotion ? 'pending_review' : 'draft',
        submitted_at: hasActivePromotion ? new Date().toISOString() : null,
      })
      .select('id')
      .single();

    if (insertError || !application) {
      setError('Something went wrong submitting your product. Please try again.');
      setSubmitting(false);
      return;
    }

    const validVariants = variants.filter(v => v.quantity && Number(v.quantity) > 0);
    if (validVariants.length > 0) {
      await supabase.from('vendor_product_variants').insert(
        validVariants.map(v => ({
          application_id: application.id,
          color: v.color.trim() || null,
          size: v.size.trim() || null,
          quantity: Number(v.quantity),
        }))
      );
    }

    setForm(emptyForm);
    setVariants([]);
    setSubmitting(false);
    onSuccess(!hasActivePromotion);
  };

  return { form, setField, variants, setVariants, submitting, error, handleSubmit };
}
