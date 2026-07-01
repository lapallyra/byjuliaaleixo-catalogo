import React, { useState, useMemo } from "react";
import {
  Clock,
  Activity,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Timer,
  ArrowRight,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  Users,
  Calendar,
  Search,
  Plus,
  Trash2,
  X,
  Truck,
  FileText
} from "lucide-react";
import { 
  format, 
  differenceInHours, 
  differenceInDays,
  startOfDay,
  subDays,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
  subMonths
} from "date-fns";
import { Order, Product, CompanyId } from "../../types";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { calculateOrderPriority } from "../../utils/priorityUtils";

interface OperationalEfficiencyTabProps {
  orders: Order[];
  products: Product[];
  companyId: CompanyId;
}

type TimePeriod = 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth';

export const OperationalEfficiencyTab: React.FC<OperationalEfficiencyTabProps> = ({
  orders = [],
  products = [],
  companyId
}) => {
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = startOfDay(now);
        break;
      case '7d':
        start = startOfDay(subDays(now, 7));
        break;
      case '30d':
        start = startOfDay(subDays(now, 30));
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      default:
        start = subDays(now, 30);
    }

    return orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      if (!orderDate) return false;
      return isWithinInterval(orderDate, { start, end }) && o.status !== 'cancelled';
    });
  }, [orders, period]);

  // Efficiency Calculations
  const stats = useMemo(() => {
    let totalLeadTime = 0; // Total days
    let waitTime = 0; // Created to Production
    let processingTime = 0; // Production to Ready
    let fulfillmentTime = 0; // Ready to Delivered

    let countTotal = 0;
    let countWait = 0;
    let countProcessing = 0;
    let countFulfillment = 0;

    const stageBottlenecks: Record<string, number> = {};
    const priorityDistribution: Record<string, number> = { 'URGENTE': 0, 'ALTA': 0, 'NORMAL': 0, 'BAIXA': 0 };
    const productDurations: Record<string, { name: string; totalHours: number; count: number }> = {};
    const lateOrders: any[] = [];
    let finishedCount = 0;

    const now = new Date();

    orders.forEach(order => {
      const priorityInfo = calculateOrderPriority(order);
      const currentStatus = order.status || 'novo pedido';
      
      if (!['delivered', 'cancelled', 'fully_paid'].includes(currentStatus)) {
        priorityDistribution[priorityInfo.priority] = (priorityDistribution[priorityInfo.priority] || 0) + 1;
      }

      const history = order.history || [];
      const createdDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      
      // Lead Times
      const productionEntry = history.find(h => h.status === 'production')?.timestamp?.toDate?.() || null;
      const readyEntry = history.find(h => h.status === 'ready')?.timestamp?.toDate?.() || null;
      const deliveryEntry = (history.find(h => h.status === 'delivered') || history.find(h => h.status === 'fully_paid'))?.timestamp?.toDate?.() || null;

      if (productionEntry && createdDate) {
        waitTime += differenceInHours(productionEntry, createdDate);
        countWait++;
      }

      if (readyEntry && productionEntry) {
        processingTime += differenceInHours(readyEntry, productionEntry);
        countProcessing++;
      }

      if (deliveryEntry && readyEntry) {
        fulfillmentTime += differenceInHours(deliveryEntry, readyEntry);
        countFulfillment++;
      }

      if (deliveryEntry && createdDate) {
        totalLeadTime += differenceInHours(deliveryEntry, createdDate);
        countTotal++;
      }

      // Bottlenecks (Current state distribution)
      if (!['delivered', 'cancelled', 'fully_paid'].includes(currentStatus)) {
        stageBottlenecks[currentStatus] = (stageBottlenecks[currentStatus] || 0) + 1;
      }

      // Late Orders
      if (!['delivered', 'cancelled', 'fully_paid'].includes(currentStatus) && order.deliveryDate) {
        const deadline = new Date(order.deliveryDate);
        if (deadline < now) {
          lateOrders.push({
            ...order,
            delayDays: differenceInDays(now, deadline)
          });
        }
      }

      // Productivity (Finished in filtered period)
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      if (['delivered', 'fully_paid'].includes(currentStatus) && orderDate) {
          // Check if it was delivered in the selected period (using updatedAt as proxy for delivery date if history is missing)
          const updateDate = order.updatedAt?.toDate ? order.updatedAt.toDate() : new Date(order.updatedAt);
          // We already filter filteredOrders, but let's be specific for finished
          finishedCount++;
      }
    });

    return {
      avgWaitHours: countWait > 0 ? waitTime / countWait : 0,
      avgProcessingHours: countProcessing > 0 ? processingTime / countProcessing : 0,
      avgFulfillmentHours: countFulfillment > 0 ? fulfillmentTime / countFulfillment : 0,
      avgTotalHours: countTotal > 0 ? totalLeadTime / countTotal : 0,
      stageBottlenecks,
      priorityDistribution,
      lateOrders: lateOrders.sort((a, b) => b.delayDays - a.delayDays),
      finishedCount,
      productivityRate: filteredOrders.length > 0 ? (finishedCount / filteredOrders.length) * 100 : 0
    };
  }, [orders, filteredOrders]);

  // Chart Data: Bottlenecks
  const bottleneckData = Object.entries(stats.stageBottlenecks).map(([name, value]) => ({
    name: name === 'novo pedido' ? 'Novo' : 
          name === 'production' ? 'Produção' : 
          name === 'assembly' ? 'Montagem' : 
          name === 'ready' ? 'Pronto' : 
          name === 'approval' ? 'Arte' : name,
    value
  })).sort((a, b) => b.value - a.value);

  // Chart Data: Priorities
  const priorityData = Object.entries(stats.priorityDistribution).map(([name, value]) => ({
    name,
    value
  })).filter(d => d.value > 0);

  const PRIORITY_COLORS: Record<string, string> = {
    'URGENTE': '#e11d48',
    'ALTA': '#ea580c',
    'NORMAL': '#2563eb',
    'BAIXA': '#64748b'
  };

  // Alertas
  const alerts = useMemo(() => {
    const list = [];
    if (stats.lateOrders.length > 3) {
      list.push({ title: "Alta Taxa de Atraso", message: `${stats.lateOrders.length} pedidos estão fora do prazo de entrega.`, type: 'error' });
    }
    const productionAccumulation = stats.stageBottlenecks['production'] || 0;
    if (productionAccumulation > 10) {
      list.push({ title: "Gargalo na Produção", message: `Existem ${productionAccumulation} pedidos acumulados na etapa de produção.`, type: 'warning' });
    }
    if (stats.avgProcessingHours > 48) {
      list.push({ title: "Lentidão Operacional", message: "O tempo médio de processamento excedeu 48 horas.", type: 'warning' });
    }
    return list;
  }, [stats]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Eficiência Operacional</h1>
          <p className="text-slate-500 font-medium text-sm">Análise técnica de fluxo, produtividade e gargalos</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          {(['today', '7d', '30d', 'thisMonth', 'lastMonth'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === 'thisMonth' ? 'Mês Atual' : 'Mês Anterior'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          label="Tempo Médio Total" 
          value={`${(stats.avgTotalHours / 24).toFixed(1)} dias`} 
          subValue="Ciclo completo"
          icon={<Timer size={20} />} 
          color="slate"
        />
        <StatsCard 
          label="Pedidos Finalizados" 
          value={stats.finishedCount.toString()} 
          subValue="No período"
          icon={<CheckCircle2 size={20} />} 
          color="emerald"
        />
        <StatsCard 
          label="Taxa de Conclusão" 
          value={`${stats.productivityRate.toFixed(1)}%`} 
          subValue="vs total período"
          icon={<Activity size={20} />} 
          color="blue"
        />
        <StatsCard 
          label="Pedidos Atrasados" 
          value={stats.lateOrders.length.toString()} 
          subValue="Fora do prazo"
          icon={<AlertCircle size={20} />} 
          color="rose"
        />
      </div>

      {/* Main Analysis Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Flow Efficiency */}
        <div className="lg:col-span-2 space-y-8">
           {/* Visual Flow with Times */}
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-2">
                 <Layers size={18} className="text-indigo-600" /> Fluxo de Trabalho & Lead Times
              </h3>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                 <FlowStep 
                    label="Pedido" 
                    time={`${(stats.avgWaitHours / 24).toFixed(1)}d`} 
                    subLabel="Espera p/ Prod."
                    icon={<Calendar size={20} />}
                    status="completed"
                 />
                 <div className="hidden md:block h-px flex-1 bg-slate-100 relative">
                    <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 </div>
                 <FlowStep 
                    label="Produção" 
                    time={`${(stats.avgProcessingHours / 24).toFixed(1)}d`} 
                    subLabel="Mão de Obra"
                    icon={<Activity size={20} />}
                    status="active"
                 />
                 <div className="hidden md:block h-px flex-1 bg-slate-100 relative">
                    <ArrowRight className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300" size={16} />
                 </div>
                 <FlowStep 
                    label="Entrega" 
                    time={`${(stats.avgFulfillmentHours / 24).toFixed(1)}d`} 
                    subLabel="Logística"
                    icon={<Package size={20} />}
                    status="pending"
                 />
              </div>

              <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Gargalos Operacionais</h4>
                    <span className="text-[10px] font-black text-slate-400">Distribuição Atual</span>
                 </div>
                 <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={bottleneckData} layout="vertical">
                          <XAxis type="number" hide />
                          <YAxis 
                             dataKey="name" 
                             type="category" 
                             axisLine={false} 
                             tickLine={false} 
                             width={80}
                             tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                             {bottleneckData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#0f172a' : '#94a3b8'} />
                             ))}
                          </Bar>
                       </BarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Productivity Trends - Optional Bar Chart */}
           <div className="bg-white border border-slate-100 rounded-3xl p-8 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Carga por Prioridade</h4>
                <TrendingUp size={16} className="text-slate-400" />
              </div>
              <div className="flex flex-wrap gap-8 items-center">
                <div className="h-40 w-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || '#cbd5e1'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  {priorityData.map((entry) => (
                    <div key={entry.name} className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }} />
                        <span className="text-[10px] font-black text-slate-400 uppercase">{entry.name}</span>
                      </div>
                      <span className="text-lg font-black text-slate-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                 <BarChart3 size={18} className="text-emerald-600" /> Alertas Operacionais
              </h3>
              <div className="space-y-4">
                 {alerts.map((alert, idx) => (
                    <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-4 ${
                       alert.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-orange-50 border-orange-100 text-orange-800'
                    }`}>
                       <div className={`p-2 rounded-xl shrink-0 ${
                          alert.type === 'error' ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'
                       }`}>
                          <AlertCircle size={18} />
                       </div>
                       <div>
                          <p className="text-sm font-bold">{alert.title}</p>
                          <p className="text-xs font-medium opacity-80">{alert.message}</p>
                       </div>
                    </div>
                 ))}
                 {alerts.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                       <CheckCircle2 size={32} className="text-emerald-500" />
                       <p className="text-xs font-bold uppercase tracking-widest">Nenhum problema detectado</p>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Sidebar: Late Orders & High Impact */}
        <div className="space-y-8">
           {/* Late Orders List */}
           <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm overflow-hidden flex flex-col max-h-[600px]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold text-slate-900">Pedidos Atrasados</h3>
                 <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                    {stats.lateOrders.length}
                 </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                 {stats.lateOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400 text-center gap-2">
                       <CheckCircle2 size={32} />
                       <p className="text-xs font-bold uppercase tracking-widest">Nenhum pedido<br/>atrasado</p>
                    </div>
                 ) : (
                    stats.lateOrders.map(order => (
                       <div key={order.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between mb-2">
                             <span className="text-[10px] font-black text-slate-400">#{order.code}</span>
                             <span className="text-[10px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-lg">
                                +{order.delayDays} dias
                             </span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{order.customerName}</p>
                          <div className="mt-2 flex items-center justify-between">
                             <span className="text-[10px] font-bold text-slate-400 uppercase">{order.status}</span>
                             <span className="text-[10px] font-bold text-slate-500">{order.deliveryDate}</span>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              <button className="w-full mt-6 py-3 bg-slate-50 text-slate-900 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                 Ver todos os pedidos <ArrowUpRight size={14} />
              </button>
           </div>

           {/* Quick Productivity Recap */}
           <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Resumo de Carga</h3>
                 <div className="space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                             <Activity size={20} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Em Produção</p>
                             <p className="text-lg font-black">{stats.stageBottlenecks['production'] || 0}</p>
                          </div>
                       </div>
                       <TrendingUp size={16} className="text-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                             <Users size={20} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-slate-400 uppercase">Aguard. Aprovação</p>
                             <p className="text-lg font-black">{stats.stageBottlenecks['approval'] || 0}</p>
                          </div>
                       </div>
                       <Activity size={16} className="text-blue-400" />
                    </div>
                 </div>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-slate-800 rounded-full blur-3xl opacity-50"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatsCard = ({ label, value, subValue, icon, color }: any) => {
  const colors = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900'
  };

  const iconColors = {
    slate: 'bg-slate-800 text-slate-400',
    emerald: 'bg-emerald-100 text-emerald-600',
    rose: 'bg-rose-100 text-rose-600',
    blue: 'bg-blue-100 text-blue-600'
  };

  return (
    <div className={`p-6 rounded-3xl border shadow-sm transition-all hover:shadow-md ${color === 'slate' ? colors.slate : 'bg-white border-slate-200'}`}>
       <div className="flex items-center justify-between mb-4">
          <div className={`p-2.5 rounded-xl ${color === 'slate' ? iconColors.slate : iconColors[color as keyof typeof iconColors]}`}>
             {icon}
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${color === 'slate' ? 'text-slate-500' : 'text-slate-400'}`}>
             {subValue}
          </span>
       </div>
       <div>
          <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${color === 'slate' ? 'text-slate-400' : 'text-slate-500'}`}>
             {label}
          </p>
          <p className="text-2xl font-black tracking-tight">{value}</p>
       </div>
    </div>
  );
};

const FlowStep = ({ label, time, subLabel, icon, status }: any) => {
  const statusStyles = {
    completed: 'border-emerald-500 bg-emerald-50 text-emerald-900',
    active: 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-lg shadow-indigo-100',
    pending: 'border-slate-200 bg-white text-slate-400'
  };

  const iconStyles = {
    completed: 'bg-emerald-100 text-emerald-600',
    active: 'bg-indigo-600 text-white',
    pending: 'bg-slate-50 text-slate-400'
  };

  return (
    <div className={`flex-1 min-w-[120px] p-5 rounded-3xl border-2 flex flex-col items-center text-center transition-all ${statusStyles[status as keyof typeof statusStyles]}`}>
       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconStyles[status as keyof typeof iconStyles]}`}>
          {icon}
       </div>
       <p className="text-sm font-bold mb-1">{label}</p>
       <p className={`text-xs font-black ${status === 'pending' ? 'text-slate-300' : 'text-slate-900'}`}>{time}</p>
       <p className="text-[10px] font-bold opacity-60 uppercase mt-1 tracking-tighter">{subLabel}</p>
    </div>
  );
};
