import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SaleNotification, CompanyId, Product } from "../types";
import { generateRandomNotification } from "../services/saleNotificationService";

interface CustomerSocialProofToastProps {
  currentCompany: CompanyId | null;
  products?: Product[];
}

export const CustomerSocialProofToast: React.FC<
  CustomerSocialProofToastProps
> = ({ currentCompany, products = [] }) => {
  const [notifications, setNotifications] = useState<SaleNotification[]>([]);
  const seenSaleIds = useRef<Set<string>>(new Set());
  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const lastSoundTime = useRef<number>(0);

  const playNotificationChime = () => {
    if (document.hidden) return;
    const now = Date.now();
    if (now - lastSoundTime.current < 2000) return;
    lastSoundTime.current = now;

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime); // Simple Plim

      gain.gain.setValueAtTime(0, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio context not supported", e);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (timerRefs.current[id]) {
      clearTimeout(timerRefs.current[id]);
      delete timerRefs.current[id];
    }
  };

  useEffect(() => {
    if (!currentCompany) return;

    // Disabled to comply with SITE-005 (Zero Mock Data Policy)
    /*
    const triggerNotification = () => {
        const mockData = generateRandomNotification(currentCompany, products);
        if (!seenSaleIds.current.has(mockData.id)) {
          seenSaleIds.current.add(mockData.id);
          setNotifications((prev) => [...prev.slice(-2), mockData]);
          playNotificationChime();
          timerRefs.current[mockData.id] = setTimeout(() => {
            removeNotification(mockData.id);
          }, 4000);
        }
    };
    
    triggerNotification();

    const interval = setInterval(() => {
      if (Math.random() > 0.4) {
        triggerNotification();
      }
    }, 8000);

    return () => {
      clearInterval(interval);
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
    */
  }, [currentCompany, products]);

  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-max flex flex-col gap-3 items-center">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative pointer-events-auto"
          >
            {/* Bloom Glow Aura */}
            <motion.div
              className="absolute -inset-4 bg-white/30 blur-2xl rounded-full"
              animate={{
                opacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Glass Card */}
            <div className="relative flex items-center gap-3 px-5 py-3 bg-white/40 backdrop-blur-xl border border-white/40 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
              <span className="text-xl">❤️</span>
              <div className="flex flex-col">
                <span className="text-[13px] font-semibold text-slate-900 leading-tight">
                  {notification.customerName}
                </span>
                <span className="text-[11px] text-slate-700 leading-tight">
                  comprou {notification.productName}
                </span>
                <span className="text-[9px] text-slate-500 mt-0.5">
                  {notification.cityState || "Brasil"} • {notification.timeAgo}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
