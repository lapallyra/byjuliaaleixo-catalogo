import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Info, CheckCircle2, AlertTriangle, UserPlus, CreditCard, Sparkles, RefreshCw } from 'lucide-react';
import { subscribeToAllSettings } from '../services/firebaseService';
import { SiteSettings } from '../types';
import { useAdminOrchestrator } from './AdminOrchestratorSystem';
import { eventBus, ERPEventType, ERPEventPayloads } from '../services/eventBus';

interface GlassToast {
  id: string;
  type: 'success' | 'alert' | 'info' | 'error';
  title: string;
  message: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  time: string;
}

export const AdminNotificationPortal: React.FC = () => {
  const orchestrator = useAdminOrchestrator();
  const [toasts, setToasts] = useState<GlassToast[]>([]);
  const [siteSettings, setSiteSettings] = useState<Record<string, SiteSettings>>({});
  const lastProcessedEventId = useRef<string | null>(null);

  useEffect(() => {
    // Subscribe to settings for design references if needed
    const unsubSettings = subscribeToAllSettings((data) => {
      setSiteSettings(data);
    });
    return () => {
      unsubSettings();
    };
  }, []);

  // Helpers to add toasts
  const addToast = (toast: Omit<GlassToast, 'id' | 'time'>) => {
    const id = `toast-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: GlassToast = {
      ...toast,
      id,
      time: 'Agora mesmo'
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // 1. Subscribe to ERP advanced Event Engine
  useEffect(() => {
    const unsubCreated = eventBus.on('ORDER_CREATED', ({ order }) => {
      const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total);
      addToast({
        type: 'success',
        title: 'Novo Pedido Recebido',
        message: `Código: ${order.code || 'S/N'} • Cliente: ${order.customerName} • Total: ${totalFormatted}`,
        icon: ShoppingCart,
        color: '#10B981', // green
        bgColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        glowColor: 'rgba(16, 185, 129, 0.4)',
      });
    });

    const unsubPaid = eventBus.on('ORDER_PAID', ({ order }) => {
      addToast({
        type: 'success',
        title: 'Pagamento Confirmado',
        message: `O pedido ${order.code || ''} de ${order.customerName} foi pago com sucesso!`,
        icon: CreditCard,
        color: '#10B981', // green
        bgColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        glowColor: 'rgba(16, 185, 129, 0.4)',
      });
    });

    const unsubUpdated = eventBus.on('ORDER_UPDATED', ({ order }) => {
      addToast({
        type: 'info',
        title: 'Status do Pedido Atualizado',
        message: `Pedido ${order.code || ''} alterado para status "${order.status || 'atualizado'}"`,
        icon: RefreshCw,
        color: '#3B82F6', // blue
        bgColor: 'rgba(59, 130, 246, 0.08)',
        borderColor: 'rgba(59, 130, 246, 0.25)',
        glowColor: 'rgba(59, 130, 246, 0.4)',
      });
    });

    const unsubStock = eventBus.on('STOCK_LOW', ({ product, currentStock }) => {
      addToast({
        type: 'alert',
        title: 'Estoque Crítico Alerta',
        message: `O produto "${product.product_name}" está com apenas ${currentStock} unidades em estoque!`,
        icon: AlertTriangle,
        color: '#F59E0B', // yellow
        bgColor: 'rgba(245, 158, 11, 0.08)',
        borderColor: 'rgba(245, 158, 11, 0.25)',
        glowColor: 'rgba(245, 158, 11, 0.4)',
      });
    });

    const unsubClient = eventBus.on('CLIENT_CREATED', ({ customer }) => {
      addToast({
        type: 'success',
        title: 'Novo Cliente Registrado',
        message: `O cliente ${customer.name} foi cadastrado no sistema com sucesso.`,
        icon: UserPlus,
        color: '#10B981', // green
        bgColor: 'rgba(16, 185, 129, 0.08)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        glowColor: 'rgba(16, 185, 129, 0.4)',
      });
    });

    return () => {
      unsubCreated();
      unsubPaid();
      unsubUpdated();
      unsubStock();
      unsubClient();
    };
  }, []);

  // 2. Backward compatibility: Listen to legacy AdminOrchestrator events if any
  useEffect(() => {
    const latest = orchestrator.latestEvent;
    if (!latest || latest.id === lastProcessedEventId.current) return;
    lastProcessedEventId.current = latest.id;

    // Filter out duplicate triggers from legacy system if we already mapped them
    if (latest.type === 'REAL_SALE' || latest.type === 'NEW_ORDER') {
      return; 
    }

    let type: GlassToast['type'] = 'info';
    let title = 'Atualização do Sistema';
    let icon = Info;
    let color = '#3B82F6';
    let bgColor = 'rgba(59, 130, 246, 0.08)';
    let borderColor = 'rgba(59, 130, 246, 0.25)';
    let glowColor = 'rgba(59, 130, 246, 0.4)';

    if (latest.type === 'STATUS_UPDATE') {
      type = 'success';
      title = 'Status Alterado';
      icon = CheckCircle2;
      color = '#10B981';
      bgColor = 'rgba(16, 185, 129, 0.08)';
      borderColor = 'rgba(16, 185, 129, 0.25)';
      glowColor = 'rgba(16, 185, 129, 0.4)';
    } else if (latest.type === 'FEEDBACK') {
      const isSuccess = latest.data?.success;
      type = isSuccess ? 'success' : 'alert';
      title = latest.data?.title || 'Notificação';
      icon = isSuccess ? CheckCircle2 : AlertTriangle;
      color = isSuccess ? '#10B981' : '#F59E0B';
      bgColor = isSuccess ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)';
      borderColor = isSuccess ? 'rgba(16, 185, 129, 0.25)' : 'rgba(245, 158, 11, 0.25)';
      glowColor = isSuccess ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)';
    }

    addToast({
      type,
      title,
      message: latest.message,
      icon,
      color,
      bgColor,
      borderColor,
      glowColor
    });
  }, [orchestrator.latestEvent]);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3.5 w-full max-w-[360px] pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -25, scale: 0.9, filter: 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, x: 40, scale: 0.92, filter: 'blur(6px)' }}
            transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            className="pointer-events-auto relative overflow-hidden flex items-start gap-3.5 p-4.5 rounded-2xl bg-white/70 dark:bg-zinc-950/75 backdrop-blur-xl border border-white/30 dark:border-zinc-900/30 shadow-[0_15px_35px_rgba(0,0,0,0.12)] border-t-white/50 dark:border-t-zinc-800/40 select-none group"
            style={{
              boxShadow: `0 15px 35px rgba(0, 0, 0, 0.08), 0 0 15px ${t.glowColor}`
            }}
          >
            {/* Linear Glow Line */}
            <div 
              className="absolute top-0 left-0 right-0 h-[2px] transition-opacity duration-300 group-hover:opacity-100" 
              style={{ backgroundColor: t.color }}
            />

            {/* Glowing Accent Ring on Icon */}
            <div 
              className="p-3 rounded-xl shrink-0 border flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{ 
                backgroundColor: t.bgColor, 
                borderColor: t.borderColor,
                color: t.color,
                boxShadow: `inset 0 0 10px ${t.bgColor}`
              }}
            >
              <t.icon size={20} className="stroke-[2.2]" />
            </div>

            {/* Content block */}
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: t.color }}>
                  {t.title}
                </span>
                <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500">
                  {t.time}
                </span>
              </div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-150 leading-relaxed">
                {t.message}
              </p>
            </div>

            {/* Close Button */}
            <button 
              onClick={() => removeToast(t.id)}
              className="absolute top-3 right-3 p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-200 cursor-pointer"
            >
              <X size={14} className="stroke-[2.5]" />
            </button>

            {/* Animated Progress Bar */}
            <motion.div 
              className="absolute bottom-0 left-0 h-[3px]"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
              style={{ backgroundColor: t.color }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

