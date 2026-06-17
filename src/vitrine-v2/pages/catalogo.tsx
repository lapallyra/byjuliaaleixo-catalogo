import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { PRODUCTS } from '../data/products';
import { VitrineHeader } from '../components/VitrineHeader';
import { VitrineFooter } from '../components/VitrineFooter';
import { ProductGrid } from '../components/ProductGrid';
import { CartDrawer } from '../components/CartDrawer';

export const VitrineCatalogoPage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const location = useLocation();

  const categories = ['Todos', 'Home & Decor', 'Acessórios Prime', 'Especiais do Ateliê'];

  // Handle setting category from search filter on load (e.g. navigation from home)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const catParam = params.get('category');
    if (catParam && categories.includes(catParam)) {
      setSelectedCategory(catParam);
    } else {
      setSelectedCategory('Todos');
    }
  }, [location.search]);

  const filteredProducts = PRODUCTS.filter((product) => {
    const matchesCategory = selectedCategory === 'Todos' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeader onOpenCart={() => setIsCartOpen(true)} />

      {/* Catalog Title Header Banner */}
      <section className="bg-white border-b border-[#E8DCC8]/30 py-10 px-4 sm:px-6 lg:px-8 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.25em] block">
            Luxo Acessível & Personalizável
          </span>
          <h1 className="font-serif text-2.5xl sm:text-4.5xl font-extrabold text-[#111111] uppercase tracking-wide">
            Acervo Especial
          </h1>
          <p className="font-sans text-xs text-[#6D5443] leading-relaxed max-w-lg mx-auto">
            Descubra criações com materiais de altíssimo padrão, pensadas para encantar com toques de ouro, couro genuíno, veludo e puro linho.
          </p>
        </div>
      </section>

      {/* Main Catalog Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col">
        
        {/* Controls Panel: Category Tabs & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-10 pb-6 border-b border-[#E8DCC8]/25 select-none">
          {/* Categories Tabs */}
          <div className="flex flex-row flex-wrap items-center gap-1.5 scrollbar-thin overflow-x-auto pb-1 lg:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-[0.12em] transition-all duration-300 pointer-events-auto cursor-pointer border ${
                  selectedCategory === cat
                    ? 'bg-[#111111] text-[#FAF8F5] border-[#111111] shadow-sm'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#6D5443] border-[#E8DCC8]/40 hover:border-[#D4AF37]/35'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:max-w-xs">
            <input
              type="text"
              placeholder="Buscar presentes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E8DCC8]/65 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-xs px-4 py-2.5 pr-10 rounded-lg outline-none text-[#1C1B1A] placeholder-[#6D5443]/50 transition-colors"
            />
            {searchQuery ? (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6D5443]/60 hover:text-[#111111] cursor-pointer"
              >
                <X size={15} />
              </button>
            ) : (
              <Search size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6D5443]/50 pointer-events-none" />
            )}
          </div>
        </div>

        {/* Results Counter / Title */}
        <div className="flex items-center justify-between mb-8 select-none">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#6D5443]/70 tracking-widest">
            <SlidersHorizontal size={12} className="text-[#D4AF37]" />
            <span>Exibindo {filteredProducts.length} {filteredProducts.length === 1 ? 'presente ideal' : 'presentes ideais'}</span>
          </div>
          {selectedCategory !== 'Todos' && (
            <button
              onClick={() => setSelectedCategory('Todos')}
              className="text-[10px] font-bold uppercase tracking-wider text-[#C96B71] hover:underline cursor-pointer"
            >
              Limpar Filtro
            </button>
          )}
        </div>

        {/* Product Grid Render */}
        <ProductGrid products={filteredProducts} />

      </main>

      {/* Cart Drawer state handler */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      <VitrineFooter />
    </div>
  );
};
