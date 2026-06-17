import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getCampaignEndDate } from '../campaigns/campaign-engine';

interface CountdownProps {
  campaignId: string;
  daysDefault: number;
}

export const CountdownTimerV3: React.FC<CountdownProps> = ({ campaignId, daysDefault }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    const targetDate = getCampaignEndDate(campaignId, daysDefault);

    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate.getTime() - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [campaignId, daysDefault]);

  if (timeLeft.isExpired) {
    return (
      <div className="inline-flex items-center gap-2 bg-neutral-900 border border-[#D4AF37]/35 px-4 py-2 rounded-xl text-xs font-semibold text-[#D4AF37]">
        <Clock size={14} className="animate-pulse" />
        <span className="uppercase tracking-widest font-mono text-[10px]">Lote encerrado! Próximo em instantes...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-3 justify-center select-none">
      <div className="flex flex-col items-center">
        <span className="bg-neutral-950/80 backdrop-blur-md border border-[#D4AF37]/20 text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-mono text-sm sm:text-lg font-black tracking-tighter text-[#D4AF37] shadow-inner">
          {String(timeLeft.days).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">Dias</span>
      </div>
      <span className="text-[#D4AF37] font-serif font-black text-sm sm:text-base animate-pulse mb-3">:</span>

      <div className="flex flex-col items-center">
        <span className="bg-neutral-950/80 backdrop-blur-md border border-[#D4AF37]/20 text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-mono text-sm sm:text-lg font-black tracking-tighter text-[#D4AF37] shadow-inner">
          {String(timeLeft.hours).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">Horas</span>
      </div>
      <span className="text-[#D4AF37] font-serif font-black text-sm sm:text-base animate-pulse mb-3">:</span>

      <div className="flex flex-col items-center">
        <span className="bg-neutral-950/80 backdrop-blur-md border border-[#D4AF37]/20 text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-mono text-sm sm:text-lg font-black tracking-tighter text-[#D4AF37] shadow-inner">
          {String(timeLeft.minutes).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-neutral-400 font-bold mt-1">mín</span>
      </div>
      <span className="text-[#D4AF37] font-serif font-black text-sm sm:text-base animate-pulse mb-3">:</span>

      <div className="flex flex-col items-center">
        <span className="bg-amber-100/5 backdrop-blur-md border border-[#D4AF37]/45 text-white rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center font-mono text-sm sm:text-lg font-black tracking-tighter text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
          {String(timeLeft.seconds).padStart(2, '0')}
        </span>
        <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-[#D4AF37] font-black mt-1">seg</span>
      </div>
    </div>
  );
};
