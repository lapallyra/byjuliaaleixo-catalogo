import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, ArrowRight, Sparkles, Filter, Package, ShoppingBag, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Product, CompanyId } from '../types';

interface GlobalSearchViewProps {
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
}

const COMPANY_NAMES: Record<CompanyId, string> = {
  pallyra: 'Ateliê Pallyra',
  guennita: 'Ateliê Guennita',
  mimada: 'Ateliê Mimada',
  tuttymimo: 'Ateliê TuttyMimo'
};

const COMPANY_THEMES: Record<CompanyId, string> = {
  pallyra: 'border-[#E8DCC8] text-[#3D2E24]',
  guennita: 'border-[#EAEAEA] text-[#1A1A1A]',
  mimada: 'border-[#FFE4E1] text-[#D87093]',
  tuttymimo: 'border-[#E0F2F1] text-[#006064]'
};

export const GlobalSearchView: React.FC<GlobalSearchViewProps> = ({ isOpen, onClose, allProducts }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId | 'all'>('all');
  const navigate = useNavigate();

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedAtelier('all');
    }
  }, [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim() && selectedAtelier === 'all') return [];

    return allProducts.filter(product => {
      const matchesSearch = !searchQuery.trim() || 
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAtelier = selectedAtelier === 'all' || product.company === selectedAtelier;
      
      return matchesSearch && matchesAtelier && product.isVisible !== false;
    });
  }, [allProducts, searchQuery, selectedAtelier]);

  const handleProductClick = (product: Product) => {
    onClose();
    // Navigate to the company catalog with the product selected or just to the catalog
    navigate(`/${product.company}?search=${encodeURIComponent(product.product_name)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[#FCFAF7]/95 backdrop-blur-xl flex flex-col"
        >
          {/* Header */}
          <div className="w-full max-w-[1400px] mx-auto px-6 py-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#3D2E24] rounded-full flex items-center justify-center text-white">
                  <Search size={20} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-[#3D2E24]">Busca Global</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#3D2E24]/40 font-bold">Descubra tesouros em todos os ateliês</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white transition-colors border border-[#E8DCC8]"
              >
                <X size={20} className="text-[#3D2E24]" />
              </button>
            </div>

            {/* Search Bar Area */}
            <div className="flex flex-col items-center gap-6 w-full max-w-5xl mx-auto">
              <div className="relative group w-full">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#cca062] opacity-50 group-focus-within:opacity-100 transition-opacity">
                  <Search size={20} strokeWidth={1.5} />
                </div>
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="O que você deseja encontrar hoje?"
                  className="w-full bg-white border border-[#E8DCC8] rounded-full pl-14 pr-8 py-3.5 text-lg md:text-xl font-serif text-[#3D2E24] placeholder:text-[#3D2E24]/20 outline-none focus:border-[#cca062] focus:ring-4 focus:ring-[#cca062]/5 transition-all shadow-sm group-hover:shadow-md"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <kbd className="hidden md:flex px-2 py-1 bg-[#FCFAF7] border border-[#E8DCC8] rounded text-[8px] text-[#3D2E24]/30 font-bold tracking-tighter uppercase">Buscar</kbd>
                </div>
              </div>

              {/* Filters Area */}
              <div className="flex flex-wrap items-center justify-center gap-2">
                {(['all', 'pallyra', 'guennita', 'mimada', 'tuttymimo'] as const).map((atelier) => (
                  <button
                    key={atelier}
                    onClick={() => setSelectedAtelier(atelier)}
                    className={`px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.15em] font-bold transition-all border ${
                      selectedAtelier === atelier
                        ? 'bg-[#3D2E24] text-white border-[#3D2E24] shadow-md'
                        : 'bg-white/50 text-[#3D2E24]/60 border-[#E8DCC8] hover:border-[#3D2E24]/20'
                    }`}
                  >
                    {atelier === 'all' ? 'Todos os Ateliês' : COMPANY_NAMES[atelier as CompanyId]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-grow overflow-y-auto px-6 pb-20">
            <div className="max-w-[1400px] mx-auto">
              {!searchQuery.trim() && selectedAtelier === 'all' ? (
                <div className="flex flex-col items-center justify-center py-32 text-center opacity-40">
                  <Sparkles size={48} strokeWidth={1} className="mb-6 text-[#3D2E24]" />
                  <p className="text-xl font-serif text-[#3D2E24] mb-2 italic">Comece a digitar para encontrar mimos únicos</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold">Pesquise por nome, categoria ou descrição</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-white border border-[#E8DCC8]/30 shadow-sm group-hover:shadow-xl transition-all duration-500">
                        <img 
                          src={product.main_image || product.image} 
                          alt={product.product_name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        
                        {/* Atelier Badge */}
                        <div className={`absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[8px] uppercase tracking-[0.2em] font-black border ${COMPANY_THEMES[product.company].split(' ')[0]}`}>
                          {COMPANY_NAMES[product.company]}
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white">
                            <ExternalLink size={20} />
                          </div>
                          <span className="text-[9px] text-white uppercase tracking-[0.3em] font-bold">Ver no Catálogo</span>
                        </div>
                      </div>

                      <div className="mt-4 px-2">
                        <h4 className="text-[#3D2E24] font-serif text-lg leading-tight mb-1 group-hover:text-[#cca062] transition-colors">{product.product_name}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-[0.2em] text-[#3D2E24]/40 font-bold">{product.category}</span>
                          <span className="text-[#3D2E24] font-medium text-sm">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.current_price || product.retail_price || 0)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-16 h-16 bg-white border border-[#E8DCC8] rounded-full flex items-center justify-center mb-6 text-[#3D2E24]/20">
                    <Search size={32} strokeWidth={1} />
                  </div>
                  <h3 className="text-2xl font-serif text-[#3D2E24] mb-2 italic">Nenhum tesouro encontrado</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#3D2E24]/40 font-bold">Tente outros termos ou limpe os filtros</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer Info */}
          <div className="border-t border-[#E8DCC8] py-4 bg-white/50 backdrop-blur-md">
            <div className="max-w-[1400px] mx-auto px-6 flex justify-between items-center text-[9px] uppercase tracking-[0.3em] text-[#3D2E24]/40 font-bold">
              <div className="flex gap-6">
                <span className="flex items-center gap-2"><Package size={12} /> {filteredProducts.length} Produtos Encontrados</span>
              </div>
              <div className="flex gap-4">
                <span>Mimo Ateliês &copy; 2024</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
