import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Phone,
  Calendar,
  Truck,
  CreditCard,
  Edit,
  Trash2,
  User,
  Clock,
  X,
  CheckCircle,
  Eye,
  Printer,
  Box,
  FileDown,
  MoreVertical,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, CompanyId, Product, Insumo } from "../../types";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { OrderReceiptModal } from "./OrderReceiptModal";
import { exportOrdersReportPDF } from "../../utils/pdfGenerator";

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  companyId: CompanyId;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onSaveOrder: (order: Partial<Order>) => void;
  onDeleteOrder: (id: string) => void;
  initialOrderId?: string | null;
}

const STATUS_GROUPS = [
  {
    id: "novo",
    label: "Novo",
    dbStatuses: ["novo pedido", "quote", "pending"],
    color: "#a855f7", // Roxo
    bgLight: "bg-[#f3e8ff] text-[#7e22ce] border-[#d8b4fe]",
  },
  {
    id: "producao",
    label: "Em Produção",
    dbStatuses: ["production", "in_production", "assembly"],
    color: "#f97316", // Laranja
    bgLight: "bg-[#ffedd5] text-[#c2410c] border-[#fdba74]",
  },
  {
    id: "aprovacao",
    label: "Aguardando Aprovação",
    dbStatuses: ["approval", "waiting_deposit", "waiting_payment", "planned_payment"],
    color: "#3b82f6", // Azul
    bgLight: "bg-[#eff6ff] text-[#1d4ed8] border-[#93c5fd]",
  },
  {
    id: "pronto",
    label: "Pronto",
    dbStatuses: ["ready", "delivery", "waiting_remaining", "planned_active"],
    color: "#22c55e", // Verde
    bgLight: "bg-[#f0fdf4] text-[#15803d] border-[#86efac]",
  },
  {
    id: "entregue",
    label: "Entregue",
    dbStatuses: ["delivered", "fully_paid"],
    color: "#86efac", // Verde Claro
    bgLight: "bg-[#dcfce7] text-[#166534] border-[#86efac]",
  },
  {
    id: "cancelado",
    label: "Cancelado",
    dbStatuses: ["cancelled", "canceled", "refunded"],
    color: "#ef4444", // Vermelho
    bgLight: "bg-[#fef2f2] text-[#b91c1c] border-[#fca5a5]",
  }
];

