import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { supabase, CartItem, Product } from './lib/supabase';
import Home from './components/Home';
import { Lock, Loader2, SearchX } from 'lucide-react';
import { useStore } from './context/StoreContext';

// ── Lazy-loaded route components ──────────────────────────────────────────────
// These are only downloaded when the user actually navigates to that route.
// A customer browsing the shop never downloads Admin or RetailerDashboard JS.
const Admin             = lazy(() => import('./components/Admin'));
const OrderHistory      = lazy(() => import('./components/OrderHistory'));
const ProductDetails    = lazy(() => import('./components/ProductDetails'));
const LegalPages        = lazy(() => import('./components/LegalPages'));
const RetailerDashboard = lazy(() => import('./components/RetailerDashboard'));

// ── Shared page-level loading fallback ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={32} className="animate-spin text-gray-300" />
    </div>
  );
}

// ── Session timeout toast ─────────────────────────────────────────────────────
const SESSION_TIMEOUT_MS = 6000;

function SessionToast({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full text-center border-t-4 border-[#0d2818]">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase mb-2">
          Session Lost
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          Your session could not be restored. Please sign in again to continue.
        </p>
        <button
          onClick={onDismiss}
          className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded"
        >
          OK, GOT IT
        </button>
      </div>
    </div>
  );
}

function App() {
  const { store, loading: storeLoading, storeNotFound } = useStore();
  const [currentView, setCurrentView] = useState<
    'shop' | 'admin' | 'retailer' | 'orders' | 'details' | 'legal-privacy' | 'legal-terms'
  >('shop');
  const [user, setUser]                     = useState<any>(null);
  const [authLoading, setAuthLoading]       = useState(true);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [adminEmail,    setAdminEmail]    = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError,    setAdminError]    = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('optics_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const resolveView = (path: string) => {
    if (path === '/admin')               return 'admin';
    if (path === '/retailer')            return 'retailer';
    if (path === '/privacy-policy')      return 'legal-privacy';
    if (path === '/terms-conditions')    return 'legal-terms';
    if (path === '/orders')              return 'orders';
    if (path.startsWith('/product/'))    return 'details';
    return 'shop';
  };

  // 1. Initial load & auth — with session timeout
  useEffect(() => {
    let timedOut = false;

    const hasStoredSession = Object.keys(localStorage).some(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );

    if (hasStoredSession) {
      sessionTimeoutRef.current = setTimeout(async () => {
        timedOut = true;
        await supabase.auth.signOut();
        setUser(null);
        setSessionTimedOut(true);
        setAuthLoading(false);
      }, SESSION_TIMEOUT_MS);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (timedOut) return;
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (timedOut) return;
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const path = window.location.pathname;
    const view = resolveView(path);
    setCurrentView(view as any);

    if (view === 'details') {
      const productId = path.replace('/product/', '');
      supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()
        .then(({ data }) => {
          if (data) setSelectedProduct(data);
          else navigateTo('shop', '/');
        });
    }

    const handlePopState = () => {
      const newPath = window.location.pathname;
      const newView = resolveView(newPath);
      setCurrentView(newView as any);
      if (newView === 'details') {
        const productId = newPath.replace('/product/', '');
        supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single()
          .then(({ data }) => { if (data) setSelectedProduct(data); });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, []);

  // 2. Persist cart
  useEffect(() => {
    localStorage.setItem('optics_cart', JSON.stringify(cart));
  }, [cart]);

  // 3. Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const navigateTo = (view: typeof currentView, path: string) => {
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  const viewProduct = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('details', `/product/${product.id}`);
  };

  // ── Cart actions ──────────────────────────────────────────────────────────
  const addToCart = (
    product: Product,
    quantity = 1,
    selectedColor?: string,
    selectedType?: string,
  ) => {
    setCart(prev => {
      const exists = prev.find(
        item =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedType === selectedType,
      );
      if (exists) {
        return prev.map(item =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedType === selectedType
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }
      return [...prev, { product, quantity, selectedColor, selectedType }];
    });
  };

  const updateQuantity = (
    id: string,
    qty: number,
    selectedColor?: string,
    selectedType?: string,
  ) => {
    if (qty <= 0) {
      setCart(prev =>
        prev.filter(
          i =>
            !(i.product.id === id &&
              i.selectedColor === selectedColor &&
              i.selectedType === selectedType),
        ),
      );
    } else {
      setCart(prev =>
        prev.map(i =>
          i.product.id === id &&
          i.selectedColor === selectedColor &&
          i.selectedType === selectedType
            ? { ...i, quantity: qty }
            : i,
        ),
      );
    }
  };

  const removeFromCart = (id: string, selectedColor?: string, selectedType?: string) => {
    setCart(prev =>
      prev.filter(
        i =>
          !(i.product.id === id &&
            i.selectedColor === selectedColor &&
            i.selectedType === selectedType),
      ),
    );
  };

  const clearCart = () => setCart([]);

  // ── Admin login ───────────────────────────────────────────────────────────
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    });
    if (error) { setAdminError('Invalid credentials'); return; }
    if (data.user?.user_metadata?.role !== 'admin') {
      setAdminError('Access Denied: Not an administrator');
      await supabase.auth.signOut();
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (storeNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full border-t-4 border-red-500">
          <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX size={32} className="text-red-500" />
          </div>
          <h1 className="text-2xl font-light text-gray-900 mb-2">Store Not Found</h1>
          <p className="text-gray-500 mb-8">
            We couldn't find the retailer store you're looking for. The link might be
            incorrect or the store may no longer exist.
          </p>
          <a
            href="/"
            className="block w-full bg-[#0d2818] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity rounded"
          >
            VISIT MAIN STORE
          </a>
        </div>
      </div>
    );
  }

  // ── Legal pages ───────────────────────────────────────────────────────────
  if (currentView === 'legal-privacy') {
    return (
      <Suspense fallback={<PageLoader />}>
        <LegalPages page="privacy" onBack={() => navigateTo('shop', '/')} />
      </Suspense>
    );
  }
  if (currentView === 'legal-terms') {
    return (
      <Suspense fallback={<PageLoader />}>
        <LegalPages page="terms" onBack={() => navigateTo('shop', '/')} />
      </Suspense>
    );
  }

  // ── Admin ─────────────────────────────────────────────────────────────────
  if (currentView === 'admin') {
    const isAdmin = user && user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 max-w-md w-full shadow-lg text-center border-t-4 border-[#0d2818]">
            <Lock size={48} className="mx-auto mb-4 text-[#0d2818]" />
            <h1 className="text-xl font-light tracking-wide text-[#0d2818] mb-6">ADMIN ACCESS</h1>
            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full border p-3 text-sm outline-none focus:border-[#0d2818] transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full border p-3 text-sm outline-none focus:border-[#0d2818] transition-colors"
                />
              </div>
              {adminError && (
                <p className="text-red-500 text-xs text-center font-medium">{adminError}</p>
              )}
              <button className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity">
                ENTER PANEL
              </button>
            </form>
            <button
              onClick={() => navigateTo('shop', '/')}
              className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline"
            >
              Return to Store
            </button>
          </div>
        </div>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <div>
          <div className="bg-[#0d2818] text-white px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-md">
            <span className="text-xs tracking-widest font-bold">ADMIN PANEL</span>
            <div className="flex gap-4 items-center">
              <span className="text-xs opacity-70 hidden sm:inline">
                Logged in as {user.email}
              </span>
              <button
                onClick={() => navigateTo('shop', '/')}
                className="text-xs tracking-widest hover:underline bg-white/10 px-3 py-1 rounded"
              >
                EXIT
              </button>
            </div>
          </div>
          <Admin />
        </div>
      </Suspense>
    );
  }

  // ── Retailer dashboard ────────────────────────────────────────────────────
  if (currentView === 'retailer') {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 max-w-md w-full shadow-lg text-center border-t-4 border-[#0d2818]">
            <Lock size={48} className="mx-auto mb-4 text-[#0d2818]" />
            <h1 className="text-xl font-light tracking-wide text-[#0d2818] mb-2">
              RETAILER ACCESS
            </h1>
            <p className="text-sm text-gray-600 mb-8">
              Please sign in to access your dashboard.
            </p>
            <button
              onClick={() => navigateTo('shop', '/')}
              className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:bg-opacity-90"
            >
              GO TO HOME & SIGN IN
            </button>
          </div>
        </div>
      );
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <div>
          <div className="bg-[#0d2818] text-white px-6 py-3 flex justify-between items-center sticky top-0 z-50">
            <span className="text-xs tracking-widest font-bold">RETAILER DASHBOARD</span>
            <div className="flex gap-4 items-center">
              <span className="text-xs opacity-70 hidden sm:inline">{user.email}</span>
              <button
                onClick={() => navigateTo('shop', '/')}
                className="text-xs tracking-widest hover:underline bg-white/10 px-3 py-1 rounded"
              >
                EXIT
              </button>
            </div>
          </div>
          <RetailerDashboard />
        </div>
      </Suspense>
    );
  }

  // ── Order history ─────────────────────────────────────────────────────────
  if (currentView === 'orders') {
    return (
      <Suspense fallback={<PageLoader />}>
        <OrderHistory onBack={() => navigateTo('shop', '/')} />
      </Suspense>
    );
  }

  // ── Product details ───────────────────────────────────────────────────────
  if (currentView === 'details' && selectedProduct) {
    return (
      <Suspense fallback={<PageLoader />}>
        <ProductDetails
          product={selectedProduct}
          onBack={() => navigateTo('shop', '/')}
          onAddToCart={addToCart}
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveFromCart={removeFromCart}
          onClearCart={clearCart}
          onNavigateToProduct={viewProduct}
          user={user}
        />
      </Suspense>
    );
  }

  // ── Shop (default) ────────────────────────────────────────────────────────
  return (
    <>
      {sessionTimedOut && (
        <SessionToast onDismiss={() => setSessionTimedOut(false)} />
      )}
      <Home
        user={user}
        cart={cart}
        onAddToCart={p => addToCart(p, 1)}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onNavigateToOrders={() => navigateTo('orders', '/orders')}
        onViewProduct={viewProduct}
        onNavigateToPrivacy={() => navigateTo('legal-privacy', '/privacy-policy')}
        onNavigateToTerms={() => navigateTo('legal-terms', '/terms-conditions')}
      />
    </>
  );
}

export default App;
