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
    <div className="min-h-screen bg-[#FDFCFA] font-sans pb-20 relative overflow-x-hidden select-none">
      {/* Subtle Top Gradient matching Home */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#FAF6F0] to-transparent pointer-events-none -z-10" />

      <main className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center relative">
          <div className="flex flex-col items-center gap-2 mb-3">
             <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#8C6D37]">Combinações Exclusivas</span>
             <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-mea-culpa text-[#2C1810]">Kits Prontos</h2>
             <div className="h-[1px] w-12 bg-[#B38F4D]/50 mt-2" />
          </div>
          <p className="text-[#5C4033] max-w-2xl mx-auto text-xs sm:text-sm font-light leading-relaxed">
            Kits cuidadosamente montados para surpreender em qualquer ocasião, unindo afeto e design em composições prontas para presentear.
          </p>
        </div>

        {kits.length === 0 ? (
          <div className="w-full text-center py-20 bg-white/80 border border-[#E8DFC8] rounded-3xl shadow-xs">
            <Gift className="mx-auto text-[#B38F4D]/40 mb-4" size={48} />
            <p className="text-[#5C4033] font-medium text-sm">Nenhum kit pronto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {kits.map((kit, idx) => (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="group cursor-pointer bg-white rounded-3xl p-3 border border-[#E8DFC8]/60 shadow-xs hover:shadow-md transition-all duration-300"
                onClick={() => setSearchParams({ product: kit.id })}
              >
                <div className="aspect-[4/4] rounded-2xl overflow-hidden bg-[#FAF6F0] mb-4 relative border border-[#E8DFC8]/40 shadow-xs transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1">
                  <ImageWithFallback src={kit.image} alt={kit.product_name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest text-[#2C1810] border border-[#E8DFC8] shadow-xs">
                      Kit Pronto
                    </span>
                  </div>
                </div>
                <div className="px-2 pb-2">
                  <h3 className="text-base sm:text-lg font-serif italic text-[#2C1810] mb-1.5 group-hover:text-[#8C6D37] transition-colors line-clamp-1">{kit.product_name}</h3>
                  <p className="text-base font-bold text-[#2C1810]">R$ {kit.retail_price.toFixed(2)}</p>
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
