import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem } from '../types';
import { ProductCard } from './ui/ProductCard';
import { themes } from '../lib/theme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, Gift, X, Sparkles, CheckCircle, ShoppingCart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
    <div className="min-h-screen bg-[#FAF8F5] text-[#1B2537] font-sans pb-20 relative overflow-x-hidden select-none">
      {/* Subtle Top Gradient matching Home */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-[#F3ECDF]/60 to-transparent pointer-events-none -z-10" />

      <main className="w-full px-2 sm:px-3 py-6 sm:py-8 relative z-10">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10 text-center relative">
          <div className="flex flex-col items-center gap-2 mb-3">
             <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#0F2C59]/75">Combinações Exclusivas</span>
             <h2 className="whitespace-nowrap overflow-visible text-[clamp(2rem,4.5vw,3.5rem)] font-mea-culpa text-[#0F2C59] leading-[1.42] py-1.5 px-1.5">Kits Prontos</h2>
             <div className="h-[1px] w-12 bg-[#D4AF37]/60 mt-2" />
          </div>
          <p className="text-[#1B2537]/75 max-w-2xl mx-auto text-xs sm:text-sm font-light leading-relaxed">
            Kits cuidadosamente montados para surpreender em qualquer ocasião, unindo afeto e design em composições prontas para presentear.
          </p>
        </div>

        {kits.length === 0 ? (
          <div className="w-full text-center py-20 bg-white/80 border border-[#D4AF37]/30 rounded-3xl shadow-xs">
            <Gift className="mx-auto text-[#D4AF37]/60 mb-4" size={48} />
            <p className="text-[#0F2C59] font-medium text-sm">Nenhum kit pronto disponível no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5 lg:gap-4">
            {kits.map((kit) => (
              <ProductCard
                key={kit.id}
                product={kit}
                onClick={() => setSearchParams({ product: kit.id })}
                onAddToCart={(prod, qty) => handleAddToCart(prod, qty)}
              />
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
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#0F2C59] text-white text-xs font-medium uppercase tracking-widest rounded-full shadow-[0_12px_30px_rgba(15,44,89,0.2)] border border-[#D4AF37]/40 flex items-center gap-3 min-w-[280px] justify-center text-center font-poppins"
          >
            <ShoppingCart size={14} className="text-[#D4AF37]" />
            <span>{toast}</span>
            <Sparkles size={12} className="text-[#D4AF37] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
