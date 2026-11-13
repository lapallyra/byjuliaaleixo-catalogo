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

  // Regra: exibir exclusivamente datas comemorativas com menos de 45 dias (daysLeft < 45)
  const processedDates = useMemo(() => {
    return allCalculatedDates.filter(d => d.daysLeft >= 0 && d.daysLeft < 45);
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
  const safeIndex = processedDates.length > 0 ? currentIndex % processedDates.length : 0;
  const activeDate = processedDates[safeIndex];

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
      className="w-full px-2 sm:px-3 pt-3 sm:pt-4 pb-6 sm:pb-8 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Faixa Horizontal Ampla e Delicada em Bege com Borda Dourada Fina */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#FAF8F5] via-white/75 to-[#FAF8F5] border border-[#D4AF37]/30 px-4 py-6 sm:px-7 sm:py-7 overflow-visible transition-all duration-300">
        
        {/* Detalhes decorativos sutis em dourado nos quatro cantos */}
        <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#D4AF37]/60 pointer-events-none" />
        <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#D4AF37]/60 pointer-events-none" />

        {/* Conteúdo compacto e sofisticado */}
        <div className="relative z-10 flex flex-col justify-between overflow-visible">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeDate.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 overflow-visible"
            >
              
              {/* Esquerda: Título em Dourado livre sem corte + Selo da Data abaixo */}
              <div className="flex-1 min-w-0 flex flex-col items-start gap-2 text-left overflow-visible">
                <h2 className="font-mea-culpa text-[clamp(1.9rem,4vw,3.35rem)] font-normal text-[#D4AF37] leading-[1.45] py-1.5 px-1.5 select-none tracking-normal whitespace-nowrap overflow-visible">
                  {activeDate.name}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-[#E8E2D5] text-[#1B2537] text-[10px] font-semibold tracking-wide">
                  <Calendar size={11} className="text-[#D4AF37]" />
                  <span>{activeDate.formattedDayMonth}</span>
                </span>
              </div>

              {/* Direita: Controles de Navegação + CTA + Selo de Contagem abaixo */}
              <div className="flex flex-col items-start md:items-end gap-2.5 shrink-0">
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
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

                {/* Selo de Contagem Regressiva abaixo do botão de ação */}
                <div className="flex items-center md:justify-end">
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
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
