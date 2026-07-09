import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { ProductCard } from './ui/ProductCard';
import { themes } from '../lib/theme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Gift, X, Sparkles, CheckCircle, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageWithFallback } from './ImageWithFallback';
import { ProductDetailModal } from './ProductDetailModal';

interface KitsViewProps {
  allProducts: Product[];
  setCarts: any;
}

export const KitsView: React.FC<KitsViewProps> = ({ allProducts, setCarts }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product');
  
  const [selectedKit, setSelectedKit] = useState<Product | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const kits = useMemo(() => allProducts.filter(p => p.isKit && p.kitType === 'kit_pronto'), [allProducts]);

  useEffect(() => {
    if (productId) {
      const kit = kits.find(k => k.id === productId);
      if (kit) setSelectedKit(kit);
    } else {
      setSelectedKit(null);
    }
  }, [productId, kits]);

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const itemToAdd: CartItem = { ...product, quantity: quantity };
    setCarts((prev: CartItem[]) => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, itemToAdd];
    });
    setToast(`${product.product_name} adicionado ao seu carrinho!`);
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

      {/* Details Modal (Unified Drawer Pattern) */}
      <AnimatePresence>
        {selectedKit && (
          <ProductDetailModal
            product={selectedKit}
            onClose={() => setSearchParams({})}
            onAddToCart={(prod, qty) => {
              handleAddToCart(prod, qty);
            }}
            allProducts={allProducts}
            companyId={selectedKit.company || 'mimada'}
          />
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
    </div>
  );
};
