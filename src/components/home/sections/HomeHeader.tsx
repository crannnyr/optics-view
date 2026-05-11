import { Menu, Package, LogOut } from 'lucide-react';

interface HomeHeaderProps {
  user: any;
  store: {
    name: string;
    themeColor: string;
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
  setIsAuthOpen
}: HomeHeaderProps) {
  return (
    <header className="border-b border-gray-200 sticky top-0 bg-white z-40">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 
          className="text-lg font-light tracking-[0.3em]"
          style={{ color: store.themeColor }}
        >
          {store.name.toUpperCase()}
        </h1>

        <div>
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
                  {/* Backdrop for closing menu */}
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
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = store.themeColor;
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = store.themeColor;
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
