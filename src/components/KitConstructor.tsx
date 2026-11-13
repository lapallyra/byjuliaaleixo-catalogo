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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<string | null>(null);
  const [activeProductForDetail, setActiveProductForDetail] = useState<Product | null>(null);
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const validCategories = Array.from(new Set(allProducts.map(p => p.category).filter(Boolean))).sort();
    return validCategories;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'all') {
      return allProducts.filter(p => !p.isKit);
    }
    return allProducts.filter(p => !p.isKit && p.category === selectedCategory);
  }, [allProducts, selectedCategory]);

  const total = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, item) => sum + (item.product.retail_price * item.quantity), 0);
  }, [selectedProducts]);

  const totalItemsCount = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedProducts]);

  const flattenedSelectedItems = useMemo(() => {
    const items: { product: Product; key: string }[] = [];
    Object.values(selectedProducts).forEach(entry => {
      for (let i = 0; i < entry.quantity; i++) {
        items.push({
          product: entry.product,
          key: `${entry.product.id}-${i}`
        });
      }
    });
    return items;
  }, [selectedProducts]);

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
      image: Object.values(selectedProducts)[0]?.product.image,
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B2537] pb-32">
      {/* Header Info */}
      <div className="max-w-[1850px] mx-auto px-3 sm:px-4 pt-6 sm:pt-8 pb-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Personalização Total</span>
        <h2 className="whitespace-nowrap text-[clamp(2rem,4.5vw,3.5rem)] font-mea-culpa text-[#0F2C59] mt-1.5 mb-2.5 leading-[1.15]">Monte seu Kit</h2>
        <p className="text-[#1B2537]/75 text-xs sm:text-sm font-light leading-relaxed max-w-lg mx-auto">
          Selecione os itens abaixo para criar uma composição exclusiva e cheia de afeto.
        </p>
        <div className="h-[1px] w-12 bg-[#D4AF37] mx-auto mt-4" />
      </div>

      {/* CATEGORIAS COMO ABAS / FILTROS HORIZONTAIS */}
      <div className="max-w-[1850px] mx-auto px-3 sm:px-4 mb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#0F2C59] text-white shadow-xs scale-102'
                : 'bg-white text-[#0F2C59] hover:bg-[#FAF8F5] border border-[#D4AF37]/35 hover:border-[#0F2C59]/40'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0F2C59] text-white shadow-xs scale-102'
                  : 'bg-white text-[#0F2C59] hover:bg-[#FAF8F5] border border-[#D4AF37]/35 hover:border-[#0F2C59]/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* GRADE FLUIDA DE PRODUTOS */}
      <div className="max-w-[1850px] mx-auto px-3 sm:px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 sm:gap-4 md:gap-5">
          {filteredProducts.map(product => {
            const selectedQty = selectedProducts[product.id]?.quantity || 0;
            return (
              <div 
                key={product.id} 
                className={`bg-white p-2.5 sm:p-3 border rounded-xl sm:rounded-2xl flex flex-col transition-all duration-200 ${
                  selectedQty > 0 ? 'border-[#D4AF37] shadow-sm ring-1 ring-[#D4AF37]/35' : 'border-[#E8E2D5] hover:border-[#D4AF37]/70 hover:shadow-2xs'
                }`}
              >
                <div 
                  className="aspect-square max-h-[160px] sm:max-h-[180px] md:max-h-[200px] w-full bg-[#FAF8F5] rounded-lg sm:rounded-xl overflow-hidden mb-2.5 relative cursor-pointer group/img shrink-0" 
                  onClick={() => setActiveProductForDetail(product)}
                >
                  <ImageWithFallback 
                    src={product.image} 
                    alt={product.product_name} 
                    isThumbnail={true} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                  />
                  <div className="absolute inset-0 bg-[#0F2C59]/15 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#0F2C59] flex items-center gap-1 shadow-xs border border-[#D4AF37]/30">
                      <Eye size={11} />
                      Detalhes
                    </div>
                  </div>
                  {selectedQty > 0 && (
                    <div className="absolute top-1.5 right-1.5 bg-[#0F2C59] text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[9px] sm:text-[10px] font-bold shadow-xs border border-[#D4AF37]">
                      {selectedQty}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col items-center text-center px-0.5 mb-2 justify-center">
                  <p className="text-[11px] sm:text-xs font-semibold text-[#1B2537] line-clamp-2 leading-snug w-full min-h-[2rem]">
                    {product.product_name}
                  </p>
                </div>

                <div className="mt-auto pt-2 border-t border-[#E8E2D5]/60 flex justify-between items-center">
                  {selectedQty > 0 ? (
                    <div className="flex w-full items-center justify-between bg-[#FAF8F5] rounded-full p-0.5 border border-[#D4AF37]/40">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleProductSelection(product, -1); }}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-white text-[#0F2C59] hover:bg-[#D4AF37]/15 transition-colors shadow-2xs cursor-pointer"
                        title="Diminuir"
                      >
                        <Minus size={11} strokeWidth={2.5} />
                      </button>
                      <span className="text-[10px] sm:text-xs font-bold text-[#0F2C59] px-1">{selectedQty}</span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleProductSelection(product, 1); }}
                        className="w-6 h-6 flex items-center justify-center rounded-full bg-[#0F2C59] text-white hover:bg-[#1B3F7A] transition-colors shadow-2xs cursor-pointer"
                        title="Aumentar"
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleProductSelection(product, 1)}
                      className="w-full text-[#0F2C59] hover:text-white hover:bg-[#0F2C59] bg-[#FAF8F5] text-[9px] sm:text-[10px] font-bold uppercase tracking-wider py-1.5 rounded-full transition-all border border-[#D4AF37]/40 cursor-pointer"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-16 text-center text-[#1B2537]/65">
            <p className="text-sm">Nenhum produto encontrado nesta categoria.</p>
          </div>
        )}
      </div>

      {/* FAIXA INFERIOR FIXA */}
      <AnimatePresence>
        {totalItemsCount > 0 && (
          <motion.div 
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "tween", duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 bg-[#FAF8F5]/95 backdrop-blur-md border-t border-[#D4AF37]/40 shadow-[0_-10px_30px_rgba(15,44,89,0.08)] z-30 pb-safe"
          >
            <div className="max-w-[1850px] mx-auto px-3 sm:px-4 py-3.5 flex items-center justify-between gap-4">
              
              {/* LADO ESQUERDO: LISTA DE MINI IMAGENS (IMG + IMG + IMG) */}
              <div className="flex-1 min-w-0 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {flattenedSelectedItems.map((item, idx) => (
                  <React.Fragment key={item.key}>
                    {idx > 0 && (
                      <span className="text-[#D4AF37] text-sm sm:text-base font-bold select-none px-0.5 shrink-0">
                        +
                      </span>
                    )}
                    <div 
                      className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-[#D4AF37]/40 bg-white shadow-2xs shrink-0 group transition-transform hover:scale-105"
                      title={item.product.product_name}
                    >
                      <ImageWithFallback 
                        src={item.product.image} 
                        alt={item.product.product_name}
                        isThumbnail={true} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </React.Fragment>
                ))}
              </div>

              {/* LADO DIREITO: VALOR TOTAL EM DESTAQUE + BOTÃO CONCLUIR KIT */}
              <div className="flex items-center gap-4 sm:gap-6 justify-end shrink-0 pl-2">
                <div className="text-right">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[#1B2537]/65 block leading-none mb-1">
                    Total
                  </span>
                  <span className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-[#0F2C59] tracking-tight leading-none whitespace-nowrap">
                    {formatCurrency(total)}
                  </span>
                </div>

                <button 
                  onClick={handleFinish}
                  className="flex items-center justify-center gap-2 px-5 sm:px-8 py-3 sm:py-3.5 rounded-full text-xs sm:text-sm font-bold uppercase tracking-wider transition-all bg-[#0F2C59] hover:bg-[#1B3F7A] text-white border border-[#D4AF37]/40 shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  Concluir Kit
                  <Check size={16} strokeWidth={2.5} className="text-[#D4AF37]" />
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#0F2C59] text-white text-xs font-medium uppercase tracking-widest rounded-full shadow-[0_12px_30px_rgba(15,44,89,0.2)] border border-[#D4AF37]/40 flex items-center gap-3 min-w-[280px] justify-center text-center font-poppins"
          >
            <ShoppingCart size={14} className="text-[#D4AF37]" />
            <span>{toast}</span>
            <Sparkles size={12} className="text-[#D4AF37] animate-pulse" />
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

