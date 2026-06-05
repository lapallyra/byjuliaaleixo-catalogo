import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check } from 'lucide-react';

export const CrystalCartToast = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleAddedToCart = () => {
      // Clear existing timer if triggered again to ensure only one instance
      // stays on screen, but simply restarts the duration instead of duplicating.
      clearTimeout(timer);
      setIsVisible(true);
      
      timer = setTimeout(() => {
        setIsVisible(false);
      }, 1200); // Between 700ms and 1200ms
    };

    window.addEventListener('added-to-cart', handleAddedToCart as EventListener);

    return () => {
      window.removeEventListener('added-to-cart', handleAddedToCart as EventListener);
      clearTimeout(timer);
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed z-[9999] top-[80px] left-4 right-4 md:left-auto md:right-8 md:top-24 flex justify-center md:justify-end pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} // Smooth spring-like ease
            className="w-full max-w-[340px] pointer-events-auto"
          >
            {/* Crystal Glass Toast Shell */}
            <div className="relative overflow-hidden rounded-2xl backdrop-blur-2xl bg-white/30 border border-white/50 shadow-[0_8px_30px_rgba(0,0,0,0.04),0_0_20px_rgba(255,255,255,0.3)] p-3.5 flex items-center gap-4">
              
              {/* Inner ambient glow (glow suave) */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-white/40 to-transparent pointer-events-none" />
              
              {/* Subtle inner ring for glass edge */}
              <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/60 pointer-events-none" />

              {/* 3D Glass Icon Container */}
              <div className="relative shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white/40 shadow-[inset_0_{1px}_3px_rgba(255,255,255,0.8),_0_2px_10px_rgba(0,0,0,0.05)] border border-white/70 backdrop-blur-md">
                <Check className="text-gray-700 drop-shadow-[0_1px_0px_rgba(255,255,255,1)]" size={18} strokeWidth={3} />
              </div>

              {/* Typography */}
              <div className="flex flex-col relative z-10 gap-0.5">
                <span className="text-[13px] font-bold text-gray-800 tracking-tight leading-tight">
                  Adicionado ao carrinho
                </span>
                <span className="text-[10.5px] uppercase tracking-wider font-semibold text-gray-500">
                  Produto salvo com sucesso
                </span>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
