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
    <div className="catalog-info-bar mb-2 py-1.5 border-b border-[#D4AF37]/20 flex flex-col md:flex-row md:items-center justify-between gap-3">
      {/* Left side: Category Title & Search badge */}
      <div className="flex flex-col gap-1.5 min-w-0">
        {selectedCategory && (
          <h2 className="whitespace-nowrap text-[clamp(1.65rem,3vw,2.35rem)] font-mea-culpa text-[#0F2C59] tracking-tight overflow-hidden text-ellipsis">
            {selectedCategory}
          </h2>
        )}

        {searchQuery && (
          <div className="flex items-center gap-2 text-xs text-[#1B2537] mt-0.5 bg-white/80 px-3 py-1 rounded-lg border border-[#D4AF37]/30 w-fit">
            <Search size={12} className="text-[#D4AF37]" />
            <span>
              Busca por: <strong className="font-serif italic text-[#0F2C59]">"{searchQuery}"</strong> 
              <span className="text-[10px] text-[#1B2537]/50 ml-2 font-mono">({totalResults} {totalResults === 1 ? 'resultado' : 'resultados'})</span>
            </span>
            {onClearSearch && (
              <button 
                onClick={onClearSearch}
                className="ml-2 p-0.5 hover:bg-[#FAF8F5] rounded-full text-[#1B2537]/50 hover:text-[#0F2C59] transition-colors cursor-pointer"
                title="Limpar busca"
              >
                <X size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Right side: Sorting Dropdown & Active Filter buttons */}
      <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/85 backdrop-blur-sm rounded-full border border-[#D4AF37]/35 shadow-xs hover:shadow-sm transition-all">
          <TrendingUp size={13} className="text-[#D4AF37]" />
          <div className="relative flex items-center">
            <select 
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="appearance-none text-[10px] font-bold uppercase tracking-widest bg-transparent border-none focus:ring-0 cursor-pointer text-[#0F2C59] pr-5 outline-none"
            >
              <option value="latest">Mais Recentes</option>
              <option value="bestselling">Mais Vendidos</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="alphabetical">Ordem Alfabética</option>
            </select>
            <ChevronDown size={11} className="absolute right-0 text-[#0F2C59]/60 pointer-events-none" />
          </div>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#0F2C59] hover:text-[#D4AF37] transition-colors bg-[#FAF8F5] border border-[#D4AF37]/40 rounded-full cursor-pointer"
          >
            <Filter size={11} />
            Limpar Filtros
          </button>
        )}
      </div>
    </div>
  );
};
