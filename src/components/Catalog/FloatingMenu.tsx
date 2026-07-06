import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingCart, Gift, MessageSquare, MessageCircle } from 'lucide-react';

interface FloatingMenuProps {
  cartCount: number;
  giftListCount: number;
  onCartClick: () => void;
  onGiftListClick: () => void;
  onSuggestionClick: () => void;
  whatsappUrl: string;
  theme: any;
}

export const FloatingMenu: React.FC<FloatingMenuProps> = ({
  cartCount,
  giftListCount,
  onCartClick,
  onGiftListClick,
  onSuggestionClick,
  whatsappUrl,
  theme
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prevCartCount, setPrevCartCount] = useState(cartCount);
  const [prevGiftCount, setPrevGiftCount] = useState(giftListCount);
  const [showCartJump, setShowCartJump] = useState(false);
  const [showGiftJump, setShowGiftJump] = useState(false);

  useEffect(() => {
    if (cartCount > prevCartCount) {
      setShowCartJump(true);
      setTimeout(() => setShowCartJump(false), 2000);
    }
    setPrevCartCount(cartCount);
  }, [cartCount, prevCartCount]);

  useEffect(() => {
    if (giftListCount > prevGiftCount) {
      setShowGiftJump(true);
      setTimeout(() => setShowGiftJump(false), 2000);
    }
    setPrevGiftCount(giftListCount);
  }, [giftListCount, prevGiftCount]);

  const menuItems = [
    { icon: ShoppingCart, label: 'Carrinho', onClick: onCartClick, count: cartCount, color: '#3A312D' },
    { icon: Gift, label: 'Lista de Presentes', onClick: onGiftListClick, count: giftListCount, color: '#cca062' },
    { icon: MessageSquare, label: 'Sugestões', onClick: onSuggestionClick, color: '#A68B80' },
    { icon: MessageCircle, label: 'WhatsApp', onClick: () => window.open(whatsappUrl, '_blank'), color: '#25D366' },
  ];

  return (
    <div 
      className="fixed bottom-6 right-6 z-[1000] flex flex-col items-center gap-3"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            className="flex flex-col items-center gap-3 mb-2"
          >
            {menuItems.map((item, idx) => (
              <div key={idx} className="group relative flex items-center">
                <span className="absolute right-full mr-4 px-3 py-1.5 bg-[#3A312D] text-white text-[10px] font-bold uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">
                  {item.label}
                </span>
                <button
                  onClick={item.onClick}
                  className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-lg border border-neutral-100 hover:scale-110 active:scale-95 transition-all"
                  style={{ color: item.color }}
                >
                  <item.icon size={20} strokeWidth={2.5} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#3A312D] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-md">
                      {item.count}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Jumping Indicators */}
        <AnimatePresence>
          {showCartJump && (
            <motion.div
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, x: -60, y: -20 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute z-[-1] flex items-center gap-2 bg-[#3A312D] text-white px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
            >
              <ShoppingCart size={14} />
              <span className="text-[10px] font-black">{cartCount}</span>
            </motion.div>
          )}
          {showGiftJump && (
            <motion.div
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{ opacity: 1, x: 60, y: -20 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute z-[-1] flex items-center gap-2 bg-[#cca062] text-white px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
            >
              <Gift size={14} />
              <span className="text-[10px] font-black">{giftListCount}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          className="w-16 h-16 rounded-full bg-white shadow-[0_10px_30px_rgba(58,49,45,0.15)] flex items-center justify-center border-2 border-[#e8dcc8]/20 hover:scale-110 active:scale-90 transition-all duration-300 relative group"
        >
          <div className="relative">
            <Heart 
              size={32} 
              className="text-[#F1948A] fill-[#F1948A] drop-shadow-[0_4px_8px_rgba(241,148,138,0.4)] transition-transform duration-500 group-hover:scale-110" 
              strokeWidth={1}
            />
            {/* 3D-ish effect with subtle overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent rounded-full pointer-events-none" />
          </div>
        </button>
      </div>
    </div>
  );
};
