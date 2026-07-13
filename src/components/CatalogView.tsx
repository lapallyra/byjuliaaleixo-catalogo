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
  Loader2,
  Check,
  Megaphone,
  Clock
} from 'lucide-react';
import { CompanyId, AppConfig, Product, CartItem, SiteSettings, Campaign } from '../types';
import { CartSidebar } from './CartSidebar';
import { CheckoutModal } from './CheckoutModal';
import { GiftListSidebar } from './GiftListSidebar';
import { SuggestionBox } from './SuggestionBox';
import { ProductDetailPage } from './ProductDetailPage';
import { ColecoesView } from './ColecoesView';
import { CategoryPillMenu } from './Catalog/CategoryPillMenu';
import { FestiveBanner, BubbleHearts } from './Catalog/FestiveBanner';
import { SeasonalBanner } from './Catalog/SeasonalBanner';
import { ProductCard } from './ui/ProductCard';


import { CatalogHeader } from './Catalog/CatalogHeader';
import { FloatingMenu } from './Catalog/FloatingMenu';
import { CatalogInfoBar } from './Catalog/CatalogInfoBar';
import { DateHighlights } from './Catalog/DateHighlights';
import { FeaturedProductsCarousel } from './Catalog/FeaturedProductsCarousel';
import { PriceDisplay } from './ui/PriceDisplay';
import { saveSale, subscribeToProducts, addProduct, getSiteSettings, getGlobalSettings, getGiftList, updateOrderStatus, subscribeToCampaigns } from '../services/firebaseService';
import { validateProductStock } from '../utils/stockValidation';
import { playSuccessSound } from '../utils/audio';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { PRODUCTS, INITIAL_CONFIG } from '../constants';
import { useAuth } from './AuthProvider';
import { login } from '../lib/firebase';
import { useNavigate, useLocation } from 'react-router-dom';
import { themes, getTheme } from '../lib/theme';
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
  onAddToFavorite?: (product: Product) => void;
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
  onAddToFavorite,
  onRemoveFromGiftList,
  onGoBack,
  onCheckoutComplete,
  onOpenAdmin
}) => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMemo(() => getTheme(companyId), [companyId]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const unsubCampaigns = subscribeToCampaigns((data) => {
      setCampaigns(data);
    }, companyId);
    return () => unsubCampaigns();
  }, [companyId]);

  const activeCampaigns = useMemo(() => {
    const now = new Date();
    return campaigns.filter(c => {
      if (!c.active) return false;
      
      // Check target pages
      if (c.targetPages && !c.targetPages.includes('catalog')) return false;

      // Check dates
      if (c.startDate) {
        const start = new Date(c.startDate);
        if (start > now) return false;
      }
      if (c.endDate) {
        const end = new Date(c.endDate);
        end.setHours(23, 59, 59, 999);
        if (end < now) return false;
      }

      return true;
    });
  }, [campaigns]);

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'alphabetical' | 'bestselling'>('latest');
  const [view, setView] = useState<'catalog' | 'collections'>('catalog');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<{ label: string, type: 'product' | 'category' }[]>([]);
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

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const productMatches = companyProducts
      .filter(p => p.product_name.toLowerCase().includes(query))
      .slice(0, 3)
      .map(p => ({ label: p.product_name, type: 'product' as const }));

    const categoryMatches = Array.from(new Set(companyProducts.map(p => p.category)))
      .filter(cat => cat.toLowerCase().includes(query))
      .slice(0, 3)
      .map(cat => ({ label: cat, type: 'category' as const }));

    setSuggestions([...productMatches, ...categoryMatches]);
  }, [searchQuery, companyProducts]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const highlights = useMemo(() => {
    if (!companyProducts || companyProducts.length === 0) return [];
    
    // Novidades: products from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newProducts = companyProducts.filter(p => {
      if (!p.createdAt) return false;
      let createdAtDate: Date;
      if (typeof (p.createdAt as any)?.toMillis === 'function') {
        createdAtDate = new Date((p.createdAt as any).toMillis());
      } else if (p.createdAt instanceof Date) {
        createdAtDate = p.createdAt;
      } else {
        const parsed = new Date(p.createdAt as any);
        createdAtDate = isNaN(parsed.getTime()) ? new Date(0) : parsed;
      }
      return createdAtDate >= sevenDaysAgo;
    });

    return newProducts.slice(0, 10);
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
            setToast({ message: `Item indisponível: ${validation.reason}`, type: 'success' });
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
        navigate(`${location.pathname}?payment_status=approved&order_id=${savedOrderCode}`);
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
      setToast({ message: `Falha ao ir para o pagamento: ${e.message || "Erro desconhecido"}`, type: 'success' });
      setIsDirectCheckoutLoading(false);
    }
  };

  const [isSeeding, setIsSeeding] = useState(false);
  const [adminClickCount, setAdminClickCount] = useState(0);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);
  const highlightsScrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
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
        navigate(`/listadepresentes/${list.code}`);
      } else {
        setToast({ message: "Lista não encontrada. Verifique o código.", type: 'success' });
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
      setToast({ message: 'Link copiado para a área de transferência!', type: 'success' });
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
      setToast({ message: 'Produtos sincronizados com sucesso!', type: 'success' });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      console.error(e);
      setToast({ message: 'Erro ao sincronizar produtos.', type: 'success' });
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
  const isotipo = siteSettings?.store_isotipo;
  
  const categories = useMemo(() => {
    return Array.from(new Set(companyProducts.map(p => p.category))).sort();
  }, [companyProducts]);

  const filteredProducts = useMemo(() => {
    let filtered = companyProducts.filter(p => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesCategory && matchesSearch;
    });

    // Sort logic
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return (a.retail_price || 0) - (b.retail_price || 0);
        case 'price_desc':
          return (b.retail_price || 0) - (a.retail_price || 0);
        case 'alphabetical':
          return a.product_name.localeCompare(b.product_name);
        case 'bestselling':
          return (b.salesCount || 0) - (a.salesCount || 0);
        case 'latest':
        default:
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return dateB - dateA;
      }
    });
  }, [companyProducts, selectedCategory, searchQuery, sortBy]);

  const clearFilters = () => {
    setSelectedCategory(null);
    setSearchQuery('');
    setSortBy('latest');
    setCurrentPage(1);
  };

  const hasActiveFilters = selectedCategory || searchQuery || sortBy !== 'latest';

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
        onProfileClick={() => {
          // Rola para a seção de contato/rodapé como mock de perfil/suporte
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        }}
        onFilterClick={() => {
          // Rola para a barra de filtros ou foca a busca
          if (searchInputRef.current) {
            searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => searchInputRef.current?.focus(), 500);
          } else {
            const infoBar = document.querySelector('.catalog-info-bar');
            if (infoBar) infoBar.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }}
        logoUrl={isotipo}
        companyId={companyId}
        searchQuery={searchQuery}
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
                }
              }}
              onAddToGiftList={isReadOnlyProduct ? undefined : (prod) => {
                onAddToGiftList?.(prod);
              }}
              allProducts={allProducts}
              companyId={companyId}
            />
          </div>
        ) : view === 'collections' ? (
          <ColecoesView allProducts={allProducts} />
        ) : (
          <>
            {/* Content Area */}
            <div className="flex-1 flex flex-col min-h-0 bg-[#FAF9F6] overflow-y-auto scrollbar-none">
              


              {/* Active Campaigns Banner Section */}

              {/* Active Campaigns Banner Section - Moved to Home */}
              
              {/* Elegant Persistent Search Bar Container */}
              <div className="max-w-xl mx-auto w-full px-4 mt-6 mb-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-neutral-400 group-focus-within:text-[#cca062] transition-colors">
                    <Search size={18} className="transition-transform duration-300 group-focus-within:scale-110" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="O que você deseja buscar no ateliê?"
                    value={searchQuery}
                    onChange={(e) => {
                      handleSearch(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    className="w-full pl-12 pr-12 py-3.5 bg-white/70 backdrop-blur-sm border border-[#e8dcc8]/40 hover:border-[#e8dcc8]/80 focus:border-[#cca062] rounded-full text-sm font-sans placeholder-neutral-400 text-[#3A312D] outline-none transition-all shadow-sm focus:shadow-md focus:bg-white"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e8dcc8]/40 rounded-2xl shadow-lg z-50 overflow-hidden">
                      {suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          className="w-full text-left px-6 py-3 text-sm hover:bg-[#F5F5F7] transition-colors flex items-center gap-2"
                          onClick={() => {
                            handleSearch(s.label);
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="text-[#8E8E93] text-xs uppercase tracking-wider">{s.type === 'category' ? 'Categoria' : 'Produto'}</span>
                          <span className="font-medium text-[#1C1C1E]">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchQuery && (
                    <button
                      onClick={() => handleSearch('')}
                      className="absolute inset-y-0 right-4 flex items-center p-1 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                      title="Limpar busca"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <CategoryPillMenu 
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryClick}
              />

              {!selectedCategory && !searchQuery && highlights.length > 0 && (
                <div ref={highlightsScrollRef} className="border-b border-[#e8dcc8]/10 pb-4">
                  <div className="max-w-[1600px] mx-auto px-4 pt-6 pb-2 text-left">
                    <span className="text-[9px] font-sans font-black tracking-[0.3em] uppercase text-[#cca062]">
                      Lançamentos
                    </span>
                    <h2 className="text-xl md:text-2xl font-serif text-[#3A312D] tracking-tight leading-tight mt-1">
                      Novidades
                    </h2>
                  </div>
                  <FeaturedProductsCarousel 
                    products={highlights}
                    theme={theme}
                    companyId={companyId}
                    onSelectProduct={(product) => setSelectedProduct(product)}
                    onAddToCart={(prod, qty) => onAddToCart(prod, qty)}
                    onAddToGiftList={(prod) => onAddToGiftList?.(prod)}
                    onAddToFavorite={(prod) => onAddToFavorite?.(prod)}
                  />
                </div>
              )}

              {/* Campaign Carousels & Product Highlights */}
              {!selectedCategory && !searchQuery && activeCampaigns.map((camp) => {
                if (camp.type === 'carousel') {
                  const campaignProducts = companyProducts.filter(p => camp.items?.includes(p.id));
                  if (campaignProducts.length === 0) return null;
                  return (
                    <div key={camp.id} className="border-b border-[#e8dcc8]/10 pb-4 mt-4">
                      <div className="max-w-[1600px] mx-auto px-4 pt-6 pb-2 text-left">
                        <span className="text-[9px] font-sans font-black tracking-[0.3em] uppercase text-[#cca062]">
                          {camp.subtitle || "Seleção Exclusiva"}
                        </span>
                        <h2 className="text-xl md:text-2xl font-serif text-[#3A312D] tracking-tight leading-tight mt-1">
                          {camp.title}
                        </h2>
                        {camp.description && (
                          <p className="text-xs text-neutral-500 font-sans tracking-wide max-w-lg mt-1">
                            {camp.description}
                          </p>
                        )}
                      </div>
                      <FeaturedProductsCarousel 
                        products={campaignProducts}
                        theme={theme}
                        companyId={companyId}
                        onSelectProduct={(product) => setSelectedProduct(product)}
                        onAddToCart={(prod, qty) => onAddToCart(prod, qty)}
                        onAddToGiftList={(prod) => onAddToGiftList?.(prod)}
                        onAddToFavorite={(prod) => onAddToFavorite?.(prod)}
                      />
                    </div>
                  );
                }

                if (camp.type === 'product_highlight' && camp.highlightProductId) {
                  const highlightProd = companyProducts.find(p => p.id === camp.highlightProductId);
                  if (!highlightProd) return null;
                  return (
                    <div key={camp.id} className="max-w-[1600px] mx-auto px-4 py-8 border-b border-[#e8dcc8]/10">
                      <div className="bg-white rounded-3xl p-6 md:p-12 border border-[#e8dcc8]/35 shadow-xs flex flex-col md:flex-row items-center gap-8 md:gap-16">
                        <div className="w-full md:w-1/2 aspect-square rounded-2xl overflow-hidden bg-neutral-50 border border-neutral-100">
                          <img src={highlightProd.image} className="w-full h-full object-cover hover:scale-103 transition-transform duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <div className="w-full md:w-1/2 text-left space-y-4 md:space-y-6">
                          <span className="text-[9px] font-sans font-black tracking-[0.3em] uppercase text-[#cca062]">
                            {camp.subtitle || "Destaque do Ateliê"}
                          </span>
                          <h2 className="text-2xl md:text-3xl font-serif text-[#3A312D] tracking-tight leading-tight">
                            {highlightProd.product_name}
                          </h2>
                          {highlightProd.description && (
                            <p className="text-xs md:text-sm text-neutral-500 font-sans tracking-wide leading-relaxed max-w-md">
                              {highlightProd.description}
                            </p>
                          )}
                          <div className="space-y-1">
                            {highlightProd.original_price && highlightProd.original_price > highlightProd.current_price && (
                              <span className="text-[10px] font-sans font-black tracking-[0.1em] uppercase text-[#8E8E93] line-through">
                                R$ {highlightProd.original_price.toFixed(2)}
                              </span>
                            )}
                            <div className="text-2xl font-light text-[#3A312D]">
                              R$ {highlightProd.current_price.toFixed(2)}
                            </div>
                          </div>
                          <div className="flex gap-4 pt-2">
                            <button 
                              onClick={() => setSelectedProduct(highlightProd)}
                              className="px-6 py-3 bg-[#3A312D] text-white rounded-full text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-[#52443e] transition-all shadow-sm cursor-pointer"
                            >
                              Ver Detalhes
                            </button>
                            <button 
                              onClick={() => onAddToCart(highlightProd, 1)}
                              className="px-6 py-3 bg-white border border-[#e8dcc8]/60 text-neutral-700 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm cursor-pointer"
                            >
                              Adicionar à Sacola
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
              
              {/* Main Scroll Content */}
              <main className="p-2 md:p-4 relative">

                <div className="max-w-[1600px] mx-auto h-full flex flex-col pt-4">
                  
                  <CatalogInfoBar 
                    selectedCategory={selectedCategory}
                    sortBy={sortBy}
                    onSortChange={(val) => setSortBy(val as any)}
                    hasActiveFilters={!!hasActiveFilters}
                    onClearFilters={clearFilters}
                    searchQuery={searchQuery}
                    totalResults={filteredProducts.length}
                    onClearSearch={() => handleSearch('')}
                  />

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
                      <div id="catalog-grid" className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6 pb-20 px-4 md:px-0">
                        {paginatedProducts.map((product, idx) => (
                            <ProductCard 
                              key={`prod-${product.id}-${idx}`}
                              product={product}
                              theme={theme}
                              onAddToCart={(prod, qty) => onAddToCart(prod, qty)}
                              onAddToGiftList={(prod) => onAddToGiftList?.(prod)}
                              onAddToFavorite={(prod) => onAddToFavorite?.(prod)}
                              onClick={() => setSelectedProduct(product)}
                            />
                        ))}
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
                      <div className="flex flex-col items-center justify-center py-16 px-6 text-center max-w-3xl mx-auto">
                        <div className="w-16 h-16 bg-[#FDFCF0] border border-[#e8dcc8]/40 rounded-full flex items-center justify-center mb-6 text-[#cca062] shadow-sm animate-pulse">
                          <Search size={28} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-serif text-[#3A312D] mb-2 italic">Nenhum tesouro encontrado</h3>
                        <p className="text-xs text-neutral-500 font-sans tracking-wide max-w-md mb-8 leading-relaxed">
                          Não encontramos produtos para "<span className="font-semibold text-neutral-800">{searchQuery}</span>" {selectedCategory ? `na categoria ${selectedCategory}` : ''}. Que tal ajustar sua busca ou explorar as coleções do nosso ateliê?
                        </p>

                        <div className="flex flex-wrap justify-center gap-3 mb-10">
                          <button 
                            onClick={() => handleSearch('')}
                            className="px-5 py-2.5 bg-[#3A312D] text-white rounded-full text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-[#52443e] transition-all shadow-sm cursor-pointer"
                          >
                            Limpar Busca
                          </button>
                          <button 
                            onClick={clearFilters}
                            className="px-5 py-2.5 bg-white border border-[#e8dcc8]/60 text-neutral-700 rounded-full text-[10px] font-sans font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm cursor-pointer"
                          >
                            Ver Todo o Catálogo
                          </button>
                        </div>

                        {/* Smart Category Discovery */}
                        <div className="w-full bg-[#FDFCF0]/40 backdrop-blur-sm border border-[#e8dcc8]/20 rounded-2xl p-6 text-left">
                          <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#cca062] mb-4 font-poppins text-center">Explorar Outras Coleções</h4>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {categories.map((cat) => {
                              return (
                                <button
                                  key={cat}
                                  onClick={() => {
                                    handleCategoryClick(cat);
                                    handleSearch('');
                                  }}
                                  className="flex items-center gap-3 p-3 bg-white hover:bg-white/95 border border-neutral-100 hover:border-[#cca062]/40 rounded-xl transition-all shadow-sm hover:shadow-md text-left group cursor-pointer"
                                >
                                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-[#3A312D]/5 group-hover:bg-[#3A312D] text-[#3A312D] group-hover:text-[#cca062] transition-all shrink-0">
                                    {getCategoryIcon(cat)}
                                  </div>
                                  <span className="text-[11px] font-bold text-neutral-700 group-hover:text-neutral-900 transition-colors uppercase tracking-wider truncate">
                                    {cat}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
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
            Ao realizar um pedido em nossa plataforma, você consente com os termos regulados de confecção artesanal exclusiva. O ciclo de produção e entrega dos produtos sob encomenda respeita o prazo especificado em cada item, dependendo da especificidade, complexidade e ordem de fila de solicitações do ateliê. As fotografias são meramente ilustrativas e editoriais; cores e acabamentos podem sofrer mudanças de cor dependendo da configuração de seu dispositivo. Dados de faturamento coletados operam sob conformidade e proteção legal vigentes.
          </p>
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
        
        {isSearchingList && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
            {/* Backdrop style */}
            <div 
              onClick={() => setIsSearchingList(false)}
              className="absolute inset-0 bg-[#3A312D]/40 backdrop-blur-sm transition-opacity"
            />
            {/* Modal Body */}
            <div className="bg-white rounded-[24px] w-full max-w-sm border border-[#e8dcc8]/50 p-6 shadow-xl relative z-10 animate-fade-in text-center font-sans">
              <h3 className="text-xl font-mea-culpa text-[#3A312D] mb-1 font-normal">Buscar Lista</h3>
              <p className="text-[10.5px] text-[#6d5443]/70 font-light mb-4">Insira o código de 5 dígitos para encontrar a lista de presentes</p>
              
              <input 
                type="text"
                maxLength={5}
                value={listSearchCode}
                onChange={(e) => setListSearchCode(e.target.value.toUpperCase())}
                placeholder="Ex: LUISA"
                className="w-full text-center tracking-[0.15em] font-semibold text-sm uppercase px-4 py-2.5 bg-[#FDFCF0] border border-[#e8dcc8]/40 rounded-xl focus:outline-none focus:border-[#cca062] mb-4 text-[#3A312D] font-poppins"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsSearchingList(false)}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-poppins border border-[#e8dcc8]/60 text-[#3A312D] hover:bg-[#3A312D]/5 transition-all outline-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleListSearch}
                  disabled={isSearchingLoading || listSearchCode.length < 5}
                  className="flex-1 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider font-poppins bg-[#3A312D] text-white hover:bg-[#cca062] hover:text-[#3A312D] transition-all disabled:opacity-50 disabled:pointer-events-none outline-none cursor-pointer"
                >
                  {isSearchingLoading ? 'Buscando...' : 'Buscar'}
                </button>
              </div>
            </div>
          </div>
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

        <FloatingMenu 
          cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          giftListCount={giftList.length}
          onCartClick={() => setIsCartOpen(true)}
          onGiftListClick={() => setIsGiftListOpen(true)}
          onSuggestionClick={() => setIsSuggestionOpen(true)}
          whatsappUrl={`https://wa.me/${(config.whatsapp_number || "").replace(/\D/g, '')}`}
          theme={theme}
        />
        
    </div>
  );
};
