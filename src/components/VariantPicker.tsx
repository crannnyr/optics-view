import { Product } from '../lib/supabase';
import { getOptionDelta } from '../lib/variantPricing';

interface VariantPickerProps {
  label: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
  kind: 'color' | 'type' | 'size';
  product: Product;
  themeColor: string;
}

// Above this many options, a button grid becomes unusable (some import
// products — phone screen replacements especially — carry 200+ model/grade
// variants). A native <select> handles that scale cleanly; small lists stay
// as tappable buttons, which is nicer for the common case of 2-6 colors.
const DROPDOWN_THRESHOLD = 12;

function formatOptionLabel(option: string, delta: number): string {
  if (delta > 0) return `${option} (+₦${delta.toLocaleString()})`;
  if (delta < 0) return `${option} (₦${delta.toLocaleString()})`;
  return option;
}

export default function VariantPicker({ label, options, selected, onSelect, kind, product, themeColor }: VariantPickerProps) {
  const useDropdown = options.length > DROPDOWN_THRESHOLD;

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
        Select {label}
        {selected && <span className="ml-2 normal-case font-medium" style={{ color: themeColor }}>— {selected}</span>}
      </label>

      {useDropdown ? (
        <select
          value={selected}
          onChange={e => onSelect(e.target.value)}
          className="w-full border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-700 outline-none"
          style={{ borderColor: selected ? themeColor : undefined }}
        >
          <option value="" disabled>Choose {label.toLowerCase()}…</option>
          {options.map(opt => (
            <option key={opt} value={opt}>
              {formatOptionLabel(opt, getOptionDelta(product, kind, opt))}
            </option>
          ))}
        </select>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const delta = getOptionDelta(product, kind, opt);
            const isSelected = selected === opt;
            return (
              <button
                key={opt}
                onClick={() => onSelect(opt)}
                className={`px-3 md:px-4 py-2 text-xs md:text-sm border transition-colors ${isSelected ? 'text-white' : 'bg-white text-gray-700 border-gray-300'}`}
                style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : undefined}
              >
                {formatOptionLabel(opt, delta)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
