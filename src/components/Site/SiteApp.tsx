import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { EntryView } from '../EntryView';
import { VitrinePage } from '../VitrinePage';
import { AteliersPresentationView } from '../AteliersPresentationView';
import { ColecoesView } from '../ColecoesView';
import { KitsView } from '../KitsView';
import { KitConstructor } from '../KitConstructor';
import { AboutMeView } from '../AboutMeView';
import { GiftListInfoView } from '../GiftListInfoView';
import { GiftListView } from '../GiftListView';
import { CheckoutPage } from '../CheckoutPage';
import { OrderApprovalPage } from '../Approval/OrderApprovalPage';
import { ClientCheckout } from '../Checkout/ClientCheckout';
import { TrackingView } from '../TrackingView';
import { MinhaExperienciaPage } from '../cliente/MinhaExperienciaPage';
import { DocumentSearch } from '../DocumentSearch';
import { StudioPage } from '../../studiomockup/pages/StudioPage';
import { TopAnnouncementBar } from '../TopAnnouncementBar';
import { Footer } from '../Footer';
import { CustomerSocialProofToast } from '../CustomerSocialProofToast';
import { CompanyCatalogWrapper } from './CompanyCatalogWrapper';
import { CommemorativeCampaignPage } from '../CommemorativeCampaignPage';
import { INITIAL_CONFIG, PRODUCTS } from '../../constants';
import { AppConfig, Product, CompanyId, CartItem } from '../../types';
import { subscribeToAppConfig, subscribeToProducts } from '../../services/firebaseService';

export function SiteApp() {
  const [config, setConfig] = useState<AppConfig>(INITIAL_CONFIG);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const effectiveConfig = config || INITIAL_CONFIG;
  const location = useLocation();

  const isHomeOrCatalog = useMemo(() => {
    const path = location.pathname;
    if (path === '/') return true;
    const catalogs = ['/lapallyra', '/pallyra', '/comamorguennita', '/guennita', '/mimadasim', '/mimada', '/tuttymimo', '/tutty'];
    return catalogs.some(c => path.startsWith(c));
  }, [location.pathname]);

  const currentCompany = useMemo(() => {
    const path = location.pathname;
    if (path.startsWith('/lapallyra') || path.startsWith('/pallyra')) return 'pallyra' as CompanyId;
    if (path.startsWith('/comamorguennita') || path.startsWith('/guennita')) return 'guennita' as CompanyId;
    if (path.startsWith('/mimadasim') || path.startsWith('/mimada')) return 'mimada' as CompanyId;
    if (path.startsWith('/tuttymimo') || path.startsWith('/tutty')) return 'tuttymimo' as CompanyId;
    if (path === '/') return 'pallyra' as CompanyId;
    return null;
  }, [location.pathname]);

  useEffect(() => {
    const unsubConfig = subscribeToAppConfig((newConfig) => {
      setConfig(prev => ({ ...prev, ...newConfig }));
    });
    
    const unsubProducts = subscribeToProducts((loaded) => {
      if (loaded.length > 0) setAllProducts(loaded);
    });

    return () => {
      unsubConfig();
      unsubProducts();
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

  return (
    <div className="app-wrapper w-full flex flex-col items-stretch min-h-screen neumo-bg">
      <TopAnnouncementBar />
      <div className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<EntryView config={effectiveConfig} allProducts={allProducts} />} />
          <Route path="/comemorativas/:slug" element={<CommemorativeCampaignPage allProducts={allProducts} />} />
          <Route path="/vitrine" element={<VitrinePage />} />
          <Route path="/atelies" element={<AteliersPresentationView />} />
          <Route path="/colecoes" element={<ColecoesView allProducts={allProducts} />} />
          <Route path="/kits" element={<KitsView allProducts={allProducts} setCarts={setUnifiedCart} />} />
          <Route path="/kit-meukit" element={<KitConstructor allProducts={allProducts} setCarts={setUnifiedCart} />} />
          <Route path="/sobrenos" element={<AboutMeView />} />
          <Route path="/listadepresentes-info" element={<GiftListInfoView />} />
          <Route path="/listadepresentes/:code" element={<GiftListView setCarts={setUnifiedCart} config={effectiveConfig} />} />
          
          <Route path="/lapallyra" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="pallyra" config={effectiveConfig} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} favorites={unifiedFavorites} setFavorites={setUnifiedFavorites} />} />
          <Route path="/comamorguennita" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="guennita" config={effectiveConfig} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} favorites={unifiedFavorites} setFavorites={setUnifiedFavorites} />} />
          <Route path="/mimadasim" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="mimada" config={effectiveConfig} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} favorites={unifiedFavorites} setFavorites={setUnifiedFavorites} />} />
          <Route path="/tuttymimo" element={<CompanyCatalogWrapper allProducts={allProducts} companyId="tuttymimo" config={effectiveConfig} cart={unifiedCart} setCart={setUnifiedCart} giftList={unifiedGiftList} setGiftList={setUnifiedGiftList} favorites={unifiedFavorites} setFavorites={setUnifiedFavorites} />} />
          
          <Route path="/mimada" element={<Navigate to="/mimadasim" replace />} />
          <Route path="/guennita" element={<Navigate to="/comamorguennita" replace />} />
          <Route path="/pallyra" element={<Navigate to="/lapallyra" replace />} />
          <Route path="/tutty" element={<Navigate to="/tuttymimo" replace />} />
          
          <Route path="/checkout/:id" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/ped-:code" element={<CheckoutPage config={effectiveConfig} />} />
          <Route path="/approval/:code" element={<OrderApprovalPage />} />
          <Route path="/client-checkout/:code" element={<ClientCheckout />} />
          <Route path="/rastreamento" element={<TrackingView onBack={() => window.history.back()} />} />
          <Route path="/minha-experiencia/*" element={<MinhaExperienciaPage />} />
          <Route path="/document" element={<DocumentSearch onGoBack={() => window.history.back()} />} />
          <Route path="/studiomockup" element={<StudioPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer config={effectiveConfig} />
      {isHomeOrCatalog && <CustomerSocialProofToast currentCompany={currentCompany} products={allProducts} />}
    </div>
  );
}
