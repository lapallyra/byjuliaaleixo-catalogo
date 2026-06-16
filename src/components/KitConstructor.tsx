import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';
import { formatCurrency } from '../lib/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';

interface KitConstructorProps {
  allProducts: Product[];
}

export const KitConstructor: React.FC<KitConstructorProps> = ({ allProducts }) => {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    return Array.from(new Set(allProducts.map(p => p.category))).sort();
  }, [allProducts]);

  const total = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, item) => sum + (item.product.retail_price * item.quantity), 0);
  }, [selectedProducts]);

  const selectedNames = useMemo(() => {
    const items = Object.values(selectedProducts);
    if (items.length === 0) return 'Selecione os itens do seu presente';
    return items.map(item => item.product.product_name.split(' ')[0]).join(', '); // Simplified names
  }, [selectedProducts]);

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const handleProductSelection = (product: Product, delta: number) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      const currentQty = next[product.id]?.quantity || 0;
      const newQty = Math.max(0, currentQty + delta);
      
      if (newQty === 0) {
        delete next[product.id];
      } else {
        next[product.id] = { product, quantity: newQty };
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      {/* TOPO: Apenas os dois links */}
      <div className="bg-[#FAF9F6] pt-6 pb-4 md:pt-10 md:pb-8 flex justify-center items-center">
        <div className="flex gap-4 md:gap-8 border-b border-[#e8dcc8]/60 pb-2 px-4">
          <button 
            onClick={() => navigate('/kits')}
            className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[#6d5443]/50 hover:text-[#cca062] transition-colors"
          >
            Kits Prontos
          </button>
          <button 
            className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#cca062] border-b-2 border-[#cca062] px-2"
          >
            Monte seu Kit
          </button>
        </div>
      </div>

      {/* CATEGORIAS COMO FICHÁRIOS HORIZONTAIS */}
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8dcc8]/40 overflow-hidden divide-y divide-[#e8dcc8]/30">
          {categories.map(cat => (
            <div key={cat} className="group">
              <button 
                className={`w-full p-5 md:p-6 flex justify-between items-center transition-colors ${
                  expandedCategory === cat ? 'bg-[#faf8f5]' : 'hover:bg-[#faf8f5]/50'
                }`}
                onClick={() => toggleCategory(cat)}
              >
                <span className={`text-xs md:text-sm font-black uppercase tracking-widest ${
                  expandedCategory === cat ? 'text-[#cca062]' : 'text-[#6d5443]'
                }`}>
                  {cat || 'Outros'}
                </span>
                <span className="text-[#cca062] text-lg font-black leading-none">
                  {expandedCategory === cat ? '−' : '+'}
                </span>
              </button>
              
              {/* PRODUTOS EM CARDS ELEGANTES */}
              {expandedCategory === cat && (
                <div className="p-5 md:p-6 bg-[#faf8f5]/30 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {allProducts.filter(p => p.category === cat).map(product => {
                    const selectedQty = selectedProducts[product.id]?.quantity || 0;
                    return (
                      <div 
                        key={product.id} 
                        className={`bg-white p-3 border rounded-xl flex flex-col transition-all duration-300 ${
                          selectedQty > 0 ? 'border-[#cca062] shadow-sm' : 'border-[#e8dcc8]/40 hover:border-[#cca062]/50'
                        }`}
                      >
                        <div className="aspect-square bg-[#faf8f5] rounded-lg overflow-hidden mb-3 relative cursor-pointer" onClick={() => handleProductSelection(product, 1)}>
                          <ImageWithFallback 
                            src={product.image} 
                            alt={product.product_name} 
                            isThumbnail={true} 
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                          />
                          {selectedQty > 0 && (
                            <div className="absolute top-2 right-2 bg-[#cca062] text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-md shadow-[#cca062]/20">
                              {selectedQty}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 flex flex-col items-center text-center px-1 mb-2">
                          <p className="text-[10px] md:text-xs font-bold text-[#6d5443] line-clamp-2 leading-snug w-full">
                            {product.product_name}
                          </p>
                          <p className="text-[10px] font-bold text-[#cca062] mt-1 tracking-wider uppercase">
                            {formatCurrency(product.retail_price)}
                          </p>
                        </div>

                        <div className="mt-auto pt-2 border-t border-[#e8dcc8]/30 flex justify-between items-center px-1">
                          {selectedQty > 0 ? (
                            <div className="flex w-full items-center justify-between">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleProductSelection(product, -1); }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#faf8f5] text-[#6d5443] hover:bg-[#e8dcc8]/50 transition-colors"
                              >
                                <Minus size={12} strokeWidth={3} />
                              </button>
                              <span className="text-[10px] font-black text-[#6d5443] w-6 text-center">{selectedQty}</span>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleProductSelection(product, 1); }}
                                className="w-6 h-6 flex items-center justify-center rounded-full bg-[#cca062] text-white hover:bg-[#b88c52] transition-colors"
                              >
                                <Plus size={12} strokeWidth={3} />
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleProductSelection(product, 1)}
                              className="w-full text-[#6d5443]/70 hover:text-[#cca062] text-[9px] font-bold uppercase tracking-widest py-1 transition-colors"
                            >
                              Adicionar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FAIXA INFERIOR FIXA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8dcc8]/50 shadow-[0_-10px_30px_rgba(204,160,98,0.08)] z-30 pb-safe">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          
          <div className="flex-1">
            <p className="text-[10px] uppercase font-black tracking-widest text-[#6d5443]/60 mb-0.5">Seu Presente</p>
            <p className="text-xs font-black text-[#6d5443] truncate pr-4">
              {selectedNames}
            </p>
          </div>

          <div className="flex items-center gap-4 md:gap-8 justify-end">
            <div className="text-right">
              <p className="text-[9px] uppercase font-black tracking-widest text-[#6d5443]/50 mb-0.5">Total</p>
              <p className="text-xl md:text-2xl font-black text-[#6d5443] tracking-tighter leading-none">
                {formatCurrency(total)}
              </p>
            </div>
            
            <button 
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                total > 0 
                  ? 'bg-[#6d5443] text-white hover:bg-[#5b4535] shadow-lg shadow-[#6d5443]/10' 
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
              disabled={total === 0}
            >
                Próximo
                <Check size={16} strokeWidth={3} />
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
};

