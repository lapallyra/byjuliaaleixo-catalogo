import React, { useState, useEffect } from 'react';
import { Search, Heart, Info, Package, Mail, User, Sparkles, ArrowRight, ArrowRightLeft, Gift, ShoppingBag, Eye, Star, ChevronDown, X } from 'lucide-react';
import { AppConfig, Product, SiteSettings, CompanyId, Campaign } from '../types';
import { useAuth } from './AuthProvider';
import { useAdminOrchestrator } from './AdminOrchestratorSystem';
import { subscribeToAllSettings, subscribeToApprovedFeedbacks, subscribeToCampaigns } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { ProductCard } from './ui/ProductCard';
import { FeaturedProductCard } from './Catalog/FeaturedProductCard';
import { LogoAndSignature } from './ui/LogoAndSignature';
import { themes, getTheme } from '../lib/theme';
import { motion, AnimatePresence } from 'motion/react';
import { CommemorativeBanner } from './Catalog/CommemorativeBanner';
import { PromotionalBanner } from './PromotionalBanner';

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
}

const DelicateFlourish = () => (
  <div className="flex items-center justify-center py-6 opacity-80 select-none">
    <svg width="240" height="24" viewBox="0 0 240 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#cca062]">
      <path d="M10 12H80M160 12H230" stroke="currentColor" strokeWidth="0.75" strokeLinecap="round"/>
      <path d="M120 4C115.5 4 110.5 8 110.5 12C110.5 16 115.5 20 120 20C124.5 20 129.5 16 129.5 12C129.5 8 124.5 4 120 4Z" stroke="currentColor" strokeWidth="0.75" fill="none"/>
      <path d="M100 12C100 9 104 6 107 8C110 10 110 12 110 12C110 12 110 14 107 16C104 18 100 15 100 12Z" stroke="currentColor" strokeWidth="0.75" fill="none"/>
      <path d="M140 12C140 15 136 18 133 16C130 14 130 12 130 12C130 12 130 10 133 8C136 6 140 9 140 12Z" stroke="currentColor" strokeWidth="0.75" fill="none"/>
      <circle cx="120" cy="12" r="2" fill="currentColor"/>
    </svg>
  </div>
);

// Wrapper for sections to enforce soft transition gradients
const SectionWrapper = ({ children, className = "", id, noPadding = false }: { children: React.ReactNode, className?: string, id?: string, noPadding?: boolean }) => (
  <section id={id} className={`w-full ${noPadding ? '' : 'py-10 md:py-14'} px-4 md:px-8 ${className}`}>
    <div className="max-w-[1850px] mx-auto">
      {children}
    </div>
  </section>
);

const SeamlessDivider = ({ from, to, className = "" }: { from: string, to: string, className?: string }) => (
  <div 
    className={`w-full h-20 md:h-28 pointer-events-none ${className}`} 
    style={{ background: `linear-gradient(to bottom, ${from}, ${to})` }} 
  />
);

