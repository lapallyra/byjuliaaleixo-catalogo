import React from 'react';
import { ShoppingCart, Search, Gift, PackagePlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CompanyId } from '../../types';

export const CatalogHeader: React.FC<{
  companyName: string;
  logoUrl: string | null;
  theme: any;
  onCartClick: () => void;
  cartCount: number;
  onGiftListClick: () => void;
  giftListCount: number;
  onSearch: (s: string) => void;
  onGoBack: () => void;
  onLogoClick?: () => void;
  companyId?: CompanyId;
}> = ({ 
  companyName, 
  logoUrl, 
  theme, 
  onSearch, 
  onGoBack, 
  companyId, 
  onGiftListClick, 
  giftListCount, 
  onLogoClick,
  onCartClick,
  cartCount
}) => {
  const navigate = useNavigate();

  return (
    <header className="relative z-50 w-full bg-[#FAF9F6] border-b border-[#cca062]/10 shadow-[0_4px_24px_rgba(232,220,180,0.06)] px-4 py-3 md:py-4">
      <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Elegant Typography Branding */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button 
            type="button" 
            onClick={onGoBack} 
            className="p-2 -ml-2 text-[#6d5443] hover:text-[#cca062] hover:bg-[#cca062]/5 rounded-full transition-all active:scale-95 shrink-0"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="flex flex-col select-none cursor-pointer" onClick={onLogoClick}>
            <span className="font-serif text-xl md:text-2xl font-black italic tracking-tight text-[#6d5443] leading-tight">
              Presentes Personalizados
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#cca062] font-sans">
              by Julia Aleixo
            </span>
          </div>
        </div>

        {/* Center: Main Menu Principal - 3D Soft Touch Buttons */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center md:absolute md:left-1/2 md:-translate-x-1/2">
          <button
            type="button"
            onClick={() => navigate('/kits')}
            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#6d5443] bg-white border border-[#cca062]/20 hover:border-[#cca062]/60 hover:text-[#cca062] transition-all duration-300 shadow-[0_4px_12px_rgba(198,166,100,0.06),_inset_0_-1.5px_0_rgba(198,166,100,0.15)] active:translate-y-[1px] active:shadow-[0_2px_6px_rgba(198,166,100,0.04)] flex items-center gap-2 cursor-pointer"
          >
            <Gift size={11} className="text-[#cca062] stroke-[2.5]" />
            Kits Prontos
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/kit-meukit')}
            className="px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#6d5443] bg-white border border-[#cca062]/20 hover:border-[#cca062]/60 hover:text-[#cca062] transition-all duration-300 shadow-[0_4px_12px_rgba(198,166,100,0.06),_inset_0_-1.5px_0_rgba(198,166,100,0.15)] active:translate-y-[1px] active:shadow-[0_2px_6px_rgba(198,166,100,0.04)] flex items-center gap-2 cursor-pointer"
          >
            <PackagePlus size={11} className="text-[#cca062] stroke-[2.5]" />
            Monte Seu Kit
          </button>
        </div>

        {/* Right Side: Seamless minimal actions */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full md:w-auto shrink-0 border-t border-[#cca062]/5 pt-3 md:pt-0 md:border-t-0">
          
          {/* Soft minimal search input */}
          <div className="flex items-center gap-2 px-3 py-1.5 border border-[#cca062]/10 bg-white/60 focus-within:bg-white focus-within:border-[#cca062]/40 rounded-xl transition-all duration-300 w-full max-w-[200px]">
            <Search size={12} className="text-[#cca062] opacity-70 shrink-0" />
            <input 
              type="text" 
              placeholder="Buscar presentes..." 
              className="bg-transparent text-[10px] font-sans tracking-wide text-[#6d5443] outline-none w-full placeholder:text-[#6d5443]/40 font-semibold"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Gift List Action */}
            <button 
              type="button"
              onClick={onGiftListClick}
              className="w-9 h-9 border border-[#cca062]/10 hover:border-[#cca062]/30 bg-white hover:bg-[#cca062]/5 text-[#6d5443] hover:text-[#cca062] flex items-center justify-center rounded-xl transition-all duration-300 relative shrink-0 active:scale-95"
              title="Lista de Presentes"
            >
              <Gift size={15} className="stroke-[2]" />
              {giftListCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#cca062] text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
                  {giftListCount}
                </span>
              )}
            </button>

            {/* Shopping Cart Button */}
            <button 
              type="button"
              onClick={onCartClick}
              className="w-11 h-11 bg-[#6d5443] text-white flex items-center justify-center rounded-xl transition-all duration-300 relative shrink-0 shadow-[0_4px_12px_rgba(109,84,67,0.25),_inset_0_-2px_0_rgba(0,0,0,0.18)] hover:shadow-[0_6px_18px_rgba(109,84,67,0.35),_inset_0_-2px_0_rgba(0,0,0,0.18)] active:translate-y-[1px]"
              title="Ver Sacola de Presentes"
            >
              <ShoppingCart size={15} className="stroke-[2.5]" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#cca062] text-white text-[8px] font-black w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm border border-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
