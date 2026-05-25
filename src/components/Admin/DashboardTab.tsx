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

  const upcomingDates = useMemo(() => {
    const today = startOfDay(new Date());
    return dates
      .filter((d) => {
        const occurrence = getFullDate(d);
        return (
          occurrence > today &&
          occurrence <=
            startOfDay(new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000))
        );
      })
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime())
      .slice(0, 3);
  }, [dates]);

  return (
    <div className="space-y-6">
      {todayDates.length > 0 && (
        <motion.div
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
            Radar de Campanhas
          </h3>
          <p className="text-[7px] text-[#A09898] font-medium uppercase mt-0.5">
            Próximos 60 dias estratégicos
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {upcomingDates.map((data, idx) => {
          const daysLeft = Math.ceil(
            (getFullDate(data).getTime() - startOfDay(new Date()).getTime()) /
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
                <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] flex flex-col items-center justify-center text-[#A09898] group-hover:text-[#D48C8C] transition-all">
                  <span className="text-[9px] font-semibold leading-none">
                    {getFullDate(data).getDate()}
                  </span>
                  <span className="text-[6px] font-semibold uppercase">
                    {safeFormat(getFullDate(data), "MMM")}
                  </span>
                </div>
                <div>
                  <h4 className="text-[10px] font-semibold text-[#4A4444] uppercase tracking-tight">
                    {data.name}
                  </h4>
                  <p className="text-[7px] font-medium uppercase text-[#A09898] tracking-widest mt-0.5">
                    {data.category} • {daysLeft} dias
                  </p>
                </div>
              </div>
              <button className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#F0E6D2] flex items-center justify-center text-[#D1CACA] hover:text-[#D48C8C] transition-all">
                <ArrowRight size={14} />
              </button>
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

  // Stats Calculation
  const {
    currentMonthRevenue,
    currentMonthNetProfit,
    goalProgress,
    totalRevenue,
    pendingOrders,
    daysInMonth,
  } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const revenueSinceStartOfMonth =
      orders.reduce((sum, o) => {
        if (o.status === "cancelled") return sum;
        const date = new Date(
          o.createdAt?.toDate
            ? o.createdAt.toDate()
            : o.createdAt || Date.now(),
        );
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          return sum + (Number(o.total) || 0);
        }
        return sum;
      }, 0) || 0;

    const currentGoalProgress =
      monthlyGoal > 0 ? (revenueSinceStartOfMonth / monthlyGoal) * 100 : 0;
    const revenueTotal =
      orders.reduce(
        (sum, o) =>
          o.status !== "cancelled" ? sum + (Number(o.total) || 0) : sum,
        0,
      ) || 0;

    const netProfitEstimate = revenueSinceStartOfMonth * 0.35;

    const pending = orders
      .filter(
        (o) =>
          !["delivered", "cancelled", "finalizado"].includes(
            o.status.toLowerCase(),
          ),
      )
      .sort((a, b) => {
        const timeA =
          a.createdAt?.toMillis?.() ||
          (a.createdAt as any)?.seconds * 1000 ||
          Date.now();
        const timeB =
          b.createdAt?.toMillis?.() ||
          (b.createdAt as any)?.seconds * 1000 ||
          Date.now();
        return timeB - timeA;
      })
      .slice(0, 4);

    return {
      currentMonthRevenue: revenueSinceStartOfMonth,
      currentMonthNetProfit: netProfitEstimate,
      goalProgress: currentGoalProgress,
      totalRevenue: revenueTotal,
      pendingOrders: pending,
      daysInMonth: lastDayOfMonth,
    };
  }, [orders, monthlyGoal]);

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-300 pb-20 max-w-7xl mx-auto overflow-x-hidden">
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
            title: "Volume Bruto",
            value: formatCurrency(totalRevenue),
            icon: DollarSign,
            color: "text-[#D48C8C]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Lucro Estimado",
            value: formatCurrency(totalRevenue * 0.35),
            icon: TrendingUp,
            color: "text-[#D48C8C]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Total Pedidos",
            value: orders.length.toString(),
            icon: ShoppingBag,
            color: "text-[#4A4444]",
            bg: "bg-[#FAF9F6]",
            border: "border-[#F0E6D2]",
          },
          {
            title: "Meus Clientes",
            value: customers.length.toString(),
            icon: Users,
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
            className="bg-white p-6 rounded-[1.5rem] border border-[#F0E6D2] flex items-center gap-5 shadow-[0_10px_30px_rgba(240,230,210,0.15)] hover:shadow-[0_15px_40px_rgba(240,230,210,0.25)] transition-all group"
          >
            <div
              className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} border ${stat.border} transition-transform group-hover:scale-110`}
            >
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-[8px] font-semibold uppercase text-[#A09898] tracking-[0.2em]">
                {stat.title}
              </p>
              <p className="text-lg font-sans font-semibold text-[#4A4444] mt-0.5">
                {stat.value}
              </p>
            </div>
          </motion.div>
        ))}
      </header>

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

                    <div className="flex items-center justify-between md:justify-end gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-semibold text-[#4A4444]">
                          {formatCurrency(Number(order.total) || 0)}
                        </p>
                        <p className="text-[7px] text-[#A09898] font-medium uppercase tracking-widest">
                          {order.code}
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-white border border-[#F0E6D2] flex items-center justify-center text-[#A09898] group-hover:bg-[#D48C8C] group-hover:text-white group-hover:border-[#D48C8C] transition-all">
                        <ArrowRight size={14} />
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
