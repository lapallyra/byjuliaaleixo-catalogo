import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  XCircle,
  LayoutDashboard,
  Activity,
  Target,
  AlertCircle,
  Save,
} from "lucide-react";
import { FinanceEntry, CompanyId, Order, SiteSettings } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import {
  subscribeToFinance,
  getSiteSettings,
  saveMonthlyProfitHistory,
  subscribeToMonthlyProfitHistory,
} from "../../services/firebaseService";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FinanceTabProps {
  companyId: CompanyId;
  orders: Order[];
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  companyId,
  orders,
}) => {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [filterMonth, setFilterMonth] = useState(new Date());

  useEffect(() => {
    const unsubFinance = subscribeToFinance(setEntries, companyId);
    const unsubHistory = subscribeToMonthlyProfitHistory(setHistory, companyId);
    return () => {
      unsubFinance();
      unsubHistory();
    };
  }, [companyId]);

  const handleCloseMonth = async () => {
    if (confirm("Deseja fechar o mês e salvar o lucro atual no histórico?")) {
      await saveMonthlyProfitHistory(companyId, {
        month: format(filterMonth, "MM/yyyy"),
        netProfit: netProfit,
      });
      alert("Mês fechado e registrado!");
    }
  };

  useEffect(() => {
    getSiteSettings(companyId).then((data) => {
      if (data) setSettings(data);
    });
  }, [companyId]);

  const currentMonthOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          isSameMonth(
            o.createdAt?.toDate
              ? o.createdAt.toDate()
              : new Date(o.createdAt as any),
            filterMonth,
          ),
      ),
    [orders, filterMonth],
  );

  const grossRevenue = useMemo(
    () =>
      currentMonthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [currentMonthOrders],
  );

  const monthEntries = useMemo(
    () => entries.filter((e) => isSameMonth(new Date(e.date), filterMonth)),
    [entries, filterMonth],
  );
  const totalManualInflows = useMemo(
    () =>
      monthEntries
        .filter((e) => e.type === "revenue")
        .reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [monthEntries],
  );
  const totalManualOutflows = useMemo(
    () =>
      monthEntries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [monthEntries],
  );

  // Derived costs from Settings
  const fixedCosts = settings?.global_fixed_costs || 0;
  const taxesRate = settings?.global_tax_rate || 0;
  const variableTaxes = grossRevenue * (taxesRate / 100);

  // Custom formula for COGS (Cost of Goods Sold based on Insumos). As a fallback, estimate at 35% of revenue if no precise data
  // But let's assume 35% of revenue for standard
  const cogsEstimate = grossRevenue * 0.35;

  const totalExpenses =
    totalManualOutflows + fixedCosts + variableTaxes + cogsEstimate;
  const netProfit = grossRevenue + totalManualInflows - totalExpenses;

  const monthlyGoal = settings?.monthly_goal || 1; // prevent div/0
  const goalProgress = Math.min((grossRevenue / monthlyGoal) * 100, 100);

  const TabNav = () => (
    <div className="flex flex-wrap gap-2 mb-10 sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 border-b border-[#F0E6D2]">
      {[
        { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
        { id: "analise", label: "Análise de Custos", icon: Activity },
      ].map((sec) => (
        <button
          key={sec.id}
          onClick={() => setActiveSection(sec.id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec.id ? "bg-lilac text-slate-900 shadow-lg shadow-lilac/20" : "bg-white text-[#A09898] hover:bg-slate-100"}`}
        >
          <sec.icon size={14} />
          {sec.label}
        </button>
      ))}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "visao-geral":
        return (
          <section className="space-y-8 animate-in fade-in duration-300">
            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Faturamento Bruto",
                  val: grossRevenue,
                  icon: TrendingUp,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                  border: "border-emerald-100",
                },
                {
                  label: "Lucro Líquido Estimado",
                  val: netProfit,
                  icon: DollarSign,
                  color: "text-lilac",
                  bg: "bg-lilac/10",
                  border: "border-lilac/20",
                },
                {
                  label: "Custos Dinâmicos (Mês)",
                  val: totalExpenses,
                  icon: TrendingDown,
                  color: "text-slate-9000",
                  bg: "bg-slate-50",
                  border: "border-rose-100",
                },
                {
                  label: "Cancelamentos",
                  val: orders.filter(
                    (o) =>
                      o.status === "cancelled" &&
                      isSameMonth(
                        o.createdAt?.toDate
                          ? o.createdAt.toDate()
                          : new Date(o.createdAt),
                        filterMonth,
                      ),
                  ).length,
                  isCount: true,
                  icon: XCircle,
                  color: "text-gray-500",
                  bg: "bg-slate-100",
                  border: "border-slate-200",
                },
              ].map((card, idx) => (
                <div
                  key={card.label}
                  className={`p-8 rounded-[2rem] bg-white border ${card.border} shadow-lg shadow-black/5 relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                >
                  <div
                    className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${card.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}
                  />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                      <card.icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 mt-6 relative z-10 font-sans tracking-tight">
                    {card.isCount ? card.val : formatCurrency(card.val)}
                  </p>
                </div>
              ))}
            </div>

            {/* Goal Progress Tracker */}
            {settings?.monthly_goal && settings.monthly_goal > 0 && (
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lilac/20 rounded-full blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                      <Target size={24} className="text-lilac" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Progresso da Meta Mensal
                      </h3>
                      <p className="text-2xl font-black mt-1 font-sans">
                        <span className="text-lilac">
                          {formatCurrency(grossRevenue)}
                        </span>{" "}
                        <span className="text-white/30 text-lg">
                          / {formatCurrency(settings.monthly_goal)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-end gap-6">
                    <div className="w-full max-w-md h-4 rounded-full bg-white/5 border border-white/10 overflow-hidden relative shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-lilac to-pink-500 relative"
                        style={{ width: `${goalProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-sans w-16 text-right">
                      {Math.round(goalProgress)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inflows & Outflows List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Entradas */}
              <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-50/50 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" /> Fluxo
                    Positivo
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                    {currentMonthOrders.length} Pedidos
                  </span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {currentMonthOrders.length > 0 ? (
                    currentMonthOrders.slice(0, 10).map((o, idx) => (
                      <div
                        key={`order-entry-${o.id}-${idx}`}
                        className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-800 font-sans uppercase">
                            {o.customerName || "Cliente"}
                          </p>
                          <p className="text-[9px] font-black text-emerald-600 tracking-widest mt-0.5">
                            #{o.code}
                          </p>
                        </div>
                        <span className="font-black text-emerald-600">
                          + {formatCurrency(o.total)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[10px] uppercase font-black tracking-widest text-[#A09898] py-10">
                      Nenhuma venda esse mês.
                    </p>
                  )}
                </div>
              </div>

              {/* Saídas e Custos Base */}
              <div className="bg-white rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-50/50 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                    <TrendingDown size={16} className="text-slate-9000" />{" "}
                    Previsão de Custos
                  </h3>
                  <span className="text-[10px] font-black bg-slate-50 text-rose-600 px-3 py-1 rounded-full">
                    Baseado nas configs
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50/30 rounded-xl border border-rose-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        Custos Fixos Globais
                      </p>
                      <p className="text-[9px] font-black text-slate-9000 tracking-widest mt-0.5">
                        Aluguel, Luz, etc.
                      </p>
                    </div>
                    <span className="font-black text-slate-9000">
                      - {formatCurrency(fixedCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50/30 rounded-xl border border-rose-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        Impostos sobre Faturamento
                      </p>
                      <p className="text-[9px] font-black text-slate-9000 tracking-widest mt-0.5">
                        {taxesRate}% sobre R$ {grossRevenue.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-black text-slate-9000">
                      - {formatCurrency(variableTaxes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50/30 rounded-xl border border-amber-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        CMV (Custo Mercadoria Projetado)
                      </p>
                      <p className="text-[9px] font-black text-amber-600 tracking-widest mt-0.5">
                        ~35% do Faturamento Agregado
                      </p>
                    </div>
                    <span className="font-black text-amber-600">
                      - {formatCurrency(cogsEstimate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-[2rem] border border-[#F0E6D2] shadow-xl p-8 mt-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-black uppercase tracking-tighter text-slate-800">
                  Histórico de Lucro Registrado
                </h2>
                <button
                  onClick={handleCloseMonth}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Save size={12} /> Fechar Mês / Salvar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 bg-slate-50 rounded-xl border border-[#F0E6D2] text-center"
                  >
                    <p className="text-[8px] font-bold text-[#A09898] uppercase tracking-widest">
                      {h.month}
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {formatCurrency(h.netProfit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "analise":
        return (
          <section className="space-y-8 animate-in fade-in duration-300">
            <div className="p-10 rounded-[3rem] bg-white border border-[#F0E6D2] shadow-2xl flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 bg-lilac/10 rounded-full flex items-center justify-center text-lilac mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 mb-2">
                Módulo em Aperfeiçoamento
              </h3>
              <p className="text-[10px] font-black text-[#A09898] uppercase tracking-[0.3em] max-w-sm leading-relaxed">
                A análise detalhada de custos e insumos está sendo refinada.
                Continue atualizando suas configurações de precificação base
                para os cálculos de Lucro Líquido.
              </p>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Hub Financeiro Premium
          </h2>
          <p className="text-[#A09898] text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Visibilidade total da sua lucratividade
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#F0E6D2] shadow-sm">
          <button className="p-3 bg-white hover:bg-slate-100 rounded-xl transition-all text-[#A09898] hover:text-slate-900 hover:shadow-md">
            <Download size={18} />
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3 px-4">
            <Calendar size={18} className="text-slate-900" />
            <select
              value={format(filterMonth, "yyyy-MM")}
              onChange={(e) =>
                setFilterMonth(new Date(e.target.value + "-01T00:00:00"))
              }
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-900"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const d = subMonths(new Date(), i);
                return (
                  <option
                    key={format(d, "yyyy-MM")}
                    value={format(d, "yyyy-MM")}
                  >
                    {format(d, "MMMM yyyy", { locale: ptBR })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <TabNav />

      {renderActiveSection()}
    </div>
  );
};
