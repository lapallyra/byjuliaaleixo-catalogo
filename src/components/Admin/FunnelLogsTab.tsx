import React, { useMemo, useState } from 'react';
import { ArrowDown, Flame, Timer, TrendingUp, Sparkles, Filter, Trash2, Calendar, ShoppingCart, User, RefreshCw } from 'lucide-react';
import { CompanyId } from '../../types';

interface FunnelLogsTabProps {
  events: any[];
  selectedCompanyId: CompanyId;
}

export const FunnelLogsTab: React.FC<FunnelLogsTabProps> = ({ events = [], selectedCompanyId }) => {
  const [filterStep, setFilterStep] = useState<string>('all');

  // Filter events specific to current company
  const filteredCompanyEvents = useMemo(() => {
    return events.filter(e => e.companyId === selectedCompanyId);
  }, [events, selectedCompanyId]);

  // Calculations for funnel
  const funnelStats = useMemo(() => {
    const inicioCount = filteredCompanyEvents.filter(e => e.stepName === 'Início').length;
    const persCount = filteredCompanyEvents.filter(e => e.stepName === 'Seleção de Personalização').length;
    const pagCount = filteredCompanyEvents.filter(e => e.stepName === 'Pagamento MP').length;

    const persRate = inicioCount > 0 ? ((persCount / inicioCount) * 100).toFixed(1) : '0';
    const pagRate = persCount > 0 ? ((pagCount / persCount) * 100).toFixed(1) : '0';
    const overallRate = inicioCount > 0 ? ((pagCount / inicioCount) * 100).toFixed(1) : '0';

    // Potential revenue vs actual payment conversion attempts
    const totalPotential = filteredCompanyEvents
      .filter(e => e.stepName === 'Início')
      .reduce((sum, e) => sum + (e.total || 0), 0);

    const totalConverted = filteredCompanyEvents
      .filter(e => e.stepName === 'Pagamento MP')
      .reduce((sum, e) => sum + (e.total || 0), 0);

    return {
      inicioCount,
      persCount,
      pagCount,
      persRate,
      pagRate,
      overallRate,
      totalPotential,
      totalConverted
    };
  }, [filteredCompanyEvents]);

  // Master logs list matching the selected filters
  const logsToDisplay = useMemo(() => {
    return filteredCompanyEvents.filter(e => {
      if (filterStep === 'all') return true;
      return e.stepName === filterStep;
    });
  }, [filteredCompanyEvents, filterStep]);

  const getStepBadgeStyle = (stepName: string) => {
    switch (stepName) {
      case 'Início':
        return 'bg-blue-50 text-blue-700 border-blue-200/50';
      case 'Seleção de Personalização':
        return 'bg-amber-50 text-amber-700 border-amber-200/50';
      case 'Pagamento MP':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/50';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200/50';
    }
  };

  const getFormattedDate = (createdAt?: any) => {
    if (!createdAt) return "Agora mesmo";
    try {
      if (createdAt.toDate) {
        return createdAt.toDate().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + " - " + createdAt.toDate().toLocaleDateString('pt-BR');
      }
      if (createdAt.seconds) {
        const d = new Date(createdAt.seconds * 1000);
        return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " - " + d.toLocaleDateString('pt-BR');
      }
      const d = new Error(createdAt) ? new Date(createdAt) : new Date();
      return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " - " + d.toLocaleDateString('pt-BR');
    } catch {
      return "Acabou de ocorrer";
    }
  };

  return (
    <div className="space-y-10 max-w-7xl mx-auto p-1 select-none">
      
      {/* Title Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
          <TrendingUp className="text-[#D48C8C]" size={24} />
          Métricas de Conversão do Funil
        </h2>
        <p className="text-[10px] uppercase font-bold text-[#A09898] tracking-widest mt-1">
          Histórico e análises em tempo real da jornada e comportamento de compra dos clientes
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
            <ShoppingCart size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#A09898] tracking-widest block">Iniciaram Compra</span>
            <span className="text-2xl font-black text-slate-900">{funnelStats.inicioCount}</span>
            <span className="text-[9px] text-gray-400 block mt-0.5">Potencial: R$ {funnelStats.totalPotential.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 font-bold">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#A09898] tracking-widest block">Customizaram Mimos</span>
            <span className="text-2xl font-black text-slate-900">{funnelStats.persCount}</span>
            <span className="text-[10px] font-bold text-amber-600 block mt-0.5">{funnelStats.persRate}% de avanço</span>
          </div>
        </div>

        <div className="bg-white border border-[#F0E6D2] rounded-3xl p-6 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Flame className="fill-emerald-500/10" size={20} />
          </div>
          <div>
            <span className="text-[9px] uppercase font-bold text-[#A09898] tracking-widest block">Finalizaram Mercado Pago</span>
            <span className="text-2xl font-black text-slate-900">{funnelStats.pagCount}</span>
            <span className="text-[10px] font-black text-emerald-600 block mt-0.5">{funnelStats.overallRate}% conversão final</span>
          </div>
        </div>
      </div>

      {/* Visual Funnel Representation */}
      <div className="bg-white border border-[#F0E6D2] rounded-3xl p-8 shadow-sm">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#6d5443] mb-8">Etapas Visuais do Checkout</h3>
        
        <div className="max-w-2xl mx-auto space-y-3">
          
          {/* STEP 1 */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Etapa 1</span>
              <p className="text-xs font-bold text-slate-700">Início</p>
            </div>
            <div className="flex-1 bg-slate-100 h-10 rounded-full relative overflow-hidden flex items-center px-6">
              <div 
                className="absolute top-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500 h-full rounded-full transition-all duration-[1s]"
                style={{ width: '100%' }}
              />
              <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest">
                Checkout Iniciado ({funnelStats.inicioCount} usuários) • 100%
              </span>
            </div>
          </div>

          <div className="flex justify-center -my-1 text-slate-300">
            <ArrowDown size={16} />
          </div>

          {/* STEP 2 */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Etapa 2</span>
              <p className="text-xs font-bold text-slate-700">Customização</p>
            </div>
            <div className="flex-1 bg-slate-100 h-10 rounded-full relative overflow-hidden flex items-center px-6">
              <div 
                className="absolute top-0 left-0 bg-gradient-to-r from-amber-400 to-amber-500 h-full rounded-full transition-all duration-[1s]"
                style={{ width: `${funnelStats.inicioCount > 0 ? (funnelStats.persCount / funnelStats.inicioCount) * 100 : 0}%` }}
              />
              <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest drop-shadow-xs">
                Opções configuradas ({funnelStats.persCount} usuários) • {funnelStats.persRate}%
              </span>
            </div>
          </div>

          <div className="flex justify-center -my-1 text-slate-300">
            <ArrowDown size={16} />
          </div>

          {/* STEP 3 */}
          <div className="flex items-center gap-4">
            <div className="w-24 text-right shrink-0">
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Etapa 3</span>
              <p className="text-xs font-bold text-slate-700">Mercado Pago</p>
            </div>
            <div className="flex-1 bg-slate-100 h-10 rounded-full relative overflow-hidden flex items-center px-6">
              <div 
                className="absolute top-0 left-0 bg-gradient-to-r from-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-[1s]"
                style={{ width: `${funnelStats.inicioCount > 0 ? (funnelStats.pagCount / funnelStats.inicioCount) * 100 : 0}%` }}
              />
              <span className="relative z-10 text-[10px] font-black text-white uppercase tracking-widest drop-shadow-xs">
                Redirect Pagamento ({funnelStats.pagCount} usuários) • {funnelStats.overallRate}% conversão geral
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Terminal Live logs Console */}
      <div className="bg-slate-900 text-slate-300 border border-slate-800 rounded-3xl p-6 md:p-8 font-mono shadow-xl relative overflow-hidden">
        
        {/* Terminal Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between border-b border-slate-800 pb-6 mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-yellow-500 block"></span>
              <span className="w-3 h-3 rounded-full bg-green-500 block"></span>
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest font-black ml-2">
              analisador-funil-eventos-servidor:~#
            </div>
          </div>

          {/* Filter options inside terminal */}
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-slate-500" />
            <select 
              value={filterStep}
              onChange={(e) => setFilterStep(e.target.value)}
              className="bg-slate-850 hover:bg-slate-800 border-0 outline-none text-[10px] uppercase font-black text-slate-400 tracking-wider py-1.5 px-3 rounded-lg cursor-pointer"
            >
              <option value="all">TODAS JORNADAS</option>
              <option value="Início">INÍCIO SESSÃO</option>
              <option value="Seleção de Personalização">OPÇÕES PERSONALIZAÇÃO</option>
              <option value="Pagamento MP">REDIRECIONAMENTO MERCADO PAGO</option>
            </select>
          </div>
        </div>

        {/* Streams log list */}
        <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 font-mono">
          {logsToDisplay.length === 0 ? (
            <div className="text-center py-16 text-slate-600 text-xs">
              &gt; [AGUARDANDO TRANSAÇÕES...] Nenhuma atividade detectada para este filtro no momento.
            </div>
          ) : (
            logsToDisplay.map((log, index) => (
              <div 
                key={log.id || index}
                className="p-4 rounded-2xl bg-slate-920 border border-slate-800/60 hover:bg-slate-850 hover:border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] text-[#A09898] uppercase">
                      [{getFormattedDate(log.createdAt)}]
                    </span>
                    <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded-full border ${getStepBadgeStyle(log.stepName)}`}>
                      {log.stepName}
                    </span>
                  </div>

                  <p className="text-xs text-white leading-relaxed">
                    Cart: {log.description || "Insumo customizado"}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    {log.clientName && (
                      <span className="flex items-center gap-1">
                        <User size={10} /> {log.clientName}
                      </span>
                    )}
                    {log.total > 0 && (
                      <span className="font-bold text-amber-500/85">
                        Potencial: R$ {log.total.toFixed(2).replace('.', ',')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[9px] uppercase text-slate-550 border border-slate-800 py-1.5 px-3 rounded-xl bg-slate-950 font-semibold self-start sm:self-center tracking-widest">
                  Store: {log.companyId === 'pallyra' ? 'La Pallyra' : log.companyId === 'guennita' ? 'Guennita' : 'Mimada Sim'}
                </div>
              </div>
            ))
          )}
        </div>

      </div>

    </div>
  );
};
