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
import { CheckoutModal } from './CheckoutModal';
import { GiftListSidebar } from './GiftListSidebar';
import { SuggestionBox } from './SuggestionBox';
import { ProductDetailPage } from './ProductDetailPage';
import { ColecoesView } from './ColecoesView';


import { CatalogEditorialHeader } from './Catalog/Widgets/CatalogEditorialHeader';
import { CatalogListSearchOverlay } from './Catalog/Widgets/CatalogListSearchOverlay';
import { CatalogHeader } from './Catalog/CatalogHeader';
import { CatalogCategories } from './Catalog/CatalogCategories';
import { DateHighlights } from './Catalog/DateHighlights';
import { FeaturedProductsCarousel } from './Catalog/FeaturedProductsCarousel';
import { PriceDisplay } from './ui/PriceDisplay';
import { saveSale, subscribeToProducts, addProduct, getSiteSettings, getGlobalSettings, getGiftList, updateOrderStatus } from '../services/firebaseService';
import { validateProductStock } from '../utils/stockValidation';
import { playSuccessSound } from '../utils/audio';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { PRODUCTS, INITIAL_CONFIG } from '../constants';
import { useAuth } from './AuthProvider';
import { login } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const rawTheme = themes[companyId] || themes['pallyra'];
  const theme = useMemo(() => rawTheme, [companyId, rawTheme]);

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [view, setView] = useState<'catalog' | 'collections'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltering, setIsFiltering] = useState(false);

  const companyProducts = useMemo(() => {
    return allProducts.filter(p => p.company === companyId && !p.isKit);
  }, [allProducts, companyId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [location.search]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const highlights = useMemo(() => {
    if (!companyProducts || companyProducts.length === 0) return [];
    
    // Novidades: products from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newProducts = companyProducts.filter(p => {
      const createdAtDate = p.createdAt?.toMillis 
        ? new Date(p.createdAt.toMillis()) 
        : p.createdAt instanceof Date 
          ? p.createdAt 
          : new Date();
      return createdAtDate >= sevenDaysAgo;
    });

    // If no recent items, show some random ones as fallback but labeled as catalog
    if (newProducts.length === 0) {
      return companyProducts.slice(0, 5);
    }
    
    return newProducts.slice(0, 6);
  }, [companyProducts]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isGiftListOpen, setIsGiftListOpen] = useState(false);
  const [isSuggestionOpen, setIsSuggestionOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isReadOnlyProduct, setIsReadOnlyProduct] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isDirectCheckoutLoading, setIsDirectCheckoutLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    // Auto deep-link to product details on load
    const prodParam = params.get('product');
    if (prodParam && allProducts.length > 0) {
      const found = allProducts.find(p => p.id === prodParam);
      if (found) {
        setSelectedProduct(found);
      }
    }
  }, [location.search, allProducts]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedProduct) {
      if (params.get('product') !== selectedProduct.id) {
        params.set('product', selectedProduct.id);
        const newSearch = params.toString();
        window.history.pushState(null, '', `${window.location.pathname}?${newSearch}`);
      }
    } else {
      if (params.has('product')) {
        params.delete('product');
        const newSearch = params.toString();
        const newPath = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
        window.history.pushState(null, '', newPath);
      }
    }
  }, [selectedProduct]);

  const handleOpenCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const handleDirectCheckout = async (checkoutData: any = {}) => {
    if (cart.length === 0) return;
    setIsDirectCheckoutLoading(true);
    
    try {
      // Validate complete cart
      for (const item of cart) {
         const p = companyProducts.find(cp => cp.id === item.id) || item;
         const validation = await validateProductStock(p, item.quantity);
         if (!validation.valid) {
            alert(`Item indisponível: ${validation.reason}`);
            setIsDirectCheckoutLoading(false);
            return;
         }
      }

      const subtotal = cart.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
      let dscto = 0;
      if (checkoutData?.cupom === 'GANHEI10') {
        dscto = subtotal * 0.1;
      }
      const total = checkoutData?.total ?? (subtotal - dscto);
      
      const isFullPayment = checkoutData?.isFullPayment ?? true;
      const amountToPay = checkoutData?.amountToPay ?? total;

      console.log("Saving initial sale...");
      
      const pers = checkoutData?.personalization || {};
      const cli = checkoutData?.client || {};
      const addr = checkoutData?.address || {};

      let combinedObs = pers.persObs ? `Observações:\n${pers.persObs}` : "Pagamento via MP Direto";
      if (!isFullPayment) {
        combinedObs += `\n\nPAGAMENTO: Cliente optou por pagar SINAL DE 50% (R$ ${amountToPay.toFixed(2)}). Falta receber os outros 50%.`;
        if (checkoutData?.plannedMethod === 'digital_booklet') {
          combinedObs += `\n>> Forma escolhida para o restante: CARNÊ DIGITAL`;
          combinedObs += `\n>> Condição de parcelamento: ${checkoutData.remainingInstallments}x de R$ ${Number(checkoutData.remainingInstallmentValue).toFixed(2)}`;
          if (checkoutData?.bookletPayDay) {
            combinedObs += `\n>> Vencimento: Dia ${checkoutData.bookletPayDay}`;
          }
        }
      }
      
      if (pers.persName || pers.persAge || pers.persTheme || pers.persColors) {
         combinedObs += `\n\nPersonalização solicitada:`;
         if (pers.persName) combinedObs += `\nNome: ${pers.persName}`;
         if (pers.persAge) combinedObs += `\nIdade/Frase: ${pers.persAge}`;
         if (pers.persTheme) combinedObs += `\nTema: ${pers.persTheme}`;
         if (pers.persColors) combinedObs += `\nCores: ${pers.persColors}`;
      }

      let addressString = "";
      if (addr.rua) {
         addressString = `${addr.rua}, ${addr.numero} - ${addr.bairro} - ${addr.cidade}/${addr.estado} CEP: ${addr.cep}. Ref: ${addr.ref}`;
      }

      const docId = await saveSale({
        customerName: cli.clientName || "Cliente",
        customerEmail: cli.clientEmail || "",
        customerCpfCnpj: cli.clientCpf || "",
        contact: cli.clientContact || "",
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
        isWholesale: false,
        deliveryType: checkoutData.deliveryType,
        deliveryDate: "Agendar",
        isEmergency: false,
        paymentMethod: 'mercadopago',
        paymentMode: checkoutData?.paymentMode || 'full',
        plannedMethod: checkoutData?.plannedMethod || null,
        remainingInstallments: checkoutData?.remainingInstallments || null,
        remainingAmount: checkoutData?.remainingAmount || 0,
        remainingFee: checkoutData?.remainingFee || 0,
        remainingInstallmentValue: checkoutData?.remainingInstallmentValue || 0,
        source: 'catalog',
        observations: combinedObs,
        address: addressString
      });

      const savedOrderCode = docId || crypto.randomUUID();
      
      if (checkoutData?.isSimulated) {
        console.log('[MODO TESTE] Simulando pagamento aprovado...');
        await updateOrderStatus(savedOrderCode, 'paid');
        playSuccessSound();

        localStorage.setItem('mp_pending_order', JSON.stringify({
            orderId: savedOrderCode,
            cart: cart,
            total: total,
            companyName: companyName || companyId,
            config: {
               ...siteSettings,
               roulette_prizes: globalSettings?.roulette_prizes || (siteSettings as any)?.roulette_prizes || []
            },
            formData: {
              name: cli.clientName || "Cliente de Teste",
              contact: cli.clientContact || "",
              cpfCnpj: cli.clientCpf || "",
              deliveryType: checkoutData.deliveryType,
              address: addressString,
              city: addr.cidade || "",
              state: addr.estado || "",
              zipCode: addr.cep || "",
              paymentMethod: 'Modo Teste',
              observations: combinedObs,
              wonPrize: ''
            }
        }));

        window.dispatchEvent(new CustomEvent('clear-cart'));
        window.location.href = `${window.location.origin}${window.location.pathname}?payment_status=approved&order_id=${savedOrderCode}`;
        return;
      }
      
      console.log('Calling createPreference');
      const finalMpItems = [{
        title: !isFullPayment ? `Sinal (50%) - Pedido no Ateliê` : `Pedido no Ateliê`,
        quantity: 1,
        unit_price: amountToPay,
        currency_id: 'BRL'
      }];

       const preferencePayload = {
        orderId: savedOrderCode,
        companyId: companyId,
        items: finalMpItems,
        payer: {
          name: cli.clientName || "Cliente",
          email: cli.clientEmail || "cliente@loja.com" 
        },
        back_urls: {
          success: `${window.location.origin}${window.location.pathname}?payment_status=approved&order_id=${savedOrderCode}`,
          failure: `${window.location.origin}${window.location.pathname}?payment_status=failed&order_id=${savedOrderCode}`,
          pending: `${window.location.origin}${window.location.pathname}?payment_status=pending&order_id=${savedOrderCode}`
        },
        accessToken: globalSettings?.mercadopago_token || siteSettings?.mercadopago_token,
        auto_return: "approved"
      };

      console.log('Fetching /api/createPreference...');
      const response = await fetch('/api/createPreference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferencePayload)
      });
      
      if (!response.ok) {
        const textResponse = await response.text();
        let errorData;
        try {
           errorData = JSON.parse(textResponse);
        } catch(e) {
           errorData = { error: textResponse };
        }
        throw new Error(errorData?.error || response.statusText);
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
            config: {
               ...siteSettings,
               roulette_prizes: globalSettings?.roulette_prizes || (siteSettings as any)?.roulette_prizes || []
            },
            formData: {
              name: cli.clientName || "Cliente",
              contact: cli.clientContact || "",
              cpfCnpj: cli.clientCpf || "",
              deliveryType: checkoutData.deliveryType,
              address: addressString,
              city: addr.cidade || "",
              state: addr.estado || "",
              zipCode: addr.cep || "",
              paymentMethod: 'mercadopago',
              observations: combinedObs
            }
         }));
         
         window.dispatchEvent(new CustomEvent('clear-cart'));
         window.location.href = initPoint;
      } else {
         throw new Error("init_point não retornado pelo MP.");
      }
    } catch (e: any) {
      console.error("Checkout Error:", e);
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
    const prefix = companyId === 'mimada' ? 'mimadasim' : companyId === 'pallyra' ? 'lapallyra' : companyId === 'tuttymimo' ? 'tuttymimo' : 'guennita';
    
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
      const global = await getGlobalSettings();
      if (global) setGlobalSettings(global);
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

  const handleCategoryClick = (category: string | null) => {
    setIsFiltering(true);
    setSelectedCategory(category);
    setCurrentPage(1);
    setTimeout(() => {
      setIsFiltering(false);
    }, 400);
  };

  const companyName = companyId === 'pallyra' ? config.company_1_name : companyId === 'guennita' ? config.company_2_name : companyId === 'mimada' ? config.company_3_name : config.company_4_name;
  const defaultLogo = companyId === 'pallyra' ? config.company_1_logo : companyId === 'guennita' ? config.company_2_logo : companyId === 'mimada' ? config.company_3_logo : config.company_4_logo;
  
  const categories = useMemo(() => {
    return Array.from(new Set(companyProducts.map(p => p.category))).sort();
  }, [companyProducts]);

  const filteredProducts = useMemo(() => {
    return companyProducts.filter(p => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [companyProducts, selectedCategory, searchQuery]);

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
        isThumbnail={true}
      />
    );
  };

  return (
    <div 
      className={`vitrine-root min-h-[100dvh] pt-0 ${theme.bg} flex flex-col relative theme-${companyId === 'mimada' ? 'mimadasim' : companyId === 'pallyra' ? 'lapallyra' : companyId === 'tuttymimo' ? 'tuttymimo' : 'guennita'}`}
    >
       <CatalogHeader 
        companyName={companyName}
        theme={theme}
        onCartClick={() => setIsCartOpen(true)}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        onSearch={handleSearch}
        onGoBack={onGoBack}
        onGiftListClick={() => setIsSearchingList(true)}
        giftListCount={giftList.length}
        onViewAll={() => { handleCategoryClick(null); setView('catalog'); }}
        onViewCollections={() => setView('collections')}
        onViewNews={() => highlightsScrollRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onViewContact={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {selectedProduct ? (
          <div className="flex-1 overflow-y-auto bg-[#FAFAF9]" id="product-detail-scroll-container">
            <ProductDetailPage 
              product={selectedProduct}
              onClose={() => {
                setSelectedProduct(null);
                setIsReadOnlyProduct(false);
              }}
              onAddToCart={(prod, qty) => {
                if (qty === 0) {
                  setSelectedProduct(prod);
                  const container = document.getElementById('product-detail-scroll-container');
                  if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  onAddToCart(prod, qty);
                  setToast({ message: 'Adicionado ao Carrinho', type: 'success' });
                }
              }}
              onAddToGiftList={isReadOnlyProduct ? undefined : (prod) => {
                onAddToGiftList?.(prod);
                setToast({ message: 'Adicionado à Lista de Presentes', type: 'gift' });
              }}
              allProducts={allProducts}
              companyId={companyId}
            />
          </div>
        ) : view === 'collections' ? (
          <ColecoesView allProducts={allProducts} />
        ) : (
          <>
            <CatalogCategories 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategoryClick}
              theme={theme}
              getCategoryIcon={getCategoryIcon}
              isSidebarCollapsed={isSidebarCollapsed}
              setIsSidebarCollapsed={setIsSidebarCollapsed}
            />

            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] overflow-y-auto scrollbar-none">
              
              {/* Main Scroll Content */}
              <main className="p-4 md:p-8 relative">
                <div className="max-w-[1400px] mx-auto h-full flex flex-col pt-4">
                  
                  <CatalogEditorialHeader theme={theme} companyName={companyName} />

              {/* Loading Overlay between Filters */}
              <AnimatePresence mode="wait">
                {isFiltering ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-32"
                  >
                    <Loader2 size={36} className="animate-spin text-[#cca062]" />
                    <span className="text-[10px] font-sans font-black uppercase tracking-[0.3em] mt-4 opacity-50 text-[#6d5443]">Sincronizando Ateliê...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Grid - Premium Vertical Cards Showcase */}
                    {filteredProducts.length > 0 ? (
                      <>
                      <div id="catalog-grid" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 md:gap-6 pb-20 px-4 md:px-0">
                        {paginatedProducts.map((product, idx) => {
                          const today = new Date();
                          const createdAtDate = product.createdAt?.toMillis ? new Date(product.createdAt.toMillis()) : product.createdAt instanceof Date ? product.createdAt : new Date();
                          
                          return (
                            <motion.div
                              key={`prod-${product.id}-${idx}`}
                              initial={{ opacity: 0, y: 30 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-100px" }}
                              transition={{ duration: 0.5, delay: (idx % 3) * 0.05, ease: [0.16, 1, 0.3, 1] }}
                              onClick={() => setSelectedProduct(product)}
                              className="group relative flex flex-col md:flex-row overflow-hidden bg-white rounded-[12px] border transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md p-3 items-center"
                              style={{ borderColor: `${theme.accentColor}18` }}>
                               {/* Product Image */}
                              <div className="w-full h-[160px] md:w-[160px] md:h-full relative overflow-hidden bg-neutral-50/50 rounded-[8px] mb-3 md:mb-0 md:mr-4 shrink-0">
                                <ImageWithFallback 
                                  src={product.image || ''} 
                                  alt="Product"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                  containerClassName="w-full h-full absolute inset-0"
                                />
                              </div>

                              {/* Card Content */}
                              <div className="flex flex-col flex-1 justify-between w-full gap-2">
                                <div className="space-y-1">
                                  <h3 className={`font-sans text-[16px] font-semibold leading-tight ${theme.textPrimary} line-clamp-1`}>
                                    {product.product_name}
                                  </h3>
                                  <p className={`text-[12px] leading-tight line-clamp-2 ${theme.textSecondary} opacity-80 font-sans`}>
                                    {product.description || 'Um presente personalizado maravilhoso.'}
                                  </p>
                                  <span className={`text-[14px] font-semibold font-sans block pt-1 ${theme.textPrimary}`}>
                                      {formatCurrency(product.retail_price || 0)}
                                  </span>
                                </div>
                                
                                {/* CTA */}
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation();
                                    onAddToCart(product, 1); 
                                    setToast({ message: 'Adicionado ao Carrinho', type: 'success' });
                                  }}
                                  className="mt-2 w-full h-[40px] rounded-[10px] text-white font-bold uppercase tracking-widest text-[11px] transition-all duration-200 flex items-center justify-center shadow-sm hover:opacity-90 active:scale-[0.98] border border-transparent shadow-neutral-200/50"
                                  style={{ 
                                    backgroundColor: theme.accentColor
                                  }}
                                >
                                  Quero este
                                </button>
                              </div>
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
                            className={`p-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <span className="text-neutral-500 font-sans tracking-widest uppercase font-black text-[10px]">
                            {currentPage} / {totalPages}
                          </span>
                          <button 
                            onClick={() => {
                              setCurrentPage(p => Math.min(totalPages, p + 1));
                              document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-full border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed`}
                          >
                            <ChevronRight size={20} />
                          </button>
                        </div>
                      )}
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-32 text-neutral-400">
                        <Package size={48} strokeWidth={1} className="mb-4 opacity-50" />
                        <h3 className="text-base font-serif tracking-wide text-center text-neutral-900">Nenhum produto cadastrado</h3>
                        <p className="text-xs text-center font-sans tracking-wide">Tente ajustar sua busca ou filtro de categoria.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          {/* Sticky Boutique Floating Checkout Trigger - Removed as requested */}
          
        </main>
      </div>
      </>
      )}
    </div>

    {/* Footer Legal & Copyright - Full Width and Side-by-Side */}
    <footer className={`flex-shrink-0 w-full pt-10 pb-20 border-t ${theme.borderLine} text-center space-y-4 px-6 bg-white/80 backdrop-blur-md relative z-10`}>
        <div className="max-w-[1600px] mx-auto">
          <p className={`text-[8px] font-sans font-black tracking-[0.3em] mb-4 uppercase text-neutral-800 opacity-60 text-center`}>Avisos Legais, Direitos e Produção</p>
          <p className="text-[9px] leading-relaxed font-medium font-sans text-neutral-500 max-w-5xl mx-auto text-center px-4">
            Ao realizar um pedido em nossa plataforma, você consente com os termos regulados de confecção artesanal exclusiva. O ciclo de produção e entrega dos produtos sob encomenda pode ser de 03 a 20 dias úteis, dependendo da especificidade, complexidade e ordem de fila de solicitações do ateliê. As fotografias são meramente ilustrativas e editoriais; cores e acabamentos podem sofrer mudanças de cor dependendo da configuração de seu dispositivo. Dados de faturamento coletados operam sob conformidade e proteção legal vigentes.
          </p>
          <div className={`mt-10 pt-6 border-t ${theme.borderLine} flex flex-col md:flex-row justify-between items-center gap-4`}>
              <span className="text-[9px] font-sans font-bold tracking-widest text-neutral-400 uppercase">
                © 2025 {companyName} • Todos os direitos reservados
              </span>
              <span className="text-[9px] font-sans font-bold tracking-widest text-neutral-400 uppercase flex items-center gap-1.5">
                Desenvolvido com <Heart size={10} className="text-rose-500 fill-rose-500" /> por Ateliês da Ju
              </span>
          </div>
        </div>
    </footer>

    <AnimatePresence>
        {isCartOpen && (
          <CartSidebar 
            cart={cart}
            onClose={() => setIsCartOpen(false)}
            onRemove={onRemoveFromCart}
            onUpdateQty={onUpdateQuantity}
            onSetQty={onSetQuantity}
            onCheckout={handleOpenCheckout}
            isCheckoutLoading={isDirectCheckoutLoading}
            companyId={companyId}
          />
        )}
        
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          cart={cart}
          companyId={companyId}
          onAddToCart={onAddToCart}
          onCheckoutSubmit={handleDirectCheckout}
          isSubmitting={isDirectCheckoutLoading}
        />

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
        
                <CatalogListSearchOverlay 
          isOpen={isSearchingList}
          onClose={() => setIsSearchingList(false)}
          theme={theme}
          listSearchCode={listSearchCode}
          setListSearchCode={setListSearchCode}
          handleListSearch={handleListSearch}
          isSearchingLoading={isSearchingLoading}
        />



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
        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-full bg-black text-white shadow-xl flex items-center gap-3">
            {toast.type === 'success' ? <ShoppingCart size={16} /> : <Gift size={16} />}
            <span className="text-[10px] uppercase font-bold tracking-widest">{toast.message}</span>
          </div>
        )}
    </div>
  );
};
