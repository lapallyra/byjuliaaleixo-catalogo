import React from 'react';
import { TrendingUp, Filter, ChevronDown, Search, X } from 'lucide-react';

interface CatalogInfoBarProps {
  selectedCategory: string | null;
  sortBy: string;
  onSortChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  searchQuery?: string;
  totalResults?: number;
  onClearSearch?: () => void;
}

export const CatalogInfoBar: React.FC<CatalogInfoBarProps> = ({
  selectedCategory,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  searchQuery = "",
  totalResults = 0,
  onClearSearch
}) => {
  return (
    <div className="catalog-info-bar mb-2 py-1.5 border-b border-[#e8dcc8]/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left side: Category Title & Search badge */}
      <div className="flex flex-col gap-1.5">
        <h2 className="text-3xl sm:text-4xl font-mea-culpa text-[#3A312D] tracking-tight">
          {selectedCategory || 'Coleção Completa'}
        </h2>

        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-[#6d5443] mt-0.5 bg-white/60 px-3 py-1 rounded-lg border border-[#e8dcc8]/30 w-fit">
            <Search size={12} className="text-[#cca062]" />
            <span>
              Busca por: <strong className="font-serif italic text-[#3A312D]">"{searchQuery}"</strong> 
              <span className="text-[10px] text-neutral-400 ml-2 font-mono">({totalResults} {totalResults === 1 ? 'resultado' : 'resultados'})</span>
            </span>
            {onClearSearch && (
              <button 
                onClick={onClearSearch}
                className="ml-2 p-0.5 hover:bg-neutral-200/50 rounded-full text-neutral-400 hover:text-[#3A312D] transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: Sorting Dropdown & Active Filter buttons */}
      <div className="flex items-center gap-3 self-end md:self-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/80 backdrop-blur-sm rounded-full border border-[#e8dcc8]/50 shadow-xs hover:shadow-sm transition-all">
          <TrendingUp size={13} className="text-[#A68B80]" />
          <div className="relative flex items-center">
            <select 
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer text-[#3A312D] pr-5 outline-none"
            >
              <option value="latest">Mais Recentes</option>
              <option value="bestselling">Mais Vendidos</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="alphabetical">Ordem Alfabética</option>
            </select>
            <ChevronDown size={11} className="absolute right-0 text-[#A68B80] pointer-events-none" />
          </div>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:text-rose-700 transition-colors bg-rose-50/70 border border-rose-200/50 rounded-full cursor-pointer"
          >
            <Filter size={11} />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
