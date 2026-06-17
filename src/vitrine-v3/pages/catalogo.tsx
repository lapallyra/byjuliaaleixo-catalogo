import React, { useState, useMemo } from 'react';
import { PRODUCTS_V3 } from '../data/products';
import { getActiveCampaign } from '../campaigns/campaign-engine';
import { ProductCardV3 } from '../components/ProductCard';
import { CartDrawerV3 } from '../components/CartDrawer';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';
import { LayoutGrid, Sparkles, Filter, Search } from 'lucide-react';

export const VitrineCatalogoPage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const activeCampaign = getActiveCampaign();

  // Retrieve unique categories
  const categoriesList = useMemo(() => {
    const list = new Set(PRODUCTS_V3.map((p) => p.category));
    return ['TODOS', ...Array.from(list)];
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return PRODUCTS_V3.filter((product) => {
      const matchesCategory = selectedCategory === 'TODOS' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeaderV3 onOpenCart={() => setIsCartOpen(true)} />

      {/* Header section */}
      <section className="bg-white border-b border-[#E8DCC8]/30 py-12 px-4 sm:px-6 lg:px-8 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/15 border border-[#D4AF37]/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            <Sparkles size={11} className="fill-current" />
            <span>Coleções V3 • Feitas sob Medida</span>
          </div>
          <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide">
            O Ateliê de Presentes
          </h1>
          <p className="font-sans text-xs sm:text-xs.1 text-[#6D5443] leading-relaxed max-w-lg mx-auto">
            Descubra as criações conceituais autorais mais requisitadas de nossa coleção. Cada presente é desenhado para marcar os corações com nobreza e doçura.
          </p>
        </div>
      </section>

      {/* Filtering and search row */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full select-none">
        <div className="bg-white border border-[#E8DCC8]/35 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
          
          {/* Search bar inside header filter */}
          <div className="relative w-full md:max-w-xs">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 pointer-events-none">
              <Search size={14} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar vela, álbum, toalha..."
              className="w-full bg-[#FAF8F5] border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs pl-9 pr-4 py-2.5 rounded-xl outline-none transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* Categories Tab selectors */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 justify-center">
            {categoriesList.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4.5 py-2 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                  selectedCategory === category
                    ? 'bg-[#111111] text-white border-neutral-900 shadow-sm'
                    : 'bg-[#FAF8F5]/85 text-[#6D5443] border-[#E8DCC8]/40 hover:bg-[#D4AF37]/10'
                }`}
              >
                {category === 'TODOS' ? 'Exibir Todos' : category}
              </button>
            ))}
          </div>

          {/* Grid display info */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-neutral-400 font-medium">
            <Filter size={13} className="text-[#D4AF37]" />
            <span>Exibindo {filteredProducts.length} itens do Ateliê</span>
          </div>

        </div>
      </section>

      {/* Grid Shelf */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-[#E8DCC8]/40 p-12 text-center rounded-2xl max-w-md mx-auto select-none shadow-sm">
            <span className="text-3xl mb-3 block">🔍</span>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] uppercase tracking-wide">
              Nenhuma peça encontrada
            </h3>
            <p className="font-sans text-xs text-[#6D5443] mt-2 mb-6 leading-relaxed">
              Tente alterar os termos da sua pesquisa ou selecione outra categoria para explorar o acervo V3.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('TODOS');
                setSearchQuery('');
              }}
              className="bg-[#111111] text-white text-[10px] font-bold uppercase tracking-wider py-2.5 px-6 rounded-xl hover:bg-[#D4AF37] transition-all"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => {
              const belongsCampaign = activeCampaign.productIds.includes(product.id);
              return (
                <ProductCardV3 
                  key={product.id} 
                  product={product} 
                  isCampaignActive={belongsCampaign}
                />
              );
            })}
          </div>
        )}
      </main>

      {/* Drawer */}
      <CartDrawerV3 isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
