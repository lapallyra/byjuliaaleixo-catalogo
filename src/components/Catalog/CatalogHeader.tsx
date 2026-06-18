import React, { useState } from 'react';
import { ShoppingCart, Search, Gift, Menu, X, ArrowLeft } from 'lucide-react';

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
  onViewContact
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-white border-b border-neutral-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        
        {/* Left: Logo */}
        <div className="flex items-center">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-[8px] font-bold tracking-tighter text-neutral-900 uppercase">Logo</span>
            </div>
        </div>

        {/* Center: Empty */}
        <div className="flex-1" />

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
             <button onClick={() => onSearch("")} className="p-1"><Search size={20} /></button>
             <button className="p-2 -mr-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                 {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
             </button>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="absolute top-14 left-0 w-full bg-white border-b border-neutral-100 p-6 flex flex-col gap-6 text-sm font-medium uppercase tracking-widest text-neutral-600 md:hidden z-40 h-[calc(100vh-56px)] overflow-y-auto">
            {/* Menu Principal */}
            <div className="flex flex-col gap-3">
                <button onClick={() => { onViewAll(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Ateliês</button>
                <button onClick={() => { onViewCollections(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Coleções</button>
                <button onClick={() => { onViewNews(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Personalizados</button>
            </div>
            
            <div className="h-px bg-neutral-100" />

            {/* Menu Secundário */}
            <div className="flex flex-col gap-3">
                <button className="text-left py-2 hover:text-neutral-900 transition-colors">Como funciona</button>
                <button className="text-left py-2 hover:text-neutral-900 transition-colors">Sobre nós</button>
                <button onClick={() => { onViewContact(); setIsMenuOpen(false); }} className="text-left py-2 hover:text-neutral-900 transition-colors">Contato</button>
            </div>

            <div className="h-px bg-neutral-100" />

            {/* Menu Funcional */}
            <div className="flex flex-col gap-3">
                <button className="text-left py-2 hover:text-neutral-900 transition-colors">Buscar pedido</button>
                <button className="text-left py-2 hover:text-neutral-900 transition-colors">Lista de presentes</button>
                <button className="text-left py-2 hover:text-neutral-900 transition-colors">Ajuda / Feedback</button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
