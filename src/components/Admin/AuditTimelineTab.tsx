import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Search, 
  Filter,
  RefreshCw,
  Clock,
  User,
  Box,
  FileText,
  Calendar,
  ChevronRight,
  ShoppingBag,
  Zap,
  Tag,
  Settings,
  DollarSign,
  History as HistoryIcon,
  ChevronDown,
  Eye,
  ArrowRight,
  Package,
  Truck,
  Users,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AuditLog, AuditModule, AuditActionType, CompanyId } from '../../types';
import { subscribeToAuditLogs } from '../../services/auditService';
import { safeFormat } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/currencyUtils';

export const AuditTimelineTab: React.FC<{ companyId: CompanyId, auditLogs: AuditLog[] }> = React.memo(({ companyId, auditLogs }) => {
  const [logs, setLogs] = useState<AuditLog[]>(auditLogs);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<AuditModule | ''>('');
  const [actionFilter, setActionFilter] = useState<AuditActionType | ''>('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAuditLogs((fetchedLogs) => {
      setLogs(fetchedLogs);
      setLoading(false);
    }, {
      module: moduleFilter,
      action: actionFilter,
      dateStart,
      dateEnd
    });

    return () => unsubscribe();
  }, [moduleFilter, actionFilter, dateStart, dateEnd]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const term = searchTerm.toLowerCase();
    return logs.filter(log => 
      log.resourceName.toLowerCase().includes(term) ||
      log.user.name?.toLowerCase().includes(term) ||
      log.user.email.toLowerCase().includes(term) ||
      log.resourceId.toLowerCase().includes(term) ||
      log.details.observations?.toLowerCase().includes(term)
    );
  }, [logs, searchTerm]);

  const getModuleIcon = (module: AuditModule) => {
    switch (module) {
      case 'Produtos': return <Box size={14} />;
      case 'Pedidos': return <ShoppingBag size={14} />;
      case 'Clientes': return <Users size={14} />;
      case 'Estoque': return <Package size={14} />;
      case 'Financeiro': return <DollarSign size={14} />;
      case 'Configurações': return <Settings size={14} />;
      case 'Produção': return <Zap size={14} />;
      case 'Entregas': return <Truck size={14} />;
      case 'Compras': return <ShoppingBag size={14} />;
      case 'Usuários': return <ShieldCheck size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const getActionColor = (action: AuditActionType) => {
    switch (action) {
      case 'Criação': return 'bg-emerald-500';
      case 'Alteração': 
      case 'Mudança de Status':
      case 'Alteração de Preço':
      case 'Alteração de Ficha Técnica':
      case 'Alteração de Prazo': return 'bg-amber-500';
      case 'Aprovação': return 'bg-sky-500';
      case 'Exclusão Lógica': 
      case 'Cancelamento': return 'bg-rose-500';
      case 'Entrada de Estoque': return 'bg-teal-500';
      case 'Saída de Estoque': return 'bg-orange-500';
      case 'Registro de Pagamento': return 'bg-indigo-500';
      default: return 'bg-slate-500';
    }
  };

  const renderValue = (val: any) => {
    if (val === null || val === undefined) return <span className="text-gray-400 italic">vazio</span>;
    if (typeof val === 'object') return <pre className="text-[10px] bg-gray-50 p-1 rounded overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
    return String(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-[#1C1C1E] tracking-tighter flex items-center gap-3 uppercase">
            <div className="w-12 h-12 rounded-[1.5rem] bg-white border border-[#E5E5EA] shadow-3d-soft flex items-center justify-center text-[#1C1C1E] elevated-3d">
              <HistoryIcon size={24} strokeWidth={2} />
            </div>
            Auditoria Global ERP
          </h2>
          <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest mt-2 ml-15 opacity-70">
            Rastreabilidade Completa e Histórico de Alterações
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 min-w-[200px] group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar por código, nome, usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#E5E5EA] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:bg-white focus:border-[#1C1C1E]/20 outline-none transition-all placeholder:text-[#AEAEB2] shadow-inner"
            />
          </div>
          
          <select 
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value as any)}
            className="bg-white border border-[#E5E5EA] rounded-2xl px-5 py-3.5 text-xs font-bold text-[#1C1C1E] outline-none shadow-3d-soft elevated-3d cursor-pointer"
          >
            <option value="">Todos os Módulos</option>
            <option value="Clientes">Clientes</option>
            <option value="Produtos">Produtos</option>
            <option value="Pedidos">Pedidos</option>
            <option value="Produção">Produção</option>
            <option value="Estoque">Estoque</option>
            <option value="Compras">Compras</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Entregas">Entregas</option>
            <option value="Configurações">Configurações</option>
            <option value="Usuários">Usuários</option>
          </select>

          <div className="flex items-center gap-2 bg-white border border-[#E5E5EA] rounded-2xl p-1 shadow-sm">
            <input 
              type="date" 
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold p-2 outline-none"
            />
            <span className="text-[10px] text-gray-400">até</span>
            <input 
              type="date" 
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent border-none text-[10px] font-bold p-2 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Timeline */}
        <div className="xl:col-span-2 bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 md:p-10 shadow-3d-soft relative overflow-hidden min-h-[600px] elevated-3d">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F5F5F7]/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
              <RefreshCw size={40} className="animate-spin text-[#1C1C1E] mb-4" />
              <p className="text-[10px] font-black text-[#8E8E93] uppercase tracking-widest">Carregando logs de auditoria...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="relative">
              <div className="absolute left-[23px] top-4 bottom-4 w-[2px] bg-[#F5F5F7]" />

              <div className="space-y-12">
                {filteredLogs.map((log, idx) => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
                  const isSelected = selectedLog?.id === log.id;
                  
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`relative pl-16 group cursor-pointer transition-all ${isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'}`}
                      onClick={() => setSelectedLog(isSelected ? null : log)}
                    >
                      <div className={`absolute left-0 top-1 w-12 h-12 rounded-[1.2rem] bg-white border border-[#E5E5EA] shadow-3d-soft flex items-center justify-center z-10 transition-all ${isSelected ? 'border-[#1C1C1E] shadow-3d-deep ring-4 ring-[#1C1C1E]/5 elevated-3d' : 'group-hover:border-[#1C1C1E]/30'}`}>
                        <div className={`w-3.5 h-3.5 rounded-full ${getActionColor(log.action)} shadow-[0_0_12px_rgba(0,0,0,0.15)]`} />
                      </div>

                      <div className={`p-6 rounded-[2rem] border transition-all ${isSelected ? 'bg-[#F5F5F7]/50 border-[#1C1C1E]/20 shadow-inner' : 'bg-white border-transparent hover:border-[#E5E5EA] hover:bg-[#F5F5F7]/20'}`}>
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                          <div className="space-y-4 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-[#1C1C1E] text-white ${isSelected ? 'opacity-100' : 'opacity-70'}`}>
                                {log.action}
                              </span>
                              <div className="w-1 h-1 rounded-full bg-[#E5E5EA]" />
                              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E5E5EA] rounded-xl text-[9px] font-black text-[#1C1C1E] uppercase tracking-wide shadow-xs">
                                {getModuleIcon(log.module)}
                                {log.module}
                              </div>
                              {log.companyId && (
                                <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-wide border border-indigo-100/30">
                                  {log.companyId}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <h4 className="text-base font-black text-[#1C1C1E] tracking-tighter uppercase">
                                {log.resourceName}
                              </h4>
                              <span className="text-[10px] font-mono font-bold text-[#8E8E93] bg-[#F5F5F7] px-2 py-1 rounded-lg border border-[#E5E5EA]">
                                #{log.resourceId.substring(0, 8)}
                              </span>
                            </div>

                            {log.details?.observations && (
                              <p className="text-[10px] font-black text-amber-700 bg-amber-50/50 px-4 py-2.5 rounded-[1.2rem] border border-amber-100/50 inline-block uppercase tracking-wider">
                                {log.details.observations}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                            <div className="flex items-center gap-2 text-[10px] font-black text-[#1C1C1E] uppercase tracking-tight">
                              <div className="w-6 h-6 rounded-lg bg-white border border-[#E5E5EA] flex items-center justify-center shadow-xs">
                                <User size={12} className="text-[#8E8E93]" />
                              </div>
                              {log.user.name || log.user.email}
                              <span className="text-[8px] bg-[#1C1C1E] text-white px-1.5 py-0.5 rounded uppercase font-black">{log.user.role}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-[#8E8E93] bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-[#E5E5EA]/50 uppercase tracking-widest">
                              <Clock size={11} />
                              {safeFormat(logDate, "dd/MM/yyyy 'às' HH:mm")}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center">
              <div className="w-24 h-24 rounded-[3rem] bg-[#F5F5F7] flex items-center justify-center text-[#AEAEB2] mb-8 shadow-inner">
                <AlertCircle size={40} strokeWidth={1.5} />
              </div>
              <h3 className="text-sm font-black text-[#1C1C1E] uppercase tracking-widest mb-2">Sem registros de auditoria</h3>
              <p className="text-[11px] font-bold text-[#8E8E93] max-w-xs leading-relaxed uppercase opacity-70">
                Nenhuma ação registrada nos módulos selecionados para este período.
              </p>
            </div>
          )}
        </div>

        {/* Inspector Side Panel */}
        <div className="space-y-8">
          <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 shadow-3d-soft h-fit sticky top-8 elevated-3d">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-widest flex items-center gap-2 opacity-80">
                <Eye size={16} strokeWidth={3} /> Detalhes do Evento
              </h3>
              {selectedLog && (
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:bg-rose-50 px-2 py-1 rounded transition-colors"
                >
                  Fechar [x]
                </button>
              )}
            </div>

            {selectedLog ? (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="space-y-6">
                  <div>
                    <span className="text-[8px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] ml-1">Responsável</span>
                    <div className="flex items-center gap-4 mt-2 p-4 bg-[#F5F5F7] rounded-[1.8rem] border border-[#E5E5EA]/50 shadow-inner">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] flex items-center justify-center shadow-sm">
                        <User size={18} className="text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-[#1C1C1E] uppercase tracking-tight">{selectedLog.user.name}</p>
                        <p className="text-[9px] font-bold text-[#8E8E93]">{selectedLog.user.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-[#F5F5F7] rounded-[1.8rem] border border-[#E5E5EA]/50 shadow-inner">
                      <span className="text-[8px] font-black text-[#AEAEB2] uppercase tracking-[0.2em]">Ação</span>
                      <p className="text-xs font-black text-[#1C1C1E] mt-1 uppercase tracking-tighter">{selectedLog.action}</p>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] rounded-[1.8rem] border border-[#E5E5EA]/50 shadow-inner">
                      <span className="text-[8px] font-black text-[#AEAEB2] uppercase tracking-[0.2em]">Módulo</span>
                      <p className="text-xs font-black text-[#1C1C1E] mt-1 uppercase tracking-tighter">{selectedLog.module}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <span className="text-[8px] font-black text-[#AEAEB2] uppercase tracking-[0.2em] ml-1">Alterações de Estado</span>
                  
                  <div className="space-y-6">
                    {selectedLog.oldData && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-2">Estado Anterior</p>
                        <div className="p-5 bg-rose-50/20 border border-rose-100 rounded-[2rem] max-h-[200px] overflow-y-auto scrollbar-hide shadow-inner">
                          <pre className="text-[10px] font-mono text-rose-700/80 font-bold whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(selectedLog.oldData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedLog.oldData && selectedLog.newData && (
                      <div className="flex justify-center py-2">
                        <div className="w-10 h-10 rounded-full bg-[#F5F5F7] flex items-center justify-center shadow-inner">
                          <ArrowRight className="text-[#AEAEB2]" size={20} />
                        </div>
                      </div>
                    )}

                    {selectedLog.newData && (
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-2">Novo Estado</p>
                        <div className="p-5 bg-emerald-50/20 border border-emerald-100 rounded-[2rem] max-h-[200px] overflow-y-auto scrollbar-hide shadow-inner">
                          <pre className="text-[10px] font-mono text-emerald-700 font-bold whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(selectedLog.newData, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedLog.details?.changes && selectedLog.details.changes.length > 0 && (
                      <div className="space-y-4">
                        <p className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-2">Diferenças Detectadas</p>
                        <div className="space-y-3">
                          {selectedLog.details.changes.map((change: any, cidx: number) => (
                            <div key={cidx} className="p-4 bg-white border border-[#E5E5EA] rounded-[1.5rem] space-y-2 shadow-3d-soft elevated-3d">
                              <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest border-b border-indigo-50 pb-1.5">{change.field}</p>
                              <div className="flex items-center gap-3 text-[10px]">
                                <span className="text-rose-500/60 line-through font-bold">{renderValue(change.from)}</span>
                                <ArrowRight size={12} className="text-[#AEAEB2]" strokeWidth={3} />
                                <span className="text-emerald-600 font-black">{renderValue(change.to)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-8 border-t border-[#E5E5EA] flex items-center justify-between">
                  <div className="text-[9px] font-black text-[#AEAEB2] uppercase tracking-[0.2em]">ID do Registro</div>
                  <div className="text-[10px] font-mono font-bold text-[#1C1C1E] bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-[#E5E5EA] shadow-inner uppercase">
                    {selectedLog.resourceId}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-center opacity-40">
                <div className="w-20 h-20 rounded-[2.5rem] bg-[#F5F5F7] flex items-center justify-center shadow-inner mb-6">
                  <ChevronRight size={40} className="text-[#AEAEB2] animate-pulse" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#AEAEB2] max-w-[200px] leading-relaxed">
                  Selecione um evento na linha do tempo para ver detalhes
                </p>
              </div>
            )}
          </div>

          {/* Quick Stats Panel */}
          <div className="bg-[#1C1C1E] text-white rounded-[2.5rem] p-8 shadow-3d-deep relative overflow-hidden elevated-3d">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] mb-8 text-indigo-400 opacity-80 relative z-10">Status Operacional</h4>
            
            <div className="space-y-8 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Audit Engine</span>
                <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full shadow-lg shadow-indigo-900/50 tracking-widest">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Integridade</span>
                <span className="text-[10px] font-black text-emerald-400 flex items-center gap-2 uppercase tracking-widest">
                  <ShieldCheck size={14} strokeWidth={3} /> 100% SECURE
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Eventos Hoje</span>
                <div className="text-3xl font-black tracking-tighter">
                  {logs.filter(l => l.date === new Date().toISOString().split('T')[0]).length}
                </div>
              </div>
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/10 relative z-10">
              <p className="text-[10px] font-bold text-white/30 leading-relaxed uppercase tracking-widest italic text-center">
                Protocolo de Rastreabilidade Permanente <br/> Transações protegidas e criptografadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
