import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Clock, 
  Heart, 
  Calendar, 
  ChevronRight, 
  Filter, 
  Search,
  ChevronLeft,
  ShoppingBag,
  Gift
} from 'lucide-react';
import { differenceInDays, startOfToday, isToday, isBefore } from 'date-fns';
import { getMobileDateOccurrence, slugify, DEFAULT_COMMEMORATIVE_DATES } from '../lib/commemorativeDateUtils';
import { ProductCard } from './ui/ProductCard';
import { ImageWithFallback } from './ImageWithFallback';
import { commemorativeDateService } from '../services/commemorativeDateService';
import { Product, CommemorativeDate, CompanyId } from '../types';
import { themes, getTheme } from '../lib/theme';
import { LoadingScreen } from './LoadingScreen';
import { ProductDetailModal } from './ProductDetailModal';

// BubbleHearts Floating Background Effect matching visual identity of Home
const BubbleHearts = ({ themeColor }: { themeColor: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.35]" style={{ color: themeColor }}>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{
            bottom: '-10%',
            left: `${Math.random() * 85}%`,
            opacity: 0,
            scale: Math.random() * 0.4 + 0.4,
          }}
          animate={{
            bottom: '110%',
            opacity: [0, 0.7, 0.7, 0],
            scale: [0.4, 0.9, 0.6],
            x: [0, Math.random() * 40 - 20, 0]
          }}
          transition={{
            duration: Math.random() * 6 + 7,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Heart size={Math.random() * 12 + 10} fill="currentColor" className="stroke-none opacity-80" />
        </motion.div>
      ))}
    </div>
  );
};

interface CommemorativeCampaignPageProps {
  allProducts: Product[];
}