export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [] }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const orchestrator = useAdminOrchestrator();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [searchCode, setSearchCode] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);
  const [activeHomeFaq, setActiveHomeFaq] = useState<number | null>(null);
  const [realFeedbacks, setRealFeedbacks] = useState<any[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

  // Filter campaigns for home
  const homeCampaigns = React.useMemo(() => {
    const now = new Date();
    return activeCampaigns
      .filter(c => 
        c.active && 
        c.targetPages?.includes('home') &&
        (!c.startDate || new Date(c.startDate) <= now) &&
        (!c.endDate || new Date(c.endDate) >= now)
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }, [activeCampaigns]);

  // Main banner campaign
  const mainBannerCampaign = React.useMemo(() => 
    homeCampaigns.find(c => c.type === 'banner' || c.type === 'seasonal_campaign'), 
  [homeCampaigns]);

  // Featured products from campaigns
  const campaignFeaturedProducts = React.useMemo(() => {
    const highlightCampaigns = homeCampaigns.filter(c => c.type === 'product_highlight' || c.type === 'carousel');
    const productIds = highlightCampaigns.flatMap(c => c.items || []);
    if (productIds.length > 0) {
      return allProducts.filter(p => productIds.includes(p.id));
    }
    return null;
  }, [homeCampaigns, allProducts]);

  // Anti-printscreen & Ctrl+P prevention effect
  useEffect(() => {
    const isUserAdmin = isAdmin || (user as any)?.role === "admin";
    if (isUserAdmin) return;

    // Prevent Ctrl + P and Meta / Cmd + P
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'p') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isAdmin, user]);

  const feedbacksDynamic = React.useMemo(() => {
    if (realFeedbacks.length > 0) {
      return realFeedbacks
        .map(fb => ({
          stars: fb.stars || 5,
          text: fb.text ? (fb.text.startsWith('"') ? fb.text : `"${fb.text}"`) : "",
          author: fb.name || "Cliente",
          atelier: "Depoimento Real",
          colorTagBg: 'bg-emerald-50',
          colorTagText: 'text-emerald-600'
        }));
    }

    // Default fallbacks if no approved feedbacks yet
    return [
      {
        stars: 5,
        text: "\"O atendimento da Júlia é simplesmente impecável. Cada detalhe do meu presente foi pensado com muito carinho e a embalagem é um sonho!\"",
        author: "Camila Fernandes",
        atelier: "Atendimento",
        colorTagBg: 'bg-rose-50',
        colorTagText: 'text-rose-600'
      },
      {
        stars: 5,
        text: "\"Estou apaixonada pelo meu kit. A qualidade é altíssima e a personalização ficou exatamente como eu imaginei. Recomendo muito!\"",
        author: "Mariana Costa",
        atelier: "Qualidade",
        colorTagBg: 'bg-amber-50',
        colorTagText: 'text-amber-600'
      },
      {
        stars: 5,
        text: "\"Melhor experiência de compra que já tive. A atenção aos detalhes e o cuidado com que tudo é feito é perceptível em cada peça.\"",
        author: "Beatriz Santos",
        atelier: "Experiência",
        colorTagBg: 'bg-blue-50',
        colorTagText: 'text-blue-600'
      }
    ];
  }, [realFeedbacks]);

  useEffect(() => {
    if (feedbacksDynamic.length === 0) return;
    const timer = setInterval(() => {
      setActiveFeedbackIndex((prev) => (prev + 1) % feedbacksDynamic.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [feedbacksDynamic.length]);

  useEffect(() => {
    setActiveFeedbackIndex(0);
  }, [feedbacksDynamic.length]);

  useEffect(() => {
    const unsubSettings = subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
    
    const unsubFeedbacks = subscribeToApprovedFeedbacks((results) => {
      setRealFeedbacks(results);
    });

    const unsubCampaigns = subscribeToCampaigns((results) => {
      setActiveCampaigns(results);
    });

    return () => {
      unsubSettings();
      unsubFeedbacks();
      unsubCampaigns();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setShowScrollIndicator(false);
      } else {
        setShowScrollIndicator(true);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredProducts = React.useMemo(() => {
    return [...allProducts]
      .filter(p => p.isVisible !== false && !p.isKit)
      .sort((a, b) => {
        const clicksA = a.clicksCount || 0;
        const clicksB = b.clicksCount || 0;
        if (clicksB !== clicksA) return clicksB - clicksA;
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      })
      .slice(0, 8);
  }, [allProducts]);

  const kits = React.useMemo(() => {
    return allProducts.filter(p => p.isKit && p.isVisible !== false).slice(0, 4);
  }, [allProducts]);

  const ateliers = [
    {
      id: 'pallyra',
      name: 'La Pallyra',
      subtitle: 'Papelaria Fina',
      details: 'Papelaria de Afeto',
      description: 'Agendas, planners e mimos de papelaria fina feitos inteiramente à mão com materiais de alta qualidade.',
      route: '/lapallyra',
      accentColor: '#cca062',
      emoji: '📓',
      tag: 'Ateliê de Cartonagem'
    },
    {
      id: 'guennita',
      name: 'com amor, Guennita',
      subtitle: 'Flores de Cetim',
      details: 'Flores de Cetim',
      description: 'Flores eternas montadas pétala por pétala com acabamento impecável de alto padrão.',
      route: '/comamorguennita',
      accentColor: '#5b2122',
      emoji: '👑',
      tag: 'Ateliê de Flores'
    },
    {
      id: 'mimada',
      name: 'Mimada Sim',
      subtitle: 'Mimos Premium',
      details: 'Mimos Premium',
      description: 'Lembranças repletas de criatividade e alegria para celebrações inesquecíveis.',
      route: '/mimadasim',
      accentColor: '#c96b71',
      emoji: '💝',
      tag: 'Ateliê de Lembranças'
    },
    {
      id: 'tuttymimo',
      name: 'Tutty Mimo',
      subtitle: 'Maternidade & Infância',
      details: 'Maternidade & Primeira Infância',
      description: 'Tudo o que você precisa desde os dois tracinhos até a primeira infância do seu bebê, acessórios delicados para cada fase, com toque de ternura.',
      route: '/tuttymimo',
      accentColor: '#d4bda1',
      emoji: '🍼',
      tag: 'Ateliê de Costura'
    }
  ];

  return (
    <div className="home-root bg-[#FCFAF7] min-h-[100dvh] w-full relative font-tahoma text-[#5B4636] selection:bg-[#F9F6EF] selection:text-[#5B4636] overflow-x-hidden antialiased">
      
      {/* LUXURY ACTIVE NAVIGATION BAR */}
      <div className="w-full border-b border-[#C8A165]/20 bg-[#FCFAF7]/90 backdrop-blur-md sticky top-0 z-50 shadow-xs">
        <div className="max-w-[1850px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Centered navigation links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-[#1F1F1F] tracking-[0.1em] font-medium text-[11px] sm:text-[12px] uppercase select-none font-poppins">
            <a 
              href="#ateliers" 
              className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em]"
            >
              ateliês
            </a>
            
            <button 
              onClick={() => navigate('/kit-meukit')} 
              className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none uppercase font-semibold tracking-[0.12em] text-[11px] sm:text-[12px]"
            >
              monte seu kit
            </button>
            
            <a 
              href="#sobre-julia" 
              className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em]"
            >
              sobre nós
            </a>
            
            <a 
              href="#feedbacks" 
              className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em]"
            >
              feedback
            </a>
            
            <button 
              onClick={() => navigate('/listadepresentes')} 
              className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none uppercase font-semibold tracking-[0.12em] text-[11px] sm:text-[12px]"
            >
              lista de presentes
            </button>
          </nav>

          {/* Search/Tracking capsule in white background - Elegant, spacious, and legible */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
              } else {
                navigate('/document');
              }
            }}
            className="flex items-center gap-2.5 bg-[#FDFCF0] border border-[#EAE4DC] rounded-full px-5 py-2.5 text-xs text-[#555555] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#C2B7A8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 w-full sm:w-72 md:w-80"
          >
            <Search size={14} strokeWidth={2} className="text-[#8C7864]/80 shrink-0" />
            <input 
              type="text" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Encontre seu pedido aqui..." 
              className="bg-transparent focus:outline-none w-full text-[#1F1F1F] placeholder-[#8C7864]/60 font-medium text-[13px] border-none p-0 tracking-[0.03em]" 
            />
          </form>
        </div>
      </div>

      {/* DYNAMIC PROMOTIONAL BANNER */}
      <div className="w-full">
        <PromotionalBanner />
      </div>

      {/* DYNAMIC COMMEMORATIVE BANNER */}
      <div className="w-full bg-[#FCFAF7] pt-2 pb-6 animate-in fade-in duration-700 ease-out select-none">
        <div className="max-w-[1850px] mx-auto px-4 md:px-8">
          <CommemorativeBanner allProducts={allProducts} />
        </div>
      </div>

      {/* ROMANTIC TITLE */}
      <div className="text-center py-8 px-2 animate-fade-in duration-1000 ease-in-out bg-[#FCFAF7] select-none">
        <h2 className="font-mea-culpa text-2xl sm:text-3xl md:text-4xl text-[#3D2E24] font-normal leading-tight tracking-normal max-w-3xl mx-auto">
          Encontre o presente perfeito para deixar o seu momento inesquecível.
        </h2>
      </div>
      
      {/* ATELIERS */}
      <SectionWrapper id="ateliers" className="bg-[#FCFAF7]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-24 max-w-[1850px] mx-auto px-4">
          {ateliers.map((atelier) => {
            const getAtelierThemeColor = (id: string) => {
              switch (id) {
                case 'pallyra': return '#1A1A1A';
                case 'guennita': return '#6D0D0D'; // Borgonha
                case 'mimada': return '#D4AF37';
                case 'tuttymimo': return '#CCA062';
                default: return '#D4AF37';
              }
            };

            const themeColor = getAtelierThemeColor(atelier.id);

            return (
              <div 
                key={atelier.id}
                className="flex flex-col items-center group cursor-pointer perspective-1000"
                onClick={() => navigate(atelier.route)}
              >
                {/* 3D Flip Card Container */}
                <motion.div 
                  className="relative w-full max-w-[260px] aspect-[4/5] preserve-3d"
                  whileHover={{ scale: 1.05, rotateY: 180 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  {/* FRONT: Logo/Isotipo */}
                  <div className="absolute inset-0 backface-hidden bg-white rounded-2xl p-1.5 shadow-sm border border-[#D4AF37]/10 group-hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-shadow duration-500 overflow-hidden">
                    <div className="w-full h-full rounded-xl overflow-hidden bg-[#F9F6EF] relative flex items-center justify-center">
                      {customSettings[atelier.id]?.store_isotipo ? (
                        <ImageWithFallback 
                          src={customSettings[atelier.id]?.store_isotipo} 
                          alt={atelier.name} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-6xl filter drop-shadow-sm select-none">
                          {atelier.emoji}
                        </span>
                      )}
                      {/* Subtle elegant gloss overlay */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-black/5 opacity-30" />
                    </div>
                  </div>

                  {/* BACK: Description */}
                  <div 
                    className="absolute inset-0 backface-hidden rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl border-2"
                    style={{ 
                      backgroundColor: themeColor,
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      transform: 'rotateY(180deg)'
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <h4 className="font-mea-culpa text-2xl text-white mb-4 drop-shadow-sm">
                        {customSettings[atelier.id]?.store_name || atelier.name}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-white/90 leading-relaxed font-light line-clamp-6 px-2">
                        {atelier.description}
                      </p>
                      <div className="mt-6 py-1.5 px-4 rounded-full border border-white/30 text-[9px] uppercase tracking-[0.2em] text-white font-bold hover:bg-white hover:text-[#1F1F1F] transition-all duration-300">
                        Ver Vitrine
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Atelier Name - Outside and Prominent */}
                <div className="mt-10 text-center relative w-full">
                  <motion.h3 
                    className="text-[#3D2E24] font-mea-culpa text-4xl sm:text-5xl md:text-[48px] tracking-tight leading-none transition-colors duration-500"
                    style={{ '--hover-color': themeColor } as any}
                  >
                    <span className="group-hover:text-[var(--hover-color)] transition-colors duration-500">
                      {customSettings[atelier.id]?.store_name || atelier.name}
                    </span>
                  </motion.h3>
                  
                  {/* Delicate decorative dash */}
                  <div 
                    className="h-[1px] w-8 mx-auto mt-4 transition-all duration-700 group-hover:w-20"
                    style={{ backgroundColor: themeColor, opacity: 0.3 }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <button 
            onClick={() => navigate('/atelies')}
            className="group inline-flex flex-col items-center gap-2 cursor-pointer outline-none"
          >
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#C8A165] group-hover:text-[#5B4636] transition-colors duration-500">conheça nossos ateliês</span>
            <div className="h-[1px] w-12 bg-[#C8A165]/30 group-hover:w-24 group-hover:bg-[#5B4636] transition-all duration-500" />
          </button>
        </div>
      </SectionWrapper>

      <SeamlessDivider from="#FCFAF7" to="#FFFFFF" />

      {/* COMO FUNCIONA */}
      <SectionWrapper id="como-funciona" className="bg-[#FFFFFF]">
        <div className="max-w-[1850px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-mea-culpa text-[#3D2E24] text-3xl sm:text-4xl leading-tight font-normal tracking-normal">
              Como funciona
            </h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1850px] mx-auto">
            
            {/* STEP 1 */}
            <div className="text-center group p-6 bg-[#FFFFFF] border border-[#C8A165]/20 rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#C8A165]/40 transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                01
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Escolha seu presente
              </h4>
              <p className="text-[11px] text-[#333333] font-normal leading-relaxed max-w-[200px]">
                Navegue pelas identidades únicas de cada um dos nossos ateliês e encontre a estética ideal.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="text-center group p-6 bg-white border border-[#EAE4DC] rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                02
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Personalize
              </h4>
              <p className="text-[11px] text-[#333333] font-normal leading-relaxed max-w-[200px]">
                Selecione um de nossos kits prontos ou crie uma composição inteiramente personalizada do seu jeito.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="text-center group p-6 bg-white border border-[#EAE4DC] rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                03
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Montagem
              </h4>
              <p className="text-[11px] text-[#333333] font-normal leading-relaxed max-w-[200px]">
                Produzimos cada detalhe com cuidado especial, à mão, unindo afeto, fragrância e dedicação exclusiva.
              </p>
            </div>

            {/* STEP 4 */}
            <div className="text-center group p-6 bg-white border border-[#EAE4DC] rounded-none shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                04
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Entrega
              </h4>
              <p className="text-[11px] text-[#333333] font-normal leading-relaxed max-w-[200px]">
                Receba a embalagem finalizada com carinho ou envie diretamente para presentear quem você ama.
              </p>
            </div>

          </div>
        </div>
      </SectionWrapper>

      <SeamlessDivider from="#FFFFFF" to="#F9F6EF" />

      {/* KITS PRONTOS */}
      <SectionWrapper id="kits" className="bg-[#F9F6EF]">
        <div className="max-w-[1500px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#3D2E24] tracking-normal mb-3">Kits Prontos</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto"></div>
            <p className="text-xs text-[#1F1F1F] font-normal max-w-md mx-auto leading-relaxed mt-4">
              Combinações escolhidas a dedo de produtos prontos para encantar e tornar o seu momento inesquecível.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1500px] mx-auto">
            {kits.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <ProductCard
                  key={`skeleton-${i}`}
                  isLoading={true}
                  product={{} as any}
                />
              ))
            ) : (
              kits.map((kit) => (
                <ProductCard
                  key={kit.id}
                  product={kit}
                  theme={getTheme(kit.company)}
                  onAddToCart={() => navigate('/kits')}
                  onClick={() => navigate('/kits')}
                />
              ))
            )}
          </div>
        </div>
      </SectionWrapper>
      
      <DelicateFlourish />

      {/* MONTE SEU KIT */}
      <SectionWrapper className="bg-[#F9F6EF]">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 text-center">
          <div className="py-10 flex flex-col items-center justify-center">
            <h3 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#1F1F1F] tracking-normal mb-4">
              Monte o Seu Próprio Kit
            </h3>
            <p className="text-xs sm:text-sm text-[#333333] leading-relaxed font-normal max-w-2xl mx-auto mb-6">
              Crie uma combinação personalizada única, adicionando os mimos artesanais preferidos de nossos ateliês e inserindo um cartão com mensagem gravada sob medida. Rápido, objetivo e acolhedor!
            </p>
            <button
               onClick={() => navigate('/kit-meukit')}
               className="h-[48px] px-10 rounded-full bg-[#1F1F1F] hover:bg-[#cca062] text-white hover:text-[#1F1F1F] text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm transition-all duration-300 ease-in-out cursor-pointer inline-flex items-center gap-2 font-poppins"
            >
              CRIAR MEU KIT <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </SectionWrapper>

      <SeamlessDivider from="#F9F6EF" to="#FCFAF7" />

      {/* FEEDBACK */}
      <SectionWrapper id="feedbacks" className="bg-[#FCFAF7]">
        <div className="max-w-[1850px] mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#1F1F1F] tracking-normal mb-3">Feedback que Amamos</h2>
            <p className="text-xs text-[#333333] font-normal max-w-md mx-auto leading-relaxed mb-3">
              Clientes que escolheram presentear com o coração.
            </p>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mb-3"></div>
          </div>

          <div className="max-w-[1850px] mx-auto relative px-2 text-center select-none min-h-[200px] flex flex-col justify-between">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-center gap-1 text-[#cca062] mb-4">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-xs sm:text-sm font-light text-[#1F1F1F] leading-relaxed italic mb-6">
                {feedbacksDynamic[activeFeedbackIndex]?.text || ""}
              </p>
              <div className="flex items-center justify-center pt-4 border-t border-[#EAE4DC]/20">
                <span className="font-poppins font-semibold text-xs text-[#1F1F1F]">{feedbacksDynamic[activeFeedbackIndex]?.author || "Cliente"}</span>
              </div>
            </div>

            {/* CAROUSEL BUTTON DOTS */}
            <div className="flex justify-center items-center gap-2 mt-4">
              {feedbacksDynamic.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeedbackIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-150 outline-none cursor-pointer ${
                    idx === activeFeedbackIndex ? "bg-[#cca062] w-5" : "bg-[#cca062]/20 hover:bg-[#cca062]/40"
                  }`}
                  aria-label={`Visualizar depoimento ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </SectionWrapper>

      <SeamlessDivider from="#FCFAF7" to="#F9F6EF" />

      {/* SEÇÃO EDITORIAL: CONEXÃO COM A MARCA - MINHA HISTÓRIA (Step 7) */}
      <SectionWrapper id="sobre-julia" className="bg-[#F9F6EF] relative overflow-hidden">
        <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full bg-[#FDFCF0]/50 blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1500px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* LADO ESQUERDO: Portrait Editorial Photograph */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-[380px] rounded-2xl overflow-hidden shadow-md aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5] transition-transform duration-150 hover:scale-[1.01]">
                <ImageWithFallback
                  src="https://i.imgur.com/KRLgtno.jpg"
                  alt="Júlia Aleixo no Ateliê"
                  className="w-full h-full object-cover"
                  isThumbnail={false}
                />
              </div>
            </div>

            {/* LADO DIREITO: Emotional Narrative */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-mea-culpa font-normal text-[#1F1F1F] tracking-normal leading-[1.15] mb-4">
                Por trás de cada detalhe
              </h2>
              
              <div className="h-[1px] w-12 bg-[#cca062]/40 mb-4 block lg:hidden"></div>

              <div className="space-y-3 max-w-xl">
                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] font-normal leading-[1.7]">
                  Acredito que os momentos mais valiosos da vida não são medidos pelo tempo, mas pelo afeto que neles depositamos. No ateliê, cada detalhe é desenhado para ser uma extensão desse sentimento: desde a curadoria sensível das matérias-primas até o toque feito inteiramente à mão.
                </p>
                <p className="font-sans text-[15px] sm:text-[16px] text-[#333333] font-normal leading-[1.7]">
                  Cada presente aberto é o começo de uma nova história, e cada embalagem concluída carrega o peso de palavras que merecem durar. Criar com intenção é o meu propósito, unindo a sutileza das pequenas coisas à eternidade daquilo que permanece no coração.
                </p>
              </div>

              <div className="mt-8 mb-8 flex flex-col items-center lg:items-start gap-1 select-none">
                <span className="font-mea-culpa text-[#cca062] text-[28px] lg:text-[34px] leading-tight font-normal">
                  Com carinho,
                </span>
                <span className="font-mea-culpa text-[#1F1F1F] text-[34px] lg:text-[40px] leading-none font-normal -mt-1 lg:pl-4">
                  Júlia Aleixo
                </span>
              </div>

              <button
                onClick={() => setIsStoryOpen(true)}
                className="h-[46px] px-8 rounded-full border border-[#EAE4DC] bg-transparent text-[#1F1F1F] font-poppins font-semibold text-[11px] uppercase tracking-[0.14em] transition-all duration-150 hover:bg-[#1F1F1F] hover:text-white hover:border-[#1F1F1F] shadow-sm cursor-pointer flex items-center justify-center whitespace-nowrap"
              >
                Conheça minha história
              </button>

            </div>

          </div>
        </div>
      </SectionWrapper>

      <SeamlessDivider from="#F9F6EF" to="#FFFFFF" />

      {/* FAQ SECTION (Step 6.5) - NOW MOVED TO THE END OF THE PAGE */}
      <SectionWrapper id="faq" className="scroll-mt-24 bg-[#FFFFFF]">
        <div className="max-w-[1500px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-mea-culpa text-3xl sm:text-4xl text-[#1F1F1F] font-normal tracking-normal mb-3">
              Perguntas Frequentes
            </h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3"></div>
          </div>

          <div className="space-y-4 max-w-[1200px] mx-auto">
            {[
              {
                q: "Posso escolher produtos de ateliês diferentes?",
                a: "Sim! Você pode navegar e adicionar no mesmo pedido mimos de qualquer um de nossos quatro ateliês exclusivos (La Pallyra, Guennita, Mimada Sim e Tutty Mimo) de forma unificada."
              },
              {
                q: "Os produtos são feitos à mão?",
                a: "Sim, cada detalhe é produzido artesanalmente com dedicação exclusiva, afeto e cuidado impecável em nosso próprio ateliê."
              },
              {
                q: "Como funcionam os kits prontos?",
                a: "Os kits prontos são combinações harmoniosas criadas por nós. Mas se você preferir, também pode utilizar o 'Monte seu Kit' para criar uma composição inteiramente do seu jeito."
              },
              {
                q: "Qual o prazo de produção?",
                a: "Por serem artesanais, o prazo de produção varia de acordo com cada item e ateliê, sendo sempre informado detalhadamente na página de cada produto."
              }
            ].map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white border border-[#EAE4DC]/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-xs"
              >
                <button
                  onClick={() => setActiveHomeFaq(activeHomeFaq === idx ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 outline-none cursor-pointer"
                >
                  <span className="font-poppins font-medium text-xs sm:text-[13px] text-[#1F1F1F] uppercase tracking-wider">{faq.q}</span>
                  <ChevronDown 
                    size={16} 
                    className={`text-[#cca062] shrink-0 transition-transform duration-300 ${activeHomeFaq === idx ? 'rotate-180' : ''}`} 
                    strokeWidth={2.5}
                  />
                </button>
                
                <AnimatePresence>
                  {activeHomeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-5 pt-1 text-xs sm:text-[13px] text-[#666666] font-light leading-relaxed border-t border-[#EAE4DC]/30">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </SectionWrapper>

      {/* STORY MODAL DIALOG - EXCLUSIVELY STYLED */}
      {isStoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsStoryOpen(false)}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-200 ease-out animate-fade-in duration-200" 
          />
          
          <div className="bg-white rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-[#EAE4DC] p-6 sm:p-10 shadow-lg scrollbar-thin animate-fade-in">
            <button 
              onClick={() => setIsStoryOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#EAE4DC] bg-white flex items-center justify-center text-[#cca062] hover:bg-[#1F1F1F] hover:text-white hover:border-[#1F1F1F] transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>

            <div className="flex flex-col items-center text-center mt-4">
              <span className="font-mea-culpa text-[#cca062] text-[38px] leading-none select-none mb-1">
                Julia Aleixo
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#cca062] font-poppins block mb-6">
                Amor em detalhes à mão
              </span>

              <div className="space-y-5 font-sans text-sm text-[#666666] font-light leading-relaxed max-w-xl text-justify px-2">
                <p>
                  Os Presentes Personalizados nasceram do desejo profundo de resgatar o valor do tempo e do afeto no ato de presentear. Em um mundo onde tudo caminha de forma apressada, escolhi ir na direção oposta: a do fazer manual, do respiro cuidadoso e da presença em cada laço de fita.
                </p>
                <p>
                  Formada com a paixão pela estética clássica e pela sofisticação dos papéis e fragrâncias, reuni sob estes quatros ateliês que dão vida às minhas maiores aspirações de criação.
                </p>
                <p>
                  Em <strong>La Pallyra</strong>, a importância de dar valor ao dia a dia, de lembrar que podemos sim ter um momento nosso ao olhar para agenda com o seu nome, calendário do seu jeitinho. Em <strong>com amor, Guennita</strong>, celebramos a delicada sofisticação de presentear com o extraordinário, para guardar no coração eternamente. Em <strong>Mimada Sim</strong>, são feitos mimos atenciosos para o seu evento, seja ele aniversário, comercial, chá de bebê, chá revelação, casamento, qualquer evento estaremos prontos para fazer o seu mimo a sua escolha. Em <strong>Tutty Mimo</strong>, é o afeto de forma pura, desde quando aparece os dois tracinhos até a primeira infância do seu amor.
                </p>
                <p>
                  Minha maior recompensa é saber que cada peça que sai torna-se parte de um momento inesquecível na vida de alguém. Estar aqui é um convite para desacelerar, respirar e presentear quem você ama com a mais sincera e bela das intenções.
                </p>
              </div>

              <div className="mt-10 mb-2 font-mea-culpa text-[#cca062] text-[32px] leading-none select-none">
                Júlia Aleixo
              </div>
              <span className="text-[10px] tracking-widest text-[#cca062]/50 font-poppins uppercase">
                Ateliê de Presentes Finos
              </span>
            </div>
          </div>
        </div>
      )}

      <SeamlessDivider from="#FFFFFF" to="#FCFAF7" />

      {/* FRASE INSTITUCIONAL (Step 8) */}
      <SectionWrapper id="institucional-frase-final" className="bg-[#FCFAF7] flex flex-col items-center justify-center">
        <div className="max-w-[1850px] mx-auto text-center select-none">
          <p className="font-mea-culpa text-2xl sm:text-3xl md:text-4xl text-[#1F1F1F] leading-relaxed md:leading-[1.8] font-normal tracking-wide text-center ">
            Quatro ateliês. Cada detalhe feito à mão com um só propósito: transformar cada momento em algo inesquecível, feliz e eterno.
          </p>
        </div>
      </SectionWrapper>
    </div>
  );
};

