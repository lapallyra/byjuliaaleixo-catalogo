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
    className="bg-white p-8 rounded-2xl border border-[#F0E6D2] shadow-[0_15px_40px_rgba(240,230,210,0.2)] flex flex-col h-[460px]"
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
  const [viewingProductDetails, setViewingProductDetails] = useState<Product | null>(null);

  const {
    activeOrdersCount,
    deliveredCount,
    cancelledCount,
    waitingCount,
    inProductionCount,
    currentMonthNetProfit,
    recentOrders,
    dailyRevenueList,
    popularProducts,
    currentMonthRevenue,
  } = useMemo(() => {
    let activeCount = 0;
    let delivCount = 0;
    let cancCount = 0;
    let waitingPaymentCount = 0;
    let inProdCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let revenueSinceStartOfMonth = 0;

    // Daily List Calculation (Current Month)
    const dailyMap = new Map<string, number>();
    const salesProductMap = new Map<string, { productId: string, count: number, total: number, clicks: number }>();

    orders.forEach(o => {
      const status = o.status.toLowerCase();
      
      // Counter logic
      if (['delivered', 'fully_paid'].includes(status)) delivCount++;
      else if (['cancelled', 'canceled', 'refunded'].includes(status)) cancCount++;
      else if (['waiting_deposit', 'waiting_payment', 'pending', 'quote'].includes(status)) {
        waitingPaymentCount++;
        activeCount++;
      } else if (['production', 'in_production', 'assembly', 'approval'].includes(status)) {
        inProdCount++;
        activeCount++;
      } else {
        activeCount++;
      }

      const orderDate = new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt || Date.now());
      
      // Current Month Revenue
      if (orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear && !['cancelled', 'canceled'].includes(status)) {
        revenueSinceStartOfMonth += (Number(o.total) || 0);
        
        // Fill daily revenue list
        const dateKey = format(orderDate, 'yyyy-MM-dd');
        dailyMap.set(dateKey, (dailyMap.get(dateKey) || 0) + (Number(o.total) || 0));

        // Popular products accounting
        o.items?.forEach(item => {
          const pid = item.productId || item.id || 'custom';
          const current = salesProductMap.get(pid) || { productId: pid, count: 0, total: 0, clicks: 0 };
          current.count += item.quantity;
          current.total += (Number(item.subtotal) || 0);
          salesProductMap.set(pid, current);
        });
      }
    });

    const netProfitEstimate = revenueSinceStartOfMonth * 0.35;

    // Recent Orders (Last 8)
    const recent = [...orders]
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || Date.now();
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || Date.now();
        return timeB - timeA;
      })
      .slice(0, 8);

    // Daily Revenue List (Sorted by date)
    const dailyList = Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 10);

    // Popular Products (Sorted by count)
    const popular = Array.from(salesProductMap.values())
      .map(entry => {
        const p = products.find(prod => prod.id === entry.productId);
        return {
          ...p,
          id: entry.productId,
          product_name: p?.product_name || 'Personalizado',
          image: p?.image || '',
          monthlySales: entry.count,
          totalSales: entry.count, // Simplified to monthly for now
          clicks: Math.floor(entry.count * 2.5) // Simulated click data
        };
      })
      .sort((a, b) => b.monthlySales - a.monthlySales)
      .slice(0, 8);

    return {
      activeOrdersCount: activeCount,
      deliveredCount: delivCount,
      cancelledCount: cancCount,
      waitingCount: waitingPaymentCount,
      inProductionCount: inProdCount,
      currentMonthNetProfit: netProfitEstimate,
      currentMonthRevenue: revenueSinceStartOfMonth,
      recentOrders: recent,
      dailyRevenueList: dailyList,
      popularProducts: popular,
    };
  }, [orders, products]);

  const statusColors: Record<string, string> = {
    Ativos: "text-blue-600 bg-blue-50 border-blue-100",
    Produção: "text-orange-600 bg-orange-50 border-orange-100",
    Pagamento: "text-amber-600 bg-amber-50 border-amber-100",
    Entregues: "text-emerald-600 bg-emerald-50 border-emerald-100",
    Cancelados: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 max-w-[1600px] mx-auto">
      
      {/* BLOCO 01 E 02: CAIXA E META MENSAL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* BLOCO 01: CAIXA */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-[#F0E6D2] shadow-xl flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#D88D85] shadow-lg">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase text-[#4A3A34] tracking-[0.25em]">Monitor de Caixa</h3>
                <p className="text-[9px] text-[#A09088] font-bold uppercase tracking-widest mt-1">Fluxo financeiro imediato</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100">
                Caixa Fechado
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6 mb-8 text-center bg-[#FAF9F6] p-6 rounded-2xl border border-[#F0E6D2]">
             <div>
               <p className="text-[9px] font-black uppercase text-[#A09898] mb-1">Entradas Hoje</p>
               <p className="text-xl font-bold text-slate-900">R$ 0,00</p>
             </div>
             <div className="border-l border-[#F0E6D2]">
               <p className="text-[9px] font-black uppercase text-[#A09898] mb-1">Saídas Hoje</p>
               <p className="text-xl font-bold text-slate-900">R$ 0,00</p>
             </div>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => onAction("new_order")}
              className="flex-1 bg-slate-950 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
            >
              Abrir Caixa
            </button>
            <button className="flex-1 bg-white border border-[#F0E6D2] text-slate-900 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#FAF9F6] transition-all">
              Relatório Diário
            </button>
          </div>
        </motion.div>

        {/* BLOCO 02: META MENSAL */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-8 rounded-3xl border border-[#F0E6D2] shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.05] grayscale brightness-0">
            <Target size={200} />
          </div>
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-pink-50 rounded-xl border border-pink-100 text-pink-700">
                <Target size={16} />
              </div>
              <h3 className="text-[11px] font-black uppercase text-[#4A3A34] tracking-[0.25em]">Meta Mensal de Vendas</h3>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-4xl font-black text-slate-900 leading-none mb-2">
                    {formatCurrency(currentMonthRevenue)}
                  </p>
                  <p className="text-[10px] font-black uppercase text-[#A09088] tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} className="text-emerald-500" /> +12% vs mês anterior
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase text-[#A09088] tracking-widest mb-1">Objetivo</p>
                  <p className="text-xl font-bold text-slate-900">{formatCurrency(monthlyGoal || 3000)}</p>
                </div>
              </div>

              <div className="relative py-4">
                <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((currentMonthRevenue / (monthlyGoal || 3000)) * 100, 100)}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-pink-400 via-rose-300 to-[#D88D85] relative"
                  >
                    <motion.div 
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 bg-white/20 skew-x-[45deg] w-1/3"
                    />
                  </motion.div>
                </div>
                <div className="flex justify-between mt-4">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Início do Mês</span>
                   <span className="text-[8px] font-black uppercase text-[#D88D85] tracking-widest">
                     {Math.round((currentMonthRevenue / (monthlyGoal || 3000)) * 100)}% Concluído
                   </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* BLOCO 03: MINI CARDS LADO/LADO */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: "Ativos", value: activeOrdersCount, icon: Package },
          { label: "Produção", value: inProductionCount, icon: Zap },
          { label: "Pagamento", value: waitingCount, icon: Clock },
          { label: "Entregues", value: deliveredCount, icon: CheckCircle2 },
          { label: "Cancelados", value: cancelledCount, icon: XCircle },
        ].map((item, idx) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-6 rounded-[2rem] border bg-white shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-md transition-all ${statusColors[item.label]}`}
          >
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-xl bg-white border border-current opacity-60`}>
                <item.icon size={16} />
              </div>
              <span className="text-2xl font-black">{item.value}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{item.label}</p>
          </motion.div>
        ))}
      </div>

      {/* BLOCO 04: PEDIDOS RECENTES - 4 POR LINHA */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <div>
             <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A3A34]">Pedidos Recentes</h3>
             <p className="text-[9px] text-[#A09088] font-bold uppercase tracking-widest mt-1">Monitoramento de fluxo de entrada</p>
           </div>
           <button 
             onClick={() => onAction("new_order")}
             className="text-[9px] font-black uppercase text-[#D88D85] tracking-widest border-b border-rose-100 hover:border-[#D88D85] transition-all"
           >
             Ver Todos os Pedidos
           </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {recentOrders.map((order, idx) => {
             const status = order.status.toLowerCase();
             const isDelivered = ['delivered', 'fully_paid'].includes(status);
             const isProd = ['production', 'in_production', 'assembly'].includes(status);
             const isWaiting = ['waiting_deposit', 'waiting_payment', 'approval'].includes(status);

             return (
               <motion.div
                 key={order.id}
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: idx * 0.05 }}
                 onClick={() => onOpenOrder(order)}
                 className="bg-white p-6 rounded-3xl border border-[#F0E6D2] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden"
               >
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#D88D85] mb-1">#{order.code}</span>
                      <h4 className="text-[12px] font-black text-slate-900 truncate mb-1">{order.customerName}</h4>
                   </div>
                   <div className={`p-1.5 rounded-lg border ${isDelivered ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : isProd ? 'bg-orange-50 text-orange-600 border-orange-100' : isWaiting ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                      {isDelivered ? <CheckCircle size={14} /> : isProd ? <Zap size={14} /> : <Clock size={14} />}
                   </div>
                 </div>

                 <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                       {order.items?.[0]?.image ? (
                         <img src={order.items[0].image} className="w-full h-full object-cover" />
                       ) : <Box size={16} className="text-slate-300" />}
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-bold text-slate-700 truncate w-32">{order.items?.[0]?.product_name || 'Personalizado'}</span>
                       <span className="text-[8px] font-black text-slate-400 uppercase">{order.items?.length || 1} {order.items?.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 border-t border-[#F0E6D2]">
                    <span className="text-[14px] font-black text-slate-900">{formatCurrency(Number(order.total) || 0)}</span>
                    <span className="text-[9px] font-black uppercase text-[#A09898]">{safeFormatISO(order.createdAt, "dd MMM")}</span>
                 </div>
               </motion.div>
             );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* BLOCO 05: FATURAMENTO DIÁRIO (CALENDÁRIO EM LISTA) */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-[#F0E6D2] shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2] text-[#D88D85]">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A3A34]">Faturamento Diário</h3>
              <p className="text-[9px] text-[#A09088] font-bold uppercase tracking-widest mt-1">Histórico de entradas por data</p>
            </div>
          </div>

          <div className="space-y-3">
            {dailyRevenueList.length === 0 && (
              <div className="py-20 text-center opacity-40">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#A09898]">Sem faturamento registrado este mês</p>
              </div>
            )}
            {dailyRevenueList.map((item, idx) => (
              <motion.div 
                key={item.date}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-[#FAF9F6] border border-[#F0E6D2] hover:bg-white transition-all group"
              >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-xl bg-white border border-[#F0E6D2] flex flex-col items-center justify-center shadow-sm">
                      <span className="text-[13px] font-black text-slate-900 leading-none">{format(parseISO(item.date), 'dd')}</span>
                      <span className="text-[8px] font-black uppercase text-[#D88D85]">{format(parseISO(item.date), 'MMM').replace('.', '')}</span>
                   </div>
                   <div>
                      <p className="text-[10px] font-black uppercase text-slate-800 tracking-wider">Vendas Totais</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Registrado no Sistema</p>
                   </div>
                </div>
                <div className="text-right">
                   <p className="text-[14px] font-black text-slate-900">{formatCurrency(item.total)}</p>
                   <div className="flex items-center gap-1 justify-end">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[7px] font-black text-[#A09898] uppercase">Confirmado</span>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BLOCO 06: PRODUTOS POPULARES */}
        <section className="bg-white p-8 rounded-[2.5rem] border border-[#F0E6D2] shadow-xl space-y-8">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2] text-[#D88D85]">
                <Package size={18} />
              </div>
              <div>
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A3A34]">Produtos Populares</h3>
                <p className="text-[9px] text-[#A09088] font-bold uppercase tracking-widest mt-1">Campeões de saída no mês</p>
              </div>
           </div>

           <div className="grid grid-cols-4 sm:grid-cols-4 gap-4">
              {popularProducts.map((p, idx) => (
                <motion.div
                  key={p.id + idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setViewingProductDetails(p as any)}
                  className="aspect-square rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden cursor-pointer relative group"
                >
                   {p.image ? (
                     <img src={p.image} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Box size={24} />
                     </div>
                   )}
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <span className="text-[8px] font-black text-white uppercase tracking-widest bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30">Detalhes</span>
                   </div>
                </motion.div>
              ))}
              {popularProducts.length === 0 && (
                <div className="col-span-full py-20 text-center opacity-40">
                   <p className="text-[10px] font-black uppercase tracking-widest text-[#A09898]">Sem produtos vendidos este mês</p>
                </div>
              )}
           </div>

           <div className="p-6 bg-[#FAF9F6] border border-[#F0E6D2] rounded-2xl">
              <p className="text-[8px] font-black uppercase text-[#D88D85] tracking-widest mb-2 flex items-center gap-2">
                <Sparkles size={10} /> Insight Estratégico
              </p>
              <p className="text-[10px] font-medium text-[#7A6A62] leading-relaxed">
                Mantenha os produtos com maior saída sempre destacados no seu catálogo online para otimizar as taxas de conversão.
              </p>
           </div>
        </section>
      </div>

      {/* BLOCO 07: EVENTOS E DATAS COMEMORATIVAS */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2] text-[#D88D85]">
            <Calendar size={18} />
          </div>
          <div>
            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#4A3A34]">Eventos e Campanhas</h3>
            <p className="text-[9px] text-[#A09088] font-bold uppercase tracking-widest mt-1">Radar de sazonalidade e ativações</p>
          </div>
        </div>

        <OpportunitiesList />
      </section>

      {/* MODAL PARA RESUMO DE PRODUTO POPULAR */}
      <AnimatePresence>
        {viewingProductDetails && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/20 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="bg-white w-full max-w-md rounded-[3rem] border border-[#F0E6D2] overflow-hidden shadow-2xl relative"
             >
                <button 
                  onClick={() => setViewingProductDetails(null)}
                  className="absolute top-6 right-6 p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-all"
                >
                  <XCircle size={20} />
                </button>

                <div className="p-10 text-center">
                   <div className="w-48 h-48 mx-auto rounded-3xl bg-slate-50 border border-slate-100 overflow-hidden mb-8 shadow-inner">
                      {viewingProductDetails.image ? (
                        <img src={viewingProductDetails.image} className="w-full h-full object-cover" />
                      ) : <Box size={40} className="w-full h-full flex items-center justify-center p-12 text-slate-200" />}
                   </div>

                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-2">{viewingProductDetails.product_name}</h4>
                   <p className="text-[10px] font-black text-[#D88D85] uppercase tracking-[0.3em] mb-10">Métrica de Popularidade</p>

                   <div className="grid grid-cols-3 gap-4 border-t border-slate-50 pt-10">
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">No Mês</p>
                         <p className="text-xl font-black text-slate-900">{(viewingProductDetails as any).monthlySales || 0}</p>
                         <p className="text-[7px] font-black text-slate-400 uppercase">Vendas</p>
                      </div>
                      <div className="space-y-1 border-x border-slate-50">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Acum.</p>
                         <p className="text-xl font-black text-slate-900">{(viewingProductDetails as any).totalSales || 0}</p>
                         <p className="text-[7px] font-black text-slate-400 uppercase">Vendas</p>
                      </div>
                      <div className="space-y-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Engajamento</p>
                         <p className="text-xl font-black text-[#D88D85]">{(viewingProductDetails as any).clicks || 0}</p>
                         <p className="text-[7px] font-black text-slate-400 uppercase">Cliques/Interessados</p>
                      </div>
                   </div>

                   <button 
                     onClick={() => setViewingProductDetails(null)}
                     className="w-full mt-10 p-5 bg-slate-900 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                   >
                     Fechar Resumo
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const OpportunitiesList: React.FC = () => {
  const [dates, setDates] = useState<CommemorativeDate[]>([]);

  useEffect(() => {
    const unsub = commemorativeDateService.subscribe(setDates);
    return unsub;
  }, []);

  const getFullDate = (d: CommemorativeDate, year = new Date().getFullYear()) => {
    if (d.year_fixed) return new Date(year, d.month - 1, d.day);
    if (d.mobile_id) {
      const occurrence = getMobileDateOccurrence(d.mobile_id, year);
      return new Date(year, occurrence.month - 1, occurrence.day);
    }
    return new Date(year, d.month - 1, d.day);
  };

  const upcomingDates = useMemo(() => {
    const today = startOfDay(new Date());
    return dates
      .filter((d) => d.active && getFullDate(d) >= today)
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime())
      .slice(0, 8);
  }, [dates]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {upcomingDates.map((date, idx) => {
        const occ = getFullDate(date);
        const daysLeft = Math.ceil((occ.getTime() - startOfDay(new Date()).getTime()) / (1000 * 60 * 60 * 24));
        
        return (
          <motion.div
            key={date.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="p-6 rounded-[2rem] bg-white border border-[#F0E6D2] shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="flex justify-between items-start">
               <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] flex items-center justify-center text-[#D88D85] shadow-sm">
                  <Star size={16} />
               </div>
               {daysLeft <= 15 && (
                 <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest animate-pulse">Crítico</span>
               )}
            </div>
            
            <div>
               <h4 className="text-[12px] font-black text-slate-900 uppercase tracking-widest truncate">{date.name}</h4>
               <p className="text-[8px] font-black text-[#D88D85] uppercase tracking-[0.2em] mt-1">{safeFormat(occ, "dd 'de' MMMM")}</p>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[#A09898]">
               <span>Campanha Ativa</span>
               <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                  <Clock size={10} className="text-rose-400" />
                  <span>{daysLeft} dias</span>
               </div>
            </div>
          </motion.div>
        );
      })}
      {upcomingDates.length === 0 && (
        <div className="col-span-full py-20 text-center rounded-3xl border border-dashed border-slate-200 opacity-40">
           <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma campanha mapeada para os próximos meses</p>
        </div>
      )}
    </div>
  );
};
