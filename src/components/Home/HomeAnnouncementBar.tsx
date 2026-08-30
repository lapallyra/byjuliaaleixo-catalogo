import React from 'react';
import { Truck, Sparkles, HeartHandshake, ShieldCheck, Gift, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

export const HomeAnnouncementBar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
      className="w-full bg-[#FBF9F4] border-b border-[#E8DFC8]/60 text-[#4A332A] py-1.5 text-xs select-none relative"
    >
      <div className="max-w-[1850px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-3">
        {/* Infinite scrolling marquee track */}
        <div className="flex-1 overflow-hidden relative">
          {/* Side gradient fade masks for ultra-smooth edge blending */}
          <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#FBF9F4] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#FBF9F4] to-transparent z-10 pointer-events-none" />

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
                      <span className="text-[#C5A869] text-[10px] select-none opacity-60">•</span>
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

        {/* BUSTO / CLIENT LOGIN ICON (SEM TEXTO) */}
        <button
          onClick={() => navigate('/minha-experiencia')}
          className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#FAF0E6] hover:bg-[#2C1810] text-[#8C6D37] hover:text-white border border-[#E8DFC8] flex items-center justify-center transition-all duration-200 shadow-2xs group cursor-pointer z-20"
          title={user ? (user.displayName || 'Minha Conta') : 'Área do Cliente'}
          aria-label="Área do Cliente"
        >
          <User size={15} strokeWidth={2} className="transition-transform group-hover:scale-110" />
        </button>
      </div>
    </div>
  );
};


