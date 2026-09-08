import { useState, useEffect, useRef } from 'react';
import { Menu, Package, LogOut, Download, MessageCircle, Store, Rocket, Globe, Search, X } from 'lucide-react';
import { supabase, Product } from '../../../lib/supabase';
import CustomerNotifications from '../../CustomerNotifications';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }
    const onBeforeInstall = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setIsInstalled(true); setDeferredPrompt(null); };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') { setDeferredPrompt(null); setIsInstalled(true); }
  };

  return { canInstall: !!deferredPrompt && !isInstalled, triggerInstall };
}

interface HomeHeaderProps {
  user: any;
  store: { name: string; themeColor: string; logoUrl?: string | null };
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  onNavigateToOrders: () => void;
  onNavigateToVendor: () => void;
  handleSignOut: () => void;
  setIsAuthOpen: (open: boolean) => void;
  onViewProduct: (product: Product) => void;
}

const WHATSAPP_NUMBER = '447404707531';
const QAFRICA_STORE_URL = 'https://qafrica.store';

// Inline search: an icon that expands into a full-width input directly in
// the header row, rather than a separate section pushed below the hero.
// Debounced live search against name + description, same behavior as
// before — just relocated so search is reachable from the header on every
// screen, per standard 2026 mobile-commerce header expectations.
function HeaderSearch({ themeColor, onViewDetails }: { themeColor: string; onViewDetails: (p: Product) => void }) {
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
    <div ref={containerRef} className="relative flex items-center flex-1 min-w-0 justify-end sm:justify-start">
      {open ? (
        <div className="flex items-center w-full sm:w-64">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search products…"
            className="text-sm outline-none bg-gray-50 border border-gray-200 rounded-full w-full px-4 py-2 mr-2"
          />
          <button onClick={closeSearch} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-100" aria-label="Close search">
            <X size={16} className="text-gray-500" />
          </button>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 hover:bg-gray-100" aria-label="Search">
          <Search size={18} style={{ color: themeColor }} />
        </button>
      )}

      {open && query.trim() && (
        <div className="absolute top-full left-0 right-0 sm:right-auto mt-2 w-full sm:w-80 max-h-80 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-30">
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
                    <img src={product.images?.[0] || product.image_url || ''} alt="" className="w-full h-full object-cover" />
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

export default function HomeHeader({
  user, store, isUserMenuOpen, setIsUserMenuOpen,
  onNavigateToOrders, onNavigateToVendor, handleSignOut, setIsAuthOpen, onViewProduct,
}: HomeHeaderProps) {
  const { canInstall, triggerInstall } = usePWAInstall();

  const handleCustomerService = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
    setIsUserMenuOpen(false);
  };

  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">

        {/* Logo / store name — fixed, never shrinks */}
        <div className="shrink-0">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <h1 className="text-base font-light tracking-[0.25em]" style={{ color: store.themeColor }}>
              {store.name.toUpperCase()}
            </h1>
          )}
        </div>

        {/* Search takes the remaining space — this is the "content" of the
            header now, not an afterthought pushed below the hero. */}
        <HeaderSearch themeColor={store.themeColor} onViewDetails={onViewProduct} />

        {/* Right cluster — icon-only on mobile, minimal footprint */}
        <div className="flex items-center gap-1 shrink-0">
          {canInstall && (
            <button
              onClick={triggerInstall}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
              style={{ color: store.themeColor }}
              aria-label="Install app"
              title="Install app"
            >
              <Download size={17} />
            </button>
          )}

          {user ? (
            <div className="flex items-center">
              <CustomerNotifications user={user} />
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Menu"
                >
                  <Menu size={20} style={{ color: store.themeColor }} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 shadow-lg z-50 py-2 rounded-lg">
                      <div className="px-4 py-3 border-b border-gray-100 mb-2">
                        <p className="text-xs text-gray-400">Signed in as</p>
                        <p className="text-sm font-medium truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => { onNavigateToOrders(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Package size={16} /> My Profile
                      </button>
                      <button
                        onClick={() => { onNavigateToVendor(); setIsUserMenuOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        style={{ color: store.themeColor }}
                      >
                        <Store size={16} /> Sell My Product
                      </button>
                      <a
                        href={QAFRICA_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Rocket size={16} className="text-amber-600" />
                        Start Dropshipping
                        <span className="ml-auto text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          NEW
                        </span>
                      </a>
                      <a
                        href={QAFRICA_STORE_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Globe size={16} className="text-green-700" />
                        Get a Website — ₦5,000
                        <span className="ml-auto text-[9px] font-extrabold tracking-wider px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                          NEW
                        </span>
                      </a>
                      <button
                        onClick={handleCustomerService}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-green-600"
                      >
                        <MessageCircle size={16} /> Customer Service
                      </button>
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-xs tracking-widest border px-4 sm:px-6 py-2 rounded-full transition-colors hover:text-white whitespace-nowrap"
              style={{ borderColor: store.themeColor, color: store.themeColor }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = store.themeColor; (e.currentTarget as HTMLButtonElement).style.color = '#ffffff'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = store.themeColor; }}
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
