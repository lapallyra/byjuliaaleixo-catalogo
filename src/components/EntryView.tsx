import React, { useState, useEffect } from 'react';
import { Search, Heart, Info, Package, Mail, User, Sparkles, ArrowRight, ArrowRightLeft, Gift, ShoppingBag, Eye, Star, ChevronDown, X } from 'lucide-react';
import { AppConfig, Product, SiteSettings, CompanyId } from '../types';
import { useAuth } from './AuthProvider';
import { subscribeToAllSettings } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { HomeProductCard } from './HomeProductCard';

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
  const { isAdmin } = useAuth();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [searchCode, setSearchCode] = useState('');
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

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

  const getCompanyLabelAndColor = (companyId: CompanyId) => {
    switch (companyId) {
      case 'pallyra': 
        return { label: 'La Pallyra', bg: 'bg-[#cca062]/10', text: 'text-[#cca062]', hoverBorder: 'group-hover:border-[#cca062]' };
      case 'guennita': 
        return { label: 'com amor, Guennita', bg: 'bg-[#5b2122]/10', text: 'text-[#5b2122]', hoverBorder: 'group-hover:border-[#5b2122]' };
      case 'mimada': 
        return { label: 'Mimada Sim', bg: 'bg-[#c96b71]/10', text: 'text-[#c96b71]', hoverBorder: 'group-hover:border-[#c96b71]' };
      case 'tuttymimo': 
        return { label: 'Tutty Mimo', bg: 'bg-[#d4bda1]/10', text: 'text-[#d4bda1]', hoverBorder: 'group-hover:border-[#d4bda1]' };
      default: 
        return { label: 'Ateliê Especial', bg: 'bg-[#6d5443]/10', text: 'text-[#6d5443]', hoverBorder: 'group-hover:border-[#cca062]' };
    }
  };

  const LogoAndSignature = ({ small = false }: { small?: boolean }) => (
    <div className={`relative inline-flex flex-col items-center justify-center select-none py-2 px-3 ${
      small 
        ? "min-w-[140px] sm:min-w-[160px]" 
        : "min-w-[280px] sm:min-w-[420px]"
    }`}>
      {/* Camada Inferior (Fundo) - PRESENTES */}
      <div 
        className={`font-poppins font-extrabold uppercase text-[#cca062]/10 leading-none select-none text-center tracking-[0.05em] ${
          small ? "text-xl sm:text-2xl" : "text-5xl sm:text-7xl"
        }`}
        style={{ letterSpacing: small ? '2px' : '4px' }}
      >
        PRESENTES
      </div>
      
      {/* Camada Superior (Frente) - personalizados */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none ${
        small ? "pt-1" : "pt-2 sm:pt-4"
      }`}>
        <span className={`font-hello-olivia text-[#3A312D] tracking-wide relative whitespace-nowrap ${
          small ? "text-[16px] sm:text-[18px]" : "text-3xl sm:text-4xl"
        }`}>
          personalizados
        </span>
      </div>

      {/* Assinatura: by Julia Aleixo (handwritten font class) */}
      <div className={`absolute select-none font-hello-olivia text-[#6d5443] font-medium leading-none rotate-[-4deg] ${
        small 
          ? "right-2.5 bottom-[5px] text-[11px] sm:text-[12px]" 
          : "right-4 bottom-[4px] text-[20px] sm:text-[23px]"
      }`}>
        by Julia Aleixo
      </div>
    </div>
  );

  const ateliers = [
    {
      id: 'pallyra',
      name: 'La Pallyra',
      subtitle: 'Papelaria & Cartonagem Afetiva',
      tagline: 'Onde seus sonhos viram papel.',
      route: '/lapallyra',
      accentColor: '#cca062',
      emoji: '📓',
      details: 'Agendas, planners e mimos de papelaria feitos à mão.'
    },
    {
      id: 'guennita',
      name: 'com amor, Guennita',
      subtitle: 'Premium Flores de Cetim',
      tagline: 'Flores eternas tecidas com o coração.',
      route: '/comamorguennita',
      accentColor: '#5b2122',
      emoji: '👑',
      details: 'Rosas de cetim tecidas pétala por pétala com eterno afeto.'
    },
    {
      id: 'mimada',
      name: 'Mimada Sim',
      subtitle: 'Lembranças & Brindes com Alma',
      tagline: 'O mimo que seu convidado nunca esquece.',
      route: '/mimadasim',
      accentColor: '#c96b71',
      emoji: '💅',
      details: 'Mimos repletos de criatividade para casamentos e festas.'
    },
    {
      id: 'tuttymimo',
      name: 'Tutty Mimo',
      subtitle: 'Maternidade & Primeira Infância',
      tagline: 'O cuidado que seu bebê merece.',
      route: '/tuttymimo',
      accentColor: '#d4bda1',
      emoji: '🍼',
      details: 'Estilo acolhedor, tecidos macios e acabamentos impecáveis.'
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
      <div className="text-center py-10 md:py-12 px-4 animate-fade-in bg-gradient-to-b from-[#fffdfa] to-white select-none">
        <h2 className="font-parisienne text-3xl sm:text-4xl md:text-[45px] text-[#3A312D] font-normal leading-tight tracking-normal max-w-4xl mx-auto px-4">
          Encontre o presente perfeito para o seu momento
        </h2>
      </div>

      {/* BOUTIQUE ATELIERS VERTICAL CAPSULE CARDS */}
      <section id="ateliers" className="scroll-mt-24 pb-16 px-4 sm:px-5 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto font-poppins">
          
          {/* Card 1: La Pallyra */}
          <div 
            onClick={() => navigate('/lapallyra')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-full aspect-[11/16] rounded-t-full rounded-b-[24px] border border-[#e8dcc8]/40 bg-[#fffbf7] p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(109,84,67,0.01)] transition-all duration-700 hover:shadow-[0_12px_32px_rgba(204,160,98,0.15)] hover:border-[#cca062] relative overflow-hidden flex flex-col justify-between hover:-translate-y-1">
              <div className="w-full h-full rounded-t-full rounded-b-[18px] overflow-hidden relative bg-[#FAF8F5]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=600&auto=format&fit=crop"
                  alt="La Pallyra"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-103"
                  isThumbnail={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/20 via-transparent to-transparent pointer-events-none rounded-t-full" />
                
                {/* Active Hover Cover */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-t-full rounded-b-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-5 text-center text-white bg-[#3A312D]/90 backdrop-blur-[4px] select-none">
                  <span className="font-poppins font-semibold tracking-[0.2em] text-[8px] text-[#cca062] uppercase mb-2">Ateliê de Cartonagem</span>
                  <h4 className="font-mea-culpa text-3xl mb-1 text-white font-normal">La Pallyra</h4>
                  <p className="font-parisienne text-base text-[#e8dcc8] mb-2 font-normal">Papelaria de Afeto</p>
                  <p className="text-[10px] tracking-wide leading-relaxed font-light line-clamp-3 max-w-[170px] opacity-90 font-sans">
                    Agendas, planners e mimos de papelaria fina feitos inteiramente à mão com materiais nobres.
                  </p>
                  <span className="absolute bottom-6 font-poppins font-medium text-[8px] uppercase tracking-[0.2em] border border-[#cca062]/30 px-3 py-1 rounded-full bg-white/5 text-[#cca062]">
                    ✦ Ver Ateliê
                  </span>
                </div>
              </div>
            </div>
            <h3 className="font-mea-culpa text-3xl sm:text-4xl font-normal text-[#3A312D] text-center mt-2 block group-hover:text-[#cca062] transition-colors duration-300">
              La Pallyra
            </h3>
            <p className="text-[10px] tracking-[0.14em] text-[#cca062] uppercase font-poppins font-medium text-center mt-1 group-hover:text-[#3A312D]/80 transition-colors duration-300">
              Cartonagem & Papelaria Fina
            </p>
          </div>

          {/* Card 2: com amor, Guennita */}
          <div 
            onClick={() => navigate('/comamorguennita')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-full aspect-[11/16] rounded-t-full rounded-b-[24px] border border-[#e8dcc8]/40 bg-[#fffbf7] p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(109,84,67,0.01)] transition-all duration-700 hover:shadow-[0_12px_32px_rgba(91,33,34,0.15)] hover:border-[#5b2122] relative overflow-hidden flex flex-col justify-between hover:-translate-y-1">
              <div className="w-full h-full rounded-t-full rounded-b-[18px] overflow-hidden relative bg-[#FAF8F5]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop"
                  alt="com amor, Guennita"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-103"
                  isThumbnail={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/20 via-transparent to-transparent pointer-events-none rounded-t-full" />
                
                {/* Active Hover Cover */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-t-full rounded-b-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-5 text-center text-white bg-[#3A312D]/90 backdrop-blur-[4px] select-none font-sans">
                  <span className="font-poppins font-semibold tracking-[0.2em] text-[8px] text-[#d4bda1] uppercase mb-2">Ateliê de Flores</span>
                  <h4 className="font-mea-culpa text-3xl mb-1 text-white font-normal">com amor, Guennita</h4>
                  <p className="font-parisienne text-base text-[#e8dcc8] mb-2 font-normal">Flores de Cetim</p>
                  <p className="text-[10px] tracking-wide leading-relaxed font-light line-clamp-3 max-w-[170px] opacity-90 font-sans">
                    Rosas eternas tecidas pétala por pétala com acabamento impecável de alta costura.
                  </p>
                  <span className="absolute bottom-6 font-poppins font-medium text-[8px] uppercase tracking-[0.2em] border border-[#d4bda1]/30 px-3 py-1 rounded-full bg-white/5 text-[#d4bda1]">
                    ✦ Ver Ateliê
                  </span>
                </div>
              </div>
            </div>
            <h3 className="font-mea-culpa text-3xl sm:text-4xl font-normal text-[#3A312D] text-center mt-2 block group-hover:text-[#5b2122] transition-colors duration-300">
              com amor, Guennita
            </h3>
            <p className="text-[10px] tracking-[0.14em] text-[#cca062] uppercase font-poppins font-medium text-center mt-1 group-hover:text-[#3A312D]/80 transition-colors duration-300">
              Flores de Cetim Perfumadas
            </p>
          </div>

          {/* Card 3: Mimada Sim */}
          <div 
            onClick={() => navigate('/mimadasim')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-full aspect-[11/16] rounded-t-full rounded-b-[24px] border border-[#e8dcc8]/40 bg-[#fffbf7] p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(109,84,67,0.01)] transition-all duration-700 hover:shadow-[0_12px_32px_rgba(217,75,95,0.15)] hover:border-[#d94b5f] relative overflow-hidden flex flex-col justify-between hover:-translate-y-1">
              <div className="w-full h-full rounded-t-full rounded-b-[18px] overflow-hidden relative bg-[#FAF8F5]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop"
                  alt="Mimada Sim"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-103"
                  isThumbnail={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/20 via-transparent to-transparent pointer-events-none rounded-t-full" />
                
                {/* Active Hover Cover */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-t-full rounded-b-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-5 text-center text-white bg-[#3A312D]/90 backdrop-blur-[4px] select-none font-sans">
                  <span className="font-poppins font-semibold tracking-[0.2em] text-[8px] text-[#c96b71] uppercase mb-2">Ateliê de Lembranças</span>
                  <h4 className="font-mea-culpa text-3xl mb-1 text-white font-normal">Mimada Sim</h4>
                  <p className="font-parisienne text-base text-[#e8dcc8] mb-2 font-normal">Mimos Premium</p>
                  <p className="text-[10px] tracking-wide leading-relaxed font-light line-clamp-3 max-w-[170px] opacity-90 font-sans">
                    Lembranças repletas de criatividade e alma para celebrações inesquecíveis e refinadas.
                  </p>
                  <span className="absolute bottom-6 font-poppins font-medium text-[8px] uppercase tracking-[0.2em] border border-[#c96b71]/30 px-3 py-1 rounded-full bg-white/5 text-[#c96b71]">
                    ✦ Ver Ateliê
                  </span>
                </div>
              </div>
            </div>
            <h3 className="font-mea-culpa text-3xl sm:text-4xl font-normal text-[#3A312D] text-center mt-2 block group-hover:text-[#d94b5f] transition-colors duration-300">
              Mimada Sim
            </h3>
            <p className="text-[10px] tracking-[0.14em] text-[#cca062] uppercase font-poppins font-medium text-center mt-1 group-hover:text-[#3A312D]/80 transition-colors duration-300">
              Mimos & Ideias com Afeto
            </p>
          </div>

          {/* Card 4: Tutty Mimo */}
          <div 
            onClick={() => navigate('/tuttymimo')}
            className="flex flex-col items-center group cursor-pointer"
          >
            <div className="w-full aspect-[11/16] rounded-t-full rounded-b-[24px] border border-[#e8dcc8]/40 bg-[#fffbf7] p-2 sm:p-2.5 shadow-[0_4px_20px_rgba(109,84,67,0.01)] transition-all duration-700 hover:shadow-[0_12px_32px_rgba(212,189,161,0.15)] hover:border-[#d4bda1] relative overflow-hidden flex flex-col justify-between hover:-translate-y-1">
              <div className="w-full h-full rounded-t-full rounded-b-[18px] overflow-hidden relative bg-[#FAF8F5]">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1440288736878-766ab35473ef?q=80&w=600&auto=format&fit=crop"
                  alt="Tutty Mimo"
                  className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-103"
                  isThumbnail={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/20 via-transparent to-transparent pointer-events-none rounded-t-full" />
                
                {/* Active Hover Cover */}
                <div className="absolute inset-2 sm:inset-2.5 rounded-t-full rounded-b-[16px] opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-5 text-center text-white bg-[#3A312D]/90 backdrop-blur-[4px] select-none font-sans">
                  <span className="font-poppins font-semibold tracking-[0.2em] text-[8px] text-[#cca062] uppercase mb-2">Ateliê do Bebê</span>
                  <h4 className="font-mea-culpa text-3xl mb-1 text-white font-normal">Tutty Mimo</h4>
                  <p className="font-parisienne text-base text-[#e8dcc8] mb-2 font-normal">Maternidade & Infância</p>
                  <p className="text-[10px] tracking-wide leading-relaxed font-light line-clamp-3 max-w-[170px] opacity-90 font-sans">
                    Enxoval de bebê macio em algodão nobre com costura acolhedora e acabamento primoroso.
                  </p>
                  <span className="absolute bottom-6 font-poppins font-medium text-[8px] uppercase tracking-[0.2em] border border-[#d4bda1]/40 px-3 py-1 rounded-full bg-white/5 text-[#cca062]">
                    ✦ Ver Ateliê
                  </span>
                </div>
              </div>
            </div>
            <h3 className="font-mea-culpa text-3xl sm:text-4xl font-normal text-[#3A312D] text-center mt-2 block group-hover:text-[#d4bda1] transition-colors duration-300">
              Tutty Mimo
            </h3>
            <p className="text-[10px] tracking-[0.14em] text-[#cca062] uppercase font-poppins font-medium text-center mt-1 group-hover:text-[#3A312D]/80 transition-colors duration-300">
              Enxoval & Maternidade
            </p>
          </div>

        </div>
      </section>

      <DelicateFlourish />

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
              Escolha o Ateliê
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Navegue pelas boutiques e selecione a joia de cetim, papelaria fina ou enxoval que falará ao coração.
            </p>
          </div>

          {/* STEP 2 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              02
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Monte Seu Kit
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Adicione mimos complementares artesanais de nossos ateliês, elegendo a caixa clássica ideal.
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
              Escreva palavras afetivas que serão gravadas em papel nobre para o encanto final.
            </p>
          </div>

          {/* STEP 4 */}
          <div className="text-center group p-4 bg-white border border-[#e8dcc8]/30 rounded-[24px] shadow-3xs hover:border-[#cca062]/40 hover:shadow-xs transition-all duration-500 flex flex-col items-center select-none">
            <span className="font-poppins text-3xl font-medium text-[#cca062] mb-1">
              04
            </span>
            <span className="text-[8px] font-bold tracking-[0.2em] text-[#cca062]/70 uppercase font-poppins block mb-2 border-b border-[#cca062]/20 pb-1 w-8">Passo</span>
            <h4 className="font-poppins font-semibold text-[11px] uppercase tracking-wider text-[#3A312D] mb-1.5">
              Envio Perfumado
            </h4>
            <p className="text-[10.5px] text-[#6d5443]/75 font-light leading-relaxed max-w-[200px]">
              Finalizamos a montagem à mão com as mais belas essências e entregamos com carinho.
            </p>
          </div>

        </div>
      </section>

      <DelicateFlourish />

      {/* KIT PRONTOS SECTION */}
      <section id="kits" className="scroll-mt-24 py-8 bg-[#fffbf7]/70 px-4 sm:px-5 w-full">
        <div className="max-w-7xl mx-auto w-full">
          {/* TITLE */}
          <div className="text-center mb-8">
            <h2 className="font-parisienne text-[#3A312D] text-3xl sm:text-[44px] leading-tight font-normal tracking-normal">
              Kit Prontos
            </h2>
          </div>

          {/* BEAUTIFUL ROUNDED CARDS RENDER */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-6xl mx-auto mb-8">
            {kits.length > 0 ? (
              kits.map((kit) => (
                <div 
                  key={kit.id}
                  onClick={() => navigate('/kits')}
                  className="group flex flex-col justify-between bg-white border border-[#e8dcc8]/40 rounded-[20px] overflow-hidden shadow-3xs hover:shadow-sm hover:border-[#cca062]/50 transition-all duration-300 pb-3 cursor-pointer select-none"
                >
                  <div className="w-full aspect-square bg-[#fffbf7] overflow-hidden border-b border-[#e8dcc8]/15 relative">
                    <ImageWithFallback 
                      src={kit.image} 
                      alt={kit.product_name} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                  <div className="p-3 text-center flex flex-col items-center">
                    <span className="text-[7.5px] uppercase tracking-widest text-[#cca062] font-semibold mb-1 font-poppins">
                      {getCompanyLabelAndColor(kit.company).label}
                    </span>
                    <h3 className="font-poppins font-medium text-[10.5px] sm:text-[11.5px] text-[#3A312D] line-clamp-1 mb-0.5">
                      {kit.product_name}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-poppins font-semibold text-[#6d5443] mt-0.5">
                      R$ {kit.current_price?.toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              [
                {
                  id: "mp-1",
                  name: "Cappuccino Italiano",
                  brand: "La Pallyra",
                  price: "34,90",
                  image: "https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=600&auto=format&fit=crop"
                },
                {
                  id: "mp-2",
                  name: "Fatia de Bolo Red Velvet",
                  brand: "Mimada Sim",
                  price: "42,00",
                  image: "https://images.unsplash.com/photo-1586985289688-ca9cf4993ec0?q=80&w=600&auto=format&fit=crop"
                },
                {
                  id: "mp-3",
                  name: "Kit Lavanda & Chá",
                  brand: "com amor, Guennita",
                  price: "119,00",
                  image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop"
                },
                {
                  id: "mp-4",
                  name: "Mochila Maternidade Soft",
                  brand: "Tutty Mimo",
                  price: "189,90",
                  image: "https://images.unsplash.com/photo-1440288736878-766ab35473ef?q=80&w=600&auto=format&fit=crop"
                }
              ].map((item) => (
                <div 
                  key={item.id}
                  onClick={() => navigate('/kits')}
                  className="group flex flex-col justify-between bg-white border border-[#e8dcc8]/40 rounded-[20px] overflow-hidden shadow-3xs hover:shadow-sm hover:border-[#cca062]/50 transition-all duration-300 pb-3 cursor-pointer select-none"
                >
                  <div className="w-full aspect-square bg-[#fffbf7] overflow-hidden border-b border-[#e8dcc8]/15 relative">
                    <ImageWithFallback 
                      src={item.image} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                    />
                  </div>
                  <div className="p-3 text-center flex flex-col items-center">
                    <span className="text-[7.5px] uppercase tracking-widest text-[#cca062] font-semibold mb-1 font-poppins">
                      {item.brand}
                    </span>
                    <h3 className="font-poppins font-medium text-[10.5px] sm:text-[11.5px] text-[#3A312D] line-clamp-1 mb-0.5">
                      {item.name}
                    </h3>
                    <p className="text-[10px] sm:text-xs font-poppins font-semibold text-[#6d5443] mt-0.5">
                      R$ {item.price}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* KITS EXCLUSIVOS */}
      <section id="kits" className="scroll-mt-24 py-12 bg-[#faf8f5]/80 border-y border-[#e8dcc8]/15 px-4 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-[42px] font-parisienne font-normal text-[#3A312D] tracking-normal mt-1 mb-2">Kits Únicos Selecionados</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
            <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
              Combinações primorosas de produtos embalados com afeto, prontos para encantar em datas históricas.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 max-w-7xl mx-auto px-2">
            {kits.length === 0 ? (
              <p className="col-span-full text-center text-xs uppercase font-bold tracking-widest text-[#cca062]/60 py-12">
                Nenhum kit disponível no momento.
              </p>
            ) : (
              kits.map((kit) => (
                <HomeProductCard
                  key={kit.id}
                  product={kit}
                  variant="premium"
                  onClick={() => navigate('/kits')}
                  getCompanyLabelAndColor={getCompanyLabelAndColor}
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
              Monte o Seu Próprio Kit de Afeto
            </h3>
            <p className="text-[11px] sm:text-xs text-[#6d5443]/85 leading-relaxed font-light mb-4">
              Crie uma combinação personalizada escolhendo a caixa ideal, adicionando os mimos artesanais preferidos e inserindo um cartão com mensagem gravada. Rápido, objetivo e acolhedor!
            </p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-[#6d5443]/70 font-semibold text-[9px] tracking-[0.16em] uppercase font-poppins pt-3 border-t border-[#e8dcc8]/20 select-none">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cca062]" /> I. Escolha a Caixa
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cca062]" /> II. Adicione Mimos
              </span>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#cca062]" /> III. Escolha o Cartão
              </span>
            </div>
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
            Navegue pelos produtos mais queridos de nossas marcas e monte um acervo de memórias marcantes.
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 max-w-7xl mx-auto px-2">
          {featuredProducts.map((prod) => {
            const targetRoute = prod.company === 'pallyra' ? '/lapallyra' 
                              : prod.company === 'guennita' ? '/comamorguennita' 
                              : prod.company === 'mimada' ? '/mimadasim' 
                              : '/tuttymimo';
            return (
              <HomeProductCard
                key={prod.id}
                product={prod}
                variant="promotion"
                onClick={() => navigate(`${targetRoute}?product=${prod.id}`)}
                getCompanyLabelAndColor={getCompanyLabelAndColor}
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
            <p className="text-xs text-[#6d5443]/70 font-light max-w-sm mx-auto leading-relaxed">
              Mensagens espontâneas enviadas por clientes que receberam um pedaço do nosso coração.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {/* Feedback items */}
            <div className="bg-[#faf8f5]/60 border border-[#e8dcc8]/30 rounded-[22px] p-6.5 hover:shadow-[0_8px_20px_rgba(109,84,67,0.03)] hover:border-[#cca062]/30 transition-all duration-300">
              <div className="flex items-center gap-1 text-[#cca062] mb-3">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-[11.5px] font-tahoma font-light text-[#6d5443] leading-relaxed italic mb-4">
                "O kit maternidade da Tutty Mimo superou todas as minhas expectativas. O enxoval possui uma maciez indescritível e cada pequeno ponto transborda amor. Ficou lindo demais!"
              </p>
              <div className="flex items-center justify-between pt-3.5 border-t border-[#e8dcc8]/20">
                <span className="font-poppins font-semibold text-xs text-[#3A312D]">Mariana Santana</span>
                <span className="text-[8px] uppercase tracking-widest font-bold bg-[#d4bda1]/15 text-[#a88258] px-2 py-0.5 rounded-full font-poppins">para Tutty Mimo</span>
              </div>
            </div>

            <div className="bg-[#faf8f5]/60 border border-[#e8dcc8]/30 rounded-[22px] p-6.5 hover:shadow-[0_8px_20px_rgba(109,84,67,0.03)] hover:border-[#cca062]/30 transition-all duration-300">
              <div className="flex items-center gap-1 text-[#cca062] mb-3">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-[11.5px] font-tahoma font-light text-[#6d5443] leading-relaxed italic mb-4">
                "Encomendei os cadernos e agendas da La Pallyra para presentear minhas madrinhas de casamento. O acabamento artesanal em cartonagem é o legítimo luxo com afeto."
              </p>
              <div className="flex items-center justify-between pt-3.5 border-t border-[#e8dcc8]/20">
                <span className="font-poppins font-semibold text-xs text-[#3A312D]">Beatriz Figueiredo</span>
                <span className="text-[8px] uppercase tracking-widest font-bold bg-[#cca062]/15 text-[#b08447] px-2 py-0.5 rounded-full font-poppins">para La Pallyra</span>
              </div>
            </div>

            <div className="bg-[#faf8f5]/60 border border-[#e8dcc8]/30 rounded-[22px] p-6.5 hover:shadow-[0_8px_20px_rgba(109,84,67,0.03)] hover:border-[#cca062]/30 transition-all duration-300">
              <div className="flex items-center gap-1 text-[#cca062] mb-3">
                <span className="text-[11px] font-bold mr-1 text-[#cca062]/80 font-poppins">5.0</span>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <p className="text-[11.5px] font-tahoma font-light text-[#6d5443] leading-relaxed italic mb-4">
                "As rosas de cetim da com amor, Guennita parecem reais. O capricho nas embalagens e o carinho com que as flores são moldadas me fez chorar quando peguei o pacote."
              </p>
              <div className="flex items-center justify-between pt-3.5 border-t border-[#e8dcc8]/20">
                <span className="font-poppins font-semibold text-xs text-[#3A312D]">Camila Resende</span>
                 <span className="text-[8px] uppercase tracking-widest font-bold bg-[#5b2122]/10 text-[#5b2122] px-2 py-0.5 rounded-full font-poppins">para Guennita</span>
              </div>
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
                    src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1000&auto=format&fit=crop"
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
                <p className="font-tahoma text-[15px] sm:text-[16px] text-[#3a312d]/75 font-light leading-relaxed">
                  Acredito que os momentos mais valiosos da vida não são medidos pelo tempo, mas pelo afeto que neles depositamos. No ateliê, cada detalhe é desenhado para ser uma extensão desse sentimento: desde a curadoria sensível das matérias-primas até o toque feito inteiramente à mão.
                </p>
                <p className="font-tahoma text-[15px] sm:text-[16px] text-[#3a312d]/75 font-light leading-relaxed">
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
                Júlia Aleixo
              </span>
              <span className="text-[9px] uppercase font-bold tracking-[0.25em] text-[#cca062] font-poppins block mb-6">
                A Arte das Pequenas Intenções
              </span>

              <div className="space-y-5 font-tahoma text-sm text-[#6d5443]/85 font-light leading-relaxed max-w-xl text-justify px-2">
                <p>
                  O Ateliê Júlia Aleixo nasceu do desejo profundo de resgatar o valor do tempo e do afeto no ato de presentear. Em um mundo onde tudo caminha de forma apressada, escolhi ir na direção oposta: a do fazer manual, do respiro cuidadoso e da presença em cada laço de fita.
                </p>
                <p>
                  Formada com a paixão pela estética clássica e pela sofisticação dos papéis e fragrâncias europeias, reuni sob este teto quatro vertentes que dão vida às minhas maiores aspirações de criação.
                </p>
                <p>
                  Na <strong>Pallyra</strong>, criamos o aroma da lembrança através de sabonetes e velas com blends delicate que permanecem no ambiente. Na <strong>Guennita</strong>, celebramos a delicada sofisticação de joias e relicários para guardar segredos dourados. Com a <strong>Mimada</strong>, levamos mimos atenciosos para a intimidade do dia a dia, e na <strong>Tutty Mimo</strong> expressamos o afeto no ambiente de forma pura.
                </p>
                <p>
                  Minha maior recompensa é saber que cada peça que sai de nossas mãos torna-se parte de um momento inesquecível na vida de alguém. Entrar aqui é um convite para desacelerar, respirar e presentear quem você ama com a mais sincera e bela das intenções.
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
      
      {/* FINAL EMOTIONAL TRUST BANNER */}
      <section className="bg-[#faf8f5] border-y border-[#e8dcc8]/40 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center select-none">
          <Heart size={20} className="text-[#c96b71] mx-auto mb-4 animate-pulse" />
          <p className="font-parisienne text-2.5xl sm:text-3.5xl text-[#3A312D] leading-snug mb-3 max-w-xl mx-auto font-normal">
            "Buscamos encantar detalhes, valorizando instantes felizes e cultivando laços eternos."
          </p>
          <span className="text-[8.5px] font-bold uppercase tracking-[0.25em] text-[#6d5443]/60 font-poppins block">
            Padrão de Qualidade Vitrine Ateliê
          </span>
        </div>
      </section>

      {/* PREMIUM CHIC FOOTER */}
      <footer className="bg-white border-t border-[#e8dcc8]/25 pt-16 pb-10 px-6 sm:px-12 font-sans overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-10">
          <div className="md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4 flex flex-col items-center md:items-start cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <LogoAndSignature small={true} />
            </div>
            <p className="text-[11px] text-[#6d5443]/85 mb-6 max-w-[220px] leading-relaxed font-light font-tahoma">
              Kits afetivos luxuosos e presentes exclusivos sob medida para demonstrar carinho em momentos memoráveis.
            </p>
            <div className="flex gap-4.5 text-[#cca062]/80">
              <a href="#ateliers" className="hover:text-[#3A312D] transition-colors" title="Nossos ateliês"><Info size={15} /></a>
              <a href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`} className="hover:text-[#3A312D] transition-colors" title="Fale pelo Whatsapp"><Mail size={15} /></a>
              <button onClick={() => navigate('/document')} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Verificar documentos"><Search size={15} /></button>
              <button onClick={() => navigate('/admin')} className="hover:text-[#3A312D] transition-colors outline-none cursor-pointer" title="Entrar no Painel"><User size={15} /></button>
            </div>
          </div>
          
          <div className="md:w-1/4">
             <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Ateliês</h4>
             <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
               {ateliers.map((a) => (
                 <li key={a.id}><button onClick={() => navigate(a.route)} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">{a.name}</button></li>
               ))}
             </ul>
          </div>

          <div className="md:w-1/4">
             <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Navegação</h4>
             <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
               <li><a href="#kits" className="hover:text-[#cca062] transition-colors">Kits Prontos</a></li>
               <li><button onClick={() => navigate('/kit-meukit')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Monte seu Kit</button></li>
               <li><a href="#produtos" className="hover:text-[#cca062] transition-colors">Produtos</a></li>
               <li><button onClick={() => navigate('/listadepresentes-info')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Lista de Presentes</button></li>
             </ul>
          </div>
          
          <div className="md:w-1/4">
             <h4 className="text-[9.5px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Suporte</h4>
             <ul className="space-y-3 text-[11px] font-light text-[#6d5443]/80 font-tahoma">
               <li><button onClick={() => navigate('/rastreamento')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer">Rastreamento de Pedido</button></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Prazos e Entregas</a></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Trocas e devoluções</a></li>
             </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#e8dcc8]/20 pt-6.5 flex flex-col lg:flex-row justify-between items-center gap-5 text-[8.5px] text-[#6d5443]/65 font-semibold uppercase tracking-widest leading-loose">
          <p className="text-center lg:text-left font-sans">
            © {new Date().getFullYear()} Presentes Personalizados by Julia Aleixo. Todos os direitos reservados. CNPJ {config.store_cnpj || "Sob Consulta"}.
          </p>
          
          <div className="flex items-center gap-2 text-xs">
            <Package size={11} className="text-[#cca062]" /> 
            <span className="font-poppins font-semibold tracking-widest text-[#3A312D] text-[8.5px] uppercase">Artesanato 100% Seguro</span>
          </div>

          <div className="flex items-center gap-3 bg-[#faf8f5]/60 border border-[#e8dcc8]/40 py-1 px-3 rounded-xl scale-95 origin-center">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/2/29/Mercado_Pago_logo_auxiliar.svg" 
               alt="Mercado Pago" 
               className="h-3 object-contain" 
               onError={(e) => {
                 e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Mercado_Pago.png";
               }}
             />
             <div className="flex flex-col items-start leading-tight border-l border-[#e8dcc8]/60 pl-2">
               <span className="text-[6px] tracking-widest font-semibold text-[#6d5443]/50 uppercase">Processado por</span>
               <span className="text-[7px] font-extrabold text-[#00a6e0] tracking-widest uppercase font-poppins">Mercado Pago</span>
             </div>
          </div>
        </div>
      </footer>
      
      {!isAdmin && (
        <button 
           onClick={() => navigate('/admin')}
           className="fixed bottom-4 right-4 w-9 h-9 flex items-center justify-center opacity-0 hover:opacity-100 text-[#6d5443] transition-opacity z-[999]"
           title="Painel Administrativo"
        >
          <Info size={13} />
        </button>
      )}

    </div>
  );
};
