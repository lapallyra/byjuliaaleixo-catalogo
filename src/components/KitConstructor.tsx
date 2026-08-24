import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { ShoppingCart, Check, Plus, Minus, Sparkles, Eye } from 'lucide-react';
import { formatCurrency } from '../lib/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { ImageWithFallback } from './ImageWithFallback';
import { motion, AnimatePresence } from 'motion/react';
import { ProductDetailModal } from './ProductDetailModal';

interface KitConstructorProps {
  allProducts: Product[];
  setCarts: any;
}

export const KitConstructor: React.FC<KitConstructorProps> = ({ allProducts, setCarts }) => {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeProductForDetail, setActiveProductForDetail] = useState<Product | null>(null);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    return Array.from(new Set(allProducts.map(p => p.category))).sort();
  }, [allProducts]);

  useEffect(() => {
    if (categories.length > 0 && expandedCategory === null) {
      setExpandedCategory(categories[0]);
    }
  }, [categories, expandedCategory]);

  const total = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, item) => sum + (item.product.retail_price * item.quantity), 0);
  }, [selectedProducts]);

  const selectedNames = useMemo(() => {
    const items = Object.values(selectedProducts);
    if (items.length === 0) return 'Selecione os itens do seu presente';
    return items.map(item => `${item.quantity}x ${item.product.product_name.split(' ')[0]}`).join(', '); // Simplified names with qty
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

  const handleFinish = () => {
    if (total === 0) return;

    const kitItems = Object.values(selectedProducts).map(item => ({
      id: item.product.id,
      product_name: item.product.product_name,
      quantity: item.quantity,
      price: item.product.retail_price
    }));

    const virtualKit: any = {
      id: `custom-kit-${Date.now()}`,
      product_name: "Kit Personalizado",
      retail_price: total,
      image: Object.values(selectedProducts)[0]?.product.image, // Use first item image as preview
      description: `Composto por: ${kitItems.map(i => `${i.quantity}x ${i.product_name}`).join(', ')}`,
      quantity: 1,
      isKit: true,
      kitType: 'monte_seu_kit',
      kitItems: Object.values(selectedProducts).map(item => ({
        type: 'product',
        id: item.product.id,
        quantity: item.quantity
      }))
    };

    setCarts((prev: any[]) => [...prev, virtualKit]);
    setToast("Seu kit personalizado foi adicionado ao carrinho!");
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-32">
      {/* Header Info */}
      <div className="max-w-3xl mx-auto px-4 md:px-6 pt-12 pb-8 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#cca062]">Personalização Total</span>
        <h2 className="text-4xl md:text-5xl font-serif italic text-[#6d5443] mt-2 mb-4">Monte seu Kit</h2>
        <p className="text-[#8c7864] text-sm font-light leading-relaxed max-w-md mx-auto">Selecione os itens abaixo para criar uma composição exclusiva e cheia de afeto.</p>
        <div className="h-[1px] w-12 bg-[#cca062] mx-auto mt-6" />
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
                <span className={`text-sm md:text-base font-black uppercase tracking-[0.2em] ${
                  expandedCategory === cat ? 'text-[#cca062]' : 'text-[#6d5443]'
                }`}>
                  {cat || 'Outros'}
                </span>
                <span className="text-[#cca062] flex items-center justify-center transition-transform duration-300">
                  {expandedCategory === cat ? (
                    <Minus size={14} strokeWidth={3} className="transform rotate-180 transition-all duration-300" />
                  ) : (
                    <Plus size={14} strokeWidth={3} className="transform rotate-0 transition-all duration-300" />
                  )}
                </span>
              </button>
              
              {/* PRODUTOS EM CARDS ELEGANTES */}
              <AnimatePresence initial={false}>
                {expandedCategory === cat && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden bg-[#faf8f5]/30"
                  >
                    <div className="p-5 md:p-6 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  {allProducts.filter(p => p.category === cat).map(product => {
                    const selectedQty = selectedProducts[product.id]?.quantity || 0;
                    return (
                      <div 
                        key={product.id} 
                        className={`bg-white p-3 border rounded-xl flex flex-col transition-all duration-300 ${
                          selectedQty > 0 ? 'border-[#cca062] shadow-sm' : 'border-[#e8dcc8]/40 hover:border-[#cca062]/50'
                        }`}
                      >
                        <div 
                          className="aspect-square bg-[#faf8f5] rounded-lg overflow-hidden mb-3 relative cursor-pointer group/img" 
                          onClick={() => setActiveProductForDetail(product)}
                        >
                          <ImageWithFallback 
                            src={product.image} 
                            alt={product.product_name} 
                            isThumbnail={true} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-[#6d5443] flex items-center gap-1 shadow-md border border-[#e8dcc8]/20">
                              <Eye size={10} />
                              Detalhes
                            </div>
                          </div>
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
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* FAIXA INFERIOR FIXA */}
      <AnimatePresence>
        {total > 0 && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e8dcc8]/50 shadow-[0_-10px_30px_rgba(204,160,98,0.08)] z-30 pb-safe"
          >
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
              
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase font-black tracking-widest text-[#6d5443]/60 mb-0.5">Seu Presente</p>
                <p className="text-xs font-black text-[#6d5443] truncate pr-4">
                  {selectedNames}
                </p>
              </div>

              <div className="flex items-center gap-4 md:gap-8 justify-end shrink-0">
                <div className="text-right">
                  <p className="text-[9px] uppercase font-black tracking-widest text-[#6d5443]/50 mb-0.5">Total</p>
                  <p className="text-xl md:text-2xl font-black text-[#6d5443] tracking-tighter leading-none">
                    {formatCurrency(total)}
                  </p>
                </div>
                
                <button 
                  onClick={handleFinish}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all bg-[#6d5443] text-white hover:bg-[#5b4535] shadow-lg shadow-[#6d5443]/10 active:scale-95"
                >
                    Próximo
                    <Check size={16} strokeWidth={3} />
                </button>
              </div>
              
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#3A312D] text-white text-xs font-medium uppercase tracking-widest rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-white/10 flex items-center gap-3 min-w-[280px] justify-center text-center font-poppins"
          >
            <ShoppingCart size={14} className="text-[#cca062]" />
            <span>{toast}</span>
            <Sparkles size={12} className="text-[#cca062] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeProductForDetail && (
          <ProductDetailModal
            product={activeProductForDetail}
            onClose={() => setActiveProductForDetail(null)}
            onAddToCart={(prod, qty) => {
              setSelectedProducts(prev => {
                const next = { ...prev };
                next[prod.id] = { product: prod, quantity: qty };
                return next;
              });
              setActiveProductForDetail(null);
            }}
            allProducts={allProducts}
            companyId={activeProductForDetail.company}
            isKitConstructor={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

