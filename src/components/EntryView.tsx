import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageCircle, User, X, CheckCircle, FileText, LayoutDashboard } from 'lucide-react';
import { AppConfig, CompanyId, SiteSettings } from '../types';
import { login } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { subscribeToAllSettings } from '../services/firebaseService';
import { themes } from '../lib/theme';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';

interface EntryViewProps {
  config: AppConfig;
}

export const EntryView: React.FC<EntryViewProps> = ({ config }) => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});

  const holdTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
  }, []);

  const [clickCount, setClickCount] = useState(0);

  const handleAdminAuth = () => {
    navigate('/admin');
  };

  const startHold = (e: React.MouseEvent | React.TouchEvent) => {
    // Desktop click handler
    if (e.type === 'mousedown') {
      if (isAdmin) {
        handleAdminAuth();
        return;
      }
      const next = clickCount + 1;
      if (next >= 5) {
        handleAdminAuth();
        setClickCount(0);
      } else {
        setClickCount(next);
      }
      return;
    }

    // Mobile hold handler
    setIsHolding(true);
    if (isAdmin) {
      handleAdminAuth();
      stopHold();
      return;
    }
    setHoldProgress(0);
    
    let progress = 0;
    progressIntervalRef.current = setInterval(() => {
      progress += 2;
      if (progress >= 100) {
        clearInterval(progressIntervalRef.current!);
        handleAdminAuth();
        stopHold();
      } else {
        setHoldProgress(progress);
      }
    }, 40); // 2 seconds total loop (40ms * 50 steps = 2000ms)
  };

  const stopHold = () => {
    setIsHolding(false);
    setHoldProgress(0);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const companies = [
    { 
      id: 'pallyra' as CompanyId, 
      logo: customSettings['pallyra']?.store_logo || config.company_1_logo, 
      logoScale: customSettings['pallyra']?.store_logo_scale || 1,
      logoRotate: customSettings['pallyra']?.store_logo_rotate || 0,
      logoX: customSettings['pallyra']?.store_logo_x || 0,
      logoY: customSettings['pallyra']?.store_logo_y || 0,
      name: 'La Pallyra', 
      slogan: 'é um atelie de encadernação personalizada, onde o seu dia a dia está garantido com alta qualidade.',
      color: '#000000',
      accent: '#D4AF37',
      route: '/lapallyra'
    },
    { 
      id: 'guennita' as CompanyId, 
      logo: customSettings['guennita']?.store_logo || config.company_2_logo, 
      logoScale: customSettings['guennita']?.store_logo_scale || 1,
      logoRotate: customSettings['guennita']?.store_logo_rotate || 0,
      logoX: customSettings['guennita']?.store_logo_x || 0,
      logoY: customSettings['guennita']?.store_logo_y || 0,
      name: 'com amor, Guennita', 
      slogan: 'é um atelie de personalizados com cetim e cartonagem de luxo para momentos que tem que ser excepcionais.',
      color: '#56070c',
      accent: '#D4AF37',
      route: '/comamorguennita'
    },
    { 
      id: 'mimada' as CompanyId, 
      logo: customSettings['mimada']?.store_logo || config.company_3_logo, 
      logoScale: customSettings['mimada']?.store_logo_scale || 1,
      logoRotate: customSettings['mimada']?.store_logo_rotate || 0,
      logoX: customSettings['mimada']?.store_logo_x || 0,
      logoY: customSettings['mimada']?.store_logo_y || 0,
      name: 'Mimada Sim', 
      slogan: 'é um atelie que pra qualquer momento da sua vida você vai encontar uma lembrancinha/brinde personalizado que é do seu jeitinho.',
      color: '#FF007F',
      accent: '#FF007F',
      route: '/mimadasim'
    }
  ];

  const renderLogo = (companyName: string, logo: string | undefined | null, scale: number = 1, rotate: number = 0, x: number = 0, y: number = 0) => {
    const isMimada = companyName.toLowerCase().includes('mimada');
    if (logo && logo !== 'undefined' && (logo.startsWith('http') || logo.startsWith('/') || logo.startsWith('data:'))) {
      return (
        <div className={`w-24 h-24 rounded-full bg-white flex items-center justify-center border-2 border-black/5 ${isMimada ? 'shadow-sm' : 'shadow-inner'} overflow-hidden relative`}>
          <ImageWithFallback 
            src={logo} 
            alt={companyName} 
            className="w-full h-full object-contain p-2 transition-transform duration-[1.5s] ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:[transform:rotateY(360deg)]" 
            style={{ transform: `translate(${x}px, ${y}px) scale(${scale}) rotate(${rotate}deg)` }}
            referrerPolicy="no-referrer"
            onError={(e) => {
               const parent = e.currentTarget.parentElement;
               if (parent) {
                 e.currentTarget.style.display = 'none';
                 const fallback = document.createElement('div');
                 fallback.className = "absolute inset-0 flex items-center justify-center text-gray-400 font-bold text-3xl uppercase bg-gray-50";
                 fallback.innerText = companyName.split(' ').map(n => n[0]).join('').substring(0, 2);
                 parent.appendChild(fallback);
               }
            }}
          />
        </div>
      );
    }
    
    // Fallback: render initials if logo is not available
    return (
      <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center border-2 border-gray-100 text-[#D4AF37] font-bold text-3xl shadow-sm">
        {companyName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <div className="bg-[#FAF9F6] min-h-[100dvh] flex flex-col items-center justify-center p-6 md:p-10 relative overflow-hidden">
      {/* Google Fonts Import for Signature */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap');
        .font-signature-real { font-family: 'Alex Brush', cursive; }
      `}} />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-16 relative z-10 px-4 mt-8"
      >
        <div className="flex flex-col items-center w-full mx-auto relative px-4">
          <div className="relative inline-block">
            <h1 
              className="text-4xl md:text-6xl relative whitespace-nowrap text-center font-hand"
              style={{ color: '#D4AF37', borderBottom: '1px solid rgba(212,175,55,0.2)', paddingBottom: '0.8rem' }}
            >
              Catálogo dos Personalizados
            </h1>
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 1 }}
              className="absolute font-signature-real pointer-events-none select-none"
              style={{ 
                left: '100%',
                marginLeft: '-25px', 
                marginTop: '-15px', 
                fontSize: '17px', 
                color: '#2D2D2D',
                opacity: 1, 
                transform: 'rotate(-5deg)',
                whiteSpace: 'nowrap'
              }}
            >
              By Julia Aleixo
            </motion.span>
          </div>
        </div>
        <p className="font-serif text-[#161616] font-medium mt-12 md:mt-14 text-lg md:text-2xl leading-relaxed text-center max-w-2xl mx-auto italic opacity-90">
          O tempo passa rápido… garanta hoje mesmo o presente que vai marcar esse momento para sempre.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 max-w-7xl w-full relative z-10 px-6 pb-20 mt-4 md:mt-8">
        {companies.map((company, index) => {
          const theme = themes[company.id];
          return (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              default: { duration: 0.35, ease: "easeOut" },
              opacity: { delay: index === 0 ? 0 : 0.2 + index * 0.1, duration: 0.8 },
              y: { delay: index === 0 ? 0 : 0.2 + index * 0.1, duration: 0.8 }
            }}
            whileHover={{ 
              scale: 1.03,
              backgroundColor: company.color,
              boxShadow: `0 0 30px ${company.accent}25`,
              borderColor: company.accent
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(company.route)}
            className={`group theme-${company.id === 'mimada' ? 'mimadasim' : company.id === 'pallyra' ? 'lapallyra' : 'guennita'} bg-white/70 backdrop-blur-3xl rounded-[2.5rem] p-12 text-center cursor-pointer border border-[#D4AF37]/20 transition-all duration-400 ease-out relative flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.03)]`}
          >
            <div className="h-24 flex items-center justify-center text-7xl mb-6 transition-transform duration-500 ease-out group-hover:scale-105 relative z-10">
              {renderLogo(company.name, company.logo, company.logoScale, company.logoRotate, company.logoX, company.logoY)}
            </div>
      <h2 className={`font-beauty ${theme.specialText} mb-2 tracking-wide transition-all duration-400 group-hover:!text-[var(--theme-text,white)] whitespace-nowrap ${company.id === 'guennita' ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'} relative z-10`}>
        {company.name}
      </h2>
            <p className="text-[11px] md:text-xs font-sans leading-relaxed tracking-wide text-gray-400 opacity-0 translate-y-4 max-h-0 mb-0 group-hover:max-h-40 group-hover:mb-10 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:!text-[var(--theme-text,white)] max-w-[260px] relative z-10">
              {company.slogan}
            </p>
            <button className={`py-4 px-12 rounded-full text-[10px] font-black tracking-widest uppercase transition-all duration-500 hover:scale-110 shadow-lg relative z-10 group-hover:bg-white/20 group-hover:!text-[var(--theme-text,white)] group-hover:!border-[var(--theme-text,white)]/40 border ${company.id === 'mimada' ? 'bg-[#FF007F] text-white border-transparent' : 'bg-white text-black border-transparent'}`}>
              Entrar
            </button>
          </motion.div>
          );
        })}
      </div>

      <motion.a
        href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 transition-all duration-300"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md text-[#161616] shadow-sm border border-black/5 opacity-0 hover:opacity-100 transition-opacity duration-300 whitespace-nowrap hidden md:block">
          Fale conosco
        </span>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md border border-black/5 shadow-lg active:scale-95 transition-all">
          <MessageCircle size={14} className="text-[#161616]/70" strokeWidth={1.5} />
        </div>
      </motion.a>

      {/* Persistent subtle admin trigger icon */}
      <div 
        onMouseDown={startHold}
        onTouchStart={startHold}
        onTouchEnd={stopHold}
        className="fixed bottom-6 left-6 w-12 h-12 flex items-center justify-center cursor-pointer select-none z-[9999] opacity-40 hover:opacity-100 transition-all active:scale-95 group touch-none bg-white/40 backdrop-blur-md rounded-full border border-white/20"
      >
        {isHolding && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-lilac/20"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="138.23"
              strokeDashoffset={138.23 - (138.23 * holdProgress) / 100}
              className="text-lilac"
            />
          </svg>
        )}
        {isAdmin ? (
          <LayoutDashboard size={18} className="text-lilac shrink-0" />
        ) : (
          <User size={18} className="text-[#D4AF37]/50 group-hover:text-[#D4AF37] shrink-0" />
        )}
      </div>

      {/* Busca de Pedidos / Comprovantes */}
      <div className="mt-16 relative z-10 w-full max-w-xs px-6 flex justify-center mx-auto">
        <button 
          onClick={() => navigate('/document')}
          className="w-full flex items-center justify-center gap-3 bg-white/40 backdrop-blur-sm border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 text-black font-sans uppercase text-[9px] tracking-[0.2em] font-black py-3 px-5 rounded-[2rem] transition-all hover:bg-white shadow-[0_0_15px_rgba(212,175,55,0.02)]"
        >
          <FileText size={14} className="text-[#D4AF37]/60" />
          Meu Pedido
        </button>
      </div>

      {/* Footer Legal & Copyright */}
      <footer className="mt-20 py-10 w-full max-w-7xl border-t border-[#D4AF37]/20 text-center space-y-4 px-6 relative z-10">
         <div className="max-w-4xl mx-auto">
            <p className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.2em] mb-2 text-black">Aspectos Legais e de Conformidade</p>
            <p className="text-[7px] md:text-[9px] leading-relaxed font-bold text-gray-900 max-w-2xl mx-auto">
              Este catálogo é uma vitrine digital para os ateliês de Julia Aleixo. Ao acessar e escolher um ateliê, você será direcionado para uma experiência personalizada. 
              As marcas La Pallyra, <span className="whitespace-nowrap">com amor, Guennita</span> e Mimada Sim são propriedades intelectuais registradas. 
              Garantimos a proteção dos seus dados durante toda a navegação.
            </p>
            <div className="mt-8 pt-4 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-4">
               <span className="text-[8px] font-black uppercase tracking-widest text-black">
                 © {new Date().getFullYear()} Catálogo dos Personalizados • Julia Aleixo
               </span>
               <div className="flex items-center gap-6">
                 <span className="text-[8px] font-black uppercase tracking-widest text-black flex items-center gap-1">
                   Design por <span className="text-black">Ateliês da Ju</span>
                 </span>
                 <div className="flex items-center gap-1 text-[8px] font-black uppercase text-black">
                   Conformidade LGPD <CheckCircle size={10} className="text-emerald-500" />
                 </div>
               </div>
            </div>
         </div>
      </footer>
    </div>
  );
};