const ActionsDropdown: React.FC<{
  order: Order;
  onOpenDetail: () => void;
  onPrint: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ order, onOpenDetail, onPrint, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="w-10 h-10 rounded-full bg-[#FAF9F6] border border-[#F0E6D2] text-[#A09898] hover:text-[#4A4444] hover:bg-[#FAF9F6] hover:border-[#D1CACA] flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
          <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-[#F0E6D2] shadow-[0_10px_35px_rgba(240,230,210,0.3)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onOpenDetail();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-semibold text-[#4A4444] hover:bg-[#FAF9F6] hover:text-[#D48C8C] text-left transition-colors"
            >
              <Eye size={12} className="text-[#D48C8C]" /> Detalhes
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onPrint();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-semibold text-[#4A4444] hover:bg-[#FAF9F6] hover:text-[#D48C8C] text-left transition-colors"
            >
              <Printer size={12} className="text-[#D48C8C]" /> Comprovante
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-semibold text-[#4A4444] hover:bg-[#FAF9F6] hover:text-[#D48C8C] text-left transition-colors"
            >
              <Edit size={12} className="text-[#D48C8C]" /> Editar Pedido
            </button>
            <div className="my-1.5 border-t border-[#F0E6D2]" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-widest font-semibold text-red-500 hover:bg-rose-50 text-left transition-colors"
            >
              <Trash2 size={12} /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  products,
  insumos,
  companyId,
  onUpdateStatus,
  onSaveOrder,
  onDeleteOrder,
  initialOrderId,
}) => {
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");

  const getBrandTheme = (cId: string) => {
    switch (cId) {
      case "guennita":
        return {
          name: "Com amor, Guennita",
          primary: "#6B1D2F", // Marsala
          secondary: "#D4AF37", // Dourado
          accent: "#6B1D2F",
          bgBadge: "bg-red-50 text-[#6B1D2F] border-red-100",
          btnGradient: "from-[#6B1D2F] to-[#800000]",
          textClass: "text-[#6B1D2F]",
          badgeColor: "#6B1D2F",
          accentLight: "rgba(107, 29, 47, 0.15)",
        };
      case "mimada":
        return {
          name: "Mimada Sim",
          primary: "#FF69B4", // Pink cintilante
          secondary: "#000000", // Preto
          accent: "#FF69B4",
          bgBadge: "bg-pink-50 text-[#FF69B4] border-pink-100",
          btnGradient: "from-[#FF69B4] to-[#E04D96]",
          textClass: "text-[#FF69B4]",
          badgeColor: "#FF69B4",
          accentLight: "rgba(255, 105, 180, 0.15)",
        };
      case "pallyra":
      default:
        return {
          name: "La Pallyra",
          primary: "#111111", // Preto
          secondary: "#D4AF37", // Dourado
          accent: "#D4AF37", // Dourado
          bgBadge: "bg-amber-50 text-[#B8860B] border-amber-100",
          btnGradient: "from-neutral-900 to-[#111111]",
          textClass: "text-[#B8860B]",
          badgeColor: "#D4AF37",
          accentLight: "rgba(212, 175, 55, 0.15)",
        };
    }
  };

  const getAtendenteForOrder = (orderCode: string, compId: string) => {
    const sum = (orderCode || "").split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const employeePool: Record<string, string[]> = {
      guennita: ["Guennita", "Ana C.", "Beatriz", "Carla M."],
      pallyra: ["Sílvia R.", "Mariana", "Patrícia", "Daniele"],
      mimada: ["Gisele K.", "Renata S.", "Gaby", "Larissa"]
    };
    const list = employeePool[compId] || employeePool.pallyra;
    return list[sum % list.length];
  };

  const getProductInfoForCard = (order: Order) => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      const matchedProduct = products.find(p => p.id === firstItem.productId || p.id === firstItem.id);
      const image = matchedProduct?.image || firstItem.image;
      const name = matchedProduct?.product_name || firstItem.product_name;
      const count = order.items.reduce((acc, i) => acc + i.quantity, 0);
      return { image, name, count };
    }
    return { image: null, name: "Produto Personalizado", count: 1 };
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [selectedAteliers, setSelectedAteliers] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<
    string[]
  >([]);
  const [isDetailOpen, setIsDetailOpen] = useState<string | null>(
    initialOrderId || null,
  );

  const atelieres = [
    { id: "all", name: "TODOS", prefix: "ALL" },
    { id: "pallyra", name: "La Pallyra", prefix: "LP" },
    { id: "guennita", name: "com amor, Guennita", prefix: "CG" },
    { id: "mimada", name: "Mimada Sim", prefix: "MS" },
  ];

  const statusOptions = [
    {
      value: "novo pedido",
      label: "NOVO PEDIDO",
      color: "bg-purple-100/50 text-purple-600 border-purple-200",
    },
    {
      value: "quote",
      label: "ORÇAMENTO",
      color: "bg-orange-100/50 text-orange-600 border-orange-200",
    },
    {
      value: "approval",
      label: "APROVAÇÃO DA ARTE",
      color: "bg-indigo-100/50 text-indigo-600 border-indigo-200",
    },
    {
      value: "waiting_deposit",
      label: "AGUARDANDO SINAL",
      color: "bg-yellow-100/50 text-yellow-700 border-yellow-300",
    },
    {
      value: "production",
      label: "EM PRODUÇÃO",
      color:
        "bg-blue-100/50 text-blue-600 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]",
    },
    {
      value: "assembly",
      label: "EM MONTAGEM",
      color:
        "bg-pink-100/50 text-pink-600 border-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.1)]",
    },
    {
      value: "ready",
      label: "PRONTO PARA ENTREGA",
      color:
        "bg-emerald-100/50 text-emerald-600 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    },
    {
      value: "waiting_remaining",
      label: "AGUARDANDO PAGAMENTO RESTANTE",
      color: "bg-red-50 text-red-600 border-red-200",
    },
    {
      value: "planned_active",
      label: "PAGAMENTO PLANEJADO ATIVO",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200",
    },
    {
      value: "fully_paid",
      label: "PEDIDO QUITADO",
      color: "bg-green-50 text-green-600 border-green-200",
    },
    {
      value: "pending",
      label: "PENDENTE",
      color: "bg-yellow-100/50 text-yellow-600 border-yellow-200",
    },
    {
      value: "delivered",
      label: "ENTREGUE",
      color: "bg-slate-100/50 text-[#A09898] border-slate-200",
    },
    {
      value: "cancelled",
      label: "CANCELADO",
      color:
        "bg-slate-100/50 text-rose-600 border-rose-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]",
    },
  ];

  const statusLabels: Record<string, string> = {
    "novo pedido": "Novo",
    quote: "Orçamento",
    approval: "Arte",
    waiting_deposit: "Sinal",
    production: "Produção",
    assembly: "Montagem",
    ready: "Pronto",
    waiting_remaining: "Pgto. Restante",
    planned_active: "Pgto. Planejado",
    fully_paid: "Quitado",
    pending: "Pendente",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const getDeliveryStatus = (deliveryDate: string, currentStatus: string) => {
    if (currentStatus === "delivered" || currentStatus === "cancelled")
      return null;
    if (!deliveryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate + "T12:00:00");
    delivery.setHours(0, 0, 0, 0);

    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return {
        label: "ATRASADO",
        color: "bg-red-600 text-yellow-300 border-red-700 animate-pulse",
      };
    }
    if (diffDays <= 7) {
      return {
        label: "ATENÇÃO",
        color: "bg-yellow-400 text-red-700 border-yellow-500",
      };
    }
    return null;
  };

  const generateOrderCode = (cId: CompanyId) => {
    const prefixMap: Record<string, string> = {
      pallyra: "LP",
      guennita: "CG",
      mimada: "MS",
    };
    const prefix = prefixMap[cId] || "LP";
    const randomNumbers = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNumbers}`;
  };

  const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 11)
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    return value;
  };

  useEffect(() => {
    if (initialOrderId) {
      setIsDetailOpen(initialOrderId);
      setSearchTerm(""); // Clear search if expanding a specific order
      setSelectedAteliers([]); // Show all by clearing selection
    }
  }, [initialOrderId]);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  const filteredOrders = orders
    .filter((o) => {
      const matchesSearch =
        (o.customerName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (o.code || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAtelier =
        selectedAteliers.length === 0
          ? true
          : selectedAteliers.includes(o.companyId || "");
      const matchesPayment =
        selectedPaymentStatuses.length === 0
          ? true
          : selectedPaymentStatuses.includes(o.paymentStatus || "pending");
      return matchesSearch && matchesAtelier && matchesPayment;
    })
    .sort((a, b) => {
      // Priority 1: Incomplete orders (not delivered/cancelled)
      const isInactiveA = ["delivered", "cancelled"].includes(a.status);
      const isInactiveB = ["delivered", "cancelled"].includes(b.status);
      if (isInactiveA !== isInactiveB) return isInactiveA ? 1 : -1;

      // Priority 2: Creation date (newest first) - To fix user's concern about "not appearing"
      const timeA =
        a.createdAt?.toMillis?.() ||
        (a.createdAt as any)?.seconds * 1000 ||
        Date.now();
      const timeB =
        b.createdAt?.toMillis?.() ||
        (b.createdAt as any)?.seconds * 1000 ||
        Date.now();
      return timeB - timeA;
    });

  const columns = [
    {
      id: "budget",
      label: "Orçamento",
      status: ["quote", "novo pedido", "waiting_deposit"],
    },
    {
      id: "production",
      label: "Produção",
      status: ["production", "assembly", "approval", "pending"],
    },
    { id: "done", label: "Finalizado", status: ["ready", "delivered"] },
  ];

  const getStatusType = (status: string) => {
    if (["ready", "delivered"].includes(status)) return "finished";
    if (["production", "assembly", "approval", "pending"].includes(status))
      return "production";
    return "budget";
  };

  const [viewMode, setViewMode] = useState<"kanban" | "list">("list");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Bar Refined with 3D Glassmorphic Controls */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[1.5rem] border border-[#F0E6D2] shadow-[0_10px_30px_rgba(240,230,210,0.1)]">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D1CACA]"
              size={14}
            />
            <input
              type="text"
              placeholder="Pesquisar pedido..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] text-[10px] uppercase font-semibold tracking-widest outline-none focus:border-[#D48C8C] transition-all text-[#4A4444]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-end">
          <div className="flex gap-2">
            {atelieres
              .filter((a) => a.id !== "all")
              .map((atl) => {
                const isSelected = selectedAteliers.includes(atl.id);
                const theme = getBrandTheme(atl.id);
                return (
                  <button
                    key={atl.id}
                    onClick={() => {
                      setSelectedAteliers((prev) =>
                        prev.includes(atl.id)
                          ? prev.filter((a) => a !== atl.id)
                          : [...prev, atl.id],
                      );
                    }}
                    className={`px-3 py-2 rounded-xl text-[8.5px] font-bold uppercase tracking-widest border transition-all ${
                      isSelected 
                        ? "bg-[#FAF9F6] text-white shadow-inner" 
                        : "bg-white border-[#F0E6D2] text-[#A09898] hover:bg-[#FAF9F6]"
                    }`}
                    style={isSelected ? {
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                      textShadow: "0 1px 2px rgba(0,0,0,0.4)"
                    } : undefined}
                  >
                    {atl.prefix}
                  </button>
                );
              })}
          </div>

          <div className="h-6 w-px bg-[#F0E6D2] hidden sm:block" />

          {/* Export PDF Button: 3D Crystal / Glassmorphism Premium */}
          <button
            onClick={() => exportOrdersReportPDF(filteredOrders, selectedAteliers.length === 1 ? selectedAteliers[0] : "all")}
            className="flex items-center gap-2 font-black py-3.5 px-6 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all text-[9.5px] uppercase tracking-widest text-[#4A4444] cursor-pointer"
            style={{
              background: "linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.45))",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.6)",
              boxShadow: "0 8px 32px 0 rgba(240, 230, 210, 0.25), inset 0 -4px 8px rgba(0, 0, 0, 0.04), inset 0 4px 8px rgba(255, 255, 255, 0.6)",
              textShadow: "0 1px 1px rgba(255, 255, 255, 0.5)",
            }}
          >
            <FileDown size={14} className="text-[#D4AF37]" /> Exportar PDF
          </button>

          {/* Novo Pedido Button: 3D Crystal / Brand Colored */}
          <button
            onClick={() => {
              setEditingOrder({
                companyId:
                  selectedAteliers.length === 1
                    ? (selectedAteliers[0] as CompanyId)
                    : companyId,
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 text-white font-black py-3.5 px-6 rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-all text-[9.5px] uppercase tracking-widest relative overflow-hidden group shadow-lg cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${getBrandTheme(selectedAteliers.length === 1 ? selectedAteliers[0] : companyId).primary}, ${getBrandTheme(selectedAteliers.length === 1 ? selectedAteliers[0] : companyId).primary}dd)`,
              boxShadow: `0 10px 25px ${getBrandTheme(selectedAteliers.length === 1 ? selectedAteliers[0] : companyId).primary}30, inset 0 -4px 8px rgba(0,0,0,0.18), inset 0 4px 8px rgba(255,255,255,0.3)`
            }}
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>
      </div>

      {/* Production pipeline controls (Status no topo) - Breathtaking 3D design */}
      <div className="bg-[#FAF9F6] p-6 rounded-[2.5rem] border border-[#F0E6D2] shadow-xs">
        <span className="block text-[8px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4">Fluxo de Produção Personalizada</span>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
          <button
            onClick={() => setSelectedStatusFilter("all")}
            className={`px-4 py-3 rounded-2xl border text-left transition-all relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] duration-300 ${
              selectedStatusFilter === "all"
                ? "bg-white border-neutral-300"
                : "bg-white/40 hover:bg-white/80 border-neutral-100"
            }`}
          >
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Todos</span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {filteredOrders.length}
              </span>
            </div>
            <p className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">Painel Geral</p>
          </button>

          {STATUS_GROUPS.map((group) => {
            const isSelected = selectedStatusFilter === group.id;
            const count = filteredOrders.filter((o) => group.dbStatuses.includes(o.status.toLowerCase())).length;

            return (
              <button
                key={group.id}
                onClick={() => setSelectedStatusFilter(group.id)}
                className={`px-4 py-3 rounded-2xl border text-left transition-all relative overflow-hidden group hover:scale-[1.03] active:scale-[0.98] duration-300 ${
                  isSelected
                    ? "bg-white"
                    : "bg-white/40 hover:bg-white/80 border-neutral-100"
                }`}
                style={{
                  borderColor: isSelected ? group.color : "rgba(240, 230, 210, 0.4)",
                  backgroundColor: isSelected ? `${group.color}08` : undefined
                }}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${group.bgLight}`}>
                    {count}
                  </span>
                </div>
                <p className="text-[8px] font-medium text-gray-400 uppercase tracking-widest">Ateliê Ativo</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Orders Render: Breathtaking Horizontal Cards instead of Tables */}
      <div className="space-y-6">
        {orders.filter((order) => {
          if (selectedStatusFilter === "all") return true;
          const group = STATUS_GROUPS.find((g) => g.id === selectedStatusFilter);
          if (!group) return true;
          return group.dbStatuses.includes(order.status.toLowerCase());
        }).length === 0 ? (
          <div className="py-24 text-center bg-white rounded-[2.5rem] border border-[#F0E6D2] text-[#A09898] font-bold uppercase tracking-widest text-[9px] shadow-[0_10px_30px_rgba(240,230,210,0.1)]">
            Nenhum pedido encontrado nesta etapa.
          </div>
        ) : (
          filteredOrders.filter((order) => {
            if (selectedStatusFilter === "all") return true;
            const group = STATUS_GROUPS.find((g) => g.id === selectedStatusFilter);
            if (!group) return true;
            return group.dbStatuses.includes(order.status.toLowerCase());
          }).map((order, idx) => {
            const statusGroup = STATUS_GROUPS.find((group) => 
              group.dbStatuses.includes(order.status.toLowerCase())
            );
            const brandTheme = getBrandTheme(order.companyId);
            const cardProduct = getProductInfoForCard(order);

            return (
              <motion.div
                key={`order-card-${order.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.4) }}
                className="bg-[#FFFFFF] rounded-[1.5rem] border border-[#F0E6D2] shadow-[0_6px_20px_rgba(240,230,210,0.5)] transition-all hover:shadow-[0_12px_32px_rgba(240,230,210,0.6)] hover:-translate-y-[2px] duration-300 overflow-hidden flex items-stretch cursor-pointer"
                onClick={() => setIsDetailOpen(order.id)}
              >
                {/* 1. Barra Lateral Colorida do Status */}
                <div 
                  className="w-2 shrink-0 transition-all duration-300"
                  style={{ backgroundColor: statusGroup?.color || "#e2e8f0" }}
                />

                {/* Main Content Area - Professional Stripe/Notion Grid */}
                <div className="flex-1 w-full overflow-x-auto scrollbar-hide">
                  <div className="grid grid-cols-[minmax(180px,1.5fr)_minmax(180px,1.5fr)_110px_130px_100px_90px_40px] items-center gap-4 px-5 py-4 min-w-[820px]">
                    
                    {/* [1. NOME DO CLIENTE & ATELIÊ] */}
                    <div className="flex flex-col justify-center min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 rounded text-gray-500 bg-gray-50 border border-gray-100"
                        >
                          {brandTheme.name}
                        </span>
                      </div>
                      <h4 className="text-[15px] font-medium text-slate-800 tracking-tight truncate w-full" title={order.customerName}>
                        {order.customerName}
                      </h4>
                    </div>

                    {/* [2. PRODUTO (FOTO + NOME)] */}
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      <div className="w-12 h-12 shrink-0 rounded bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center relative">
                        {cardProduct.image ? (
                          <img 
                            src={cardProduct.image} 
                            alt={cardProduct.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Box size={20} className="text-gray-300" />
                        )}
                        {cardProduct.count > 1 && (
                          <span className="absolute -top-1 -right-1 bg-gray-800 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                            +{cardProduct.count - 1}
                          </span>
                        )}
                      </div>
                      <span className="text-[14px] font-medium text-slate-600 truncate w-full" title={cardProduct.name || "Produto"}>
                        {cardProduct.name || "Produto Genérico"}
                      </span>
                    </div>

                    {/* [3. DATA DE ENTREGA] */}
                    <div className="flex flex-col justify-center gap-1.5">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Entrega</span>
                      <div className="flex items-center gap-1.5 text-slate-700 text-[14px]">
                        <Calendar size={14} className="text-gray-400" />
                        <span>
                          {order.deliveryDate
                            ? safeFormatISO(order.deliveryDate, "dd/MM")
                            : "--/--"}
                        </span>
                      </div>
                    </div>

                    {/* [4. STATUS] */}
                    <div className="flex items-center">
                      <span className={`flex items-center justify-center text-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${statusGroup?.bgLight || "bg-slate-50 text-slate-600 border-slate-200"} w-full`}>
                        {order.status === 'delivered' || order.status === 'fully_paid' ? (
                          <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                        ) : order.status === 'cancelled' ? (
                          <XCircle size={13} className="text-red-500 shrink-0" />
                        ) : null}
                        <span>{statusGroup?.label || order.status}</span>
                      </span>
                    </div>

                    {/* [5. VALOR TOTAL] */}
                    <div className="flex flex-col justify-center gap-1 text-right">
                      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest text-right">Valor</span>
                      <p className="text-[15px] font-medium text-slate-800">
                        {formatCurrency(Number(order.total) || 0)}
                      </p>
                    </div>

                    {/* [6. CÓDIGO DO PEDIDO] */}
                    <div className="flex items-center justify-end">
                      <span className="font-mono text-[12px] font-medium text-gray-500 uppercase tracking-widest text-right px-2">
                        #{order.code}
                      </span>
                    </div>

                    {/* [7. MENU ...] */}
                    <div className="flex justify-end pr-2" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown 
                        order={order}
                        onOpenDetail={() => setIsDetailOpen(order.id)}
                        onPrint={() => setPrintingOrder(order)}
                        onEdit={() => {
                          setEditingOrder(order);
                          setIsModalOpen(true);
                        }}
                        onDelete={() => setOrderToDelete(order.id)}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Detail Overlay / In-line */}
      <AnimatePresence>
        {isDetailOpen && (
          <div
            key="order-detail-overlay"
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
            onClick={() => setIsDetailOpen(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-[#F0E6D2] shadow-2xl p-12 relative scrollbar-hide"
            >
              <button
                onClick={() => setIsDetailOpen(null)}
                className="absolute top-8 right-8 p-3 rounded-full hover:bg-[#FAF9F6] text-[#A09898] transition-all"
              >
                <X size={24} />
              </button>

              {orders.find((o) => o.id === isDetailOpen) && (
                <div className="space-y-12">
                  {/* Header Detail */}
                  <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1 bg-[#FAF9F6] border border-[#F0E6D2] rounded-lg text-[10px] font-semibold text-[#4A4444] uppercase tracking-widest">
                          Pedido: {orders.find((o) => o.id === isDetailOpen)?.code}
                        </span>
                        <span className="text-[10px] font-semibold uppercase text-[#D48C8C] tracking-widest">
                          {orders.find((o) => o.id === isDetailOpen)?.companyId}
                        </span>
                      </div>
                      <h2 className="text-3xl font-sans font-semibold text-[#4A4444] uppercase">
                        {
                          orders.find((o) => o.id === isDetailOpen)
                            ?.customerName
                        }
                      </h2>
                      <div className="flex items-center gap-4 mt-6">
                        <a
                          href={`tel:${orders.find((o) => o.id === isDetailOpen)?.contact}`}
                          className="flex items-center gap-2 text-[#A09898] hover:text-[#D48C8C] transition-all text-[11px] font-semibold uppercase tracking-widest"
                        >
                          <Phone size={14} />{" "}
                          {orders.find((o) => o.id === isDetailOpen)?.contact}
                        </a>
                        <div className="h-4 w-px bg-[#F0E6D2]" />
                        <div className="flex items-center gap-2 text-[#A09898] text-[11px] font-semibold uppercase tracking-widest">
                          <Calendar size={14} />{" "}
                          {orders.find((o) => o.id === isDetailOpen)
                            ?.deliveryDate
                            ? safeFormatISO(
                                orders.find((o) => o.id === isDetailOpen)!
                                  .deliveryDate!,
                                "dd/MM/yyyy",
                              )
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-[9px] font-semibold uppercase text-[#A09898] tracking-[0.2em] mb-1">
                          Status Atual
                        </p>
                        <span
                          className={`px-6 py-2 rounded-xl text-[10px] font-semibold tracking-widest border uppercase transition-shadow ${statusOptions.find((s) => s.value === orders.find((o) => o.id === isDetailOpen)?.status.toLowerCase())?.color || "bg-slate-100"}`}
                        >
                          {statusOptions.find(
                            (s) =>
                              s.value ===
                              orders
                                .find((o) => o.id === isDetailOpen)
                                ?.status.toLowerCase(),
                          )?.label ||
                            orders.find((o) => o.id === isDetailOpen)?.status}
                        </span>
                      </div>
                      <div className="text-right mt-2">
                        <p className="text-[9px] font-semibold uppercase text-[#A09898] tracking-[0.2em] mb-1">
                          Total do Pedido
                        </p>
                        <p className="text-3xl font-sans font-semibold text-[#4A4444]">
                          {formatCurrency(
                            orders.find((o) => o.id === isDetailOpen)?.total ||
                              0,
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Products & Logistic */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D48C8C] border-b border-[#F0E6D2] pb-3">
                        Itens Selecionados
                      </h3>
                      <div className="space-y-3">
                        {orders
                          .find((o) => o.id === isDetailOpen)
                          ?.items?.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center p-4 bg-[#FAF9F6] rounded-2xl border border-[#F0E6D2]"
                            >
                              <div>
                                <p className="text-[11px] font-semibold text-[#4A4444] uppercase">
                                  {item.product_name}
                                </p>
                                <p className="text-[9px] text-[#A09898] font-medium uppercase mt-0.5 tracking-wider">
                                  Quantidade: {item.quantity}
                                </p>
                              </div>
                              <span className="text-[11px] font-semibold text-[#4A4444]">
                                {formatCurrency(
                                  (item.retail_price || 0) *
                                    (item.quantity || 0),
                                )}
                              </span>
                            </div>
                          ))}
                      </div>

                      <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#F0E6D2] space-y-3">
                        <div className="flex justify-between text-[9px] font-semibold uppercase text-[#A09898]">
                          <span>Subtotal</span>
                          <span>
                            {formatCurrency(
                              (orders.find((o) => o.id === isDetailOpen)
                                ?.total || 0) -
                                (orders.find((o) => o.id === isDetailOpen)
                                  ?.shippingCost || 0),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] font-semibold uppercase text-[#A09898]">
                          <span>Frete / Delivery</span>
                          <span>
                            {formatCurrency(
                              orders.find((o) => o.id === isDetailOpen)
                                ?.shippingCost || 0,
                            )}
                          </span>
                        </div>
                        <div className="pt-3 border-t border-[#F0E6D2] flex justify-between text-[11px] font-semibold uppercase text-[#4A4444]">
                          <span>Total</span>
                          <span>
                            {formatCurrency(
                              orders.find((o) => o.id === isDetailOpen)
                                ?.total || 0,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#D48C8C] border-b border-[#F0E6D2] pb-3">
                        Logística & Pagamento
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#F0E6D2]">
                          <p className="text-[8px] font-semibold uppercase text-[#A09898] tracking-widest mb-1">
                            Entrega
                          </p>
                          <p className="text-[10px] font-semibold text-[#4A4444] uppercase">
                            {
                              orders.find((o) => o.id === isDetailOpen)
                                ?.deliveryType
                            }
                          </p>
                        </div>
                        <div className="p-4 bg-[#FAF9F6] rounded-2xl border border-[#F0E6D2]">
                          <p className="text-[8px] font-semibold uppercase text-[#A09898] tracking-widest mb-1">
                            Status Pagto.
                          </p>
                          <p className="text-[10px] font-semibold text-[#D48C8C] uppercase">
                            {
                              orders.find((o) => o.id === isDetailOpen)
                                ?.paymentStatus === 'paid' ? 'PAGO' : 
                                orders.find((o) => o.id === isDetailOpen)?.paymentStatus
                            }
                          </p>
                        </div>
                      </div>

                      {orders.find((o) => o.id === isDetailOpen)?.paymentMode === 'planned' && (
                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                          <p className="text-[9px] font-bold uppercase text-indigo-800 tracking-widest mb-1">
                            Detalhes do Planejamento
                          </p>
                          <div className="flex justify-between text-[10px] text-indigo-700">
                             <span className="font-semibold">Valor Restante:</span>
                             <span>{formatCurrency(orders.find(o => o.id === isDetailOpen)?.remainingAmount || 0)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-indigo-700">
                             <span className="font-semibold">Método Escolhido:</span>
                             <span className="uppercase">{orders.find(o => o.id === isDetailOpen)?.plannedMethod === 'credit_card' ? 'Cartão de Crédito' : 'Carnê Digital (WhatsApp)'}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-indigo-700">
                             <span className="font-semibold">Parcelamento:</span>
                             <span>{orders.find(o => o.id === isDetailOpen)?.remainingInstallments}x de {formatCurrency(orders.find(o => o.id === isDetailOpen)?.remainingInstallmentValue || 0)}</span>
                          </div>
                        </div>
                      )}

                      <div className="p-5 bg-white border border-[#F0E6D2] rounded-2xl min-h-[100px]">
                        <p className="text-[8px] font-semibold uppercase text-[#A09898] tracking-widest mb-3">
                          Observações Adicionais
                        </p>
                        <p className="text-[11px] text-[#4A4444] leading-relaxed italic">
                          {orders.find((o) => o.id === isDetailOpen)
                            ?.observations || "Nenhuma observação informada."}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[8px] font-semibold uppercase text-[#A09898] tracking-widest">
                          Alterar Fluxo do Pedido
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {statusOptions.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() =>
                                onUpdateStatus(isDetailOpen!, opt.value as any)
                              }
                              className={`px-3 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest border transition-all ${orders.find((o) => o.id === isDetailOpen)?.status.toLowerCase() === opt.value ? "bg-[#D48C8C] border-[#D48C8C] text-white" : "bg-white text-[#A09898] border-[#F0E6D2] hover:bg-[#FAF9F6]"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Order Modal Redesigned */}
      {isModalOpen && (
        <OrderFormModal
          editingOrder={editingOrder}
          products={products}
          companyId={companyId}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const atelier = data.companyId || companyId;
            const fullData = {
              ...data,
              id: editingOrder?.id,
              code: editingOrder?.code || generateOrderCode(atelier as any),
              companyId: atelier as CompanyId,
              source: (editingOrder?.source || "admin") as any,
            };
            await onSaveOrder(fullData);
            setIsModalOpen(false);
          }}
        />
      )}

      {printingOrder && (
        <OrderReceiptModal
          order={printingOrder}
          onClose={() => setPrintingOrder(null)}
        />
      )}
      {orderToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white max-w-md w-full rounded-3xl p-8 text-center animate-in zoom-in-95">
            <Trash2 size={48} className="mx-auto text-slate-9000 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase">
              Excluir Pedido?
            </h3>
            <p className="text-sm text-gray-500 mb-8">
              Essa ação não pode ser desfeita.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-gray-500 uppercase text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-500/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface OrderFormModalProps {
  editingOrder: Partial<Order> | null;
  products: Product[];
  companyId: string;
  onClose: () => void;
  onSave: (data: Partial<Order>) => void;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  editingOrder,
  products,
  companyId,
  onClose,
  onSave,
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(editingOrder?.items || []);
  const [shipping, setShipping] = useState(editingOrder?.shippingCost || 0);
  const [isDepositPaid, setIsDepositPaid] = useState(
    editingOrder?.hasSignal || false,
  );
  const [observations, setObservations] = useState(
    editingOrder?.observations || "",
  );
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>(
    (editingOrder?.companyId as CompanyId) || (companyId as CompanyId),
  );
  const [cpfCnpj, setCpfCnpj] = useState(editingOrder?.customerCpfCnpj || "");
  const [deliveryType, setDeliveryType] = useState(
    editingOrder?.deliveryType || "pickup",
  );
  const [isWholesale, setIsWholesale] = useState(
    editingOrder?.isWholesale || false,
  );

  const subtotal = items.reduce(
    (sum, it) => sum + it.retail_price * it.quantity,
    0,
  );
  const totalWithShipping = subtotal + shipping;
  const depositValue = subtotal * 0.5;

  const maskCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11)
      return v
        .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
        .slice(0, 14);
    return v
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      .slice(0, 18);
  };

  const companiesList = [
    { id: "pallyra", name: "La Pallyra" },
    { id: "guennita", name: "com amor, Guennita" },
    { id: "mimada", name: "Mimada Sim" },
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white   w-full   max-w-4xl   max-h-[90vh] overflow-y-auto rounded-[2rem] border border-lilac/30 p-8 md:p-10 shadow-2xl   relative max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-[#A09898] transition-all"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest mb-8">
          {editingOrder?.id ? "Editar Pedido" : "Novo Pedido"}
        </h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              await onSave({
                customerName: formData.get("customerName") as string,
                contact: formData.get("contact") as string,
                customerCpfCnpj: cpfCnpj,
                address: formData.get("address") as string,
                total: totalWithShipping,
                status: formData.get("status") as any,
                deliveryDate: formData.get("deliveryDate") as string,
                deliveryType: deliveryType as any,
                shippingCost: shipping,
                observations: observations,
                hasSignal: isDepositPaid,
                signalValue: depositValue,
                items,
                isWholesale: isWholesale,
                isEmergency: formData.get("isEmergency") === "on",
                companyId: selectedAtelier,
              });
              onClose();
            } catch (err) {
              console.error("Erro ao salvar pedido:", err);
              alert("Erro ao salvar pedido.");
            } finally {
              setLoading(false);
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Escolher Ateliê
              </label>
              <select
                value={selectedAtelier}
                onChange={(e) =>
                  setSelectedAtelier(e.target.value as CompanyId)
                }
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              >
                {companiesList.map((c, cIdx) => (
                  <option key={`company-opt-${c.id}-${cIdx}`} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Nome do Cliente
              </label>
              <input
                name="customerName"
                defaultValue={editingOrder?.customerName}
                required
                type="text"
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                CPF / CNPJ
              </label>
              <input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                placeholder="000.000.000-00"
                required
                type="text"
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Contato
              </label>
              <input
                name="contact"
                defaultValue={editingOrder?.contact}
                required
                type="text"
                placeholder="(44) 9 9999-9999"
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Endereço Completo
              </label>
              <input
                name="address"
                defaultValue={editingOrder?.address}
                required
                type="text"
                placeholder="Rua, Número, Bairro, Cidade"
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Tipo de Entrega
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as any)}
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none text-slate-900"
              >
                <option value="pickup">RETIRADA</option>
                <option value="delivery">DELIVERY</option>
                <option value="shipping">ENVIO</option>
              </select>
            </div>
          </div>

          {deliveryType === "shipping" && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
              <label className="text-[9px] uppercase font-black text-blue-400 tracking-widest block mb-2">
                Custo do Frete (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                className="w-full bg-white border border-blue-200 rounded-xl px-5 py-3 text-[11px] font-black outline-none font-mono text-blue-600"
              />
            </div>
          )}

          {/* Incluir Produto Select */}
          <div className="p-6 rounded-2xl bg-lilac/5 border border-lilac/10 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-black uppercase text-lilac tracking-widest">
                Produtos Selecionados
              </h4>
              <div className="text-[10px] font-black text-slate-900">
                Ateliê: {selectedAtelier.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <select
                onChange={(e) => {
                  const p = products.find((prod) => prod.id === e.target.value);
                  if (p) {
                    const existingIdx = items.findIndex((i) => i.id === p.id);
                    if (existingIdx !== -1) {
                      const newItems = [...items];
                      newItems[existingIdx].quantity =
                        (newItems[existingIdx].quantity || 1) + 1;
                      setItems(newItems);
                    } else {
                      setItems([...items, { ...p, quantity: 1 }]);
                    }
                  }
                  e.target.value = "";
                }}
                className="w-full bg-white border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none"
              >
                <option value="">+ Adicionar Produto do Catálogo...</option>
                {products
                  .filter((p) => p.company === selectedAtelier)
                  .map((p, pIdx) => (
                    <option key={`prod-opt-${p.id}-${pIdx}`} value={p.id}>
                      {p.product_name} - {formatCurrency(p.retail_price)}
                    </option>
                  ))}
              </select>
            </div>

            {items.map((item, idx) => (
              <div
                key={`edit-cart-item-${item.id || "new"}-${idx}`}
                className="flex items-center gap-4 bg-white p-3 rounded-xl border border-lilac/10 shadow-sm"
              >
                <span className="flex-1 text-[11px] font-bold text-gray-700">
                  {item.product_name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#A09898]">
                    QTD:
                  </span>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[idx].quantity = Number(e.target.value);
                      setItems(newItems);
                    }}
                    className="w-16 bg-white border border-lilac/10 rounded-lg px-2 py-1 text-[11px] font-black text-center"
                  />
                </div>
                <span className="text-[11px] font-mono font-black text-slate-900 w-24 text-right">
                  {formatCurrency(
                    (item.retail_price || 0) * (item.quantity || 0),
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="text-[#D1CACA] hover:text-rose-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Data de Entrega / Evento
              </label>
              <input
                name="deliveryDate"
                defaultValue={
                  editingOrder?.deliveryDate ||
                  safeFormat(new Date(), "yyyy-MM-dd")
                }
                required
                type="date"
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                Status Inicial
              </label>
              <select
                name="status"
                defaultValue={editingOrder?.status || "novo pedido"}
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none text-slate-900"
              >
                <option value="novo pedido" className="text-purple-500">
                  NOVO PEDIDO
                </option>
                <option value="quote" className="text-gray-500">
                  ORÇAMENTO
                </option>
                <option value="approval" className="text-indigo-500">
                  APROVAÇÃO DA ARTE
                </option>
                <option value="waiting_deposit" className="text-amber-500">
                  AGUARDANDO SINAL
                </option>
                <option value="production" className="text-blue-500">
                  EM PRODUÇÃO
                </option>
                <option value="assembly" className="text-pink-500">
                  EM MONTAGEM
                </option>
                <option value="ready" className="text-emerald-500">
                  PRONTO PARA ENTREGA
                </option>
                <option value="delivered" className="text-slate-900">
                  ENTREGUE
                </option>
                <option value="cancelled" className="text-slate-9000">
                  CANCELADO
                </option>
              </select>
            </div>
          </div>

          {/* Checkcards for Payment/Delivery */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => setIsWholesale(!isWholesale)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isWholesale ? "bg-amber-50 border-amber-500" : "bg-white border-lilac/10 text-[#A09898]"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isWholesale ? "bg-amber-500 border-amber-500" : "border-slate-200"}`}
              >
                {isWholesale && (
                  <CheckCircle className="text-white" size={12} />
                )}
              </div>
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isWholesale ? "text-amber-700" : ""}`}
                >
                  Pedido de Atacado
                </p>
                <p
                  className={`text-[8px] font-bold ${isWholesale ? "text-amber-600" : ""}`}
                >
                  Aplica aviso de atacado no comprovante
                </p>
              </div>
            </div>

            <div
              onClick={() => setIsDepositPaid(!isDepositPaid)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isDepositPaid ? "bg-emerald-50 border-emerald-500" : "bg-white border-lilac/10 text-[#A09898]"}`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDepositPaid ? "bg-emerald-500 border-emerald-500" : "border-slate-200"}`}
              >
                {isDepositPaid && (
                  <CheckCircle className="text-white" size={12} />
                )}
              </div>
              <div>
                <p
                  className={`text-[10px] font-black uppercase tracking-widest ${isDepositPaid ? "text-emerald-700" : ""}`}
                >
                  Sinal Pago (50%)
                </p>
                <p
                  className={`text-[9px] font-bold ${isDepositPaid ? "text-emerald-600" : ""}`}
                >
                  {formatCurrency(depositValue || 0)}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-lilac/10 bg-black text-white flex justify-between items-center">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#A09898]">
                  Total a Pagar
                </p>
                <p className="text-lg font-mono font-black">
                  {formatCurrency(totalWithShipping || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-[#A09898]">
                  {isDepositPaid ? "Restante" : "Subtotal"}
                </p>
                <p className="text-[11px] font-mono font-black text-lilac">
                  {formatCurrency(
                    (isDepositPaid
                      ? totalWithShipping - depositValue
                      : totalWithShipping) || 0,
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
              Observações do Pedido
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none h-24 text-slate-900 resize-none"
              placeholder="Ex regular: Tamanho M, Cor Rosa, Nome Julia..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 border border-lilac/10 rounded-xl font-bold uppercase text-[10px] tracking-widest text-[#A09898] hover:bg-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
