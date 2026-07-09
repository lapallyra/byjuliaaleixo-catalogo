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
    <div className="catalog-info-bar mb-8 py-4 border-b border-[#e8dcc8]/20 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h2 className="text-2xl font-serif text-[#3A312D] italic tracking-tight">
            {selectedCategory || 'Coleção Completa'}
          </h2>
          
          <div className="flex items-center gap-2 px-4 py-2 bg-white/40 backdrop-blur-sm rounded-xl border border-white/50 shadow-sm group hover:shadow-md transition-all w-fit">
            <TrendingUp size={14} className="text-[#A68B80]" />
            <div className="relative flex items-center">
              <select 
                value={sortBy}
                onChange={(e) => onSortChange(e.target.value)}
                className="appearance-none text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer text-[#3A312D] pr-6 outline-none"
              >
                <option value="latest">Mais Recentes</option>
                <option value="bestselling">Mais Vendidos</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
                <option value="alphabetical">Ordem Alfabética</option>
              </select>
              <ChevronDown size={10} className="absolute right-0 text-[#A68B80] pointer-events-none" />
            </div>
          </div>
        </div>

        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-[#6d5443] mt-1 bg-[#FDFCF0]/60 px-3 py-1.5 rounded-lg border border-[#e8dcc8]/30 w-fit">
            <Search size={12} className="text-[#cca062]" />
            <span>
              Busca por: <strong className="font-serif italic text-[#3A312D]">"{searchQuery}"</strong> 
              <span className="text-[10px] text-neutral-400 ml-2 font-mono">({totalResults} {totalResults === 1 ? 'resultado' : 'resultados'})</span>
            </span>
            {onClearSearch && (
              <button 
                onClick={onClearSearch}
                className="ml-2 p-0.5 hover:bg-neutral-200/50 rounded-full text-neutral-400 hover:text-[#3A312D] transition-colors"
                title="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-600 transition-colors bg-rose-50/50 rounded-lg cursor-pointer"
          >
            <Filter size={12} />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
