import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Check } from 'lucide-react';
import { CompanyId } from '../types';

export const PrizeRouletteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onResult?: (prize: string) => void;
  prizes: { id: string; name: string; active: boolean; weight: number }[];
  theme: any;
}> = ({ isOpen, onClose, onResult, prizes, theme }) => {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  // Filter only active prizes
  const activePrizes = (prizes && prizes.length > 0) ? prizes.filter(p => p.active) : [];
  
  if (!isOpen) return null;

  const accentColor = theme.accentColor || '#d4af37';

  const handlePickCard = (index: number) => {
    if (selectedCard !== null || revealing) return;
    
    setSelectedCard(index);
    setRevealing(true);
    
    // Weighted prize logic
    const totalWeight = activePrizes.reduce((sum, p) => sum + (p.weight || 10), 0);
    let randomNum = Math.random() * totalWeight;
    let winnerIndex = 0;
    
    for (let i = 0; i < activePrizes.length; i++) {
        randomNum -= (activePrizes[i].weight || 10);
        if (randomNum <= 0) {
            winnerIndex = i;
            break;
        }
    }

    const prizeName = activePrizes[winnerIndex]?.name || "Brinde Especial";

    setTimeout(() => {
      setRevealing(false);
      setResult(prizeName);
      if (onResult) onResult(prizeName);
    }, 1200);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[5000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <div className={`relative ${theme.bg || "bg-white"} w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl flex flex-col items-center p-8 border-4`} style={{ borderColor: accentColor }}>
          
          <div className="absolute top-6 right-6">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 transition-colors" disabled={revealing && !result}>
              <X size={24} className="text-gray-400" />
            </button>
          </div>

          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ backgroundColor: accentColor + '15' }}>
                <Gift size={40} style={{ color: accentColor }} />
              </div>
            </div>
            <h2 className="text-3xl font-fancy tracking-widest mb-2" style={{ color: accentColor }}>Cards Surpresa</h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.2em]">
              Escolha um dos cards abaixo para revelar seu brinde exclusivo!
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full px-4 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={selectedCard === null ? { y: -10, scale: 1.05 } : {}}
                whileTap={selectedCard === null ? { scale: 0.95 } : {}}
                onClick={() => handlePickCard(i)}
                className={`aspect-[3/4] rounded-2xl cursor-pointer relative preserve-3d transition-all duration-700 ${selectedCard === i ? 'rotate-y-180' : ''}`}
                style={{ 
                   transformStyle: 'preserve-3d',
                   transform: selectedCard === i ? 'rotateY(180deg)' : 'none'
                }}
              >
                {/* Front of card */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-2xl flex flex-col items-center justify-center border-2 border-dashed shadow-xl"
                  style={{ 
                    backgroundColor: accentColor + '05', 
                    borderColor: accentColor + '30',
                    backfaceVisibility: 'hidden'
                  }}
                >
                   <Gift size={32} className="opacity-20 mb-2" style={{ color: accentColor }} />
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Mimo</span>
                </div>

                {/* Back of card (revealed) */}
                <div 
                  className="absolute inset-0 backface-hidden rounded-2xl flex flex-col items-center justify-center rotate-y-180 shadow-2xl border-4"
                  style={{ 
                    backgroundColor: 'white', 
                    borderColor: accentColor,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)'
                  }}
                >
                   {selectedCard === i && (
                     <div className="text-center p-4">
                        <Check size={24} className="mx-auto mb-2 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-tighter block text-gray-400 mb-1">Você Ganhou:</span>
                        <span className="text-xs font-black uppercase tracking-normal block leading-tight" style={{ color: accentColor }}>{result || '...'}</span>
                     </div>
                   )}
                </div>
              </motion.div>
            ))}
          </div>

          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center w-full bg-slate-50 p-6 rounded-3xl border border-slate-100"
            >
              <p className="text-sm font-bold text-gray-700 mb-4 italic font-serif">
                "{result} foi adicionado com carinho ao seu pedido!"
              </p>
              <button
                onClick={onClose}
                className="w-full py-5 bg-black text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl shadow-xl transition-all active:scale-95"
                style={{ backgroundColor: accentColor }}
              >
                Resgatar e Ir para Pagamento
              </button>
            </motion.div>
          )}

          <p className="mt-8 text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] text-center max-w-xs">
            Válido apenas para compras acima de R$ 300,00. Brinde automático no faturamento.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
