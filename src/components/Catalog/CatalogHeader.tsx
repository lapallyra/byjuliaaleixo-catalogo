import React from 'react';
import { ShoppingCart, Search, Gift, PackagePlus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CompanyId } from '../../types';

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
  const navigate = useNavigate();

  return (
    <header className="w-full bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo / Branding */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onGoBack} 
            className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full"
            title="Voltar"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="text-lg font-bold text-gray-900 tracking-tight">{companyName}</span>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar produtos..." 
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button 
            onClick={onGiftListClick}
            className="p-2 text-gray-600 hover:text-gray-900 relative"
            title="Lista de Presentes"
          >
            <Gift size={20} />
            {giftListCount > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{giftListCount}</span>}
          </button>
          <button 
            onClick={onCartClick}
            className="p-2 text-gray-600 hover:text-gray-900 relative"
            title="Carrinho"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && <span className="absolute top-0 right-0 bg-gray-900 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};
