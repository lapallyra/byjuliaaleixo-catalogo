import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, Product, CompanyId, CommemorativeDate } from "../../types";
import { safeFormat } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { startOfDay, isToday } from "date-fns";
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
           // ... (keep today section the same)
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[1.5rem] p-6 border border-[#F0E6D2] shadow-[0_15px_40px_rgba(240,230,210,0.3)] relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <Sparkles size={160} className="text-[#D48C8C]" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2]">
                <Zap size={14} className="text-[#D48C8C]" />
              </div>
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-[#D48C8C]">
                Destaque de Hoje
              </span>
            </div>
            <h3 className="text-xl font-sans font-semibold text-[#4A4444] leading-tight mb-2">
              {todayDates.map((d) => d.name).join(" & ")}
            </h3>
            <p className="text-[10px] text-[#A09898] font-medium leading-relaxed italic mb-6">
              "{todayDates[0].marketing_phrase}"
            </p>
            <div className="flex gap-2">
              <button className="bg-[#D48C8C] text-white px-4 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest hover:bg-[#C07B7B] transition-all flex items-center gap-2 shadow-lg shadow-[#D48C8C]/20">
                <Tag size={12} /> Postar
              </button>
              <button className="bg-white text-[#A09898] border border-[#F0E6D2] px-4 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest hover:bg-[#FAF9F6] transition-all flex items-center gap-2">
                <Share2 size={12} /> Divulgar
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-3 px-2">
        <div className="p-2 rounded-xl bg-[#FAF9F6] text-[#D48C8C] border border-[#F0E6D2]">
           <Calendar size={16} />
        </div>
        <div>
           <h3 className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#4A4444]">
              Próximos 60 dias
           </h3>
           <p className="text-[7px] text-[#A09898] font-medium uppercase mt-0.5">
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
                        <h4 key={i} className="text-[10px] font-bold text-[#4A4444] uppercase tracking-tight">
                           {ev.name}
                        </h4>
                      ))}
                    </div>
                    <p className="text-[8px] font-bold text-[#D48C8C] uppercase tracking-widest mt-1.5">
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
  } = useMemo(() => {
    let activeCount = 0;
    let delivCount = 0;
    let cancCount = 0;
    let waitCount = 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let revenueSinceStartOfMonth = 0;

    orders.forEach(o => {
      const status = o.status.toLowerCase();
      if (status === 'delivered') delivCount++;
      else if (status === 'cancelled') cancCount++;
      else if (['pending', 'quote', 'waiting_deposit'].includes(status)) {
         waitCount++;
         activeCount++; // Count them as active as well, or maybe active = all non-final? Let's say all non-cancelled/delivered is active
      }
      else activeCount++;

      const date = new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt || Date.now());
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear && status !== 'cancelled') {
        revenueSinceStartOfMonth += (Number(o.total) || 0);
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
      .slice(0, 10); // show a few more

    return {
      activeOrdersCount: activeCount,
      deliveredCount: delivCount,
      cancelledCount: cancCount,
      waitingCount: waitCount,
      currentMonthNetProfit: netProfitEstimate,
      pendingOrders: pending,
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-300 pb-6 max-w-7xl mx-auto overflow-x-hidden">
      {/* 0. Meta Mensal (CLT Escape) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-[2.5rem] border border-[#F0E6D2] shadow-[0_20px_60px_rgba(240,230,210,0.2)] relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FDFBF9] to-transparent pointer-events-none" />
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
          <Target size={240} className="text-[#D48C8C]" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-[#FAF9F6] rounded-lg border border-[#F0E6D2]">
                  <Target size={14} className="text-[#D48C8C]" />
                </div>
                <h3 className="text-[10px] font-black uppercase text-[#4A4444] tracking-[0.25em]">
                  Meta Mensal de Vendas
                </h3>
              </div>
              <p className="text-[9px] text-[#A09898] font-semibold uppercase tracking-wider pl-8">
                Objetivo Financeiro Líquido • Foco no Ateliê
              </p>
            </div>
            <div className="text-left md:text-right bg-[#FAF9F6] px-6 py-3 rounded-2xl border border-[#F0E6D2]">
              <p className="text-3xl font-sans font-black text-[#D48C8C] leading-none mb-1">
                {formatCurrency(currentMonthNetProfit)}
              </p>
              <div className="flex items-center md:justify-end gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-[8px] text-[#D48C8C] font-black uppercase tracking-widest">
                  Lucro Estimado Atual
                </p>
              </div>
            </div>
          </div>

          <div className="relative py-2">
            <div className="flex justify-between mb-3 px-1">
              <span className="text-[9px] font-black tracking-widest text-[#A09898] uppercase">
                Progresso da Meta
              </span>
              <span className="text-[9px] font-black tracking-widest text-[#D48C8C] uppercase">
                {Math.min(
                  Math.round((currentMonthNetProfit / 2000) * 100),
                  100,
                )}
                % Concluído
              </span>
            </div>
            <div className="w-full h-5 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#F0E6D2] p-1 shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min((currentMonthNetProfit / 2000) * 100, 100)}%`,
                }}
                transition={{ duration: 2, ease: [0.23, 1, 0.32, 1] }}
                className="h-full bg-gradient-to-r from-[#D48C8C] via-[#E9ADAD] to-[#D48C8C] rounded-full relative overflow-hidden"
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

      {/* 1. Header Stats */}
      <header className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            title: "Ativos",
            value: activeOrdersCount.toString(),
            icon: Package,
            color: "text-[#D48C8C]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Aguardando",
            value: waitingCount.toString(),
            icon: Clock,
            color: "text-[#D48C8C]",
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
            color: "text-[#A09898]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
        ].map((stat, idx) => (
          <motion.div
            key={`ds-stat-${idx}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-6 rounded-[1.5rem] border border-[#F0E6D2] flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
          >
            <div>
              <p className="text-[8px] font-bold uppercase text-[#A09898] tracking-[0.2em] mb-1">
                {stat.title}
              </p>
              <p className="text-2xl font-sans font-semibold text-[#4A4444]">
                {stat.value}
              </p>
            </div>
            <div
              className={`p-3.5 rounded-[1.2rem] ${stat.bg} ${stat.color} border ${stat.border} transition-transform group-hover:scale-110`}
            >
              <stat.icon size={20} />
            </div>
          </motion.div>
        ))}
      </header>

      {/* Caixa */}
      <div className="bg-white p-6 rounded-[1.5rem] border border-[#F0E6D2] flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] flex items-center justify-center text-[#D48C8C]">
             <DollarSign size={20} />
           </div>
           <div>
             <h3 className="text-[10px] font-black uppercase text-[#4A4444] tracking-[0.2em]">Fluxo de Caixa Diário</h3>
             <p className="text-[8px] text-[#A09898] font-bold uppercase tracking-widest mt-0.5">Nenhum caixa aberto</p>
           </div>
         </div>
         <div className="flex gap-3">
           <button className="bg-[#FAF9F6] border border-[#F0E6D2] text-[#4A4444] px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#F0E6D2] transition-colors">
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
          <section className="bg-white p-8 rounded-[2rem] border border-[#F0E6D2] shadow-[0_20px_50px_rgba(240,230,210,0.2)] relative overflow-hidden min-h-[400px]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
              <Package size={200} />
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10">
              <div>
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#4A4444]">
                  Pedidos recentes
                </h3>
                <p className="text-[8px] text-[#D48C8C] font-medium uppercase tracking-[0.1em] mt-1">
                  Últimas atividades do sistema
                </p>
              </div>
              <button className="text-[8px] font-semibold uppercase text-[#D48C8C] tracking-widest border-b border-transparent hover:border-[#D48C8C] transition-all">
                Ver todos
              </button>
            </div>

            <div className="space-y-4 relative z-10">
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
                    className="p-5 rounded-[1.2rem] bg-white border border-[#F0E6D2] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all group cursor-pointer hover:bg-[#FAF9F6]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white border border-[#F0E6D2] flex items-center justify-center text-[#D1CACA] group-hover:text-[#D48C8C] transition-colors overflow-hidden relative shadow-inner">
                        {order.customerName.charAt(0)}
                        <div
                          className="absolute bottom-0 left-0 right-0 h-1"
                          style={{ backgroundColor: config.color }}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-[#4A4444] uppercase tracking-tight">
                          {order.customerName}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-medium text-[#D48C8C] uppercase tracking-wider">
                            {order.companyId}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-[#F0E6D2]"></span>
                          <span className="text-[8px] font-semibold text-[#D48C8C] uppercase tracking-widest">
                            {statusLabels[order.status] || order.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4">
                      <div className="text-right mr-4">
                        <p className="text-[10px] font-bold text-[#4A4444]">
                          {formatCurrency(Number(order.total) || 0)}
                        </p>
                        <p className="text-[7px] text-[#A09898] font-medium uppercase tracking-widest mt-0.5">
                          {order.code}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onOpenOrder(order); }}
                          className="px-4 py-2 rounded-lg bg-[#FAF9F6] border border-[#F0E6D2] text-[8px] font-bold uppercase tracking-widest text-[#4A4444] hover:bg-[#F0E6D2] transition-colors"
                        >
                          Visualizar
                        </button>
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            // Using a CustomEvent to prompt the app to open the order
                            window.dispatchEvent(new CustomEvent('edit-order', { detail: order.id }));
                          }}
                          className="px-4 py-2 rounded-lg bg-black text-white border border-transparent text-[8px] font-bold uppercase tracking-widest hover:bg-neutral-800 transition-colors"
                        >
                          Editar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
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
