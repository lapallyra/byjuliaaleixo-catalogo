import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import { SaleNotification, CompanyId } from '../types';
import { themes } from '../lib/theme';
import { generateRandomNotification } from '../services/saleNotificationService';
import { subscribeToSales } from '../services/firebaseService';
import { useAuth } from './AuthProvider';

interface SalesNotificationPortalProps {
  currentCompany: CompanyId | null;
}

export const SalesNotificationPortal: React.FC<SalesNotificationPortalProps> = ({ currentCompany }) => {
  const { isAdmin } = useAuth();
  const [notification, setNotification] = useState<SaleNotification | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const seenSaleIds = useRef<Set<string>>(new Set());

  const playFairyChime = () => {
    if (document.hidden) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const playPlim = (freq: number, start: number, volume: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + 0.4);
      };

      // Fofo/Happy "Plim" - Diamond chime sound
      playPlim(1567.98, now, 0.05); // G6
      playPlim(2093.00, now + 0.05, 0.08); // C7
      playPlim(3135.96, now + 0.1, 0.05); // G7
    } catch (e) {
      console.warn('Audio not supported', e);
    }
  };

  useEffect(() => {
    const handleCustomNotification = (event: any) => {
      const notif = event.detail;
      if (!notif.id) notif.id = crypto.randomUUID();
      if (seenSaleIds.current.has(notif.id)) return;
      seenSaleIds.current.add(notif.id);
      
      setNotification(notif);
      playFairyChime();
      setTimeout(() => setNotification(null), 6000);
    };

    window.addEventListener('new-sale-notification', handleCustomNotification);

    if (!currentCompany) {
      setNotification(null);
      return;
    }

    // Subscribe to real sales only if admin
    let unsubscribeSales = () => {};
    if (isAdmin) {
      unsubscribeSales = subscribeToSales((loadedSales) => {
        if (!currentCompany || loadedSales.length === 0) return;
        
        const sorted = [...loadedSales].sort((a, b) => {
          const timeA = a.createdAt?.toMillis?.() || 0;
          const timeB = b.createdAt?.toMillis?.() || 0;
          return timeB - timeA;
        });

        const newest = sorted[0];

        // Only show if it's new (last 30s) AND not seen AND belongs to current company
        const now = Date.now();
        const saleTime = newest.createdAt?.toMillis?.() || 0;
        if (now - saleTime < 30000 && newest.id && !seenSaleIds.current.has(newest.id) && newest.companyId === currentCompany) { 
          seenSaleIds.current.add(newest.id);
          const realNotif: SaleNotification = {
            id: newest.id,
            customerName: newest.customerName,
            productName: `comprou ${newest.items?.[0]?.product_name || 'um produto'}`,
            timeAgo: 'nesse momento',
            companyId: newest.companyId
          };
          setNotification(realNotif);
          playFairyChime();
          setTimeout(() => setNotification(null), 7000);
        }
      }, currentCompany);
    }

    const intervals = [5000, 15000, 30000, 60000, 120000]; // 5s, 15s, 30s, 1min, 2min

    // Fetch products once to use in random notifications
    const scheduleNext = async (index: number) => {
      if (!currentCompany) return;
      const delay = intervals[index] || (60000 + Math.random() * 120000);
      
      timerRef.current = setTimeout(() => {
        const nextNotif = generateRandomNotification(currentCompany);
        // Double check company before showing
        if (nextNotif && nextNotif.companyId === currentCompany) {
          setNotification(nextNotif);
          playFairyChime();
          setTimeout(() => setNotification(null), 7000);
        }
        scheduleNext(index + 1);
      }, delay);
    };

    scheduleNext(0);

    return () => {
      window.removeEventListener('new-sale-notification', handleCustomNotification);
      unsubscribeSales();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCompany, isAdmin]);

  const getTheme = (id: CompanyId) => {
    switch(id) {
      case 'pallyra': return { bg: 'bg-[#F8F8F6]', border: 'border-[#161616]/10', text: 'text-[#C6A664]', accent: 'text-[#161616]/70', time: 'text-[#161616]/40' };
      case 'guennita': return { bg: 'bg-[#450a0a]', border: 'border-[#d4af37]', text: 'text-[#d4af37]', accent: 'text-white/80', time: 'text-[#d4af37]/60' };
      case 'mimada': return { bg: 'bg-white', border: 'border-[#db2777]', text: 'text-[#db2777]', accent: 'text-gray-600', time: 'text-[#db2777]/60' };
      default: return { bg: 'bg-white/10', border: 'border-white/20', text: 'text-gold', accent: 'text-white/90', time: 'text-white/40' };
    }
  };

  const theme = themes[(notification ? notification.companyId : 'pallyra') as keyof typeof themes] || themes.pallyra;

  return (
    <div className="fixed bottom-6 left-6 z-[20000] pointer-events-none w-full max-w-[280px]">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: -50, scale: 0.9, rotate: -2 }}
            animate={{ opacity: 1, x: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, x: -50, scale: 0.9, filter: 'blur(10px)' }}
            className={`pointer-events-auto ${theme.bg} border ${theme.borderLine} rounded-2xl p-4 flex items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)] relative group`}
            style={{ 
              boxShadow: `0 0 30px -10px ${notification.companyId === 'mimada' ? '#db2777' : '#d4af37'}66` 
            }}
          >
            {/* Fairy Dust Effect - Outside the card */}
            <div className="absolute -inset-12 pointer-events-none overflow-visible">
              {[...Array(40)].map((_, i) => (
                <motion.div
                  key={`sparkle-${notification.id}-${i}`}
                  className="magic-sparkle absolute rounded-full"
                  initial={{ 
                    opacity: 0, 
                    scale: 0,
                    left: `${Math.random() * 120 - 10}%`,
                    top: `${Math.random() * 120 - 10}%`
                  }}
                  animate={{
                    opacity: [0, 0.8, 1, 0.8, 0],
                    scale: [0, Math.random() * 1.5 + 0.5, Math.random() * 0.5 + 0.5, 0],
                    y: [0, (Math.random() - 0.5) * 80],
                    x: [0, (Math.random() - 0.5) * 80]
                  }}
                  transition={{ 
                    duration: 1.5 + Math.random() * 2, 
                    repeat: Infinity, 
                    delay: i * 0.05,
                    ease: "easeInOut"
                  }}
                  style={{ 
                    backgroundColor: notification.companyId === 'mimada' ? '#db2777' : '#d4af37',
                    boxShadow: `0 0 8px ${notification.companyId === 'mimada' ? '#db2777' : '#d4af37'}, 0 0 4px white`,
                    width: Math.random() * 5 + 1 + 'px',
                    height: Math.random() * 5 + 1 + 'px'
                  }}
                />
              ))}
            </div>

            <div className={`p-2.5 rounded-xl border ${theme.borderLine} bg-white/5 relative z-10`}>
              <ShoppingBag className={theme.textPrimary} size={18} />
            </div>
            
            <div className="flex-1 min-w-0 relative z-10">
              <p className={`text-[10px] md:text-[11px] leading-relaxed ${theme.textSecondary}`}>
                <span className={`font-black uppercase tracking-wider ${theme.textPrimary}`}>{notification.customerName}</span> {notification.productName}
              </p>
              <p className={`text-[8px] uppercase tracking-[0.2em] font-black mt-1.5 opacity-60 ${theme.textVeryMuted}`}>
                {notification.timeAgo.includes('segundo') ? `há ${notification.timeAgo}` : notification.timeAgo}
              </p>
            </div>
            
            <button 
              onClick={() => setNotification(null)}
              className={`absolute top-2 right-2 p-1 opacity-20 hover:opacity-100 transition-opacity ${theme.textPrimary}`}
            >
              <X size={12} />
            </button>

            {/* Fairy Dust Border Glow */}
            <motion.div 
              className={`absolute inset-0 border-2 ${theme.borderLine} rounded-2xl pointer-events-none`}
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
