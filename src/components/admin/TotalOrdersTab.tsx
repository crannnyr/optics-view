import { useState, useEffect, useMemo } from 'react';
import { Loader2, ClipboardList, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface RawItem {
  quantity: number;
  selected_color: string | null;
  selected_type: string | null;
  selected_size: string | null;
  products: {
    id: string;
    name: string;
    supplier: string | null;
    source_url: string | null;
  } | null;
  orders: { import_status: string | null } | null;
}

interface VariantLine {
  key: string;
  label: string;
  quantity: number;
}

interface ProductTotal {
  productId: string;
  name: string;
  sourceUrl: string | null;
  totalQuantity: number;
  variants: VariantLine[];
}

// Orders still needing sourcing: payment confirmed but not yet shipped.
// 'to_pay' is excluded since it isn't confirmed yet; 'shipped'/'to_receive'/
// 'refunded' are excluded since sourcing for those is already done or moot.
const ACTIVE_STATUSES = ['confirmed', 'billed'];

export default function TotalOrdersTab() {
  const [items, setItems] = useState<RawItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('order_items')
      .select(`
        quantity, selected_color, selected_type, selected_size,
        products ( id, name, supplier, source_url ),
        orders!inner ( import_status )
      `)
      .in('orders.import_status', ACTIVE_STATUSES)
      .then(({ data }) => {
        setItems((data as any) || []);
        setLoading(false);
      });
  }, []);

  const totals = useMemo<ProductTotal[]>(() => {
    const map = new Map<string, ProductTotal>();

    for (const item of items) {
      const product = item.products;
      // Admin/import items only — vendor-supplied items are sourced by the
      // vendor themselves, not something admin needs to go buy on 1688.
      if (!product || product.supplier === 'vendor') continue;

      let entry = map.get(product.id);
      if (!entry) {
        entry = { productId: product.id, name: product.name, sourceUrl: product.source_url, totalQuantity: 0, variants: [] };
        map.set(product.id, entry);
      }

      entry.totalQuantity += item.quantity;

      const variantParts = [item.selected_color, item.selected_type, item.selected_size].filter(Boolean);
      if (variantParts.length > 0) {
        const key = variantParts.join(' / ');
        const existing = entry.variants.find(v => v.key === key);
        if (existing) existing.quantity += item.quantity;
        else entry.variants.push({ key, label: key, quantity: item.quantity });
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [items]);

  const grandTotal = totals.reduce((sum, t) => sum + t.totalQuantity, 0);

  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center gap-3 mb-2">
        <ClipboardList size={24} className="text-[#0d2818]" />
        <h2 className="text-xl font-light text-[#0d2818]">Total Orders</h2>
      </div>
      <p className="text-xs text-gray-400 mb-6">
        Admin/import items only, from orders confirmed but not yet shipped — what still needs sourcing. {grandTotal} units across {totals.length} products.
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-300" size={28} /></div>
      ) : totals.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-lg border">
          <ClipboardList size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nothing pending sourcing right now</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[11px] uppercase text-gray-500">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Variants Needed</th>
                <th className="text-right px-4 py-3">Total Qty</th>
                <th className="text-right px-4 py-3">1688</th>
              </tr>
            </thead>
            <tbody>
              {totals.map(t => (
                <tr key={t.productId} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-3 text-gray-800">{t.name}</td>
                  <td className="px-4 py-3">
                    {t.variants.length === 0 ? (
                      <span className="text-gray-400 text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {t.variants.map(v => (
                          <span key={v.key} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                            {v.label} × {v.quantity}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#0d2818]">{t.totalQuantity}</td>
                  <td className="px-4 py-3 text-right">
                    {t.sourceUrl ? (
                      <a
                        href={t.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        Link <ExternalLink size={11} />
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
