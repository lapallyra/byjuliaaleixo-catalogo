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
import { AteliersPresentationView } from './components/AteliersPresentationView';
import { AboutMeView } from './components/AboutMeView';
import { GiftListInfoView } from './components/GiftListInfoView';
import { ColecoesView } from './components/ColecoesView';
import { CookieBanner } from './components/CookieBanner';
import { SuggestionBox } from './components/SuggestionBox';
import { TrackingView } from './components/TrackingView';
import { INITIAL_CONFIG, PRODUCTS } from './constants';
import { AppConfig, CompanyId, CartItem, Product } from './types';
import { subscribeToAppConfig, subscribeToProducts } from './services/firebaseService';

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
function CompanyCatalogWrapper({ companyId, config, cart, setCart, giftList, setGiftList, allProducts }: { companyId: CompanyId, config: AppConfig, cart: CartItem[], setCart: any, giftList: Product[], setGiftList: any, allProducts: Product[] }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMPRoulette, setShowMPRoulette] = useState(false);
  const [mpPendingOrderData, setMpPendingOrderData] = useState<any>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleClearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

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
          
          setMpPendingOrderData(pendingOrder);
          setShowMPRoulette(true);
          
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
    setCart((prev: CartItem[]) => {
      const existing = prev.find(item => item.id === product.id);
      let updatedCart;
      if (existing) {
        updatedCart = prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      } else {
        updatedCart = [...prev, { ...product, quantity }];
      }
      return updatedCart;
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev: CartItem[]) => prev.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev: CartItem[]) => {
      const updatedCart = prev.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return updatedCart;
    });
  };

  const handleSetQuantity = (productId: string, quantity: number) => {
    setCart((prev: CartItem[]) => {
      const updatedCart = prev.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      }).filter(item => item.quantity > 0);
      return updatedCart;
    });
  };

  const handleAddToGiftList = (product: Product) => {
    setGiftList((prev: Product[]) => {
      if (prev.find(item => item.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const handleRemoveFromGiftList = (productId: string) => {
    setGiftList((prev: Product[]) => prev.filter(item => item.id !== productId));
  };

  return (
    <>
      <SalesNotificationPortal currentCompany={companyId} />
      <CatalogView
        companyId={companyId}
        config={config}
        allProducts={allProducts}
        cart={cart}
        giftList={giftList}
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
          onContinue={() => {
            setShowSuccess(false);
            handleClearCart();
          }} 
        />
      )}
      {showMPRoulette && mpPendingOrderData && (
        <PrizeRouletteModal 
          isOpen={showMPRoulette}
          onClose={async () => {
            setShowMPRoulette(false);
            setShowSuccess(true);
            try {
              const url = await sendNotifications(mpPendingOrderData.config || config, mpPendingOrderData.cart, mpPendingOrderData.formData, mpPendingOrderData.total, mpPendingOrderData.companyName);
              if (url) {
                setTimeout(() => window.open(url, '_blank'), 1500);
              }
            } catch(e) {
              console.error("Error generating whatsapp after MP roulette close", e);
            }
          }}
          onResult={async (prize) => {
            try {
              if (mpPendingOrderData.orderId) {
                await updateOrder(mpPendingOrderData.orderId, { giftInfo: prize });
              }
              if (mpPendingOrderData.formData) {
                mpPendingOrderData.formData.wonPrize = prize;
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

  const [unifiedCart, setUnifiedCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('unified_cart_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unifiedGiftList, setUnifiedGiftList] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('unified_gift_list_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('unified_cart_v2', JSON.stringify(unifiedCart));
  }, [unifiedCart]);

  useEffect(() => {
    localStorage.setItem('unified_gift_list_v2', JSON.stringify(unifiedGiftList));
  }, [unifiedGiftList]);

  return (
    <SparklesContainer>
      <CookieBanner />
      <Routes>
        <Route path="/" element={<EntryView config={config} allProducts={allProducts} />} />
        
        <Route path="/atelies" element={<AteliersPresentationView />} />
        <Route path="/colecoes" element={<ColecoesView allProducts={allProducts} />} />
        <Route path="/sobrenos" element={<AboutMeView />} />
        <Route path="/listadepresentes-info" element={<GiftListInfoView />} />
        
        <Route path="/lapallyra" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="pallyra" config={config} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} />} />
        <Route path="/lapallyra/admin" element={<Navigate to="/admin" replace />} />
        
        <Route path="/comamorguennita" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="guennita" config={config} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} />} />
        <Route path="/comamorguennita/admin" element={<Navigate to="/admin" replace />} />
        
        <Route path="/mimadasim" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="mimada" config={config} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} />} />
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
        
        {/* Tracking */}
        <Route path="/rastreamento" element={<TrackingView onBack={() => window.history.back()} />} />
        
        {/* Gift List View */}
        <Route path="/listadepresentes/:code" element={<GiftListView setCarts={setUnifiedCart} config={config} />} />
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
