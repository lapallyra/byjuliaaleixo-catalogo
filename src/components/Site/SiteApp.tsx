import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { EntryView } from '../EntryView';
import { HowToBuildKitView } from '../HowToBuildKitView';
import { GiftListHowItWorksView } from '../GiftListHowItWorksView';
import { CustomerFeedbackView } from '../CustomerFeedbackView';
import { ColecoesView } from '../ColecoesView';
import { KitsView } from '../KitsView';
import { KitConstructor } from '../KitConstructor';
import { AboutMeView } from '../AboutMeView';
import { GiftListInfoView } from '../GiftListInfoView';
import { GiftListView } from '../GiftListView';
import { CheckoutPage } from '../CheckoutPage';
import { OrderApprovalPage } from '../Approval/OrderApprovalPage';
import { TrackingView } from '../TrackingView';
import { MinhaExperienciaPage } from '../cliente/MinhaExperienciaPage';
import { DocumentSearch } from '../DocumentSearch';
import { StudioPage } from '../../studiomockup/pages/StudioPage';
import { Footer } from '../Footer';
import { BotaoVoltar } from '../BotaoVoltar';
import { SiteHeader } from './SiteHeader';
import { CustomerSocialProofToast } from '../CustomerSocialProofToast';
import { CompanyCatalogWrapper } from './CompanyCatalogWrapper';
import { GlobalSearchView } from '../GlobalSearchView';
import { LoadingScreen } from '../LoadingScreen';
import { CommemorativeCampaignPage } from '../CommemorativeCampaignPage';
import { PromotionalCampaignPage } from '../PromotionalCampaignPage';
import { PersonalizePage } from '../PersonalizePage';
import { INITIAL_CONFIG, PRODUCTS } from '../../constants';
import { AppConfig, Product, CompanyId, CartItem } from '../../types';
import { subscribeToAppConfig, subscribeToProducts } from '../../services/firebaseService';

