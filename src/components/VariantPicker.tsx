import { useState, useRef, useEffect } from 'react';
import { Product } from '../lib/supabase';
import { getOptionDelta } from '../lib/variantPricing';
import { ChevronDown, Search, Check } from 'lucide-react';

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
// variants). A searchable in-page list handles that scale cleanly without
// leaving the site's own styling (a native <select> pops the OS picker,
// which looks jarring and off-brand, especially on mobile); small lists
// stay as tappable buttons, which is nicer for the common case of 2-6 colors.
const DROPDOWN_THRESHOLD = 12;

function formatOptionLabel(option: string, delta: number): string {
  if (delta > 0) return `${option} (+₦${delta.toLocaleString()})`;
  if (delta < 0) return `${option} (₦${delta.toLocaleString()})`;
  return option;
}

export default function VariantPicker({ label, options, selected, onSelect, kind, product, themeColor }: VariantPickerProps) {
  const useSearchableList = options.length > DROPDOWN_THRESHOLD;
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const filteredOptions = query
    ? options.filter(opt => opt.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div>
      <label className="block text-xs uppercase tracking-wider text-gray-500 mb-3">
        Select {label}
        {selected && <span className="ml-2 normal-case font-medium" style={{ color: themeColor }}>— {selected}</span>}
      </label>

      {useSearchableList ? (
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen(o => !o)}
            className="w-full flex items-center justify-between border border-gray-300 px-3 py-2.5 text-sm bg-white text-gray-700 outline-none"
            style={{ borderColor: selected ? themeColor : undefined }}
          >
            <span className={selected ? 'text-gray-900' : 'text-gray-400'}>
              {selected ? formatOptionLabel(selected, getOptionDelta(product, kind, selected)) : `Choose ${label.toLowerCase()}…`}
            </span>
            <ChevronDown size={16} className="text-gray-400 shrink-0" />
          </button>

          {isOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded shadow-lg">
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
                <Search size={14} className="text-gray-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="w-full text-sm outline-none placeholder:text-gray-400"
                />
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-gray-400">No matches</p>
                ) : (
                  filteredOptions.map(opt => {
                    const delta = getOptionDelta(product, kind, opt);
                    const isSelected = selected === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => { onSelect(opt); setIsOpen(false); setQuery(''); }}
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-left hover:bg-gray-50"
                        style={isSelected ? { backgroundColor: `${themeColor}0d`, color: themeColor } : { color: '#374151' }}
                      >
                        <span>{formatOptionLabel(opt, delta)}</span>
                        {isSelected && <Check size={14} />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
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
