import React, { useState, useRef } from 'react';
import { ShoppingCart, Search, X, Filter } from 'lucide-react';
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
  onProfileClick,
  onFilterClick,
  onOpenGlobalSearch,
  logoUrl,
  companyId,
  searchQuery = "",
  suggestions = [],
  onSelectSuggestion
}) => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState(searchQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    onSearch(val);
    setShowSuggestions(true);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearch("");
    setShowSuggestions(false);
  };

  return (
    <header className="relative bg-white z-50 border-b border-[#E8DFC8]/40">
      {/* Main Atelier Header Bar */}
      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        {/* Left Side: Atelier Logo & Brand Name */}
        <div className="flex items-center gap-3 sm:gap-4 group cursor-pointer relative" onClick={onGoBack}>
          <div className="w-[85px] h-[85px] sm:w-[100px] sm:h-[100px] bg-white border border-[#E8DFC8]/70 rounded-full flex items-center justify-center shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName} 
                className="w-[75px] h-[75px] sm:w-[90px] sm:h-[90px] object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-4xl sm:text-5xl">{companyId === 'pallyra' ? '📓' : '💅'}</span>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-mea-culpa text-[#3A312D] leading-[0.9] tracking-tight">
              {companyName}
            </h1>
          </div>

          {/* Hover Tooltip: Voltar */}
          <div className="absolute -bottom-6 left-2 z-[100] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <span className="bg-[#3A312D] text-[#FAF8F5] text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-md">
              ← Voltar ao Início
            </span>
          </div>
        </div>

        {/* Right Side: Clean Action Icons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={onFilterClick} 
            className="p-2.5 text-[#5C4033] hover:text-[#B38F4D] hover:bg-[#FAF8F5] rounded-full transition-all active:scale-95" 
            title="Filtrar Produtos"
          >
            <Filter size={20} strokeWidth={1.75} />
          </button>
          
          <button 
            onClick={onCartClick} 
            className="p-2.5 text-[#5C4033] hover:text-[#B38F4D] hover:bg-[#FAF8F5] rounded-full transition-all relative active:scale-95 cursor-pointer" 
            title="Meu Carrinho"
          >
            <ShoppingCart size={20} strokeWidth={1.75} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#B38F4D] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Secondary Navigation Row: Menu Links on Left + Search Input on Right */}
      <nav className="w-full border-t border-[#E8DFC8]/50 bg-[#FCFAF6]/90 backdrop-blur-sm">
        <div className="max-w-[1850px] mx-auto px-4 sm:px-6 py-2.5 flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6">
          
          {/* Atelier Navigation Buttons */}
          <div className="flex items-center flex-wrap justify-center gap-4 sm:gap-7 lg:gap-10">
            <button 
              onClick={onViewAll} 
              className="text-[11px] sm:text-[12px] font-bold text-[#3A312D] hover:text-[#B38F4D] uppercase tracking-[0.14em] transition-colors cursor-pointer"
            >
              Atelie
            </button>
            <button 
              onClick={onViewNews} 
              className="text-[11px] sm:text-[12px] font-bold text-[#3A312D] hover:text-[#B38F4D] uppercase tracking-[0.14em] transition-colors cursor-pointer"
            >
              Novidades
            </button>
            <button 
              onClick={() => navigate('/personalize')} 
              className="text-[11px] sm:text-[12px] font-bold text-[#3A312D] hover:text-[#B38F4D] uppercase tracking-[0.14em] transition-colors cursor-pointer"
            >
              Personalize
            </button>
            <button 
              onClick={onGiftListClick} 
              className="text-[11px] sm:text-[12px] font-bold text-[#3A312D] hover:text-[#B38F4D] uppercase tracking-[0.14em] transition-colors cursor-pointer"
            >
              Lista de presentes
            </button>
          </div>

          {/* Search Box Moved to the Right of this Row */}
          <div className="relative w-full md:w-80 lg:w-96">
            <div className="relative flex items-center">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#8C6D37]">
                <Search size={15} strokeWidth={2} />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="O que você deseja buscar no ateliê?"
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 250)}
                className="w-full pl-9 pr-8 py-2 bg-white/90 hover:bg-white focus:bg-white border border-[#E8DFC8] focus:border-[#B38F4D] rounded-full text-xs font-sans placeholder-[#8C7A70] text-[#2C1810] outline-none transition-all shadow-sm focus:shadow-md"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-2.5 flex items-center p-1 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                  title="Limpar busca"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Auto Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-[#E8DFC8] rounded-xl shadow-xl z-50 overflow-hidden">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="w-full text-left px-4 py-2.5 text-xs hover:bg-[#F9F6F0] transition-colors flex items-center justify-between cursor-pointer border-b border-[#F0EBE0] last:border-0"
                    onMouseDown={() => {
                      if (onSelectSuggestion) {
                        onSelectSuggestion(s.label);
                      } else {
                        handleSearchChange(s.label);
                      }
                      setShowSuggestions(false);
                    }}
                  >
                    <span className="font-medium text-[#2C1810]">{s.label}</span>
                    <span className="text-[10px] text-[#8C6D37] uppercase tracking-wider font-mono">
                      {s.type === 'category' ? 'Categoria' : 'Produto'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </nav>
    </header>
  );
};
