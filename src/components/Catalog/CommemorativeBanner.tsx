import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { commemorativeDateService } from '../../services/commemorativeDateService';
import { CommemorativeDate, Product } from '../../types';
import { ArrowRight, Sparkles, Clock, Heart } from 'lucide-react';
import { addDays, isAfter, isBefore, startOfToday, differenceInDays } from 'date-fns';
import { getMobileDateOccurrence } from '../../lib/commemorativeDateUtils';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from '../ImageWithFallback';

const BubbleHearts = ({ themeColor }: { themeColor: string }) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-[0.45]" style={{ color: themeColor }}>
      {[...Array(8)].map((_, i) => (
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
            x: [0, Math.random() * 30 - 15, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 6,
            delay: Math.random() * 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Heart size={Math.random() * 10 + 12} fill="currentColor" className="stroke-none opacity-80" />
        </motion.div>
      ))}
    </div>
  );
};

interface CommemorativeBannerProps {
  allProducts?: Product[];
  onSearch?: (val: string) => void;
}

export function CommemorativeBanner({ allProducts = [], onSearch }: CommemorativeBannerProps) {
  const [dates, setDates] = useState<CommemorativeDate[]>([]);
  const [closed, setClosed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = commemorativeDateService.subscribe(setDates);
    return unsub;
  }, []);

  const getFullDate = (d: CommemorativeDate, year = new Date().getFullYear()) => {
    if (d.year_fixed) return new Date(year, d.month - 1, d.day);
    if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year);
      return new Date(year, occurrence.month - 1, occurrence.day);
    }
    return new Date(year, d.month - 1, d.day);
  };

  const upcomingMajorDate = useMemo(() => {
    const today = startOfToday();
    const limit = addDays(today, 60); 

    const upcoming = dates
      .filter(d => {
        const occurrence = getFullDate(d);
        return d.active && isAfter(occurrence, today) && isBefore(occurrence, limit);
      })
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime());

    return upcoming[0] || null;
  }, [dates]);

  const relatedProducts = useMemo(() => {
    if (!allProducts.length) return [];
    
    // 1. Related to commemorative date
    let selected: Product[] = [];
    if (upcomingMajorDate) {
      const terms = [
        upcomingMajorDate.name.toLowerCase(),
        ...(upcomingMajorDate.hashtags || []).map(h => h.toLowerCase().replace('#', ''))
      ];

      selected = allProducts.filter(p => {
        const pName = p.product_name.toLowerCase();
        const pCat = p.category.toLowerCase();
        const pTags = (p.tags || []).map(t => t.toLowerCase());
        
        return terms.some(t => 
          pName.includes(t) || 
          pCat.includes(t) || 
          pTags.includes(t)
        );
      });
    }

    // 2. Add Featured if < 5
    if (selected.length < 5) {
      const featured = allProducts
        .filter(p => p.isFeatured && !selected.some(s => s.id === p.id))
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      selected = [...selected, ...featured];
    }

    // 3. Add Recent if still < 5
    if (selected.length < 5) {
      const recent = allProducts
        .filter(p => !selected.some(s => s.id === p.id))
        .sort((a, b) => {
          const getTime = (obj: any) => {
            if (!obj) return 0;
            if (obj.seconds) return obj.seconds;
            if (obj.getTime) return obj.getTime();
            if (typeof obj === 'string') return new Date(obj).getTime();
            return 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
      selected = [...selected, ...recent];
    }

    return selected.slice(0, 5); 
  }, [upcomingMajorDate, allProducts]);

  const [currentIdx, setCurrentIdx] = useState(0);

  // Validate that products have a real image URL and filter out empty/placeholder values
  const validProductsToRotate = useMemo(() => {
    const valid = relatedProducts.filter(p => {
      const url = p.image || p.main_image || (p.images && p.images[0]);
      if (!url) return false;
      const clean = url.trim().toLowerCase();
      return clean !== '' && clean !== 'undefined' && clean !== 'null' && !clean.includes('placeholder');
    });
    // We rotate up to 3 products as specified in the rules
    return valid.slice(0, 3);
  }, [relatedProducts]);

  // Handle automatic rotation
  useEffect(() => {
    if (validProductsToRotate.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % validProductsToRotate.length);
    }, 4500); // Smooth editorial transition speed
    return () => clearInterval(interval);
  }, [validProductsToRotate]);

  useEffect(() => {
    setCurrentIdx(0);
  }, [upcomingMajorDate]);

  if (!upcomingMajorDate || closed) return null;

  const daysTo = differenceInDays(getFullDate(upcomingMajorDate), startOfToday());
  const themeColor = upcomingMajorDate.theme_color || '#8C7864';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="relative w-full rounded-[24px] overflow-hidden bg-[#FAF8F5] flex flex-col items-center justify-between py-6 px-4 md:px-12 select-none"
      >
        
        {/* Header Centralizado */}
        <div className="relative z-10 w-full flex flex-col items-center text-center mb-5">
          <h2 
            className="font-mea-culpa text-3.5xl md:text-5.5xl lg:text-6.5xl leading-none select-none tracking-normal"
            style={{ color: '#8C7864' }}
          >
            {upcomingMajorDate.name}
          </h2>
          <p className="text-[8px] md:text-[9.5px] font-medium tracking-[0.22em] uppercase text-[#8C7864]/70 mt-1 max-w-2xl px-4">
            O presente para tornar esse dia inesquecível você encontra aqui.
          </p>
        </div>

        {/* COMPOSIÇÃO INTEGRADA: Lado Esquerdo e Direito em Grid fluído */}
        <div className="relative w-full grid grid-cols-1 md:grid-cols-[45%_55%] items-center min-h-[180px] md:min-h-[220px]">
          
          {/* Bubble Hearts: APENAS na metade esquerda do banner, atrás do conteúdo */}
          <div className="absolute left-0 top-0 w-full md:w-[45%] h-full overflow-hidden pointer-events-none z-0">
            <BubbleHearts themeColor={themeColor} />
          </div>

          {/* Lado Esquerdo: Editorial Typography, Countdown & CTA */}
          <div className="relative z-10 flex flex-col items-center md:items-start text-center md:text-left pl-0 md:pl-6 py-2 select-none">
            
            <span className="text-[8.5px] md:text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C7864]/80">
              faltam apenas
            </span>
            
            <motion.span 
              key={daysTo}
              initial={{ opacity: 0.85, scale: 0.98 }}
              animate={{ 
                opacity: [0.85, 1, 0.85],
                scale: [1, 1.02, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-4xl md:text-5.5xl font-extrabold leading-none my-1 filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
              style={{ color: themeColor }}
            >
              {daysTo}
            </motion.span>

            <span className="text-[8.5px] md:text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C7864]/80 mb-2">
              dias
            </span>

            {/* Frase elegante cursiva */}
            <span className="font-mea-culpa text-2xl md:text-3xl text-[#8C7864] mt-2 mb-4 leading-none">
              Encontre o presente perfeito.
            </span>

            {/* CTA Discreto com Hover Glow */}
            <button 
              onClick={() => {
                if (onSearch) onSearch(upcomingMajorDate.name);
                navigate('/catalog');
              }}
              className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C7864] hover:text-black hover:[text-shadow:0_0_12px_rgba(140,120,100,0.7)] active:scale-95 transition-all duration-300 group mt-1 cursor-pointer"
            >
              Conheça a coleção <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Lado Direito: Uma única fotografia grande que ocupa a lateral e se integra perfeitamente */}
          <div className="relative h-full w-full overflow-hidden rounded-2xl md:rounded-r-2xl min-h-[160px] md:min-h-[220px] z-10 flex items-center justify-end">
            <AnimatePresence mode="wait">
              {validProductsToRotate.length > 0 ? (() => {
                const activeProduct = validProductsToRotate[currentIdx];
                return (
                  <motion.div
                    key={activeProduct.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeInOut" }}
                    onClick={() => navigate(`/product/${activeProduct.id}`)}
                    className="absolute inset-0 w-full h-full cursor-pointer focus:outline-none"
                  >
                    <ImageWithFallback 
                      src={activeProduct.image || activeProduct.main_image || (activeProduct.images && activeProduct.images[0])} 
                      alt={activeProduct.product_name}
                      className="w-full h-full object-cover"
                      containerClassName="w-full h-full"
                    />
                  </motion.div>
                );
              })() : (
                <div className="absolute inset-0 bg-[#FAF8F5] flex items-center justify-center">
                  <span className="font-mea-culpa text-2xl text-[#8C7864]/40">Coleção Especial</span>
                </div>
              )}
            </AnimatePresence>

            {/* DEGRADÊ EXTREMAMENTE SUAVE: Elimina a divisão perceptível entre texto e imagem */}
            {/* Desktop Transition (Left-to-Right) */}
            <div 
              className="absolute inset-0 pointer-events-none z-20 hidden md:block"
              style={{
                background: 'linear-gradient(to right, #FAF8F5 0%, #FAF8F5 5%, rgba(250, 248, 245, 0.98) 12%, rgba(250, 248, 245, 0.9) 25%, rgba(250, 248, 245, 0.5) 55%, rgba(250, 248, 245, 0) 100%)'
              }}
            />
            {/* Mobile Transition (Top-to-Bottom) */}
            <div 
              className="absolute inset-0 pointer-events-none z-20 block md:hidden"
              style={{
                background: 'linear-gradient(to bottom, #FAF8F5 0%, #FAF8F5 15%, rgba(250, 248, 245, 0.9) 35%, rgba(250, 248, 245, 0) 100%)'
              }}
            />
          </div>

        </div>

      </motion.div>
    </AnimatePresence>
  );
}
