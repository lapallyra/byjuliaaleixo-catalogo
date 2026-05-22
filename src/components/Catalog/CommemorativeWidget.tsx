import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { commemorativeDateService } from '../../services/commemorativeDateService';
import { CommemorativeDate } from '../../types';
import { Sparkles, Calendar, ArrowRight, Tag } from 'lucide-react';
import { isToday } from 'date-fns';
import { getMobileDateOccurrence } from '../../lib/commemorativeDateUtils';

export function CommemorativeWidget() {
  const [dates, setDates] = useState<CommemorativeDate[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

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

  const todayDates = useMemo(() => {
    return dates.filter(d => isToday(getFullDate(d)) && d.active);
  }, [dates]);

  useEffect(() => {
    if (todayDates.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % todayDates.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [todayDates]);

  if (todayDates.length === 0) return null;

  const currentData = todayDates[currentIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex-1 min-w-[300px] bg-[#161616] text-white rounded-[2rem] p-6 relative overflow-hidden shadow-xl"
    >
      {/* Glitch/Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
      
      <div className="relative z-10 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between mb-4">
           <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
             <Sparkles size={20} className="text-yellow-400" />
           </div>
           <div className="flex gap-1.5">
             {currentData.hashtags.slice(0, 1).map((tag, idx) => (
                <span key={`tag-${tag}-${idx}`} className="text-[8px] font-bold text-white/40 uppercase tracking-widest">#{tag}</span>
             ))}
           </div>
        </div>

        <div>
           <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60 flex items-center gap-2 mb-1.5">
             <Calendar size={8} /> Hoje é dia especial
           </p>
           <h4 className="text-base font-black uppercase tracking-tight flex items-center gap-2 text-white">
             {currentData.name} <Tag size={12} className="opacity-40" />
           </h4>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
           <p className="text-[8px] font-medium italic opacity-90 leading-tight max-w-[120px] line-clamp-1">
              "{currentData.marketing_phrase}"
           </p>
           <button className="bg-white text-black px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center gap-2 shadow-xl whitespace-nowrap">
             Coleção <ArrowRight size={10} />
           </button>
        </div>
      </div>
    </motion.div>
  );
}
