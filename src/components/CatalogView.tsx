import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  ShoppingCart, 
  Package, 
  ChevronLeft, 
  ChevronRight,
  X,
  Sparkle,
  Diamond,
  Heart,
  Flower2,
  Stamp,
  Briefcase,
  ShoppingBasket,
  Coffee,
  Palette,
  LayoutGrid,
  Database,
  LogIn,
  Flame,
  Star,
  TrendingUp,
  Sparkles,
  Gift,
  Share2,
  MessageCircle,
  MessageSquare,
  Wand2,
  Loader2
} from 'lucide-react';
import { CompanyId, AppConfig, Product, CartItem, SiteSettings } from '../types';
import { CartSidebar } from './CartSidebar';
import { GiftListSidebar } from './GiftListSidebar';
import { SuggestionBox } from './SuggestionBox';
import { ProductDetailModal } from './ProductDetailModal';

import { CatalogHeader } from './Catalog/CatalogHeader';
import { CatalogInfoBar } from './Catalog/CatalogInfoBar';
import { DateHighlights } from './Catalog/DateHighlights';
import { FeaturedProductsCarousel } from './Catalog/FeaturedProductsCarousel';
import { PriceDisplay } from './ui/PriceDisplay';
import { saveSale, subscribeToProducts, addProduct, getSiteSettings, getGiftList } from '../services/firebaseService';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { PRODUCTS, INITIAL_CONFIG } from '../constants';
import { useAuth } from './AuthProvider';
import { login } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { themes } from '../lib/theme';
import { formatCurrency } from '../lib/currencyUtils';
import { ImageWithFallback } from './ImageWithFallback';

