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
}> = ({ 
  companyName, 
  theme, 
  onSearch, 
  onGoBack, 
  onGiftListClick, 
  giftListCount, 
  onCartClick,
  cartCount
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="relative bg-white border-b border-neutral-100 z-50">
      <div className="max-w-7xl mx-auto px-4 h-24 md:h-28 flex items-center justify-between">
        {/* Left Zone: Desktop Menu */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-600">
           <button onClick={() => {}} className="hover:text-neutral-900 transition-colors">Produtos</button>
           <button onClick={() => {}} className="hover:text-neutral-900 transition-colors">Coleções</button>
        </nav>

        {/* Mobile Menu Toggle */}
        <button className="md:hidden p-2 -ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Center Zone: Logo (Overlapping) */}
        <div className="absolute left-1/2 -translate-x-1/2 top-4 md:top-6">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white border border-neutral-200 rounded-full flex items-center justify-center shadow-sm">
            <span className="text-xs font-bold tracking-tighter text-neutral-900 uppercase">Logo</span>
          </div>
        </div>

        {/* Right Zone: Actions */}
        <div className="flex items-center gap-4 text-[11px] font-medium tracking-[0.2em] uppercase text-neutral-600">
           <div className="hidden md:flex items-center gap-8">
              <button onClick={() => {}} className="hover:text-neutral-900 transition-colors">Novidades</button>
              <button onClick={() => {}} className="hover:text-neutral-900 transition-colors">Contato</button>
           </div>
           <div className="flex items-center gap-2">
             <button onClick={() => onSearch("")} className="p-1"><Search size={16} /></button>
             <button onClick={onGiftListClick} className="p-1 relative"><Gift size={16} />{giftListCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-neutral-900 rounded-full" />}</button>
             <button onClick={onCartClick} className="p-1 relative"><ShoppingCart size={16} />{cartCount > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-neutral-900 rounded-full" />}</button>
           </div>
        </div>
      </div>
    </header>
  );
};
