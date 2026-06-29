import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  Percent,
  Package,
  Sparkles,
  Lightbulb,
  Compass,
  Layers,
  Search,
  ArrowUpRight,
  ChevronRight,
  Filter,
  X,
  CheckCircle,
  Copy,
  Clock,
  ArrowRight,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { FinanceEntry, CompanyId, Order, SiteSettings, Product, Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import {
  subscribeToFinance,
  getGlobalSettings,
  saveMonthlyProfitHistory,
  subscribeToMonthlyProfitHistory,
} from "../../services/firebaseService";
import { format, subMonths, isSameMonth, isSameDay, isSameYear, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFinanceReportPDF } from "../../utils/pdfGenerator";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface FinanceTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  companyId,
  orders,
  products,
  insumos,
}) => {
  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"hoje" | "7dias" | "30dias" | "mes" | "ano" | "todos" | "personalizado">("mes");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<"all" | "paid" | "pending" | "cancelled">("all");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"all" | "pix" | "credit_card" | "digital_booklet" | "other">("all");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  
  // Selected order for sidebar details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);

  // Parse safety helper
  const parseOrderDate = (o: Order): Date => {
    if (!o.createdAt) return new Date();
    if (typeof o.createdAt.toDate === "function") {
      return o.createdAt.toDate();
    }
    if (o.createdAt.seconds) {
      return new Date(o.createdAt.seconds * 1000);
    }
    return new Date(o.createdAt);
  };

  // Helper to compute cost for an individual order
  const getOrderCost = (order: Order) => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((sum, item) => {
      let cost = item.estimatedCost;
      if (cost === undefined || cost === null || cost === 0) {
        const prod = products.find(p => p.id === (item.productId || item.id));
        if (prod && prod.estimatedCost !== undefined && prod.estimatedCost !== null && prod.estimatedCost > 0) {
          cost = prod.estimatedCost;
        } else {
          // Fallback: 35% of the price
          const itemPrice = item.current_price || item.retail_price || 0;
          cost = itemPrice * 0.35;
        }
      }
      return sum + (cost * (item.quantity || 1));
    }, 0);
  };

  // Filter orders by active companyId prop
  const companyOrders = useMemo(() => {
    if ((companyId as string) === "all") return orders;
    return orders.filter(o => o.companyId === companyId);
  }, [orders, companyId]);

  // General KPIs (Calculated from all company orders)
  const today = new Date();
  
  const kpis = useMemo(() => {
    let faturamentoHoje = 0;
    let faturamentoMes = 0;
    let faturamentoAno = 0;
    let totalPaidValue = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalCostPaid = 0;

    companyOrders.forEach(o => {
      const oDate = parseOrderDate(o);
      const oTotal = Number(o.total) || 0;
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";

      if (isPaid) {
        paidCount++;
        totalPaidValue += oTotal;
        totalCostPaid += getOrderCost(o);

        if (isSameDay(oDate, today)) {
          faturamentoHoje += oTotal;
        }
        if (isSameMonth(oDate, today)) {
          faturamentoMes += oTotal;
        }
        if (isSameYear(oDate, today)) {
          faturamentoAno += oTotal;
        }
      } else if (isCancelled) {
        cancelledCount++;
      } else {
        pendingCount++;
      }
    });

    const ticketMedio = paidCount > 0 ? totalPaidValue / paidCount : 0;
    const lucroEstimado = totalPaidValue - totalCostPaid;

    return {
      faturamentoHoje,
      faturamentoMes,
      faturamentoAno,
      ticketMedio,
      lucroEstimado,
      paidCount,
      pendingCount,
      cancelledCount,
    };
  }, [companyOrders, products]);

  // Filter and Search logic for the table list
  const filteredOrders = useMemo(() => {
    return companyOrders.filter(o => {
      const oDate = parseOrderDate(o);
      const oTotal = Number(o.total) || 0;
      
      // 1. Text Search (Order Number, Client Name, Product Name)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesCode = o.code?.toLowerCase().includes(term);
        const matchesClient = o.customerName?.toLowerCase().includes(term);
        const matchesProduct = o.items?.some(item => item.product_name?.toLowerCase().includes(term));
        if (!matchesCode && !matchesClient && !matchesProduct) {
          return false;
        }
      }

      // 2. Period Filter
      if (selectedPeriod === "hoje") {
        if (!isSameDay(oDate, today)) return false;
      } else if (selectedPeriod === "7dias") {
        const sevenDaysAgo = subDays(today, 7);
        if (oDate < sevenDaysAgo) return false;
      } else if (selectedPeriod === "30dias") {
        const thirtyDaysAgo = subDays(today, 30);
        if (oDate < thirtyDaysAgo) return false;
      } else if (selectedPeriod === "mes") {
        if (!isSameMonth(oDate, today)) return false;
      } else if (selectedPeriod === "ano") {
        if (!isSameYear(oDate, today)) return false;
      } else if (selectedPeriod === "personalizado") {
        if (customStartDate) {
          const start = startOfDay(new Date(customStartDate));
          if (oDate < start) return false;
        }
        if (customEndDate) {
          const end = endOfDay(new Date(customEndDate));
          if (oDate > end) return false;
        }
      }

      // 3. Payment Status Filter
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
      const isPending = !isPaid && !isCancelled;

      if (selectedPaymentStatus === "paid" && !isPaid) return false;
      if (selectedPaymentStatus === "pending" && !isPending) return false;
      if (selectedPaymentStatus === "cancelled" && !isCancelled) return false;

      // 4. Payment Method Filter
      const method = (o.plannedMethod || o.payment_method || "").toLowerCase();
      if (selectedPaymentMethod === "pix") {
        if (method.includes("credit") || method.includes("booklet") || o.plannedMethod === "credit_card" || o.plannedMethod === "digital_booklet") return false;
      } else if (selectedPaymentMethod === "credit_card") {
        if (o.plannedMethod !== "credit_card" && !method.includes("credit")) return false;
      } else if (selectedPaymentMethod === "digital_booklet") {
        if (o.plannedMethod !== "digital_booklet" && !method.includes("booklet")) return false;
      } else if (selectedPaymentMethod === "other") {
        if (o.plannedMethod === "credit_card" || o.plannedMethod === "digital_booklet" || method.includes("credit") || method.includes("booklet")) return false;
      }

      // 5. Value Range Filter
      if (minValue && oTotal < parseFloat(minValue)) return false;
      if (maxValue && oTotal > parseFloat(maxValue)) return false;

      return true;
    });
  }, [companyOrders, searchTerm, selectedPeriod, customStartDate, customEndDate, selectedPaymentStatus, selectedPaymentMethod, minValue, maxValue]);

  // Automatic Indicators Calculations
  const indicators = useMemo(() => {
    // A. Growth compared to the previous month (MoM)
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const prevMonthDate = subMonths(today, 1);
    
    let currentMonthRevenue = 0;
    let prevMonthRevenue = 0;

    companyOrders.forEach(o => {
      const oDate = parseOrderDate(o);
      const oTotal = Number(o.total) || 0;
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";

      if (isPaid) {
        if (isSameMonth(oDate, today)) {
          currentMonthRevenue += oTotal;
        } else if (isSameMonth(oDate, prevMonthDate)) {
          prevMonthRevenue += oTotal;
        }
      }
    });

    const growthMoM = prevMonthRevenue > 0 
      ? ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    // B. Most profitable products (Top 5)
    const productProfitMap: Record<string, { name: string; profit: number; count: number; revenue: number }> = {};
    companyOrders.forEach(o => {
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      if (!isPaid) return;

      o.items?.forEach(item => {
        const prodId = item.productId || item.id;
        const qty = item.quantity || 1;
        const itemPrice = item.current_price || item.retail_price || 0;
        const revenue = itemPrice * qty;
        
        let cost = item.estimatedCost;
        if (cost === undefined || cost === null || cost === 0) {
          const originalProd = products.find(p => p.id === prodId);
          cost = (originalProd && originalProd.estimatedCost) || (itemPrice * 0.35);
        }
        
        const profit = (itemPrice - cost) * qty;

        if (!productProfitMap[prodId]) {
          productProfitMap[prodId] = { name: item.product_name, profit: 0, count: 0, revenue: 0 };
        }
        productProfitMap[prodId].profit += profit;
        productProfitMap[prodId].count += qty;
        productProfitMap[prodId].revenue += revenue;
      });
    });

    const topProducts = Object.values(productProfitMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // C. Most profitable categories (Top 5)
    const categoryProfitMap: Record<string, { category: string; profit: number; revenue: number }> = {};
    companyOrders.forEach(o => {
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      if (!isPaid) return;

      o.items?.forEach(item => {
        const prodId = item.productId || item.id;
        const qty = item.quantity || 1;
        const itemPrice = item.current_price || item.retail_price || 0;
        const revenue = itemPrice * qty;
        
        const originalProd = products.find(p => p.id === prodId);
        const category = originalProd?.category || "Papelaria Fina";
        
        let cost = item.estimatedCost;
        if (cost === undefined || cost === null || cost === 0) {
          cost = (originalProd && originalProd.estimatedCost) || (itemPrice * 0.35);
        }
        
        const profit = (itemPrice - cost) * qty;

        if (!categoryProfitMap[category]) {
          categoryProfitMap[category] = { category, profit: 0, revenue: 0 };
        }
        categoryProfitMap[category].profit += profit;
        categoryProfitMap[category].revenue += revenue;
      });
    });

    const topCategories = Object.values(categoryProfitMap)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5);

    // D. Most used payment methods
    const paymentMethodsMap: Record<string, { label: string; count: number; totalValue: number }> = {};
    companyOrders.forEach(o => {
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      if (!isPaid) return;

      let methodLabel = "PIX / À Vista";
      if (o.plannedMethod === "credit_card") methodLabel = "Cartão de Crédito";
      else if (o.plannedMethod === "digital_booklet") methodLabel = "Carnê Digital";
      else if (o.payment_method === "planned") methodLabel = "Parcelado";

      if (!paymentMethodsMap[methodLabel]) {
        paymentMethodsMap[methodLabel] = { label: methodLabel, count: 0, totalValue: 0 };
      }
      paymentMethodsMap[methodLabel].count++;
      paymentMethodsMap[methodLabel].totalValue += Number(o.total) || 0;
    });

    const topPaymentMethods = Object.values(paymentMethodsMap)
      .sort((a, b) => b.count - a.count);

    return {
      currentMonthRevenue,
      prevMonthRevenue,
      growthMoM,
      topProducts,
      topCategories,
      topPaymentMethods,
    };
  }, [companyOrders, products]);

  // Export functions
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4"
    });

    // Premium Vitrine PDF layout
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor("#1C1C1E");
    doc.text("HISTÓRICO FINANCEIRO INTEGRAL", 15, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor("#8E8E93");
    doc.text(`Ateliê: ${companyId.toUpperCase()} | Filtros aplicados | Registros: ${filteredOrders.length}`, 15, 26);
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 282, 26, { align: "right" });

    doc.setDrawColor("#E5E5EA");
    doc.line(15, 30, 282, 30);

    const columns = [
      "Pedido",
      "Cliente",
      "Valor Bruto",
      "Valor Custo",
      "Lucro Est.",
      "Método",
      "Data",
      "Status"
    ];

    const rows = filteredOrders.map(o => {
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
      const statusLabel = isPaid ? "Pago" : isCancelled ? "Cancelado" : "Pendente";
      
      let methodLabel = "PIX / À Vista";
      if (o.plannedMethod === "credit_card") methodLabel = "Cartão de Crédito";
      else if (o.plannedMethod === "digital_booklet") methodLabel = "Carnê Digital";

      const cost = getOrderCost(o);
      const profit = (Number(o.total) || 0) - cost;

      return [
        `#${o.code || o.id.slice(0, 6)}`,
        o.customerName || "Não informado",
        formatCurrency(Number(o.total) || 0),
        formatCurrency(cost),
        formatCurrency(profit),
        methodLabel,
        format(parseOrderDate(o), "dd/MM/yyyy"),
        statusLabel
      ];
    });

    (doc as any).autoTable({
      startY: 36,
      head: [columns],
      body: rows,
      theme: 'grid',
      headStyles: {
        fillColor: '#F2F2F7',
        textColor: '#1C1C1E',
        fontStyle: 'bold',
        halign: 'left',
        lineWidth: 0.1,
        borderColor: '#E5E5EA'
      },
      bodyStyles: {
        textColor: '#2C2C2E',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: '#F8F9FA'
      },
      margin: { left: 15, right: 15 }
    });

    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const handleExportExcel = () => {
    const headers = ["Pedido", "Cliente", "Valor Bruto", "Valor de Custo", "Lucro Estimado", "Forma de Pagamento", "Data", "Status"];
    const rows = filteredOrders.map(o => {
      const cost = getOrderCost(o);
      const profit = (Number(o.total) || 0) - cost;
      
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
      const statusLabel = isPaid ? "Pago" : isCancelled ? "Cancelado" : "Pendente";

      let methodLabel = "PIX / À Vista";
      if (o.plannedMethod === "credit_card") methodLabel = "Cartão de Crédito";
      else if (o.plannedMethod === "digital_booklet") methodLabel = "Carnê Digital";

      return [
        `#${o.code}`,
        o.customerName || "Anônimo",
        (Number(o.total) || 0).toFixed(2).replace('.', ','),
        cost.toFixed(2).replace('.', ','),
        profit.toFixed(2).replace('.', ','),
        methodLabel,
        format(parseOrderDate(o), "dd/MM/yyyy"),
        statusLabel
      ];
    });
    
    const csvContent = [
      headers.join(";"),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
    ].join("\r\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `Financeiro_Vitrine_${companyId}_${format(new Date(), "yyyyMMdd")}.csv`);
  };

  const handleCopyOrderId = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedOrderId(code);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  return (
    <div className="space-y-8 pb-24 bg-[#F8F9FA] min-h-screen px-6 py-8 md:px-8 relative overflow-hidden">
      
      {/* AREA 1: Cabeçalho (Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E5EA] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Módulo Admin</span>
            <span className="text-[#8E8E93] text-xs font-medium">|</span>
            <span className="text-slate-500 text-xs font-medium tracking-tight">Gestão de Performance Operacional</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#1C1C1E] uppercase font-sans">
            Financeiro <span className="font-light text-[#8E8E93]">Vitrine</span>
          </h1>
          <p className="text-[#8E8E93] text-sm font-medium tracking-normal mt-1 leading-relaxed max-w-xl">
            Acompanhe o faturamento, ticket médio, lucros reais estimados e indicadores analíticos do seu ateliê em tempo real.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Clear 3D button for Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all duration-200 border shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
              showFilters 
                ? "bg-black text-white border-black hover:bg-black/90" 
                : "bg-white text-slate-800 border-[#E5E5EA] hover:bg-[#F2F2F7] active:translate-y-px active:shadow-sm"
            }`}
          >
            <Filter size={14} />
            <span>Filtros</span>
            { (selectedPeriod !== "mes" || selectedPaymentStatus !== "all" || selectedPaymentMethod !== "all" || searchTerm || minValue || maxValue) && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            )}
          </button>

          {/* Excel Export (Clear 3D Style) */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E5EA] text-slate-800 font-semibold text-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#F2F2F7] hover:shadow-md active:translate-y-px active:shadow-sm transition-all"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          {/* PDF Export (Clear 3D Style) */}
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E5E5EA] text-slate-800 font-semibold text-xs shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:bg-[#F2F2F7] hover:shadow-md active:translate-y-px active:shadow-sm transition-all"
          >
            <FileText size={15} className="text-indigo-600" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* FILTER EXPANSION DRAWER */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Periodo */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Período</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="hoje">Hoje</option>
                  <option value="7dias">Últimos 7 dias</option>
                  <option value="30dias">Últimos 30 dias</option>
                  <option value="mes">Este Mês</option>
                  <option value="ano">Este Ano</option>
                  <option value="todos">Todos</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              {/* Custom Dates if Personalized */}
              {selectedPeriod === "personalizado" && (
                <div className="flex gap-2 lg:col-span-1">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Início</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Fim</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Status do Pagamento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Status do Pagamento</label>
                <select
                  value={selectedPaymentStatus}
                  onChange={(e) => setSelectedPaymentStatus(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Todos os status</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              {/* Forma de Pagamento */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Forma de Pagamento</label>
                <select
                  value={selectedPaymentMethod}
                  onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Todas as formas</option>
                  <option value="pix">PIX / À Vista</option>
                  <option value="credit_card">Cartão de Crédito</option>
                  <option value="digital_booklet">Carnê Digital</option>
                  <option value="other">Outra forma</option>
                </select>
              </div>

              {/* Faixa de Valor */}
              <div className="flex gap-2">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Valor Mín.</label>
                  <input
                    type="number"
                    placeholder="Min R$"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Valor Máx.</label>
                  <input
                    type="number"
                    placeholder="Max R$"
                    value={maxValue}
                    onChange={(e) => setMaxValue(e.target.value)}
                    className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AREA 2: KPIs Financeiros */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        
        {/* Card 1: Faturamento Hoje */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Hoje</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800 font-sans truncate">{formatCurrency(kpis.faturamentoHoje)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Faturamento Hoje</p>
        </div>

        {/* Card 2: Faturamento do Mês */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Este Mês</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800 font-sans truncate">{formatCurrency(kpis.faturamentoMes)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Faturamento Mês</p>
        </div>

        {/* Card 3: Faturamento do Ano */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Este Ano</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Activity size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800 font-sans truncate">{formatCurrency(kpis.faturamentoAno)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Faturamento Ano</p>
        </div>

        {/* Card 4: Ticket Médio */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Média</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Percent size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-slate-800 font-sans truncate">{formatCurrency(kpis.ticketMedio)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Ticket Médio</p>
        </div>

        {/* Card 5: Lucro Estimado */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all col-span-1 md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Lucratividade</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-indigo-700 font-sans truncate">{formatCurrency(kpis.lucroEstimado)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Lucro Líquido Estimado</p>
        </div>

        {/* Card 6: Pedidos Pagos */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Quitados</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-emerald-600 font-sans truncate">{kpis.paidCount}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Vendas Pagas</p>
        </div>

        {/* Card 7: Pedidos Pendentes */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Pendentes</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Clock size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-amber-600 font-sans truncate">{kpis.pendingCount}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Aguardando Pagamento</p>
        </div>

        {/* Card 8: Pedidos Cancelados */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Cancelados</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <XCircle size={13} />
            </div>
          </div>
          <p className="text-lg font-bold text-red-600 font-sans truncate">{kpis.cancelledCount}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Cancelados</p>
        </div>

      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* AREA 3: Histórico Financeiro & Busca (Colspan 3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-[#E5E5EA] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <h3 className="font-sans font-semibold text-slate-800 text-sm uppercase tracking-wide">Pedidos do Período ({filteredOrders.length})</h3>
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Número do pedido, cliente ou produto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F2F2F7] border border-transparent rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    <th className="py-4 px-6">Código</th>
                    <th className="py-4 px-4">Cliente</th>
                    <th className="py-4 px-4 text-right">Valor Bruto</th>
                    <th className="py-4 px-4 text-right">Custo</th>
                    <th className="py-4 px-4 text-right">Lucro Est.</th>
                    <th className="py-4 px-4">Pagamento</th>
                    <th className="py-4 px-4 text-right">Data</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((o) => {
                      const cost = getOrderCost(o);
                      const profit = (Number(o.total) || 0) - cost;
                      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
                      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
                      const statusColor = isPaid 
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-100" 
                        : isCancelled 
                          ? "text-red-700 bg-red-50 border border-red-100" 
                          : "text-amber-700 bg-amber-50 border border-amber-100";

                      let methodLabel = "PIX / À Vista";
                      if (o.plannedMethod === "credit_card") methodLabel = "Cartão de Crédito";
                      else if (o.plannedMethod === "digital_booklet") methodLabel = "Carnê Digital";

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          className={`hover:bg-[#F2F2F7]/50 cursor-pointer transition-all duration-150 ${selectedOrder?.id === o.id ? "bg-indigo-50/20" : ""}`}
                        >
                          <td className="py-4 px-6 text-xs font-semibold text-indigo-600 font-mono">
                            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <span>#{o.code}</span>
                              <button 
                                onClick={() => handleCopyOrderId(o.code)}
                                className="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition-colors"
                                title="Copiar código do pedido"
                              >
                                {copiedOrderId === o.code ? (
                                  <span className="text-[9px] text-emerald-600 font-sans">Copiado</span>
                                ) : (
                                  <Copy size={11} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-xs font-semibold text-[#1C1C1E] truncate max-w-[120px]" title={o.customerName}>
                            {o.customerName || "Anônimo"}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-[#1C1C1E] text-right font-sans">
                            {formatCurrency(Number(o.total) || 0)}
                          </td>
                          <td className="py-4 px-4 text-xs font-medium text-slate-500 text-right font-sans">
                            {formatCurrency(cost)}
                          </td>
                          <td className={`py-4 px-4 text-xs font-bold text-right font-sans ${profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {formatCurrency(profit)}
                          </td>
                          <td className="py-4 px-4 text-[11px] font-medium text-slate-600">
                            {methodLabel}
                          </td>
                          <td className="py-4 px-4 text-xs text-slate-500 text-right font-sans">
                            {format(parseOrderDate(o), "dd/MM/yyyy")}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                              {isPaid ? "Pago" : isCancelled ? "Cancelado" : "Pendente"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* INDICATORS & INSIGHTS (Colspan 2/5) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-4">
              <h3 className="font-sans font-semibold text-slate-800 text-sm uppercase tracking-wide">Indicadores Operacionais</h3>
              <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            </div>

            {/* Indicator 1: MoM Growth */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E5E5EA]/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Crescimento MoM</span>
                <p className="text-sm font-semibold text-[#1C1C1E] mt-1">Este mês vs Mês Anterior</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-medium text-slate-500">Mês anterior:</span>
                  <span className="text-[10px] font-semibold text-slate-700">{formatCurrency(indicators.prevMonthRevenue)}</span>
                </div>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  indicators.growthMoM >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                }`}>
                  {indicators.growthMoM >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  <span>{indicators.growthMoM.toFixed(1)}%</span>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">Mês atual: {formatCurrency(indicators.currentMonthRevenue)}</p>
              </div>
            </div>

            {/* Indicator 2: Most Profitable Products */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Produtos Mais Lucrativos</h4>
              <div className="space-y-3">
                {indicators.topProducts.length > 0 ? (
                  indicators.topProducts.map((p, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{p.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-medium text-slate-500">{p.count} un</span>
                          <span className="font-bold text-emerald-600">{formatCurrency(p.profit)}</span>
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full" 
                          style={{ width: `${Math.min(100, (p.profit / (indicators.topProducts[0]?.profit || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Nenhum produto faturado no período.</p>
                )}
              </div>
            </div>

            {/* Indicator 3: Most Profitable Categories */}
            <div className="space-y-3 border-t border-[#E5E5EA] pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Categorias Mais Lucrativas</h4>
              <div className="space-y-3">
                {indicators.topCategories.length > 0 ? (
                  indicators.topCategories.map((c, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-800">{c.category}</span>
                        <span className="font-bold text-indigo-600">{formatCurrency(c.profit)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-purple-600 rounded-full" 
                          style={{ width: `${Math.min(100, (c.profit / (indicators.topCategories[0]?.profit || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Nenhuma categoria registrada.</p>
                )}
              </div>
            </div>

            {/* Indicator 4: Most Used Payment Methods */}
            <div className="space-y-3 border-t border-[#E5E5EA] pt-4">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E93]">Métodos de Pagamento</h4>
              <div className="space-y-2.5">
                {indicators.topPaymentMethods.length > 0 ? (
                  indicators.topPaymentMethods.map((pm, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-xl border border-transparent hover:border-[#E5E5EA] transition-all">
                      <span className="font-semibold text-slate-700">{pm.label}</span>
                      <div className="text-right">
                        <span className="font-bold text-slate-800 block">{formatCurrency(pm.totalValue)}</span>
                        <span className="text-[9px] font-semibold text-slate-400">{pm.count} vendas</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Sem registros de pagamento.</p>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* AREA 4: PAINEL LATERAL DE DETALHES (Sidebar Drawer) */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-start bg-[#F8F9FA]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded font-mono">#{selectedOrder.code}</span>
                    <span className="text-[10px] text-[#8E8E93] font-semibold">{format(parseOrderDate(selectedOrder), "dd/MM/yyyy HH:mm")}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedOrder.customerName || "Cliente não informado"}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.contact || "Sem telefone cadastrado"}</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                
                {/* 1. Resumo Financeiro */}
                <div className="space-y-3 bg-[#F2F2F7]/50 p-4 rounded-2xl border border-[#E5E5EA]/60">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Resumo Financeiro</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Valor Total Bruto:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    {selectedOrder.hasSignal && (
                      <>
                        <div className="flex justify-between text-emerald-600">
                          <span className="font-medium">Sinal Pago:</span>
                          <span className="font-bold">{formatCurrency(selectedOrder.signalValue || 0)}</span>
                        </div>
                        <div className="flex justify-between text-amber-600">
                          <span className="font-medium">Saldo Pendente:</span>
                          <span className="font-bold">{formatCurrency(Math.max(0, selectedOrder.total - (selectedOrder.signalValue || 0)))}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Produtos Vendidos */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Produtos Vendidos</h4>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => {
                      const itemPrice = item.current_price || item.retail_price || 0;
                      let itemCost = item.estimatedCost;
                      if (itemCost === undefined || itemCost === null || itemCost === 0) {
                        const original = products.find(p => p.id === (item.productId || item.id));
                        itemCost = (original && original.estimatedCost) || (itemPrice * 0.35);
                      }
                      const itemProfit = itemPrice - itemCost;
                      const itemMargin = itemPrice > 0 ? (itemProfit / itemPrice) * 100 : 0;

                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white border border-[#E5E5EA] rounded-xl shadow-sm text-xs">
                          <div>
                            <span className="font-bold text-slate-800 block truncate max-w-[180px]">{item.product_name}</span>
                            <span className="text-[10px] text-[#8E8E93] font-semibold mt-0.5 block">{item.quantity} un x {formatCurrency(itemPrice)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-slate-800 block">{formatCurrency(itemPrice * item.quantity)}</span>
                            <span className="text-[9px] text-emerald-600 font-semibold block">Margem {itemMargin.toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Custos Envolvidos & Lucro Estimado */}
                <div className="space-y-3 bg-indigo-50/10 p-4 rounded-2xl border border-indigo-100/40">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 border-b border-indigo-100/50 pb-1.5">Custos e Rentabilidade</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Custos de Produção (Estimado):</span>
                      <span className="font-bold text-slate-700">- {formatCurrency(getOrderCost(selectedOrder))}</span>
                    </div>
                    {selectedOrder.shippingCost ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Custo de Frete / Entrega:</span>
                        <span className="font-bold text-slate-700">- {formatCurrency(selectedOrder.shippingCost)}</span>
                      </div>
                    ) : null}
                    {selectedOrder.marketplaceTax ? (
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Comissão Marketplace ({selectedOrder.marketplaceTax}%):</span>
                        <span className="font-bold text-slate-700">- {formatCurrency(selectedOrder.total * (selectedOrder.marketplaceTax / 100))}</span>
                      </div>
                    ) : null}
                    
                    <div className="border-t border-[#E5E5EA] pt-2.5 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-indigo-700 block">LUCRO ESTIMADO</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Excluindo frete</span>
                      </div>
                      <span className="text-lg font-bold text-indigo-700">
                        {formatCurrency(selectedOrder.total - getOrderCost(selectedOrder))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Forma de Pagamento & Data */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#F2F2F7]/50 rounded-xl border border-[#E5E5EA]/60 text-xs">
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase block">Forma de Pagamento</span>
                    <span className="font-bold text-slate-800 block mt-1">
                      {selectedOrder.plannedMethod === "credit_card" ? "Cartão de Crédito" : selectedOrder.plannedMethod === "digital_booklet" ? "Carnê Digital" : "PIX / À Vista"}
                    </span>
                  </div>
                  <div className="p-3 bg-[#F2F2F7]/50 rounded-xl border border-[#E5E5EA]/60 text-xs">
                    <span className="text-[9px] font-bold text-[#8E8E93] uppercase block">Data da Venda</span>
                    <span className="font-bold text-slate-800 block mt-1">
                      {format(parseOrderDate(selectedOrder), "dd/MM/yyyy")}
                    </span>
                  </div>
                </div>

                {/* 5. Histórico do Pedido (Transições de Status) */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Histórico do Pedido</h4>
                  <div className="relative pl-4 border-l-2 border-slate-200 ml-2 space-y-4 text-xs">
                    {selectedOrder.history && selectedOrder.history.length > 0 ? (
                      selectedOrder.history.map((h, hIdx) => {
                        let hDate = new Date();
                        if (h.timestamp) {
                          if (typeof h.timestamp.toDate === "function") hDate = h.timestamp.toDate();
                          else if (h.timestamp.seconds) hDate = new Date(h.timestamp.seconds * 1000);
                          else hDate = new Date(h.timestamp);
                        }
                        return (
                          <div key={hIdx} className="relative">
                            {/* Dot indicator */}
                            <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 border-2 border-white"></div>
                            <div className="flex justify-between">
                              <span className="font-bold text-slate-700 uppercase tracking-tight">{h.status}</span>
                              <span className="text-[10px] text-slate-400">{format(hDate, "dd/MM/yy HH:mm")}</span>
                            </div>
                            {h.notes && <p className="text-[11px] text-slate-500 mt-0.5">{h.notes}</p>}
                          </div>
                        );
                      })
                    ) : (
                      <div className="relative">
                        <div className="absolute -left-[23px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-400 border-2 border-white"></div>
                        <span className="font-bold text-slate-500 uppercase tracking-tight">Criado</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">Pedido criado e registrado no sistema.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
