import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart } from 'lucide-react';
import { SaleNotification, CompanyId } from '../types';
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

      // Simple elegant ping
      playPlim(1567.98, now, 0.05); // G6
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
      setTimeout(() => setNotification(null), 5000);
    };

    window.addEventListener('new-sale-notification', handleCustomNotification);

    if (!currentCompany) {
      setNotification(null);
      return;
    }

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

        const now = Date.now();
        const saleTime = newest.createdAt?.toMillis?.() || 0;
        if (now - saleTime < 30000 && newest.id && !seenSaleIds.current.has(newest.id) && newest.companyId === currentCompany) { 
          seenSaleIds.current.add(newest.id);
          const realNotif: SaleNotification = {
            id: newest.id,
            customerName: newest.customerName,
            productName: newest.items?.[0]?.product_name || 'um produto',
            timeAgo: 'há 1 segundo em São Paulo - SP', // Placeholder for real orders
            companyId: newest.companyId
          };
          setNotification(realNotif);
          playFairyChime();
          setTimeout(() => setNotification(null), 5000);
        }
      }, currentCompany);
    }

    // Natural random intervals (3s, 6s, 9s, 15s)
    const getNextDelay = () => {
      const randomTime = Math.random();
      if (randomTime < 0.4) return 3000;
      if (randomTime < 0.7) return 6000;
      if (randomTime < 0.9) return 9000;
      return 15000;
    };

    const scheduleNext = (isFirst: boolean = false) => {
      if (!currentCompany) return;
      const delay = isFirst ? 1000 : getNextDelay();
      
      timerRef.current = setTimeout(() => {
        const nextNotif = generateRandomNotification(currentCompany);
        if (nextNotif && nextNotif.companyId === currentCompany) {
          setNotification(nextNotif);
          playFairyChime();
          setTimeout(() => setNotification(null), 5000);
        }
        scheduleNext(false);
      }, delay);
    };

    scheduleNext(true);

    return () => {
      window.removeEventListener('new-sale-notification', handleCustomNotification);
      unsubscribeSales();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCompany, isAdmin]);

  return (
    <div className="fixed bottom-4 left-4 z-[20000] pointer-events-none w-max">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="pointer-events-auto bg-black/60 backdrop-blur-md rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/10"
          >
            <div className="flex-1 min-w-0 flex flex-col">
              <p className="text-[12px] leading-tight text-white/90">
                <Heart size={10} className="inline-block mr-1.5 shrink-0 stroke-[2] text-white/70" />
                <span className="font-semibold text-white tracking-tight">{notification.customerName}</span> comprou {notification.productName}
              </p>
              <p className="text-[11px] leading-tight mt-0.5 text-white/50 tracking-tight">
                {notification.timeAgo}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
