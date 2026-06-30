import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
} from "lucide-react";
import { Order } from "../../types";

interface InventoryTabProps {
  orders: Order[];
  onUpdateOrder: (id: string, data: Partial<Order>) => Promise<void>;
}

type KanbanStage =
  "waiting_production" | "production" | "conferencing" | "ready";

const STAGES: { id: KanbanStage; label: string; color: string }[] = [
  {
    id: "waiting_production",
    label: "Aguardando Produção",
    color: "text-slate-500 bg-slate-100",
  },
  {
    id: "production",
    label: "Em Produção",
    color: "text-amber-600 bg-amber-50",
  },
  {
    id: "conferencing",
    label: "Aguardando Conferência",
    color: "text-purple-600 bg-purple-50",
  },
  {
    id: "ready",
    label: "Pronto para Entrega",
    color: "text-emerald-600 bg-emerald-50",
  },
];

export const InventoryTab: React.FC<InventoryTabProps> = ({
  orders,
  onUpdateOrder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");
  const [filterPeriod, setFilterPeriod] = useState<string>("all");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Auto-set priority based on delivery date (urgente = delivery in < 3 days)
  const ordersWithCalculatedPriority = useMemo(() => {
    return orders.map((o) => {
      let priority = o.productionPriority || "normal";
      if (!o.productionPriority && o.deliveryDate) {
        const dDate = new Date(o.deliveryDate + "T00:00:00");
        const diffTime = dDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) priority = "urgente";
        else if (diffDays <= 7) priority = "alta";
      }
      return { ...o, calculatedPriority: priority };
    });
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return ordersWithCalculatedPriority.filter((o) => {
      const isKanbanStage = STAGES.some((s) => s.id === o.status);
      if (!isKanbanStage) return false;

      const term = searchTerm.toLowerCase();
      const matchSearch =
        o.code?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.items.some((i) => i.product_name.toLowerCase().includes(term)) ||
        o.observations?.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (filterPriority !== "all" && o.calculatedPriority !== filterPriority)
        return false;
      if (filterAtelier !== "all" && o.atelier !== filterAtelier) return false;
      if (filterResponsavel !== "all" && o.assignee !== filterResponsavel)
        return false;

      if (filterPeriod === "hoje") {
        const cDate = o.createdAt?.toDate
          ? o.createdAt.toDate()
          : new Date(o.createdAt);
        if (cDate.toDateString() !== today.toDateString()) return false;
      } else if (filterPeriod === "atrasados") {
        if (!o.deliveryDate) return false;
        const dDate = new Date(o.deliveryDate + "T00:00:00");
        if (dDate < today) return false;
      }

      return true;
    });
  }, [
    ordersWithCalculatedPriority,
    searchTerm,
    filterPriority,
    filterAtelier,
    filterResponsavel,
    filterPeriod,
  ]);

  // Indicators
  const waitingCount = ordersWithCalculatedPriority.filter(
    (o) => o.status === "waiting_production",
  ).length;
  const productionCount = ordersWithCalculatedPriority.filter(
    (o) => o.status === "production",
  ).length;
  const conferencingCount = ordersWithCalculatedPriority.filter(
    (o) => o.status === "conferencing",
  ).length;
  const readyTodayCount = ordersWithCalculatedPriority.filter((o) => {
    if (o.status !== "ready") return false;
    const history = o.history || [];
    const lastChange = history[history.length - 1];
    if (!lastChange || !lastChange.timestamp) return false;
    const changeDate = lastChange.timestamp.toDate
      ? lastChange.timestamp.toDate()
      : new Date(lastChange.timestamp);
    return changeDate.toDateString() === today.toDateString();
  }).length;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, stageId: KanbanStage) => {
    e.preventDefault();
    const orderId = e.dataTransfer.getData("orderId");
    if (!orderId) return;

    const order = orders.find((o) => o.id === orderId);
    if (!order || order.status === stageId) return;

    await updateOrderStatus(order, stageId);
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    const newHistory = [
      ...(order.history || []),
      {
        status: newStatus as any,
        timestamp: new Date(),
        notes: `Movido para ${STAGES.find((s) => s.id === newStatus)?.label || newStatus}`,
      },
    ];

    await onUpdateOrder(order.id, {
      status: newStatus as any,
      history: newHistory,
    });
  };

  // Group by stage
  const columns = STAGES.map((stage) => ({
    ...stage,
    items: filteredOrders.filter((o) => o.status === stage.id),
  }));

  const ateliers = Array.from(
    new Set(orders.map((o) => o.atelier).filter(Boolean)),
  );
  const assignees = Array.from(
    new Set(orders.map((o) => o.assignee).filter(Boolean)),
  );

  const getPriorityColor = (p: string) => {
    if (p === "urgente") return "text-rose-600 bg-rose-50 border-rose-200";
    if (p === "alta") return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-slate-500 bg-slate-50 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Aguardando", value: waitingCount, color: "text-slate-600" },
          {
            label: "Em Produção",
            value: productionCount,
            color: "text-amber-600",
          },
          {
            label: "Em Conferência",
            value: conferencingCount,
            color: "text-purple-600",
          },
          {
            label: "Concluídos Hoje",
            value: readyTodayCount,
            color: "text-emerald-600",
          },
        ].map((ind, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-[#E5E5EA] shadow-xs p-5 flex flex-col justify-center"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] mb-1">
              {ind.label}
            </span>
            <span className={`text-3xl font-extrabold ${ind.color}`}>
              {ind.value}
            </span>
          </div>
        ))}
      </div>

      {/* FILTROS E PESQUISA */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E5EA] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]"
              size={16}
            />
            <input
              type="text"
              placeholder="Buscar por código, cliente, produto..."
              className="w-full pl-12 pr-4 py-3 bg-[#F5F5F7] border border-transparent rounded-xl text-xs font-medium text-[#1C1C1E] outline-none focus:border-[#E5E5EA] focus:bg-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            <div className="flex items-center gap-2 shrink-0">
              <Filter size={14} className="text-[#8E8E93]" />
              <select
                className="bg-[#F5F5F7] border border-transparent rounded-lg px-3 py-2 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#E5E5EA] transition-all cursor-pointer"
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
              >
                <option value="all">Todos os Prazos</option>
                <option value="hoje">Hoje</option>
                <option value="atrasados">Atrasados</option>
              </select>
              <select
                className="bg-[#F5F5F7] border border-transparent rounded-lg px-3 py-2 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#E5E5EA] transition-all cursor-pointer"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="all">Todas as Prioridades</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
              {ateliers.length > 0 && (
                <select
                  className="bg-[#F5F5F7] border border-transparent rounded-lg px-3 py-2 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#E5E5EA] transition-all cursor-pointer"
                  value={filterAtelier}
                  onChange={(e) => setFilterAtelier(e.target.value)}
                >
                  <option value="all">Todos os Ateliês</option>
                  {ateliers.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
              {assignees.length > 0 && (
                <select
                  className="bg-[#F5F5F7] border border-transparent rounded-lg px-3 py-2 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#E5E5EA] transition-all cursor-pointer"
                  value={filterResponsavel}
                  onChange={(e) => setFilterResponsavel(e.target.value)}
                >
                  <option value="all">Todos os Responsáveis</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD */}
      <div className="flex flex-col md:flex-row gap-6 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
        {columns.map((col) => (
          <div
            key={col.id}
            className="flex-1 min-w-[320px] max-w-[400px] flex flex-col gap-4 shrink-0 snap-center"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1C1C1E]">
                  {col.label}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${col.color}`}
                >
                  {col.items.length}
                </span>
              </div>
            </div>

            {/* Cards Container */}
            <div className="flex flex-col gap-3 min-h-[200px] rounded-2xl bg-[#F5F5F7]/50 border border-[#E5E5EA] p-3">
              {col.items.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center p-6 border-2 border-dashed border-[#E5E5EA] rounded-xl text-[#8E8E93] text-xs font-medium uppercase tracking-wider">
                  Solte os pedidos aqui
                </div>
              ) : (
                <AnimatePresence>
                  {col.items.map((order) => {
                    const cDate = order.createdAt?.toDate
                      ? order.createdAt.toDate()
                      : new Date(order.createdAt);
                    const isOverdue =
                      order.deliveryDate &&
                      new Date(order.deliveryDate + "T00:00:00") < today;
                    const itemsCount = order.items.reduce(
                      (acc, i) => acc + i.quantity,
                      0,
                    );

                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={order.id}
                        draggable
                        onDragStart={(e: any) => handleDragStart(e, order.id)}
                        className="bg-white p-4 rounded-xl shadow-sm border border-[#E5E5EA] hover:border-[#1C1C1E] transition-all cursor-grab active:cursor-grabbing group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-[#cca062] uppercase tracking-wider">
                              #{order.code}
                            </span>
                            <span className="text-sm font-bold text-[#1C1C1E] line-clamp-1">
                              {order.customerName}
                            </span>
                          </div>
                          <div className="relative dropdown-container">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order, e.target.value)
                              }
                              className="appearance-none text-[0px] w-6 h-6 bg-transparent cursor-pointer focus:outline-none"
                              title="Mover para"
                            >
                              {STAGES.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                            <MoreVertical
                              size={14}
                              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8E8E93] pointer-events-none group-hover:text-[#1C1C1E]"
                            />
                          </div>
                        </div>

                        <div className="text-[10px] text-[#8E8E93] line-clamp-2 mb-3 h-7 leading-tight">
                          {order.items
                            .map((i) => `${i.quantity}x ${i.product_name}`)
                            .join(", ")}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] mb-3 relative">
                          <div className="bg-[#F5F5F7] p-2 rounded-lg flex flex-col relative group/date">
                            <span className="font-semibold text-[#8E8E93] uppercase tracking-wider mb-0.5 flex items-center gap-1">
                              <Calendar size={10} /> Produção
                            </span>
                            <span className="font-bold text-[#1C1C1E] truncate group-hover/date:hidden">
                              {order.productionDate
                                ? new Date(
                                    order.productionDate + "T00:00:00",
                                  ).toLocaleDateString("pt-BR")
                                : "Não def."}
                            </span>
                            <input
                              type="date"
                              value={order.productionDate || ""}
                              onChange={(e) =>
                                onUpdateOrder(order.id, {
                                  productionDate: e.target.value,
                                })
                              }
                              className="hidden group-hover/date:block absolute bottom-1.5 left-2 w-[calc(100%-16px)] bg-transparent text-[#1C1C1E] font-bold outline-none cursor-pointer text-[10px]"
                            />
                          </div>
                          <div
                            className={`p-2 rounded-lg flex flex-col relative group/date2 ${isOverdue ? "bg-rose-50 text-rose-700" : "bg-[#F5F5F7] text-[#1C1C1E]"}`}
                          >
                            <span className="font-semibold uppercase tracking-wider mb-0.5 flex items-center gap-1 opacity-70">
                              <Clock size={10} /> Entrega
                            </span>
                            <span className="font-bold truncate group-hover/date2:hidden">
                              {order.deliveryDate
                                ? new Date(
                                    order.deliveryDate + "T00:00:00",
                                  ).toLocaleDateString("pt-BR")
                                : "Não def."}
                            </span>
                            <input
                              type="date"
                              value={order.deliveryDate || ""}
                              onChange={(e) =>
                                onUpdateOrder(order.id, {
                                  deliveryDate: e.target.value,
                                })
                              }
                              className="hidden group-hover/date2:block absolute bottom-1.5 left-2 w-[calc(100%-16px)] bg-transparent text-[#1C1C1E] font-bold outline-none cursor-pointer text-[10px]"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#F2F2F7]">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase tracking-widest ${getPriorityColor(order.calculatedPriority as string)}`}
                            >
                              {order.calculatedPriority}
                            </span>
                            <span
                              className="text-[9px] text-[#8E8E93] font-medium"
                              title="Data do Pedido"
                            >
                              {cDate.toLocaleDateString("pt-BR")}
                            </span>
                            {(order.source === "catalog" ||
                              order.marketplace) && (
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200 text-[9px] font-bold uppercase tracking-widest">
                                {order.marketplace || "Catálogo"}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-bold text-[#1C1C1E] bg-[#F5F5F7] px-2 py-0.5 rounded border border-[#E5E5EA]">
                            {itemsCount} {itemsCount === 1 ? "item" : "itens"}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
