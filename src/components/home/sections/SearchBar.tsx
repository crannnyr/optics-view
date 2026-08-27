import { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { supabase, Product } from '../../../lib/supabase';

interface SearchBarProps {
  themeColor: string;
  onViewDetails: (product: Product) => void;
}

// Minimal icon-only search that expands leftward into an input on click,
// with a subtle width transition. Searches product name AND description.
// Debounced live search — no submit button needed.
export default function SearchBar({ themeColor, onViewDetails }: SearchBarProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      const q = query.trim();
      const { data } = await supabase
        .from('products_feed')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(20);
      setResults(data || []);
      setSearching(false);
    }, 350);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const closeSearch = () => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div ref={containerRef} className="relative flex justify-end px-4 pt-3">
      <div className="flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search products…"
          className={`text-sm outline-none bg-gray-50 border border-gray-200 rounded-full transition-all duration-300 ease-out ${
            open ? 'w-48 sm:w-64 opacity-100 px-4 py-2 mr-2' : 'w-0 opacity-0 px-0 py-2 mr-0 border-transparent'
          }`}
        />
        <button
          onClick={() => (open ? closeSearch() : setOpen(true))}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors hover:bg-gray-100"
          aria-label={open ? 'Close search' : 'Search'}
        >
          {open ? <X size={18} className="text-gray-500" /> : <Search size={18} style={{ color: themeColor }} />}
        </button>
      </div>

      {open && query.trim() && (
        <div className="absolute top-full right-4 mt-2 w-72 sm:w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30">
          {searching ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
            </div>
          ) : hasSearched && results.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8 px-4">Sorry, not available.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {results.map(product => (
                <button
                  key={product.id}
                  onClick={() => { onViewDetails(product); closeSearch(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden shrink-0">
                    <img
                      src={product.images?.[0] || product.image_url || ''}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">₦{Number(product.price).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
