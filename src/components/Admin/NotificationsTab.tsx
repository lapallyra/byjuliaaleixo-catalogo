import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  CheckCircle2, 
  ShoppingCart, 
  Box, 
  DollarSign, 
  Settings, 
  AlertCircle,
  Search,
  Check,
  ChevronRight,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';

export interface AppNotification {
  id: string;
  type: 'pedido' | 'producao' | 'financeiro' | 'sistema';
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
}

export const NotificationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'todas' | 'nao-lidas' | 'pedido' | 'producao' | 'financeiro' | 'sistema'>('todas');
  
  // Dummy data for now
  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'n1',
      type: 'pedido',
      title: 'Novo pedido recebido',
      description: 'O cliente João Silva acabou de realizar o pedido #MS-8910 no valor de R$ 150,00.',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false
    },
    {
      id: 'n2',
      type: 'financeiro',
      title: 'Pagamento aprovado',
      description: 'O pagamento via PIX do pedido #MS-8905 foi confirmado.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      read: false
    },
    {
      id: 'n3',
      type: 'producao',
      title: 'Estoque baixo',
      description: 'O insumo "Papel Fotográfico 180g" atingiu o limite mínimo de estoque (10 unidades restantes).',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      read: true
    },
    {
      id: 'n4',
      type: 'sistema',
      title: 'Atualização do Sistema',
      description: 'Nova versão da plataforma instalada com sucesso. Confira as novidades no painel.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
      read: true
    },
    {
      id: 'n5',
      type: 'pedido',
      title: 'Pedido cancelado',
      description: 'O pedido #MS-8890 foi cancelado por falta de pagamento (boleto vencido).',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
      read: true
    }
  ]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        if (!notif.title.toLowerCase().includes(term) && !notif.description.toLowerCase().includes(term)) {
          return false;
        }
      }
      
      // Filter
      if (activeFilter === 'nao-lidas') return !notif.read;
      if (activeFilter === 'pedido') return notif.type === 'pedido';
      if (activeFilter === 'producao') return notif.type === 'producao';
      if (activeFilter === 'financeiro') return notif.type === 'financeiro';
      if (activeFilter === 'sistema') return notif.type === 'sistema';
      
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, searchTerm, activeFilter]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pedido': return <ShoppingCart size={18} />;
      case 'producao': return <Box size={18} />;
      case 'financeiro': return <DollarSign size={18} />;
      case 'sistema': return <Settings size={18} />;
      default: return <AlertCircle size={18} />;
    }
  };

  const getNotificationColor = (type: string, read: boolean) => {
    if (read) return 'text-[#8E8E93] bg-[#F5F5F7] border-[#E5E5EA]';
    switch (type) {
      case 'pedido': return 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.15)]';
      case 'producao': return 'text-amber-600 bg-amber-50 border-amber-100 shadow-[0_0_15px_rgba(217,119,6,0.15)]';
      case 'financeiro': return 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.15)]';
      case 'sistema': return 'text-sky-600 bg-sky-50 border-sky-100 shadow-[0_0_15px_rgba(2,132,199,0.15)]';
      default: return 'text-[#1C1C1E] bg-white border-[#E5E5EA]';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#1C1C1E] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E] relative">
              <Bell size={20} strokeWidth={1.5} />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E] animate-pulse" />
              )}
            </div>
            Central de Notificações
          </h2>
          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2 ml-13">
            Avisos importantes e atualizações da Vitrine
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar notificações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#1C1C1E]/5 outline-none transition-all placeholder:text-[#AEAEB2] shadow-sm"
            />
          </div>
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className={`p-3.5 rounded-2xl border transition-all shadow-sm active:scale-95 flex items-center gap-2 whitespace-nowrap ${
              unreadCount > 0 
              ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white hover:bg-black' 
              : 'bg-white border-[#E5E5EA] text-[#AEAEB2] cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={18} />
            <span className="hidden md:block text-[10px] font-black uppercase tracking-widest">Marcar tudo como lido</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'todas', label: 'Todas' },
          { id: 'nao-lidas', label: 'Não Lidas' },
          { id: 'pedido', label: 'Pedidos' },
          { id: 'producao', label: 'Produção' },
          { id: 'financeiro', label: 'Financeiro' },
          { id: 'sistema', label: 'Sistema' },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border ${
              activeFilter === filter.id 
                ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]' 
                : 'bg-white border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20 active:scale-95'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="bg-white border border-[#E5E5EA] rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Background Mesh Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5F5F7]/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        
        {filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredNotifications.map((notif, idx) => (
                <motion.div
                  layout
                  key={notif.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group relative flex flex-col md:flex-row gap-5 p-6 rounded-[2rem] border transition-all ${
                    notif.read ? 'bg-[#F5F5F7]/50 border-[#E5E5EA]/50' : 'bg-white border-[#E5E5EA] shadow-[0_8px_30px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  {/* Indicator Line */}
                  {!notif.read && (
                    <div className="absolute left-0 top-6 bottom-6 w-1 rounded-r-full bg-rose-500" />
                  )}

                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${getNotificationColor(notif.type, notif.read)}`}>
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                          notif.read 
                            ? 'bg-white border-[#E5E5EA] text-[#8E8E93]' 
                            : 'bg-[#1C1C1E] border-[#1C1C1E] text-white'
                        }`}>
                          {notif.type}
                        </span>
                        {!notif.read && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                            Nova
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-[#8E8E93] shrink-0">
                        {format(notif.timestamp, "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    </div>

                    <h4 className={`text-sm tracking-tight transition-colors ${
                      notif.read ? 'font-bold text-[#8E8E93]' : 'font-black text-[#1C1C1E] group-hover:text-indigo-600'
                    }`}>
                      {notif.title}
                    </h4>

                    <p className={`text-[11px] leading-relaxed max-w-3xl ${
                      notif.read ? 'font-medium text-[#AEAEB2]' : 'font-bold text-[#8E8E93]'
                    }`}>
                      {notif.description}
                    </p>
                  </div>

                  {!notif.read && (
                    <div className="flex items-center justify-end md:justify-center md:pl-4 border-t md:border-t-0 md:border-l border-[#E5E5EA]/50 pt-4 md:pt-0 mt-4 md:mt-0 shrink-0">
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="p-3 bg-white border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-95"
                        title="Marcar como lida"
                      >
                        <Check size={18} />
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] mb-6">
              <Bell size={32} strokeWidth={1} />
            </div>
            <h3 className="text-sm font-black text-[#1C1C1E] uppercase tracking-widest mb-2">Tudo limpo por aqui</h3>
            <p className="text-[11px] font-medium text-[#8E8E93] max-w-xs leading-relaxed">
              Você não possui notificações no momento. Quando algo importante acontecer, aparecerá aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