interface CatalogViewProps {
  companyId: CompanyId;
  config: AppConfig;
  allProducts: Product[]; // Keep for initial/fallback, but we'll use state
  cart: CartItem[];
  giftList: Product[];
  onAddToCart: (product: Product, quantity?: number) => void;
  onRemoveFromCart: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, quantity: number) => void;
  onAddToGiftList: (product: Product) => void;
  onRemoveFromGiftList: (id: string) => void;
  onGoBack: () => void;
  onCheckoutComplete: () => void;
  onOpenAdmin: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  companyId,
  config,
  allProducts,
  cart,
  giftList,
  onAddToCart,
  onRemoveFromCart,
  onUpdateQuantity,
  onSetQuantity,
  onAddToGiftList,
  onRemoveFromGiftList,
  onGoBack,
  onCheckoutComplete,
  onOpenAdmin
}) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const theme = themes[companyId] || themes['pallyra'];
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const highlights = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay()); // go back to Sunday
    const weekSeed = d.getTime();

    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const sortedProducts = [...allProducts].sort((a,b) => (a.id || '').localeCompare(b.id || '')); 
    
    const lowTicket = sortedProducts.filter(p => p.retail_price < 100);
    const midTicket = sortedProducts.filter(p => p.retail_price >= 100 && p.retail_price < 200);
    const highTicket = sortedProducts.filter(p => p.retail_price >= 200);

    const pickRandom = (arr: Product[], count: number, startSeed: number) => {
      if (arr.length === 0) return [];
      const result = [];
      let currentSeed = startSeed;
      const pool = [...arr];
      for(let i=0; i<count; i++) {
        if (pool.length === 0) break;
        const index = Math.floor(seededRandom(currentSeed) * pool.length);
        result.push(pool[index]);
        pool.splice(index, 1);
        currentSeed++;
      }
      return result;
    }

    const hl = [
      ...pickRandom(lowTicket.length > 0 ? lowTicket : sortedProducts, 1, weekSeed),
      ...pickRandom(midTicket.length > 0 ? midTicket : sortedProducts, 2, weekSeed + 10),
      ...pickRandom(highTicket.length > 0 ? highTicket : sortedProducts, 2, weekSeed + 20)
    ].slice(0, 5);
    
    const uniqueHl = [];
    const seenIds = new Set();
    for (const p of hl) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueHl.push(p);
      }
    }
    
    // If we don't have enough unique highlights, fill from sortedProducts
    let currentSeed = weekSeed + 100;
    while (uniqueHl.length < 5 && uniqueHl.length < sortedProducts.length) {
      const idx = Math.floor(seededRandom(currentSeed) * sortedProducts.length);
      const p = sortedProducts[idx];
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueHl.push(p);
      }
      currentSeed++;
    }
    
    return uniqueHl;
  }, [allProducts]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGiftListOpen, setIsGiftListOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReadOnlyProduct, setIsReadOnlyProduct] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDirectCheckoutLoading, setIsDirectCheckoutLoading] = useState(false);

  const handleDirectCheckout = async (email: string) => {
    if (cart.length === 0) return;
    setIsDirectCheckoutLoading(true);
    
    try {
      const subtotal = cart.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
      const total = subtotal;

      console.log("Saving initial sale...");
      const docId = await saveSale({
        customerName: email.split('@')[0],
        customerEmail: email,
        customerCpfCnpj: "",
        contact: email,
        total,
        companyId,
        items: cart.map(item => ({
          ...item,
          productId: item.id || '',
          product_name: item.product_name || '',
          quantity: item.quantity || 1,
          retail_price: item.retail_price || 0,
          insumos: item.insumos || []
        })),
        isWholesale: false, // Could check if min qty met but to keep simple we assume false unless explicitly handled
        deliveryType: 'delivery',
        deliveryDate: "Agendar",
        isEmergency: false,
        paymentMethod: 'mercadopago',
        source: 'catalog',
        observations: `Pagamento via MP Direto - ${email}`
      });

      const savedOrderCode = docId || crypto.randomUUID();
      
      console.log('Calling createPreference');
      const mpItems = cart.map(item => ({
        title: String(item.product_name || "Item"),
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.retail_price) || 0,
        currency_id: 'BRL'
      }));

      const preferencePayload = {
        orderId: savedOrderCode,
        companyId: companyId,
        items: mpItems,
        payer: {
          name: email.split('@')[0],
          email: email
        },
        back_urls: {
          success: `${window.location.origin}${window.location.pathname}?payment_status=approved&order_id=${savedOrderCode}`,
          failure: `${window.location.origin}${window.location.pathname}?payment_status=failed&order_id=${savedOrderCode}`,
          pending: `${window.location.origin}${window.location.pathname}?payment_status=pending&order_id=${savedOrderCode}`
        },
        auto_return: "approved"
      };

      console.log('Fetching /api/createPreference...');
      const response = await fetch('/api/createPreference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencePayload)
      });
      
      if (!response.ok) {
        let errorData;
        try {
           errorData = await response.json();
        } catch(e) {
           errorData = await response.text();
        }
        throw new Error(errorData.error || response.statusText);
      }

      const data = await response.json();
      let initPoint = data?.init_point || 
                        data?.url || 
                        data?.body?.init_point || 
                        data?.response?.init_point ||
                        (typeof data === 'string' && data.startsWith('http') ? data : null);
      
      const preferenceId = data?.id || null;
      if (!initPoint && preferenceId) {
         initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
      }

      if (initPoint) {
         console.log('Redirecting to Mercado Pago:', initPoint);
         
         localStorage.setItem('mp_pending_order', JSON.stringify({
            orderId: savedOrderCode,
            cart,
            total,
            companyName,
            config: siteSettings
         }));
         
         window.dispatchEvent(new CustomEvent('clear-cart'));
         window.location.href = initPoint;
      } else {
         throw new Error("init_point não retornado pelo MP.");
      }
    } catch (e: any) {
      console.error("Direct Checkout Error:", e);
      alert(`Falha ao ir para o pagamento: ${e.message || "Erro desconhecido"}`);
      setIsDirectCheckoutLoading(false);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const highlightsScrollRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startScrolling = (direction: 'left' | 'right') => {
    if (scrollIntervalRef.current) return;
    scrollIntervalRef.current = setInterval(() => {
      if (highlightsScrollRef.current) {
        highlightsScrollRef.current.scrollBy({
          left: direction === 'right' ? 5 : -5,
          behavior: 'auto'
        });
      }
    }, 10);
  };

  const stopScrolling = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const [searchedGiftList, setSearchedGiftList] = useState<any | null>(null);
  const [isSearchingList, setIsSearchingList] = useState(false);
  const [listSearchCode, setListSearchCode] = useState('');
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'gift' } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleListSearch = async () => {
    if (!listSearchCode || listSearchCode.length < 5) return;
    setIsSearchingLoading(true);
    try {
      const code = listSearchCode.trim().toUpperCase();
      const list = await getGiftList(code);
      if (list) {
        setIsSearchingList(false);
        setListSearchCode('');
        window.location.href = `/listadepresentes/${list.code}`;
      } else {
        alert("Lista não encontrada. Verifique o código.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingLoading(false);
    }
  };

  // Dynamic Theme Injection
  useEffect(() => {
    if (!siteSettings) return;
    
    const root = document.documentElement;
    const prefix = companyId === 'mimada' ? 'mimadasim' : companyId === 'pallyra' ? 'lapallyra' : 'guennita';
    
    if (siteSettings.theme_primary_color) root.style.setProperty(`--theme-primary-${prefix}`, siteSettings.theme_primary_color);
    if (siteSettings.theme_accent_color) root.style.setProperty(`--theme-accent-${prefix}`, siteSettings.theme_accent_color);
    if (siteSettings.theme_text_color) root.style.setProperty(`--theme-text-${prefix}`, siteSettings.theme_text_color);
    
    // Inject global variables for usage in tailwind or inline styles
    root.style.setProperty('--dynamic-accent', siteSettings.theme_accent_color || theme.accentColor);
    root.style.setProperty('--dynamic-primary', siteSettings.theme_primary_color || theme.primaryColor);
    root.style.setProperty('--dynamic-text', siteSettings.theme_text_color || theme.textPrimary);
    
    // Mimada Sim special case injection
    if (companyId === 'mimada') {
      root.style.setProperty('--theme-mimada-pink', '#FF007F');
    }
  }, [siteSettings, companyId, theme]);

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    
    // Check for gift list code
    if (val.length >= 7 && val.toUpperCase().startsWith('L') && val.toUpperCase().endsWith('P')) {
      const list = await getGiftList(val.toUpperCase());
      if (list) {
        setSearchedGiftList(list);
      }
    }
  };

  const handleBuyNow = (product: Product, quantity: number) => {
    onAddToCart(product, quantity);
    setIsCartOpen(true);
    setSelectedProduct(null);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: companyName,
          text: 'Confira nosso catálogo de produtos!',
          url: url
        });
      } catch (err) {
        console.error('Erro ao compartilhar', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('Link copiado para a área de transferência!');
    }
  };

  const handleHiddenAdminClick = () => {
    if (isAdmin) {
      onOpenAdmin();
      return;
    }
    const next = adminClickCount + 1;
    if (next >= 5) {
      onOpenAdmin();
      setAdminClickCount(0);
    } else {
      setAdminClickCount(next);
    }
  };

  const createSparkles = (e: React.MouseEvent) => {
    const pixieChars = ['✦', '✧', '•', '⋆'];
    const accentColor = siteSettings?.theme_accent_color || theme.accentColor;
    
    for (let i = 0; i < 4; i++) {
      setTimeout(() => {
        const pixie = document.createElement('div');
        pixie.className = 'pixie-dust';
        pixie.innerHTML = pixieChars[Math.floor(Math.random() * pixieChars.length)];
        
        const size = Math.random() * 10 + 5;
        pixie.style.fontSize = `${size}px`;
        pixie.style.left = `${e.clientX + (Math.random() - 0.5) * 20}px`;
        pixie.style.top = `${e.clientY + (Math.random() - 0.5) * 20}px`;
        pixie.style.color = accentColor;
        pixie.style.position = 'fixed';
        pixie.style.pointerEvents = 'none';
        pixie.style.zIndex = '100000';
        pixie.style.filter = `drop-shadow(0 0 5px ${accentColor}88)`;
        
        pixie.style.setProperty('--dx', `${(Math.random() - 0.5) * 100}px`);
        pixie.style.setProperty('--dy', `${(Math.random() - 0.5) * 100}px`);
        
        document.body.appendChild(pixie);
        setTimeout(() => pixie.remove(), 800);
      }, i * 50);
    }
  };

  useEffect(() => {
    // Force allow scroll
    document.body.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSiteSettings(companyId);
      if (data) setSiteSettings(data);
    };
    loadSettings();
  }, [companyId]);

  const seedDatabase = async () => {
    if (!isAdmin || isSeeding) return;
    setIsSeeding(true);
    try {
      const productsToSeed = PRODUCTS;
      for (const p of productsToSeed) {
        await addProduct(p);
      }
      alert('Produtos sincronizados com sucesso!');
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      alert('Erro ao sincronizar produtos.');
    } finally {
      setIsSeeding(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      'Papelaria': Stamp,
      'Corporativo': Briefcase,
      'Decoração': Palette,
      'Home Decor': Flower2,
      'Luxo': Diamond,
      'Beleza': Sparkle,
      'Fashion': ShoppingBasket,
      'Acessórios': Heart,
      'Utensílios': Coffee,
    };
    const Icon = icons[category] || Sparkle;
    return <Icon size={14} className="opacity-70" />;
  };

  const companyName = companyId === 'pallyra' ? config.company_1_name : companyId === 'guennita' ? config.company_2_name : config.company_3_name;
  const defaultLogo = companyId === 'pallyra' ? config.company_1_logo : companyId === 'guennita' ? config.company_2_logo : config.company_3_logo;
  
  const categories = useMemo(() => {
    return Array.from(new Set(allProducts.map(p => p.category))).sort();
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allProducts, selectedCategory, searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const isPallyra = companyId === 'pallyra';

  const cartTotal = cart.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);

  const renderProductImage = (image: string | undefined | null, className: string = "", transform?: any) => {
    return (
      <ImageWithFallback 
        src={image || ''} 
        alt="Product"
        className={`${className} object-cover w-full h-full`}
        containerClassName="w-full h-full absolute inset-0"
      />
    );
  };

  return (
    <div 
      className={`min-h-[100dvh] pt-0 ${theme.bg} flex flex-col relative theme-${companyId === 'mimada' ? 'mimadasim' : companyId === 'pallyra' ? 'lapallyra' : 'guennita'}`}
    >
      {/* New Header */}
      <CatalogHeader 
        companyName={companyName}
        logoUrl={siteSettings?.store_logo || defaultLogo || null}
        theme={theme}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onSearch={handleSearch}
        onGoBack={onGoBack}
        onGiftListClick={() => setIsSearchingList(true)}
        giftListCount={giftList.length} 
        companyId={companyId}
        onLogoClick={handleHiddenAdminClick}
      />
      
      <div className="pt-0"> 
        {/* Editorial Hero Section for Pallyra */}



        <div className="max-w-[1600px] mx-auto px-4 mt-1">
           <CatalogInfoBar theme={theme} />
        </div>

        <DateHighlights theme={theme} companyId={companyId} />

        <FeaturedProductsCarousel 
          products={allProducts.filter(p => p.isFeatured)} 
          theme={theme} 
          companyId={companyId}
          onSelectProduct={(product) => setSelectedProduct(product)}
        />

        {/* Horizontal Category Menu - Unified Premium Design */}
        <div className={`sticky top-0 z-[100] ${theme.bg} border-b ${theme.borderLine} shadow-sm backdrop-blur-xl bg-opacity-90`}>
          <div className="max-w-[1600px] mx-auto px-4">
            <div className="flex items-center gap-8 py-5 overflow-x-auto scrollbar-none snap-x h-16">
              <button
                onClick={() => { setSelectedCategory(null); setCurrentPage(1); }}
                className={`flex-shrink-0 text-[11px] font-sans font-black uppercase tracking-[0.3em] transition-all relative pb-2`}
                style={{ 
                  color: !selectedCategory ? theme.accentColor : theme.textPrimary.replace('text-', ''),
                  opacity: !selectedCategory ? 1 : 0.4
                }}
              >
                Início
                {!selectedCategory && (
                  <motion.div layoutId="cat-glow" className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: theme.accentColor, boxShadow: `0 0 10px ${theme.accentColor}` }} />
                )}
              </button>
              {categories.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={`cat-${category}`}
                    onClick={() => { setSelectedCategory(category); setCurrentPage(1); }}
                    className={`flex-shrink-0 text-[11px] font-sans font-black uppercase tracking-[0.3em] transition-all relative pb-2`}
                    style={{ 
                      color: isActive ? theme.accentColor : theme.textPrimary.replace('text-', ''),
                      opacity: isActive ? 1 : 0.4
                    }}
                  >
                    {category}
                    {isActive && (
                      <motion.div layoutId="cat-glow" className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full" style={{ backgroundColor: theme.accentColor, boxShadow: `0 0 10px ${theme.accentColor}` }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 md:px-8 md:py-2 relative">
          <div className="max-w-[1700px] mx-auto h-full flex flex-col">
            {/* Search */}
            <div 
              className={`${theme.searchBg} border ${theme.borderLine} rounded-xl px-4 md:px-6 py-3 md:py-4 mb-2 md:mb-4 flex items-center gap-4 transition-all focus-within:shadow-md`}
              style={{ '--tw-focus-ring-color': `${theme.accentColor}40` } as any}
            >
              <Search className={theme.textMuted} size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..." 
                className={`bg-transparent border-none ${theme.textPrimary} outline-none flex-1 ${theme.inputPlaceholder} text-sm`}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* Grid */}
            {paginatedProducts.length > 0 ? (
              <>
              <div id="catalog-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 pb-32">
                {paginatedProducts.map((product, idx) => {
                  const today = new Date();
                  const createdAtDate = product.createdAt?.toMillis ? new Date(product.createdAt.toMillis()) : product.createdAt instanceof Date ? product.createdAt : new Date();
                  const diffDays = Math.floor((today.getTime() - createdAtDate.getTime()) / (1000 * 60 * 60 * 24));
                  const isNew = diffDays <= 10 || idx % 8 === 0;

                  return (
                    <motion.div
                    key={`prod-${product.id}-${idx}`}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: (idx % 3) * 0.1 }}
                    onClick={() => setSelectedProduct(product)}
                    className="group relative flex p-3 cursor-pointer backdrop-blur-xl border border-white/20 rounded-[2rem] overflow-hidden transition-all duration-500 shadow-2xl hover:shadow-[0_25px_60px_rgba(0,0,0,0.3)] hover:-translate-y-2 hover:scale-[1.02]"
                    style={{ 
                      backgroundColor: companyId === 'guennita' 
                        ? '#2B0406' // Darker burgundy 2 tones below #56070c
                        : companyId === 'mimada' ? theme.primaryColor : theme.accentColor 
                    }}
                  >
                    {/* Image Section - Left (Horizontal Layout) */}
                    <div className="relative w-[45%] aspect-square overflow-hidden bg-black/20 shrink-0 rounded-2xl">
                      <motion.div 
                        whileHover={{ scale: 1.15 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full h-full"
                      >
                        {renderProductImage(product.image, "w-full h-full object-cover transition-all duration-1000")}
                      </motion.div>

                      {/* Premium/New Badge */}
                      {(product.retail_price > 200 || isNew) && (
                        <div className="absolute top-3 left-3 z-20">
                          <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full text-[7px] font-black uppercase tracking-[0.2em] backdrop-blur-md bg-white/90 text-[#1A1A1A] border border-white/20 shadow-sm">
                            {product.retail_price > 200 ? 'Exclusive' : 'New'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content Section - Right (Horizontal Layout) */}
                    <div className="flex-1 pl-5 pr-2 py-4 flex flex-col justify-center space-y-4 relative overflow-hidden">
                      {/* Name & Pricing Section (Bottom) */}
                      <div className="space-y-3">
                        <h3 className="font-fancy text-xl md:text-2xl font-medium leading-snug line-clamp-2" style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF' }}>
                          {product.product_name}
                        </h3>

                        <div className="space-y-1 text-left">
                          {product.original_price && (
                            <p className="text-[10px] md:text-[11px] font-medium tracking-wide flex items-center gap-1.5" style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF', opacity: 0.6 }}>
                               <span className="opacity-60 text-[8px] uppercase">de:</span>
                               <span className={`line-through decoration-1 ${companyId === 'mimada' ? 'decoration-black/60' : 'decoration-white/60'}`}>{formatCurrency(product.original_price)}</span>
                            </p>
                          )}
                          
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-[8px] md:text-[9px] uppercase tracking-wider font-light" style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF', opacity: 0.6 }}>Por:</span>
                            <span className="text-lg md:text-xl tracking-tight font-bold" style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF' }}>
                              {formatCurrency(product.retail_price)}
                            </span>
                          </div>
                          
                          <p className="text-[8px] md:text-[9px] tracking-wide mt-1" style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF', opacity: 0.4 }}>
                            2x de {formatCurrency(product.retail_price / 2)} sem juros
                          </p>
                        </div>
                          <div className="flex items-center gap-3 pt-2">
                             <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  onAddToCart(product, 1); 
                                  setToast({ message: 'Adicionado ao Carrinho', type: 'success' });
                                }}
                                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-colors border ${companyId === 'mimada' ? 'bg-black/5 hover:bg-black/10 border-black/10' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                                style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF' }}
                              >
                                <ShoppingCart size={14} className="md:w-[16px] md:h-[16px]" />
                             </button>
                             <button 
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  onAddToGiftList(product); 
                                  setToast({ message: 'Adicionado à Lista', type: 'gift' });
                                }}
                                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-xl transition-colors border ${companyId === 'mimada' ? 'bg-black/5 hover:bg-black/10 border-black/10' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
                                style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF' }}
                              >
                                <Gift size={14} className="md:w-[16px] md:h-[16px]" />
                             </button>
                          </div>
                      </div>

                      {/* Subtle hover indicator */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-500">
                         <div className={`p-2 rounded-full border ${companyId === 'mimada' ? 'border-black/10' : 'border-white/20'}`} style={{ color: companyId === 'guennita' || companyId === 'mimada' ? theme.accentColor : '#FFFFFF' }}>
                           <ChevronRight size={14} />
                         </div>
                      </div>
                    </div>

                    {/* Background Decorative Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  </motion.div>
                )})}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 py-8 pb-32">
                  <button 
                    onClick={() => {
                      setCurrentPage(p => Math.max(1, p - 1));
                      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${theme.btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className={`${theme.textPrimary} font-bold text-sm`}>
                    Página {currentPage} de {totalPages}
                  </span>
                  <button 
                    onClick={() => {
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                      document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${theme.btnSecondary} disabled:opacity-30 disabled:cursor-not-allowed`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
              </>
            ) : (
              <div className={`flex flex-col items-center justify-center py-32 ${theme.textMuted}`}>
                <Package size={60} className="mb-6 opacity-20" />
                <h3 className={`text-lg font-medium text-center ${theme.textPrimary}`}>Nenhum produto encontrado</h3>
                <p className="text-sm text-center">Tente ajustar sua busca ou filtro de categoria</p>
              </div>
            )}
          </div>
          
          {/* Footer Legal & Copyright */}
          <footer className={`mt-10 pt-8 pb-16 border-t ${theme.borderLine} text-center space-y-4 px-6`}>
             <div className="max-w-4xl mx-auto">
                <p className={`text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] mb-2 ${theme.textPrimary}`}>Aspectos Legais e de Conformidade</p>
                <p className={`text-[7px] md:text-[9px] leading-relaxed font-bold ${theme.textMuted}`}>
                  Ao realizar um pedido, você concorda com nossos termos de produção artesanal. Os prazos de entrega podem variar de acordo com a complexidade da personalização. 
                  Imagens meramente ilustrativas. As cores podem sofrer variações dependendo da calibração do seu monitor ou tela. 
                  Proteção de Dados: Seus dados são utilizados exclusivamente para o processamento e entrega do seu pedido.
                </p>
                <div className={`mt-6 pt-4 border-t ${theme.borderLine} flex flex-col md:flex-row justify-between items-center gap-4`}>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${theme.textVeryMuted}`}>
                     © {new Date().getFullYear()} {companyName} • Todos os direitos reservados
                   </span>
                   <span className={`text-[8px] font-black uppercase tracking-widest ${theme.textVeryMuted} flex items-center gap-1`}>
                     Desenvolvido com <Heart size={8} className="text-rose-500 fill-rose-500" /> por Ateliês da Ju
                   </span>
                </div>
             </div>
          </footer>
        </main>
      </div>

      <AnimatePresence>
        {isCartOpen && (
          <CartSidebar 
            cart={cart}
            onClose={() => setIsCartOpen(false)}
            onRemove={onRemoveFromCart}
            onUpdateQty={onUpdateQuantity}
            onSetQty={onSetQuantity}
            onCheckout={handleDirectCheckout}
            isCheckoutLoading={isDirectCheckoutLoading}
            companyId={companyId}
          />
        )}
        
        {isGiftListOpen && (
          <GiftListSidebar 
            giftList={giftList}
            onClose={() => setIsGiftListOpen(false)}
            onRemove={onRemoveFromGiftList}
            theme={theme}
            companyId={companyId}
          />
        )}

        <SuggestionBox 
           companyId={companyId} 
           hideTrigger 
           isOpenExternal={isSuggestionOpen} 
           onCloseExternal={() => setIsSuggestionOpen(false)} 
        />

        {/* List Search Overlay */}
        {isSearchingList && (
           <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSearchingList(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1100]"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm ${theme.cardBg} p-8 rounded-3xl z-[1101] shadow-2xl overflow-hidden`}
              >
                  <div className="absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 pointer-events-none rounded-full" style={{ backgroundColor: theme.accentColor }} />
                  
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase tracking-widest text-[#161616]">Buscar Lista</h3>
                    <button onClick={() => setIsSearchingList(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="space-y-4 relative z-10">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-2">Código da Lista</label>
                       <input 
                         type="text"
                         placeholder="Ex: L12345P"
                         value={listSearchCode}
                         onChange={(e) => setListSearchCode(e.target.value.toUpperCase())}
                         className={`w-full ${theme.searchBg} border ${theme.borderLine} rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-widest focus:ring-4 transition-all focus:bg-white ${theme.textPrimary}`}
                         style={{ '--tw-ring-color': `${theme.accentColor}22` } as any}
                         onKeyDown={(e) => e.key === 'Enter' && handleListSearch()}
                       />
                    </div>
                    
                    <button 
                      onClick={handleListSearch}
                      disabled={isSearchingLoading || !listSearchCode}
                      className="w-full py-5 rounded-2xl text-white text-[11px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                      style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 30px -10px ${theme.accentColor}` }}
                    >
                      {isSearchingLoading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} strokeWidth={2.5} />}
                      Buscar Agora
                    </button>
                    
                    <p className="text-[9px] text-center font-bold text-black/40 uppercase tracking-tight px-4">
                      Insira o código gerado pelo criador da lista para visualizar os produtos.
                    </p>
                  </div>
              </motion.div>
           </>
        )}

        {selectedProduct && (
          <ProductDetailModal 
            product={selectedProduct}
            onClose={() => {
              setSelectedProduct(null);
              setIsReadOnlyProduct(false);
            }}
            onAddToCart={onAddToCart}
            onBuyNow={handleBuyNow}
            onAddToGiftList={isReadOnlyProduct ? undefined : onAddToGiftList}
            companyId={companyId}
            isReadOnly={isReadOnlyProduct}
          />
        )}

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[5000] px-8 py-5 bg-black text-white text-xs font-black uppercase tracking-widest rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 flex items-center gap-4 min-w-[300px] justify-center"
          >
            {toast.type === 'gift' ? (
              <div className="p-2 rounded-full bg-pink-500 text-white">
                <Gift size={18} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="p-2 rounded-full bg-amber-500 text-white">
                <ShoppingCart size={18} strokeWidth={2.5} />
              </div>
            )}
            <span className="flex-1 text-center">{toast.message}</span>
            <div className="w-8 h-px bg-white/20 mx-2" />
            <Sparkles size={14} className="text-[#D4AF37] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: (isCartOpen || isGiftListOpen || isSearchingList || selectedProduct || isSuggestionOpen) ? 0 : 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[1000] flex flex-row items-center gap-2"
        >
            <button 
              onClick={() => setIsSuggestionOpen(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-all border`}
              style={{ borderColor: `${theme.accentColor}40` }}
              title="Sugestões"
            >
              <MessageSquare size={14} strokeWidth={2} style={{ color: theme.accentColor }} />
            </button>

            <button 
              onClick={() => setIsGiftListOpen(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-all border`}
              style={{ borderColor: `${theme.accentColor}40` }}
              title="Lista de Presentes"
            >
              <Gift size={14} strokeWidth={2} style={{ color: theme.accentColor }} />
              {giftList.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accentColor }} />
              )}
            </button>
            
            <button 
              onClick={() => setIsCartOpen(true)}
              className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-all border`}
              style={{ borderColor: `${theme.accentColor}40` }}
              title="Carrinho"
            >
              <ShoppingCart size={14} strokeWidth={2} style={{ color: theme.accentColor }} />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[7px] font-black flex items-center justify-center rounded-full text-white pointer-events-none shadow-sm" style={{ backgroundColor: theme.accentColor }}>
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              )}
            </button>

            <a 
              href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-9 h-9 flex items-center justify-center rounded-full bg-white/80 backdrop-blur-md shadow-sm active:scale-95 transition-all border`}
              style={{ borderColor: `${theme.accentColor}40` }}
              title="Fale Comigo"
            >
              <MessageCircle size={14} strokeWidth={2} style={{ color: theme.accentColor }} />
            </a>
        </motion.div>
    </div>
  );
};
