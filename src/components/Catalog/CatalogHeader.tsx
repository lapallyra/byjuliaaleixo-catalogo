import React, { useState } from 'react';
import { ShoppingCart, Search, Gift, Menu, X, ArrowLeft, Filter } from 'lucide-react';

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
  logoUrl?: string;
  companyId?: string;
}> = ({ 
  companyName, 
  theme, 
  onSearch, 
  onGoBack, 
  onGiftListClick, 
  giftListCount, 
  onCartClick,
  cartCount,
  onViewAll,
  onViewCollections,
  onViewNews,
  onViewContact,
  logoUrl,
  companyId
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-white border-b border-neutral-100 z-50">
      <div className="w-full bg-[#e8dcc8] text-white text-[10px] text-center p-0.5 font-sans tracking-wider">
        na compra acima de <b className="text-[#3A312D]">R$300,00 GANHA BRINDE</b> surpresa EXCLUSIVO
      </div>
      <div className="max-w-7xl mx-auto px-2 py-2 min-h-[5.5rem] flex items-center justify-between gap-4">
        
        {/* Left: Back Button */}
        <div className="flex items-center">
            <button onClick={onGoBack} className="p-1 text-[#3A312D]/80 hover:text-neutral-900 transition-colors cursor-pointer">
                <ArrowLeft size={22} />
            </button>
        </div>

        {/* Center: Company Name - Large and highlighted in Mea Culpa Font */}
        <div className="flex-1 text-center py-1">
            <h1 className="text-4xl sm:text-5xl md:text-5.5xl font-mea-culpa font-normal text-[#3A312D] tracking-wide select-none drop-shadow-sm leading-none">
              {companyName}
            </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
             <button className="p-2 -mr-2 text-[#3A312D]/80 hover:text-neutral-900 transition-colors cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                 {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
             </button>
         </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="absolute top-full left-0 w-full bg-white border-b border-neutral-100 p-6 flex flex-col gap-6 text-sm font-medium uppercase tracking-widest text-neutral-600 md:hidden z-40 h-[calc(100vh-100px)] overflow-y-auto shadow-lg">
            <button onClick={() => { onViewAll(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Ateliê</button>
            <button onClick={() => { onViewCollections(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Personaliza</button>
            <button onClick={() => { onViewNews(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Categorias</button>
          </div>
        )}
      </div>
      
      {/* Pós Header Narrow Bar */}
      <div className="max-w-7xl mx-auto px-2 h-9 flex items-center justify-between border-t border-neutral-100 text-[10px] uppercase tracking-widest text-neutral-600 relative">
        <div className="flex gap-4">
            <button onClick={onViewAll} className="hover:text-neutral-900 cursor-pointer">Ateliê</button>
            <button onClick={onViewCollections} className="hover:text-neutral-900 cursor-pointer">Personaliza</button>
            <button className="hover:text-neutral-900 cursor-pointer">Categorias</button>
        </div>
        
        {/* Expanded/Highlighted LogoMarca Badge */}
        <div className="flex items-center justify-center absolute left-0 right-0 pointer-events-none">
            <div className="w-14 h-14 bg-white border border-[#e8dcc8]/60 rounded-full flex items-center justify-center shadow-md pointer-events-auto transition-transform duration-300 hover:scale-110 z-10 -translate-y-1">
                {logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:') || logoUrl.includes('/')) ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      className="w-11 h-11 object-contain rounded-full"
                      referrerPolicy="no-referrer"
                    />
                ) : (
                    <span className="text-2xl select-none" role="img" aria-label="Logo">
                      {logoUrl || (companyId === 'pallyra' ? '📓' : companyId === 'guennita' ? '👑' : companyId === 'tuttymimo' ? '🍼' : '💅')}
                    </span>
                )}
            </div>
        </div>

        <div className="flex gap-4">
            <button onClick={() => onSearch("")} className="hover:text-neutral-900 cursor-pointer"><Search size={14} /></button>
            <button className="hover:text-neutral-900 cursor-pointer"><Filter size={14} /></button>
        </div>
      </div>
    </header>
  );
};
