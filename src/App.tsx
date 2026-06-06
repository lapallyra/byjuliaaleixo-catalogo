import { MockupStudio } from './components/MockupStudio';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Outlet, useLocation, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { EntryView } from './components/EntryView';
import { CatalogView } from './components/CatalogView';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLoginView } from './components/AdminLoginView';
import { SuccessOverlay } from './components/SuccessOverlay';
import { SalesNotificationPortal } from './components/SalesNotificationPortal';
import { AuthProvider } from './components/AuthProvider';
import { DocumentSearch } from './components/DocumentSearch';
import { GiftListView } from './components/GiftListView';
import { CookieBanner } from './components/CookieBanner';
import { SuggestionBox } from './components/SuggestionBox';
import { INITIAL_CONFIG, PRODUCTS } from './constants';
import { AppConfig, CompanyId, CartItem, Product } from './types';
import { subscribeToAppConfig, subscribeToProducts } from './services/firebaseService';
import PremiumCheckout from './components/PremiumCheckout';
import { PrizeRouletteModal } from './components/PrizeRouletteModal';
import { sendNotifications } from './services/notificationService';
import { updateOrder } from './services/firebaseService';
function SparklesContainer({ children }: { children: React.ReactNode }) {
  const createSparkles = (e: React.MouseEvent) => {
    // Soft glow element that follows cursor exactly (throttled)
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
    document.body.appendChild(glow);
    setTimeout(() => glow.remove(), 400);

    // Denser sparkles
    for(let i = 0; i < 8; i++) {
        if (Math.random() > 0.3) continue;
        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        
        const offsetX = (Math.random() - 0.5) * 80;
        const offsetY = (Math.random() - 0.5) * 80;
        
        sparkle.style.left = `${e.clientX + offsetX}px`;
        sparkle.style.top = `${e.clientY + offsetY}px`;
        
        const scale = Math.random() * 0.7 + 0.3;
        sparkle.style.transform = `translate(-50%, -50%) scale(${scale})`;
        
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 800);
    }
  };

  return <div className="app-wrapper w-full flex flex-col items-stretch min-h-[100dvh]" onMouseMove={createSparkles}>{children}</div>;
}

// Wrapper to handle company paths
function CompanyCatalogWrapper({ companyId, config, carts, setCart, giftLists, setGiftLists, allProducts }: { companyId: CompanyId, config: AppConfig, carts: Record<string, CartItem[]>, setCart: any, giftLists: Record<string, Product[]>, setGiftLists: any, allProducts: Product[] }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMPRoulette, setShowMPRoulette] = useState(false);
  const [mpPendingOrderData, setMpPendingOrderData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleClearCart = useCallback(() => {
    setCart((prev: Record<string, CartItem[]>) => ({ ...prev, [companyId]: [] }));
  }, [setCart, companyId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const paymentStatus = params.get('collection_status') || params.get('payment_status') || params.get('status');
    const orderId = params.get('external_reference') || params.get('preference_id');
    const pendingOrderStr = localStorage.getItem('mp_pending_order');
    
    if (paymentStatus === 'approved' && pendingOrderStr) {
      try {
        const pendingOrder = JSON.parse(pendingOrderStr);
        // We ensure it belongs to the current session.
        if (pendingOrder && pendingOrder.companyName) {
          console.log("Mercado Pago payment OK. Resuming flow...");
          handleClearCart();
          
          if (pendingOrder.total >= 300) {
            setMpPendingOrderData(pendingOrder);
            setShowMPRoulette(true);
          } else {
            setShowSuccess(true);
            sendNotifications(pendingOrder.config || config, pendingOrder.cart, pendingOrder.formData, pendingOrder.total, pendingOrder.companyName).then(url => {
              if (url) {
                setTimeout(() => window.open(url, '_blank'), 1500);
              }
            });
          }
          
          localStorage.removeItem('mp_pending_order');
          // cleanup URL params
          navigate(location.pathname, { replace: true });
        }
      } catch(e) {
        console.error("Error parsing mp_pending_order", e);
      }
    }
  }, [location.search, config, navigate, location.pathname, handleClearCart]);
  
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart((prev: Record<string, CartItem[]>) => {
      const companyCart = prev[companyId] || [];
      const existing = companyCart.find(item => item.id === product.id);
      let updatedCart;
      if (existing) {
        updatedCart = companyCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
        updatedCart = [...companyCart, { ...product, quantity }];
      }
      return { ...prev, [companyId]: updatedCart };
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev: Record<string, CartItem[]>) => {
      const companyCart = prev[companyId] || [];
      return { ...prev, [companyId]: companyCart.filter(item => item.id !== productId) };
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev: Record<string, CartItem[]>) => {
      const companyCart = prev[companyId] || [];
      const updatedCart = companyCart.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return { ...prev, [companyId]: updatedCart };
    });
  };

  const handleSetQuantity = (productId: string, quantity: number) => {
    setCart((prev: Record<string, CartItem[]>) => {
      const companyCart = prev[companyId] || [];
      const updatedCart = companyCart.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return { ...prev, [companyId]: updatedCart };
    });
  };

  const handleAddToGiftList = (product: Product) => {
    setGiftLists((prev: Record<string, Product[]>) => {
      const companyList = prev[companyId] || [];
      if (companyList.find(item => item.id === product.id)) return prev;
      return { ...prev, [companyId]: [...companyList, product] };
    });
  };

  const handleRemoveFromGiftList = (productId: string) => {
    setGiftLists((prev: Record<string, Product[]>) => {
      const companyList = prev[companyId] || [];
      return { ...prev, [companyId]: companyList.filter(item => item.id !== productId) };
    });
  };

  return (
    <>
      <SalesNotificationPortal currentCompany={companyId} />
      <CatalogView
        companyId={companyId}
        config={config}
        allProducts={allProducts}
        cart={carts[companyId] || []}
        giftList={giftLists[companyId] || []}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateQuantity}
        onSetQuantity={handleSetQuantity}
        onAddToGiftList={handleAddToGiftList}
        onRemoveFromGiftList={handleRemoveFromGiftList}
        onGoBack={() => {
          navigate('/');
        }}
        onCheckoutComplete={() => setShowSuccess(true)}
        onOpenAdmin={() => navigate('/admin')}
      />
      {showSuccess && (
        <SuccessOverlay 
          company={companyId} 
          onContinue={() => {
            setShowSuccess(false);
            handleClearCart();
          }} 
        />
      )}
      {showMPRoulette && mpPendingOrderData && (
        <PrizeRouletteModal 
          isOpen={showMPRoulette}
          onClose={() => {
            setShowMPRoulette(false);
            setShowSuccess(true);
            // Send whatsapp without prize or just close
          }}
          onResult={async (prize) => {
            setShowMPRoulette(false);
            setShowSuccess(true);
            try {
              if (mpPendingOrderData.orderId) {
                await updateOrder(mpPendingOrderData.orderId, { giftInfo: prize });
              }
              const url = await sendNotifications(mpPendingOrderData.config || config, mpPendingOrderData.cart, { ...mpPendingOrderData.formData, wonPrize: prize }, mpPendingOrderData.total, mpPendingOrderData.companyName);
              if (url) {
                setTimeout(() => window.open(url, '_blank'), 1500);
              }
            } catch(e) {
              console.error("Error generating whatsapp after MP roulette", e);
            }
          }}
          prizes={mpPendingOrderData.config?.roulette_prizes || []}
          theme={{ accentColor: mpPendingOrderData.config?.theme?.primary_color || '#000000' }}
        />
      )}
    </>
  );
}

