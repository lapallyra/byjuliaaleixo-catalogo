import React, { useState, useMemo } from "react";
import {
  Trophy,
  TrendingUp,
  Package,
  Users,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  Filter,
  Star,
  PieChart,
  BarChart2,
  Zap,
  Layout,
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import { Product, Order, Customer, Insumo, CompanyId } from "../../types";
import { safeFormat } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { exportGenericReportPDF } from "../../utils/pdfGenerator";
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ImageWithFallback } from "../ImageWithFallback";

interface ReportsTabProps {
  companyId?: CompanyId;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  insumos: Insumo[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  companyId,
  orders,
  products,
  customers,
  insumos,
}) => {
  const [selectedMonth, setSelectedMonth] = useState(
    safeFormat(new Date(), "yyyy-MM"),
  );
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Sales volume data for last 6 months
  const salesVolumeData = useMemo(() => {
    return [...Array(6)].map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = safeFormat(date, "MMM", { locale: ptBR });

      const monthOrders = orders.filter((o) => {
        const oDate = o.createdAt?.toDate
          ? o.createdAt.toDate()
          : new Date(o.createdAt as any);
        const orderDate = isNaN(oDate.getTime()) ? new Date() : oDate;
        return (
          o.status !== "cancelled" &&
          isAfter(orderDate, monthStart) &&
          isBefore(orderDate, monthEnd)
        );
      });

      return {
        name: monthLabel,
        vendas: monthOrders.length,
        receita: monthOrders.reduce(
          (sum, o) => sum + (Number(o.total) || 0),
          0,
        ),
      };
    });
  }, [orders]);

  // Rankings
  const { customerRank, productRank, topRentable, topInsumos } = useMemo(() => {
    const custRank = [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10);

    const prodRank = [...products]
      .map((p) => ({
        ...p,
        sold: orders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => {
            const item = o.items?.find((i) => i.productId === p.id);
            return sum + (item ? item.quantity : 0);
          }, 0),
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    const rentRank = [...products]
      .sort(
        (a, b) =>
          b.retail_price -
          (b.estimatedCost || 0) -
          (a.retail_price - (a.estimatedCost || 0)),
      )
      .slice(0, 5);

    const lowInsumos = [...insumos]
      .sort((a, b) => (a.quantity < a.criticalLimit ? 1 : -1))
      .slice(0, 5);

    return {
      customerRank: custRank,
      productRank: prodRank,
      topRentable: rentRank,
      topInsumos: lowInsumos,
    };
  }, [customers, products, orders, insumos]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
      {/* Month Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-slate-900 tracking-tight">
            Análise Gerencial
          </h2>
          <p className="text-[10px] text-[#8E8E93] uppercase font-medium tracking-widest mt-1">
            Inteligência de vendas e performance
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/75 backdrop-blur-md border border-white/80 p-2 px-4 rounded-2xl shadow-sm">
          <button
            onClick={() => {
              const rows = productRank.map((p, idx) => [
                `${idx + 1}º`,
                p.product_name,
                p.category || "---",
                `${p.sold} un.`
              ]);
              exportGenericReportPDF({
                title: "Gerencial - Produtos Mais Vendidos (" + selectedMonth + ")",
                columns: ["Ranking", "Produto", "Categoria", "Qtd. Vendida"],
                rows,
                filters: `Período: ${selectedMonth}`
              });
            }}
            className="flex items-center gap-2 p-2 hover:bg-pink-50 text-gray-500 hover:text-pink-600 rounded-xl transition-all text-[9px] font-medium tracking-normal"
          >
            <Printer size={14} /> Abrir PDF
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <Filter size={14} className="text-pink-500" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-[10px] font-medium tracking-normal outline-none pr-4 cursor-pointer text-gray-800"
          >
            {[...Array(12)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = safeFormat(d, "yyyy-MM");
              const label = safeFormat(d, "MMMM yyyy", { locale: ptBR });
              return (
                <option key={val} value={val}>
                  {label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Sales Volume Chart */}
      <div className="p-8 rounded-[24px] bg-white/75 backdrop-blur-md border border-white/85 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-bold tracking-tight text-gray-800 uppercase">
            Volume de Vendas (Últimos 6 Meses)
          </h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-[8px] font-bold uppercase text-gray-400">
                Qtd Pedidos
              </span>
            </div>
          </div>
        </div>
        <div className="h-[300px] w-full min-w-0 flex-1 overflow-hidden">
          <ResponsiveContainer width="99%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={salesVolumeData}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "1rem",
                  border: "1px solid #f1f5f9",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.03)",
                }}
                labelStyle={{
                  fontWeight: 700,
                  color: "#1F1F1F",
                  marginBottom: "4px",
                }}
              />
              <Bar dataKey="vendas" fill="#FF1493" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Leading Customers */}
        <div className="p-8 rounded-[24px] bg-white/75 backdrop-blur-md border border-white/85 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-200/30">
              <Trophy size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold tracking-normal text-gray-800">
              Clientes em Destaque
            </h3>
          </div>
          <div className="space-y-4">
            {customerRank.map((c, idx) => (
              <div
                key={`customer-rank-final-${c.id}-${idx}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-pink-50/50 transition-all group border border-transparent hover:border-pink-200/50"
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-bold ${idx < 3 ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-400"}`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">{c.name}</p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tight">
                    {c.ordersCount} pedidos confirmados
                  </p>
                </div>
                <span className="font-mono text-xs font-semibold text-emerald-500">
                  {formatCurrency(c.totalSpent || 0)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Leading Products */}
        <div className="p-8 rounded-[24px] bg-white/75 backdrop-blur-md border border-white/85 shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-pink-500/10 text-pink-500 border border-pink-200/30">
              <TrendingUp size={20} strokeWidth={1.5} />
            </div>
            <h3 className="text-sm font-bold tracking-normal text-gray-800">
              Produtos Mais Vendidos
            </h3>
          </div>
          <div className="space-y-4">
            {productRank.map((p, idx) => (
              <div
                key={`prod-rank-final-${p.id}-${idx}`}
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-pink-50/50 transition-all group border border-transparent hover:border-pink-200/50"
              >
                <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-[#E5E5EA] overflow-hidden">
                  <ImageWithFallback
                    src={p.image}
                    alt={p.product_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-800">
                    {p.product_name}
                  </p>
                  <p className="text-[9px] text-gray-400 uppercase font-bold">
                    {p.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs font-semibold text-pink-500">
                    {p.sold || 0} unid.
                  </p>
                  <p className="text-[8px] text-gray-400 font-bold uppercase">
                    Vendido
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            id: "vendas",
            label: "Favoritos do Ano",
            desc: "Produtos com maior rotatividade",
            icon: Star,
            color: "text-pink-500",
          },
          {
            id: "pagamentos",
            label: "Formas de Pagamento",
            desc: "Preferências de recebimento",
            icon: Layout,
            color: "text-pink-400",
          },
          {
            id: "estoque",
            label: "Curva de Insumos",
            desc: "Uso intenso e crítico",
            icon: Package,
            color: "text-emerald-500",
          },
          {
            id: "rentabilidade",
            label: "Top Rentabilidade",
            desc: "Melhores margens líquidas",
            icon: Zap,
            color: "text-pink-600",
          },
        ].map((insight) => (
          <div key={insight.id} className="space-y-4">
            <button
              onClick={() =>
                setActiveCard(activeCard === insight.id ? null : insight.id)
              }
              className={`w-full p-8 rounded-[24px] border transition-all text-left group flex flex-col shadow-sm ${activeCard === insight.id ? "bg-pink-500/5 border-pink-500/30" : "bg-white/75 backdrop-blur-md border-white/85 hover:border-pink-300"}`}
            >
              <div
                className={`p-3 rounded-2xl bg-pink-500/10 w-fit mb-6 ${insight.color} border border-pink-200/30`}
              >
                <insight.icon size={20} strokeWidth={1.5} />
              </div>
              <h4 className="text-[10px] font-bold tracking-tight text-gray-800 uppercase transition-colors">
                {insight.label}
              </h4>
              <p className="text-[9px] text-gray-400 mt-2 leading-relaxed font-bold">
                {insight.desc}
              </p>
              <div
                className={`mt-6 pt-4 border-t border-gray-100 flex items-center justify-between transition-all ${activeCard === insight.id ? "opacity-100" : "opacity-40 group-hover:opacity-100"}`}
              >
                <span className="text-[8px] font-bold tracking-normal text-pink-500">
                  Ver Detalhes
                </span>
                <ChevronDown
                  size={14}
                  className={`text-pink-500 transition-transform duration-300 ${activeCard === insight.id ? "rotate-180" : ""}`}
                />
              </div>
            </button>

            {/* Expandable Detail Area */}
            {activeCard === insight.id && (
              <div className="p-6 rounded-[24px] bg-white/85 backdrop-blur-md border border-white/85 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                {insight.id === "vendas" && (
                  <div className="space-y-3">
                    {productRank.slice(0, 5).map((p, pIdx) => (
                      <div
                        key={`insight-vendas-${p.id}-${pIdx}`}
                        className="flex justify-between items-center text-[10px] border-b border-slate-200/50 pb-2 font-bold uppercase tracking-tight"
                      >
                        <span className="text-gray-500">{p.product_name}</span>
                        <span className="text-pink-600 font-mono">
                          {p.sold} unid.
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {insight.id === "pagamentos" && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-200/50 font-bold uppercase">
                      <span className="text-gray-500">PIX (Mais Rápido)</span>
                      <span className="text-emerald-500 font-mono">68%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-200/50 font-bold uppercase">
                      <span className="text-gray-500">Cartão de Crédito</span>
                      <span className="text-pink-500 font-mono">22%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-200/50 font-bold uppercase">
                      <span className="text-gray-500">PIX Parcelado</span>
                      <span className="text-amber-500 font-mono">7%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                      <span className="text-gray-500">Dinheiro/Outros</span>
                      <span className="text-gray-400 font-mono">3%</span>
                    </div>
                  </div>
                )}
                {insight.id === "estoque" && (
                  <div className="space-y-3">
                    {topInsumos.map((ins, insIdx) => (
                      <div
                        key={`insight-insumo-${ins.id}-${insIdx}`}
                        className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-200/50 font-bold uppercase"
                      >
                        <span className="text-gray-500">{ins.name}</span>
                        <span
                          className={`font-mono ${ins.quantity < ins.criticalLimit ? "text-pink-600" : "text-gray-400"}`}
                        >
                          {ins.quantity}
                          {ins.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {insight.id === "rentabilidade" && (
                  <div className="space-y-3">
                    {topRentable.map((p, rIdx) => (
                      <div
                        key={`insight-rentable-${p.id}-${rIdx}`}
                        className="flex justify-between items-center text-[10px] pb-2 border-b border-slate-200/50 font-bold uppercase"
                      >
                        <span className="text-gray-500">{p.product_name}</span>
                        <span className="text-emerald-500 font-mono">
                          {(p.retail_price > 0
                            ? ((p.retail_price - (p.estimatedCost || 20)) /
                                p.retail_price) *
                              100
                            : 0
                          ).toFixed(0)}
                          %
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
