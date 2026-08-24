import React from 'react';
import { Truck, Sparkles, HeartHandshake, ShieldCheck, Gift } from 'lucide-react';

export const HomeAnnouncementBar: React.FC = () => {
  const announcements = [
    {
      icon: Sparkles,
      text: 'Ateliê de Lembranças Afetivas & Personalizados Nobres',
      highlight: false,
    },
    {
      icon: Gift,
      text: 'Compra acima de R$ 300,00 ganha brinde Exclusivo',
      highlight: true,
    },
    {
      icon: HeartHandshake,
      text: 'Feito à mão sob demanda',
      highlight: false,
    },
    {
      icon: Truck,
      text: 'Envio com seguro para todo o Brasil',
      highlight: false,
    },
    {
      icon: ShieldCheck,
      text: 'Aprovação prévia da arte personalizada',
      highlight: false,
    },
  ];

  return (
    <div
      id="home-announcement-bar"
      className="w-full bg-[#FBF9F4] border-b border-[#E8DFC8]/60 text-[#4A332A] py-2 text-xs select-none overflow-hidden relative"
    >
      {/* Side gradient fade masks for ultra-smooth edge blending */}
      <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#FBF9F4] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#FBF9F4] to-transparent z-10 pointer-events-none" />

      {/* Infinite scrolling marquee track */}
      <div className="animate-marquee flex items-center whitespace-nowrap">
        {/* Render repeated list to guarantee seamless infinite loop */}
        {[0, 1].map((copyIndex) => (
          <div key={copyIndex} className="flex items-center gap-8 md:gap-12 shrink-0 pr-8 md:pr-12">
            {announcements.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={`${copyIndex}-${idx}`}
                  className="flex items-center gap-2 text-[11px] md:text-[12px] font-medium tracking-wide"
                >
                  <span className="text-[#C5A869] text-[10px] select-none opacity-60">✦</span>
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-colors ${
                      item.highlight
                        ? 'bg-[#F2E8D5]/80 text-[#2C1810] font-semibold border border-[#D9C4A0]/60'
                        : 'text-[#5C4033]'
                    }`}
                  >
                    <Icon
                      size={13}
                      strokeWidth={1.75}
                      className={item.highlight ? 'text-[#9A7432] shrink-0' : 'text-[#B38F4D] shrink-0'}
                    />
                    <span>{item.text}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

