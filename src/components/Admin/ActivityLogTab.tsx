import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { safeFormat } from '../../lib/dateUtils';
import { 
  Activity, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  RefreshCw,
  PlusCircle,
  Clock,
  User,
  Box,
  FileText,
  CheckCircle2,
  Calendar,
  ChevronRight,
  Hash,
  ShoppingBag,
  Zap,
  Tag,
  Settings,
  DollarSign,
  History as HistoryIcon
} from 'lucide-react';
import { ActivityLog } from '../../types';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

export const ActivityLogTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [activeRange, setActiveRange] = useState<'hoje' | 'semana' | 'mes' | 'todos'>('todos');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'activity_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(150));
      const snapshot = await getDocs(q);
      
      const fetchedLogs: ActivityLog[] = [];
      snapshot.forEach(doc => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      
      if (fetchedLogs.length === 0) {
        // Injecting Premium Mock Data if empty
        const now = new Date();
        const dummyLogs: ActivityLog[] = [
          {
            id: 'm1',
            actionType: 'atualizado',
            entityType: 'Pedido',
            entityName: '#MS-9921',
            userId: 'u1',
            userName: 'Julia Aleixo',
            timestamp: new Date(now.getTime() - 1000 * 60 * 15),
            module: 'Expedição',
            details: 'Status alterado para "Enviado" e código de rastreio adicionado.'
          },
          {
            id: 'm2',
            actionType: 'criado',
            entityType: 'Produto',
            entityName: 'Agenda 2027 Premium',
            userId: 'u1',
            userName: 'Julia Aleixo',
            timestamp: new Date(now.getTime() - 1000 * 60 * 120),
            module: 'Catálogo',
            details: 'Novo produto cadastrado com 12 variações de capa.'
          },
          {
            id: 'm3',
            actionType: 'aprovado',
            entityType: 'Pedido',
            entityName: '#MS-9915',
            userId: 'u2',
            userName: 'Admin Vitrine',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5),
            module: 'Vendas',
            details: 'Pagamento via PIX confirmado automaticamente.'
          },
          {
            id: 'm4',
            actionType: 'editado',
            entityType: 'Cliente',
            entityName: 'Roberto Silva',
            userId: 'u1',
            userName: 'Julia Aleixo',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24),
            module: 'CRM',
            details: 'Endereço de entrega atualizado conforme solicitação via WhatsApp.'
          },
          {
            id: 'm5',
            actionType: 'cadastrado',
            entityType: 'Insumo',
            entityName: 'Papel Fotográfico 180g',
            userId: 'u3',
            userName: 'Produção Central',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 48),
            module: 'Produção',
            details: 'Entrada de estoque: 500 folhas.'
          }
        ];
        setLogs(dummyLogs);
      } else {
        setLogs(fetchedLogs);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchEntity = log.entityName.toLowerCase().includes(term);
        const matchUser = log.userName?.toLowerCase().includes(term);
        const matchDetails = log.details?.toLowerCase().includes(term);
        const matchModule = log.module?.toLowerCase().includes(term);
        if (!matchEntity && !matchUser && !matchDetails && !matchModule) return false;
      }

      // Range filter
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      const now = new Date();
      if (activeRange === 'hoje') {
        if (!isAfter(logDate, startOfDay(now))) return false;
      } else if (activeRange === 'semana') {
        if (!isAfter(logDate, startOfWeek(now))) return false;
      } else if (activeRange === 'mes') {
        if (!isAfter(logDate, startOfMonth(now))) return false;
      }

      return true;
    });
  }, [logs, searchTerm, activeRange]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Produto': return <Box size={14} />;
      case 'Pedido': return <ShoppingBag size={14} />;
      case 'Cliente': return <User size={14} />;
      case 'Insumo': return <Zap size={14} />;
      case 'Campanha': return <Zap size={14} />;
      case 'Financeiro': return <DollarSign size={14} />;
      case 'Configuração': return <Settings size={14} />;
      case 'Cupom': return <Tag size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'criado':
      case 'cadastrado': return 'bg-emerald-500';
      case 'editado':
      case 'atualizado': return 'bg-amber-500';
      case 'aprovado':
      case 'finalizado': return 'bg-sky-500';
      case 'excluido': return 'bg-rose-500';
      default: return 'bg-[#1C1C1E]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#1C1C1E] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
              <HistoryIcon size={20} strokeWidth={1.5} />
            </div>
            Histórico de Atividades
          </h2>
          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2 ml-13">
            Rastreabilidade e auditoria de ações do sistema
          </p>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por usuário, pedido, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#1C1C1E]/5 outline-none transition-all placeholder:text-[#AEAEB2] shadow-sm"
            />
          </div>
          <button 
            onClick={fetchLogs}
            className="p-3.5 bg-white border border-[#E5E5EA] rounded-2xl text-[#1C1C1E] hover:bg-[#F5F5F7] transition-all shadow-sm active:scale-95"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'todos', label: 'Tudo', icon: Activity },
          { id: 'hoje', label: 'Hoje', icon: Clock },
          { id: 'semana', label: 'Esta Semana', icon: Calendar },
          { id: 'mes', label: 'Este Mês', icon: Calendar },
        ].map((range) => (
          <button
            key={range.id}
            onClick={() => setActiveRange(range.id as any)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] whitespace-nowrap transition-all border ${
              activeRange === range.id 
                ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]' 
                : 'bg-white border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20 active:scale-95'
            }`}
          >
            <range.icon size={13} strokeWidth={activeRange === range.id ? 2.5 : 2} />
            {range.label}
          </button>
        ))}
      </div>

      {/* Timeline Container */}
      <div className="bg-white border border-[#E5E5EA] rounded-[3rem] p-8 md:p-12 shadow-sm relative overflow-hidden">
        {/* Background Mesh Effect */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F5F5F7]/30 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <RefreshCw size={40} className="animate-spin text-[#1C1C1E] mb-4" />
            <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Carregando eventos...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="relative">
            {/* The Vertical Line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-[2px] bg-[#F5F5F7]" />

            <div className="space-y-12">
              <AnimatePresence mode="popLayout">
                {filteredLogs.map((log, idx) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  return (
                    <motion.div
                      layout
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="relative pl-14 group"
                    >
                      {/* LED Node */}
                      <div className={`absolute left-0 top-1.5 w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center z-10 transition-all group-hover:scale-110 group-hover:shadow-md`}>
                        <div className={`w-3 h-3 rounded-full ${getActionColor(log.actionType)} shadow-[0_0_10px_rgba(0,0,0,0.1)] animate-pulse`} />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">
                              {log.actionType}
                            </span>
                            <div className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#F5F5F7] rounded-full text-[9px] font-bold text-[#8E8E93] uppercase tracking-wide border border-[#E5E5EA]/50">
                              {getEntityIcon(log.entityType)}
                              {log.entityType}
                            </div>
                            {log.module && (
                              <div className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-black uppercase tracking-wide border border-indigo-100/50">
                                {log.module}
                              </div>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-[#1C1C1E] tracking-tight group-hover:text-indigo-600 transition-colors">
                            {log.entityName}
                          </h4>

                          {log.details && (
                            <p className="text-[11px] font-medium text-[#8E8E93] leading-relaxed max-w-2xl bg-[#F5F5F7]/50 p-3 rounded-2xl border border-[#E5E5EA]/30 group-hover:bg-white group-hover:border-[#E5E5EA] transition-all">
                              {log.details}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#1C1C1E]">
                            <User size={12} className="text-[#8E8E93]" />
                            {log.userName || log.userId}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-[#8E8E93]">
                            <Clock size={12} />
                            {safeFormat(logDate, "dd/MM/yyyy 'às' HH:mm")}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] mb-6">
              <Search size={32} strokeWidth={1} />
            </div>
            <h3 className="text-sm font-black text-[#1C1C1E] uppercase tracking-widest mb-2">Sem registros encontrados</h3>
            <p className="text-[11px] font-medium text-[#8E8E93] max-w-xs leading-relaxed">
              Não encontramos nenhum evento no histórico que corresponda aos filtros aplicados no momento.
            </p>
          </div>
        )}
      </div>

      {/* Preparation for future integrations footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm opacity-60">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93]">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-[#8E8E93] tracking-widest">Integração</p>
            <p className="text-xs font-bold text-[#1C1C1E]">Monitoramento Real-time</p>
          </div>
        </div>
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm opacity-60">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93]">
            <Settings size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-[#8E8E93] tracking-widest">Sistema</p>
            <p className="text-xs font-bold text-[#1C1C1E]">Auditoria Completa</p>
          </div>
        </div>
        <div className="bg-white border border-[#E5E5EA] p-6 rounded-[2rem] flex items-center gap-4 shadow-sm opacity-60">
          <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93]">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[9px] font-black uppercase text-[#8E8E93] tracking-widest">Logs</p>
            <p className="text-xs font-bold text-[#1C1C1E]">Rastreio Financeiro</p>
          </div>
        </div>
      </div>
    </div>
  );
};
