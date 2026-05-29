import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, ShoppingBag } from 'lucide-react';
import { themes } from '../../lib/theme';
import { useLocation } from 'react-router-dom';

const MOCK_PURCHASES = [
  { name: 'Maria S.', item: 'Kit Papelaria Personalizada', location: 'São Paulo, SP', time: 'Há 5 min' },
  { name: 'Ana P.', item: 'Caixa Luxo Maternidade', location: 'Curitiba, PR', time: 'Há 12 min' },
  { name: 'Camila R.', item: 'Caderneta de Vacina', location: 'Rio de Janeiro, RJ', time: 'Há 25 min' },
];

export function PurchaseAlert() {
  const [currentAlert, setCurrentAlert] = useState<number | null>(null);
  const location = useLocation();

  let companyId: 'pallyra' | 'guennita' | 'mimada' = 'pallyra';
  if (location.pathname.includes('comamorguennita')) companyId = 'guennita';
  else if (location.pathname.includes('mimadasim')) companyId = 'mimada';
  
  const theme = themes[companyId] || themes.pallyra;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const showRandomAlert = () => {
      // Pick a random purchase
      const randomIndex = Math.floor(Math.random() * MOCK_PURCHASES.length);
      setCurrentAlert(randomIndex);

      // Hide after 5 seconds
      timeoutId = setTimeout(() => {
        setCurrentAlert(null);
        // Schedule next alert
        timeoutId = setTimeout(showRandomAlert, Math.random() * 20000 + 15000); // 15 to 35 seconds
      }, 5000);
    };

    // Initial wait
    timeoutId = setTimeout(showRandomAlert, 5000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <AnimatePresence>
      {currentAlert !== null && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="fixed bottom-4 left-4 z-50 pointer-events-none"
        >
          <div className="bg-white/90 backdrop-blur-sm shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 rounded-full py-2 px-4 flex items-center gap-3 w-max max-w-[280px]">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: theme.accentColor + '15', borderColor: theme.accentColor + '30', color: theme.accentColor }}>
              <ShoppingBag size={14} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500 font-medium">
                <strong className="text-gray-800">{MOCK_PURCHASES[currentAlert].name}</strong> comprou
              </span>
              <span className="text-xs font-bold text-gray-900 truncate max-w-[180px]">
                {MOCK_PURCHASES[currentAlert].item}
              </span>
              <div className="flex items-center gap-1 mt-0.5 text-[9px] text-gray-400 font-medium">
                <MapPin size={8} /> {MOCK_PURCHASES[currentAlert].location} • {MOCK_PURCHASES[currentAlert].time}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
