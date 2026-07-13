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

export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [] }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const orchestrator = useAdminOrchestrator();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [searchCode, setSearchCode] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeFeedbackIndex, setActiveFeedbackIndex] = useState(0);
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
          text: `"${fb.text}"`,
          author: fb.name || "Cliente",
          atelier: "Depoimento Real",
          colorTagBg: 'bg-emerald-50',
          colorTagText: 'text-emerald-600'
        }));
    }

    return [];
  }, [realFeedbacks]);

  useEffect(() => {
    if (feedbacksDynamic.length === 0) return;
    const timer = setInterval(() => {
      setActiveFeedbackIndex((prev) => (prev + 1) % feedbacksDynamic.length);
    }, 5000);
    return () => clearInterval(timer);
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
    <div className="home-root bg-white min-h-[100dvh] w-full relative font-tahoma text-[#1F1F1F] selection:bg-[#EAE4DC] selection:text-[#1F1F1F] overflow-x-hidden antialiased">
      
      {/* HUGE CENTERED LOGO */}
      <div className="w-full bg-white py-6 flex justify-center items-center border-b border-[#EAE4DC]/50">
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer hover:opacity-90 transition-all duration-150">
          <LogoAndSignature small={false} />
        </div>
      </div>

      {/* LUXURY ACTIVE NAVIGATION BAR */}
      <div className="w-full border-b border-[#EAE4DC]/50 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
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
              onClick={() => navigate('/listadepresentes-info')} 
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
            className="flex items-center gap-2.5 bg-[#FCFAF7] border border-[#EAE4DC] rounded-full px-5 py-2.5 text-xs text-[#555555] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#C2B7A8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 w-full sm:w-72 md:w-80"
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

      {/* DYNAMIC COMMEMORATIVE BANNER */}
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 my-6 animate-in fade-in duration-150">
        <CommemorativeBanner allProducts={allProducts} />
      </div>

      {/* BEAUTIFUL ROMANTIC CENTRAL TITLE */}
      <div className="text-center py-12 md:py-16 px-4 animate-fade-in bg-white select-none overflow-x-hidden">
        <h2 className="font-mea-culpa text-2xl sm:text-3xl md:text-4xl lg:text-[42px] text-[#1F1F1F] font-normal leading-tight tracking-normal max-w-4xl mx-auto px-1">
          Encontre o presente perfeito para deixar o seu momento inesquecível.
        </h2>
      </div>

      {/* BOUTIQUE ATELIERS VERTICAL CAPSULE CARDS (WITH 3D CARD FLIP) */}
      <section id="ateliers" className="scroll-mt-24 pb-16 px-4 sm:px-6 max-w-[1600px] mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {ateliers.map((atelier) => {
            const getAtelierCardTheme = (id: string) => {
              switch (id) {
                case 'pallyra':
                  return {
                    frontBg: 'bg-white',
                    frontBorder: 'border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)]',
                    frontIsotipoBg: 'bg-[#fafafa] border-neutral-100',
                    frontLogoFilter: '',
                    backBg: 'bg-[#121212]',
                    backBorder: 'border-[#cca062]/40 shadow-[0_8px_24px_rgba(204,160,98,0.15)]',
                    backDescText: 'text-neutral-300',
                    backTitleText: 'text-[#cca062]',
                    backButtonClass: 'bg-[#cca062] hover:bg-white text-neutral-950 hover:text-black border border-transparent',
                    nameHoverText: 'group-hover:text-[#cca062]',
                  };
                case 'guennita':
                  return {
                    frontBg: 'bg-white',
                    frontBorder: 'border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)]',
                    frontIsotipoBg: 'bg-[#fafafa] border-neutral-100',
                    frontLogoFilter: '',
                    backBg: 'bg-[#4a1213]',
                    backBorder: 'border-[#cca062]/40 shadow-[0_8px_24px_rgba(204,160,98,0.15)]',
                    backDescText: 'text-neutral-200',
                    backTitleText: 'text-[#cca062]',
                    backButtonClass: 'bg-[#cca062] hover:bg-white text-neutral-950 hover:text-[#4a1213] border border-transparent',
                    nameHoverText: 'group-hover:text-[#cca062]',
                  };
                case 'mimada':
                  return {
                    frontBg: 'bg-white',
                    frontBorder: 'border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)]',
                    frontIsotipoBg: 'bg-[#fafafa] border-neutral-100',
                    frontLogoFilter: '',
                    backBg: 'bg-[#c96b71]',
                    backBorder: 'border-[#c96b71]/20 shadow-[0_8px_24px_rgba(201,107,113,0.15)]',
                    backDescText: 'text-white/95',
                    backTitleText: 'text-white',
                    backButtonClass: 'bg-white text-[#c96b71] hover:bg-[#fdf4f5] border border-transparent',
                    nameHoverText: 'group-hover:text-[#c96b71]',
                  };
                case 'tuttymimo':
                default:
                  return {
                    frontBg: 'bg-white',
                    frontBorder: 'border-neutral-200/60 shadow-[0_4px_16px_rgba(0,0,0,0.02)]',
                    frontIsotipoBg: 'bg-[#fafafa] border-neutral-100',
                    frontLogoFilter: '',
                    backBg: 'bg-gradient-to-b from-[#FAF9F6] to-[#FFF0F2]',
                    backBorder: 'border-[#ebd9cb] shadow-[0_8px_24px_rgba(235,217,203,0.3)]',
                    backDescText: 'text-[#6d5443]/80',
                    backTitleText: 'text-[#cca062]',
                    backButtonClass: 'bg-[#6d5443] hover:bg-[#cca062] hover:text-white text-white border border-transparent',
                    nameHoverText: 'group-hover:text-[#cca062]',
                  };
              }
            };

            const cardTheme = getAtelierCardTheme(atelier.id);

            return (
              <div 
                key={atelier.id}
                onClick={() => navigate(atelier.route)}
                onMouseEnter={() => {
                  orchestrator.setHoverActive(true);
                  orchestrator.registerInteraction();
                }}
                onMouseLeave={() => {
                  orchestrator.setHoverActive(false);
                }}
                onFocus={() => {
                  orchestrator.setHoverActive(true);
                  orchestrator.registerInteraction();
                }}
                onBlur={() => {
                  orchestrator.setHoverActive(false);
                }}
                className="flex flex-col items-center gap-4 group cursor-pointer outline-none"
              >
                {/* 3D Polaroid Flipping Card Wrapper */}
                <div 
                  tabIndex={0}
                  className="relative w-full aspect-[4/5] perspective-1000 rounded-2xl focus:ring-2 focus:ring-[#cca062]"
                >
                  <div className="relative w-full h-full transition-transform duration-500 preserve-3d group-hover:rotate-y-180 group-focus:rotate-y-180 shadow-md rounded-2xl">
                    
                    {/* FRONT FACE: Polaroid Image Area (Neutral Base State) */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden rounded-2xl border p-4 pb-12 flex flex-col items-center justify-start shadow-[0_4px_12px_rgba(0,0,0,0.02)] transition-all duration-300 ${cardTheme.frontBg} ${cardTheme.frontBorder}`}>
                      {/* Photo Area (Mask) - Single visual frame */}
                      <div className="w-full aspect-square rounded-xl bg-[#fafafa] border border-neutral-100 overflow-hidden relative flex items-center justify-center p-0 shadow-[inset_0_1px_4px_rgba(0,0,0,0.02)]">
                        {customSettings[atelier.id]?.store_isotipo ? (
                          <ImageWithFallback 
                            src={customSettings[atelier.id]?.store_isotipo} 
                            alt={atelier.name} 
                            className="w-full h-full object-cover transition-transform duration-[350ms] group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-6xl filter drop-shadow-sm select-none transition-transform duration-[350ms] group-hover:scale-110">
                            {atelier.emoji}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* BACK FACE (FLIPPED): Brand Identity state shown on hover/interaction only */}
                    <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl border p-6 flex flex-col items-center justify-between shadow-[0_8px_20px_rgba(0,0,0,0.04)] transition-all duration-300 ${cardTheme.backBg} ${cardTheme.backBorder}`}>
                      <div className="flex-grow flex flex-col items-center justify-center text-center">
                        <span className={`font-mea-culpa text-2xl font-bold mb-4 ${cardTheme.backTitleText}`}>
                          {customSettings[atelier.id]?.store_name || atelier.name}
                        </span>
                        <p className={`text-[11px] sm:text-xs leading-relaxed font-light line-clamp-4 px-1 ${cardTheme.backDescText}`}>
                          {atelier.description}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(atelier.route);
                        }}
                        className={`w-full text-[9px] font-bold uppercase tracking-[0.25em] py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm ${cardTheme.backButtonClass}`}
                      >
                        Vitrine
                      </button>
                    </div>

                  </div>
                </div>

                {/* NAME OF THE ATELIER: Below the card (below the moldura) */}
                <div className="text-center mt-1 select-none pointer-events-none">
                  <h3 className={`font-mea-culpa text-3xl text-neutral-800 tracking-wide transition-colors duration-300 ${cardTheme.nameHoverText}`}>
                    {customSettings[atelier.id]?.store_name || atelier.name}
                  </h3>
                  <span className="text-[9.5px] font-semibold tracking-[0.2em] text-[#cca062] uppercase block mt-1">
                    {atelier.subtitle}
                  </span>
                </div>

              </div>
            );
          })}
        </div>

        <div className="mt-14 text-center">
          <button 
            onClick={() => navigate('/atelies')}
            className="group inline-flex flex-col items-center gap-2 cursor-pointer outline-none"
          >
            <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-[#cca062] group-hover:text-[#1F1F1F] transition-colors">conheça a história dos nossos ateliês</span>
            <div className="h-[1px] w-12 bg-[#cca062]/40 group-hover:w-24 group-hover:bg-[#1F1F1F] transition-all duration-150" />
          </button>
        </div>
      </section>

      {/* COMO FUNCIONA SESSÃO (Step 3) */}
      <section id="como-funciona" className="scroll-mt-24 py-20 bg-white border-t border-[#EAE4DC] px-4 sm:px-6 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#cca062] block mb-2 font-poppins">Processo de Criação</span>
            <h2 className="font-mea-culpa text-[#1F1F1F] text-3xl sm:text-4xl leading-tight font-normal tracking-normal">
              Como funciona
            </h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            
            {/* STEP 1 */}
            <div className="text-center group p-6 bg-[#FCFAF7] border border-[#EAE4DC] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                01
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Escolha um Ateliê
              </h4>
              <p className="text-[11px] text-[#666666] font-light leading-relaxed max-w-[200px]">
                Navegue pelas identidades únicas de cada um dos nossos ateliês e encontre a estética ideal.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="text-center group p-6 bg-[#FCFAF7] border border-[#EAE4DC] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                02
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Escolha um Kit ou Monte o Seu
              </h4>
              <p className="text-[11px] text-[#666666] font-light leading-relaxed max-w-[200px]">
                Selecione um de nossos kits prontos ou crie uma composição inteiramente personalizada do seu jeito.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="text-center group p-6 bg-[#FCFAF7] border border-[#EAE4DC] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                03
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Produção Artesanal
              </h4>
              <p className="text-[11px] text-[#666666] font-light leading-relaxed max-w-[200px]">
                Produzimos cada detalhe com cuidado especial, à mão, unindo afeto, fragrância e dedicação exclusiva.
              </p>
            </div>

            {/* STEP 4 */}
            <div className="text-center group p-6 bg-[#FCFAF7] border border-[#EAE4DC] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:border-[#D3C9BE] transition-all duration-150 flex flex-col items-center select-none">
              <span className="font-poppins text-3xl font-light text-[#cca062] mb-1">
                04
              </span>
              <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-3 border-b border-[#EAE4DC] pb-1 w-8">Passo</span>
              <h4 className="font-poppins font-medium text-xs uppercase tracking-wider text-[#1F1F1F] mb-2">
                Receba e Encante
              </h4>
              <p className="text-[11px] text-[#666666] font-light leading-relaxed max-w-[200px]">
                Receba a embalagem finalizada com carinho ou envie diretamente para presentear quem você ama.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* KITS SELECIONADOS (Step 4) */}
      <section id="kits" className="scroll-mt-24 py-16 bg-[#FCFAF7] border-y border-[#EAE4DC] px-4 sm:px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#cca062] block mb-2 font-poppins">Combinações Perfeitas</span>
            <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#1F1F1F] tracking-normal mb-3">Kits Prontos</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mb-4"></div>
            <p className="text-xs text-[#666666] font-light max-w-md mx-auto leading-relaxed">
              Combinações escolhidas a dedo de produtos prontos para encantar e tornar o seu momento inesquecível.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1600px] mx-auto">
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
      </section>
      
      {/* MONTE SEU KIT EXPLAINER (Step 5) */}
      <section className="my-16 max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white border border-[#EAE4DC] rounded-[32px] p-8 sm:p-12 shadow-[0_4px_24px_rgba(0,0,0,0.015)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#FCFAF7] rounded-br-full pointer-events-none" />
          
          <div className="max-w-xl text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCFAF7] mb-4 border border-[#EAE4DC]">
              <Sparkles size={11} className="text-[#cca062]" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#cca062] font-poppins">Amor Personalizado</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-mea-culpa font-normal text-[#1F1F1F] tracking-normal mb-3 leading-tight">
              Monte o Seu Próprio Kit
            </h3>
            <p className="text-xs text-[#666666] leading-relaxed font-light">
              Crie uma combinação personalizada, adicionando os mimos artesanais preferidos e inserindo um cartão com mensagem gravada. Rápido, objetivo e acolhedor!
            </p>
          </div>
          
          <div className="shrink-0 relative z-10">
            <button
               onClick={() => navigate('/kit-meukit')}
               className="h-[46px] px-8 rounded-full bg-[#1F1F1F] hover:bg-[#cca062] text-white hover:text-[#1F1F1F] text-[11px] font-semibold uppercase tracking-[0.14em] shadow-sm transition-all duration-150 cursor-pointer inline-flex items-center gap-2 font-poppins"
            >
              CRIAR MEU KIT <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* FEEDBACK QUE AMAMOS - AVALIAÇÕES (Step 6) */}
      <section id="feedbacks" className="scroll-mt-24 py-16 bg-[#FCFAF7] border-t border-[#EAE4DC] px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#cca062] block mb-2 font-poppins">Nossos Clientes</span>
            <h2 className="text-3xl sm:text-4xl font-mea-culpa font-normal text-[#1F1F1F] tracking-normal mb-3">Feedback que Amamos</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mb-4"></div>
            <p className="text-xs text-[#666666] font-light max-w-sm mx-auto leading-relaxed">
              Clientes que escolheram presentear com o coração.
            </p>
          </div>

          {/* AUTOMATED CAROUSEL DEPOIMENTOS */}
          <div className="max-w-2xl mx-auto relative px-4 text-center select-none min-h-[200px] flex flex-col justify-between">
            <div className="bg-white border border-[#EAE4DC] rounded-[24px] p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-center gap-1 text-[#cca062] mb-4">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-xs sm:text-sm font-light text-[#1F1F1F] leading-relaxed italic mb-6">
                {feedbacksDynamic[activeFeedbackIndex]?.text || ""}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-[#EAE4DC]">
                <span className="font-poppins font-semibold text-xs text-[#1F1F1F]">{feedbacksDynamic[activeFeedbackIndex]?.author || "Cliente"}</span>
                <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest font-bold ${feedbacksDynamic[activeFeedbackIndex]?.colorTagBg || "bg-[#FCFAF7]"} ${feedbacksDynamic[activeFeedbackIndex]?.colorTagText || "text-[#cca062]"} px-3 py-1 rounded-full border border-[#EAE4DC] font-poppins`}>
                  {feedbacksDynamic[activeFeedbackIndex]?.atelier || "Depoimento"}
                </span>
              </div>
            </div>

            {/* CAROUSEL BUTTON DOTS */}
            <div className="flex justify-center items-center gap-2 mt-6">
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
      </section>

      <DelicateFlourish />

      {/* SEÇÃO EDITORIAL: CONEXÃO COM A MARCA - MINHA HISTÓRIA (Step 7) */}
      <section id="sobre-julia" className="scroll-mt-24 py-20 bg-white px-4 sm:px-6 relative overflow-hidden border-t border-b border-[#EAE4DC]">
        <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full bg-[#FCFAF7]/50 blur-[120px] pointer-events-none" />
        
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* LADO ESQUERDO: Portrait Editorial Photograph */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-[380px] rounded-[32px] overflow-hidden shadow-xs border border-[#EAE4DC] bg-[#FCFAF7] p-2.5 transition-transform duration-150 hover:scale-[1.01]">
                <div className="w-full h-full rounded-[24px] overflow-hidden aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                  <ImageWithFallback
                    src="https://i.imgur.com/KRLgtno.jpg"
                    alt="Júlia Aleixo no Ateliê"
                    className="w-full h-full object-cover rounded-[22px]"
                    isThumbnail={false}
                  />
                </div>
              </div>
            </div>

            {/* LADO DIREITO: Emotional Narrative */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-[46px] font-mea-culpa font-normal text-[#1F1F1F] tracking-normal leading-[1.15] mb-6">
                Por trás de cada detalhe
              </h2>
              
              <div className="h-[1px] w-12 bg-[#cca062]/40 mb-6 block lg:hidden"></div>

              <div className="space-y-4 max-w-xl">
                <p className="font-sans text-[15px] sm:text-[16px] text-[#666666] font-light leading-[1.8]">
                  Acredito que os momentos mais valiosos da vida não são medidos pelo tempo, mas pelo afeto que neles depositamos. No ateliê, cada detalhe é desenhado para ser uma extensão desse sentimento: desde a curadoria sensível das matérias-primas até o toque feito inteiramente à mão.
                </p>
                <p className="font-sans text-[15px] sm:text-[16px] text-[#666666] font-light leading-[1.8]">
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
      </section>

      {/* STORY MODAL DIALOG - EXCLUSIVELY STYLED */}
      {isStoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            onClick={() => setIsStoryOpen(false)}
            className="absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-200 ease-out animate-fade-in duration-200" 
          />
          
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-[#EAE4DC] p-6 sm:p-10 shadow-lg scrollbar-thin animate-fade-in">
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

      {/* FRASE INSTITUCIONAL (Step 8) */}
      <section id="institucional-frase-final" className="py-4 md:py-6 bg-white flex flex-col items-center justify-center px-6">
        <div className="max-w-[1400px] mx-auto text-center select-none">
          <p className="font-mea-culpa text-2xl sm:text-3xl md:text-4xl text-[#1F1F1F] leading-relaxed md:leading-[1.8] font-normal tracking-wide text-center ">
            {`Quatro ateliês.

Cada detalhe feito à mão
com um só propósito:

transformar cada momento
em algo inesquecível,
feliz e eterno.`}
          </p>
        </div>
      </section>
    </div>
  );
};

