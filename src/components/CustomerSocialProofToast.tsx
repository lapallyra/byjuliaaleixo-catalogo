import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SaleNotification, CompanyId } from '../types';
import { generateRandomNotification } from '../services/saleNotificationService';

interface CustomerSocialProofToastProps {
  currentCompany: CompanyId | null;
}

export const CustomerSocialProofToast: React.FC<CustomerSocialProofToastProps> = ({ currentCompany }) => {
  const [notification, setNotification] = useState<SaleNotification | null>(null);
  const seenSaleIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Simple elegant iOS sound chime
  const playNotificationChime = () => {
    if (document.hidden) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;
      
      const playSineTone = (freq: number, start: number, duration: number, volume: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };

      // Elegant Apple-like double ping
      playSineTone(1046.50, now, 0.3, 0.03); // C6
      playSineTone(1318.51, now + 0.08, 0.4, 0.02); // E6
    } catch (e) {
      console.warn('Audio context not supported', e);
    }
  };

  // Set up the isolated client-side notification simulation cycle
  useEffect(() => {
    const triggerNextSocialProof = () => {
      // Choose an active company or fallback to random brand if on general home page
      const targetCompany: CompanyId = currentCompany || 
        (['pallyra', 'guennita', 'mimada', 'tuttymimo'][Math.floor(Math.random() * 4)] as CompanyId);

      const mockData = generateRandomNotification(targetCompany);
      if (mockData) {
        if (!seenSaleIds.current.has(mockData.id)) {
          seenSaleIds.current.add(mockData.id);
          setNotification(mockData);
          playNotificationChime();

          // Hide notification after 5.5 seconds
          setTimeout(() => {
            setNotification(null);
          }, 5500);
        }
      }

      // Schedule next notification in 20 to 45 seconds (perfect natural flow)
      const nextDelay = Math.random() * 25000 + 20000;
      timerRef.current = setTimeout(triggerNextSocialProof, nextDelay);
    };

    // Trigger the initial toast after 10 seconds of entering the page
    const initialDelay = 10000;
    timerRef.current = setTimeout(triggerNextSocialProof, initialDelay);

    // Look for owner's recent purchase (to display as self congratulations toast upon returning to home)
    const checkOwnPurchase = () => {
      try {
        const stored = localStorage.getItem('pending_own_purchase_notification');
        if (stored) {
          const ownPurchase = JSON.parse(stored);
          if (ownPurchase && ownPurchase.id) {
            localStorage.removeItem('pending_own_purchase_notification');

            // Trigger immediately for visual confirmation of client purchase
            setTimeout(() => {
              const ownNotification: SaleNotification = {
                id: ownPurchase.id,
                customerName: ownPurchase.customerName,
                productName: ownPurchase.productName,
                timeAgo: ownPurchase.location ? `há 1 segundo em ${ownPurchase.location}` : 'há 1 segundo em São Paulo - SP',
                companyId: ownPurchase.companyId || 'pallyra'
              };
              setNotification(ownNotification);
              playNotificationChime();
              setTimeout(() => setNotification(null), 6000);
            }, 1500);
          }
        }
      } catch (err) {
        console.error('Error reading pending client purchase', err);
      }
    };

    checkOwnPurchase();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentCompany]);

  // Parse location and time string gracefully
  const parsedTime = React.useMemo(() => {
    if (!notification) return { time: "agora mesmo", location: "São Paulo - SP" };
    const parts = notification.timeAgo.split(' em ');
    if (parts.length >= 2) {
      return {
        time: parts[0],
        location: parts[1]
      };
    }
    return {
      time: notification.timeAgo,
      location: "São Paulo - SP"
    };
  }, [notification]);

  return (
    <div id="customer-social-proof-toast-portal" className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200000] pointer-events-none w-full max-w-sm px-4">
      <AnimatePresence>
        {notification && (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ 
              opacity: 0, 
              y: 16, 
              scale: 0.97,
              transition: { duration: 0.4, ease: "easeIn" }
            }}
            transition={{
              type: "spring",
              stiffness: 120,
              damping: 22
            }}
            className="relative w-full"
          >
            {/* Elegant Ambient Soft Bloom Glow behind the Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, filter: "blur(18px)" }}
              animate={{ 
                opacity: [0.45, 0.85, 0.6, 0.85, 0.45], 
                scale: [0.96, 1.04, 0.98, 1.04, 0.96],
                filter: ["blur(18px)", "blur(24px)", "blur(20px)", "blur(24px)", "blur(18px)"],
              }}
              exit={{ 
                opacity: 0, 
                scale: 1.25, 
                filter: "blur(48px)",
                transition: { duration: 0.8, ease: "easeOut" } 
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-5 -z-10 rounded-[36px] pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(212, 175, 55, 0.35) 0%, rgba(212, 175, 55, 0.08) 50%, rgba(255, 255, 255, 0) 80%)'
              }}
            />

            {/* Micro-breathing animated iOS style glass card */}
            <motion.div
              animate={{ scale: [1, 1.008, 1] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="pointer-events-auto w-full bg-white/80 backdrop-blur-xl rounded-[22px] p-4 border border-white/60 shadow-[0_12px_40px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.01)] flex items-start gap-4 select-none"
            >
              {/* Discrete heart badge/icon */}
              <div className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#F2F2F7] flex items-center justify-center shrink-0 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]">
                <span className="text-xs">❤️</span>
              </div>

              {/* Text Layout */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[13px] text-[#1C1C1E] tracking-tight">
                    {notification.customerName}
                  </span>
                </div>
                <p className="text-xs text-[#2C2C2E] mt-0.5 leading-snug">
                  comprou <span className="font-semibold text-[#1C1C1E] underline decoration-[#CCA062]/20 underline-offset-2">{notification.productName}</span>
                </p>
                <p className="text-[10px] text-[#8E8E93] mt-1.5 flex items-center gap-1.5 font-medium tracking-tight">
                  <span className="text-[#3A3A3C]">{parsedTime.location}</span>
                  <span className="text-gray-300">•</span>
                  <span>{parsedTime.time}</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
