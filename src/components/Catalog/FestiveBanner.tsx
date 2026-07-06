import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { CompanyId } from '../../types';
import { getUpcomingDates } from '../../services/calendarService';
import { startOfDay } from 'date-fns';

import { themes, getTheme } from '../../lib/theme';

const BubbleHearts = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-[#F1948A]"
          initial={{
            bottom: '-10%',
            left: `${Math.random() * 100}%`,
            opacity: 0,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            bottom: '110%',
            opacity: [0, 1, 1, 0],
            scale: [0.5, 1.2, 0.8],
            x: [0, Math.random() * 40 - 20, 0]
          }}
          transition={{
            duration: Math.random() * 5 + 7,
            delay: Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
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
    const dates = getUpcomingDates(60); 
    if (dates.length === 0) return null;
    
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

  return (
    <div className="relative w-full overflow-hidden py-8 px-4 flex flex-col items-center justify-center bg-gradient-to-b from-[#FFF5F7] to-white">
       <BubbleHearts />
       
       <div className="relative z-10 w-full max-w-[1600px] flex flex-col items-center text-center mb-6">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center"
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.4em] text-[#A68B80] mb-0">
              {daysRemaining === 0 ? `É HOJE O GRANDE` : `FALTAM ${daysRemaining} DIAS PARA O GRANDE`}
            </span>
            <span className="text-3xl sm:text-5xl md:text-6xl font-serif text-[#3A312D] tracking-tight leading-tight">
              {upcomingDate.name.toUpperCase()}.
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-[10px] sm:text-[13px] text-[#6d5443] max-w-lg leading-relaxed italic"
          >
            Encontre aqui o presente perfeito para transformar essa data em uma lembrança feliz e inesquecível.
          </motion.p>
       </div>
       
       <div className="grid grid-cols-3 sm:grid-cols-5 gap-6 w-full max-w-[1600px] px-4 items-stretch">
          {[...Array(5)].map((_, i) => {
            return (
              <div key={i} className={`relative group col-span-1 transition-all duration-500 hover:z-20 hover:scale-110 ${i === 2 ? 'block' : 'hidden sm:block'}`}>
                 <div className={`aspect-square rounded-2xl border transition-all duration-500 overflow-hidden relative shadow-sm ${
                    i === 2 
                      ? 'border-[#D4AF37] bg-gradient-to-br from-[#D4AF37] via-[#FFF3B0] to-[#B8860B] p-[2px] shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:shadow-[0_0_35px_rgba(212,175,55,0.7)]' 
                      : 'border-[#E8DCC8]/40 bg-white group-hover:shadow-xl'
                 }`}>
                    <div className="absolute inset-0 bg-neutral-100 transition-all duration-500 group-hover:blur-md scale-105" />
                    
                    {/* Efeito Brilho no Dourado */}
                    {i === 2 && (
                      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl">
                        <motion.div 
                          animate={{ x: ['-100%', '200%'] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-20"
                        />
                      </div>
                    )}

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
                       <span className="bg-[#3A312D] text-white text-[7px] sm:text-[9px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
                          Ver presente
                       </span>
                    </div>
                    
                    {i === 2 && (
                      <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(212,175,55,0.5)] z-0 pointer-events-none" />
                    )}
                 </div>
              </div>
            );
          })}
       </div>
    </div>
  );
};