export function SiteApp() {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [isProductsLoaded, setIsProductsLoaded] = useState(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const effectiveConfig = config || INITIAL_CONFIG;
  const location = useLocation();

  const isHomeOrCatalog = useMemo(() => {
    const path = location.pathname;
    return path === '/' || path.startsWith('/loja') || path.startsWith('/kits') || path.startsWith('/monte-seu-kit');
  }, [location.pathname]);

  const currentCompany = useMemo(() => {
    return 'madrinha' as CompanyId;
  }, []);

  useEffect(() => {
    const unsubConfig = subscribeToAppConfig((newConfig) => {
      if (newConfig && Object.keys(newConfig).length > 0) {
        setConfig(prev => ({ ...prev, ...newConfig }));
      }
      setIsConfigLoaded(true);
    });
    
    const unsubProducts = subscribeToProducts((loaded) => {
      if (loaded && loaded.length > 0) {
        setAllProducts(loaded);
      }
      setIsProductsLoaded(true);
    });

    // Safety fallback: ensure loading flags are set after 600ms even on slow networks
    const safetyTimer = setTimeout(() => {
      setIsConfigLoaded(true);
      setIsProductsLoaded(true);
    }, 600);

    return () => {
      unsubConfig();
      unsubProducts();
      clearTimeout(safetyTimer);
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

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

  const [unifiedFavorites, setUnifiedFavorites] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('unified_favorites_v2');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('unified_cart_v2', JSON.stringify(unifiedCart));
  }, [unifiedCart]);

  useEffect(() => {
    const handleCartUpdate = () => {
      try {
        const saved = localStorage.getItem('unified_cart_v2');
        if (saved) setUnifiedCart(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('cart-updated', handleCartUpdate);
    return () => window.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  useEffect(() => {
    localStorage.setItem('unified_gift_list_v2', JSON.stringify(unifiedGiftList));
  }, [unifiedGiftList]);

  useEffect(() => {
    localStorage.setItem('unified_favorites_v2', JSON.stringify(unifiedFavorites));
  }, [unifiedFavorites]);

  useEffect(() => {
    const handleGiftListUpdate = () => {
      try {
        const saved = localStorage.getItem('unified_gift_list_v2');
        if (saved) setUnifiedGiftList(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('giftlist-updated', handleGiftListUpdate);
    return () => window.removeEventListener('giftlist-updated', handleGiftListUpdate);
  }, []);

  const totalCartCount = useMemo(() => {
    return unifiedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }, [unifiedCart]);

  const isCustomerPortalRoute = [
    '/minha-experiencia', '/cliente', '/login', '/cadastro', '/perfil'
  ].some(route => location.pathname.startsWith(route));

  if (!isConfigLoaded || !isProductsLoaded) {
    return <LoadingScreen />;
  }

  if (isCustomerPortalRoute) {
    return (
      <div className="app-wrapper w-full min-h-screen bg-[#FDFCFA]">
        <Routes>
          <Route path="/minha-experiencia/*" element={<MinhaExperienciaPage />} />
          <Route path="/cliente/*" element={<MinhaExperienciaPage />} />
          <Route path="/login" element={<MinhaExperienciaPage />} />
          <Route path="/cadastro" element={<MinhaExperienciaPage />} />
          <Route path="/perfil" element={<MinhaExperienciaPage />} />
          <Route path="*" element={<Navigate to="/minha-experiencia" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="app-wrapper w-full flex flex-col items-stretch min-h-screen bg-[#FAF8F5]">
      <SiteHeader 
        onOpenSearch={() => setIsGlobalSearchOpen(true)} 
        cartCount={totalCartCount}
      />
      
      <div className="flex-grow flex flex-col relative">
        {location.pathname !== '/' && !location.pathname.startsWith('/loja') && (
          <div className="block">
            <BotaoVoltar variant="dark" />
          </div>
        )}
        
        <Routes>
          {/* 1. LANDINGPAGE (Entrada institucional / comercial permanente) */}
          <Route path="/" element={<EntryView config={effectiveConfig} allProducts={allProducts} onOpenSearch={() => setIsGlobalSearchOpen(true)} />} />
          
          {/* 2. LOJA (Catálogo completo de produtos disponíveis) */}
          <Route path="/loja" element={
            <CompanyCatalogWrapper 
              allProducts={allProducts} 
              companyId="madrinha" 
              config={effectiveConfig} 
              cart={unifiedCart} 
              setCart={setUnifiedCart} 
              giftList={unifiedGiftList} 
              setGiftList={setUnifiedGiftList} 
              favorites={unifiedFavorites} 
              setFavorites={setUnifiedFavorites} 
              onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)} 
            />
          } />
          
          {/* 3. LISTA DE PRESENTES (Área própria mantida e preservada) */}
          <Route path="/listadepresentes" element={<GiftListInfoView />} />
          <Route path="/consulta/:code" element={<GiftListView setCarts={setUnifiedCart} config={effectiveConfig} />} />
          <Route path="/comofunciona-lp" element={<GiftListHowItWorksView />} />

          {/* 4. MONTE SEU KIT (Área própria mantida e preservada) */}
          <Route path="/monte-seu-kit" element={<KitConstructor allProducts={allProducts} setCarts={setUnifiedCart} />} />
          <Route path="/kit-meukit" element={<Navigate to="/monte-seu-kit" replace />} />
          <Route path="/comomontar" element={<HowToBuildKitView />} />

          {/* 5. KIT PRONTO (Área própria mantida e preservada) */}
          <Route path="/kits" element={<KitsView allProducts={allProducts} setCarts={setUnifiedCart} />} />
          <Route path="/kits-prontos" element={<Navigate to="/kits" replace />} />

          {/* 6. CHECKOUT (Etapa final da compra preservada e funcional) */}
          <Route path="/checkout" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/checkout/:id" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/ped-:code" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/checkoutdois/:code" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/client-checkout/:code" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/approval/:code" element={<OrderApprovalPage />} />

          {/* Páginas Institucionais & Campanhas */}
          <Route path="/comemorativas/:slug" element={<CommemorativeCampaignPage allProducts={allProducts} />} />
          <Route path="/promocao/:slug" element={<PromotionalCampaignPage allProducts={allProducts} />} />
          <Route path="/feedclientes" element={<CustomerFeedbackView />} />
          <Route path="/colecoes" element={<ColecoesView allProducts={allProducts} />} />
          <Route path="/personalize" element={<PersonalizePage />} />
          <Route path="/sobrenos" element={<AboutMeView />} />
          <Route path="/rastreamento" element={<TrackingView onBack={() => window.history.back()} />} />
          <Route path="/document" element={<DocumentSearch onGoBack={() => window.history.back()} />} />
          <Route path="/studiomockup" element={<StudioPage />} />

          {/* Aliases e Redirecionamentos Suaves de Compatibilidade da Antiga Arquitetura */}
          <Route path="/vitrine" element={<Navigate to="/loja" replace />} />
          <Route path="/produtos" element={<Navigate to="/loja" replace />} />
          <Route path="/atelies" element={<Navigate to="/loja" replace />} />
          <Route path="/lapallyra" element={<Navigate to="/loja" replace />} />
          <Route path="/pallyra" element={<Navigate to="/loja" replace />} />
          <Route path="/comamorguennita" element={<Navigate to="/loja" replace />} />
          <Route path="/guennita" element={<Navigate to="/loja" replace />} />
          <Route path="/mimadasim" element={<Navigate to="/loja" replace />} />
          <Route path="/mimada" element={<Navigate to="/loja" replace />} />
          <Route path="/tuttymimo" element={<Navigate to="/loja" replace />} />
          <Route path="/tutty" element={<Navigate to="/loja" replace />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer config={effectiveConfig} />
      {isHomeOrCatalog && <CustomerSocialProofToast currentCompany={currentCompany} products={allProducts} />}
      
      <GlobalSearchView 
        isOpen={isGlobalSearchOpen} 
        onClose={() => setIsGlobalSearchOpen(false)} 
        allProducts={allProducts}
      />
    </div>
  );
}
