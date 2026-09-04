import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  ChevronRight,
  X,
  Search,
  Plus,
  Trash2,
  Calendar,
  Check,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Layers,
  FileText,
  Clock,
  Eye,
  Settings,
  ShieldAlert,
  Target,
  Edit2,
  TrendingDown,
  Info,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Order, Product, Componente, CompanyId, FinanceEntry, AuditLog } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";
import { safeFormatISO } from "../../lib/dateUtils";
import { matchesAtelierScope } from "../../services/atelierScopePolicy";
import {
  subscribeToFinance,
  createFinanceEntry,
  deleteFinanceEntry,
  updateFinanceEntry,
  updateOrder,
  subscribeToAuditLogs,
} from "../../services/firebaseService";

interface FinanceTabProps {
  auditLogs: AuditLog[];
  orders: Order[];
  products: Product[];
  componentes: Componente[];
  companyId: CompanyId;
}

export const FinanceTab: React.FC<FinanceTabProps> = React.memo(({
  auditLogs: initialAuditLogs,
  orders,
  products,
  componentes,
  companyId,
}) => {
  // Database subscriptions state
  const [financeEntries, setFinanceEntries] = useState<FinanceEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [loadingEntries, setLoadingEntries] = useState(true);

  // Filter States
  const [dateFilter, setDateFilter] = useState<string>("month"); // default to this month
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [originFilter, setOriginFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Local storage for goals
  const [monthlyGoal, setMonthlyGoal] = useState<number>(() => {
    const saved = localStorage.getItem("finance_monthly_goal");
    return saved ? parseFloat(saved) : 15000;
  });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInputVal, setGoalInputVal] = useState<string>(monthlyGoal.toString());

  // Drawer / Details & Modals state
  const [selectedItem, setSelectedItem] = useState<(FinanceEntry & { customerName?: string; code?: string; user?: string }) | null>(null);
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetOrder, setPaymentTargetOrder] = useState<Order | null>(null);

  // New entry form state
  const [newEntryType, setNewEntryType] = useState<"revenue" | "expense">("revenue");
  const [newEntryValue, setNewEntryValue] = useState<string>("");
  const [newEntryDesc, setNewEntryDesc] = useState<string>("");
  const [newEntryCategory, setNewEntryCategory] = useState<string>("Venda de Produto");
  const [newEntryDate, setNewEntryDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [newEntryStatus, setNewEntryStatus] = useState<"paid" | "pending">("paid");
  const [newEntryPaymentMethod, setNewEntryPaymentMethod] = useState<string>("pix");

  // Payment modal state
  const [paymentMethod, setPaymentMethod] = useState<string>("pix");
  const [paymentValue, setPaymentValue] = useState<string>("");
  const [paymentIsPartial, setPaymentIsPartial] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);

  useEffect(() => {
    if (isPaymentModalOpen) {
      setSelectedInstallments([]);
    }
  }, [isPaymentModalOpen]);

  // Subscriptions
  useEffect(() => {
    setLoadingEntries(true);
    const unsubFinance = subscribeToFinance((entries) => {
      setFinanceEntries(entries);
      setLoadingEntries(false);
    }, companyId);

    const unsubAudit = subscribeToAuditLogs((logs) => {
      setAuditLogs(logs);
    }, companyId);

    return () => {
      unsubFinance();
      unsubAudit();
    };
  }, [companyId]);

  // Unified Transaction List (Real database entries only)
  const unifiedTransactions = useMemo(() => {
    const list: (FinanceEntry & { customerName?: string; code?: string; user?: string })[] = [];

    // Find all orders that have ANY "Quitação de Parcela" (FIN-01)
    const ordersWithInstallments = new Set<string>();
    financeEntries.forEach((entry) => {
      if (entry.orderId && entry.category === "Quitação de Parcela") {
        ordersWithInstallments.add(entry.orderId);
      }
    });

    // Add real database entries
    financeEntries.forEach((entry) => {
      // Exclude "Venda de Produto" if the order has any "Quitação de Parcela" to prevent duplicates
      if (entry.orderId && entry.category === "Venda de Produto" && ordersWithInstallments.has(entry.orderId)) {
        return;
      }

      // Exclude ALL auto-generated "pending" entries linked to orders,
      // because pending amounts for orders are calculated directly via `pendingOrdersAmount`.
      // This prevents double counting in "Contas a Receber".
      if (entry.orderId && entry.status === "pending") {
        return;
      }

      const order = orders.find((o) => o.id === entry.orderId || o.code === entry.orderId);
      list.push({
        ...entry,
        customerName: order?.customerName || entry.description.split(" - ")[1] || "N/A",
        code: order?.code || entry.description.split(" ")[1] || "N/A",
        user: (entry as any).user || "Sistema",
      });
    });

    // Sort chronologically desc
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financeEntries, orders]);

  // Helper: check if a date is within selected filter range
  const isDateInFilter = (dateStr: string, filterType: string, customStart?: string, customEnd?: string) => {
    if (!dateStr) return false;
    
    // Parse using timezone-safe method to avoid offset errors
    const [yr, mo, dy] = dateStr.split("-").map(Number);
    const date = new Date(yr, mo - 1, dy, 12, 0, 0);
    const now = new Date();
    
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    
    switch (filterType) {
      case "today": {
        return date >= todayStart;
      }
      case "week": {
        const dayOfWeek = now.getDay();
        const weekStart = new Date(todayStart.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        return date >= weekStart;
      }
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        return date >= monthStart;
      }
      case "year": {
        const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        return date >= yearStart;
      }
      case "custom": {
        if (customStart && customEnd) {
          const [sYr, sMo, sDy] = customStart.split("-").map(Number);
          const [eYr, eMo, eDy] = customEnd.split("-").map(Number);
          const start = new Date(sYr, sMo - 1, sDy, 0, 0, 0);
          const end = new Date(eYr, eMo - 1, eDy, 23, 59, 59);
          return date >= start && date <= end;
        }
        return true;
      }
      default:
        return true;
    }
  };

  // Helper helper to categorize origin badges based on transaction traits
  const getOriginBadge = (t: any) => {
    const desc = (t.description || "").toLowerCase();
    const cat = (t.category || "").toLowerCase();
    if (cat.includes("produção") || desc.includes("produção")) return "Produção";
    if (t.orderId) return "Pedido";
    if (cat.includes("compra") || desc.includes("compra") || cat.includes("insumos")) return "Compra";
    if (t.user === "Sistema") return "Sistema";
    return "Manual";
  };

  // Filtered Orders for production-cost analysis within the filter range
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.status === "cancelled") return false;
      if (!matchesAtelierScope(o, companyId, 'pedidos')) return false;
      const dateObj = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const dateStr = dateObj instanceof Date && !isNaN(dateObj.getTime())
        ? dateObj.toISOString().split("T")[0]
        : "";
      if (dateFilter !== "all" && !isDateInFilter(dateStr, dateFilter, customStartDate, customEndDate)) {
        return false;
      }
      return true;
    });
  }, [orders, companyId, dateFilter, customStartDate, customEndDate]);

  // Consolidated Financial Calculations
  const calculations = useMemo(() => {
    // 1. Gross Revenue (Filtered period)
    const activeRevenues = unifiedTransactions.filter((t) => {
      if (t.type !== "revenue" || t.status !== "paid") return false;
      if (dateFilter !== "all" && !isDateInFilter(t.date, dateFilter, customStartDate, customEndDate)) return false;
      return true;
    });

    const filteredRevenues = activeRevenues;
    const totalGrossRevenue = filteredRevenues.reduce((sum, t) => sum + t.value, 0);

    // 2. Production Costs from Orders + Manual Expenses
    const totalProductionCosts = filteredOrders.reduce((sum, order) => {
      let orderCost = 0;
      order.items?.forEach((item) => {
        const product = products.find((p) => p.id === item.productId || p.id === item.id);
        if (product) {
          orderCost += calculateProductCost(product, componentes) * (item.quantity || 1);
        }
      });
      return sum + orderCost;
    }, 0);

    const totalManualExpenses = unifiedTransactions
      .filter((t) => {
        if (t.type !== "expense" || t.status !== "paid") return false;
        if (dateFilter !== "all" && !isDateInFilter(t.date, dateFilter, customStartDate, customEndDate)) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.value, 0);

    const totalCosts = totalProductionCosts + totalManualExpenses;

    // 3. Net Profit
    const netProfit = totalGrossRevenue - totalCosts;

    // 4. Margin
    const profitMargin = totalGrossRevenue > 0 ? (netProfit / totalGrossRevenue) * 100 : 0;

    // 5. Open Orders count
    const openOrdersCount = filteredOrders.filter((o) => !["delivered", "finalized"].includes(o.status)).length;

    // 6. Pending Receipts (Remaining unpaid amounts + Pending manual revenues)
    const pendingManualRevenues = unifiedTransactions
      .filter((t) => {
        if (t.type !== "revenue" || t.status !== "pending") return false;
        if (dateFilter !== "all" && !isDateInFilter(t.date, dateFilter, customStartDate, customEndDate)) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.value, 0);

    const pendingOrdersAmount = filteredOrders.reduce((sum, order) => {
      // Pedidos de investimento não geram contas a receber
      if (order.operationType === 'investment') return sum;
      
      const sub = order.items?.reduce((s, i) => s + ((i.retail_price || i.current_price || 0) * (i.quantity || 1)), 0) || 0;
      const tot = order.total || sub;
      const paid = order.hasSignal 
        ? (typeof order.signalValue === 'number' ? order.signalValue : (sub * 0.5)) 
        : (order.paymentStatus === "paid" || order.status === "fully_paid" ? tot : 0);
      return sum + Math.max(0, tot - paid);
    }, 0);

    const totalPendingReceipts = pendingManualRevenues + pendingOrdersAmount;

    // Accumulated over all history for indicators
    const allPaidRevenues = unifiedTransactions.filter((t) => t.type === "revenue" && t.status === "paid");
    const deduplicatedHistoryRevenue = allPaidRevenues;
    const historyRevenue = deduplicatedHistoryRevenue.reduce((sum, t) => sum + t.value, 0);

    const historyExpenses = unifiedTransactions
      .filter((t) => t.type === "expense" && t.status === "paid")
      .reduce((sum, t) => sum + t.value, 0);

    const historyProfit = historyRevenue - historyExpenses;

    return {
      revenue: totalGrossRevenue,
      costs: totalCosts,
      profit: netProfit,
      margin: profitMargin,
      openOrders: openOrdersCount,
      pendingReceipts: totalPendingReceipts,
      accumulatedRevenue: historyRevenue,
      accumulatedProfit: historyProfit,
    };
  }, [unifiedTransactions, filteredOrders, products, componentes, dateFilter, customStartDate, customEndDate]);

  // Executive Metrics (Ticket, lucrativos etc.)
  const executiveMetrics = useMemo(() => {
    // Ticket Médio (Revenue / Paid orders count)
    const paidOrders = filteredOrders.filter((o) => o.paymentStatus === "paid" || o.status === "fully_paid");
    const ticketMedio = paidOrders.length > 0 ? calculations.revenue / paidOrders.length : 0;

    // Average order size (All orders total value / all orders count)
    const avgOrderValue = filteredOrders.length > 0
      ? filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0) / filteredOrders.length
      : 0;

    // Most Profitable Product and Category
    const prodMap: Record<string, { name: string; profit: number; qty: number; category: string }> = {};
    const catMap: Record<string, { profit: number; revenue: number }> = {};

    filteredOrders.forEach((order) => {
      order.items?.forEach((item) => {
        const product = products.find((p) => p.id === item.productId || p.id === item.id);
        const qty = item.quantity || 1;
        const prodCost = product ? calculateProductCost(product, componentes) : 0;
        const prodPrice = item.price || item.retail_price || item.current_price || 0;
        const profit = (prodPrice - prodCost) * qty;
        const category = product?.category || "Outros";

        if (product) {
          if (!prodMap[product.id]) {
            prodMap[product.id] = { name: product.product_name, profit: 0, qty: 0, category };
          }
          prodMap[product.id].profit += profit;
          prodMap[product.id].qty += qty;
        }

        if (!catMap[category]) {
          catMap[category] = { profit: 0, revenue: 0 };
        }
        catMap[category].profit += profit;
        catMap[category].revenue += (prodPrice * qty);
      });
    });

    const productsSorted = Object.entries(prodMap)
      .map(([id, p]) => ({ id, ...p }))
      .sort((a, b) => b.profit - a.profit);

    const categoriesSorted = Object.entries(catMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.profit - a.profit);

    return {
      ticketMedio,
      avgOrderValue,
      mostProfitableProduct: productsSorted[0]?.name || "Nenhum",
      mostProfitableCategory: categoriesSorted[0]?.name || "Nenhuma",
    };
  }, [filteredOrders, products, componentes, calculations.revenue]);

  // Current Calendar Month's total revenue for the monthly goal
  const monthlyRevenueReached = useMemo(() => {
    const now = new Date();
    const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthlyRevenues = unifiedTransactions.filter((t) => t.type === "revenue" && t.status === "paid" && t.date.startsWith(prefix));
    const deduplicatedMonthly = monthlyRevenues;
    return deduplicatedMonthly.reduce((sum, t) => sum + t.value, 0);
  }, [unifiedTransactions]);

  // Save customized monthly goal
  const handleSaveGoal = () => {
    const parsed = parseFloat(goalInputVal);
    if (!isNaN(parsed) && parsed >= 0) {
      setMonthlyGoal(parsed);
      localStorage.setItem("finance_monthly_goal", parsed.toString());
      setIsEditingGoal(false);
    }
  };

  // Daily Summary Calculations (Inputs, Outputs, Net Profit of today, and general current balance)
  const dailySummary = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const entriesToday = unifiedTransactions.filter((t) => t.date === todayStr && t.status === "paid");

    const revenuesToday = entriesToday.filter((t) => t.type === "revenue");
    const deduplicatedToday = revenuesToday;
    const totalEntradas = deduplicatedToday.reduce((sum, t) => sum + t.value, 0);

    const totalSaidas = entriesToday
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.value, 0);

    return {
      entradas: totalEntradas,
      saidas: totalSaidas,
      lucro: totalEntradas - totalSaidas,
      saldo: calculations.accumulatedProfit,
    };
  }, [unifiedTransactions, calculations.accumulatedProfit]);

  // Executive Charts Data (Real historical progression)
  const chartData = useMemo(() => {
    const monthlyMap: Record<string, { month: string; Receita: number; Custos: number; Lucro: number; Pedidos: number }> = {};
    const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

    // Populate last 6 calendar months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      monthlyMap[label] = { month: label, Receita: 0, Custos: 0, Lucro: 0, Pedidos: 0 };
    }

    // Deduplicate all paid revenues before charting
    const allPaidRevenues = unifiedTransactions.filter((t) => t.type === "revenue" && t.status === "paid");
    const deduplicatedRevenues = allPaidRevenues;

    // Process deduplicated revenues
    deduplicatedRevenues.forEach((t) => {
      const d = new Date(t.date + "T12:00:00");
      const label = `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      
      if (monthlyMap[label]) {
        monthlyMap[label].Receita += t.value;
        if (t.orderId) {
          monthlyMap[label].Pedidos += 1;
        }
      }
    });

    // Process expenses and other (non-revenue) transactions that have orderId
    unifiedTransactions.forEach((t) => {
      const d = new Date(t.date + "T12:00:00");
      const label = `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      
      if (monthlyMap[label]) {
        if (t.type === "expense" && t.status === "paid") {
          monthlyMap[label].Custos += t.value;
        }
        if (t.type !== "revenue" && t.orderId) {
          monthlyMap[label].Pedidos += 1;
        }
      }
    });

    // Also include production costs into monthly maps
    orders.forEach((o) => {
      if (o.status === "cancelled") return;
      const dateObj = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const d = dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : new Date();
      const label = `${monthLabels[d.getMonth()]} ${d.getFullYear().toString().substring(2)}`;
      if (monthlyMap[label]) {
        let orderCost = 0;
        o.items?.forEach((item) => {
          const product = products.find((p) => p.id === item.productId || p.id === item.id);
          if (product) {
            orderCost += calculateProductCost(product, componentes) * (item.quantity || 1);
          }
        });
        monthlyMap[label].Custos += orderCost;
      }
    });

    return Object.values(monthlyMap).map((m) => ({
      ...m,
      Lucro: m.Receita - m.Custos,
    }));
  }, [unifiedTransactions, orders, products, componentes]);

  // Alerts Generator
  const alerts = useMemo(() => {
    const list: { type: "danger" | "warning"; text: string; id: string }[] = [];

    // 1. Overdue payments
    const todayStr = new Date().toISOString().split("T")[0];
    const overdueOrdersCount = orders.filter((o) => {
      if (o.status === "cancelled" || o.paymentStatus === "paid" || o.status === "fully_paid") return false;
      return o.deliveryDate && o.deliveryDate < todayStr;
    }).length;

    if (overdueOrdersCount > 0) {
      list.push({
        type: "danger",
        text: `${overdueOrdersCount} recebimento(s) vencido(s) de pedidos atrasados!`,
        id: "vencidos",
      });
    }

    // 2. Pending installments
    const pendingInstallmentsCount = financeEntries.filter((fe) => fe.status === "pending" && fe.type === "revenue").length;
    if (pendingInstallmentsCount > 0) {
      list.push({
        type: "warning",
        text: `Existem ${pendingInstallmentsCount} parcelas de recebíveis pendentes de quitação.`,
        id: "parcelas",
      });
    }

    // 3. Negative Cashflow
    if (calculations.profit < 0) {
      list.push({
        type: "danger",
        text: "Fluxo de caixa negativo no período selecionado! Custos superaram as receitas.",
        id: "caixa-negativo",
      });
    }

    // 4. Low Margins
    if (calculations.revenue > 0 && calculations.margin < 30) {
      list.push({
        type: "warning",
        text: `Margem operacional (${calculations.margin.toFixed(1)}%) abaixo do limite saudável de 30%!`,
        id: "margem-baixa",
      });
    }

    return list;
  }, [orders, financeEntries, calculations]);

  // Create Manual Entry Action
  const handleCreateManualEntry = async () => {
    if (!newEntryDesc || !newEntryValue) return;
    const valueNum = parseFloat(newEntryValue.replace(",", "."));
    if (isNaN(valueNum)) return;

    await createFinanceEntry({
      type: newEntryType,
      category: newEntryCategory,
      description: newEntryDesc,
      value: valueNum,
      date: newEntryDate,
      status: newEntryStatus,
      paymentMethod: newEntryPaymentMethod,
      companyId: companyId || 'pallyra',
    });

    // Reset Form
    setIsNewEntryOpen(false);
    setNewEntryDesc("");
    setNewEntryValue("");
    setNewEntryCategory(newEntryType === "revenue" ? "Venda de Produto" : "Compra de Insumos");
  };

  // Delete manual entry action
  const handleDeleteEntry = async (id: string) => {
    if (confirm("Deseja realmente excluir este lançamento financeiro?")) {
      await deleteFinanceEntry(id, companyId);
      setSelectedItem(null);
    }
  };

  // Execute clearing outstanding balance
  const handleClearInstallments = async () => {
    if (!paymentTargetOrder) return;
    const totalToPay = parseFloat(paymentValue.replace(",", "."));
    if (isNaN(totalToPay)) return;

    if (paymentTargetOrder.paymentMode === "planned" && paymentTargetOrder.remainingInstallments) {
      const instVal = paymentTargetOrder.remainingInstallmentValue || 0;
      if (selectedInstallments.length === 0) return;
      if (totalToPay < (selectedInstallments.length * instVal)) return;
    }

    const sub = paymentTargetOrder.items?.reduce((s, i) => s + ((i.retail_price || i.current_price || 0) * (i.quantity || 1)), 0) || 0;
    const orderTotal = paymentTargetOrder.total || sub;

    // Calculate updated amounts
    const currentPaid = paymentTargetOrder.hasSignal 
      ? (typeof paymentTargetOrder.signalValue === 'number' ? paymentTargetOrder.signalValue : (orderTotal * 0.5)) 
      : (paymentTargetOrder.paymentStatus === "paid" || paymentTargetOrder.status === "fully_paid" ? orderTotal : 0);
    
    const newPaidTotal = currentPaid + totalToPay;
    const fullyCleared = newPaidTotal >= orderTotal;

    const isInstallmentPayment = paymentTargetOrder.paymentMode === "planned" && paymentTargetOrder.remainingInstallments;
    const newRemainingInstallments = isInstallmentPayment
      ? Math.max(0, paymentTargetOrder.remainingInstallments - selectedInstallments.length)
      : undefined;

    const updateData: any = {
      paymentStatus: fullyCleared ? "paid" : "partial",
      status: fullyCleared ? "fully_paid" : paymentTargetOrder.status,
      hasSignal: true,
      signalValue: newPaidTotal,
    };
    if (newRemainingInstallments !== undefined) {
      updateData.remainingInstallments = newRemainingInstallments;
    }

    await updateOrder(paymentTargetOrder.id, updateData);

    // Automatically log revenue entry
    await createFinanceEntry({
      type: "revenue",
      category: "Quitação de Parcela",
      description: `Quitação ${fullyCleared ? "Integral" : "Parcial"} Pedido ${paymentTargetOrder.code} - ${paymentTargetOrder.customerName}`,
      value: totalToPay,
      date: new Date().toISOString().split("T")[0],
      status: "paid",
      paymentMethod: paymentMethod,
      companyId: paymentTargetOrder.companyId || companyId || 'pallyra',
      orderId: paymentTargetOrder.id,
    });

    setIsPaymentModalOpen(false);
    setSelectedInstallments([]);
    setSelectedItem(null);
  };

  // Quick select date ranges
  const handleQuickFilter = (range: string) => {
    setDateFilter(range);
  };

  // Ledger Balances computed sequentially from oldest first, filtered down chronologically desc
  const transactionsWithRunningBalance = useMemo(() => {
    // Sort chronological oldest first to track cumulative bank balance
    const sortedOldestFirst = [...unifiedTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let balance = 0;
    const withRunning = sortedOldestFirst.map((t) => {
      const change = t.status === "paid" ? (t.type === "revenue" ? t.value : -t.value) : 0;
      balance += change;
      return { ...t, runningBalance: balance };
    });

    // Sort newest first
    const newestFirst = withRunning.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply multiple filter sets
    return newestFirst.filter((t) => {
      // 1. Date filter
      if (dateFilter !== "all" && !isDateInFilter(t.date, dateFilter, customStartDate, customEndDate)) {
        return false;
      }
      // 2. Type filter
      if (typeFilter !== "all" && t.type !== typeFilter) {
        return false;
      }
      // 3. Status filter
      if (statusFilter !== "all" && t.status !== statusFilter) {
        return false;
      }
      // 4. Origin badge filter
      if (originFilter !== "all" && getOriginBadge(t).toLowerCase() !== originFilter.toLowerCase()) {
        return false;
      }
      // 5. Query Search
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesCode = t.code?.toLowerCase().includes(query);
        const matchesClient = t.customerName?.toLowerCase().includes(query);
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesCategory = t.category?.toLowerCase().includes(query);
        if (!matchesCode && !matchesClient && !matchesDesc && !matchesCategory) {
          return false;
        }
      }
      return true;
    });
  }, [unifiedTransactions, dateFilter, customStartDate, customEndDate, typeFilter, statusFilter, originFilter, searchQuery]);

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-200">
      
      {/* HEADER SECTION - Clean Premium Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-pink-100 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-pink-100/70 text-pink-600 shadow-sm border border-white/80 backdrop-blur-sm">
              <DollarSign className="w-6 h-6" />
            </span>
            Painel Executivo Financeiro
          </h2>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-1.5">
            Análise detalhada do fluxo de caixa e rentabilidade do ateliê
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNewEntryOpen(true)}
            className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white font-extrabold rounded-xl text-xs shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-150"
          >
            <Plus size={16} />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* ALERT CENTER */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3.5 p-4 rounded-[22px] border-l-[6px] shadow-sm animate-in slide-in-from-top-4 duration-200 ${
                alert.type === "danger"
                  ? "bg-rose-50/70 border-rose-500 text-rose-900 border-y border-r border-rose-100/50"
                  : "bg-amber-50/70 border-amber-500 text-amber-900 border-y border-r border-amber-100/50"
              }`}
            >
              <div className="mt-0.5">
                {alert.type === "danger" ? (
                  <ShieldAlert size={18} className="text-rose-600 animate-pulse" />
                ) : (
                  <AlertTriangle size={18} className="text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold leading-relaxed">{alert.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FILTERS CONTROL RAIL - Reorganized into a powerful unified bar */}
      <div className="bg-white/75 backdrop-blur-md rounded-[24px] border border-white/80 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-50 pb-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-400 tracking-wider">
            <Filter size={14} className="text-pink-500" />
            Configuração de Filtros
          </div>
          
          {/* Period quick filters */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "today", label: "Hoje" },
              { id: "week", label: "Esta Semana" },
              { id: "month", label: "Este Mês" },
              { id: "year", label: "Este Ano" },
              { id: "all", label: "Todo Período" },
              { id: "custom", label: "Personalizado" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => handleQuickFilter(btn.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all duration-200 cursor-pointer ${
                  dateFilter === btn.id
                    ? "bg-gradient-to-b from-pink-400 to-pink-500 text-white border-transparent shadow-sm"
                    : "bg-white/60 text-gray-500 border-pink-100/50 hover:bg-pink-50"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Ranges */}
        {dateFilter === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl border border-pink-100/50 animate-in zoom-in-95 duration-200">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Data Inicial</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all duration-200"
              />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">Data Final</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-300 transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Multi-Filter Combination Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          
          {/* Search box (Cliente / Pedido) */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar cliente, pedido ou categoria..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/60 border border-pink-100/80 rounded-xl text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 focus:ring-2 focus:ring-pink-50"
            />
          </div>

          {/* Type dropdown */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 focus:ring-2 focus:ring-pink-50"
            >
              <option value="all">Todas as transações</option>
              <option value="revenue">Apenas Receitas</option>
              <option value="expense">Apenas Despesas</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 focus:ring-2 focus:ring-pink-50"
            >
              <option value="all">Todos os Status</option>
              <option value="paid">Conciliados (Pagos)</option>
              <option value="pending">Pendentes</option>
            </select>
          </div>

          {/* Origin dropdown */}
          <div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 focus:ring-2 focus:ring-pink-50"
            >
              <option value="all">Todas as Origens</option>
              <option value="pedido">Pedido</option>
              <option value="compra">Compra</option>
              <option value="manual">Manual</option>
              <option value="sistema">Sistema</option>
              <option value="produção">Produção</option>
            </select>
          </div>

        </div>

        {/* Clear Filter Bar if active */}
        {(searchQuery.trim() || typeFilter !== "all" || statusFilter !== "all" || originFilter !== "all" || dateFilter !== "month") && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("all");
                setStatusFilter("all");
                setOriginFilter("all");
                setDateFilter("month");
                setCustomStartDate("");
                setCustomEndDate("");
              }}
              className="text-xs font-bold text-gray-400 hover:text-pink-600 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <X size={14} />
              Limpar Filtros Ativos
            </button>
          </div>
        )}
      </div>

      {/* 1. DASHBOARD EXECUTIVO */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <Layers size={14} className="text-pink-500" />
          1. Dashboard Executivo
        </h3>

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          
          {/* RECEITA BRUTA */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Receita Bruta</span>
              <div className="w-6 h-6 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-gray-800 font-mono tracking-tight">{formatCurrency(calculations.revenue)}</p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Conciliados no período</p>
          </div>

          {/* CUSTOS */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Custos Totais</span>
              <div className="w-6 h-6 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <ArrowDownRight size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-gray-800 font-mono tracking-tight">{formatCurrency(calculations.costs)}</p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Insumos + Despesas</p>
          </div>

          {/* LUCRO LÍQUIDO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lucro Líquido</span>
              <div className={`w-6 h-6 rounded-xl flex items-center justify-center ${calculations.profit >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                <Activity size={14} />
              </div>
            </div>
            <p className={`text-lg font-black font-mono tracking-tight ${calculations.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatCurrency(calculations.profit)}
            </p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Resultado líquido</p>
          </div>

          {/* MARGEM DE LUCRO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Margem de Lucro</span>
              <div className="w-6 h-6 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
                <TrendingUp size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-gray-800 font-mono tracking-tight">{calculations.margin.toFixed(1)}%</p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Rentabilidade do caixa</p>
          </div>

          {/* TICKET MÉDIO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ticket Médio</span>
              <div className="w-6 h-6 rounded-xl bg-pink-50 flex items-center justify-center text-pink-500">
                <Package size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-gray-800 font-mono tracking-tight">{formatCurrency(executiveMetrics.ticketMedio)}</p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Por venda no período</p>
          </div>

          {/* PEDIDOS EM ABERTO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fila Aberta</span>
              <div className="w-6 h-6 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <ShoppingBag size={14} />
              </div>
            </div>
            <p className="text-lg font-black text-gray-800 font-mono tracking-tight">{calculations.openOrders}</p>
            <p className="text-[9px] font-semibold text-gray-400 mt-1">Pedidos não finalizados</p>
          </div>

        </div>
      </div>

      {/* 2. INDICADORES FINANCEIROS - Combines Resumo do Dia & Meta Financeira side-by-side */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-pink-500" />
          2. Indicadores Financeiros
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* RESUMO DO DIA */}
          <div className="md:col-span-5 bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-pink-50 pb-3 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Clock size={14} className="text-pink-500" />
                  Resumo do Dia
                </h4>
                <span className="px-2.5 py-1 bg-pink-50 text-pink-600 rounded-lg text-[9px] font-extrabold uppercase tracking-widest">
                  Hoje
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 p-3 bg-emerald-50/40 rounded-xl border border-emerald-100/30">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800">Entradas</span>
                  <p className="text-sm font-black text-emerald-700 font-mono">{formatCurrency(dailySummary.entradas)}</p>
                </div>

                <div className="space-y-1 p-3 bg-rose-50/40 rounded-xl border border-rose-100/30">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-800">Saídas</span>
                  <p className="text-sm font-black text-rose-700 font-mono">{formatCurrency(dailySummary.saidas)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 border-t border-pink-50 pt-4">
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Lucro do Dia</span>
                <p className={`text-sm font-black font-mono ${dailySummary.lucro >= 0 ? "text-gray-800" : "text-rose-600"}`}>
                  {formatCurrency(dailySummary.lucro)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 block mb-0.5">Saldo Atual</span>
                <p className={`text-sm font-black font-mono ${dailySummary.saldo >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(dailySummary.saldo)}
                </p>
              </div>
            </div>
          </div>

          {/* META FINANCEIRA */}
          <div className="md:col-span-7 bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-pink-50 pb-3 mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Target size={14} className="text-pink-500" />
                  Meta Mensal
                </h4>

                <div className="flex items-center gap-2">
                  {isEditingGoal ? (
                    <div className="flex items-center gap-1 animate-in zoom-in-95 duration-150">
                      <input
                        type="number"
                        value={goalInputVal}
                        onChange={(e) => setGoalInputVal(e.target.value)}
                        className="w-20 px-2 py-0.5 text-xs font-bold border border-pink-100 rounded-xl outline-none text-gray-700"
                      />
                      <button
                        onClick={handleSaveGoal}
                        className="p-1 px-2 bg-gradient-to-b from-pink-400 to-pink-500 text-white rounded-lg text-[10px] font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setGoalInputVal(monthlyGoal.toString());
                        setIsEditingGoal(true);
                      }}
                      className="text-gray-400 hover:text-pink-500 p-1 rounded hover:bg-pink-50 transition-all"
                      title="Editar Meta"
                    >
                      <Edit2 size={13} />
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-gray-500">
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Meta Definida</span>
                  <span className="font-extrabold text-gray-800 font-mono text-sm">{formatCurrency(monthlyGoal)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Atingido (Mês)</span>
                  <span className="font-extrabold text-emerald-600 font-mono text-sm">{formatCurrency(monthlyRevenueReached)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Restante</span>
                  <span className="font-extrabold text-gray-800 font-mono text-sm">
                    {formatCurrency(Math.max(0, monthlyGoal - monthlyRevenueReached))}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block mb-0.5">Progresso</span>
                  <span className="font-extrabold text-gray-800 font-mono text-sm">
                    {((monthlyRevenueReached / (monthlyGoal || 1)) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="w-full h-3 bg-pink-100/30 rounded-full overflow-hidden border border-pink-100/50 relative shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${Math.min(100, (monthlyRevenueReached / (monthlyGoal || 1)) * 100)}%` }}
                />
              </div>

              {monthlyRevenueReached >= monthlyGoal && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl py-1.5 px-3 flex items-center justify-center gap-1 text-[11px] font-bold animate-bounce mt-2 shadow-sm">
                  <span>Meta alcançada 🎉</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ADDITIONAL EXECUTIVE STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PANEL: INDICADORES ADICIONAIS */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Info size={13} className="text-pink-500" />
              Indicadores Operacionais
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between items-center py-1.5 border-b border-pink-50">
                <span className="text-xs font-medium text-gray-500">Ticket Médio</span>
                <span className="text-xs font-black text-gray-800 font-mono">{formatCurrency(executiveMetrics.ticketMedio)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-pink-50">
                <span className="text-xs font-medium text-gray-500">Valor Médio do Pedido</span>
                <span className="text-xs font-black text-gray-800 font-mono">{formatCurrency(executiveMetrics.avgOrderValue)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-pink-50">
                <span className="text-xs font-medium text-gray-500">Receita Acumulada</span>
                <span className="text-xs font-black text-emerald-600 font-mono">{formatCurrency(calculations.accumulatedRevenue)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-xs font-medium text-gray-500">Resultado Acumulado</span>
                <span className={`text-xs font-black font-mono ${calculations.accumulatedProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(calculations.accumulatedProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL: PRODUTO E CATEGORIA MAIS LUCRATIVO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-pink-500" />
              Inteligência de Vendas
            </h3>
            <div className="space-y-4">
              <div className="p-3.5 bg-pink-50/40 border border-pink-100/30 rounded-xl space-y-1 animate-in fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 block">Produto Mais Lucrativo</span>
                <p className="text-xs font-bold text-gray-800 truncate">{executiveMetrics.mostProfitableProduct}</p>
              </div>
              <div className="p-3.5 bg-pink-50/40 border border-pink-100/30 rounded-xl space-y-1 animate-in fade-in">
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 block">Categoria Mais Lucrativa</span>
                <p className="text-xs font-bold text-gray-800 truncate">{executiveMetrics.mostProfitableCategory}</p>
              </div>
            </div>
          </div>

          {/* PANEL: RESUMO DE FLUXO ESTIMADO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
              <Activity size={13} className="text-pink-500" />
              Previsão Operacional
            </h3>
            <div className="space-y-3.5">
              <div className="flex justify-between text-xs py-1.5 border-b border-pink-50">
                <span className="font-semibold text-gray-500">Entradas (Período)</span>
                <span className="font-bold text-emerald-600 font-mono">{formatCurrency(calculations.revenue)}</span>
              </div>
              <div className="flex justify-between text-xs py-1.5 border-b border-pink-50">
                <span className="font-semibold text-gray-500">Saídas (Custos)</span>
                <span className="font-bold text-rose-600 font-mono">{formatCurrency(calculations.costs)}</span>
              </div>
              <div className="pt-2 flex justify-between text-xs font-bold">
                <span className="text-gray-700">Saldo Previsto</span>
                <span className={`font-mono font-extrabold ${calculations.profit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatCurrency(calculations.profit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GRÁFICOS */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <BarChart3 size={14} className="text-pink-500" />
          3. Gráficos de Performance
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CHART 1: RECEITA X LUCRO HISTÓRICO */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px]">
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <BarChart3 size={14} className="text-pink-500" />
                Performance Mensal: Receita x Lucro
              </h3>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
                  <Area type="monotone" dataKey="Lucro" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorProfit)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: ENTRADAS X SAÍDAS COMPACT */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px]">
            <div className="mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                <Layers size={14} className="text-pink-500" />
                Fluxo Comparativo: Entradas x Saídas
              </h3>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f172a",
                      border: "none",
                      borderRadius: "12px",
                      color: "#fff",
                      fontSize: "11px",
                    }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} name="Entradas (R$)" />
                  <Bar dataKey="Custos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Saídas (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* 4. LIVRO CAIXA */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <Receipt size={14} className="text-pink-500" />
          4. Livro Caixa (ledger)
        </h3>

        <div className="bg-white/75 backdrop-blur-md border border-white/80 shadow-sm rounded-[22px] overflow-hidden">
          <div className="p-6 border-b border-pink-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Receipt size={16} className="text-pink-500" />
                Livro de Movimentações
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Clique em qualquer lançamento para ver o detalhamento completo.</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-pink-50/50 px-3 py-1.5 rounded-lg border border-pink-100/30">
              {transactionsWithRunningBalance.length} transação(ões) encontrada(s)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-pink-50/30 text-gray-500 font-bold uppercase tracking-wider border-b border-pink-100/80">
                  <th className="p-4 pl-6">Data</th>
                  <th className="p-4">Descrição</th>
                  <th className="p-4">Origem</th>
                  <th className="p-4 text-right">Entrada</th>
                  <th className="p-4 text-right">Saída</th>
                  <th className="p-4 text-right">Saldo</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6">Usuário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pink-50/50 font-medium">
                {transactionsWithRunningBalance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-gray-400 font-bold">
                      Nenhuma movimentação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  transactionsWithRunningBalance.map((t) => {
                    const isRevenue = t.type === "revenue";
                    const origin = getOriginBadge(t);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedItem(t)}
                        className="hover:bg-pink-50/20 cursor-pointer active:bg-pink-50/40 transition-all duration-150 border-l-[4px] border-l-transparent hover:border-l-pink-400"
                      >
                        <td className="p-4 pl-6 font-mono font-bold text-gray-400">
                          {new Date(t.date + "T12:00:00").toLocaleDateString("pt-BR")}
                        </td>
                        <td className="p-4 text-gray-800 font-bold">
                          {t.description}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider border shadow-sm ${
                              origin === "Pedido"
                                ? "bg-indigo-50 border-indigo-150 text-indigo-700"
                                : origin === "Compra"
                                ? "bg-rose-50 border-rose-150 text-rose-700"
                                : origin === "Manual"
                                ? "bg-amber-50 border-amber-150 text-amber-700"
                                : origin === "Sistema"
                                ? "bg-slate-50 border-slate-150 text-slate-700"
                                : "bg-violet-50 border-violet-150 text-violet-700"
                            }`}
                          >
                            {origin}
                          </span>
                        </td>
                        
                        {/* Entrada column */}
                        <td className="p-4 text-right font-black font-mono text-emerald-600">
                          {isRevenue ? formatCurrency(t.value) : "-"}
                        </td>

                        {/* Saída column */}
                        <td className="p-4 text-right font-black font-mono text-rose-600">
                          {!isRevenue ? formatCurrency(t.value) : "-"}
                        </td>

                        {/* Ledger balance column */}
                        <td className="p-4 text-right font-black font-mono text-gray-800">
                          {formatCurrency((t as any).runningBalance || 0)}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              t.status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-150"
                                : "bg-amber-50 text-amber-700 border-amber-150"
                            }`}
                          >
                            {t.status === "paid" ? "Conciliado" : "Pendente"}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-gray-400 font-semibold">{t.user || "Sistema"}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. HISTÓRICO DE AUDITORIA (ERP Logs) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase text-gray-400 tracking-widest flex items-center gap-2">
          <Clock size={14} className="text-pink-500" />
          5. Histórico & Auditoria
        </h3>

        <div className="bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px] space-y-4">
          <div className="flex items-center justify-between border-b border-pink-50 pb-3">
            <div>
              <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Trilha de Eventos ERP</h4>
              <p className="text-xs text-gray-400 mt-0.5">Últimos logs de auditoria e ações mapeadas pelo sistema</p>
            </div>
            <span className="px-2 py-1 bg-pink-50 border border-pink-100 text-pink-600 rounded-lg text-[10px] font-bold">
              Seguro & Auditado
            </span>
          </div>

          <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-2">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400 font-semibold italic text-center py-6">Nenhum registro de auditoria disponível.</p>
            ) : (
              auditLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="text-[11px] leading-relaxed p-4 bg-white/50 hover:bg-pink-50/20 border border-pink-100/50 rounded-2xl flex items-start gap-3 transition-all">
                  <div className="p-2 bg-pink-50/50 border border-pink-100 text-pink-600 rounded-xl">
                    <User size={13} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-extrabold text-gray-800">{log.action}</span>
                      <span className="font-bold text-gray-400 text-[10px] font-mono">
                        {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString("pt-BR") : log.date || ""}
                      </span>
                    </div>
                    <p className="text-gray-500 font-semibold mt-0.5">{log.details || log.resourceName}</p>
                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-gray-400">
                      <span>Operador:</span>
                      <span className="text-pink-600">{log.user?.name || log.user?.email || "Sistema"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL: DETAIL PANEL (SLIDE-OVER / PREMIUM MODAL) */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl h-full rounded-2xl shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Detalhamento Financeiro</span>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-1">
                  <Receipt size={18} className="text-slate-700" />
                  {selectedItem.category}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDeleteEntry(selectedItem.id)}
                  className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Excluir Lançamento"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body (Spacious Premium Grid of 6 Cards) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CARD 1: ORIGEM */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <Layers size={14} />
                    Origem & Classificação
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-500">
                      Descrição: <span className="font-bold text-slate-900 block mt-0.5">{selectedItem.description}</span>
                    </p>
                    <p className="font-semibold text-slate-500">
                      Tipo:{" "}
                      <span className={`font-bold uppercase ${selectedItem.type === "revenue" ? "text-emerald-600" : "text-rose-600"}`}>
                        {selectedItem.type === "revenue" ? "Receita" : "Despesa"}
                      </span>
                    </p>
                    <p className="font-semibold text-slate-500">
                      Valor total: <span className="font-black text-slate-950 block text-sm font-mono mt-0.5">{formatCurrency(selectedItem.value)}</span>
                    </p>
                  </div>
                </div>

                {/* CARD 2: PEDIDO RELACIONADO */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <Package size={14} />
                    Pedido Relacionado
                  </div>
                  {selectedItem.orderId ? (
                    <div className="space-y-2 text-xs">
                      {(() => {
                        const order = orders.find((o) => o.id === selectedItem.orderId || o.code === selectedItem.orderId);
                        if (!order) return <p className="text-slate-400 font-semibold italic">Carregando detalhes do pedido...</p>;
                        return (
                          <>
                            <p className="font-semibold text-slate-500">
                              Código: <span className="font-black text-slate-900">{order.code}</span>
                            </p>
                            <p className="font-semibold text-slate-500">
                              Cliente: <span className="font-bold text-slate-800">{order.customerName}</span>
                            </p>
                            <p className="font-semibold text-slate-500">
                              Status: <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-bold rounded capitalize">{order.status}</span>
                            </p>
                            {order.paymentStatus !== "paid" && (
                              <button
                                onClick={() => {
                                  setPaymentTargetOrder(order);
                                  const sub = order.items?.reduce((s, i) => s + ((i.retail_price || i.current_price || 0) * (i.quantity || 1)), 0) || 0;
                                  const orderTotal = order.total || sub;
                                  const currentPaid = order.hasSignal 
                                    ? (typeof order.signalValue === 'number' ? order.signalValue : (orderTotal * 0.5)) 
                                    : (order.paymentStatus === "paid" || order.status === "fully_paid" ? orderTotal : 0);
                                  setPaymentValue(formatCurrency(orderTotal - currentPaid).replace("R$", "").trim());
                                  setIsPaymentModalOpen(true);
                                }}
                                className="w-full mt-2 py-2 bg-slate-900 text-white font-extrabold rounded-xl text-[10px] hover:bg-black uppercase tracking-wider cursor-pointer border-b-2 border-slate-950 shadow-md"
                              >
                                Registrar Pagamento
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-semibold italic">Lançamento avulso (Sem correspondência de pedido no ERP).</p>
                  )}
                </div>

                {/* CARD 3: FORMA DE PAGAMENTO */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <FileText size={14} />
                    Forma de Pagamento
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-semibold text-slate-500">
                      Meio de liquidação:{" "}
                      <span className="font-black text-slate-800 uppercase block mt-0.5">
                        {selectedItem.paymentMethod || "Não informado"}
                      </span>
                    </p>
                    <p className="font-semibold text-slate-500">
                      Status de compensação:{" "}
                      <span className={`font-bold block mt-0.5 ${selectedItem.status === "paid" ? "text-emerald-600" : "text-amber-600"}`}>
                        {selectedItem.status === "paid" ? "Conciliado (Liquidado)" : "Aguardando liquidação"}
                      </span>
                    </p>
                    {selectedItem.status === "pending" && (
                      <button
                        onClick={async () => {
                          await updateFinanceEntry(selectedItem.id, { status: "paid" });
                          setSelectedItem({ ...selectedItem, status: "paid" });
                        }}
                        className="w-full mt-2 py-2 bg-emerald-600 text-white font-extrabold rounded-xl text-[10px] hover:bg-emerald-700 uppercase tracking-wider cursor-pointer border-b-2 border-emerald-800 shadow-md animate-pulse"
                      >
                        Marcar como Pago
                      </button>
                    )}
                  </div>
                </div>

                {/* CARD 4: PARCELAMENTO */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <Layers size={14} />
                    Parcelamento & Fluxo
                  </div>
                  {(() => {
                    const order = orders.find((o) => o.id === selectedItem.orderId || o.code === selectedItem.orderId);
                    if (order?.paymentMode === "planned") {
                      return (
                        <div className="space-y-2 text-xs">
                          <p className="font-semibold text-slate-500">
                            Número de parcelas: <span className="font-black text-slate-800">{order.remainingInstallments || 1}x</span>
                          </p>
                          <p className="font-semibold text-slate-500">
                            Valor por parcela:{" "}
                            <span className="font-bold text-slate-800 font-mono">
                              {formatCurrency(order.remainingInstallmentValue || 0)}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return (
                      <p className="text-xs text-slate-400 font-semibold italic">Liquidação integral sem parcelamento previsto.</p>
                    );
                  })()}
                </div>

                {/* CARD 5: HISTÓRICO DE MUTAÇÕES */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 md:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <Clock size={14} />
                    Histórico do Lançamento
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px] py-1.5 border-b border-slate-50">
                      <span className="font-semibold text-slate-500">Criação do lançamento</span>
                      <span className="font-bold text-slate-800 font-mono">{new Date(selectedItem.date + "T12:00:00").toLocaleDateString("pt-BR")}</span>
                    </div>
                    {selectedItem.orderId && (
                      <div className="flex justify-between text-[11px] py-1.5 border-b border-slate-50">
                        <span className="font-semibold text-slate-500">Pedido originador registrado</span>
                        <span className="font-bold text-slate-800">Sim</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD 6: AUDITORIA REAL */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3 md:col-span-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-400">
                    <User size={14} />
                    Trilha de Auditoria (ERP Logs)
                  </div>
                  <div className="space-y-2.5 max-h-[150px] overflow-y-auto">
                    {(() => {
                      const entityLogs = auditLogs.filter(
                        (log) => log.resourceId === selectedItem.id || log.resourceId === selectedItem.orderId
                      );
                      if (entityLogs.length === 0) {
                        return (
                          <p className="text-[11px] text-slate-400 font-semibold italic">Nenhum registro de auditoria disponível.</p>
                        );
                      }
                      return entityLogs.map((log) => (
                        <div key={log.id} className="text-[10px] leading-relaxed p-2.5 bg-slate-50 rounded-xl space-y-0.5">
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{log.action} - {log.user?.name || log.user?.email || "Sistema"}</span>
                            <span className="font-mono text-slate-400">
                              {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString("pt-BR") : log.date || ""}
                            </span>
                          </div>
                          <p className="text-slate-500 font-semibold">{log.details || log.resourceName}</p>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR NOVO LANÇAMENTO (MANUAL REVENUE/EXPENSE) */}
      {isNewEntryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Novo Lançamento Financeiro</h3>
              <button
                onClick={() => setIsNewEntryOpen(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => {
                    setNewEntryType("revenue");
                    setNewEntryCategory("Venda de Produto");
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    newEntryType === "revenue" ? "bg-white text-slate-950 shadow-sm border border-slate-200/40" : "text-slate-500"
                  }`}
                >
                  Receita
                </button>
                <button
                  onClick={() => {
                    setNewEntryType("expense");
                    setNewEntryCategory("Compra de Insumos");
                  }}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    newEntryType === "expense" ? "bg-white text-slate-950 shadow-sm border border-slate-200/40" : "text-slate-500"
                  }`}
                >
                  Despesa
                </button>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Compra de embalagens, Aluguel"
                  value={newEntryDesc}
                  onChange={(e) => setNewEntryDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-850 focus:ring-2 focus:ring-slate-100 transition-all text-slate-800 shadow-inner"
                />
              </div>

              {/* Value & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor (R$)</label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={newEntryValue}
                    onChange={(e) => setNewEntryValue(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-850 focus:ring-2 focus:ring-slate-100 transition-all text-slate-800 shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Categoria</label>
                  <select
                    value={newEntryCategory}
                    onChange={(e) => setNewEntryCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-850 focus:ring-2 focus:ring-slate-100 transition-all text-slate-700 shadow-inner"
                  >
                    {newEntryType === "revenue" ? (
                      <>
                        <option value="Venda de Produto">Venda de Produto</option>
                        <option value="Investimento">Investimento</option>
                        <option value="Ajuste de Caixa">Ajuste de Caixa</option>
                        <option value="Outro">Outro</option>
                      </>
                    ) : (
                      <>
                        <option value="Compra de Insumos">Compra de Insumos</option>
                        <option value="Marketing/Anúncios">Marketing/Anúncios</option>
                        <option value="Manutenção/Serviços">Manutenção/Serviços</option>
                        <option value="Salários/Pró-labore">Salários/Pró-labore</option>
                        <option value="Impostos">Impostos</option>
                        <option value="Outro">Outro</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Data</label>
                  <input
                    type="date"
                    value={newEntryDate}
                    onChange={(e) => setNewEntryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-850 focus:ring-2 focus:ring-slate-100 transition-all text-slate-800 shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Forma de pagamento</label>
                  <select
                    value={newEntryPaymentMethod}
                    onChange={(e) => setNewEntryPaymentMethod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-850 focus:ring-2 focus:ring-slate-100 transition-all text-slate-700 shadow-inner"
                  >
                    <option value="pix">PIX</option>
                    <option value="dinheiro">Dinheiro</option>
                    <option value="credito">Cartão de Crédito</option>
                    <option value="debito">Cartão de Débito</option>
                    <option value="transferencia">Transferência</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Status</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={newEntryStatus === "paid"}
                      onChange={() => setNewEntryStatus("paid")}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-200"
                    />
                    Conciliado (Pago/Recebido)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={newEntryStatus === "pending"}
                      onChange={() => setNewEntryStatus("pending")}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-200"
                    />
                    Pendente
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsNewEntryOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-850 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer border-b-[2px] border-b-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateManualEntry}
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors cursor-pointer border-b-[2px] border-b-slate-955"
              >
                Salvar Lançamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR PAGAMENTO DE PEDIDOS */}
      {isPaymentModalOpen && paymentTargetOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Registrar Pagamento</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-900 transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-150 space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Pedido Associado</span>
                <p className="text-xs font-black text-slate-800">
                  #{paymentTargetOrder.code} - {paymentTargetOrder.customerName}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  Total do Pedido: <span className="font-bold text-slate-900">{formatCurrency(paymentTargetOrder.total)}</span>
                </p>
              </div>

              {/* Forma de Pagamento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Forma de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-700 shadow-inner"
                >
                  <option value="pix">PIX</option>
                  <option value="dinheiro">Dinheiro</option>
                  <option value="credito">Cartão de Crédito</option>
                  <option value="debito">Cartão de Débito</option>
                  <option value="transferencia">Transferência</option>
                  <option value="boleto">Boleto</option>
                </select>
              </div>

              {/* Parcela ou Parcial */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Tipo de Pagamento</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={!paymentIsPartial}
                      onChange={() => {
                        setPaymentIsPartial(false);
                        const sub = paymentTargetOrder.items?.reduce((s, i) => s + ((i.retail_price || i.current_price || 0) * (i.quantity || 1)), 0) || 0;
                        const orderTotal = paymentTargetOrder.total || sub;
                        const currentPaid = paymentTargetOrder.hasSignal 
                          ? (typeof paymentTargetOrder.signalValue === 'number' ? paymentTargetOrder.signalValue : (orderTotal * 0.5)) 
                          : (paymentTargetOrder.paymentStatus === "paid" || paymentTargetOrder.status === "fully_paid" ? orderTotal : 0);
                        const rem = Math.max(0, orderTotal - currentPaid);
                        setPaymentValue(rem.toString());
                      }}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-200"
                    />
                    Quitação Integral
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                    <input
                      type="radio"
                      checked={paymentIsPartial}
                      onChange={() => setPaymentIsPartial(true)}
                      className="w-4 h-4 text-slate-900 focus:ring-slate-900 border-slate-200"
                    />
                    Pagamento Parcial (Sinal)
                  </label>
                </div>
              </div>

              {/* Valor Pago Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Valor a registrar (R$)</label>
                <input
                  type="text"
                  placeholder="0,00"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold outline-none focus:bg-white focus:border-slate-800 transition-all text-slate-800 shadow-inner"
                />
              </div>

              {/* Planned Active / Planned Installments clearance helper */}
              {paymentTargetOrder.paymentMode === "planned" && paymentTargetOrder.remainingInstallments && (
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-150">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">Parcelas do Pedido</label>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {Array.from({ length: paymentTargetOrder.remainingInstallments }).map((_, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 text-[10px] font-bold text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={selectedInstallments.includes(idx)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInstallments([...selectedInstallments, idx]);
                              const currentVal = parseFloat(paymentValue.replace(",", ".")) || 0;
                              setPaymentValue((currentVal + (paymentTargetOrder.remainingInstallmentValue || 0)).toFixed(2));
                            } else {
                              setSelectedInstallments(selectedInstallments.filter((i) => i !== idx));
                              const currentVal = parseFloat(paymentValue.replace(",", ".")) || 0;
                              setPaymentValue(Math.max(0, currentVal - (paymentTargetOrder.remainingInstallmentValue || 0)).toFixed(2));
                            }
                          }}
                          className="w-3.5 h-3.5 rounded text-slate-900 focus:ring-slate-900 border-slate-200"
                        />
                        <span>
                          Parcela {idx + 1} de {paymentTargetOrder.remainingInstallments} -{" "}
                          {formatCurrency(paymentTargetOrder.remainingInstallmentValue || 0)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex gap-3 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors cursor-pointer border-b-[2px] border-b-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearInstallments}
                disabled={
                  (() => {
                    const valNum = parseFloat(paymentValue.replace(",", "."));
                    if (isNaN(valNum) || valNum <= 0) return true;
                    if (paymentTargetOrder.paymentMode === "planned" && paymentTargetOrder.remainingInstallments) {
                      const instVal = paymentTargetOrder.remainingInstallmentValue || 0;
                      if (selectedInstallments.length === 0) return true;
                      if (valNum < (selectedInstallments.length * instVal)) return true;
                    }
                    return false;
                  })()
                }
                className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer border-b-[2px] border-b-slate-955 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar Liquidação
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
