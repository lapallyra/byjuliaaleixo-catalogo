import React, { useState } from 'react';
import { ShoppingCart, Search, Gift, Menu, X, ArrowLeft, Filter, User } from 'lucide-react';

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
  logoUrl?: string;
  companyId?: string;
  searchQuery?: string;
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
  logoUrl,
  companyId,
  searchQuery = ""
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchValue, setSearchValue] = useState(searchQuery);

  React.useEffect(() => {
    setSearchValue(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
    setIsSearchVisible(false);
  };

  const handleSearchChange = (val: string) => {
    setSearchValue(val);
    onSearch(val);
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onSearch("");
  };

  return (
    <header className="relative bg-white z-50">
      {/* Search Overlay */}
      {isSearchVisible && (
        <div className="absolute inset-0 bg-white z-[60] flex items-center px-4 shadow-md border-b border-neutral-100">
          <form onSubmit={handleSearchSubmit} className="flex-1 max-w-4xl mx-auto flex items-center gap-4">
            <Search size={20} className="text-[#3A312D]/40 shrink-0" />
            <input 
              autoFocus
              type="text" 
              placeholder="O que você está procurando?" 
              className="flex-1 bg-transparent border-none outline-none text-lg font-serif italic text-[#3A312D] placeholder-neutral-300"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
            {searchValue && (
              <button 
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 hover:bg-neutral-100 rounded-full text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
                title="Limpar busca"
              >
                <X size={16} />
              </button>
            )}
            <button 
              type="button" 
              onClick={() => setIsSearchVisible(false)}
              className="p-2 hover:bg-neutral-100 rounded-full transition-colors shrink-0"
              title="Fechar"
            >
              <X size={20} className="text-[#3A312D]/60" />
            </button>
          </form>
        </div>
      )}

      {/* Faixa acima do topo (Announcement Bar) */}
      <div className="w-full bg-white text-[#3A312D] text-[10px] sm:text-[11px] text-center py-2 px-4 font-sans tracking-wide border-b border-[#3A312D]/5">
        Compras acima de <span className="font-bold">R$ 300,00</span> ganha <span className="italic">presente surpresa</span>.
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left Side: Logo and Atelier Name */}
        <div className="flex items-center gap-3 group cursor-pointer relative" onClick={onGoBack}>
          <div className="w-[120px] h-[120px] bg-white border border-[#e8dcc8]/60 rounded-full flex items-center justify-center shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt="Logo" 
                className="w-[100px] h-[100px] object-contain rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="text-6xl">{companyId === 'pallyra' ? '📓' : '💅'}</span>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-mea-culpa text-[#3A312D] leading-[0.8] mb-1">
              {companyName}
            </h1>
          </div>

          {/* Dica de Voltar no Hover */}
          <div className="absolute -bottom-7 left-0 z-[100] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <span className="bg-[#3A312D] text-white text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded shadow-lg">
              Voltar
            </span>
          </div>
        </div>

        {/* Right Side: Utility Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button 
            onClick={onProfileClick} 
            className="p-2.5 text-[#3A312D]/70 hover:text-[#D4AF37] hover:bg-[#FDFCF0] rounded-full transition-all active:scale-95" 
            title="Perfil do Cliente"
          >
            <User size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={() => setIsSearchVisible(true)} 
            className="p-2.5 text-[#3A312D]/70 hover:text-[#D4AF37] hover:bg-[#FDFCF0] rounded-full transition-all active:scale-95" 
            title="Pesquisar Produtos"
          >
            <Search size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={onFilterClick} 
            className="p-2.5 text-[#3A312D]/70 hover:text-[#D4AF37] hover:bg-[#FDFCF0] rounded-full transition-all active:scale-95" 
            title="Filtrar Resultados"
          >
            <Filter size={20} strokeWidth={1.5} />
          </button>
          <button 
            onClick={onCartClick} 
            className="p-2.5 text-[#3A312D]/70 hover:text-[#D4AF37] hover:bg-[#FDFCF0] rounded-full transition-all relative active:scale-95" 
            title="Meu Carrinho"
          >
            <ShoppingCart size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 bg-[#D4AF37] text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Faixa abaixo do HEADER (Secondary Navigation Bar) */}
      <nav className="w-full border-t border-neutral-100 bg-white/50 backdrop-blur-sm">
        <div className="max-w-[1600px] mx-auto px-4 h-12 flex items-center justify-center gap-6 sm:gap-12">
          <button onClick={onViewAll} className="text-[11px] sm:text-[13px] font-bold text-[#3A312D] hover:text-[#D4AF37] uppercase tracking-widest transition-colors cursor-pointer">
            Atelie
          </button>
          <button onClick={onViewNews} className="text-[11px] sm:text-[13px] font-bold text-[#3A312D] hover:text-[#D4AF37] uppercase tracking-widest transition-colors cursor-pointer">
            Novidades
          </button>
          <button onClick={onViewCollections} className="text-[11px] sm:text-[13px] font-bold text-[#3A312D] hover:text-[#D4AF37] uppercase tracking-widest transition-colors cursor-pointer">
            Personalize
          </button>
          <button onClick={onGiftListClick} className="text-[11px] sm:text-[13px] font-bold text-[#3A312D] hover:text-[#D4AF37] uppercase tracking-widest transition-colors cursor-pointer">
            Lista de presentes
          </button>
          <button className="text-[11px] sm:text-[13px] font-bold text-[#3A312D] hover:text-[#D4AF37] uppercase tracking-widest transition-colors cursor-pointer">
            Cliente
          </button>
        </div>
      </nav>
    </header>
  );
};
