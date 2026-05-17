import { useState, useEffect } from 'react';
import { Menu, Package, LogOut, Download } from 'lucide-react';

// ── PWA install prompt type ───────────────────────────────────────────────────
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// ── PWA install hook ─────────────────────────────────────────────────────────
function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled]       = useState(false);

  useEffect(() => {
    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // stops the mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

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
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstalled(true);
    }
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    triggerInstall,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────
interface HomeHeaderProps {
  user: any;
  store: {
    name: string;
    themeColor: string;
    logoUrl?: string | null;
  };
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (open: boolean) => void;
  onNavigateToOrders: () => void;
  handleSignOut: () => void;
  setIsAuthOpen: (open: boolean) => void;
}

export default function HomeHeader({
  user,
  store,
  isUserMenuOpen,
  setIsUserMenuOpen,
  onNavigateToOrders,
  handleSignOut,
  setIsAuthOpen,
}: HomeHeaderProps) {
  const { canInstall, triggerInstall } = usePWAInstall();

  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-4">

        {/* ── Logo / Store name ── */}
        {store.logoUrl ? (
         <img
         src={store.logoUrl}
         alt={store.name}
         className="h-10 w-10 rounded-full object-cover flex-shrink-0"
       />
        ) : (
          <h1
            className="text-lg font-light tracking-[0.3em]"
            style={{ color: store.themeColor }}
          >
            {store.name.toUpperCase()}
          </h1>
        )}

        {/* ── Right side ── */}
        <div className="flex items-center gap-3">

          {/* PWA Install button — only visible when browser fires beforeinstallprompt */}
          {canInstall && (
            <button
              onClick={triggerInstall}
              className="flex items-center gap-1.5 text-xs tracking-wider border px-3 py-1.5 rounded-full transition-colors hover:text-white"
              style={{
                borderColor: store.themeColor,
                color: store.themeColor,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = store.themeColor;
                (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = store.themeColor;
              }}
              title="Install app"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Install App</span>
            </button>
          )}

          {/* User menu / Sign in */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Menu size={24} style={{ color: store.themeColor }} />
              </button>

              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border shadow-lg z-50 py-2">
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
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-xs tracking-widest border px-6 py-2 transition-colors hover:text-white"
              style={{
                borderColor: store.themeColor,
                color: store.themeColor,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = store.themeColor;
                (e.currentTarget as HTMLButtonElement).style.color = '#ffffff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLButtonElement).style.color = store.themeColor;
              }}
            >
              SIGN IN
            </button>
          )}
        </div>
      </div>
    </header>
  );
}