function MainApp() {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS); // Start with static, then sync
  
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const unsubConfig = subscribeToAppConfig((newConfig) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    });
    
    // Subscribe to all products once at app level
    const unsubProducts = subscribeToProducts((loaded) => {
      if (loaded.length > 0) setAllProducts(loaded);
    });

    return () => {
      unsubConfig();
      unsubProducts();
    };
  }, []);

  const [carts, setCarts] = useState<Record<string, CartItem[]>>({
    'pallyra': [],
    'guennita': [],
    'mimada': []
  });
  const [giftLists, setGiftLists] = useState<Record<string, Product[]>>({
    'pallyra': [],
    'guennita': [],
    'mimada': []
  });

  return (
    <SparklesContainer>
      <CookieBanner />
      <Routes>
        <Route
  path="/mockup-studio"
  element={
    <ProtectedRoute>
      <MockupStudio />
    </ProtectedRoute>
  }
/>  
        <Route path="/" element={<EntryView config={config} />} />
        <Route path="/lapallyra" element={<CompanyCatalogWrapper allProducts={allProducts.filter(p => p.company === 'pallyra')} companyId="pallyra" config={config} carts={carts} setCart={setCarts} giftLists={giftLists} setGiftLists={setGiftLists} />} />
        <Route path="/lapallyra/admin" element={<Navigate to="/admin" replace />} />
        
        <Route path="/comamorguennita" element={<CompanyCatalogWrapper allProducts={allProducts.filter(p => p.company === 'guennita')} companyId="guennita" config={config} carts={carts} setCart={setCarts} giftLists={giftLists} setGiftLists={setGiftLists} />} />
        <Route path="/comamorguennita/admin" element={<Navigate to="/admin" replace />} />
        
        <Route path="/mimadasim" element={<CompanyCatalogWrapper allProducts={allProducts.filter(p => p.company === 'mimada')} companyId="mimada" config={config} carts={carts} setCart={setCarts} giftLists={giftLists} setGiftLists={setGiftLists} />} />
        <Route path="/mimadasim/admin" element={<Navigate to="/admin" replace />} />

        {/* Short Aliases */}
        <Route path="/mimada" element={<Navigate to="/mimadasim" replace />} />
        <Route path="/guennita" element={<Navigate to="/comamorguennita" replace />} />
        <Route path="/pallyra" element={<Navigate to="/lapallyra" replace />} />

        {/* Global Admin */}
        <Route path="/admin/login" element={<AdminLoginView />} />
        <Route path="/admin" element={
          <ProtectedRoute>
            <ErrorBoundary fallback={
              <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-rose-500/10 rounded-[2rem] flex items-center justify-center mb-6 border border-rose-500/20">
                  <span className="text-4xl">⚠️</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter italic">Erro no Painel</h1>
                <p className="text-slate-400 mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
                  Ocorreu um erro crítico ao carregar o painel administrativo. Por favor, recarregue a página.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-white text-black font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all uppercase tracking-widest text-[10px]"
                >
                  Recarregar Página
                </button>
              </div>
            }>
              <AdminDashboard onGoBack={() => window.history.back()} />
            </ErrorBoundary>
          </ProtectedRoute>
        } />
        
        {/* Document Search */}
        <Route path="/document" element={<DocumentSearch onGoBack={() => window.history.back()} />} />
        
        {/* Gift List View */}
        <Route path="/listadepresentes/:code" element={<GiftListView setCarts={setCarts} config={config} />} />
      <Route path="/checkout-premium" element={<PremiumCheckout />} />
      </Routes>
    </SparklesContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </AuthProvider>
  );
}
