import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SaleNotification, CompanyId, Product } from "../types";
import { generateRandomNotification } from "../services/saleNotificationService";

interface CustomerSocialProofToastProps {
  currentCompany: CompanyId | null;
  products?: Product[];
}

const LightSpecks = () => {
  const [particles, setParticles] = useState<
    Array<{
      id: number;
      x: number;
      y: number;
      size: number;
      delay: number;
      duration: number;
    }>
  >([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1, // 1 to 4px
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 1, // 1s to 2s
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[20px] mix-blend-screen z-20">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeInOut",
          }}
          className="absolute rounded-full bg-white blur-[1px]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            boxShadow: "0 0 4px 1px rgba(255, 255, 255, 0.8)",
          }}
        />
      ))}
    </div>
  );
};

export const CustomerSocialProofToast: React.FC<
  CustomerSocialProofToastProps
> = ({ currentCompany, products = [] }) => {
  const [notifications, setNotifications] = useState<SaleNotification[]>([]);
  const seenSaleIds = useRef<Set<string>>(new Set());
  const timerRefs = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const lastSoundTime = useRef<number>(0);

  // High-pitched crystal "plim" sound
  const playNotificationChime = () => {
    if (document.hidden) return;
    const now = Date.now();
    // Prevent overlapping sounds (must wait at least 2 seconds between plims)
    if (now - lastSoundTime.current < 2000) return;
    lastSoundTime.current = now;

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const ctxNow = audioCtx.currentTime;

      const playChimeTone = (
        freq: number,
        start: number,
        duration: number,
        volume: number,
      ) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      playChimeTone(1567.98, ctxNow, 1.5, 0.05); // G6 crystal clear
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

    const interval = setInterval(() => {
      // Randomly decide whether to show a notification
      if (Math.random() > 0.65) {
        const mockData = generateRandomNotification(currentCompany, products);

        if (!seenSaleIds.current.has(mockData.id)) {
          seenSaleIds.current.add(mockData.id);

          setNotifications((prev) => {
            // Keep max 3 notifications
            const newNotifs = [...prev, mockData];
            if (newNotifs.length > 3) {
              return newNotifs.slice(newNotifs.length - 3);
            }
            return newNotifs;
          });

          playNotificationChime();

          // Auto remove after 4 seconds
          timerRefs.current[mockData.id] = setTimeout(() => {
            removeNotification(mockData.id);
          }, 4000);
        }
      }
    }, 15000); // Check every 15 seconds

    return () => {
      clearInterval(interval);
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, [currentCompany, products]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none w-max flex flex-col gap-3 items-center">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <motion.div
            layout
            key={notification.id}
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: 20,
              scale: 0.95,
              transition: { duration: 0.25 },
            }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.2,
            }}
            className="relative"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {/* Elegant Bloom Aura */}
            <div
              className="absolute -inset-6 bg-white/30 blur-2xl -z-10 rounded-full opacity-60"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(255,255,255,0.7) 0%, rgba(200,200,200,0.1) 60%, transparent 100%)",
              }}
            />

            {/* Micro Particles */}
            <LightSpecks />

            {/* Premium Apple-like Glass Card */}
            <div className="pointer-events-auto bg-white/70 backdrop-blur-xl rounded-[24px] p-3 pl-4 pr-5 border border-white/40 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_1px_4px_rgba(0,0,0,0.04)] flex items-center gap-4 select-none relative overflow-hidden min-w-[320px] max-w-[90vw]">
              {/* 3D Heart Emoji on the left */}
              <div className="relative flex-shrink-0 z-10 flex items-center justify-center w-11 h-11 bg-white/50 rounded-2xl shadow-inner border border-white/60">
                <span
                  className="text-2xl drop-shadow-md"
                  style={{ textShadow: "0 2px 4px rgba(0,0,0,0.15)" }}
                >
                  ❤️
                </span>
              </div>

              {/* Content */}
              <div className="flex-grow min-w-0 z-10 flex flex-col justify-center py-1">
                {/* Centralized Name */}
                <div className="w-full text-center mb-0.5">
                  <span className="text-[13px] text-slate-900 font-bold tracking-tight">
                    {notification.customerName}
                  </span>
                </div>

                <p className="text-[11px] leading-tight text-slate-600 font-medium mb-1.5 text-center truncate">
                  comprou{" "}
                  <span className="font-semibold text-slate-800">
                    {notification.productName}
                  </span>
                </p>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9.5px] font-semibold text-slate-400 truncate max-w-[60%]">
                    {notification.cityState || "Querência do Norte - PR"}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-400 whitespace-nowrap">
                    {notification.timeAgo}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
