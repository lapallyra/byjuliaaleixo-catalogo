import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { ProductCard } from './ui/ProductCard';
import { themes } from '../lib/theme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Gift, X, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './ImageWithFallback';

interface KitsViewProps {
  allProducts: Product[];
  setCarts: any;
}

export const KitsView: React.FC<KitsViewProps> = ({ allProducts, setCarts }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product');
  
  const [selectedKit, setSelectedKit] = useState<Product | null>(null);

  const kits = useMemo(() => allProducts.filter(p => p.isKit && p.kitType === 'kit_pronto'), [allProducts]);

  useEffect(() => {
    if (productId) {
      const kit = kits.find(k => k.id === productId);
      if (kit) setSelectedKit(kit);
    } else {
      setSelectedKit(null);
    }
  }, [productId, kits]);

  const handleAddToCart = (product: Product) => {
    const itemToAdd: CartItem = { ...product, quantity: 1 };
    setCarts((prev: CartItem[]) => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, itemToAdd];
    });
    alert(`${product.product_name} adicionado ao seu carrinho!`);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-neutral-50 rounded-full transition-colors text-neutral-400 hover:text-neutral-900"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-serif italic text-neutral-900">Kits Prontos</h1>
          </div>
          <div className="flex gap-4">
             <button 
              onClick={() => navigate('/kit-meukit')}
              className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors"
            >
              Monte seu Kit
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-serif italic text-neutral-900 mb-4">Combinações Exclusivas</h2>
          <p className="text-neutral-500 max-w-xl mx-auto">Kits cuidadosamente montados para surpreender em qualquer ocasião.</p>
        </div>

        {kits.length === 0 ? (
          <div className="text-center py-20 bg-white border border-neutral-100 rounded-[3rem] shadow-sm">
            <Gift className="mx-auto text-neutral-200 mb-4" size={48} />
            <p className="text-neutral-400 font-medium">Nenhum kit pronto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {kits.map((kit, idx) => (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer"
                onClick={() => setSearchParams({ product: kit.id })}
              >
                <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden bg-neutral-100 mb-6 relative border border-neutral-100 shadow-sm transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-neutral-200/50 group-hover:-translate-y-2">
                  <ImageWithFallback src={kit.image} alt={kit.product_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-6 left-6">
                    <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest text-neutral-900 border border-white/20 shadow-lg">
                      Kit Pronto
                    </span>
                  </div>
                </div>
                <div className="px-2">
                  <h3 className="text-xl font-serif italic text-neutral-900 mb-2 group-hover:text-amber-600 transition-colors">{kit.product_name}</h3>
                  <p className="text-lg font-bold text-neutral-900">R$ {kit.retail_price.toFixed(2)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedKit && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-[1000] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-4xl shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setSearchParams({})}
                className="absolute top-8 right-8 p-3 rounded-full bg-white/80 backdrop-blur-md text-neutral-400 hover:text-neutral-900 z-50 shadow-sm transition-all"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 aspect-square md:aspect-auto">
                  <ImageWithFallback src={selectedKit.image} alt={selectedKit.product_name} className="w-full h-full object-cover" />
                </div>
                
                <div className="md:w-1/2 p-10 md:p-14 flex flex-col">
                  <div className="mb-10">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles size={16} className="text-amber-500" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">Kit Especial</span>
                    </div>
                    <h2 className="text-4xl font-serif italic text-neutral-900 mb-6">{selectedKit.product_name}</h2>
                    <p className="text-neutral-500 leading-relaxed italic">
                      "{selectedKit.description || "Uma seleção exclusiva de produtos que se complementam perfeitamente para criar um momento especial."}"
                    </p>
                  </div>

                  {selectedKit.kitItems && selectedKit.kitItems.length > 0 && (
                    <div className="mb-10">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-4 border-b border-neutral-50 pb-2">Itens Inclusos</h4>
                      <ul className="space-y-3">
                        {selectedKit.kitItems.map((item, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm text-neutral-600">
                            <CheckCircle size={14} className="text-green-500" />
                            <span>{item.quantity}x {allProducts.find(p => p.id === item.id)?.product_name || "Item do Kit"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-auto">
                    <div className="flex items-end justify-between mb-8">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-1">Valor Total</p>
                        <p className="text-3xl font-bold text-neutral-900">R$ {selectedKit.retail_price.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleAddToCart(selectedKit)}
                      className="w-full py-5 bg-neutral-900 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] hover:bg-neutral-800 transition-all flex items-center justify-center gap-3 shadow-xl shadow-neutral-200 active:scale-95"
                    >
                      <ShoppingBag size={18} />
                      Adicionar à Sacola
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
