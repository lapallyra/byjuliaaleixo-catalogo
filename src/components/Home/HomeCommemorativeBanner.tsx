import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  ArrowRight, 
  Calendar, 
  ChevronLeft, 
  ChevronRight,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Campaign, CommemorativeDate } from '../../types';
import { 
  getCommemorativeDateCountdown, 
  slugify 
} from '../../lib/commemorativeDateUtils';

interface HomeCommemorativeBannerProps {
  activeCampaigns?: Campaign[];
  commemorativeDates?: CommemorativeDate[];
}

export const HomeCommemorativeBanner: React.FC<HomeCommemorativeBannerProps> = ({ 
  commemorativeDates = []
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Compute all upcoming commemorative dates, sorted by closest
  const allCalculatedDates = useMemo(() => {
    return commemorativeDates
      .filter(d => d.active !== false)
      .map(d => {
        const { daysLeft, targetDate, formattedDayMonth, isToday, isWithin60D } = getCommemorativeDateCountdown(d);
        return {
          ...d,
          daysLeft,
          targetDate,
          formattedDayMonth,
          isToday,
          isWithin60D,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [commemorativeDates]);

  // Filter: ONLY show dates within the 60-day window (daysLeft <= 60)
  const processedDates = useMemo(() => {
    const within60 = allCalculatedDates.filter(d => d.daysLeft <= 60);
    // If no dates are within 60 days, fallback to the single closest upcoming date
    return within60.length > 0 ? within60 : allCalculatedDates.slice(0, 1);
  }, [allCalculatedDates]);

  // Automatic slide transition every 3 seconds (pauses on hover)
  useEffect(() => {
    if (processedDates.length <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % processedDates.length);
    }, 3000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [processedDates.length, isPaused]);

  // Ensure current index is within bounds
  const activeDate = processedDates[currentIndex] || processedDates[0];

  const handleNext = () => {
    if (processedDates.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % processedDates.length);
  };

  const handlePrev = () => {
    if (processedDates.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + processedDates.length) % processedDates.length);
  };

  if (!activeDate) {
    return null;
  }

  const slug = slugify(activeDate.name);

  return (
    <section 
      id="home-commemorative-banner"
      className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 pt-3 sm:pt-4 pb-6 sm:pb-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Faixa Horizontal Ampla e Delicada em Bege com Borda Dourada Fina */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white/75 to-[#FAF8F5] border border-[#D4AF37]/30 px-5 py-6 sm:px-8 sm:py-7 md:px-10 md:py-7 overflow-hidden transition-all duration-300">
        
        {/* Detalhes decorativos sutis em dourado nos quatro cantos */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4AF37]/60 pointer-events-none" />

        {/* Conteúdo compacto e sofisticado */}
        <div className="relative z-10 flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDate.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              
              {/* Esquerda: Selos de Data + Contagem + Título em Dourado */}
              <div className="space-y-2.5 max-w-3xl text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E8E2D5] text-[#1B2537] text-[10px] font-semibold tracking-wide">
                    <Calendar size={11} className="text-[#D4AF37]" />
                    <span>{activeDate.formattedDayMonth}</span>
                  </span>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-[#0F2C59] text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/45">
                    <Clock size={10} className="text-[#D4AF37]" />
                    <span>
                      {activeDate.isToday
                        ? 'É Hoje!'
                        : activeDate.daysLeft === 1
                        ? 'FALTA 1 DIA'
                        : `FALTAM ${activeDate.daysLeft} DIAS`}
                    </span>
                  </div>
                </div>

                <h2 className="font-mea-culpa text-3xl sm:text-4xl md:text-5xl font-normal text-[#D4AF37] leading-tight select-none tracking-normal whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
                  {activeDate.name}
                </h2>
              </div>

              {/* Direita: Controles de Navegação + CTA Discreto */}
              <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                {processedDates.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      aria-label="Data anterior"
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white border border-[#E8E2D5] hover:border-[#D4AF37] text-[#0F2C59] flex items-center justify-center transition-all cursor-pointer"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={handleNext}
                      aria-label="Próxima data"
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white border border-[#E8E2D5] hover:border-[#D4AF37] text-[#0F2C59] flex items-center justify-center transition-all cursor-pointer"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                <button
                  onClick={() => navigate(`/comemorativas/${slug}`)}
                  className="group inline-flex items-center gap-2 text-[#0F2C59] hover:text-[#D4AF37] py-1 transition-colors cursor-pointer"
                >
                  <Gift size={14} strokeWidth={1.6} className="text-[#D4AF37] group-hover:scale-105 transition-transform" />
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider uppercase underline underline-offset-4 decoration-[#D4AF37]/50 group-hover:decoration-[#D4AF37]">
                    Garantir Encomendas com Antecedência
                  </span>
                  <ArrowRight size={14} strokeWidth={2} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
