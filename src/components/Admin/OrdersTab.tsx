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
  Flame,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, CompanyId, Product, Insumo, SiteSettings } from "../../types";
import { generatePremiumThermalReceipt, generateA4ProductionOrder, generatePremiumA4Receipt } from "../../lib/pdfGenerator";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { OrderReceiptModal } from "./OrderReceiptModal";
import { exportOrdersReportPDF, exportOrderReceiptPDF } from "../../utils/pdfGenerator";
import { getSiteSettings } from "../../services/firebaseService";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";


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
              <Printer size={12} className="text-[#D48C8C]" /> Abrir PDF
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
      case "tuttymimo":
        return {
          name: "Tutty Mimo",
          primary: "#D4BDA1", // Warm neutral
          secondary: "#5C4A3D", // Wood/earthy
          accent: "#D4BDA1",
          bgBadge: "bg-[#F5EFE6] text-[#7A6251] border-[#D4BDA1]/25",
          btnGradient: "from-[#D4BDA1] to-[#C2AA8F]",
          textClass: "text-[#7A6251]",
          badgeColor: "#D4BDA1",
          accentLight: "rgba(212, 189, 161, 0.15)",
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
      mimada: ["Gisele K.", "Renata S.", "Gaby", "Larissa"],
      tuttymimo: ["Amanda", "Juliana", "Vanessa", "Bruna"]
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
    { id: "tuttymimo", name: "Tutty Mimo", prefix: "TM" },
  ];

  const statusOptions = [
    { value: "quote", label: "ORÇAMENTO" },
    { value: "pending", label: "PENDENTE" },
    { value: "approval", label: "APROVAÇÃO DA ARTE" },
    { value: "waiting_deposit", label: "AGUARDANDO SINAL" },
    { value: "waiting_payment", label: "AGUARDANDO PAGAMENTO" },
    { value: "planned_payment", label: "PAGAMENTO PLANEJADO" },
    { value: "production", label: "EM PRODUÇÃO" },
    { value: "assembly", label: "EM MONTAGEM" },
    { value: "ready", label: "PRONTO PARA ENTREGA" },
    { value: "waiting_remaining", label: "AGUARDANDO PGTO RESTANTE" },
    { value: "planned_active", label: "PLANO ATIVO" },
    { value: "delivery", label: "EM ROTA" },
    { value: "delivered", label: "ENTREGUE" },
    { value: "fully_paid", label: "PEDIDO QUITADO" },
    { value: "cancelled", label: "CANCELADO" },
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
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<{ doc: any; fileName: string } | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    getSiteSettings(companyId).then(setSettings);
  }, [companyId]);

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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Top Bar - Improved Responsiveness for Laptop Screens */}
      <div className="flex flex-col xl:flex-row gap-6 justify-between items-center bg-white p-6 rounded-[2rem] border border-[#F0E6D2] shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          <div className="relative w-full md:w-72 lg:w-80">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D1CACA]"
              size={14}
            />
            <input
              type="text"
              placeholder="Pesquisar pedido..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF9F6] border border-[#F0E6D2] text-[10px] uppercase font-bold tracking-widest outline-none focus:border-[#D48C8C] transition-all text-[#4A4444]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
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
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap shadow-sm ${
                      isSelected 
                        ? "text-white shadow-md scale-105" 
                        : "bg-white border-[#F0E6D2] text-[#A09898] hover:bg-[#FAF9F6]"
                    }`}
                    style={isSelected ? {
                      backgroundColor: theme.primary,
                      borderColor: theme.secondary,
                    } : undefined}
                  >
                    {atl.prefix}
                  </button>
                );
              })}
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center xl:justify-end w-full xl:w-auto">
          {/* Export PDF Button */}
          <button
            onClick={() => exportOrdersReportPDF(filteredOrders, selectedAteliers.length === 1 ? selectedAteliers[0] : "all")}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 font-black py-4 px-8 rounded-2xl bg-white border border-[#F0E6D2] hover:bg-slate-50 transition-all text-[9.5px] uppercase tracking-widest text-[#4A4444] shadow-sm"
          >
            <Printer size={16} className="text-[#D4AF37]" /> Exportar PDF
          </button>

          {/* Novo Pedido Button */}
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
            className="flex-1 md:flex-none flex items-center justify-center gap-3 text-white font-black py-4 px-10 rounded-2xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg border border-transparent hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: getBrandTheme(selectedAteliers.length === 1 ? selectedAteliers[0] : companyId).primary,
            }}
          >
            <Plus size={18} /> Novo Pedido
          </button>
        </div>
      </div>

      {/* Production Pipeline - Optimized for Flow and Balance */}
      <div className="bg-[#FAF9F6] p-6 lg:p-8 rounded-[2.5rem] border border-[#F0E6D2] shadow-xs">
        <span className="block text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Fluxo de Produção Personalizada</span>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          <button
            onClick={() => setSelectedStatusFilter("all")}
            className={`px-5 py-4 rounded-2xl border text-left transition-all relative group hover:shadow-md duration-300 ${
              selectedStatusFilter === "all"
                ? "bg-white border-neutral-300 ring-2 ring-neutral-100"
                : "bg-white/60 hover:bg-white/80 border-neutral-100"
            }`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] font-black text-gray-600 uppercase tracking-[0.1em]">Todos</span>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {filteredOrders.length}
              </span>
            </div>
            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Geral</p>
          </button>

          {STATUS_GROUPS.map((group) => {
            const isSelected = selectedStatusFilter === group.id;
            const count = filteredOrders.filter((o) => group.dbStatuses.includes(o.status.toLowerCase())).length;

            return (
              <button
                key={group.id}
                onClick={() => setSelectedStatusFilter(group.id)}
                className={`px-5 py-4 rounded-2xl border text-left transition-all relative group hover:shadow-md duration-300 ${
                  isSelected
                    ? "bg-white ring-2 ring-opacity-50"
                    : "bg-white/40 hover:bg-white/80 border-neutral-100"
                }`}
                style={{
                  borderColor: isSelected ? group.color : "rgba(240, 230, 210, 0.4)",
                  boxShadow: isSelected ? `0 4px 12px ${group.color}15` : undefined
                }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-black uppercase tracking-tight truncate" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${group.bgLight}`}>
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List - Grid for Balanced Layout on Larger Wide Screens */}
      <div className="w-full pb-20">
        <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
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
                className="bg-[#FFFFFF] rounded-[1.5rem] border border-[#F0E6D2] shadow-[0_6px_20px_rgba(240,230,210,0.5)] transition-all hover:shadow-[0_12px_32px_rgba(240,230,210,0.6)] hover:-translate-y-[2px] duration-300 flex items-stretch cursor-pointer relative"
                onClick={() => setIsDetailOpen(order.id)}
              >
                {/* 1. Barra Lateral Colorida do Status */}
                <div 
                  className="w-2 shrink-0 transition-all duration-300 rounded-l-[1.5rem]"
                  style={{ backgroundColor: statusGroup?.color || "#e2e8f0" }}
                />

                {/* Main Content Area - Professional Fluid Grid */}
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center gap-8 px-6 py-5 w-full">
                    
                    {/* [1. CLIENTE & ATELIÊ] */}
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[14px] font-bold text-slate-800 tracking-wider">
                          {order.code}
                        </span>
                        <span 
                          className="text-[9px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-lg text-slate-500 bg-slate-50 border border-slate-100"
                        >
                          {brandTheme.name}
                        </span>
                      </div>
                      <h4 className="text-[17px] font-bold text-slate-700 tracking-tight leading-tight">
                        {order.customerName}
                      </h4>
                    </div>

                    {/* [2. PRODUTO] */}
                    <div className="flex items-center gap-4 min-w-[240px] flex-[1.5]">
                      <div className="w-14 h-14 shrink-0 rounded-2xl bg-white border border-slate-100 overflow-hidden flex items-center justify-center relative shadow-sm">
                        {cardProduct.image ? (
                          <img 
                            src={cardProduct.image} 
                            alt={cardProduct.name} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Box size={24} className="text-slate-200" />
                        )}
                        {cardProduct.count > 1 && (
                          <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-[8px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            {cardProduct.count}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[14px] font-bold text-slate-600 leading-tight">
                            {cardProduct.name || "Produto Personalizado"}
                         </span>
                         {order.items && order.items.length > 1 && (
                           <span className="text-[9px] font-black text-pink-400 uppercase tracking-widest mt-1">
                             + {order.items.length - 1} outros itens
                           </span>
                         )}
                      </div>
                    </div>

                    {/* [3. DATA DE ENTREGA] */}
                    <div className="flex flex-col justify-center gap-1.5 min-w-[100px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Entrega</span>
                      <div className="flex items-center gap-2 text-slate-700 text-[13px] font-bold">
                        <Calendar size={14} className="text-pink-300" />
                        <span>
                          {order.deliveryDate
                            ? safeFormatISO(order.deliveryDate, "dd/MM")
                            : "--/--"}
                        </span>
                      </div>
                    </div>

                    {/* [3. STATUS] */}
                    <div className="min-w-[150px]">
                      <span className={`flex items-center justify-center text-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black tracking-widest uppercase border ${statusGroup?.bgLight || "bg-slate-50 text-slate-600 border-slate-200"} w-full shadow-sm`}>
                        {order.status === 'delivered' || order.status === 'fully_paid' ? (
                          <CheckCircle2 size={13} className="shrink-0" />
                        ) : order.status === 'cancelled' ? (
                          <XCircle size={13} className="shrink-0" />
                        ) : null}
                        <span>{statusGroup?.label || order.status}</span>
                      </span>
                    </div>

                    {/* [4. VALOR TOTAL] */}
                    <div className="flex flex-col justify-center gap-1 md:text-right min-w-[120px]">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Total</span>
                      <p className="text-[15px] font-black text-slate-900 tracking-tight whitespace-nowrap">
                        {formatCurrency(Number(order.total) || 0)}
                      </p>
                    </div>

                    {/* [5. MENU ...] */}
                    <div className="flex justify-end pl-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <ActionsDropdown 
                        order={order}
                        onOpenDetail={() => setIsDetailOpen(order.id)}
                        onPrint={() => exportOrderReceiptPDF(order, settings || {})}
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
      </div>

      {/* Detail Overlay / In-line */}
      <AnimatePresence>
        {isDetailOpen && (() => {
          const order = orders.find((o) => o.id === isDetailOpen);
          if (!order) return null;

          // Milestones definitions for the Portuguese horizontal timeline
          const milestones = [
            { label: "Orçamento / Aprovação" },
            { label: "Sinal Pago" },
            { label: "Em Produção" },
            { label: "Pronto para Retirada" },
            { label: "Finalizado" }
          ];

          const getStatusMilestoneIndex = (statusStr: string): number => {
            const s = statusStr.toLowerCase();
            if (["quote", "approval", "pending", "novo pedido"].includes(s)) return 0;
            if (["waiting_deposit", "waiting_payment", "planned_payment"].includes(s)) return 1;
            if (["production", "assembly"].includes(s)) return 2;
            if (["ready", "delivery", "waiting_remaining", "planned_active"].includes(s)) return 3;
            if (["delivered", "paid", "fully_paid"].includes(s)) return 4;
            return 0;
          };

          const currentStatusIndex = getStatusMilestoneIndex(order.status || "");

          return (
            <div
              key="order-detail-overlay"
              className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsDetailOpen(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#FFFFFC] w-full max-w-4xl max-h-[92vh] flex flex-col rounded-[2rem] border border-pink-100 shadow-2xl overflow-hidden relative"
              >
                {/* Botão Fechar (Fixo no topo direito e com z-index alto) */}
                <button
                  onClick={() => setIsDetailOpen(null)}
                  className="absolute top-6 right-6 p-2 rounded-full hover:bg-pink-50 text-slate-400 hover:text-pink-600 transition-all z-30"
                >
                  <X size={20} />
                </button>

                {/* Scrollable Container wrapper for body elements */}
                <div className="flex-1 overflow-y-auto p-8 md:p-10 pb-6 space-y-8 scrollbar-hide min-h-0 relative">
                  {/* 1. TOPO (FULL WIDTH) */}
                  <div className="w-full border-b border-pink-100/60 pb-4 text-left">
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">
                      Fluxo do Pedido
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
                      Gerenciador de Atendimento e Entrega
                    </p>
                  </div>

                  {/* 6. FLUXO DO PEDIDO (TIMELINE HORIZONTAL MINIMALISTA COMPACTA) */}
                  <div className="w-full bg-pink-50/20 border border-pink-100/40 rounded-2xl p-4 md:p-5">
                    <div className="relative flex items-center justify-between w-full max-w-2xl mx-auto px-4 py-2">
                      {/* Linha de progresso cinza de fundo */}
                      <div className="absolute left-6 right-6 top-1/2 h-[2px] bg-slate-100 -translate-y-1/2 z-0" />
                      {/* Linha de progresso rosa ativa */}
                      <div
                        className="absolute left-6 top-1/2 h-[2px] bg-pink-400 -translate-y-1/2 z-0 transition-all duration-500"
                        style={{
                          width: `${(currentStatusIndex / (milestones.length - 1)) * 92}%`
                        }}
                      />

                      {milestones.map((ms, idx) => {
                        const isCompleted = idx < currentStatusIndex;
                        const isActive = idx === currentStatusIndex;
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center">
                            <button
                              onClick={() => {
                                // Fast status transition if clicking milestones
                                const statusMapping = ["quote", "waiting_deposit", "production", "ready", "delivered"];
                                onUpdateStatus(order.id, statusMapping[idx] as any);
                              }}
                              className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all duration-300 focus:outline-none ${
                                isActive
                                  ? "bg-pink-500 border-pink-500 text-white shadow-md shadow-pink-200 scale-110"
                                  : isCompleted
                                    ? "bg-white border-pink-300 text-pink-500"
                                    : "bg-white border-slate-200 text-slate-400 hover:border-pink-200"
                              }`}
                            >
                              <span className="text-[10px] font-black">{idx + 1}</span>
                            </button>
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider mt-2.5 text-center hidden md:inline ${
                                isActive ? "text-pink-600" : "text-slate-400"
                              }`}
                            >
                              {ms.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. BLOCO 1 (DADOS DO CLIENTE - 100% LARGURA EM BLOCO ÚNICO) */}
                  <div className="w-full bg-[#FAF9F6] border border-[#F0E6D2]/60 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-[#F0E6D2]/40 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Dados do Cliente
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 font-sans text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Nome do Cliente</span>
                        <span className="font-semibold text-slate-700 uppercase">{order.customerName || "Não Informado"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">CPF / CNPJ</span>
                        <span className="font-mono text-slate-700 font-semibold">{order.customerCpfCnpj ? formatCPFOrCNPJ(order.customerCpfCnpj) : "Não Informado"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Data de Nascimento</span>
                        <span className="font-mono text-slate-700">{(order as any).birthDate || (order as any).customerBirthDate || "Não informado"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Contato WhatsApp</span>
                        <span className="font-semibold text-slate-700">{order.contact ? formatPhone(order.contact) : "Não Informado"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">E-mail</span>
                        <span className="text-slate-600 font-medium select-all">{(order as any).customerEmail || (order as any).email || "Não Informado"}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. BLOCO 2 (DADOS DO PEDIDO + ENTREGA - 100% LARGURA EM BLOCO ÚNICO) */}
                  <div className="w-full bg-[#FAF9F6] border border-[#F0E6D2]/60 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-[#F0E6D2]/40 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Dados do Pedido & Entrega
                      </span>
                    </div>
                    <div className="flex flex-col gap-3 font-sans text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Status do Fluxo</span>
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${
                          STATUS_GROUPS.find((g) => g.dbStatuses.includes(order.status.toLowerCase()))?.bgLight || "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                          {statusOptions.find((s) => s.value === order.status.toLowerCase())?.label || order.status}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Código de Identificação</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800 bg-white px-2 py-0.5 border border-slate-200 rounded">
                            {order.code}
                          </span>
                          {order.isEmergency && (
                            <span className="text-red-500 bg-red-50 p-1 border border-red-200 rounded animate-pulse" title="Urgente">
                              <Flame size={12} className="stroke-[2px]" />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Ateliê Selecionado</span>
                        <span className="font-bold text-slate-700 uppercase">
                          {order.companyId === 'pallyra' ? "La Pallyra" :
                           order.companyId === 'guennita' ? "com amor, Guennita" :
                           order.companyId === 'mimada' ? "Mimada Sim" :
                           order.companyId === 'tuttymimo' ? "Tutty Mimo" : order.companyId}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Data do Pedido</span>
                        <span className="text-slate-600 font-medium">
                          {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy HH:mm") : "--/--/----"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Data de Entrega</span>
                        <span className="font-bold text-slate-700">
                          {order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "Não agendada"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Tipo de Entrega</span>
                        <span className="font-bold text-pink-600 uppercase tracking-widest text-[10px]">
                          {order.deliveryType === 'retirada' ? "Retirada" :
                           order.deliveryType === 'delivery' ? "Entrega Local" : "Envio por Correios / Transportadora"}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                        <span className="text-slate-400 uppercase font-semibold text-[9px] tracking-wider">Endereço de Destino</span>
                        <span className="text-slate-600 font-medium text-left sm:text-right max-w-md">
                          {order.address || "Não informado (Retirada direta no Ateliê)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 4. BLOCO 3 (ITENS DO PEDIDO - LAYOUT NORMAL ERP) */}
                  <div className="w-full bg-[#FAF9F6] border border-[#F0E6D2]/60 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-[#F0E6D2]/40 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Itens do Pedido (Catálogo)
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-[#F0E6D2]/60 pb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                            <th className="py-2">Produto</th>
                            <th className="py-2 text-center">Quantidade</th>
                            <th className="py-2 text-right">Valor Unitário</th>
                            <th className="py-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {order.items?.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 font-semibold text-slate-700 uppercase">
                                {item.product_name}
                              </td>
                              <td className="py-3 text-center text-slate-600 font-bold">
                                {item.quantity}
                              </td>
                              <td className="py-3 text-right text-slate-500 font-mono">
                                {formatCurrency(item.retail_price || 0)}
                              </td>
                              <td className="py-3 text-right font-bold text-slate-800 font-mono">
                                {formatCurrency((item.retail_price || 0) * (item.quantity || 0))}
                              </td>
                            </tr>
                          ))}
                          {(!order.items || order.items.length === 0) && (
                            <tr>
                              <td colSpan={4} className="py-4 text-center text-slate-400">
                                Nenhum item adicionado a este pedido.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 5. BLOCO 4 (RESUMO FINANCEIRO - LAYOUT NORMAL) */}
                  <div className="w-full bg-[#FAF9F6] border border-[#F0E6D2]/60 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-[#F0E6D2]/40 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Preços & Resumo Financeiro
                      </span>
                    </div>
                    <div className="space-y-2.5 text-xs text-slate-600 font-sans">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Subtotal</span>
                        <span className="font-semibold text-slate-700 font-mono">
                          {formatCurrency((order.total || 0) - (order.shippingCost || 0))}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-400 uppercase text-[9px] tracking-wider">Taxa de Envio / Frete</span>
                        <span className="font-semibold text-slate-700 font-mono">
                          {formatCurrency(order.shippingCost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                        <span className="text-[11px] font-black text-slate-800 uppercase tracking-wide">Desconto Concedido</span>
                        <span className="font-mono text-emerald-600 font-bold">
                          - {formatCurrency(0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-dashed border-[#F0E6D2]">
                        <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Valor Total Líquido</span>
                        <span className="text-xl font-black text-pink-600 font-mono">
                          {formatCurrency(order.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Histórico e Alteração Rápida de Status */}
                  <div className="w-full bg-[#FAF9F6] border border-[#F0E6D2]/60 rounded-2xl p-5 space-y-4">
                    <div className="border-b border-[#F0E6D2]/40 pb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Atualizar Status do Pedido
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {statusOptions.map((opt) => {
                        const optGroup = STATUS_GROUPS.find((g) => g.dbStatuses.includes(opt.value));
                        const isActive = order.status.toLowerCase() === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => onUpdateStatus(order.id, opt.value as any)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              isActive
                                ? "bg-pink-500 border-pink-500 text-white"
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 7. BOTÕES (RODAPÉ FIXO MANTIDO VISÍVEL SEMPRE) - ESTILO 3D CLEAN PREMIUM */}
                <div className="w-full bg-white border-t border-pink-100/70 px-8 py-5 flex flex-col sm:flex-row gap-4 shrink-0 shadow-[0_-8px_24px_rgba(212,140,140,0.06)] z-20">
                  <button
                    onClick={async () => {
                      const doc = await generatePremiumA4Receipt(order, settings);
                      setPdfData({ doc, fileName: "Comprovante_" + order.code });
                      setIsPdfPreviewOpen(true);
                    }}
                    className="flex-1 select-none flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold text-white uppercase tracking-widest bg-gradient-to-b from-slate-800 to-slate-900 border-b-[3px] border-slate-950 transition-all hover:-translate-y-[2px] active:translate-y-[1px] hover:shadow-lg active:shadow-sm"
                  >
                    📄 Gerar Comprovante PDF
                  </button>
                  <button
                    onClick={async () => {
                      const doc = await generatePremiumA4Receipt(order, settings);
                      try {
                        const pdfBlob = doc.output("blob");
                        const file = new File([pdfBlob], `Comprovante_${order.code}.pdf`, { type: "application/pdf" });
                        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                          await navigator.share({
                            files: [file],
                            title: `Comprovante de Compra - ${order.code}`,
                            text: `Olá ${order.customerName}, aqui está o comprovante do pedido ${order.code}.`
                          });
                        } else {
                          doc.save(`Comprovante_${order.code}.pdf`);
                          window.open(
                            `https://wa.me/${order.contact.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(
                              order.customerName
                            )}, aqui está o comprovante do seu pedido ${order.code}.`,
                            "_blank"
                          );
                        }
                      } catch (e) {
                        window.open(
                          `https://wa.me/${order.contact.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(
                            order.customerName
                          )}, aqui está o comprovante do seu pedido ${order.code}.`,
                          "_blank"
                        );
                      }
                    }}
                    className="flex-1 select-none flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-xs font-bold text-white uppercase tracking-widest bg-gradient-to-b from-emerald-500 to-emerald-600 border-b-[3px] border-emerald-700 transition-all hover:-translate-y-[2px] active:translate-y-[1px] hover:shadow-lg active:shadow-sm"
                  >
                    📤 Compartilhar no WhatsApp
                  </button>
                </div>

              </motion.div>
            </div>
          );
        })()}
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

      {isPdfPreviewOpen && pdfData && (
        <PDFPreviewModal 
          order={orders.find(o => o.id === isDetailOpen)}
          onClose={() => setIsPdfPreviewOpen(false)}
          pdfDoc={pdfData.doc}
          fileName={pdfData.fileName}
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
  const [contact, setContact] = useState(editingOrder?.contact || "");
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

  const companiesList = [
    { id: "pallyra", name: "La Pallyra" },
    { id: "guennita", name: "com amor, Guennita" },
    { id: "mimada", name: "Mimada Sim" },
    { id: "tuttymimo", name: "Tutty Mimo" },
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
                contact: contact,
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
                marketplace: (formData.get("marketplace") as string) || "",
                marketplaceTax: Number(formData.get("marketplaceTax")) || 0,
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
                onChange={(e) => setCpfCnpj(formatCPFOrCNPJ(e.target.value))}
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
                value={contact}
                onChange={(e) => setContact(formatPhone(e.target.value))}
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

          {/* Marketplace Integration */}
          <div className="p-6 rounded-2xl bg-slate-50 border border-lilac/10 space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-800 tracking-widest pl-1">
              Integração Marketplace / Origem da Venda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                  Plataforma / Canal (Ex: Shopee, Mercado Livre, Elo7)
                </label>
                <select
                  name="marketplace"
                  defaultValue={editingOrder?.marketplace || ""}
                  className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none text-slate-900"
                >
                  <option value="">Nenhum (Venda Direta)</option>
                  <option value="shopee">Shopee</option>
                  <option value="mercado_livre">Mercado Livre</option>
                  <option value="elo7">Elo7</option>
                  <option value="shein">Shein</option>
                  <option value="site_proprio">Site Próprio</option>
                  <option value="whatsapp">WhatsApp / Instagram</option>
                  <option value="outro">Outro (Canal Externo)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-[#A09898] tracking-widest pl-2">
                  Taxa do Marketplace (%)
                </label>
                <input
                  name="marketplaceTax"
                  type="number"
                  step="0.01"
                  defaultValue={editingOrder?.marketplaceTax || 0}
                  placeholder="Ex: 12.5 (12.5% de taxa)"
                  className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none font-mono text-slate-900"
                />
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
