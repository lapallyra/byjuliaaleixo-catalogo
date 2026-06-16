import React, { useState, useEffect } from 'react';
import { Search, Heart, Info, Package, Mail, User, Sparkles, ArrowRight, ArrowRightLeft, Gift, ShoppingBag, Eye, Star } from 'lucide-react';
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

export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [] }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [searchCode, setSearchCode] = useState('');

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
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
        <span className={`font-parisienne text-[#3A312D] tracking-wide relative whitespace-nowrap ${
          small ? "text-[16px] sm:text-[18px]" : "text-3xl sm:text-4xl"
        }`}>
          personalizados
        </span>
      </div>

      {/* Assinatura: by Julia Aleixo (handwritten font class) */}
      <div className={`absolute select-none font-allura text-[#6d5443] font-medium leading-none rotate-[-4deg] ${
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
    <div className="bg-[#fffdfa] min-h-[100dvh] w-full relative font-tahoma text-[#6d5443] selection:bg-[#e8dcc8] selection:text-[#3A312D] overflow-x-hidden antialiased">
      
      {/* LUXURY NAVIGATION HEADER */}
      <header className="w-full bg-white/85 backdrop-blur-md border-b border-[#e8dcc8]/30 py-3.5 px-4 sm:px-6 sticky top-0 z-50 transition-all shadow-xs">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4 px-2">
          {/* LOGO */}
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-95 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <LogoAndSignature small={true} />
          </div>

          {/* DENSE NAVIGATION LINKS */}
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[#6d5443]/90 tracking-[0.12em] font-semibold text-[10px] sm:text-[11px] uppercase select-none font-poppins">
            <a href="#ateliers" className="hover:text-[#cca062] transition-colors relative group py-1">
              Ateliês
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#cca062] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a href="#kits" className="hover:text-[#cca062] transition-colors relative group py-1">
              Kits Prontos
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#cca062] group-hover:w-full transition-all duration-300"></span>
            </a>
            <button 
              onClick={() => navigate('/kit-meukit')} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-[0.12em] text-[10px] sm:text-[11px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block relative group py-1"
            >
              Monte seu Kit
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#cca062] group-hover:w-full transition-all duration-300"></span>
            </button>
            <a href="#produtos" className="hover:text-[#cca062] transition-colors relative group py-1">
              Produtos
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#cca062] group-hover:w-full transition-all duration-300"></span>
            </a>
            <button 
              onClick={() => navigate('/listadepresentes-info')} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-[0.12em] text-[10px] sm:text-[11px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block relative group py-1"
            >
              Lista de Presentes
              <span className="absolute bottom-0 left-0 w-0 h-[1.5px] bg-[#cca062] group-hover:w-full transition-all duration-300"></span>
            </button>
          </nav>
          
          {/* MINI TRACKING FORM */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
              } else {
                navigate('/document');
              }
            }}
            className="flex items-center gap-2 bg-[#faf8f5] border border-[#e8dcc8]/75 rounded-full px-4 py-1.5 text-[11px] font-sans text-[#6d5443] shadow-xs hover:border-[#cca062]/50 transition-all w-full sm:w-auto max-w-[210px]"
          >
            <button type="submit" className="text-[#cca062] outline-none hover:scale-105 transition-transform" title="Buscar rastreamento">
              <Search size={13} strokeWidth={2.5} />
            </button>
            <input 
              type="text" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Rastreio do Pedido..." 
              className="bg-transparent focus:outline-none w-full text-[#6d5443] placeholder-[#6d5443]/45 font-medium text-[11px] tracking-wide select-text border-none p-0" 
            />
          </form>
        </div>
      </header>

      {/* EDITORIAL HERO BANNER - BOUTIQUE PREMIUM HERO */}
      <section className="relative w-full min-h-[80vh] lg:min-h-[90vh] overflow-hidden bg-gradient-to-b from-[#faf8f5] to-[#fffdfa] flex items-center border-b border-[#e8dcc8]/20 py-12 lg:py-0">
        {/* Soft Decorative Elements */}
        <div className="absolute top-1/2 left-5 w-44 h-44 rounded-full bg-[#cca062]/4 blur-2xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-[#c96b71]/3 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* LEFT COLUMN: DESKTOP ONLY/ADAPTIVE FOR BOTH */}
            <div className="hidden lg:flex flex-col justify-center items-start text-left max-w-[500px] py-12">
              {/* Elemento 1 — Assinatura emocional */}
              <span className="font-allura text-[#cca062] font-semibold tracking-wide text-[36px] lg:text-[42px] leading-none mb-2 block select-none">
                by Julia Aleixo
              </span>
              
              {/* Elemento 2 — Título principal */}
              <h1 className="font-poppins font-extrabold text-[65px] lg:text-[75px] text-[#3A312D] tracking-[0.14em] leading-none mb-6">
                PRESENTES
              </h1>
              
              {/* Elemento 3 — Texto institucional */}
              <p className="font-tahoma text-[16px] lg:text-[18px] text-[#3a312d]/75 font-light leading-relaxed mb-9">
                Quatro ateliês, um só propósito: transformar momentos em lembranças eternas.
              </p>
              
              {/* Botões lado a lado */}
              <div className="flex items-center gap-4 w-full">
                {/* Botão principal */}
                <button
                  onClick={() => navigate('/kit-meukit')}
                  className="h-[52px] px-8 rounded-full bg-[#3A312D] text-white font-semibold text-xs uppercase tracking-[0.14em] hover:scale-102 hover:shadow-[0_8px_20px_rgba(58,49,45,0.25)] hover:bg-[#4d423e] transition-all duration-300 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Gift size={13} className="text-[#e8dcc8]" />
                  Escolher meu presente
                </button>
                
                {/* Botão secundário */}
                <a
                  href="#ateliers"
                  className="h-[52px] px-8 rounded-full bg-transparent border border-[#cca062] text-[#cca062] font-semibold text-xs uppercase tracking-[0.14em] hover:bg-[#cca062] hover:text-[#3A312D] transition-all duration-300 cursor-pointer flex items-center justify-center"
                >
                  Conhecer os ateliês
                </a>
              </div>
            </div>

            {/* MOBILE ONLY HERO: Emocional & Centralizado (No Copying Desktop) */}
            <div className="flex lg:hidden flex-col items-center text-center py-6 w-full">
              {/* Assinatura emocional */}
              <span className="font-allura text-[#cca062] font-semibold text-[32px] sm:text-[38px] leading-none mb-1 select-none">
                by Julia Aleixo
              </span>
              
              {/* Título principal */}
              <h1 className="font-poppins font-extrabold text-[44px] sm:text-[56px] text-[#3A312D] tracking-[0.1em] leading-none mb-5">
                PRESENTES
              </h1>
              
              {/* Texto institucional */}
              <p className="font-tahoma text-[14px] sm:text-[16px] text-[#3a312d]/75 font-light leading-relaxed mb-8 max-w-sm">
                Quatro ateliês, um só propósito: transformar momentos em lembranças eternas.
              </p>
              
              {/* Botões empilhados ocupando quase toda largura */}
              <div className="flex flex-col gap-3 w-full max-w-xs sm:max-w-sm">
                <button
                  onClick={() => navigate('/kit-meukit')}
                  className="h-[52px] w-full rounded-full bg-[#3A312D] text-white font-semibold text-[11px] uppercase tracking-[0.12em] transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                >
                  <Gift size={13} className="text-[#e8dcc8]" />
                  Escolher meu presente
                </button>
                
                <a
                  href="#ateliers"
                  className="h-[52px] w-full rounded-full bg-transparent border border-[#cca062] text-[#cca062] font-semibold text-[11px] uppercase tracking-[0.12em] transition-all active:scale-98 cursor-pointer flex items-center justify-center"
                >
                  Conhecer os ateliês
                </a>
              </div>
            </div>

            {/* RIGHT COLUMN: PRESERVED SOPHISTICATED HERO VISUAL */}
            <div className="hidden lg:block relative w-full h-[480px] lg:h-[540px] rounded-[32px] overflow-hidden shadow-[0_12px_32px_rgba(109,84,67,0.06)] border border-[#e8dcc8]/45 bg-[#faf8f5]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1200&auto=format&fit=crop"
                alt="Ateliê de Presentes Finos"
                className="w-full h-full object-cover"
                isThumbnail={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3A312D]/10 to-transparent" />
            </div>

          </div>
        </div>
      </section>

      {/* BOUTIQUE ATELIERS HUB (INTERACTIVE VITRINE DE LUXO) */}
      <section id="ateliers" className="scroll-mt-24 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#cca062] font-poppins">Navegação Boutique</span>
          <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-[#3A312D] tracking-tight mt-1 mb-2">Conheça Nossos Ateliês</h2>
          <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
          <p className="font-allura text-base text-[#cca062] lowercase mb-1 block">pequenos detalhes de imenso afeto</p>
          <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
            Cada marca possui uma curadoria especializada com artigos confeccionados inteiramente de forma manual.
          </p>
        </div>

        {/* MOBILE: Editorial scroll-carousel; DESKTOP: Wide Grid */}
        <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide snap-x px-4 -mx-6 sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-6">
          {ateliers.map((atelier) => (
            <div
              key={atelier.id}
              onClick={() => navigate(atelier.route)}
              className="snap-center shrink-0 w-[275px] sm:w-auto flex flex-col justify-between border border-[#e8dcc8]/50 bg-white rounded-3xl p-6 shadow-2xs hover:shadow-md hover:border-[#cca062]/60 transition-all duration-500 cursor-pointer group relative overflow-hidden"
            >
              {/* Card visual details */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#cca062]/3 rounded-bl-full blur-xs pointer-events-none group-hover:bg-[#cca062]/6 transition-colors" />
              
              <div>
                <div className="w-12 h-12 rounded-full border border-[#e8dcc8]/40 bg-[#faf8f5] flex items-center justify-center text-xl shadow-3xs mb-4 select-none group-hover:scale-105 transition-transform duration-300">
                  {atelier.emoji}
                </div>
                
                <h3 className="font-poppins font-semibold text-base text-[#3A312D] leading-snug mb-0.5 group-hover:text-[#cca062] transition-colors">
                  {atelier.name}
                </h3>
                
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#6d5443]/65 block mb-3 font-poppins">
                  {atelier.subtitle}
                </span>
                
                <p className="text-[11px] text-[#6d5443]/80 leading-relaxed font-light mb-4">
                  {atelier.details}
                </p>
              </div>

              <div className="pt-2 border-t border-[#faf8f5] mt-2 flex items-center justify-between">
                <span className="font-cormorant-italic italic text-sm text-[#cca062]">
                  &ldquo;{atelier.tagline}&rdquo;
                </span>
                <span className="w-7 h-7 rounded-full bg-[#faf8f5] border border-[#e8dcc8]/40 flex items-center justify-center text-[#cca062] group-hover:bg-[#cca062] group-hover:text-white transition-all">
                  <ArrowRight size={12} strokeWidth={2.5} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KITS EXCLUSIVOS */}
      <section id="kits" className="scroll-mt-24 py-16 bg-[#faf8f5]/80 border-y border-[#e8dcc8]/15 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#cca062] font-poppins">Prontos para Presentear</span>
            <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-[#3A312D] tracking-tight mt-1 mb-2">Kits Únicos Selecionados</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
            <p className="font-allura text-base text-[#cca062] lowercase mb-1 block">detalhes prontos para encantar</p>
            <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
              Combinações primorosas de produtos embalados com afeto, prontos para encantar em datas históricas.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-6xl mx-auto px-2">
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
      <section className="my-16 max-w-5xl mx-auto px-6">
        <div className="bg-gradient-to-br from-[#faf8f5] to-white border border-[#e8dcc8]/60 rounded-3xl p-6 sm:p-10 shadow-3xs flex flex-col lg:flex-row items-center justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-[#cca062]/3 rounded-br-full blur-md pointer-events-none" />
         
          <div className="max-w-xl text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#cca062]/10 mb-3.5 border border-[#cca062]/10">
              <Sparkles size={10} className="text-[#cca062]" />
              <span className="text-[8px] font-bold uppercase tracking-widest text-[#cca062] font-poppins">Customização Avançada</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-poppins font-bold text-[#3A312D] tracking-tight mb-2">
              Monte o Seu Próprio Kit de Afeto
            </h3>
            <p className="text-[11px] sm:text-xs text-[#6d5443]/85 leading-relaxed font-light mb-4">
              Crie uma combinação personalizada escolhendo a caixa ideal, adicionando os mimos artesanais preferidos e inserindo um cartão com mensagem gravada. Rápido, objetivo e acolhedor!
            </p>
            <div className="grid grid-cols-3 gap-3 text-center text-[#6d5443]/70 font-semibold text-[8px] tracking-wider uppercase font-poppins pt-2">
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#e8dcc8] flex items-center justify-center font-bold font-sans">1</span>
                <span>Escolha a Caixa</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#e8dcc8] flex items-center justify-center font-bold font-sans">2</span>
                <span>Adicione Mimos</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-white border border-[#e8dcc8] flex items-center justify-center font-bold font-sans">3</span>
                <span>Escolha o Cartão</span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 relative z-10">
            <button
              onClick={() => navigate('/kit-meukit')}
              className="bg-[#cca062] hover:bg-[#b88c52] text-white px-8 py-3.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest shadow-xs hover:shadow-md transition-all ease-out cursor-pointer inline-flex items-center gap-2 font-poppins"
            >
              Iniciar Construtor <ArrowRight size={12} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>

      {/* PRODUTOS (VITRINE DIRETA DE PRODUTOS PREMIUM COM MAPEAMENTO DE ATELIÊS) */}
      <section id="produtos" className="scroll-mt-24 py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#cca062] font-poppins">Vitrine de Destaques</span>
          <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-[#3A312D] tracking-tight mt-1 mb-2">Artigos Selecionados</h2>
          <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
          <p className="font-allura text-base text-[#cca062] lowercase mb-1 block">mimos e afetos para sua escolha</p>
          <p className="text-xs text-[#6d5443]/70 font-light max-w-md mx-auto leading-relaxed">
            Navegue pelos produtos mais queridos de nossas marcas e monte um acervo de memórias marcantes.
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
      <section className="py-16 bg-white border-t border-[#e8dcc8]/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#cca062] font-poppins">Depoimentos Reais</span>
            <h2 className="text-2xl sm:text-3xl font-poppins font-bold text-[#3A312D] tracking-tight mt-1 mb-2">Feedback que Amamos</h2>
            <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-3 mb-2"></div>
            <p className="font-allura text-base text-[#cca062] lowercase mb-1 block">frases de carinho e afeto</p>
            <p className="text-xs text-[#6d5443]/70 font-light max-w-sm mx-auto leading-relaxed">
              Mensagens espontâneas enviadas por clientes que receberam um pedaço do nosso coração.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
      
      {/* FINAL EMOTIONAL TRUST BANNER */}
      <section className="bg-[#faf8f5] border-y border-[#e8dcc8]/40 py-12 px-6">
        <div className="max-w-3xl mx-auto text-center select-none">
          <Heart size={20} className="text-[#c96b71] mx-auto mb-4 animate-pulse" />
          <p className="font-parisienne text-2xl sm:text-3xl text-[#3A312D] leading-snug mb-3 max-w-xl mx-auto">
            "Buscamos encantar detalhes, valorizando instantes felizes e cultivando laços eternos."
          </p>
          <span className="text-[8.5px] font-bold uppercase tracking-[0.25em] text-[#6d5443]/60 font-poppins block">
            Padrão de Qualidade Vitrine Ateliê
          </span>
        </div>
      </section>

      {/* PREMIUM CHIC FOOTER */}
      <footer className="bg-white border-t border-[#e8dcc8]/40 pt-16 pb-10 px-6 sm:px-12 font-sans overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-10">
          <div className="md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4 flex flex-col items-center md:items-start cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <LogoAndSignature small={true} />
            </div>
            <p className="text-[11px] text-[#6d5443]/90 mb-6 max-w-[220px] leading-relaxed font-medium">
              Kits afetivos luxuosos e presentes exclusivos sob medida para demonstrar carinho em momentos memoráveis.
            </p>
            <div className="flex gap-4.5 text-[#cca062]">
              <a href="#ateliers" className="hover:text-[#6d5443] transition-colors" title="Nossos ateliês"><Info size={16} /></a>
              <a href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`} className="hover:text-[#6d5443] transition-colors" title="Fale pelo Whatsapp"><Mail size={16} /></a>
              <button onClick={() => navigate('/document')} className="hover:text-[#6d5443] transition-colors outline-none cursor-pointer" title="Verificar documentos"><Search size={16} /></button>
              <button onClick={() => navigate('/admin')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer" title="Entrar no Painel"><User size={16} /></button>
            </div>
          </div>
          
          <div className="md:w-1/4">
             <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Ateliês</h4>
             <ul className="space-y-3.5 text-[11px] font-medium text-[#6d5443]/80">
               {ateliers.map((a) => (
                 <li key={a.id}><button onClick={() => navigate(a.route)} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">{a.name}</button></li>
               ))}
             </ul>
          </div>

          <div className="md:w-1/4">
             <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins">Navegação</h4>
             <ul className="space-y-3.5 text-[11px] font-medium text-[#6d5443]/80">
               <li><a href="#kits" className="hover:text-[#cca062] transition-colors">Kits Prontos</a></li>
               <li><button onClick={() => navigate('/kit-meukit')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Monte seu Kit</button></li>
               <li><a href="#produtos" className="hover:text-[#cca062] transition-colors">Produtos</a></li>
               <li><button onClick={() => navigate('/listadepresentes-info')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer text-left">Lista de Presentes</button></li>
             </ul>
          </div>
          
          <div className="md:w-1/4">
             <h4 className="text-[10px] font-bold tracking-[0.2em] text-[#3A312D] uppercase mb-4.5 font-poppins font-semibold">Suporte</h4>
             <ul className="space-y-3.5 text-[11px] font-medium text-[#6d5443]/80">
               <li><button onClick={() => navigate('/rastreamento')} className="hover:text-[#cca062] transition-colors outline-none cursor-pointer">Rastreamento de Pedido</button></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Prazos e Entregas</a></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Trocas e devoluções</a></li>
             </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#e8dcc8]/30 pt-6.5 flex flex-col lg:flex-row justify-between items-center gap-5 text-[9px] text-[#6d5443]/70 font-semibold uppercase tracking-wider">
          <p className="text-center lg:text-left font-sans">
            © {new Date().getFullYear()} Presentes Personalizados by Julia Aleixo. Todos os direitos reservados. CNPJ {config.store_cnpj || "Sob Consulta"}.
          </p>
          
          <div className="flex items-center gap-2 text-xs">
            <Package size={11} className="text-[#cca062]" /> 
            <span className="font-poppins font-bold tracking-widest text-[#3A312D] text-[9px] uppercase">Artesanato 100% Seguro</span>
          </div>

          <div className="flex items-center gap-3 bg-[#faf8f5] border border-[#e8dcc8]/60 py-1.5 px-3.5 rounded-2xl">
             <img 
               src="https://upload.wikimedia.org/wikipedia/commons/2/29/Mercado_Pago_logo_auxiliar.svg" 
               alt="Mercado Pago" 
               className="h-3.5 object-contain" 
               onError={(e) => {
                 e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Mercado_Pago.png";
               }}
             />
             <div className="flex flex-col items-start leading-tight border-l border-[#e8dcc8]/60 pl-2">
               <span className="text-[6.5px] tracking-widest font-bold">Processado por</span>
               <span className="text-[7.5px] font-extrabold text-[#00a6e0] tracking-widest uppercase">Mercado Pago</span>
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
