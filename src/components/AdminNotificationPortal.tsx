import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, X, ShoppingCart, Star, TrendingUp, User } from 'lucide-react';
import { subscribeToSales, subscribeToAllSettings } from '../services/firebaseService';
import { Order, SiteSettings } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const AdminNotificationPortal: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, SiteSettings>>({});
  const lastSalesCount = useRef<number>(-1);

  useEffect(() => {
    // 1. Subscribe to settings for colors
    const unsubSettings = subscribeToAllSettings((data) => {
      setSiteSettings(data);
    });

    // 2. Subscribe to Sales
    const unsubSales = subscribeToSales((sales: Order[]) => {
      // Sort by creation date
      const sorted = [...sales].sort((a,b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      if (lastSalesCount.current !== -1 && sales.length > lastSalesCount.current) {
        // New sale detected!
        const newSale = sorted[0];
        if (newSale) {
          const id = `sale-${Date.now()}`;
          const settings = siteSettings[newSale.companyId];
          
          const newNotif = {
            id,
            type: 'sale',
            title: 'Novo Pedido!',
            message: `${newSale.customerName} acabou de comprar: ${newSale.items?.[0]?.product_name || 'Produto'}`,
            icon: ShoppingCart,
            color: settings?.theme_accent_color || '#FF007F',
            companyId: newSale.companyId,
            time: 'Agora'
          };

          setNotifications(prev => [newNotif, ...prev].slice(0, 3));
          setTimeout(() => removeNotification(id), 8000);
        }
      }
      lastSalesCount.current = sales.length;
    });

    return () => {
      unsubSettings();
      unsubSales();
    };
  }, [siteSettings]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 w-full max-w-[320px] pointer-events-none">
      <AnimatePresence>
        {notifications.map((n) => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.9 }}
            className="pointer-events-auto bg-[#140b0e]/95 backdrop-blur-xl border border-rose-900/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-start gap-3 relative overflow-hidden group"
          >
            {/* Minimal Progress Bar */}
            <motion.div 
              className="absolute bottom-0 left-0 h-0.5"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 8, ease: "linear" }}
              style={{ backgroundColor: n.color }}
            />

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
