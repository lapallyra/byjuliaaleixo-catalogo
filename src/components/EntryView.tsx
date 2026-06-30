import React, { useState, useEffect } from 'react';
import { Search, Heart, Info, Package, Mail, User, Sparkles, ArrowRight, ArrowRightLeft, Gift, ShoppingBag, Eye, Star, ChevronDown, X } from 'lucide-react';
import { AppConfig, Product, SiteSettings, CompanyId } from '../types';
import { useAuth } from './AuthProvider';
import { useAdminOrchestrator } from './AdminOrchestratorSystem';
import { subscribeToAllSettings } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { CatalogProductCard } from './Catalog/CatalogProductCard';
import { FeaturedProductCard } from './Catalog/FeaturedProductCard';
import { LogoAndSignature } from './ui/LogoAndSignature';
import { themes, getTheme } from '../lib/theme';

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

  const feedbacksDynamic = React.useMemo(() => [
    {
      stars: 5,
      text: '"O kit maternidade da Tutty Mimo superou todas as minhas expectativas. O enxoval possui uma maciez indescritível e cada pequeno ponto transborda amor. Ficou lindo demais!"',
      author: 'Mariana S.',
      atelier: 'Tutty Mimo',
      colorTagBg: 'bg-[#d4bda1]/15',
      colorTagText: 'text-[#a88258]'
    },
    {
      stars: 5,
      text: '"Encomendei os cadernos e agendas da La Pallyra para presentear minhas madrinhas de casamento. O acabamento artesanal em cartonagem é o legítimo luxo com afeto."',
      author: 'Beatriz F.',
      atelier: 'La Pallyra',
      colorTagBg: 'bg-[#cca062]/15',
      colorTagText: 'text-[#cca062]'
    },
    {
      stars: 5,
      text: '"As rosas de cetim do ateliê com amor, Guennita parecem reais. O capricho nas embalagens e o carinho com que as flores são moldadas me fez chorar quando peguei o pacote."',
      author: 'Camila R.',
      atelier: 'com amor, Guennita',
      colorTagBg: 'bg-[#5b2122]/10',
      colorTagText: 'text-[#5b2122]'
    }
  ], []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveFeedbackIndex((prev) => (prev + 1) % feedbacksDynamic.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [feedbacksDynamic.length]);

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
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
    <div className="home-root bg-[#fffdfa] min-h-[100dvh] w-full relative font-tahoma text-[#6d5443] selection:bg-[#e8dcc8] selection:text-[#3A312D] overflow-x-hidden antialiased">
      
      {/* HUGE CENTERED LOGO */}
      <div className="w-full bg-white py-5 flex justify-center items-center border-b border-[#e8dcc8]/10">
        <div onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer hover:opacity-90 transition-all duration-300">
          <LogoAndSignature small={false} />
        </div>
      </div>

      {/* LUXURY ACTIVE NAVIGATION BAR */}
      <div className="w-full border-b border-[#e8dcc8]/25 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-3xs">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
          
          {/* Centered navigation links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-2 text-[#3A312D] tracking-[0.1em] font-semibold text-[11px] sm:text-[12px] uppercase select-none font-poppins">
            <a 
              href="#ateliers" 
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[#3A312D] hover:bg-[#3A312D] hover:text-[#cca062] transition-all duration-300 ease-in-out font-medium tracking-[0.1em] font-poppins"
            >
              ateliês
            </a>
            
            <button 
              onClick={() => navigate('/kit-meukit')} 
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[#3A312D] hover:bg-[#3A312D] hover:text-[#cca062] transition-all duration-300 ease-in-out cursor-pointer outline-none uppercase font-semibold tracking-[0.12em] text-[11px] sm:text-[12px] font-poppins"
            >
              monte seu kit
            </button>
            
            <a 
              href="#sobre-julia" 
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[#3A312D] hover:bg-[#3A312D] hover:text-[#cca062] transition-all duration-300 ease-in-out font-medium tracking-[0.1em] font-poppins"
            >
              sobre nós
            </a>
            
            <a 
              href="#feedbacks" 
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[#3A312D] hover:bg-[#3A312D] hover:text-[#cca062] transition-all duration-300 ease-in-out font-medium tracking-[0.1em] font-poppins"
            >
              feedback
            </a>
            
            <button 
              onClick={() => navigate('/listadepresentes-info')} 
              className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-[#3A312D] hover:bg-[#3A312D] hover:text-[#cca062] transition-all duration-300 ease-in-out cursor-pointer outline-none uppercase font-semibold tracking-[0.12em] text-[11px] sm:text-[12px] font-poppins"
            >
              lista de presentes
            </button>
          </nav>

          {/* Search/Tracking capsule in white background */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
              } else {
                navigate('/document');
              }
            }}
            className="flex items-center gap-2 bg-[#ffffff] border border-[#e8dcc8]/70 rounded-full px-4 py-2 text-[11px] font-sans text-[#6d5443] shadow-3xs hover:border-[#cca062]/50 transition-all w-full sm:w-auto md:max-w-[240px]"
          >
            <Search size={12} strokeWidth={2.5} className="text-[#cca062]" />
            <input 
              type="text" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="encontre seu pedido aqui" 
              className="bg-transparent focus:outline-none w-full text-[#6d5443] placeholder-[#6d5443]/40 font-medium text-[11px] select-text border-none p-0" 
            />
          </form>
        </div>
      </div>

      {/* BEAUTIFUL ROMANTIC CENTRAL TITLE */}
      <div className="text-center py-10 md:py-12 px-2 animate-fade-in bg-gradient-to-b from-[#fffdfa] to-white select-none overflow-x-hidden">
        <h2 className="font-parisienne text-[3.9vw] sm:text-2xl md:text-3.5xl lg:text-[45px] text-[#3A312D] font-normal leading-tight tracking-normal max-w-none mx-auto px-1 whitespace-nowrap">
          Encontre o presente perfeito para deixar o seu momento inesquecivel.
        </h2>
      </div>

      {/* BOUTIQUE ATELIERS VERTICAL CAPSULE CARDS */}
      <section id="ateliers" className="scroll-mt-24 pb-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto font-poppins transition-transform duration-500">
          {ateliers.map((atelier) => (
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
              tabIndex={0}
              className="flex flex-col items-center group cursor-pointer relative outline-none focus:outline-none"
            >
              {/* Floating Sparkles around the card */}
              <div className="absolute inset-0 pointer-events-none z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <Sparkles 
                  className="absolute -top-4 -left-2 text-white animate-star-pop" 
                  size={16} 
                  style={{ color: atelier.accentColor, filter: `drop-shadow(0 0 8px ${atelier.accentColor})`, fill: 'currentColor' } as any}
                />
                <Sparkles 
                  className="absolute top-0 -right-4 text-white animate-star-pop" 
                  size={12} 
                  style={{ animationDelay: '0.4s', color: atelier.accentColor, filter: `drop-shadow(0 0 6px ${atelier.accentColor})`, fill: 'currentColor' } as any}
                />
                <Sparkles 
                  className="absolute -bottom-4 -right-2 text-white animate-star-pop" 
                  size={14} 
                  style={{ animationDelay: '0.8s', color: atelier.accentColor, filter: `drop-shadow(0 0 8px ${atelier.accentColor})`, fill: 'currentColor' } as any}
                />
                <Sparkles 
                  className="absolute bottom-0 -left-4 text-white animate-star-pop" 
                  size={18} 
                  style={{ animationDelay: '1.2s', color: atelier.accentColor, filter: `drop-shadow(0 0 10px ${atelier.accentColor})`, fill: 'currentColor' } as any}
                />
              </div>

              {/* Card Body - Square with slightly rounded corners */}
              <div 
                className="relative w-full aspect-square rounded-2xl bg-white p-1 transition-all duration-500 overflow-hidden shadow-sm flex flex-col z-10 
                           group-hover:animate-sparkle group-focus:animate-sparkle"
                style={{ 
                  border: `2px solid ${atelier.accentColor}`,
                  '--glow-color': atelier.accentColor
                } as any}
              >
                {/* Image/Content Container */}
                <div className="relative flex-grow rounded-xl overflow-hidden bg-[#fcfaf7]">
                  {/* Brand Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center select-none z-10 transition-transform duration-500 group-hover:scale-105">
                    <span className="text-4xl mb-4 filter drop-shadow-md">
                      {atelier.emoji}
                    </span>
                    <h3 className="font-mea-culpa text-3xl text-[#3A312D] mb-1 font-normal leading-none">
                      {atelier.name}
                    </h3>
                    <div className="h-[1px] w-10 bg-[#cca062]/30 my-2" />
                    <p className="font-parisienne text-[10px] text-[#cca062] tracking-[0.2em] uppercase font-normal">
                      {atelier.subtitle}
                    </p>
                  </div>

                  {/* Active Hover Cover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700 z-20 flex flex-col justify-center items-center p-5 text-center text-white bg-black/85 select-none">
                    <p className="font-parisienne text-base text-[#e8dcc8] mb-2 font-normal">{atelier.details}</p>
                    <p className="text-[10px] tracking-wide leading-relaxed font-light mb-6 max-w-[150px] opacity-90 font-sans">
                      {atelier.description}
                    </p>
                    <div className="absolute bottom-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="font-poppins font-bold text-[8px] uppercase tracking-[0.25em] border border-white/30 px-5 py-2 rounded-full hover:bg-white hover:text-black transition-all">
                        ver vitrine
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Title below card */}
              <h3 className="font-mea-culpa text-3xl font-normal text-[#3A312D] text-center mt-5 block group-hover:text-[#3A312D] transition-all duration-300 group-hover:translate-y-1">
                {atelier.name}
              </h3>
            </div>
          ))}
        </div>

        <div className="mt-14 text-center">
          <button 
            onClick={() => navigate('/atelies')}
            className="group inline-flex flex-col items-center gap-2 cursor-pointer outline-none"
          >
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#cca062] group-hover:text-[#3A312D] transition-colors">conheça a história dos nossos ateliês</span>
            <div className="h-[1px] w-12 bg-[#cca062]/40 group-hover:w-24 group-hover:bg-[#3A312D] transition-all duration-500" />
          </button>
        </div>
      </section>

      <DelicateFlourish />
          {/* KITS SELECIONADOS */}
      <section id="kits" className="scroll-mt-24 py-12 bg-[#faf8f5]/80 border-y border-[#e8dcc8]/15 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-[42px] font-parisienne font-normal text-[#3A312D] tracking-normal mt-1 mb-2">Kits Selecionados</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
            <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
              Combinações escolhidas a dedo de produtos prontos para encantar e tornar o seu momento em data histórica.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-7xl mx-auto px-2">
            {kits.length === 0 ? (
              <p className="col-span-full text-center text-xs uppercase font-bold tracking-widest text-[#cca062]/60 py-12">
                Nenhum kit disponível no momento.
              </p>
            ) : (
              kits.map((kit) => (
                <CatalogProductCard
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
      
      {/* MONTE SEU KIT EXPLAINER (OBJECTIVE COMMERCIAL BANNER) */}
      <section className="my-12 max-w-6xl mx-auto px-4 sm:px-5">
        <div className="bg-[#fffdfa] border-2 border-[#cca062]/25 rounded-[32px] p-6 sm:p-10 shadow-[0_12px_40px_rgba(204,160,98,0.06)] flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#cca062]/3 rounded-br-full blur-md pointer-events-none" />
          
          <div className="max-w-xl text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cca062]/15 mb-3.5 border border-[#cca062]/10">
              <Sparkles size={10} className="text-[#cca062]" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#cca062] font-poppins">Amor Personalizado</span>
            </div>
            <h3 className="text-2xl sm:text-[32px] font-parisienne font-normal text-[#3A312D] tracking-normal mb-2 leading-tight">
              Monte o Seu Próprio Kit
            </h3>
            <p className="text-[11.5px] sm:text-xs text-[#6d5443]/85 leading-relaxed font-light">
              Crie uma combinação personalizada, adicionando os mimos artesanais preferidos e inserindo um cartão com mensagem gravada. Rápido, objetivo e acolhedor!
            </p>
          </div>
          
          <div className="shrink-0 relative z-10">
            <button
               onClick={() => navigate('/kit-meukit')}
               className="h-[46px] px-8 rounded-full bg-[#3A312D] hover:bg-[#cca062] text-[#fffdfa] hover:text-[#3A312D] border border-transparent hover:border-[#cca062]/20 text-[11px] font-semibold uppercase tracking-[0.14em] shadow-3xs hover:shadow-xs transition-all duration-300 cursor-pointer inline-flex items-center gap-2 font-poppins"
            >
              CRIAR MEU KIT <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* PRODUTOS (VITRINE DIRETA DE PRODUTOS PREMIUM COM MAPEAMENTO DE ATELIÊS) */}
      <section id="produtos" className="scroll-mt-24 py-12 px-4 sm:px-5 max-w-[1440px] mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-[42px] font-parisienne font-normal text-[#3A312D] tracking-normal mt-1 mb-2">Vitrine de Destaques</h2>
          <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
          <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
            Produtos mais queridos
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 max-w-7xl mx-auto px-2">
          {featuredProducts.map((prod) => {
            const targetRoute = prod.company === 'pallyra' ? '/lapallyra' 
                              : prod.company === 'guennita' ? '/comamorguennita' 
                              : prod.company === 'mimada' ? '/mimadasim' 
                              : '/tuttymimo';
            return (
              <FeaturedProductCard
                key={prod.id}
                product={prod}
                theme={getTheme(prod.company)}
                onAddToCart={() => navigate(`${targetRoute}?product=${prod.id}`)}
                onClick={() => navigate(`${targetRoute}?product=${prod.id}`)}
              />
            );
          })}
        </div>
      </section>

      {/* FEEDBACK QUE AMAMOS (EDITORIAL SOCIAL PROOF WITH HANDWRITTEN ACCENTS) */}
      <section id="feedbacks" className="scroll-mt-24 py-12 bg-white border-t border-[#e8dcc8]/20 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-[42px] font-parisienne font-normal text-[#3A312D] tracking-normal mt-1 mb-2">Feedback que Amamos</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
            <p className="text-xs text-[#6d5443]/70 font-light max-w-sm mx-auto leading-relaxed mb-6">
             Clientes que escolheram presentear com o coração.
            </p>
          </div>

          {/* AUTOMATED CAROUSEL DEPOIMENTOS */}
          <div className="max-w-2xl mx-auto relative px-4 text-center select-none min-h-[200px] flex flex-col justify-between">
            <div className="bg-[#faf8f5]/60 border border-[#e8dcc8]/30 rounded-[22px] p-6.2 sm:p-8 hover:shadow-[0_8px_20px_rgba(109,84,67,0.03)] hover:border-[#cca062]/30 transition-all duration-500">
              <div className="flex items-center justify-center gap-1 text-[#cca062] mb-3.5">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-[13px] sm:text-[14.5px] font-tahoma font-light text-[#6d5443] leading-relaxed italic mb-5">
                {feedbacksDynamic[activeFeedbackIndex].text}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-[#e8dcc8]/20">
                <span className="font-poppins font-semibold text-xs sm:text-sm text-[#3A312D]">{feedbacksDynamic[activeFeedbackIndex].author}</span>
                <span className={`text-[8px] sm:text-[9px] uppercase tracking-widest font-bold ${feedbacksDynamic[activeFeedbackIndex].colorTagBg} ${feedbacksDynamic[activeFeedbackIndex].colorTagText} px-2.5 py-0.5 rounded-full font-poppins`}>
                  {feedbacksDynamic[activeFeedbackIndex].atelier}
                </span>
              </div>
            </div>

            {/* CAROUSEL BUTTON DOTS */}
            <div className="flex justify-center items-center gap-2 mt-5">
              {feedbacksDynamic.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveFeedbackIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 outline-none cursor-pointer ${
                    idx === activeFeedbackIndex ? "bg-[#cca062] w-5" : "bg-[#cca062]/20 hover:bg-[#cca062]/45"
                  }`}
                  aria-label={`Visualizar depoimento ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <DelicateFlourish />

      {/* SEÇÃO EDITORIAL: CONEXÃO COM A MARCA / POR TRÁS DE CADA DETALHE (POSICIONADO COMO ANTEPENÚLTIMO BLOCO DA HOME) */}
      <section id="sobre-julia" className="scroll-mt-24 py-16 lg:py-20 bg-gradient-to-b from-[#fffdfa] to-[#faf8f5] px-4 sm:px-5 relative overflow-hidden border-t sm:border-b border-[#e8dcc8]/20">
        {/* Soft elegant background decorations */}
        <div className="absolute -bottom-10 left-1/3 w-72 h-72 rounded-full bg-[#cca062]/3 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
            
            {/* LADO ESQUERDO: Portrait Editorial Photograph */}
            <div className="lg:col-span-5 flex justify-center w-full">
              <div className="relative w-full max-w-[380px] rounded-[32px] overflow-hidden shadow-[0_16px_40px_rgba(109,84,67,0.06)] border border-[#e8dcc8]/45 bg-[#faf8f5] p-2.5 transition-transform duration-700 hover:scale-[1.01]">
                <div className="w-full h-full rounded-[24px] overflow-hidden aspect-[4/5] sm:aspect-[3/4] lg:aspect-[4/5]">
                  <ImageWithFallback
                    src="https://i.imgur.com/KRLgtno.jpg"
                    alt="Júlia Aleixo no Ateliê"
                    className="w-full h-full object-cover rounded-[22px]"
                    isThumbnail={false}
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/12 to-transparent pointer-events-none rounded-[32px]" />
              </div>
            </div>

            {/* LADO DIREITO: Emotional Narrative */}
            <div className="lg:col-span-7 flex flex-col justify-center items-center lg:items-start text-center lg:text-left">
              {/* Title */}
              <h2 className="text-3.5xl sm:text-4.5xl lg:text-[46px] font-parisienne font-normal text-[#3A312D] tracking-normal leading-[1.15] mb-6">
                Por trás de cada detalhe
              </h2>
              
              {/* Decorative separator */}
              <div className="h-[1px] w-12 bg-[#cca062]/40 mb-6 block lg:hidden"></div>

              {/* Text content in Tahoma */}
              <div className="space-y-4 max-w-xl">
                <p className="font-sans text-[15.5px] sm:text-[17.5px] text-[#2c2420] font-normal leading-[1.75]">
                  Acredito que os momentos mais valiosos da vida não são medidos pelo tempo, mas pelo afeto que neles depositamos. No ateliê, cada detalhe é desenhado para ser uma extensão desse sentimento: desde a curadoria sensível das matérias-primas até o toque feito inteiramente à mão.
                </p>
                <p className="font-sans text-[15.5px] sm:text-[17.5px] text-[#2c2420] font-normal leading-[1.75]">
                  Cada presente aberto é o começo de uma nova história, e cada embalagem concluída carrega o peso de palavras que merecem durar. Criar com intenção é o meu propósito, unindo a sutileza das pequenas coisas à eternidade daquilo que permanece no coração.
                </p>
              </div>

              {/* Signature block */}
              <div className="mt-8 mb-8 flex flex-col items-center lg:items-start gap-1 select-none">
                <span className="font-parisienne text-[#cca062] text-[28px] lg:text-[34px] leading-tight font-normal">
                  Com carinho,
                </span>
                <span className="font-parisienne text-[#3A312D] text-[34px] lg:text-[40px] leading-none font-normal -mt-1 lg:pl-4">
                  Júlia Aleixo
                </span>
              </div>

              {/* Premium Button Re-branding */}
              <button
                onClick={() => setIsStoryOpen(true)}
                className="h-[46px] px-8 rounded-full border border-[#cca062]/40 bg-transparent text-[#3A312D] font-poppins font-semibold text-[11.5px] uppercase tracking-[0.14em] transition-all duration-300 hover:bg-[#3A312D] hover:text-[#cca062] hover:border-[#3A312D] hover:shadow-xs cursor-pointer flex items-center justify-center whitespace-nowrap"
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
          {/* Overlay fade background */}
          <div 
            onClick={() => setIsStoryOpen(false)}
            className="absolute inset-0 bg-[#3A312D]/40 backdrop-blur-sm transition-opacity duration-500 ease-out" 
          />
          
          {/* Modal container with subtle upscale reveal animation */}
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10 border border-[#e8dcc8]/50 p-6 sm:p-10 shadow-xl scrollbar-thin animate-fade-in">
            {/* Close button */}
            <button 
              onClick={() => setIsStoryOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full border border-[#e8dcc8]/60 bg-white flex items-center justify-center text-[#cca062] hover:bg-[#3A312D] hover:text-[#cca062] hover:border-[#3A312D] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>

            {/* Scrollable Story story content */}
            <div className="flex flex-col items-center text-center mt-4">
              <span className="font-parisienne text-[#cca062] text-[38px] leading-none select-none mb-1">
                Julia Aleixo
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#cca062] font-poppins block mb-6">
                Amor em detalhes à mão
              </span>

              <div className="space-y-5 font-tahoma text-sm text-[#6d5443]/85 font-light leading-relaxed max-w-xl text-justify px-2">
                <p>
                  Os Presentes Personalizados nasceram do desejo profundo de resgatar o valor do tempo e do afeto no ato de presentear. Em um mundo onde tudo caminha de forma apressada, escolhi ir na direção oposta: a do fazer manual, do respiro cuidadoso e da presença em cada laço de fita.
                </p>
                <p>
                  Formada com a paixão pela estética clássica e pela sofisticação dos papéis e fragrâncias, reuni sob estes quatros ateliês que dão vida às minhas maiores aspirações de criação.
                </p>
                <p>
                  Em <strong>La Pallyra</strong>, a importancia de dar valor ao dia a dia, de lembrar que podemos sim ter um momento nosso ao olhar para agenda com o seu nome, calendário do seu jeitinho. Em <strong>com amor,Guennita</strong>, celebramos a delicada sofisticação de presentar com o extraordinário, para guardar no coração etermnamente. Em <strong>Mimada Sim</strong>, são feitos mimos atenciosos para o seu evento, seja ele, aniversário, comercial, chá de bebê, chá revelação, casamento, qualquer evento estaremos prontos para fazer o seu mimo a sua escolha. Em <strong>Tutty Mimo</strong>, é o afeto de forma pura, desde quando aparece os dois tracinhos até a primeira infância do seu amor.
                </p>
                <p>
                  Minha maior recompensa é saber que cada peça que sai torna-se parte de um momento inesquecível na vida de alguém. Estar aqui é um convite para desacelerar, respirar e presentear quem você ama com a mais sincera e bela das intenções.
                </p>
              </div>

              {/* Floral tiny emblem/signature representation */}
              <div className="mt-10 mb-2 font-parisienne text-[#cca062] text-[32px] leading-none select-none">
                Júlia Aleixo
              </div>
              <span className="text-[10px] tracking-widest text-[#cca062]/50 font-poppins uppercase">
                Ateliê de Presentes Finos
              </span>
            </div>
          </div>
        </div>
      )}
     
            {/* COMO FUNCIONA SESSÃO */}
      <section className="scroll-mt-24 py-4 px-4 sm:px-5 max-w-7xl mx-auto w-full">
        <div className="text-center mb-6">
          <h2 className="font-parisienne text-[#3A312D] text-3xl sm:text-[42px] leading-tight font-normal tracking-normal">
            Como funciona
          </h2>
        </div>

        {/* 4 HORIZONTAL LOGICAL STEP CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto mb-2">
          
          {/* STEP 1 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              01
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Escolha seu presente
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Navegue pelas vitrines dos ateliês e selecione o personalizado que falará com o coração.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              02
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Deixe único
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Adicione mimos complementare em nossos ateliês, elegendo o presente personalizado ideal.
            </p>
          </div>

          {/* STEP 3 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              03
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Personalize
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Escolha como será o seu presente. Nome, cor, afins...
            </p>
          </div>

          {/* STEP 4 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              04
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Envio 
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Finalizamos a montagem à mão com as mais belas essências e entregamos aonde você quiser com carinho.
            </p>
          </div>

        </div>
      </section>

          {/* FINAL EMOTIONAL TRUST BANNER */}
      <section className="bg-[#faf8f5] border-y border-[#e8dcc8]/40 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center select-none">
          <Heart size={20} className="text-[#c96b71] mx-auto mb-4 animate-pulse" />
          <p className="font-parisienne text-2.5xl sm:text-3.5xl text-[#3A312D] leading-snug mb-3 max-w-xl mx-auto font-normal">
            "Quatro ateliês, feito cada detalhe à mãos com um só propósito: transformar o momento em único, feliz e eterno."
          </p>
          </div>
      </section>
    </div>
  );
};
