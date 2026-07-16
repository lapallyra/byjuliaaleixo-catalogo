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
  ShoppingBag
} from 'lucide-react';
import { differenceInDays, startOfToday, isToday, isBefore } from 'date-fns';
import { getMobileDateOccurrence, slugify } from '../lib/commemorativeDateUtils';
import { ProductCard } from './ui/ProductCard';
import { ImageWithFallback } from './ImageWithFallback';
import { commemorativeDateService } from '../services/commemorativeDateService';
import { Product, CommemorativeDate, CompanyId } from '../types';
import { themes, getTheme } from '../lib/theme';

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

  const [dates, setDates] = useState<CommemorativeDate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc' | 'alphabetical' | 'bestselling'>('latest');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsub = commemorativeDateService.subscribe((loadedDates) => {
      setDates(loadedDates);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Find the matching commemorative date based on the slugified name
  const commemorativeDate = useMemo(() => {
    if (!slug || dates.length === 0) return null;
    const found = dates.find(d => slugify(d.name) === slug) || null;
    if (found && !found.active) {
      return null;
    }
    return found;
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

    const terms = [
      commemorativeDate.name.toLowerCase(),
      ...(commemorativeDate.hashtags || []).map(h => h.toLowerCase().replace('#', ''))
    ];

    // Filter products that contain terms in name, category, subcategory, or tags
    return allProducts.filter(p => {
      if (p.isVisible === false) return false;

      const pName = p.product_name.toLowerCase();
      const pCat = p.category ? p.category.toLowerCase() : '';
      const pSub = p.subcategory ? p.subcategory.toLowerCase() : '';
      const pTags = (p.tags || []).map(t => t.toLowerCase());

      return terms.some(t => 
        pName.includes(t) || 
        pCat.includes(t) || 
        pSub.includes(t) || 
        pTags.includes(t)
      );
    });
  }, [commemorativeDate, allProducts]);

  // Separate Kits and regular products
  const { kits, regularProducts } = useMemo(() => {
    const kitsList = campaignProducts.filter(p => p.isKit);
    const regularList = campaignProducts.filter(p => !p.isKit);
    return { kits: kitsList, regularProducts: regularList };
  }, [campaignProducts]);

  // Categories present in this campaign
  const categories = useMemo(() => {
    const list = Array.from(new Set(regularProducts.map(p => p.category).filter(Boolean))).sort();
    return list;
  }, [regularProducts]);

  // Filter and sort regular products
  const filteredAndSortedProducts = useMemo(() => {
    let result = regularProducts.filter(p => {
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.subcategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
      
      return matchesCategory && matchesSearch;
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
  }, [regularProducts, selectedCategory, searchQuery, sortBy]);

  // Helper to deep link to correct product owner catalog
  const handleProductClick = (product: Product) => {
    const company = product.company;
    let path = '/';
    if (company === 'pallyra') path = '/lapallyra';
    else if (company === 'guennita') path = '/comamorguennita';
    else if (company === 'mimada') path = '/mimadasim';
    else if (company === 'tuttymimo') path = '/tuttymimo';

    // Navigate to respective atelier catalog and set product search query
    navigate(`${path}?product=${product.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-8">
        <div className="w-12 h-12 border-4 border-[#cca062] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#8C7864] font-serif tracking-wider text-sm">Carregando Campanha Especial...</p>
      </div>
    );
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
  const today = startOfToday();
  const daysTo = differenceInDays(eventDate, today);

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
    <div className="min-h-screen bg-[#FFF9F6] pb-20 relative overflow-x-hidden select-none">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FFF2EC] via-[#FFF9F6] to-transparent pointer-events-none -z-10" />
      
      {/* Botão flutuante de voltar */}
      <div className="max-w-6xl mx-auto px-4 pt-6 sm:px-6 relative z-30">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#8C7864] hover:text-[#3A312D] transition-colors cursor-pointer bg-white/80 backdrop-blur-xs py-2 px-4 rounded-full border border-[#EAE4DC] shadow-xs"
        >
          <ArrowLeft size={14} /> Voltar
        </button>
      </div>

      {/* Hero seguindo exatamente a identidade visual do banner da Home (versão expandida, unboxed) */}
      <header className="max-w-6xl mx-auto px-4 mt-4 sm:px-6 relative">
        <div className="relative w-full flex flex-col md:flex-row min-h-[420px] select-none items-center gap-8 py-4">
          
          {/* Lado Esquerdo: Conteúdo Editorial */}
          <div className="w-full md:w-[48%] flex flex-col justify-between py-6 relative z-10">
            
            {/* Bubble Hearts Background floating exclusively in left half */}
            <div className="absolute inset-0 z-0 overflow-hidden">
              <BubbleHearts themeColor={themeColor} />
            </div>

            <div className="relative z-10 flex-grow flex flex-col justify-center">
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-[#EAE4DC] mb-6 self-start shadow-xs">
                <Sparkles size={11} className="animate-pulse" style={{ color: themeColor }} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C7864] font-sans">
                  Coleção de Afeto
                </span>
              </div>

              {/* Nome da Campanha */}
              <h1 
                className="font-mea-culpa text-5xl sm:text-7xl lg:text-8xl leading-none select-none tracking-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.01)] mb-4"
                style={{ color: themeColor }}
              >
                {commemorativeDate.name}
              </h1>

              {/* Contagem Regressiva */}
              <div className="my-3 flex flex-col">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#8C7864]/90 font-sans">
                  Contagem Regressiva
                </span>
                <span 
                  className="text-4xl sm:text-5xl font-black tracking-tighter leading-tight mt-1"
                  style={{ color: themeColor }}
                >
                  {countdownText}
                </span>
              </div>

              {/* Frase da Campanha */}
              <p className="font-mea-culpa text-2xl sm:text-3xl text-[#8C7864] mt-4 mb-2 max-w-sm leading-tight">
                {commemorativeDate.marketing_phrase || "O presente ideal para eternizar momentos de afeto."}
              </p>

              {commemorativeDate.description && (
                <p className="text-xs text-[#8C7864]/80 font-light max-w-sm mt-3 leading-relaxed">
                  {commemorativeDate.description}
                </p>
              )}
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-[#EAE4DC]/50 flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#8C7864]/70">
                Feito inteiramente à mão no ateliê
              </span>
            </div>

          </div>

          {/* Lado Direito / Background: Foto grande que ocupa a metade direita toda */}
          <div className="w-full md:w-[52%] relative h-[250px] md:h-[420px] overflow-hidden rounded-[2rem] border border-[#EAE4DC] shadow-sm">
            {bannerImage ? (
              <ImageWithFallback 
                src={bannerImage} 
                alt={commemorativeDate.name}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center">
                <span className="font-mea-culpa text-3xl text-[#8C7864]/40">Coleção Especial</span>
              </div>
            )}

            {/* DEGRADÊ EXTREMAMENTE SUAVE: Integração visual perfeita entre conteúdo e imagem */}
            {/* Desktop Overlay (Left-to-Right) */}
            <div 
              className="absolute inset-0 pointer-events-none z-20 hidden md:block"
              style={{
                background: 'linear-gradient(to right, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 40%, rgba(255, 255, 255, 0) 100%)'
              }}
            />
          </div>

        </div>
      </header>

      {/* Seção principal de produtos */}
      <main className="max-w-6xl mx-auto px-4 mt-16 sm:px-6 relative z-10">

        {/* CASO EXISTA UM KIT RELACIONADO, DESTACÁ-LO ANTES */}
        {kits.length > 0 && (
          <section className="mb-16">
            <div className="flex flex-col mb-8 text-center sm:text-left">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#8C7864] block mb-2 font-sans">
                Edições Especiais
              </span>
              <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#3A312D] mb-2">
                Kits Comemorativos
              </h2>
              <div className="h-[1px] w-12 bg-[#cca062] mx-auto sm:mx-0 mb-4"></div>
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
          <div className="border-b border-[#EAE4DC] pb-6 mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            
            <div className="text-center md:text-left">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#8C7864] block mb-2 font-sans">
                Coleção Completa
              </span>
              <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#3A312D]">
                Todos os Produtos
              </h2>
            </div>

            {/* Filtros de Ordenação e Pesquisa */}
            <div className="flex flex-wrap items-center gap-3 justify-center md:justify-end">
              
              {/* Barra de Busca Elegante */}
              <div className="relative w-full max-w-[240px]">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input 
                  type="text" 
                  placeholder="Buscar nesta coleção..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-[#EAE4DC] rounded-full text-xs font-sans text-[#3A312D] placeholder-neutral-400 focus:border-[#cca062] outline-none transition-all shadow-xs"
                />
              </div>

              {/* Ordenação */}
              <div className="relative">
                <select 
                  value={sortBy} 
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="bg-white border border-[#EAE4DC] rounded-full text-xs py-2 pl-4 pr-8 text-[#8C7864] font-medium outline-none cursor-pointer appearance-none shadow-xs"
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

            </div>
          </div>

          {/* Filtros de Categoria (Pills) se houver mais de uma categoria */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center md:justify-start mb-8 select-none">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-full transition-all duration-200 border cursor-pointer ${
                  selectedCategory === null 
                    ? 'bg-[#6D5443] border-transparent text-white shadow-xs' 
                    : 'bg-white border-[#EAE4DC] text-[#8C7864] hover:border-[#D3C9BE]'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[10px] font-bold uppercase tracking-wider py-1.5 px-4 rounded-full transition-all duration-200 border cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-[#6D5443] border-transparent text-white shadow-xs' 
                      : 'bg-white border-[#EAE4DC] text-[#8C7864] hover:border-[#D3C9BE]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grid de produtos */}
          {filteredAndSortedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#EAE4DC] rounded-[24px] shadow-xs px-4">
              <ShoppingBag size={32} className="text-[#8C7864]/40 mx-auto mb-4" />
              <p className="text-sm font-medium text-[#3A312D] mb-1">Nenhum produto encontrado</p>
              <p className="text-xs text-[#8C7864] font-light">Tente alterar os termos da busca ou os filtros aplicados.</p>
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

    </div>
  );
}
