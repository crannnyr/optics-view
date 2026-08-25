import { useState, useEffect } from 'react';
import { vendorSupabase as supabase } from '../../../lib/vendorSupabase';

export interface VendorItemType {
  id: string;
  name: string;
}

export interface VendorCategory {
  id: string;
  name: string;
  item_types: VendorItemType[];
}

// Only categories listed in vendor_program_rules.allowed_category_ids can be
// posted into by vendors — the retail catalog has more categories than that
// (e.g. Eyewear, Magic, Skincare are OpticsView's own, not open to vendors).
export function useVendorCategories(allowedCategoryIds: string[]) {
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (allowedCategoryIds.length === 0) { setLoading(false); return; }
    let cancelled = false;

    Promise.all([
      supabase.from('categories').select('id, name').in('id', allowedCategoryIds).order('name'),
      supabase.from('category_item_types').select('id, name, category_id').in('category_id', allowedCategoryIds).order('name'),
    ]).then(([catsRes, typesRes]) => {
      if (cancelled) return;
      const cats = catsRes.data || [];
      const types = typesRes.data || [];
      setCategories(cats.map(c => ({
        id: c.id,
        name: c.name,
        item_types: types.filter(t => t.category_id === c.id).map(t => ({ id: t.id, name: t.name })),
      })));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [allowedCategoryIds.join(',')]);

  return { categories, loading };
}
