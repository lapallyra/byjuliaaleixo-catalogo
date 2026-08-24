import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Sparkles, Layers, Heart, Gift, MessageSquareText, Compass } from 'lucide-react';

export const HomeCategoryNav: React.FC = () => {
  const navigate = useNavigate();

  const links = [
    { label: 'Loja Completa', path: '/vitrine', icon: ShoppingBag },
    { label: 'Os 4 Ateliês', path: '/atelies', icon: Sparkles },
    { label: 'Kits Prontos', path: '/kits', icon: Layers },
    { label: 'Monte Seu Kit', path: '/comomontar', icon: Compass },
    { label: 'Lista de Presentes', path: '/listadepresentes', icon: Gift },
    { label: 'Nossa História', path: '/sobrenos', icon: Heart },
    { label: 'Depoimentos', path: '/feedclientes', icon: MessageSquareText },
  ];

  return (
    <nav className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none">
      <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 md:gap-4">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className="group flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] border border-[#E8DFC8] hover:border-[#B38F4D]/60 text-[#4A332A] hover:text-[#2C1810] transition-all duration-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_12px_rgba(179,143,77,0.08)] cursor-pointer text-xs sm:text-[13px] font-medium tracking-wide"
            >
              <Icon size={14} strokeWidth={1.5} className="text-[#B38F4D] group-hover:scale-110 transition-transform" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