export function CommemorativeCampaignPage({ allProducts = [] }: CommemorativeCampaignPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [dates, setDates] = useState<CommemorativeDate[]>(DEFAULT_COMMEMORATIVE_DATES);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'alphabetical' | 'bestselling'>('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    const unsub = commemorativeDateService.subscribe((loadedDates) => {
      if (loadedDates && loadedDates.length > 0) {
        const mergedMap = new Map<string, CommemorativeDate>();
        DEFAULT_COMMEMORATIVE_DATES.forEach(d => mergedMap.set(d.id, d));
        loadedDates.forEach(d => {
          mergedMap.set(d.id, {
            ...d,
            active: d.active !== false
          });
        });
        setDates(Array.from(mergedMap.values()));
      } else {
        setDates(DEFAULT_COMMEMORATIVE_DATES);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  // Find the matching commemorative date based on slug, id, or mobile_id
  const commemorativeDate = useMemo(() => {
    if (!slug) return null;
    const cleanSlug = slugify(decodeURIComponent(slug));
    const pool = dates.length > 0 ? dates : DEFAULT_COMMEMORATIVE_DATES;

    // 1. Exact match by slugified name
    let found = pool.find(d => slugify(d.name) === cleanSlug);

    // 2. Match by id or slugified id
    if (!found) {
      found = pool.find(d => d.id === slug || slugify(d.id) === cleanSlug);
    }

    // 3. Match by mobile_id
    if (!found) {
      found = pool.find(d => d.mobile_id && (d.mobile_id === slug || slugify(d.mobile_id) === cleanSlug));
    }

    // 4. Loose match by partial name or hashtags
    if (!found) {
      found = pool.find(d => {
        const dSlug = slugify(d.name);
        return dSlug.includes(cleanSlug) || cleanSlug.includes(dSlug) ||
          (d.hashtags && d.hashtags.some(h => slugify(h) === cleanSlug));
      });
    }

    // Only exclude if explicitly inactive
    if (found && found.active === false) {
      return null;
    }
    return found || null;
  }, [dates, slug]);

  const getFullDate = (d: CommemorativeDate, year = new Date().getFullYear()) => {
    let dateObj: Date;
    if (d.year_fixed) {
      dateObj = new Date(year, d.month - 1, d.day);
    } else if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year);
      dateObj = new Date(year, occurrence.month - 1, occurrence.day);
    } else {
      dateObj = new Date(year, d.month - 1, d.day);
    }
    
    // If recurrent and the date has already passed for this year, count down to next year's occurrence!
    if (d.recurrent && isBefore(dateObj, startOfToday()) && !isToday(dateObj)) {
      if (d.year_fixed) {
        return new Date(year + 1, d.month - 1, d.day);
      } else if (d.mobile_id) {
        const occurrence = getMobileDateOccurrence(d.mobile_id, year + 1);
        return new Date(year + 1, occurrence.month - 1, occurrence.day);
      } else {
        return new Date(year + 1, d.month - 1, d.day);
      }
    }
    return dateObj;
  };

  // Filter products related to this commemorative date
  const campaignProducts = useMemo(() => {
    if (!commemorativeDate || allProducts.length === 0) return [];

    const nameTokens = commemorativeDate.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/[\s,/-]+/)
      .filter(t => t.length > 2 && !['para', 'com', 'dos', 'das', 'de', 'da', 'do', 'em', 'um', 'uma', 'nobre'].includes(t));

    const hashtags = (commemorativeDate.hashtags || []).map(h => 
      h.toLowerCase().replace('#', '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
    ).filter(Boolean);

    const fullDateName = commemorativeDate.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const dateId = commemorativeDate.id.toLowerCase();
    const mobileId = commemorativeDate.mobile_id ? commemorativeDate.mobile_id.toLowerCase() : '';

    return allProducts.filter(p => {
      if (p.isVisible === false) return false;

      // 1. Direct match by exclusive product ID
      if (commemorativeDate.exclusive_product_id && commemorativeDate.exclusive_product_id === p.id) {
        return true;
      }

      // 2. Check tags
      const pTags = (p.tags || []).map(t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim());
      const hasMatchingTag = pTags.some(tag => {
        if (!tag) return false;
        if (hashtags.some(h => tag.includes(h) || h.includes(tag))) return true;
        if (tag.includes(fullDateName) || fullDateName.includes(tag)) return true;
        if (dateId && tag.includes(dateId)) return true;
        if (mobileId && tag.includes(mobileId)) return true;
        if (nameTokens.some(tok => tag.includes(tok) || tok.includes(tag))) return true;
        return false;
      });

      if (hasMatchingTag) return true;

      // 3. Check name, category, or subcategory against hashtags / campaign tokens
      const pName = (p.product_name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pCat = (p.category || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const pSub = (p.subcategory || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      return hashtags.some(h => pName.includes(h) || pCat.includes(h) || pSub.includes(h)) ||
        pName.includes(fullDateName) ||
        nameTokens.some(tok => pName.includes(tok));
    });
  }, [commemorativeDate, allProducts]);

  // Strictly show products related to this commemorative campaign (no fallback to entire catalog)
  const effectiveProductPool = campaignProducts;

  // Separate Kits and regular products
  const { kits, regularProducts } = useMemo(() => {
    const kitsList = effectiveProductPool.filter(p => p.isKit);
    const regularList = effectiveProductPool.filter(p => !p.isKit);
    return { kits: kitsList, regularProducts: regularList };
  }, [effectiveProductPool]);

  // Filter and sort regular products
  const filteredAndSortedProducts = useMemo(() => {
    let result = regularProducts.filter(p => {
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesSearch;
    });

    // Sorting
    return [...result].sort((a, b) => {
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
          const dateA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const dateB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return dateB - dateA;
      }
    });
  }, [regularProducts, searchQuery, sortBy]);

  // Helper to open product summary modal with exclusive edition badges
  const handleProductClick = (product: Product) => {
    setSelectedModalProduct(product);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  // Campaign Not Found State
  if (!commemorativeDate) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto">
        <div className="w-20 h-20 bg-amber-50 rounded-[2rem] flex items-center justify-center mb-6 border border-amber-100 shadow-sm">
          <Calendar size={36} className="text-[#cca062]" />
        </div>
        <h1 className="text-3xl font-serif text-[#3A312D] mb-4">Campanha não Encontrada</h1>
        <p className="text-[#8C7864] mb-8 font-light leading-relaxed text-sm">
          A campanha comemorativa que você está procurando pode ter sido encerrada, estar programada para o futuro ou o endereço digitado está incorreto.
        </p>
        <button 
          onClick={() => navigate('/')}
          className="bg-[#6D5443] hover:bg-[#8C7864] text-white font-bold py-3 px-8 rounded-full transition-all duration-300 shadow-sm uppercase tracking-widest text-[10px]"
        >
          Voltar para o Início
        </button>
      </div>
    );
  }

  const themeColor = commemorativeDate.theme_color || '#8C7864';
  const eventDate = getFullDate(commemorativeDate);
  const editionYear = commemorativeDate.edition_year || eventDate.getFullYear() || new Date().getFullYear();
  const today = startOfToday();
  const daysTo = differenceInDays(eventDate, today);

  // Exclusive Product resolution
  const exclusiveProduct = useMemo(() => {
    if (!commemorativeDate) return null;
    if (commemorativeDate.exclusive_product_id) {
      const found = allProducts.find(p => p.id === commemorativeDate.exclusive_product_id);
      if (found) return found;
    }
    const foundFlagged = campaignProducts.find(p => p.isExclusive);
    if (foundFlagged) return foundFlagged;
    return null;
  }, [commemorativeDate, allProducts, campaignProducts]);

  // Define countdown description text
  let countdownText = '';
  if (daysTo === 0) {
    countdownText = 'É HOJE!';
  } else if (daysTo === 1) {
    countdownText = 'FALTA APENAS 1 DIA!';
  } else if (daysTo > 1) {
    countdownText = `FALTAM APENAS ${daysTo} DIAS`;
  } else {
    countdownText = 'CAMPANHA FINALIZADA';
  }

  // Find banner image or use first product's image as fallback
  const bannerImage = commemorativeDate.banner || 
    (campaignProducts.length > 0 ? (campaignProducts[0].image || campaignProducts[0].main_image) : null);

  return (
    <div className="min-h-screen bg-[#FDFCFA] pb-20 relative overflow-x-hidden select-none font-sans">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FAF6F0] via-[#FDFCFA] to-transparent pointer-events-none -z-10" />
      
      {/* Hero seguindo exatamente a identidade visual do banner da Home (versão expandida, unboxed) */}
      <header className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 pt-16 sm:pt-20 md:pt-24 relative">
        <div className="relative w-full flex flex-col md:flex-row min-h-[380px] md:min-h-[400px] select-none items-center gap-6 py-2">
          
          {/* Lado Esquerdo: Conteúdo Editorial */}
          <div className="w-full md:w-[48%] flex flex-col justify-between py-2 sm:py-4 relative z-10">
            
            {/* Bubble Hearts Background floating exclusively in left half */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <BubbleHearts themeColor={themeColor} />
            </div>

            <div className="relative z-10 flex-grow flex flex-col justify-center">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#EAE4DC] mb-3 sm:mb-4 self-start shadow-xs">
                <Sparkles size={11} className="animate-pulse" style={{ color: themeColor }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C7864] font-sans">
                  Coleção de Afeto
                </span>
              </div>

              {/* Nome da Campanha (1 linha elegante, sem quebra excessiva) */}
              <h1 
                className="font-mea-culpa text-3xl sm:text-4xl md:text-5xl lg:text-[44px] xl:text-[52px] leading-tight select-none tracking-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.01)] mb-2 sm:mb-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
                style={{ color: themeColor }}
              >
                {commemorativeDate.name}
              </h1>

              {/* Contagem Regressiva */}
              <div className="my-2 flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#8C7864]/90 font-sans">
                  Contagem Regressiva
                </span>
                <span 
                  className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter leading-tight mt-0.5"
                  style={{ color: themeColor }}
                >
                  {countdownText}
                </span>
              </div>

              {/* Frase da Campanha */}
              <p className="font-mea-culpa text-2xl sm:text-3xl text-[#8C7864] mt-2 mb-1 max-w-sm leading-tight">
                {commemorativeDate.marketing_phrase || "O presente ideal para eternizar momentos de afeto."}
              </p>

              {commemorativeDate.description && (
                <p className="text-xs text-[#8C7864]/80 font-light max-w-sm mt-2 leading-relaxed">
                  {commemorativeDate.description}
                </p>
              )}
            </div>

            <div className="relative z-10 mt-4 pt-3 border-t border-[#EAE4DC]/50 flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#8C7864]/70">
                Feito inteiramente à mão no ateliê
              </span>
            </div>

          </div>

          {/* Lado Direito: Produto Exclusivo ou Apresentação Artesanal da Data */}
          {exclusiveProduct ? (
            <div 
              onClick={() => setSelectedModalProduct(exclusiveProduct)}
              className="w-full md:w-[52%] relative h-[280px] sm:h-[340px] md:h-[400px] overflow-hidden rounded-[2rem] border border-[#EAE4DC] shadow-sm group cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-[#cca062]/50 bg-white"
            >
              {/* Foto do Produto Exclusivo */}
              <ImageWithFallback 
                src={exclusiveProduct.image || exclusiveProduct.main_image || bannerImage || ''} 
                alt={exclusiveProduct.product_name}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                containerClassName="w-full h-full"
              />

              {/* Selos Flutuantes no Canto Superior */}
              <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 text-white shadow-md border border-white/20 animate-pulse">
                  <Sparkles size={12} />
                  Produto Exclusivo
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-[#1F1F1F]/90 backdrop-blur-md text-white shadow-md border border-white/10">
                  Edição {editionYear}
                </span>
              </div>

              {/* Subtle Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none z-10 opacity-90 group-hover:opacity-100 transition-opacity" />

              {/* Floating Info Bottom Bar */}
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-6 z-20 flex items-end justify-between gap-4 text-white">
                <div className="min-w-0 flex-1">
                  <span className="text-[9px] font-bold tracking-[0.25em] uppercase text-amber-300 font-sans block mb-1">
                    {exclusiveProduct.category || 'Ateliê'} • Destaque da Edição
                  </span>
                  <h3 className="font-serif text-base sm:text-2xl font-normal leading-tight text-white drop-shadow-sm truncate mb-1">
                    {exclusiveProduct.product_name}
                  </h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-lg sm:text-2xl font-black text-[#cca062] tracking-tight font-sans">
                      R$ {(exclusiveProduct.retail_price || exclusiveProduct.current_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    {exclusiveProduct.original_price > (exclusiveProduct.retail_price || exclusiveProduct.current_price) && (
                      <span className="text-xs text-white/50 line-through font-sans">
                        R$ {exclusiveProduct.original_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Ação / Ver Resumo */}
                <div className="shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest bg-white text-[#3A312D] group-hover:bg-[#cca062] group-hover:text-white transition-colors duration-200 shadow-md">
                    Ver Detalhes
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full md:w-[52%] relative min-h-[260px] sm:min-h-[320px] md:h-[390px] overflow-hidden rounded-[2rem] border border-[#EAE4DC] shadow-sm flex flex-col justify-center items-center p-8 bg-[#FAF7F2] text-center">
              {bannerImage ? (
                <>
                  <ImageWithFallback 
                    src={bannerImage} 
                    alt={commemorativeDate.name}
                    className="w-full h-full object-cover"
                    containerClassName="w-full h-full absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-10" />
                  <div className="absolute bottom-6 inset-x-6 z-20 text-white text-left">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-300 mb-1 block">
                      Celebração Especial
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-normal text-white">
                      {commemorativeDate.name}
                    </h3>
                  </div>
                </>
              ) : (
                <div className="relative z-10 flex flex-col items-center max-w-md">
                  <div className="w-14 h-14 rounded-full bg-white border border-[#D4AF37]/40 flex items-center justify-center text-[#8C6D37] mb-4 shadow-xs">
                    <Gift size={26} strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D37] mb-1">
                    Produção Afetiva Sob Demanda
                  </span>
                  <h3 className="font-serif text-2xl sm:text-3xl text-[#2C1810] mb-2 font-normal">
                    {commemorativeDate.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#735A4A] font-light leading-relaxed">
                    Personalize presentes afetivos, caixas cartonadas e mimos sob encomenda com até 60 dias de antecedência para eternizar este momento.
                  </p>
                </div>
              )}
              
              {/* Delicate golden accent borders */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#B38F4D]/40 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#B38F4D]/40 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#B38F4D]/40 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#B38F4D]/40 pointer-events-none" />
            </div>
          )}

        </div>
      </header>

      {/* Seção principal de produtos */}
      <main className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 mt-4 sm:mt-6 relative z-10">

        {/* CASO EXISTA UM KIT RELACIONADO, DESTACÁ-LO ANTES */}
        {kits.length > 0 && (
          <section className="mb-12">
            <div className="flex flex-col mb-6 text-center sm:text-left">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#8C7864] block mb-1 font-sans">
                Edições Especiais
              </span>
              <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#3A312D] mb-1">
                Kits Comemorativos
              </h2>
              <div className="h-[1px] w-12 bg-[#cca062] mx-auto sm:mx-0 mb-3"></div>
              <p className="text-xs text-[#8C7864] font-light max-w-xl leading-relaxed">
                Kits cuidadosamente montados para a campanha de {commemorativeDate.name}. Presentes completos e inesquecíveis.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {kits.map((kit) => (
                <ProductCard 
                  key={kit.id}
                  product={kit}
                  themeColor={themeColor}
                  onClick={() => handleProductClick(kit)}
                />
              ))}
            </div>
          </section>
        )}

        {/* LISTAGEM DOS PRODUTOS DA CAMPANHA */}
        <section>
          
          {/* Header e Filtros */}
          <div className="border-b border-[#EAE4DC] pb-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="text-center md:text-left">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-[#8C7864] font-sans">
                Coleção Completa
              </span>
            </div>

            {/* Filtros de Ordenação e Pesquisa */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 justify-center md:justify-end w-full md:w-auto">
              
              {/* Ordenação */}
              <div className="relative shrink-0">
                <select 
                  value={sortBy} 
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-[#EAE4DC] rounded-full text-xs py-2 pl-4 pr-8 text-[#8C7864] font-medium outline-none cursor-pointer appearance-none shadow-xs hover:border-[#D3C9BE] transition-all"
                >
                  <option value="latest">Mais Recentes</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                  <option value="alphabetical">Nome (A-Z)</option>
                  <option value="bestselling">Mais Vendidos</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#8C7864]">
                  <ChevronRight size={12} className="rotate-90" />
                </div>
              </div>

              {/* Barra de Busca Elegante */}
              <div className="relative w-full sm:w-[240px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Buscar nesta coleção..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#EAE4DC] rounded-full text-xs font-sans text-[#3A312D] placeholder-neutral-400 focus:border-[#cca062] outline-none transition-all shadow-xs"
                />
              </div>

            </div>
          </div>

          {/* Grid de produtos */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EAE4DC] rounded-[24px] shadow-xs px-4">
              <ShoppingBag size={32} className="text-[#8C7864]/40 mx-auto mb-4" />
              <p className="text-sm font-medium text-[#3A312D] mb-1">Nenhum produto com tag desta campanha encontrado</p>
              <p className="text-xs text-[#8C7864] font-light">Assim que novos itens exclusivos forem cadastrados com a temática de {commemorativeDate.name}, eles aparecerão aqui.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  themeColor={themeColor}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          )}

        </section>

      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedModalProduct && (
          <ProductDetailModal
            product={selectedModalProduct}
            isExclusive={selectedModalProduct.id === exclusiveProduct?.id || Boolean(selectedModalProduct.isExclusive)}
            campaignYear={editionYear}
            companyId={selectedModalProduct.company}
            allProducts={allProducts}
            onClose={() => setSelectedModalProduct(null)}
            onAddToCart={(prod, qty) => {
              try {
                const saved = localStorage.getItem('unified_cart_v2');
                const cart = saved ? JSON.parse(saved) : [];
                const existing = cart.find((i: any) => i.product.id === prod.id);
                if (existing) {
                  existing.quantity += qty;
                } else {
                  cart.push({ product: prod, quantity: qty });
                }
                localStorage.setItem('unified_cart_v2', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
              } catch (e) {
                console.error(e);
              }
              setSelectedModalProduct(null);
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
