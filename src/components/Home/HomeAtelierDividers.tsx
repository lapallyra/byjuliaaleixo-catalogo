import React from 'react';

export type StoreDividerId = 'home' | 'todos' | 'pallyra' | 'mimada' | 'guennita' | 'tuttymimo';

export interface StoreDividerTab {
  id: StoreDividerId;
  label: string;
  tagTarget: string;
  route: string;
  activeColor: string;
  activeBorderColor: string;
  activeBgColor: string;
  activeDotColor: string;
}

export const STORE_DIVIDERS: StoreDividerTab[] = [
  {
    id: 'home',
    label: 'Home',
    tagTarget: 'HOME',
    route: '/',
    activeColor: 'text-[#2C1810]',
    activeBorderColor: 'border-[#D4AF37]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#D4AF37]'
  },
  {
    id: 'todos',
    label: 'Loja Completa',
    tagTarget: 'TODOS',
    route: '/vitrine',
    activeColor: 'text-[#081220]',
    activeBorderColor: 'border-[#081220]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#081220]'
  },
  {
    id: 'pallyra',
    label: 'La Pallyra',
    tagTarget: 'LA PALLYRA',
    route: '/lapallyra',
    activeColor: 'text-[#161616]',
    activeBorderColor: 'border-[#C6A664]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#C6A664]'
  },
  {
    id: 'mimada',
    label: 'Mimada Sim',
    tagTarget: 'MIMADA SIM',
    route: '/mimadasim',
    activeColor: 'text-[#FF007F]',
    activeBorderColor: 'border-[#FF007F]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#FF007F]'
  },
  {
    id: 'guennita',
    label: 'com amor, Guennita',
    tagTarget: 'com amor, Guennita',
    route: '/comamorguennita',
    activeColor: 'text-[#56070c]',
    activeBorderColor: 'border-[#7a141a]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#7a141a]'
  },
  {
    id: 'tuttymimo',
    label: 'Tutty Mimo',
    tagTarget: 'TUTTY MIMO',
    route: '/tuttymimo',
    activeColor: 'text-[#6A4A6A]',
    activeBorderColor: 'border-[#C8A2C8]',
    activeBgColor: 'bg-[#FAF7F2]',
    activeDotColor: 'bg-[#C8A2C8]'
  }
];

interface HomeAtelierDividersProps {
  activeTab: StoreDividerId;
  onSelectTab: (tabId: StoreDividerId) => void;
}

/**
 * Componente: HomeAtelierDividers (Divisórias Horizontais Estilo Fichário / Folder-Style Dividers)
 * Posicionado horizontalmente logo acima do Banner Comemorativo / Promocional.
 * Abas com estilo de fichário clássico e refinado:
 * Acompanha as cores da UI de cada ateliê e a cor Azul Profundo do Header para a Loja Completa.
 */
export const HomeAtelierDividers: React.FC<HomeAtelierDividersProps> = ({
  activeTab,
  onSelectTab
}) => {
  const currentTab = STORE_DIVIDERS.find(d => d.id === activeTab) || STORE_DIVIDERS[0];

  return (
    <div 
      id="home-atelier-dividers" 
      className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4 pt-2.5 pb-0 select-none"
    >
      {/* Abas / Guias Horizontais Estilo Fichário (Folder-style Index Tabs) */}
      <div className={`flex items-end justify-start sm:justify-center overflow-x-auto no-scrollbar gap-1 sm:gap-1.5 md:gap-2 px-1 border-b-2 ${
        activeTab === 'todos' ? 'border-[#081220]/70' :
        activeTab === 'mimada' ? 'border-[#FF007F]/60' :
        activeTab === 'guennita' ? 'border-[#7a141a]/60' :
        activeTab === 'tuttymimo' ? 'border-[#C8A2C8]/70' :
        activeTab === 'pallyra' ? 'border-[#C6A664]/60' :
        'border-[#D4AF37]/40'
      } transition-colors duration-300`}>
        {STORE_DIVIDERS.map((divider) => {
          const isActive = activeTab === divider.id;

          return (
            <button
              key={divider.id}
              type="button"
              onClick={() => onSelectTab(divider.id)}
              className={`group relative shrink-0 flex items-center justify-center px-4 sm:px-6 md:px-7 py-2.5 sm:py-3 transition-all duration-200 cursor-pointer rounded-t-xl sm:rounded-t-2xl font-poppins text-center ${
                isActive
                  ? `${divider.activeBgColor} ${divider.activeColor} font-bold shadow-[0_-4px_12px_rgba(0,0,0,0.06)] border-t-2 border-x-2 ${divider.activeBorderColor} z-10 translate-y-[2px]`
                  : 'bg-[#F3EDE2]/85 hover:bg-[#FAF6EE] text-[#5C4538] font-medium border-t border-x border-[#E2D6C0] hover:text-[#2C1810] hover:-translate-y-0.5'
              }`}
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 100%, 0% 100%)'
              }}
            >
              {/* Rótulo da Divisória Estilo Fichário */}
              <span className={`text-xs sm:text-[13px] md:text-sm tracking-wide leading-none whitespace-nowrap ${
                isActive ? divider.activeColor : 'text-[#5C4538]'
              }`}>
                {divider.label}
              </span>

              {/* Marcador de aba ativa */}
              {isActive && (
                <span className={`w-1.5 h-1.5 rounded-full ${divider.activeDotColor} shrink-0 ml-1.5 sm:ml-2 animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
