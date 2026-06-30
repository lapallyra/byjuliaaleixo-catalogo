import React, { useState, useMemo } from "react";
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Filter,
  BarChart3,
  Package,
  ShoppingBag,
  Activity,
  ChevronRight
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Order, Product, Componente } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";

interface FinanceTabProps {
  orders: Order[];
  products: Product[];
  componentes: Componente[];
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  orders,
  products,
  componentes,
}) => {
  const [dateFilter, setDateFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    // Basic filtering logic (can be expanded)
    return orders.filter(o => o.status === "fully_paid" || o.status === "paid" || o.status === "ready" || o.status === "delivered");
  }, [orders]);

  // Consolidate all financial calculations
  const { financials, productRanking, insumosImpact, chartData } = useMemo(() => {
    let totalRevenue = 0;
    let totalCost = 0;
    const pRank: Record<string, { name: string; qty: number; revenue: number; cost: number }> = {};
    const iImpact: Record<string, { name: string; unitCost: number; qty: number; totalCost: number }> = {};
    const monthlyData: Record<string, { faturamento: number; custo: number }> = {};

    filteredOrders.forEach((order) => {
      const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
      if (!monthlyData[monthKey]) monthlyData[monthKey] = { faturamento: 0, custo: 0 };

      const revenue = order.total || 0;
      totalRevenue += revenue;
      monthlyData[monthKey].faturamento += revenue;

      order.items.forEach((item) => {
        const product = products.find((p) => p.id === item.productId || p.id === item.id);
        if (product) {
          const qty = item.quantity || 1;
          const itemRevenue = (item.price || 0) * qty;
          const itemCost = calculateProductCost(product, componentes) * qty;
          
          totalCost += itemCost;
          monthlyData[monthKey].custo += itemCost;
          
          if (!pRank[product.id]) pRank[product.id] = { name: product.product_name, qty: 0, revenue: 0, cost: 0 };
          pRank[product.id].qty += qty;
          pRank[product.id].revenue += itemRevenue;
          pRank[product.id].cost += itemCost;

          product.insumos?.forEach(insumoItem => {
              const comp = componentes.find(c => c.id === insumoItem.insumoId);
              if (comp) {
                  const usedQty = insumoItem.quantity * qty;
                  if (!iImpact[comp.id]) iImpact[comp.id] = { name: comp.name, unitCost: comp.unitCost || 0, qty: 0, totalCost: 0 };
                  iImpact[comp.id].qty += usedQty;
                  iImpact[comp.id].totalCost += usedQty * (comp.unitCost || 0);
              }
          });
        }
      });
    });

    const profit = totalRevenue - totalCost;
    const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    const productRanking = Object.values(pRank)
        .map(p => ({ ...p, profit: p.revenue - p.cost, margin: p.revenue > 0 ? ((p.revenue - p.cost) / p.revenue) * 100 : 0 }))
        .sort((a, b) => b.profit - a.profit);
    
    const insumosImpact = Object.values(iImpact)
        .sort((a, b) => b.totalCost - a.totalCost);

    const chartData = Object.entries(monthlyData)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime());

    return { financials: { revenue: totalRevenue, cost: totalCost, profit, margin }, productRanking, insumosImpact, chartData };
  }, [filteredOrders, products, componentes]);

  const kpis = [
    { label: "Faturamento Total", value: formatCurrency(financials.revenue), color: "text-slate-900" },
    { label: "Custo de Produção", value: formatCurrency(financials.cost), color: "text-rose-600" },
    { label: "Lucro Total", value: formatCurrency(financials.profit), color: "text-emerald-600" },
    { label: "Margem Média (%)", value: `${financials.margin.toFixed(1)}%`, color: "text-sky-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Financeiro</h2>
          <p className="text-sm text-slate-500">Visão real de lucro e performance do ateliê.</p>
        </div>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-800 outline-none"
        >
          <option value="all">Todo o período</option>
          <option value="last30">Últimos 30 dias</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{kpi.label}</span>
            <span className={`text-2xl font-extrabold ${kpi.color}`}>{kpi.value}</span>
          </div>
        ))}
      </div>

      {/* Dashboard de Lucro & Comparativo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Comparativo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Comparativo de Períodos</h3>
            {/* Logic for comparison ... */}
            <p className="text-xs text-slate-500">Funcionalidade de comparativo em desenvolvimento.</p>
        </div>

        {/* Fluxo de Caixa */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Fluxo de Caixa Estimado</h3>
             <div className="space-y-4">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Entradas (Pedidos pagos)</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(financials.revenue)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Saídas (Custos estimados)</span>
                    <span className="font-bold text-rose-600">{formatCurrency(financials.cost)}</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between font-bold">
                    <span>Saldo</span>
                    <span>{formatCurrency(financials.profit)}</span>
                </div>
            </div>
        </div>
      </div>
      
      {/* Lucro por Pedido */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
         <h3 className="p-6 text-sm font-bold text-slate-900 border-b border-slate-100">Lucro por Pedido</h3>
         <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="p-4 text-left">Pedido</th>
                        <th className="p-4 text-left">Cliente</th>
                        <th className="p-4 text-right">Receita</th>
                        <th className="p-4 text-right">Custo</th>
                        <th className="p-4 text-right">Lucro</th>
                        <th className="p-4 text-right">Margem</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map(order => {
                        const revenue = order.total || 0;
                        let cost = 0;
                        order.items.forEach(item => {
                             const product = products.find(p => p.id === item.productId || p.id === item.id);
                             if (product) cost += calculateProductCost(product, componentes) * (item.quantity || 1);
                        });
                        const profit = revenue - cost;
                        const margin = revenue > 0 ? (profit/revenue) * 100 : 0;
                        return (
                            <tr key={order.id} className="border-t border-slate-100">
                                <td className="p-4 font-bold">{order.code || order.id.slice(-4)}</td>
                                <td className="p-4">{order.customerName || "N/A"}</td>
                                <td className="p-4 text-right">{formatCurrency(revenue)}</td>
                                <td className="p-4 text-right">{formatCurrency(cost)}</td>
                                <td className={`p-4 text-right font-bold ${profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(profit)}</td>
                                <td className="p-4 text-right">{margin.toFixed(1)}%</td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
         </div>
      </div>

      {/* Listas Detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="p-6 text-sm font-bold text-slate-900 border-b border-slate-100">Produtos Mais Lucrativos</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="p-4 text-left">Produto</th>
                        <th className="p-4 text-right">Qtd</th>
                        <th className="p-4 text-right">Lucro</th>
                    </tr>
                </thead>
                <tbody>
                    {productRanking.slice(0, 5).map((p, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                            <td className="p-4 font-bold">{p.name}</td>
                            <td className="p-4 text-right">{p.qty}</td>
                            <td className="p-4 text-right text-emerald-600 font-bold">{formatCurrency(p.profit)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <h3 className="p-6 text-sm font-bold text-slate-900 border-b border-slate-100">Insumos Mais Impactantes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 text-slate-500">
                        <th className="p-4 text-left">Insumo</th>
                        <th className="p-4 text-right">Custo Total</th>
                    </tr>
                </thead>
                <tbody>
                    {insumosImpact.slice(0, 5).map((i, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                            <td className="p-4 font-bold">{i.name}</td>
                            <td className="p-4 text-right text-rose-600 font-bold">{formatCurrency(i.totalCost)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
