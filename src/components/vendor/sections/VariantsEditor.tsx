import { Plus, Trash2 } from 'lucide-react';

export interface VariantRow {
  color: string;
  size: string;
  quantity: string;
}

interface VariantsEditorProps {
  variants: VariantRow[];
  setVariants: (variants: VariantRow[]) => void;
  themeColor: string;
}

export default function VariantsEditor({ variants, setVariants, themeColor }: VariantsEditorProps) {
  const update = (i: number, field: keyof VariantRow, value: string) => {
    setVariants(variants.map((v, idx) => idx === i ? { ...v, [field]: value } : v));
  };
  const remove = (i: number) => setVariants(variants.filter((_, idx) => idx !== i));
  const add = () => setVariants([...variants, { color: '', size: '', quantity: '' }]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-xs uppercase text-gray-500">
          Variants <span className="text-gray-400 normal-case text-[10px]">(optional — colors, sizes)</span>
        </label>
        <button type="button" onClick={add} className="flex items-center gap-1 text-xs font-medium" style={{ color: themeColor }}>
          <Plus size={13} /> Add variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No variants — this product will be listed as a single option.</p>
      ) : (
        <div className="space-y-2">
          {variants.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <input value={v.color} onChange={e => update(i, 'color', e.target.value)}
                className="border p-2 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Color" />
              <input value={v.size} onChange={e => update(i, 'size', e.target.value)}
                className="border p-2 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Size" />
              <input type="number" min="1" value={v.quantity} onChange={e => update(i, 'quantity', e.target.value)}
                className="border p-2 text-sm rounded bg-gray-50 focus:bg-white outline-none focus:border-black" placeholder="Qty" />
              <button type="button" onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 p-1">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <p className="text-[11px] text-gray-400">Variant quantities should add up to your total quantity above.</p>
        </div>
      )}
    </div>
  );
}
