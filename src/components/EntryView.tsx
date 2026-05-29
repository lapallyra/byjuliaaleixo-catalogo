import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, MapPin, Heart, ChevronRight, ChevronLeft, User, ShoppingBag, Star, Info, Package, Mail, Sparkles, CheckSquare, MessageCircle, ShieldCheck, Handshake, Laptop, Scissors, Gift, Bike, Truck, X } from 'lucide-react';
import { AppConfig, CompanyId, SiteSettings, Product } from '../types';
import { useAuth } from './AuthProvider';
import { subscribeToAllSettings, subscribeToFeedbacks, addFeedback } from '../services/firebaseService';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { SuggestionBox } from './SuggestionBox';

const AtelierCarousel = ({ 
  title, 
  accent, 
  products, 
  onNavigate 
}: { 
  title: string; 
  accent: string; 
  products: Product[]; 
  onNavigate: () => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="mb-12">
      <div className="flex justify-between items-end mb-4 px-2">
        <h4 className="font-beauty text-xl sm:text-2xl text-left font-normal select-none" style={{ color: accent }}>
          {title}
        </h4>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => scroll('left')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e8dcc8] bg-white text-[#6d5443] hover:text-[#cca062] hover:border-[#cca062] flex items-center justify-center transition-all cursor-pointer outline-none active:scale-90"
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e8dcc8] bg-white text-[#6d5443] hover:text-[#cca062] hover:border-[#cca062] flex items-center justify-center transition-all cursor-pointer outline-none active:scale-90"
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide scroll-smooth px-2 select-none"
      >
        {products.length === 0 ? (
          [1, 2, 3, 4].map((_, i) => (
            <div 
              key={i} 
              onClick={onNavigate}
              className="min-w-[200px] sm:min-w-[240px] flex flex-col border border-[#e8dcc8]/60 bg-white rounded-2xl p-4 gap-3 cursor-pointer hover:border-transparent hover:shadow-md transition-all shrink-0"
            >
              <div className="w-full aspect-square bg-[#faf8f5] rounded-xl flex items-center justify-center">
                <Sparkles size={20} className="text-[#cca062]/30" />
              </div>
              <h5 className="font-serif text-sm tracking-wide text-[#6d5443] text-center">Coleção em Breve</h5>
            </div>
          ))
        ) : (
          products.map((prod) => (
            <div 
              key={prod.id} 
              onClick={onNavigate}
              className="min-w-[210px] sm:min-w-[250px] max-w-[250px] flex flex-col border border-[#e8dcc8]/60 bg-white rounded-2xl overflow-hidden cursor-pointer hover:border-transparent hover:shadow-md transition-all shrink-0"
            >
              <div className="w-full aspect-[5/4] bg-[#faf8f5] overflow-hidden">
                <ImageWithFallback 
                  src={prod.image} 
                  alt={prod.product_name} 
                  className="w-full h-full object-cover transition-transform hover:scale-105 duration-[1.5s]" 
                />
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <span className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: accent }}>
                  {prod.category}
                </span>
                <h5 className="font-serif text-sm tracking-wide text-[#6d5443] truncate w-full mb-1">
                  {prod.product_name}
                </h5>
                <span className="text-[10px] uppercase tracking-wider text-gray-500">
                  A PARTIR DE R$ {prod.current_price?.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
}

export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [] }) => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [customSettings, setCustomSettings] = useState<Record<string, SiteSettings | null>>({});
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [searchCode, setSearchCode] = useState('');

  // Feedbacks states
  const [dbFeedbacks, setDbFeedbacks] = useState<any[]>([]);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [fbName, setFbName] = useState('');
  const [fbText, setFbText] = useState('');
  const [fbStars, setFbStars] = useState(5);
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSuccess, setFbSuccess] = useState(false);

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
  }, []);

  useEffect(() => {
    return subscribeToFeedbacks((loaded) => {
      // Keep only 4 feedbacks in carousel as requested:
      // "lá só será possivel aparecer 4 feedback, ao incluir um novo, substituí o mais antigo."
      setDbFeedbacks(loaded.slice(0, 4));
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => {
        const count = dbFeedbacks.length > 0 ? dbFeedbacks.length : 3;
        return (prev + 1) % count;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [dbFeedbacks]);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbName.trim() || !fbText.trim() || fbSubmitting) return;

    setFbSubmitting(true);
    try {
      await addFeedback(fbName.trim(), fbText.trim(), fbStars);
      setFbSuccess(true);
      setFbName('');
      setFbText('');
      setFbStars(5);
      setTimeout(() => {
        setFbSuccess(false);
        setIsFeedbackOpen(false);
      }, 3000);
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar feedback.');
    } finally {
      setFbSubmitting(false);
    }
  };

  const companies = [
    { 
      id: 'pallyra' as CompanyId, 
      logo: customSettings['pallyra']?.store_logo || config.company_1_logo, 
      name: 'La Pallyra', 
      slogan: 'Organização e rotina com a sua cara. Papelaria artesanal, afetiva e totalmente personalizada para se adaptar à sua forma de viver e tornar em momentos especiais seu dia a dia.',
      route: '/lapallyra',
      image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      accent: '#cca062',
      buttonBg: '#cca062',
      buttonText: 'VER CATÁLOGO',
      iconUrl: customSettings['pallyra']?.store_logo || ''
    },
    { 
      id: 'guennita' as CompanyId, 
      logo: customSettings['guennita']?.store_logo || config.company_2_logo, 
      name: 'com amor, Guennita', 
      slogan: 'Romantismo e sofisticação em cetim premium. Buquês de flores feitos à mão petála por petála, envoltos em embalagens elegantes para tornar os momentos inesquecíveis.',
      route: '/comamorguennita',
      image: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop',
      accent: '#5b2122',
      buttonBg: '#5b2122',
      buttonText: 'VER CATÁLOGO',
      iconUrl: customSettings['guennita']?.store_logo || ''
    },
    { 
      id: 'mimada' as CompanyId, 
      logo: customSettings['mimada']?.store_logo || config.company_3_logo, 
      name: 'Mimada Sim', 
      slogan: 'O ateliê onde a festa ganha vida! Lembranças e brindes personalizados, divertidos e feitos à mão para celebrar cada momento com alegria.',
      route: '/mimadasim', // might not be clickable
      image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop',
      accent: '#c96b71',
      buttonBg: '#c96b71',
      buttonText: 'VER CATÁLOGO',
      iconUrl: '' // gift icon will be used
    }
  ];

  const featuredProducts = React.useMemo(() => {
    return [...allProducts]
      .filter(p => p.isVisible !== false) // Only active/visible ones
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

  const fallbackTestimonials = [
    { name: 'Juliana A.', text: 'A experiência foi absolutamente incrível! Cada detalhe feito com tanto carinho que emociona.', stars: 5 },
    { name: 'Camila R.', text: 'Ficou mais lindo do que eu sonhei! A papelaria transformou todo o evento.', stars: 5 },
    { name: 'Mariana L.', text: 'Atendimento impecável e o produto é simplesmente perfeito.', stars: 5 },
  ];

  const testimonials = dbFeedbacks.length > 0 ? dbFeedbacks : fallbackTestimonials;

  const HeartDivider = ({ text }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center my-8 w-full">
      <div className="flex items-center justify-center w-full max-w-sm mb-2 gap-4">
        <div className="h-[1px] flex-1 border-t border-dashed border-[#c36266]/30"></div>
        <Heart size={14} strokeWidth={1.5} className="text-[#c36266]" />
        <div className="h-[1px] flex-1 border-t border-dashed border-[#c36266]/30"></div>
      </div>
      {text && <h2 className="text-xl md:text-2xl font-serif text-[#6d5443] tracking-widest uppercase">{text}</h2>}
    </div>
  );

  const LogoAndSignature = ({ small = false }: { small?: boolean }) => (
    <div className={`relative inline-flex flex-col items-center justify-center select-none py-2 px-4 font-sans ${
      small 
        ? "min-w-[150px] sm:min-w-[180px]" 
        : "min-w-[280px] sm:min-w-[420px]"
    }`}>
      {/* Camada Inferior (Fundo) - PRESENTES */}
      <div 
        className={`font-sans font-black uppercase text-[#cca062]/15 leading-none select-none text-center ${
          small ? "text-2xl sm:text-3xl" : "text-5xl sm:text-7xl"
        }`}
        style={{ letterSpacing: small ? '-1px' : '-2px' }}
      >
        PRESENTES
      </div>
      
      {/* Camada Superior (Frente) - personalizados */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none select-none ${
        small ? "pt-2 sm:pt-2.5" : "pt-4 sm:pt-6"
      }`}>
        <span className={`font-cursive text-[#211c1a] tracking-wide relative whitespace-nowrap ${
          small ? "text-lg sm:text-xl" : "text-3xl sm:text-5xl"
        }`}>
          personalizados
        </span>
      </div>

      {/* Assinatura: BY JULIA ALEIXO */}
      <div className={`absolute right-1 bottom-[1px] sm:bottom-[2px] uppercase tracking-[0.2em] font-normal text-[#211c1a] select-none ${
        small ? "text-[5.5px] sm:text-[6.5px]" : "text-[8px] sm:text-[9.5px]"
      }`}>
        BY JULIA ALEIXO
      </div>
    </div>
  );

  return (
    <div className="bg-[#fffdfa] min-h-[100dvh] w-full relative font-sans text-[#6d5443] selection:bg-[#e8dcc8] selection:text-[#3A312D] overflow-x-hidden">
      
      {/* HEADER (NAME ONLY, CENTRALIZED) */}
      <header className="w-full bg-[#fffdfa] py-6 flex justify-center items-center z-50 select-none">
        <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <LogoAndSignature />
        </div>
      </header>

      {/* NAVEGAÇÃO / FAIXA SLIM (Ateliês, Coleções, Sobre Nós, Lista de Presentes, Sugestões + Pesquisa interactiva) */}
      <div className="w-full bg-white border-y border-[#e8dcc8]/40 py-2 px-6 shadow-sm flex flex-col sm:flex-row justify-between items-center sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-4 px-4">
          
          {/* Links de navegação */}
          <div className="flex flex-wrap items-center gap-x-6 md:gap-x-10 gap-y-2 text-[#6d5443] tracking-widest text-[11px] sm:text-[10px] uppercase font-bold select-none">
            <button 
              onClick={() => navigate('/atelies')} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-widest text-[11px] sm:text-[10px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block font-bold"
            >
              Ateliês
            </button>
            <a href="#produtos" className="hover:text-[#cca062] transition-colors">Coleções</a>
            <button 
              onClick={() => navigate('/sobrenos')} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-widest text-[11px] sm:text-[10px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block font-bold"
            >
              Sobre Nós
            </button>
            <a href="#feedback" className="hover:text-[#cca062] transition-colors">Feedback</a>
            <button 
              onClick={() => navigate('/listadepresentes-info')} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-widest text-[11px] sm:text-[10px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block font-bold"
            >
              Lista de Presentes
            </button>
            <button 
              onClick={() => setIsSuggestOpen(true)} 
              className="hover:text-[#cca062] transition-colors uppercase font-bold tracking-widest text-[11px] sm:text-[10px] cursor-pointer outline-none bg-transparent border-none p-0 inline-block font-bold"
            >
              Sugestões
            </button>
          </div>
          
          {/* Barra de pesquisa direta de Pedidos ou Lista de Presentes */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
              } else {
                navigate('/document');
              }
            }}
            className="flex items-center gap-2.5 bg-[#faf8f5] hover:bg-[#fffdfa] border border-[#e8dcc8] rounded-full px-4 py-1.5 text-[11px] sm:text-[12px] font-bold text-[#6d5443] shadow-sm hover:shadow transition-all w-full sm:w-auto max-w-[260px]"
          >
            <button type="submit" className="text-[#cca062] hover:scale-110 active:scale-95 transition-all outline-none">
              <Search size={13} strokeWidth={2.5} />
            </button>
            <input 
              type="text" 
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Digite o código (pedido/lista)..." 
              className="bg-transparent focus:outline-none w-full text-[#6d5443] placeholder-[#6d5443]/50 font-medium select-text" 
            />
          </form>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-20">
        
        {/* BLOCO SEPARADOR & FRASE SLOGAN EM UMA LINHA SÓ */}
        <div className="flex flex-col items-center justify-center pt-8 pb-10 w-full select-none text-center">
          <div className="flex items-center justify-center w-full max-w-sm mb-4 gap-4">
            <div className="h-[1px] flex-1 border-t border-dashed border-[#c36266]/20"></div>
            <Heart size={14} strokeWidth={1.5} className="text-[#c36266]" />
            <div className="h-[1px] flex-1 border-t border-dashed border-[#c36266]/20"></div>
          </div>
          <p className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-cursive text-[#6d5443] text-center px-4 max-w-4xl mx-auto select-none leading-tight">
            Escolha o presente personalizado perfeito para o seu momento.
          </p>
        </div>

        {/* ATELIERS SECTION */}
        <section id="atelies" className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mb-12 md:mb-16">
          {companies.map((company, index) => (
            <motion.div 
              key={company.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              onClick={() => navigate(company.route)}
              style={{
                '--neon-glow': `${company.accent}44`,
                '--neon-border': company.accent,
              } as React.CSSProperties}
              className="relative rounded-2xl p-6 flex flex-col items-center justify-between text-center border border-[#e8dcc8]/60 bg-[#fffffc] shadow-none hover:shadow-[0_0_25px_var(--neon-glow)] hover:border-[var(--neon-border)] transition-all duration-300 cursor-pointer min-h-[290px] group overflow-hidden"
            >
              {/* Decorative brand elements */}
              <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full bg-[#cca062]/5 blur-md" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#c36266]/5 blur-md" />

              <div className="flex flex-col items-center w-full">
                {company.logo ? (
                  <div className="w-16 h-16 rounded-full border border-[#e8dcc8]/60 flex items-center justify-center overflow-hidden mb-3 bg-white shadow-sm p-1 transition-all duration-300 group-hover:scale-105">
                     <ImageWithFallback src={company.logo} alt={company.name} className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-full border border-[#e8dcc8]/60 flex items-center justify-center mb-3 text-[#c96b71] bg-white shadow-sm transition-all duration-300 group-hover:scale-105">
                    <Package size={24} strokeWidth={1.5} />
                  </div>
                )}
                
                <h3 className="font-beauty text-2xl sm:text-3xl font-normal text-center leading-none mb-2 select-none" style={{ color: company.accent }}>
                  {company.name}
                </h3>
                
                <p className="text-[11.5px] text-[#6d5443]/90 max-w-[210px] leading-relaxed select-none mb-4">
                  {company.slogan}
                </p>
              </div>
              
              <div className="w-full flex justify-center">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     navigate(company.route);
                   }}
                   className="text-white text-[10px] font-bold tracking-widest uppercase px-6 py-2.5 rounded-full shadow-sm hover:opacity-95 active:scale-95 transition-all w-full max-w-[150px] leading-none"
                   style={{ 
                     backgroundColor: company.buttonBg,
                     boxShadow: `0 4px 10px ${company.buttonBg}30`
                   }}
                 >
                   {company.buttonText}
                 </button>
              </div>
            </motion.div>
          ))}
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="mb-12 md:mb-16">
          <HeartDivider text="Como funciona" />
          
          <div className="relative mt-8 px-4 md:px-0">
            {/* Dashed line connector */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-[1px] border-t border-dashed border-[#cca062]/20 z-0" />
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 relative z-10">
               {[
                 { 
                   step: '1', 
                   title: 'Garanta o seu mimo', 
                   desc: 'Entre em nosso catálogo e escolha seus favoritos.', 
                   icon: <ShoppingBag size={20} strokeWidth={1} className="text-[#cca062]"/> 
                 },
                 { 
                   step: '2', 
                   title: 'Análise da Arte', 
                   desc: 'Nós criamos e você ajusta até 3x grátis. Nada vai para a produção sem a sua aprovação. Você no controle de cada detalhe!', 
                   icon: <Laptop size={20} strokeWidth={1} className="text-[#cca062]"/> 
                 }, 
                 { 
                   step: '3', 
                   title: 'Início da Produção', 
                   desc: 'Hora de produzir! Nosso prazo seguro varia de 03 a 20 dias úteis (conforme a quantidade do produto e de alterações). Quanto antes você aprovar a arte, mais rápido seu pedido entra na fila exclusiva de produção!', 
                   icon: <Scissors size={20} strokeWidth={1} className="text-[#cca062]"/> 
                 }, 
                 { 
                   step: '4', 
                   title: 'Entrega', 
                   desc: 'Entrega rastreada. Seu mimo em suas mãos com a segurança que você merece.', 
                   icon: <Bike size={20} strokeWidth={1} className="text-[#cca062]"/> 
                 }, 
               ].map((item, index) => (
                 <div key={item.step} className="flex flex-col items-center text-center group">
                   <div className="w-14 h-14 rounded-full bg-white border border-[#e8dcc8]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform z-10">
                     {item.icon}
                   </div>
                   <h4 className="font-cursive text-lg text-[#cca062] leading-none mt-2 mb-0.5">Passo {item.step}</h4>
                   <h5 className="text-[12px] font-bold tracking-wide text-[#6d5443] leading-none mb-1 select-none">{item.title}</h5>
                   <p className="text-[11px] text-gray-500 max-w-[200px] leading-relaxed select-none px-2">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* PRODUTOS EM DESTAQUE */}
        <section id="produtos" className="mb-20 md:mb-32 scroll-mt-24">
          <HeartDivider text="Produtos em Destaque" />
          <p className="text-center text-xs text-gray-500 uppercase tracking-widest font-bold -mt-4 mb-10 px-4">
            Nossos mimos mais desejados e clicados dos ateliês
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto px-4 select-none">
            {featuredProducts.length === 0 ? (
              <p className="col-span-full text-center text-xs uppercase font-bold tracking-widest text-[#cca062]/60 py-12">
                Nenhum produto cadastrado ainda.
              </p>
            ) : (
              featuredProducts.map((prod) => {
                const companyColors: Record<CompanyId, string> = {
                  pallyra: '#cca062',
                  guennita: '#5b2122',
                  mimada: '#c96b71'
                };
                const companyNames: Record<CompanyId, string> = {
                  pallyra: 'La Pallyra',
                  guennita: 'com amor, Guennita',
                  mimada: 'Mimada Sim'
                };
                const companyRoutes: Record<CompanyId, string> = {
                  pallyra: '/lapallyra',
                  guennita: '/comamorguennita',
                  mimada: '/mimadasim'
                };
                const accent = companyColors[prod.company] || '#cca062';
                const name = companyNames[prod.company] || 'Ateliê';
                const route = companyRoutes[prod.company] || '#';

                return (
                  <motion.div
                    key={prod.id}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    onClick={() => navigate(`${route}?search=${encodeURIComponent(prod.product_name)}`)}
                    className="flex flex-col border border-[#e8dcc8]/60 bg-white rounded-3xl overflow-hidden cursor-pointer hover:border-transparent hover:shadow-md transition-all group"
                  >
                    <div className="w-full aspect-square bg-[#faf8f5] overflow-hidden relative">
                      <ImageWithFallback 
                        src={prod.image} 
                        alt={prod.product_name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" 
                      />
                      <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xs" style={{ color: accent, border: `1px solid ${accent}30` }}>
                        {name}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-center text-center p-4 flex-1 justify-between">
                      <div className="w-full mb-2">
                        <span className="text-[8px] font-black tracking-widest uppercase block mb-1 opacity-60" style={{ color: accent }}>
                          {prod.category}
                        </span>
                        <h5 className="font-serif text-xs tracking-wide text-[#6d5443] truncate w-full mb-1">
                          {prod.product_name}
                        </h5>
                      </div>
                      
                      <div className="w-full mt-auto pt-2">
                        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold block mb-2">
                          A partir de R$ {prod.current_price?.toFixed(2).replace('.', ',')}
                        </span>
                        <span className="inline-block text-[8px] font-black uppercase tracking-widest text-[#cca062] group-hover:text-[#c36266] transition-colors leading-none">
                          Ver no Catálogo →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
          
          <div className="flex justify-center mt-12 px-4">
            <button
              onClick={() => navigate('/colecoes')}
              className="bg-[#cca062] hover:bg-[#c36266] text-white transition-all text-[9px] font-black uppercase tracking-widest px-8 py-3.5 rounded-full shadow-sm cursor-pointer hover:scale-105 active:scale-95"
            >
              Ver Todas as Coleções por Ateliê
            </button>
          </div>
        </section>

        {/* TESTIMONIALS SECTION */}
        <section id="feedback" className="mb-20 md:mb-28 scroll-mt-24">
          <HeartDivider text="Feedback que amamos" />
          
          <div className="w-full relative bg-[#faf8f5] border border-[#e8dcc8]/50 p-8 sm:p-12 flex flex-col justify-center items-center text-center shadow-xs overflow-hidden h-[300px] sm:h-[320px] rounded-2xl">
            <div className="absolute top-4 left-6 font-serif text-[120px] text-[#cca062]/10 select-none leading-none pointer-events-none font-black">
              “
            </div>
            {testimonials.length > 0 && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonial}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="flex flex-col items-center justify-center w-full h-full"
                >
                  <div className="flex gap-1 mb-5 text-[#cca062]">
                    {Array.from({ length: testimonials[currentTestimonial]?.stars || 5 }).map((_, i) => (
                      <Star key={i} size={15} fill="currentColor" className="text-[#cca062]" />
                    ))}
                  </div>
                  
                  <p className="text-sm sm:text-base md:text-lg font-medium leading-relaxed text-[#6d5443] mb-6 max-w-lg px-2 italic">
                    "{testimonials[currentTestimonial]?.text}"
                  </p>
                  
                  <span className="text-xs sm:text-sm font-serif tracking-[0.25em] text-[#6d5443] uppercase font-bold relative">
                    <span className="absolute -left-5 top-1/2 w-3 h-[1px] bg-[#cca062]/50" />
                    {testimonials[currentTestimonial]?.name}
                    <span className="absolute -right-5 top-1/2 w-3 h-[1px] bg-[#cca062]/50" />
                  </span>
                </motion.div>
              </AnimatePresence>
            )}

            {/* Dot indicators */}
            <div className="absolute bottom-6 flex gap-2 justify-center z-10">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentTestimonial(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentTestimonial === idx ? 'bg-[#cca062] w-5' : 'bg-[#e8dcc8] hover:bg-[#cca062]/50'
                  }`}
                  aria-label={`Testimonial slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* ADD FEEDBACK BUTTON */}
          <div className="flex justify-center mt-6">
            <button 
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="border border-[#cca062] text-[#cca062] hover:bg-[#cca062] hover:text-white transition-colors text-[10px] sm:text-[11px] font-bold tracking-widest uppercase px-6 py-3 rounded-full flex items-center gap-2 outline-none cursor-pointer"
            >
              <Heart size={12} fill="currentColor" /> Deixar meu Feedback
            </button>
          </div>
        </section>

        {/* FINAL SIGNATURE PHRASE BLOCK */}
        <section className="mb-6 md:mb-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center select-none pt-4">
          <div className="flex items-center justify-center w-full max-w-xs mb-6 gap-3">
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/35"></div>
            <Heart size={14} strokeWidth={1.5} className="text-[#cca062]" />
            <div className="h-[1px] flex-1 border-t border-dashed border-[#cca062]/35"></div>
          </div>
          <p className="text-3xl sm:text-4xl md:text-5xl font-cursive text-[#6d5443] leading-tight max-w-3xl px-2">
            Feito à mão, com amor e único propósito.
          </p>
        </section>


      </main>

      {/* FOOTER */}
      <footer className="bg-[#faf8f5] border-t border-[#e8dcc8] pt-16 pb-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-12">
          {/* Col 1 */}
          <div className="md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left">
            <div className="mb-4 flex flex-col items-center md:items-start cursor-pointer text-center" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <LogoAndSignature small={true} />
            </div>
            <p className="text-[13px] text-[#6d5443] mb-6 max-w-[200px] leading-relaxed font-medium">
              Três ateliês, um só propósito: transformar o momento em lembranças eternas.
            </p>
            <div className="flex gap-4 text-[#cca062]">
              <a href="#" className="hover:text-[#c36266] transition-colors"><Info size={16} /></a>
              <a href={`https://wa.me/${config.whatsapp_number.replace(/\D/g, '')}`} className="hover:text-[#c36266] transition-colors"><Mail size={16} /></a>
              <a href="#" className="hover:text-[#c36266] transition-colors"><Search size={16} /></a>
              <a href="#" className="hover:text-[#c36266] transition-colors"><User size={16} /></a>
            </div>
          </div>
          
          {/* Col 2 */}
          <div className="md:w-1/3">
             <h6 className="text-[11px] font-bold tracking-widest text-[#6d5443] uppercase mb-6">Menu</h6>
             <ul className="space-y-4 text-[12px] text-gray-500">
               <li><a href="#atelies" className="hover:text-[#cca062] transition-colors">Ateliês</a></li>
               <li><a href="#colecoes" className="hover:text-[#cca062] transition-colors">Coleções</a></li>
               <li><a href="#produtos" className="hover:text-[#cca062] transition-colors">Personalizados</a></li>
               <li><a href="#como-funciona" className="hover:text-[#cca062] transition-colors">Como funciona</a></li>
               <li><a href="#institucional" className="hover:text-[#cca062] transition-colors">Sobre nós</a></li>
               <li><a href="#contato" className="hover:text-[#cca062] transition-colors">Contato</a></li>
             </ul>
          </div>
          
          {/* Col 3 */}
          <div className="md:w-1/3">
             <h6 className="text-[11px] font-bold tracking-widest text-[#6d5443] uppercase mb-6">Ajuda</h6>
             <ul className="space-y-4 text-[12px] text-gray-500">
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Perguntas frequentes</a></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Prazos e entregas</a></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Trocas e devoluções</a></li>
               <li><a href="#" className="hover:text-[#cca062] transition-colors">Políticas</a></li>
               <li><button onClick={() => navigate('/rastreamento')} className="hover:text-[#cca062] transition-colors uppercase cursor-pointer outline-none bg-transparent border-none p-0 inline-block">Rastreamento</button></li>
             </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto border-t border-[#e8dcc8] pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-gray-500 font-medium">
          <p>
            © 2025 Presentes Personalizados by Julia Aleixo. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-2">
            <Package size={12} className="text-[#cca062]" /> <span className="font-bold tracking-widest uppercase text-[#6d5443]">Compra 100% Segura</span>
          </div>
          <div className="flex items-center gap-2 font-bold tracking-widest text-[#6d5443]">
             <img src="https://http2.mlstatic.com/storage/logos-api-admin/a5f647b0-f39b-11eb-98ac-71133ce844a1-m.svg" alt="Mercado Pago" className="h-6 md:h-8" />
             <span className="text-[9px] uppercase">Pagamento Seguro </span>
          </div>
        </div>
      </footer>
      
      {/* ADMIN SECRET BUTTON */}
      {!isAdmin && (
        <button 
           onClick={() => navigate('/admin')}
           className="fixed bottom-4 right-4 w-10 h-10 flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity z-[999] text-[#6d5443]"
        >
          <Info size={14} />
        </button>
      )}

      {/* SUGGESTION BOX FORM */}
      <SuggestionBox 
        companyId="pallyra" 
        hideTrigger={true} 
        isOpenExternal={isSuggestOpen} 
        onCloseExternal={() => setIsSuggestOpen(false)} 
      />

      {/* FEEDBACK OVERLAY MODAL */}
      <AnimatePresence>
        {isFeedbackOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFeedbackOpen(false)}
              className="absolute inset-x-0 inset-y-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white rounded-3xl border border-[#e8dcc8] shadow-2xl p-6 overflow-hidden z-10"
            >
              <button 
                type="button"
                onClick={() => setIsFeedbackOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer outline-none"
              >
                <X size={16} />
              </button>

              {fbSuccess ? (
                <div className="py-8 text-center animate-in zoom-in-95 duration-300">
                  <div className="w-12 h-12 bg-emerald-500/15 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <CheckSquare size={20} />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#6d5443]">Muito Obrigado!</h4>
                  <p className="text-[11px] text-gray-500 mt-2 font-medium leading-relaxed">Seu feedback foi compartilhado com sucesso.</p>
                </div>
              ) : (
                <div className="text-[#6d5443]">
                  <div className="flex items-center gap-2 mb-4">
                    <Heart size={16} fill="currentColor" className="text-[#cca062]" />
                    <h4 className="text-xs font-black uppercase tracking-widest">Enviar Feedback</h4>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-6 uppercase font-bold tracking-wider leading-relaxed">
                    Sua avaliação aparecerá em nossa parede de amor.
                  </p>
                  
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Seu Nome</label>
                      <input
                        type="text"
                        value={fbName}
                        onChange={(e) => setFbName(e.target.value)}
                        placeholder="Ex: Ana Maria..."
                        className="w-full bg-[#faf8f5] border border-[#e8dcc8]/70 text-[#6d5443] rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-[#cca062] transition-all placeholder:text-gray-400 font-sans"
                        required
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Nota</label>
                      <div className="flex gap-1.5 text-gray-300">
                        {[1, 2, 3, 4, 5].map((starValue) => (
                          <button
                            key={starValue}
                            type="button"
                            onClick={() => setFbStars(starValue)}
                            className="p-0.5 outline-none transition-all active:scale-90"
                          >
                            <Star 
                              size={20} 
                              fill={starValue <= fbStars ? "#cca062" : "none"} 
                              className={starValue <= fbStars ? "text-[#cca062]" : "text-gray-300"} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 mb-1">Sua Mensagem</label>
                      <textarea
                        value={fbText}
                        onChange={(e) => setFbText(e.target.value)}
                        placeholder="Escreva sua experiência maravilhosa aqui..."
                        className="w-full bg-[#faf8f5] border border-[#e8dcc8]/70 text-[#6d5443] text-xs font-bold rounded-xl px-3 py-2 outline-none h-24 resize-none focus:ring-1 focus:ring-[#cca062] transition-all placeholder:text-gray-400 font-sans"
                        required
                        maxLength={500}
                      />
                    </div>

                    <button
                      disabled={fbSubmitting}
                      type="submit"
                      className="w-full py-3 bg-[#cca062] hover:bg-[#c36266] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
                    >
                      {fbSubmitting ? 'ENVIANDO...' : 'ENVIAR AVALIAÇÃO'}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
