import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { CompanyId } from '../../types';
import { getUpcomingDates } from '../../services/calendarService';
import { startOfDay } from 'date-fns';

import { themes, getTheme } from '../../lib/theme';

const RainOfHearts = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(60)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-red-500/60"
          initial={{
            top: -20,
            left: `${Math.random() * 100}%`,
            opacity: 0,
            scale: Math.random() * 0.6 + 0.6,
          }}
          animate={{
            top: '100%',
            opacity: [0, 1, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <Heart size={Math.random() * 15 + 15} fill="currentColor" />
        </motion.div>
      ))}
    </div>
  );
};

interface FestiveBannerProps {
  companyId: CompanyId;
  primaryColor?: string;
}

export const FestiveBanner: React.FC<FestiveBannerProps> = ({ companyId, primaryColor }) => {
  const isPallyra = companyId === 'pallyra';
  const theme = getTheme(companyId);

  const upcomingDate = useMemo(() => {
    const dates = getUpcomingDates(60); // Check 2 months ahead for better priority
    if (dates.length === 0) return null;
    
    // High-priority dates that "sell most"
    const priorityNames = ['DIA DAS MÃES', 'DIA DOS NAMORADOS', 'DIA DOS PAIS', 'BLACK FRIDAY', 'NATAL', 'PÁSCOA'];
    const priorityDate = dates.find(d => priorityNames.includes(d.name.toUpperCase()));
    
    return priorityDate || dates[0];
  }, []);

  const daysRemaining = useMemo(() => {
    if (!upcomingDate) return null;
    const today = startOfDay(new Date());
    const diff = Math.ceil((upcomingDate.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [upcomingDate]);

  if (!upcomingDate) return null;

  const isMimada = companyId === 'mimada';
  const displayColor = primaryColor || (isMimada ? '#FF007F' : '#C6A664');

  return (
    <div className="relative w-full overflow-hidden py-4 mt-4 border-t border-b border-black/5 z-[10] flex flex-col items-center justify-center bg-white">
       <RainOfHearts />
       
       <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center text-center gap-1.5 mb-6">
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-sans text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-black [text-shadow:_-1px_-1px_0_#fff,1px_-1px_0_#fff,-1px_1px_0_#fff,1px_1px_0_#fff]"
          >
            {daysRemaining === 0 ? `É HOJE: O GRANDE DIA ${upcomingDate.name.toUpperCase()} !` : 
             daysRemaining === 1 ? `É AMANHÃ: O GRANDE DIA ${upcomingDate.name.toUpperCase()} !` :
             `FALTAM ${daysRemaining} DIAS PARA O GRANDE DIA ${upcomingDate.name.toUpperCase()} !`
            }
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[10px] md:text-xs text-neutral-600 mt-2 font-medium"
          >
            Encontre aqui o presente perfeito para transformar essa data em uma lembrança feliz e inesquecível.
          </motion.p>
       </div>
       
       {/* 07 CARDS */}
       <div className="grid grid-cols-7 gap-4 w-full max-w-6xl px-4 items-stretch">
          {[...Array(7)].map((_, i) => {
            const isCenterCard = i === 3;
            if (isCenterCard) {
              return (
                <div key={i} className="relative group col-span-1 overflow-visible z-10">
                  {/* Halo cintilante e efervescente (Backlight golden halo glow) */}
                  <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-[#FFD700]/35 via-[#FFDF73]/50 to-[#B8860B]/35 blur-md opacity-95 transition-all duration-700 group-hover:blur-lg group-hover:opacity-100 pointer-events-none animate-pulse" style={{ animationDuration: '2.5s' }} />

                  {/* The polished and brushed gold metal frame with bevels and high-shine highlights */}
                  <div className="relative z-10 rounded-xl p-0.5 bg-gradient-to-r from-[#8a6f27] via-[#e2c56a] via-[#f9e7a9] via-[#bf9b30] via-[#fcf0cf] via-[#e2c56a] to-[#8a6f27] shadow-[0_8px_20px_rgba(138,111,39,0.18)] hover:shadow-[0_12px_28px_rgba(138,111,39,0.28)] transition-all duration-500 overflow-hidden h-full">
                    {/* Specular high-shine reflect overlay lines */}
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/80 to-transparent" />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                    <div className="absolute top-0 left-0 h-full w-[2px] bg-gradient-to-b from-transparent via-white/40 to-transparent" />
                    <div className="absolute top-0 right-0 h-full w-[2px] bg-gradient-to-b from-transparent via-white/40 to-transparent" />

                    {/* Inner beveled border layer */}
                    <div className="rounded-[10px] p-0.5 bg-gradient-to-b from-[#5c4a1a] via-[#d1af4c] to-[#5c4a1a] h-full">
                      {/* Real internal container with focused dramatic lighting */}
                      <div className="relative rounded-lg overflow-hidden h-full bg-[#fffdfa] shadow-[inset_0_2px_8px_rgba(138,111,39,0.1)]">
                        {/* Radial gradient representing focused dramatic lighting inside the card */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,253,250,1)_0%,rgba(250,246,238,0.7)_70%,rgba(244,236,222,0.45)_100%)] pointer-events-none" />
                        
                        <div className="aspect-square bg-gray-200 rounded-lg group-hover:blur-sm transition-all duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                           <span className="text-[10px] sm:text-xs font-semibold text-[#3A312D] bg-white/80 px-2 py-1 rounded whitespace-nowrap text-center">Ver mais detalhes</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={i} className="relative group col-span-1">
                 {/* 03 cards left, 03 cards right */}
                 <div className="aspect-square bg-gray-200 rounded-lg group-hover:blur-sm transition-all duration-300" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-[10px] sm:text-xs font-semibold text-[#3A312D] bg-white/70 px-2 py-1 rounded whitespace-nowrap text-center">Ver mais detalhes</span>
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
};

