import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { supabase, CartItem, Product, clearAuthTokens, wasIntentionalSignOut, resetSignOutFlag } from './lib/supabase';
import Home from './components/Home';
import { Lock, Loader2, SearchX, WifiOff, RefreshCw } from 'lucide-react';
import { useStore } from './context/StoreContext';

const Admin             = lazy(() => import('./components/Admin'));
const OrderHistory      = lazy(() => import('./components/OrderHistory'));
const ProductDetails    = lazy(() => import('./components/ProductDetails'));
const LegalPages        = lazy(() => import('./components/LegalPages'));
const RetailerDashboard = lazy(() => import('./components/RetailerDashboard'));
const CheckoutPage      = lazy(() => import('./components/CheckoutPage'));
const VendorLandingPage = lazy(() => import('./components/vendor/VendorLandingPage'));
const VendorDashboardPage = lazy(() => import('./components/vendor/VendorDashboardPage'));

const SESSION_TIMEOUT_MS = 15 * 1000;

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 size={32} className="animate-spin text-gray-300" />
    </div>
  );
}

function PWAUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.ready.then(reg => {
      if (reg.waiting) { setWaiting(reg.waiting); return; }

      reg.addEventListener('updatefound', () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener('statechange', () => {
          if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
            setWaiting(newSW);
          }
        });
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const applyUpdate = () => {
    if (!waiting) return;
    waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  if (!waiting) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-[#0d2818] text-white p-4 rounded-lg shadow-xl z-[9998]">
      <div className="flex items-start gap-3">
        <RefreshCw size={16} className="mt-0.5 shrink-0 text-white/70" />
        <div className="flex-1">
          <p className="text-xs font-semibold tracking-wider">Update Available</p>
          <p className="text-[11px] text-white/60 mt-1 leading-relaxed">
            A new version of the app is ready.
          </p>
        </div>
        <button
          onClick={applyUpdate}
          className="shrink-0 text-[10px] bg-white text-[#0d2818] px-3 py-1.5 rounded font-semibold tracking-wider hover:bg-gray-100 transition-colors"
        >
          UPDATE
        </button>
      </div>
    </div>
  );
}

function SessionToast({ onDismiss, showSignIn }: { onDismiss: () => void; showSignIn: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full text-center border-t-4 border-[#0d2818]">
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Lock size={22} className="text-amber-500" />
        </div>
        <h3 className="text-sm font-semibold tracking-wider text-gray-800 uppercase mb-2">
          Session Expired
        </h3>
        <p className="text-sm text-gray-500 mb-5 leading-relaxed">
          {showSignIn
            ? 'Your session expired while you were active. Please sign in again to continue.'
            : 'Your session could not be restored. Please sign in again to continue.'}
        </p>
        <button
          onClick={onDismiss}
          className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity rounded"
        >
          {showSignIn ? 'SIGN IN AGAIN' : 'OK, GOT IT'}
        </button>
      </div>
    </div>
  );
}

function StoreErrorScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-10 rounded-lg shadow-xl max-w-md w-full border-t-4 border-amber-400">
        <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff size={28} className="text-amber-500" />
        </div>
        <h1 className="text-xl font-light text-gray-900 mb-2">Connection Problem</h1>
        <p className="text-sm text-gray-500 mb-8 leading-relaxed">
          We couldn't reach the server. This is usually a network issue.
          Check your connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[#0d2818] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity rounded flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          TRY AGAIN
        </button>
      </div>
    </div>
  );
}

function App() {
  const { store, loading: storeLoading, storeNotFound, storeError } = useStore();
  const [currentView, setCurrentView] = useState<
    'shop' | 'admin' | 'retailer' | 'orders' | 'details' | 'checkout' | 'legal-privacy' | 'legal-terms' | 'vendor-landing' | 'vendor-dashboard'
  >('shop');
  const [user, setUser]                       = useState<any>(null);
  const [authLoading, setAuthLoading]         = useState(true);
  const [sessionTimedOut, setSessionTimedOut] = useState(false);
  const [autoOpenAuth, setAutoOpenAuth]       = useState(false);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cartSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [adminEmail,    setAdminEmail]    = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError,    setAdminError]    = useState('');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Set when navigating to /checkout to retry an existing pending order.
  // Null means a normal fresh checkout from the cart.
  const [retryOrderId, setRetryOrderId] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('optics_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const resolveView = (path: string) => {
    if (path === '/admin')            return 'admin';
    if (path === '/retailer')         return 'retailer';
    if (path === '/privacy-policy')   return 'legal-privacy';
    if (path === '/terms-conditions') return 'legal-terms';
    if (path === '/orders')           return 'orders';
    if (path === '/checkout')         return 'checkout';
    if (path === '/become-a-vendor')  return 'vendor-landing';
    if (path === '/vendor-dashboard') return 'vendor-dashboard';
    if (path.startsWith('/product/')) return 'details';
    return 'shop';
  };

  useEffect(() => {
    let timedOut = false;
    let lastKnownUser: any = null;
    let initialized = false;

    const hasStoredSession = Object.keys(localStorage).some(
      k => k.startsWith('sb-') && k.endsWith('-auth-token')
    );

    if (hasStoredSession) {
      sessionTimeoutRef.current = setTimeout(async () => {
        timedOut = true;
        await supabase.auth.signOut();
        setUser(null);
        setSessionTimedOut(true);
        setAutoOpenAuth(true);
        setAuthLoading(false);
      }, SESSION_TIMEOUT_MS);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (timedOut) return;
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (timedOut) return;
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);

      if (event === 'SIGNED_IN' && session?.user) {
        supabase
          .from('profiles')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('id', session.user.id)
          .then(() => {});
      }

      if (
        initialized &&
        event === 'SIGNED_OUT' &&
        lastKnownUser !== null &&
        !wasIntentionalSignOut()
      ) {
        clearAuthTokens();
        setSessionTimedOut(true);
        setAutoOpenAuth(true);
        if (window.location.pathname !== '/') {
          window.history.pushState({}, '', '/');
          setCurrentView('shop');
        }
      }

      resetSignOutFlag();
      initialized = true;
      lastKnownUser = session?.user ?? null;
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const path = window.location.pathname;
    const view = resolveView(path);
    setCurrentView(view as any);

    if (view === 'details') {
      const productId = path.replace('/product/', '');
      supabase
        .from('products').select('*').eq('id', productId).single()
        .then(({ data }) => {
          if (data) setSelectedProduct(data);
          else { window.history.pushState({}, '', '/'); setCurrentView('shop'); }
        });
    }

    const handlePopState = () => {
      const newPath = window.location.pathname;
      const newView = resolveView(newPath);
      setCurrentView(newView as any);
      if (newView === 'details') {
        const productId = newPath.replace('/product/', '');
        supabase.from('products').select('*').eq('id', productId).single()
          .then(({ data }) => { if (data) setSelectedProduct(data); });
      }
      if (newView !== 'checkout') {
        setRetryOrderId(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener('popstate', handlePopState);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (cartSaveTimerRef.current) clearTimeout(cartSaveTimerRef.current);
    cartSaveTimerRef.current = setTimeout(() => {
      localStorage.setItem('optics_cart', JSON.stringify(cart));
    }, 500);
    return () => {
      if (cartSaveTimerRef.current) clearTimeout(cartSaveTimerRef.current);
    };
  }, [cart]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Kicks a signed-out user off /checkout back to home with the login
  // modal open — covers direct URL entry and mid-checkout session expiry.
  useEffect(() => {
    if (currentView === 'checkout' && !authLoading && !user) {
      setRetryOrderId(null);
      setAutoOpenAuth(true);
      navigateTo('shop', '/');
    }
  }, [currentView, user, authLoading]);

  const navigateTo = (view: typeof currentView, path: string) => {
    window.history.pushState({}, '', path);
    setCurrentView(view);
  };

  const viewProduct = (product: Product) => {
    setSelectedProduct(product);
    navigateTo('details', `/product/${product.id}`);
  };

  // Gatekeeper for every path into checkout (cart, product page, retry
  // payment). Signed-out users never see the checkout page — they're sent
  // home with the login modal already open instead.
  const navigateToCheckout = (orderIdToRetry?: string) => {
    if (!user) {
      setAutoOpenAuth(true);
      navigateTo('shop', '/');
      return;
    }
    setRetryOrderId(orderIdToRetry ?? null);
    navigateTo('checkout', '/checkout');
  };

  const addToCart = (product: Product, quantity = 1, selectedColor?: string, selectedType?: string) => {
    setCart(prev => {
      const exists = prev.find(item =>
        item.product.id === product.id &&
        item.selectedColor === selectedColor &&
        item.selectedType === selectedType
      );
      if (exists) {
        return prev.map(item =>
          item.product.id === product.id &&
          item.selectedColor === selectedColor &&
          item.selectedType === selectedType
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity, selectedColor, selectedType }];
    });
  };

  const updateQuantity = (id: string, qty: number, selectedColor?: string, selectedType?: string) => {
    if (qty <= 0) {
      setCart(prev => prev.filter(i =>
        !(i.product.id === id && i.selectedColor === selectedColor && i.selectedType === selectedType)
      ));
    } else {
      setCart(prev => prev.map(i =>
        i.product.id === id && i.selectedColor === selectedColor && i.selectedType === selectedType
          ? { ...i, quantity: qty } : i
      ));
    }
  };

  const removeFromCart = (id: string, selectedColor?: string, selectedType?: string) => {
    setCart(prev => prev.filter(i =>
      !(i.product.id === id && i.selectedColor === selectedColor && i.selectedType === selectedType)
    ));
  };

  const clearCart = () => setCart([]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail, password: adminPassword,
    });
    if (error) { setAdminError('Invalid credentials'); return; }
    if (data.user?.user_metadata?.role !== 'admin') {
      setAdminError('Access Denied: Not an administrator');
      import('./lib/supabase').then(({ markIntentionalSignOut }) => markIntentionalSignOut());
      await supabase.auth.signOut();
    }
  };

  if (authLoading || storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={32} className="animate-spin text-gray-300" />
      </div>
    );
  }

  if (storeError) return <StoreErrorScreen />;

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
          <a href="/" className="block w-full bg-[#0d2818] text-white py-3 text-sm tracking-widest hover:opacity-90 transition-opacity rounded">
            VISIT MAIN STORE
          </a>
        </div>
      </div>
    );
  }

  if (currentView === 'vendor-dashboard') {
    return (
      <Suspense fallback={<PageLoader />}>
        <VendorDashboardPage
          onNavigateToVendorSignup={() => navigateTo('vendor-landing', '/become-a-vendor')}
        />
      </Suspense>
    );
  }

  if (currentView === 'vendor-landing') {
    return (
      <Suspense fallback={<PageLoader />}>
        <VendorLandingPage
          onBack={() => navigateTo('shop', '/')}
          onNavigateToDashboard={() => navigateTo('vendor-dashboard', '/vendor-dashboard')}
        />
      </Suspense>
    );
  }

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
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Email</label>
                <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full border p-3 text-sm outline-none focus:border-[#0d2818] transition-colors" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-500 mb-1">Password</label>
                <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                  className="w-full border p-3 text-sm outline-none focus:border-[#0d2818] transition-colors" />
              </div>
              {adminError && <p className="text-red-500 text-xs text-center font-medium">{adminError}</p>}
              <button className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:opacity-90 transition-opacity">
                ENTER PANEL
              </button>
            </form>
            <button onClick={() => navigateTo('shop', '/')} className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline">
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
              <span className="text-xs opacity-70 hidden sm:inline">Logged in as {user.email}</span>
              <button onClick={() => navigateTo('shop', '/')} className="text-xs tracking-widest hover:underline bg-white/10 px-3 py-1 rounded">EXIT</button>
            </div>
          </div>
          <Admin />
        </div>
      </Suspense>
    );
  }

  if (currentView === 'retailer') {
    if (!user) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="bg-white p-8 max-w-md w-full shadow-lg text-center border-t-4 border-[#0d2818]">
            <Lock size={48} className="mx-auto mb-4 text-[#0d2818]" />
            <h1 className="text-xl font-light tracking-wide text-[#0d2818] mb-2">RETAILER ACCESS</h1>
            <p className="text-sm text-gray-600 mb-8">Please sign in to access your dashboard.</p>
            <button onClick={() => navigateTo('shop', '/')} className="w-full bg-[#0d2818] text-white py-3 text-xs tracking-widest hover:bg-opacity-90">
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
              <button onClick={() => navigateTo('shop', '/')} className="text-xs tracking-widest hover:underline bg-white/10 px-3 py-1 rounded">EXIT</button>
            </div>
          </div>
          <RetailerDashboard />
        </div>
      </Suspense>
    );
  }

  if (currentView === 'orders') {
    return (
      <Suspense fallback={<PageLoader />}>
        <OrderHistory
          onBack={() => navigateTo('shop', '/')}
          onRetryPayment={(orderId) => navigateToCheckout(orderId)}
        />
      </Suspense>
    );
  }

  if (currentView === 'checkout') {
    // Safety net for someone typing /checkout directly, or a session
    // expiring while they're sitting on this page — never render checkout
    // content for a signed-out user, even for a single frame. The redirect
    // itself is handled by the useEffect above; this just prevents a flash
    // of checkout content in the interim.
    if (!user) {
      return <PageLoader />;
    }
    return (
      <Suspense fallback={<PageLoader />}>
        <CheckoutPage
          items={cart}
          retryOrderId={retryOrderId}
          onBack={() => {
            setRetryOrderId(null);
            navigateTo(retryOrderId ? 'orders' : 'shop', retryOrderId ? '/orders' : '/');
          }}
          onSuccess={() => {
            clearCart();
            setRetryOrderId(null);
            navigateTo('orders', '/orders');
          }}
        />
      </Suspense>
    );
  }

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
          onNavigateToProduct={viewProduct}
          onNavigateToCheckout={() => navigateToCheckout()}
        />
      </Suspense>
    );
  }

  return (
    <>
      <PWAUpdatePrompt />

      {sessionTimedOut && (
        <SessionToast
          showSignIn={autoOpenAuth}
          onDismiss={() => setSessionTimedOut(false)}
        />
      )}
      <Home
        user={user}
        cart={cart}
        onAddToCart={p => addToCart(p, 1)}
        onUpdateQuantity={updateQuantity}
        onRemoveFromCart={removeFromCart}
        onClearCart={clearCart}
        onNavigateToOrders={() => navigateTo('orders', '/orders')}
        onNavigateToCheckout={navigateToCheckout}
        onNavigateToVendor={() => navigateTo('vendor-landing', '/become-a-vendor')}
        onViewProduct={viewProduct}
        onNavigateToPrivacy={() => navigateTo('legal-privacy', '/privacy-policy')}
        onNavigateToTerms={() => navigateTo('legal-terms', '/terms-conditions')}
        autoOpenAuth={autoOpenAuth}
        onAutoAuthHandled={() => setAutoOpenAuth(false)}
      />
    </>
  );
}

export default App;