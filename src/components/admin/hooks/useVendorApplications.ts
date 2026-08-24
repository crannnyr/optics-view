import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { sendEmail } from '../../../lib/email';

export interface VendorApplication {
  id: string;
  application_reference: string;
  name: string;
  description: string | null;
  photo_url_1: string;
  photo_url_2: string;
  vendor_price: number;
  retail_price: number | null;
  commission_rate: number;
  total_quantity: number;
  weight_kg: number | null;
  status: string;
  rejection_reason: string | null;
  submitted_at: string | null;
  category_id: string;
  item_type_id: string;
  vendor_id: string;
  vendor_registrations: { business_name: string; email: string; phone: string } | null;
  categories: { name: string; slug: string } | null;
  category_item_types: { name: string; slug: string } | null;
}

interface VendorVariant { color: string | null; size: string | null; quantity: number }

const SELECT = `
  id, application_reference, name, description, photo_url_1, photo_url_2,
  vendor_price, retail_price, commission_rate, total_quantity, weight_kg,
  status, rejection_reason, submitted_at, category_id, item_type_id, vendor_id,
  vendor_registrations ( business_name, email, phone ),
  categories ( name, slug ),
  category_item_types ( name, slug )
`;

export function useVendorApplications() {
  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('vendor_product_applications')
      .select(SELECT)
      .eq('status', 'pending_review')
      .order('submitted_at', { ascending: true });
    setApplications((data as any) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const approve = async (app: VendorApplication, retailPrice: number) => {
    setProcessingId(app.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: variants } = await supabase
        .from('vendor_product_variants')
        .select('color, size, quantity')
        .eq('application_id', app.id);

      const colorOptions = [...new Set((variants as VendorVariant[] | null || [])
        .map(v => v.color).filter((c): c is string => !!c))];
      const sizeOptions = [...new Set((variants as VendorVariant[] | null || [])
        .map(v => v.size).filter((s): s is string => !!s))];

      // units_sold explicitly 0 — the default of 11 is reserved for
      // admin-posted products; vendor products must not get that boost.
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: app.name,
          description: app.description || '',
          price: retailPrice,
          image_url: app.photo_url_1,
          images: [app.photo_url_1, app.photo_url_2],
          stock: app.total_quantity,
          category: app.categories?.slug || '',
          product_type: app.category_item_types?.slug || '',
          supplier: 'vendor',
          vendor_application_id: app.id,
          units_sold: 0,
          color_options: colorOptions,
          size_options: sizeOptions,
          is_active: true,
        })
        .select('id')
        .single();

      if (productError || !product) throw productError;

      await supabase
        .from('vendor_product_applications')
        .update({
          status: 'live',
          retail_price: retailPrice,
          product_id: product.id,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
        })
        .eq('id', app.id);

      if (app.vendor_registrations?.email) {
        // Fire-and-forget: sendEmail() already swallows its own errors, but
        // wrapped again here so an email hiccup never blocks the approval
        // itself — the product going live is the part that must succeed.
        sendEmail({
          type: 'notification',
          to_email: app.vendor_registrations.email,
          to_name: app.vendor_registrations.business_name,
          data: {
            subject: `Your product is now live: ${app.name}`,
            title: 'Your product is live!',
            message: `${app.name} has been approved and is now live at ₦${retailPrice.toLocaleString()}. Retailers on the platform can now import it into their own stores — track sales from your vendor dashboard.`,
          },
        }).catch(() => {});
      }

      setApplications(prev => prev.filter(a => a.id !== app.id));
    } finally {
      setProcessingId(null);
    }
  };

  const reject = async (app: VendorApplication, reason: string) => {
    setProcessingId(app.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from('vendor_product_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id || null,
        })
        .eq('id', app.id);

      if (app.vendor_registrations?.email) {
        sendEmail({
          type: 'notification',
          to_email: app.vendor_registrations.email,
          to_name: app.vendor_registrations.business_name,
          data: {
            subject: `Update on your submission: ${app.name}`,
            title: "Your product wasn't approved this time",
            message: `${app.name} couldn't be approved for the following reason: ${reason}. You're welcome to make the changes and submit again.`,
          },
        }).catch(() => {});
      }

      setApplications(prev => prev.filter(a => a.id !== app.id));
    } finally {
      setProcessingId(null);
    }
  };

  return { applications, loading, processingId, approve, reject, refresh: fetchApplications };
}
