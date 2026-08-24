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
  const themeColor = activeDate.theme_color || '#B38F4D';

  return (
    <section 
      id="home-commemorative-banner"
      className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Solid Nude Background (No Gradient) */}
      <div className="relative rounded-3xl bg-[#FAF7F2] border border-[#D4AF37]/30 p-6 sm:p-8 md:p-10 shadow-[0_4px_24px_rgba(179,143,77,0.06)] overflow-hidden transition-all duration-300">
        
        {/* Subtle decorative golden corner accents */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-[#B38F4D]/40 pointer-events-none" />
        <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-[#B38F4D]/40 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-[#B38F4D]/40 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-[#B38F4D]/40 pointer-events-none" />

        {/* Main Banner Content Area */}
        <div className="relative z-10 min-h-[160px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDate.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex flex-col justify-between gap-6"
            >
              
              {/* Top / Left Column: Official Date + Countdown Pill, Title (Mea Culpa), Slogan & Description */}
              <div className="space-y-3.5 max-w-4xl">
                
                {/* Badges Bar: Official Calendar Date + Countdown Pill */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Official Calendar Date */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#EAE4DC] text-[#593E32] text-[10px] font-semibold tracking-wide shadow-2xs">
                    <Calendar size={11} className="text-[#B38F4D]" />
                    <span>{activeDate.formattedDayMonth}</span>
                  </span>

                  {/* Countdown Pill (Faltam XX dias) */}
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#2C1810] text-[#E5C388] text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/50 shadow-xs">
                    <Clock size={10} className="text-[#E5C388] animate-pulse" />
                    <span>
                      {activeDate.isToday
                        ? 'É Hoje!'
                        : activeDate.daysLeft === 1
                        ? 'FALTA 1 DIA'
                        : `FALTAM ${activeDate.daysLeft} DIAS`}
                    </span>
                  </div>

                </div>

                {/* Main Commemorative Date Name in Noble Calligraphy / Font Mea Culpa */}
                <div className="space-y-1">
                  <h2 
                    className="font-mea-culpa text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-tight select-none tracking-normal drop-shadow-xs"
                    style={{ color: themeColor }}
                  >
                    {activeDate.name}
                  </h2>
                  <p className="text-sm sm:text-base font-serif text-[#3D261C] italic max-w-3xl font-light">
                    "{activeDate.marketing_phrase || activeDate.description}"
                  </p>
                </div>

                {/* Subtitle / Atelier Customization Note */}
                <p className="text-xs sm:text-sm text-[#735A4A] font-light leading-relaxed max-w-3xl">
                  {activeDate.description} Personalize com nomes, fotos e gravações exclusivas com até 60 dias de antecedência para garantir acabamento artesanal perfeito.
                </p>

              </div>

              {/* Bottom Right Area: Relocated Navigation Arrows + CTA with ONLY Brown Text */}
              <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0">
                
                {/* Relocated Navigation Arrows (< >) */}
                {processedDates.length > 1 && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      aria-label="Data anterior"
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white border border-[#EAE4DC] hover:border-[#B38F4D] text-[#593E32] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={handleNext}
                      aria-label="Próxima data"
                      className="w-7 h-7 rounded-full bg-white/90 hover:bg-white border border-[#EAE4DC] hover:border-[#B38F4D] text-[#593E32] flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}

                {/* CTA with ONLY Brown Text (No dark background) */}
                <button
                  onClick={() => navigate(`/comemorativas/${slug}`)}
                  className="group inline-flex items-center gap-2 text-[#593E32] hover:text-[#2C1810] py-1 transition-colors cursor-pointer"
                >
                  <Gift size={14} strokeWidth={1.5} className="text-[#8C6D37] group-hover:scale-110 transition-transform" />
                  <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-[#593E32] group-hover:text-[#2C1810] underline underline-offset-4 decoration-[#D4AF37]/50 hover:decoration-[#8C6D37]">
                    Garantir Encomendas com Antecedência
                  </span>
                  <ArrowRight size={14} strokeWidth={2} className="text-[#8C6D37] group-hover:translate-x-1 transition-transform" />
                </button>

              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
