import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  XCircle,
  Activity,
  Percent,
  Package,
  Search,
  ChevronRight,
  CheckCircle,
  Clock,
  Send,
  FileText,
  User,
  CreditCard,
  QrCode,
  Hash,
  History,
  Printer,
} from "lucide-react";
import { CompanyId, Order, Product } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { format, isSameMonth, isSameDay, subMonths, startOfWeek, isWithinInterval, endOfDay } from "date-fns";

interface FinanceTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  companyId,
  orders,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"hoje" | "semana" | "mes" | "pagos" | "pendentes" | "cancelados" | "todos">("mes");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Helper to parse dates
  const parseDate = (o: Order) => {
    if (!o.createdAt) return new Date();
    if (typeof o.createdAt.toDate === "function") return o.createdAt.toDate();
    if (o.createdAt.seconds) return new Date(o.createdAt.seconds * 1000);
    return new Date(o.createdAt);
  };

  // Filter orders by company
  const companyOrders = useMemo(() => {
    return orders.filter(o => o.companyId === companyId || companyId === 'all' as any);
  }, [orders, companyId]);

  // KPIs Logic
  const today = new Date();
  const kpis = useMemo(() => {
    const prevMonthDate = subMonths(today, 1);
    
    let fatHoje = 0;
    let fatMes = 0;
    let fatPrevMes = 0;
    let paidCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;
    let totalPaidValue = 0;

    companyOrders.forEach(o => {
      const oDate = parseDate(o);
      const oTotal = Number(o.total) || 0;
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";

      if (isPaid) {
        paidCount++;
        totalPaidValue += oTotal;
        if (isSameDay(oDate, today)) fatHoje += oTotal;
        if (isSameMonth(oDate, today)) fatMes += oTotal;
        if (isSameMonth(oDate, prevMonthDate)) fatPrevMes += oTotal;
      } else if (isCancelled) {
        cancelledCount++;
      } else {
        pendingCount++;
      }
    });

    const ticketMedio = paidCount > 0 ? totalPaidValue / paidCount : 0;
    const growthMes = fatPrevMes > 0 ? ((fatMes - fatPrevMes) / fatPrevMes) * 100 : fatMes > 0 ? 100 : 0;

    return { fatHoje, fatMes, ticketMedio, paidCount, pendingCount, cancelledCount, growthMes };
  }, [companyOrders]);

  // Main list filtering
  const filteredList = useMemo(() => {
    return companyOrders.filter(o => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = o.code.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term);
      if (!matchesSearch) return false;

      const oDate = parseDate(o);
      const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
      const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
      const isPending = !isPaid && !isCancelled;

      switch (activeFilter) {
        case "hoje": return isSameDay(oDate, today);
        case "semana": return isWithinInterval(oDate, { start: startOfWeek(today), end: endOfDay(today) });
        case "mes": return isSameMonth(oDate, today);
        case "pagos": return isPaid;
        case "pendentes": return isPending;
        case "cancelados": return isCancelled;
        default: return true;
      }
    }).sort((a, b) => parseDate(b).getTime() - parseDate(a).getTime());
  }, [companyOrders, activeFilter, searchTerm]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#1C1C1E] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
              <DollarSign size={20} strokeWidth={1.5} />
            </div>
            Centro Financeiro
          </h2>
          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2 ml-13">
            Gestão de faturamento e performance em tempo real
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Buscar pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E5E5EA] rounded-2xl py-3 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#1C1C1E]/5 outline-none transition-all placeholder:text-[#AEAEB2]"
          />
        </div>
      </div>

      {/* KPI Panel */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Faturamento Hoje", value: kpis.fatHoje, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50", isCurrency: true },
          { label: "Faturamento Mês", value: kpis.fatMes, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50", isCurrency: true, growth: kpis.growthMes },
          { label: "Ticket Médio", value: kpis.ticketMedio, icon: Percent, color: "text-amber-600", bg: "bg-amber-50", isCurrency: true },
          { label: "Pedidos Pagos", value: kpis.paidCount, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-50" },
          { label: "Pedidos Pendentes", value: kpis.pendingCount, icon: Clock, color: "text-amber-500", bg: "bg-amber-50" },
          { label: "Pedidos Cancelados", value: kpis.cancelledCount, icon: XCircle, color: "text-rose-500", bg: "bg-rose-50" },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#E5E5EA] rounded-[2rem] p-5 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                <kpi.icon size={14} />
              </div>
              {kpi.growth !== undefined && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${kpi.growth >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                  {kpi.growth >= 0 ? "+" : ""}{kpi.growth.toFixed(1)}%
                </span>
              )}
            </div>
            <p className="text-sm font-black text-[#1C1C1E] tracking-tight">
              {kpi.isCurrency ? formatCurrency(kpi.value as number) : kpi.value}
            </p>
            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: "hoje", label: "Hoje" },
          { id: "semana", label: "Esta Semana" },
          { id: "mes", label: "Este Mês" },
          { id: "pagos", label: "Pagos" },
          { id: "pendentes", label: "Pendentes" },
          { id: "cancelados", label: "Cancelados" },
          { id: "todos", label: "Todos" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id as any)}
            className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
              activeFilter === f.id 
                ? "bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]" 
                : "bg-white border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20 active:scale-95"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Financial Center Table */}
      <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F5F5F7]/50 border-b border-[#E5E5EA] text-[10px] font-black uppercase tracking-[0.2em] text-[#8E8E93]">
                <th className="py-6 px-8">Pedido</th>
                <th className="py-6 px-4">Cliente</th>
                <th className="py-6 px-4">Data</th>
                <th className="py-6 px-4">Forma de Pagamento</th>
                <th className="py-6 px-4 text-right">Valor</th>
                <th className="py-6 px-8 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5EA]/50">
              {filteredList.map((o) => {
                const isPaid = o.status === "paid" || o.status === "fully_paid" || o.paymentStatus === "paid";
                const isCancelled = o.status === "cancelled" || o.paymentStatus === "cancelled";
                
                return (
                  <tr 
                    key={o.id} 
                    onClick={() => setSelectedOrderId(o.id)}
                    className="group hover:bg-[#F5F5F7]/30 cursor-pointer transition-colors"
                  >
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center text-[#1C1C1E] font-black text-[10px]">
                          #{o.code.replace(/\D/g, '')}
                        </div>
                        <span className="text-xs font-bold text-[#1C1C1E] group-hover:text-indigo-600 transition-colors">
                          {o.code}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#1C1C1E]">{o.customerName}</span>
                        <span className="text-[9px] text-[#8E8E93] font-medium mt-0.5">{o.contact}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-xs font-medium text-[#8E8E93]">
                      {format(parseDate(o), "dd/MM/yyyy")}
                    </td>
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#1C1C1E] uppercase tracking-wide">
                        {o.plannedMethod === "credit_card" ? <CreditCard size={12} className="text-indigo-500" /> : <QrCode size={12} className="text-emerald-500" />}
                        {o.plannedMethod === "credit_card" ? "Cartão de Crédito" : o.plannedMethod === "digital_booklet" ? "Carnê Digital" : "PIX / Dinheiro"}
                      </div>
                    </td>
                    <td className="py-5 px-4 text-right">
                      <span className="text-xs font-black text-[#1C1C1E]">{formatCurrency(Number(o.total) || 0)}</span>
                    </td>
                    <td className="py-5 px-8 text-center">
                      {isPaid ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-wider border border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10B981]" />
                          Pago
                        </div>
                      ) : isCancelled ? (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[9px] font-black uppercase tracking-wider border border-rose-100 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_#F43F5E]" />
                          Cancelado
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[9px] font-black uppercase tracking-wider border border-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_#F59E0B]" />
                          Pendente
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredList.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <Search size={40} strokeWidth={1} className="text-[#8E8E93] mb-4" />
                      <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Nenhum registro encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Drawer */}
      <AnimatePresence>
        {selectedOrderId && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#F5F5F7] z-[110] shadow-2xl border-l border-[#E5E5EA] flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
                    <FileText size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight">Pagamento {selectedOrder.code}</h3>
                    <p className="text-[10px] font-black uppercase text-[#8E8E93] tracking-wider mt-0.5">Centro Financeiro Premium</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrderId(null)}
                  className="p-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                <div className={`p-6 rounded-[2rem] border flex items-center justify-between ${
                  (selectedOrder.status === 'paid' || selectedOrder.paymentStatus === 'paid') 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                  : 'bg-amber-50 border-amber-100 text-amber-700'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      (selectedOrder.status === 'paid' || selectedOrder.paymentStatus === 'paid') ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      {(selectedOrder.status === 'paid' || selectedOrder.paymentStatus === 'paid') ? <CheckCircle size={24} /> : <Clock size={24} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status Atual</p>
                      <h4 className="text-sm font-black uppercase tracking-wider">
                        {(selectedOrder.status === 'paid' || selectedOrder.paymentStatus === 'paid') ? "Pagamento Confirmado" : "Aguardando Recebimento"}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Recebido em</p>
                    <p className="text-xs font-bold">{format(parseDate(selectedOrder), "dd/MM/yyyy")}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Dados do Cliente</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Nome</span>
                        <p className="text-xs font-bold text-[#1C1C1E]">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Contato</span>
                        <p className="text-xs font-bold text-[#1C1C1E]">{selectedOrder.contact}</p>
                      </div>
                      {selectedOrder.address && (
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Endereço</span>
                          <p className="text-[10px] font-medium text-[#1C1C1E] leading-relaxed">{selectedOrder.address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <CreditCard size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Pagamento</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 bg-[#F5F5F7] rounded-2xl border border-[#E5E5EA] flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedOrder.plannedMethod === 'credit_card' ? <CreditCard size={18} className="text-indigo-600" /> : <QrCode size={18} className="text-emerald-600" />}
                          <span className="text-xs font-bold text-[#1C1C1E]">
                            {selectedOrder.plannedMethod === 'credit_card' ? 'Cartão de Crédito' : 'PIX / À Vista'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                  <div className="flex items-center gap-3">
                    <Package size={16} className="text-[#8E8E93]" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Itens</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#F5F5F7]/30 border border-[#E5E5EA] rounded-[1.5rem]">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] overflow-hidden">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-[#1C1C1E]">{item.product_name}</h5>
                            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">
                              Qtd: {item.quantity} • {formatCurrency(item.current_price)}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#1C1C1E]">{formatCurrency(item.current_price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-8 shadow-sm mb-10">
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-[#1C1C1E]" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Histórico Financeiro</h4>
                  </div>
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5E5EA]">
                    {selectedOrder.history?.map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className="absolute -left-10 top-1 w-6 h-6 rounded-full border-4 border-white bg-[#1C1C1E] flex items-center justify-center shadow-sm z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">{event.status}</span>
                          <p className="text-[11px] font-medium text-[#8E8E93] mt-2 italic">{event.notes}</p>
                        </div>
                      </div>
                    )).reverse()}
                  </div>
                </div>
              </div>

              <div className="p-8 bg-white border-t border-[#E5E5EA] flex flex-col gap-4">
                <div className="flex justify-between items-center px-4 py-6 bg-[#F5F5F7] rounded-[2rem] border border-[#E5E5EA]">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#8E8E93]">Total Recebido</span>
                  <span className="text-2xl font-black text-[#1C1C1E] tracking-tight">{formatCurrency(Number(selectedOrder.total) || 0)}</span>
                </div>
                <div className="flex items-center gap-4">
                  <button className="flex-1 py-4 bg-white border border-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F5F7] transition-all flex items-center justify-center gap-2">
                    <Printer size={14} /> Recibo PDF
                  </button>
                  <button className="flex-1 py-4 bg-[#1C1C1E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-[0_8px_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2">
                    <Send size={14} /> Notificar Cliente
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
