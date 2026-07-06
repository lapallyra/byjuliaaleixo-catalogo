import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Info, CheckCircle2 } from 'lucide-react';
import { subscribeToAllSettings } from '../services/firebaseService';
import { SiteSettings } from '../types';
import { useAdminOrchestrator } from './AdminOrchestratorSystem';

export const AdminNotificationPortal: React.FC = () => {
  const orchestrator = useAdminOrchestrator();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, SiteSettings>>({});
  const lastProcessedEventId = useRef<string | null>(null);

  useEffect(() => {
    // Subscribe to settings for colors and design styling
    const unsubSettings = subscribeToAllSettings((data) => {
      setSiteSettings(data);
    });

    return () => {
      unsubSettings();
    };
  }, []);

  // Listen to the central Orchestrator System events
  useEffect(() => {
    const latest = orchestrator.latestEvent;
    if (!latest || latest.id === lastProcessedEventId.current) return;
    lastProcessedEventId.current = latest.id;

    // Map Event type to styling
    const settings = siteSettings[latest.companyId];
    const accentColor = settings?.theme_accent_color || '#FF007F';
    const id = `notif-${latest.id}`;

    let newNotif: any = null;

    if (latest.type === 'REAL_SALE') {
      newNotif = {
        id,
        type: 'sale',
        title: 'Venda Realizada!',
        message: `${latest.customerName} acabou de comprar: ${latest.productName}`,
        icon: ShoppingCart,
        color: '#10B981', // Emerald green for real sales
        companyId: latest.companyId,
        time: 'Agora'
      };
    } else if (latest.type === 'NEW_ORDER') {
      newNotif = {
        id,
        type: 'order',
        title: 'Novo Pedido!',
        message: `Novo pedido recebido: ${latest.customerName}`,
        icon: ShoppingCart,
        color: '#3B82F6', // Blue for new orders
        companyId: latest.companyId,
        time: 'Agora'
      };
    } else if (latest.type === 'STATUS_UPDATE') {
      newNotif = {
        id,
        type: 'status',
        title: 'Status Atualizado',
        message: latest.message,
        icon: CheckCircle2,
        color: '#10B981', // Green for status updates
        companyId: latest.companyId,
        time: 'Agora'
      };
    } else if (latest.type === 'SECONDARY_EFFECT') {
      newNotif = {
        id,
        type: 'info',
        title: 'Atualização',
        message: latest.message,
        icon: Info,
        color: '#6B7280', // Gray for generic info
        companyId: latest.companyId,
        time: 'Agora'
      };
    } else if (latest.type === 'FEEDBACK') {
      newNotif = {
        id,
        type: 'feedback',
        title: latest.data?.title || 'Aviso',
        message: latest.message,
        icon: latest.data?.success ? CheckCircle2 : Info,
        color: latest.data?.success ? '#10B981' : '#F59E0B',
        companyId: latest.companyId,
        time: 'Agora'
      };
    }

    if (newNotif) {
      setNotifications(prev => [newNotif, ...prev].slice(0, 3));
      
      // Play high-pitched crystal "plim" sound for sales and orders
      if (newNotif.type === 'sale' || newNotif.type === 'order') {
        try {
          const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioCtx = new AudioContext();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1567.98, audioCtx.currentTime); // G6
            gain.gain.setValueAtTime(0, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 1.5);
          }
        } catch (e) {
          console.warn('Audio feedback failed', e);
        }
      }

      // Automatic removal duration scales down in performance/focus mode
      const displayDuration = orchestrator.performanceMode ? 4000 : 8000;
      setTimeout(() => removeNotification(id), displayDuration);
    }
  }, [orchestrator.latestEvent, siteSettings, orchestrator.performanceMode]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 w-full max-w-[320px] pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="pointer-events-auto bg-[#140b0e]/95 backdrop-blur-xl border border-rose-900/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start gap-3 relative overflow-hidden group"
          >
            {/* Minimal Progress Bar (Disabled in performance mode to preserve CPU cycles) */}
            {!orchestrator.performanceMode && (
              <motion.div 
                className="absolute bottom-0 left-0 h-0.5"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 8, ease: "linear" }}
                style={{ backgroundColor: n.color }}
              />
            )}

            <div 
              className="p-2.5 rounded-xl shrink-0 border border-current shadow-inner"
              style={{ backgroundColor: `${n.color}15`, color: n.color }}
            >
              <n.icon size={18} />
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[8px] font-black uppercase tracking-[0.15em] opacity-80" style={{ color: n.color }}>{n.title}</span>
                <span className="text-[8px] font-bold text-rose-300 capitalize">{n.time}</span>
              </div>
              <p className="text-[10px] font-bold text-rose-50 leading-tight">
                {n.message}
              </p>
            </div>

            <button 
              onClick={() => removeNotification(n.id)}
              className="absolute top-3 right-3 p-1 rounded-full text-rose-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
