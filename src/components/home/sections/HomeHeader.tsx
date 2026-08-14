import { useState, useEffect } from 'react';
import { Menu, Package, LogOut, Download, MessageCircle, Store, Rocket, Globe } from 'lucide-react';
import CustomerNotifications from '../../CustomerNotifications';
import SellWithUsModal from './SellWithUsModal';

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
  handleSignOut: () => void;
  setIsAuthOpen: (open: boolean) => void;
}

const WHATSAPP_NUMBER = '447404707531';
const QAFRICA_STORE_URL = 'https://qafrica.store';

export default function HomeHeader({
  user, store, isUserMenuOpen, setIsUserMenuOpen,
  onNavigateToOrders, handleSignOut, setIsAuthOpen,
}: HomeHeaderProps) {
  const { canInstall, triggerInstall } = usePWAInstall();
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const handleCustomerService = () => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}`, '_blank');
    setIsUserMenuOpen(false);
  };

  return (
    <>
      {/* Header height reduced ~15% (py-4 -> py-[13.6px]) */}
      <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-6 py-[13.6px] flex justify-between items-center gap-4">

          {/* Logo / Store name — logo size reduced ~10% (h-10/w-10 -> h-9/w-9) */}
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-9 w-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <h1 className="text-lg font-light tracking-[0.3em]" style={{ color: store.themeColor }}>
              {store.name.toUpperCase()}
            </h1>
          )}

          {/* Right side */}
          <div className="flex items-center gap-3">

            {/* PWA Install */}
            {canInstall && (
              <button
                onClick={triggerInstall}
                className="flex items-center gap-1.5 text-xs tracking-wider border px-3 py-1.5 rounded-full transition-colors hover:text-white"
                style={{ borderColor: store.themeColor, color: store.themeColor }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = store.themeColor; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = store.themeColor; }}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Install App</span>
              </button>
            )}

            {/* User menu / Sign in */}
            {user ? (
              <div className="flex items-center gap-1">
                <CustomerNotifications user={user} />
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Menu size={24} style={{ color: store.themeColor }} />
                  </button>

                  {isUserMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-64 bg-white border shadow-lg z-50 py-2">
                        <div className="px-4 py-3 border-b mb-2">
                          <p className="text-xs text-gray-500">Signed in as</p>
                          <p className="text-sm font-medium truncate">{user.email}</p>
                        </div>
                        <button
                          onClick={() => { onNavigateToOrders(); setIsUserMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2"
                        >
                          <Package size={16} /> My Purchases
                        </button>
                        <button
                          onClick={() => { setSellModalOpen(true); setIsUserMenuOpen(false); }}
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
                className="text-xs tracking-widest border px-6 py-2 transition-colors hover:text-white"
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

      <SellWithUsModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        themeColor={store.themeColor}
      />
    </>
  );
}
