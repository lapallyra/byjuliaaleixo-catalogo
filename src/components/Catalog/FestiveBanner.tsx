import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { CompanyId } from '../../types';
import { getUpcomingDates } from '../../services/calendarService';
import { startOfDay } from 'date-fns';

import { themes } from '../../lib/theme';

interface FestiveBannerProps {
  companyId: CompanyId;
  primaryColor?: string;
}

export const FestiveBanner: React.FC<FestiveBannerProps> = ({ companyId, primaryColor }) => {
  const isPallyra = companyId === 'pallyra';
  const theme = themes[companyId as keyof typeof themes] || themes.pallyra;

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
    <div className="relative w-full overflow-hidden py-4 mt-4 border-t border-b border-black/5 z-[10] flex items-center justify-center bg-white">
       {/* Corações mais visíveis e em maior quantidade */}
       <div className="absolute inset-0 pointer-events-none opacity-20 flex items-center justify-around overflow-hidden">
          {[...Array(24)].map((_, i) => (
             <motion.div
               key={`heart-${companyId}-${i}`}
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: [0, 1, 0], y: [(Math.random() - 0.5) * 10, -50], x: (Math.random() - 0.5) * 40, scale: [0.5, 1.2, 0.5] }}
               transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: i * 0.2, ease: "easeInOut" }}
               style={{ color: displayColor }}
             >
               <Heart size={14 + Math.random() * 16} fill="currentColor" strokeWidth={0} />
             </motion.div>
          ))}
       </div>

       <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center text-center gap-1.5">
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-sans text-xs md:text-sm font-bold uppercase tracking-[0.2em]"
            style={{ color: displayColor }}
          >
            {daysRemaining === 0 ? `É HOJE: O GRANDE ${upcomingDate.name.toUpperCase().startsWith('DIA') ? upcomingDate.name.toUpperCase() : `DIA ${upcomingDate.name.toUpperCase()}`}!` : 
             daysRemaining === 1 ? `É AMANHÃ: O GRANDE ${upcomingDate.name.toUpperCase().startsWith('DIA') ? upcomingDate.name.toUpperCase() : `DIA ${upcomingDate.name.toUpperCase()}`}!` :
             `FALTAM ${daysRemaining} DIAS PARA O GRANDE ${upcomingDate.name.toUpperCase().startsWith('DIA') ? upcomingDate.name.toUpperCase() : `DIA ${upcomingDate.name.toUpperCase()}`}!`
            }
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="font-serif text-sm md:text-base tracking-wide font-semibold"
            style={{ color: companyId === 'guennita' ? '#56070c' : '#161616' }}
          >
            garanta hoje o presente que vai marcar para sempre esse momento.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className={`font-sans text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-bold text-neutral-800`}
          >
            Antecipe seu pedido e crie memórias inesquecíveis.
          </motion.p>
       </div>
    </div>
  );
};

