import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { commemorativeDateService } from '../../services/commemorativeDateService';
import { CommemorativeDate, Product } from '../../types';
import { ArrowRight, Sparkles, Clock, Heart } from 'lucide-react';
import { addDays, isAfter, isBefore, startOfToday, differenceInDays } from 'date-fns';
import { getMobileDateOccurrence, slugify } from '../../lib/commemorativeDateUtils';
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
  const [currentDateIdx, setCurrentDateIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

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

  const upcomingDates = useMemo(() => {
    const today = startOfToday();
    const limit = addDays(today, 60); 

    return dates
      .filter(d => {
        const occurrence = getFullDate(d);
        return d.active && isAfter(occurrence, today) && isBefore(occurrence, limit);
      })
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime());
  }, [dates]);

  // Adjust currentDateIdx if dates change or index gets out of bounds
  useEffect(() => {
    if (currentDateIdx >= upcomingDates.length && upcomingDates.length > 0) {
      setCurrentDateIdx(0);
    }
  }, [upcomingDates, currentDateIdx]);

  const upcomingMajorDate = upcomingDates[currentDateIdx] || null;

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
        const pCat = p.category ? p.category.toLowerCase() : '';
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

  // Handle automatic rotation of products
  useEffect(() => {
    if (validProductsToRotate.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % validProductsToRotate.length);
    }, 4500); // Smooth editorial transition speed
    return () => clearInterval(interval);
  }, [validProductsToRotate]);

  // Handle automatic rotation between commemorative dates every 5 seconds
  useEffect(() => {
    if (upcomingDates.length <= 1 || isHovered) return;
    const interval = setInterval(() => {
      setCurrentDateIdx(prev => (prev + 1) % upcomingDates.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [upcomingDates, isHovered]);

  useEffect(() => {
    setCurrentIdx(0);
  }, [upcomingMajorDate]);

  // Touch Swiping logic for mobile carousel navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || upcomingDates.length <= 1) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentDateIdx(prev => (prev + 1) % upcomingDates.length);
    } else if (isRightSwipe) {
      setCurrentDateIdx(prev => (prev - 1 + upcomingDates.length) % upcomingDates.length);
    }
  };

  if (!upcomingMajorDate || closed) return null;

  const daysTo = differenceInDays(getFullDate(upcomingMajorDate), startOfToday());
  const themeColor = upcomingMajorDate.theme_color || '#8C7864';

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="relative w-full rounded-[24px] overflow-hidden bg-[#FAF8F5] flex flex-col pt-4 pb-7 px-6 md:px-12 select-none min-h-[200px] md:min-h-[250px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        
        {/* Lado Direito / Background: Uma única fotografia grande que ocupa a lateral direita toda */}
        <div className="absolute right-0 top-0 bottom-0 w-full md:w-[50%] lg:w-[55%] z-10 overflow-hidden">
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
              background: 'linear-gradient(to right, #FAF8F5 0%, rgba(250, 248, 245, 0.98) 12%, rgba(250, 248, 245, 0.9) 25%, rgba(250, 248, 245, 0.5) 60%, rgba(250, 248, 245, 0) 100%)'
            }}
          />
          {/* Mobile Transition (Top-to-Bottom) */}
          <div 
            className="absolute inset-0 pointer-events-none z-20 block md:hidden"
            style={{
              background: 'linear-gradient(to bottom, #FAF8F5 0%, rgba(250, 248, 245, 0.95) 20%, rgba(250, 248, 245, 0.7) 45%, rgba(250, 248, 245, 0) 100%)'
            }}
          />
        </div>

        {/* Bubble Hearts: APENAS na metade esquerda do banner, atrás do conteúdo */}
        <div className="absolute left-0 top-0 bottom-0 w-full md:w-[45%] h-full overflow-hidden pointer-events-none z-0">
          <BubbleHearts themeColor={themeColor} />
        </div>

        {/* Conteúdo sobreposto */}
        <div className="relative z-20 w-full flex flex-col justify-between flex-grow">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={upcomingMajorDate.id}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="w-full flex flex-col flex-grow"
            >
              {/* Header Alinhado à Esquerda: Nome do evento EM DESTAQUE com recuo de 1.5 polegada (pl-36) e a mesma cor */}
              <div className="w-full flex flex-col items-center md:items-start text-center md:text-left md:pl-36 mb-1.5">
                <h2 
                  className="font-mea-culpa text-4xl md:text-6xl lg:text-7xl leading-none select-none tracking-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                  style={{ color: themeColor }}
                >
                  {upcomingMajorDate.name}
                </h2>
              </div>

              {/* COMPOSIÇÃO INTEGRADA: Lado Esquerdo e Direito em Grid fluído */}
              <div className="w-full flex flex-col md:flex-row items-center md:items-start min-h-[90px] md:min-h-[110px]">
                
                {/* Lado Esquerdo: Editorial Typography, Countdown EM DESTAQUE */}
                <div className="w-full md:w-[45%] flex flex-col items-center md:items-start text-center md:text-left pl-0 md:pl-6 py-0.5 select-none">
                  
                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C7864]/80">
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
                    className="text-5xl md:text-7xl lg:text-8xl font-extrabold leading-none my-0.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
                    style={{ color: themeColor }}
                  >
                    {daysTo}
                  </motion.span>

                  <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.18em] text-[#8C7864]/80 mb-0.5">
                    dias
                  </span>

                  {/* Frase elegante cursiva */}
                  <span className="font-mea-culpa text-xl md:text-2xl text-[#8C7864] mt-0.5 mb-1 leading-none">
                    Encontre o presente perfeito.
                  </span>
                </div>

                {/* Espaço vazio à direita para que o produto apareça limpo */}
                <div className="hidden md:block md:w-[55%] pointer-events-none" />
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Rodapé: Legenda inferior esquerdo e CTA ao lado direito inferior */}
          <div className="w-full flex flex-col md:flex-row items-center justify-between mt-3 gap-3">
            <div className="text-left whitespace-nowrap text-[8.5px] md:text-[10px] font-medium tracking-[0.22em] uppercase text-[#8C7864]/70">
              O presente para tornar esse dia inesquecível você encontra aqui.
            </div>
            
            <button 
              onClick={() => {
                navigate(`/comemorativas/${slugify(upcomingMajorDate.name)}`);
              }}
              className="flex items-center gap-1.5 text-[9.5px] md:text-[10.5px] font-bold uppercase tracking-[0.25em] text-[#8C7864] hover:text-black hover:[text-shadow:0_0_12px_rgba(140,120,100,0.6)] active:scale-95 transition-all duration-300 group cursor-pointer whitespace-nowrap"
            >
              Conheça a coleção <ArrowRight size={11} className="transition-transform group-hover:translate-x-1" />
            </button>
          </div>

        </div>

        {/* Carousel dots indicators - positioned discretely at the absolute bottom of the banner */}
        {upcomingDates.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-30">
            {upcomingDates.map((_, idx) => {
              const isActive = idx === currentDateIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentDateIdx(idx)}
                  className="h-1 transition-all duration-300 cursor-pointer focus:outline-none"
                  style={{
                    width: isActive ? '12px' : '4px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? themeColor : 'rgba(140, 120, 100, 0.18)',
                  }}
                  aria-label={`Ir para data comemorativa ${idx + 1}`}
                />
              );
            })}
          </div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}
