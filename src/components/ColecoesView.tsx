import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Heart, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { ImageWithFallback } from './ImageWithFallback';
import { subscribeToAllSettings } from '../services/firebaseService';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // IntersectionObserver for Aggressive Lazy Loading
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasBeenVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '120px' });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
    }
  };

  useEffect(() => {
    if (hasBeenVisible) {
      const el = scrollRef.current;
      if (el) {
        // Run checkScroll as soon as rendered
        setTimeout(checkScroll, 100);
        el.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
      }
      return () => {
        if (el) el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [hasBeenVisible, products]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  if (!hasBeenVisible) {
    return (
      <div className="mb-14" ref={containerRef}>
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="h-6 w-48 bg-slate-100/80 rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100/60 animate-pulse" />
            <div className="w-8 h-8 rounded-full bg-slate-100/60 animate-pulse" />
          </div>
        </div>
        <div className="flex gap-5 overflow-x-hidden pb-4 px-2">
          {[1, 2, 3, 4].map((_, i) => (
            <div 
              key={i} 
              className="min-w-[210px] sm:min-w-[250px] aspect-[5/4] bg-slate-50/50 border border-slate-100 rounded-2xl animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-14 relative" ref={containerRef}>
      <div className="flex justify-between items-end mb-4 px-2">
        <h4 className="font-beauty text-xl sm:text-2xl text-left font-normal select-none" style={{ color: accent }}>
          {title}
        </h4>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => scroll('left')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e8dcc8] text-[#6d5443] hover:text-[#cca062] hover:border-[#cca062] flex items-center justify-center transition-all cursor-pointer outline-none active:scale-90 bg-white`}
            aria-label="Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#e8dcc8] text-[#6d5443] hover:text-[#cca062] hover:border-[#cca062] flex items-center justify-center transition-all cursor-pointer outline-none active:scale-90 bg-white`}
            aria-label="Próximo"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl">
        {/* Left smooth fade overlay indicator */}
        {canScrollLeft && (
          <div className="absolute top-0 left-0 bottom-4 w-12 bg-gradient-to-r from-[#fffdfa] to-transparent z-10 pointer-events-none transition-all duration-300" />
        )}

        {/* Right smooth fade overlay indicator with Swipe Hint */}
        {canScrollRight && (
          <>
            <div className="absolute top-0 right-0 bottom-4 w-16 bg-gradient-to-l from-[#fffdfa] to-transparent z-10 pointer-events-none transition-all duration-300" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/95 backdrop-blur-xs text-[#cca062] px-3 py-1.5 rounded-full border border-[#cca062]/20 shadow-xs flex items-center gap-1.5 opacity-90 sm:hidden animate-pulse pointer-events-none font-bold text-[8px] uppercase tracking-widest">
              <span>Arraste</span>
              <ChevronRight size={10} />
            </div>
          </>
        )}

        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-5 overflow-x-auto pb-4 scrollbar-hidden scroll-smooth px-2 select-none"
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
                onClick={() => onNavigate()}
                className="min-w-[210px] sm:min-w-[250px] max-w-[250px] flex flex-col border border-[#e8dcc8]/60 bg-white rounded-2xl overflow-hidden cursor-pointer hover:border-transparent hover:shadow-md transition-all shrink-0"
              >
                <div className="w-full aspect-[5/4] bg-[#faf8f5] overflow-hidden">
                  <ImageWithFallback 
                    src={prod.image} 
                    alt={prod.product_name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-[1.5s]" 
                    isThumbnail={true}
                  />
                </div>
                <div className="flex flex-col items-center text-center p-4">
                  <span className="text-[9px] font-bold tracking-widest uppercase mb-1" style={{ color: accent }}>
                    {prod.category}
                  </span>
                  <h5 className="font-serif text-sm tracking-wide text-[#6d5443] truncate w-full mb-1">
                    {prod.product_name}
                  </h5>
                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
                    A PARTIR DE R$ {prod.current_price?.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

interface ColecoesViewProps {
  allProducts: Product[];
}

export const ColecoesView: React.FC<ColecoesViewProps> = ({ allProducts = [] }) => {
  const navigate = useNavigate();
  const [customSettings, setCustomSettings] = useState<any>({});

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results || {});
    });
  }, []);

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

  return (
    <div className="bg-[#fffdfa] min-h-screen text-[#6d5443] font-sans selection:bg-[#e8dcc8] selection:text-[#3A312D] py-12 px-6 md:px-12 select-none overflow-x-hidden">
      <div className="max-w-5xl mx-auto">
        
        {/* BACK TO HOME */}
        <button 
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-[#cca062] hover:text-[#c36266] transition-colors mb-12 outline-none cursor-pointer"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Voltar ao Início
        </button>

        {/* HEADER */}
        <div className="text-center mb-16">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl uppercase tracking-[0.25em] text-[#6d5443] mb-3">
            Coleções por Ateliê
          </h1>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-[#cca062]">
            Nossos mimos e trabalhos exclusivos organizados por marca
          </p>
        </div>

        {/* CAROUSELS */}
        <div className="space-y-6">
          <AtelierCarousel 
            title="La Pallyra" 
            accent="#cca062" 
            products={allProducts.filter(p => p.company === 'pallyra')} 
            onNavigate={() => navigate('/lapallyra')} 
          />

          <AtelierCarousel 
            title="com amor, Guennita" 
            accent="#5b2122" 
            products={allProducts.filter(p => p.company === 'guennita')} 
            onNavigate={() => navigate('/comamorguennita')} 
          />

          <AtelierCarousel 
            title="Mimada Sim" 
            accent="#c96b71" 
            products={allProducts.filter(p => p.company === 'mimada')} 
            onNavigate={() => navigate('/mimadasim')} 
          />
          <AtelierCarousel 
            title="Tutty Mimo" 
            accent="#d4bda1" 
            products={productsByTuttymimo} 
            onNavigate={() => navigate('/tuttymimo')} 
          />
        </div>

        {/* CUTE SEPARATOR */}
        <div className="text-center mt-12">
          <HeartDivider />
          <p className="font-cursive text-3xl text-[#6d5443] mt-4 mb-2">
            Cada coleção é um pedaço de sentimento costurado e criado à mão.
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Amor em forma de pormenores • Encadernação • Buquês Eternos • Festas com Alma
          </p>
        </div>

      </div>
    </div>
  );
};
