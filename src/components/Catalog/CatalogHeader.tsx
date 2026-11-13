import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CatalogHeader: React.FC<{
  companyName: string;
  theme: any;
  onCartClick: () => void;
  cartCount: number;
  onGiftListClick: () => void;
  giftListCount: number;
  onSearch: (s: string) => void;
  onGoBack: () => void;
  onViewAll: () => void;
  onViewCollections: () => void;
  onViewNews: () => void;
  onViewContact: () => void;
  onProfileClick: () => void;
  onFilterClick: () => void;
  onOpenGlobalSearch?: () => void;
  logoUrl?: string;
  companyId?: string;
  searchQuery?: string;
  suggestions?: { label: string; type: 'product' | 'category' }[];
  onSelectSuggestion?: (label: string) => void;
}> = ({ 
  onGoBack,
  onViewNews,
}) => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-[#FAF8F5] z-20">
      {/* Sub-barra de navegação do Ateliê */}
      <nav className="w-full border-b border-[#E8E2D5]/55 bg-[#FAF8F5]">
        <div className="max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4 py-2.5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onGoBack}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 hover:bg-white text-[#0F2C59] border border-[#D4AF37]/40 hover:border-[#D4AF37] text-[10.5px] font-semibold uppercase tracking-[0.16em] transition-all cursor-pointer group shrink-0"
            title="Voltar à tela anterior"
          >
            <ArrowLeft size={13} className="text-[#D4AF37] transition-transform group-hover:-translate-x-0.5" />
            <span>Voltar</span>
          </button>

          <div className="flex items-center flex-wrap justify-center gap-5 sm:gap-8 lg:gap-10">
            <button 
              onClick={onViewNews} 
              className="text-[11px] sm:text-[12px] font-semibold text-[#1B2537]/80 hover:text-[#0F2C59] uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              Novidades
            </button>
            <button 
              onClick={() => navigate('/personalize')} 
              className="text-[11px] sm:text-[12px] font-semibold text-[#1B2537]/80 hover:text-[#0F2C59] uppercase tracking-[0.16em] transition-colors cursor-pointer"
            >
              Personalize
            </button>
          </div>

          <div className="hidden sm:block w-[82px] shrink-0" aria-hidden="true" />
        </div>
      </nav>
    </div>
  );
};
