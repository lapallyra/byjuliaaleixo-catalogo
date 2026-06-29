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
  FileText
} from 'lucide-react';

export interface ActivityLog {
  id: string;
  actionType: 'criado' | 'editado' | 'atualizado' | 'excluído';
  entityType: string;
  entityName: string;
  userId: string;
  userName?: string;
  timestamp: any;
  details?: string;
}

export const ActivityLogTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('todos');
  const [filterDateStart, setFilterDateStart] = useState<string>('');
  const [filterDateEnd, setFilterDateEnd] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const logsRef = collection(db, 'activity_logs');
      const q = query(logsRef, orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      const fetchedLogs: ActivityLog[] = [];
      snapshot.forEach(doc => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ActivityLog);
      });
      
      // If no logs, let's inject some dummy ones just for demonstration of the UI
      if (fetchedLogs.length === 0) {
        const dummyLogs: ActivityLog[] = [
          {
            id: 'mock1',
            actionType: 'editado',
            entityType: 'Produto',
            entityName: 'Caneca Personalizada',
            userId: 'admin',
            userName: 'Julia Aleixo',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
            details: 'Alteração de preço de R$45 para R$50'
          },
          {
            id: 'mock2',
            actionType: 'excluído',
            entityType: 'Insumo',
            entityName: 'Fita de Cetim Rosa',
            userId: 'admin',
            userName: 'Julia Aleixo',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            details: 'Insumo removido do sistema'
          },
          {
            id: 'mock3',
            actionType: 'atualizado',
            entityType: 'Pedido',
            entityName: '#PED-9921',
            userId: 'admin',
            userName: 'Julia Aleixo',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            details: 'Status alterado para "Enviado"'
          },
          {
            id: 'mock4',
            actionType: 'criado',
            entityType: 'Produto',
            entityName: 'Agenda 2027',
            userId: 'admin',
            userName: 'Julia Aleixo',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
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
      // Search term filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchName = log.entityName.toLowerCase().includes(term);
        const matchType = log.entityType.toLowerCase().includes(term);
        const matchUser = log.userName?.toLowerCase().includes(term);
        if (!matchName && !matchType && !matchUser) return false;
      }

      // Action type filter
      if (filterAction !== 'todos' && log.actionType !== filterAction) {
        return false;
      }

      // Date filter
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
      if (filterDateStart) {
        const start = new Date(filterDateStart + 'T00:00:00');
        if (logDate < start) return false;
      }
      if (filterDateEnd) {
        const end = new Date(filterDateEnd + 'T23:59:59');
        if (logDate > end) return false;
      }

      return true;
    });
  }, [logs, searchTerm, filterAction, filterDateStart, filterDateEnd]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'criado': return <PlusCircle size={16} className="text-emerald-500" />;
      case 'editado': return <Edit2 size={16} className="text-amber-500" />;
      case 'atualizado': return <RefreshCw size={16} className="text-blue-500" />;
      case 'excluído': return <Trash2 size={16} className="text-rose-500" />;
      default: return <Activity size={16} className="text-slate-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'criado': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'editado': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'atualizado': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'excluído': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-[#F5F5F7] text-[#1C1C1E] space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/70 backdrop-blur-md border border-[#E5E5EA] p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-xl font-medium text-slate-900 tracking-normal flex items-center gap-2">
            <Activity size={24} className="text-[#1C1C1E]" />
            Logs de Atividades
          </h2>
          <p className="text-xs font-bold text-[#8E8E93] tracking-normal mt-1">
            Auditoria de ações realizadas no painel administrativo
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E5EA] rounded-xl text-[10px] font-medium uppercase tracking-wider text-[#8E8E93] hover:text-[#1C1C1E] transition-all shadow-sm"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-[#8E8E93] mb-2">
          <Filter size={16} />
          <span className="text-[10px] font-medium tracking-normal">Filtros de Busca</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#D1D1D6]" size={14} />
            <input
              type="text"
              placeholder="Buscar entidade ou usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-9 pr-4 py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E]"
            />
          </div>

          <div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E] cursor-pointer"
            >
              <option value="todos">Todas as Ações</option>
              <option value="criado">Criado</option>
              <option value="editado">Editado</option>
              <option value="atualizado">Atualizado</option>
              <option value="excluído">Excluído</option>
            </select>
          </div>

          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase text-[#8E8E93] mb-1 ml-1">Data Inicial</span>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E]"
            />
          </div>

          <div className="flex flex-col">
            <span className="text-[8px] font-bold uppercase text-[#8E8E93] mb-1 ml-1">Data Final</span>
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E]"
            />
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F5F7] border-b border-[#E5E5EA] text-[9px] font-medium uppercase tracking-wider text-[#8E8E93]">
              <tr>
                <th className="px-6 py-4">Data e Hora</th>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Ação</th>
                <th className="px-6 py-4">Entidade</th>
                <th className="px-6 py-4">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA] font-semibold">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93] font-bold tracking-normal">
                    <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-[#1C1C1E]" />
                    Carregando logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  return (
                    <tr key={log.id} className="hover:bg-[#F5F5F7]/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Clock size={14} className="text-[#8E8E93]" />
                          {safeFormat(logDate, 'dd/MM/yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-slate-700">
                          <User size={14} className="text-[#8E8E93]" />
                          {log.userName || log.userId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-medium uppercase tracking-wider ${getActionColor(log.actionType)}`}>
                          {getActionIcon(log.actionType)}
                          {log.actionType}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#8E8E93] font-bold tracking-normal">{log.entityType}</span>
                          <span className="text-slate-900 font-semibold uppercase">{log.entityName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        {log.details ? (
                          <div className="flex items-start gap-2 text-[#1C1C1E] text-[11px] font-medium leading-relaxed bg-[#F5F5F7] p-2.5 rounded-xl border border-[#E5E5EA]/50">
                            <FileText size={14} className="text-[#8E8E93] mt-0.5 shrink-0" />
                            {log.details}
                          </div>
                        ) : (
                          <span className="text-[#D1D1D6] italic text-[10px]">- Sem detalhes adicionais -</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#8E8E93] font-bold tracking-normal">
                    <Box size={32} className="mx-auto mb-3 text-[#E5E5EA]" />
                    Nenhum log de atividade encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
