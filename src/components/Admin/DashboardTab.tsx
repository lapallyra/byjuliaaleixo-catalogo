import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  Users,
  ShoppingCart,
  ShoppingBag,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
  Gift,
  Star,
  Box,
  Sparkles,
  BarChart as BarChartIcon,
  Tag,
  MessageSquare,
  Share2,
  ArrowRight,
  Target,
  CheckCircle2,
  MoreVertical,
  ArrowUpRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, Product, CompanyId, CommemorativeDate } from "../../types";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { startOfDay, isToday, subDays, isAfter, format, parseISO } from "date-fns";
import { getUpcomingDates } from "../../services/calendarService";
import { commemorativeDateService } from "../../services/commemorativeDateService";
import { getMobileDateOccurrence } from "../../lib/commemorativeDateUtils";

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  customers: any[];
  monthlyGoal: number;
  onAction: (
    action: "new_order" | "new_client" | "new_insumo" | "view_agenda",
  ) => void;
  onOpenOrder: (order: Order) => void;
}

const ChartCard: React.FC<{ title: string; subtitle: string; children: React.ReactNode; icon: any }> = ({ title, subtitle, children, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-[2rem] border border-[#F0E6D2] shadow-[0_15px_40px_rgba(240,230,210,0.2)] flex flex-col h-[400px]"
  >
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2] text-[#D88D85]">
          <Icon size={16} />
        </div>
        <div>
          <h3 className="text-[10px] font-black uppercase text-[#4A3A34] tracking-[0.2em]">{title}</h3>
          <p className="text-[8px] text-[#A09088] font-bold uppercase tracking-widest mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
        <ArrowUpRight size={12} />
        <span className="text-[9px] font-black uppercase tracking-widest">Live</span>
      </div>
    </div>
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        {children as any}
      </ResponsiveContainer>
    </div>
  </motion.div>
);

const OpportunitiesWidget: React.FC = () => {
  const [dates, setDates] = useState<CommemorativeDate[]>([]);

  useEffect(() => {
    const unsub = commemorativeDateService.subscribe(setDates);
    return unsub;
  }, []);

  const getFullDate = (
    d: CommemorativeDate,
    year = new Date().getFullYear(),
  ) => {
    if (d.year_fixed) return new Date(year, d.month - 1, d.day);
    if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year);
      return new Date(year, occurrence.month - 1, occurrence.day);
    }
    return new Date(year, d.month - 1, d.day);
  };

  const todayDates = useMemo(() => {
    return dates.filter((d) => isToday(getFullDate(d)) && d.active);
  }, [dates]);

  const groupedUpcomingDates = useMemo(() => {
    const today = startOfDay(new Date());
    const upcoming = dates
      .filter((d) => {
        const occurrence = getFullDate(d);
        return (
          occurrence > today &&
          occurrence <=
            startOfDay(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000))
        );
      })
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime());

    const grouped: { date: Date; events: CommemorativeDate[] }[] = [];
    upcoming.forEach(event => {
       const occurrence = getFullDate(event);
       const existingGroup = grouped.find(g => startOfDay(g.date).getTime() === startOfDay(occurrence).getTime());
       if (existingGroup) {
         existingGroup.events.push(event);
       } else {
         grouped.push({ date: occurrence, events: [event] });
       }
    });

    return grouped.slice(0, 5); // show up to 5 days
  }, [dates]);

  return (
    <div className="space-y-6">
      {todayDates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#FFFFFF] rounded-[1.5rem] p-6 border border-[#F0E6D2] shadow-[0_15px_40px_rgba(240,230,210,0.3)] relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <Sparkles size={160} className="text-[#D88D85]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2]">
                <Zap size={14} className="text-[#D88D85]" />
              </div>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-[#D88D85]">
                Destaque de Hoje
              </span>
            </div>
            <h3 className="text-xl font-sans font-bold text-[#4A3A34] leading-tight mb-2">
              {todayDates.map((d) => d.name).join(" & ")}
            </h3>
            <p className="text-[10px] text-[#7A6A62] font-medium leading-relaxed italic mb-6">
              "{todayDates[0].marketing_phrase}"
            </p>
            <div className="flex gap-2">
              <button className="bg-[#D88D85] text-white px-4 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest hover:bg-[#C07B7B] transition-all flex items-center gap-2 shadow-lg shadow-[#D88D85]/20">
                <Tag size={12} /> Postar
              </button>
              <button className="bg-white text-[#A09088] border border-[#F0E6D2] px-4 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest hover:bg-[#FAF9F6] transition-all flex items-center gap-2">
                <Share2 size={12} /> Divulgar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 px-2">
        <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#D88D85] border border-[#F0E6D2]">
           <Calendar size={16} />
        </div>
        <div>
           <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#4A3A34]">
              Próximos 60 dias
           </h3>
           <p className="text-[7px] text-[#A09088] font-medium uppercase mt-0.5">
              Eventos e Datas Comemorativas
           </p>
        </div>
      </div>

      <div className="space-y-3">
        {groupedUpcomingDates.map((group, idx) => {
          const daysLeft = Math.ceil(
            (group.date.getTime() - startOfDay(new Date()).getTime()) /
              (1000 * 60 * 60 * 24),
          );
          return (
            <motion.div
              key={`dash-opp-${idx}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="p-4 rounded-[1.2rem] bg-white border border-[#F0E6D2] transition-all hover:bg-[#FAF9F6] shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                 <div>
                    <div className="flex flex-col gap-1">
                      {group.events.map((ev, i) => (
                        <h4 key={i} className="text-[10px] font-bold text-[#4A3A34] uppercase tracking-tight">
                           {ev.name}
                        </h4>
                      ))}
                    </div>
                    <p className="text-[8px] font-bold text-[#D88D85] uppercase tracking-widest mt-1.5">
                       {safeFormat(group.date, "dd/MM")} • {daysLeft} dias
                    </p>
                 </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  products,
  customers,
  monthlyGoal,
  onAction,
  onOpenOrder,
}) => {
  const [expandedSection, setExpandedSection] = React.useState<string | null>(
    null,
  );

  const {
    activeOrdersCount,
    deliveredCount,
    cancelledCount,
    waitingCount,
    currentMonthNetProfit,
    pendingOrders,
    dailySalesData,
    topProductsData,
  } = useMemo(() => {
    let activeCount = 0;
    let delivCount = 0;
    let cancCount = 0;
    let waitCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let revenueSinceStartOfMonth = 0;

    // Charts Data Calculation (Last 30 Days)
    const thirtyDaysAgo = subDays(startOfDay(now), 30);
    const dailyMap = new Map<string, number>();
    const productMap = new Map<string, number>();

    // Initialize daily map with zeros for last 30 days
    for (let i = 0; i < 30; i++) {
        const d = subDays(startOfDay(now), i);
        dailyMap.set(format(d, 'dd/MM'), 0);
    }

    orders.forEach(o => {
      const status = o.status.toLowerCase();
      if (status === 'delivered') delivCount++;
      else if (status === 'cancelled') cancCount++;
      else if (['pending', 'quote', 'waiting_deposit'].includes(status)) {
         waitCount++;
         activeCount++;
      }
      else activeCount++;

      const orderDate = new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt || Date.now());
      
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear && status !== 'cancelled') {
        revenueSinceStartOfMonth += (Number(o.total) || 0);
      }

      // Fill Chart Data (Sales trends and Products)
      if (isAfter(orderDate, thirtyDaysAgo) && status !== 'cancelled') {
         const dateKey = format(orderDate, 'dd/MM');
         if (dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + (Number(o.total) || 0));
         }

         o.items?.forEach(item => {
            const pName = item.product_name || 'Personalizado';
            productMap.set(pName, (productMap.get(pName) || 0) + item.quantity);
         });
      }
    });

    const netProfitEstimate = revenueSinceStartOfMonth * 0.35;

    const pending = orders
      .filter((o) => !["delivered", "cancelled", "finalizado"].includes(o.status.toLowerCase()))
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || Date.now();
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || Date.now();
        return timeB - timeA;
      })
      .slice(0, 10);

    const salesChart = Array.from(dailyMap.entries()).map(([date, total]) => ({ date, total })).reverse();
    const productsChart = Array.from(productMap.entries())
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

    return {
      activeOrdersCount: activeCount,
      deliveredCount: delivCount,
      cancelledCount: cancCount,
      waitingCount: waitCount,
      currentMonthNetProfit: netProfitEstimate,
      pendingOrders: pending,
      dailySalesData: salesChart,
      topProductsData: productsChart,
    };
  }, [orders]);

  const brandConfig: Record<
    string,
    { color: string; badge: string; initial: string }
  > = useMemo(
    () => ({
      guennita: { color: "#800000", badge: "tag-guennita", initial: "CG" },
      pallyra: { color: "#D4AF37", badge: "tag-pallyra", initial: "LP" },
      mimada: { color: "#D48C8C", badge: "tag-mimada", initial: "MS" },
      tuttymimo: { color: "#D4BDA1", badge: "tag-tuttymimo", initial: "TM" },
    }),
    [],
  );

  const statusLabels: Record<string, string> = useMemo(
    () => ({
      quote: "Orçamento",
      waiting_deposit: "Sinal",
      production: "Produção",
      ready: "Pronto",
      approval: "Ver Arte",
      assembly: "Montagem",
      pending: "Pendente",
      delivered: "Entregue",
      cancelled: "Cancelado",
      "novo pedido": "Novo",
    }),
    [],
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-300 pb-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* 0. Meta Mensal (CLT Escape) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] border border-[#F0E6D2] shadow-[0_20px_60px_rgba(240,230,210,0.2)] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
          <Target size={240} className="text-[#D88D85]" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FAF9F6] rounded-lg border border-[#F0E6D2]">
                  <Target size={14} className="text-[#D88D85]" />
                </div>
                <h3 className="text-[10px] font-black uppercase text-[#4A3A34] tracking-[0.25em]">
                  Meta Mensal de Vendas
                </h3>
              </div>
              <p className="text-[9px] text-[#A09088] font-semibold uppercase tracking-wider pl-8">
                Objetivo Financeiro Líquido • Foco no Ateliê
              </p>
            </div>
            <div className="text-left md:text-right bg-[#FAF9F6] px-6 py-3 rounded-2xl border border-[#F0E6D2]">
              <p className="text-3xl font-sans font-bold text-[#D88D85] leading-none mb-1">
                {formatCurrency(currentMonthNetProfit)}
              </p>
              <div className="flex items-center md:justify-end gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[8px] text-[#A09088] font-black uppercase tracking-widest">
                  Lucro Estimado Atual
                </p>
              </div>
            </div>
          </div>

          <div className="relative py-2">
            <div className="flex justify-between mb-3 px-1">
              <span className="text-[9px] font-black tracking-widest text-[#A09088] uppercase">
                Progresso da Meta
              </span>
              <span className="text-[9px] font-black tracking-widest text-[#D88D85] uppercase">
                {Math.min(
                  Math.round((currentMonthNetProfit / 2000) * 100),
                  100,
                )}
                % Concluído
              </span>
            </div>
            <div className="w-full h-5 bg-[#F3D4D1] rounded-full overflow-hidden border border-[#F0E6D2] shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((currentMonthNetProfit / 2000) * 100, 100)}%`,
                }}
                transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
                className="h-full bg-gradient-to-r from-[#D88D85] to-[#E6B3AC] rounded-full relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ["-200%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-white/30 skew-x-[30deg] w-1/4"
                />
              </motion.div>
            </div>
            <div className="flex justify-between mt-3 px-1">
              <div className="flex gap-4">
                <span className="text-[7px] text-[#D1CACA] font-black uppercase tracking-widest">
                  Base: R$ 0
                </span>
              </div>
              <span className="text-[7px] text-[#A09898] font-black uppercase tracking-widest bg-[#F0E6D2]/30 px-2 py-0.5 rounded">
                Alvo: {formatCurrency(2000)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 1. Header Stats - Intelligent Fluid Grid */}
      <header className="grid grid-cols-[repeat(auto-fit,minmax(max(240px,20%),1fr))] gap-6">
        {[
          {
            title: "Ativos",
            value: activeOrdersCount.toString(),
            icon: Package,
            color: "text-[#D88D85]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Aguardando",
            value: waitingCount.toString(),
            icon: Clock,
            color: "text-[#D88D85]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Entregues",
            value: deliveredCount.toString(),
            icon: CheckCircle,
            color: "text-emerald-600",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Cancelados",
            value: cancelledCount.toString(),
            icon: XCircle,
            color: "text-[#D88D85]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
        ].map((stat, idx) => (
          <motion.div
            key={`ds-stat-${idx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#FFFFFF] p-6 rounded-[1.5rem] border border-[#F0E6D2] flex items-center justify-between shadow-[0_8px_24px_rgba(240,230,210,0.5)] hover:shadow-[0_12px_32px_rgba(240,230,210,0.6)] transition-all group"
          >
            <div>
              <p className="text-[8px] font-bold uppercase text-[#7A6A62] tracking-[0.2em] mb-1">
                {stat.title}
              </p>
              <p className="text-3xl font-sans font-extrabold text-[#2D2D2D]">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-3.5 rounded-[1.2rem] ${stat.bg} ${stat.color} border ${stat.border} transition-transform group-hover:scale-110 opacity-100 mix-blend-multiply`}
            >
              <stat.icon size={20} />
            </div>
          </motion.div>
        ))}
      </header>

      {/* 1.5. Analytics Section - Charts Group */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartCard 
          title="Faturamento Diário" 
          subtitle="Desempenho de vendas (últimos 30 dias)"
          icon={TrendingUp}
        >
          <AreaChart data={dailySalesData}>
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D88D85" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#D88D85" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0E6D2" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#A09088', fontWeight: 'bold' }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 9, fill: '#A09088', fontWeight: 'bold' }}
              tickFormatter={(val) => `R$ ${val}`}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid #F0E6D2', 
                boxShadow: '0 10px 30px rgba(240,230,210,0.3)',
                fontSize: '10px',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Vendas']}
            />
            <Area 
              type="monotone" 
              dataKey="total" 
              stroke="#D88D85" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorTotal)" 
            />
          </AreaChart>
        </ChartCard>

        <ChartCard 
          title="Produtos Populares" 
          subtitle="Itens mais vendidos (últimos 30 dias)"
          icon={BarChartIcon}
        >
          <BarChart data={topProductsData} layout="vertical" margin={{ left: 30 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0E6D2" opacity={0.5} />
            <XAxis type="number" hide />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              width={100}
              tick={{ fontSize: 8, fill: '#4A3A34', fontWeight: '800' }}
            />
            <Tooltip 
               cursor={{ fill: '#FAF9F6' }}
               contentStyle={{ 
                borderRadius: '16px', 
                border: '1px solid #F0E6D2', 
                fontSize: '10px',
                fontWeight: 'bold'
              }}
            />
            <Bar dataKey="sales" radius={[0, 8, 8, 0]} barSize={20}>
              {topProductsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={['#D88D85', '#E6B3AC', '#F3D4D1', '#D48C8C', '#C07B7B'][index % 5]} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>
      </section>

      {/* Caixa */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-[#F0E6D2] flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] flex items-center justify-center text-[#D88D85]">
             <DollarSign size={20} />
           </div>
           <div>
             <h3 className="text-[10px] font-black uppercase text-[#4A3A34] tracking-[0.2em]">Fluxo de Caixa Diário</h3>
             <p className="text-[8px] text-[#A09088] font-bold uppercase tracking-widest mt-0.5">Nenhum caixa aberto</p>
           </div>
         </div>
         <div className="flex gap-3">
           <button className="bg-[#FFFFFF] border border-[#F0E6D2] text-[#4A3A34] px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#F0E6D2] transition-colors shadow-sm">
              Fechar Caixa
           </button>
           <button className="bg-[#D48C8C] text-white px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#C07B7B] shadow-lg shadow-[#D48C8C]/20 transition-all">
              Abrir Caixa
           </button>
         </div>
      </div>

      {/* 2. Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column (Main - Pedidos Recentes Sobe) */}
        <div className="lg:col-span-8">
          <section className="bg-[#FFFFFF] p-8 rounded-[2rem] border border-[#F0E6D2] shadow-[0_24px_55px_rgba(240,230,210,0.3)] relative overflow-hidden min-h-[400px]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Package size={200} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#4A3A34]">
                  Pedidos recentes
                </h3>
                <p className="text-[8px] text-[#A09088] font-medium uppercase tracking-[0.1em] mt-1">
                  Últimas atividades do sistema
                </p>
              </div>
              <button className="text-[8px] font-semibold uppercase text-[#D88D85] tracking-widest border-b border-transparent hover:border-[#D88D85] transition-all">
                Ver todos
              </button>
            </div>

            <div className="w-full overflow-x-auto pb-8 pt-4 px-4 -mx-4 scrollbar-hide relative z-10">
              <div className="min-w-[820px] space-y-4">
              {pendingOrders.length === 0 && (
                <div className="py-20 text-center rounded-[1.5rem] bg-[#FAF9F6] border border-dashed border-[#F0E6D2]">
                  <ShoppingCart
                    size={40}
                    className="mx-auto text-[#D1CACA] mb-4 opacity-30"
                  />
                  <p className="text-[9px] font-semibold text-[#A09898] uppercase tracking-[0.3em]">
                    Nenhum pedido pendente
                  </p>
                </div>
              )}
              {pendingOrders.map((order, idx) => {
                const config =
                  brandConfig[order.companyId] || brandConfig.pallyra;
                  
                // Status mapping to match OrdersTab
                const isDelivered = ['delivered', 'fully_paid'].includes(order.status);
                const isCancelled = ['cancelled', 'canceled', 'refunded'].includes(order.status);
                let statusColor = "#a855f7"; // Default Roxo
                let statusLabel = "Novo";
                let bgLight = "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]";

                if (['approval', 'waiting_deposit', 'waiting_payment', 'planned_payment'].includes(order.status)) { statusColor = "#3b82f6"; bgLight = "bg-[#eff6ff] text-[#1d4ed8] border-[#93c5fd]"; statusLabel = "Aguardando Aprovação"; }
                else if (['production', 'in_production', 'assembly'].includes(order.status)) { statusColor = "#f97316"; bgLight = "bg-[#ffedd5] text-[#c2410c] border-[#fdba74]"; statusLabel = "Em Produção"; }
                else if (['ready', 'delivery', 'waiting_remaining', 'planned_active'].includes(order.status)) { statusColor = "#22c55e"; bgLight = "bg-[#f0fdf4] text-[#15803d] border-[#86efac]"; statusLabel = "Pronto"; }
                else if (isDelivered) { statusColor = "#86efac"; bgLight = "bg-[#dcfce7] text-[#166534] border-[#86efac]"; statusLabel = "Entregue"; }
                else if (isCancelled) { statusColor = "#ef4444"; bgLight = "bg-[#fef2f2] text-[#b91c1c] border-[#fca5a5]"; statusLabel = "Cancelado"; }

                const getProductInfoForCard = (o: Order) => {
                  if (o.items && o.items.length > 0) {
                    const firstItem = o.items[0];
                    const matchedProduct = products.find(p => p.id === firstItem.productId || p.id === firstItem.id);
                    const image = matchedProduct?.image || firstItem.image;
                    const name = matchedProduct?.product_name || firstItem.product_name;
                    const count = o.items.reduce((acc, i) => acc + i.quantity, 0);
                    return { image, name, count };
                  }
                  return { image: null, name: "Produto Personalizado", count: 1 };
                };
                const cardProduct = getProductInfoForCard(order);

                const brandNames: Record<string, string> = {
                  pallyra: "La Pallyra",
                  guennita: "com amor, Guennita",
                  mimada: "Mimada Sim",
    tuttymimo: "Tutty Mimo"
                };

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{
                      y: -3,
                      boxShadow: "0 10px 20px rgba(240,230,210,0.2)",
                    }}
                    onClick={() => onOpenOrder(order)}
                    className="bg-white rounded-[1.5rem] border border-[#F0E6D2] shadow-sm flex items-stretch cursor-pointer overflow-hidden transition-all group"
                  >
                    {/* Barra Lateral Colorida do Status */}
                    <div 
                      className="w-2 shrink-0 transition-all duration-300"
                      style={{ backgroundColor: statusColor }}
                    />

                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_110px_130px_100px_90px_40px] items-center gap-4 px-5 py-4 w-full">
                        
                        {/* [1. NOME DO CLIENTE & ATELIÊ] */}
                        <div className="flex flex-col justify-center min-w-0 pr-4">
                           <div className="flex items-center gap-2 mb-1">
                            <span 
                              className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded text-gray-500 bg-gray-50 border border-gray-100"
                            >
                              {brandNames[order.companyId] || order.companyId}
                            </span>
                          </div>
                          <h4 className="text-[15px] font-bold text-slate-800 tracking-tight leading-tight">
                            {order.customerName}
                          </h4>
                        </div>

                        {/* [2. PRODUTO] */}
                        <div className="flex items-center gap-3 min-w-0 pr-4">
                          <div className="w-12 h-12 shrink-0 rounded bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative text-[#A09088]">
                            {cardProduct.image ? (
                              <img 
                                src={cardProduct.image} 
                                alt={cardProduct.name} 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <Box size={20} className="text-gray-300" />
                            )}
                            {cardProduct.count > 1 && (
                              <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                                +{cardProduct.count - 1}
                              </span>
                            )}
                          </div>
                          <span className="text-[14px] font-medium text-slate-600 leading-tight" title={cardProduct.name || "Produto"}>
                            {cardProduct.name || "Produto Genérico"}
                          </span>
                        </div>

                        {/* [3. DATA DE ENTREGA] */}
                        <div className="flex flex-col justify-center gap-1.5">
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Entrega</span>
                          <div className="flex items-center gap-1.5 text-slate-700 text-[14px]">
                            <Calendar size={14} className="text-gray-400" />
                            <span>
                              {order.deliveryDate
                                ? safeFormatISO(order.deliveryDate, "dd/MM")
                                : "--/--"}
                            </span>
                          </div>
                        </div>

                        {/* [4. STATUS] */}
                        <div className="flex items-center">
                          <span className={`flex items-center justify-center text-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${bgLight} w-full`}>
                            {isDelivered ? (
                              <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                            ) : isCancelled ? (
                              <XCircle size={13} className="text-red-500 shrink-0" />
                            ) : null}
                            <span>{statusLabel}</span>
                          </span>
                        </div>

                        {/* [5. VALOR TOTAL] */}
                        <div className="flex flex-col justify-center gap-1 text-right">
                          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest text-right">Valor</span>
                          <p className="text-[15px] font-medium text-slate-800">
                            {formatCurrency(Number(order.total) || 0)}
                          </p>
                        </div>

                        {/* [6. CÓDIGO DO PEDIDO] */}
                        <div className="flex items-center justify-end">
                          <span className="font-mono text-[12px] font-medium text-gray-500 uppercase tracking-widest text-right px-2">
                            #{order.code}
                          </span>
                        </div>

                        {/* [7. MENU ...] */}
                        <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                  e.stopPropagation();
                                  window.dispatchEvent(new CustomEvent('edit-order', { detail: order.id }));
                              }}
                              className="w-10 h-10 rounded-full bg-transparent hover:bg-gray-100 text-gray-400 hover:text-gray-600 flex items-center justify-center transition-all cursor-pointer"
                            >
                              <MoreVertical size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column (Radar de Campanhas Desce) */}
        <div className="lg:col-span-4 space-y-10">
          <OpportunitiesWidget />
        </div>
      </div>
    </div>
  );
};
