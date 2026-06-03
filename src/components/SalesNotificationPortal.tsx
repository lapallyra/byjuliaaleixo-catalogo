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

      // Master volume (0.12 - nice and pleasant level for popups)
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.12, now);
      masterGain.connect(audioCtx.destination);

      // 1. THE CASH REGISTER BELL
      const bell1 = audioCtx.createOscillator();
      const bell1Gain = audioCtx.createGain();
      bell1.type = "sine";
      bell1.frequency.setValueAtTime(1250, now);
      bell1Gain.gain.setValueAtTime(0.4, now);
      bell1Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      bell1.connect(bell1Gain);
      bell1Gain.connect(masterGain);

      const bell2 = audioCtx.createOscillator();
      const bell2Gain = audioCtx.createGain();
      bell2.type = "triangle";
      bell2.frequency.setValueAtTime(2500, now);
      bell2Gain.gain.setValueAtTime(0.15, now);
      bell2Gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      bell2.connect(bell2Gain);
      bell2Gain.connect(masterGain);

      // 2. STAGGERED COIN CLATTER
      const coinTimes = [0.06, 0.11, 0.15, 0.20];
      const coinFreqs = [1900, 2900, 4200, 3100];
      
      coinTimes.forEach((timeOffset, idx) => {
        const coinOsc = audioCtx.createOscillator();
        const coinGain = audioCtx.createGain();
        
        coinOsc.type = "sine";
        coinOsc.frequency.setValueAtTime(coinFreqs[idx], now + timeOffset);
        
        coinGain.gain.setValueAtTime(0, now + timeOffset);
        coinGain.gain.linearRampToValueAtTime(0.25, now + timeOffset + 0.005);
        coinGain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.07);
        
        coinOsc.connect(coinGain);
        coinGain.connect(masterGain);
        
        coinOsc.start(now + timeOffset);
        coinOsc.stop(now + timeOffset + 0.09);
      });

      // 3. NOISE BURST FOR FRICTION Resonators
      const bufferSize = audioCtx.sampleRate * 0.20; // 200ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = buffer;

      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = "bandpass";
      noiseFilter.frequency.setValueAtTime(7500, now);
      noiseFilter.Q.value = 4.0;

      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0, now);
      noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.04);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.20);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      bell1.start(now);
      bell1.stop(now + 0.4);

      bell2.start(now);
      bell2.stop(now + 0.2);

      noiseSource.start(now + 0.02);
      noiseSource.stop(now + 0.23);

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
