import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, SortDesc, Calendar, Box, Package, FileText, CheckCircle2 } from "lucide-react";
import { Order, CompanyId, Product, Insumo, SiteSettings, Customer } from "../../types";
import { getSiteSettings } from "../../services/firebaseService";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { OrderCard } from "./OrderCard";
import { OrderDetailsView } from "./OrderDetailsView";
import { OrderFormModal } from "./OrderFormModal";
import { OrderWizardModal } from "./OrderWizardModal";
import { OrderReceiptModal } from "./OrderReceiptModal";

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  customers: Customer[];
  companyId: CompanyId;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onSaveOrder: (order: Partial<Order>) => void;
  onDeleteOrder: (id: string) => void;
  initialOrderId?: string | null;
  initialCustomerId?: string | null;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  products,
  insumos,
  customers,
  companyId,
  onUpdateStatus,
  onSaveOrder,
  onDeleteOrder,
  initialOrderId,
  initialCustomerId,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // View States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  
  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(!!initialCustomerId);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<"coupon" | "receipt">("coupon");
  
  useEffect(() => {
    getSiteSettings(companyId).then(setSettings);
  }, [companyId]);

  // Filtering Logic
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = today - 30 * 24 * 60 * 60 * 1000;

    let result = orders.filter(o => {
      const searchMatch = 
        (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.contact || "").includes(searchTerm) ||
        (o.customerCity || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!searchMatch) return false;

      const time = o.createdAt?.toMillis?.() || (o.createdAt as any)?.seconds * 1000 || new Date(o.createdAt).getTime() || Date.now();
      const s = (o.status || "").toLowerCase();

      switch(selectedFilter) {
        case "today": return time >= today;
        case "week": return time >= weekAgo;
        case "month": return time >= monthAgo;
        case "production": return ["production", "assembly", "approval"].includes(s);
        case "pending_payment": return ["waiting_payment", "waiting_deposit"].includes(s);
        case "shipped": return ["delivery"].includes(s);
        case "completed": return ["delivered", "fully_paid"].includes(s);
        case "cancelled": return s === "cancelled";
        case "all":
        default: return true;
      }
    });

    // Sorting
    result.sort((a, b) => {
      const isCompletedA = ["delivered", "fully_paid", "cancelled"].includes((a.status || "").toLowerCase()) ? 1 : 0;
      const isCompletedB = ["delivered", "fully_paid", "cancelled"].includes((b.status || "").toLowerCase()) ? 1 : 0;
      
      if (isCompletedA !== isCompletedB) {
        return isCompletedA - isCompletedB;
      }

      const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || new Date(a.createdAt).getTime() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || new Date(b.createdAt).getTime() || Date.now();
      const totalA = Number(a.total) || 0;
      const totalB = Number(b.total) || 0;
      const dDateA = a.deliveryDate ? new Date(a.deliveryDate).getTime() : Infinity;
      const dDateB = b.deliveryDate ? new Date(b.deliveryDate).getTime() : Infinity;

      switch(sortOption) {
        case "newest": return timeB - timeA;
        case "oldest": return timeA - timeB;
        case "highest_value": return totalB - totalA;
        case "lowest_value": return totalA - totalB;
        case "deadline": return dDateA - dDateB;
        default: return timeB - timeA;
      }
    });

    return result;
  }, [orders, searchTerm, selectedFilter, sortOption]);

  const getProductInfo = (order: Order) => {
    if (order.items && order.items.length > 0) {
      const firstItem = order.items[0];
      const matchedProduct = products.find(p => p.id === firstItem.productId || p.id === firstItem.id);
      return {
        image: matchedProduct?.image || firstItem.image,
        name: matchedProduct?.product_name || firstItem.product_name,
        count: order.items.reduce((acc, i) => acc + i.quantity, 0)
      };
    }
    return { image: null, name: "Produto Personalizado", count: 1 };
  };

  const getStatusInfo = (status: string) => {
    const s = status.toLowerCase();
    const map: Record<string, { label: string; color: string; bgLight: string; text: string }> = {
      "novo pedido": { label: "Novo", color: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-100" },
      "quote": { label: "Orçamento", color: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-100" },
      "waiting_payment": { label: "Pagamento Pendente", color: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-100" },
      "waiting_deposit": { label: "Aguardando Sinal", color: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-100" },
      "approval": { label: "Arte / Aprovação", color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-100" },
      "production": { label: "Em Produção", color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-100" },
      "assembly": { label: "Montagem", color: "bg-blue-500", text: "text-blue-700", bgLight: "bg-blue-100" },
      "ready": { label: "Pronto", color: "bg-purple-500", text: "text-purple-700", bgLight: "bg-purple-100" },
      "delivery": { label: "Enviado", color: "bg-green-500", text: "text-green-700", bgLight: "bg-green-100" },
      "delivered": { label: "Concluído", color: "bg-green-500", text: "text-green-700", bgLight: "bg-green-100" },
      "fully_paid": { label: "Concluído", color: "bg-green-500", text: "text-green-700", bgLight: "bg-green-100" },
      "cancelled": { label: "Cancelado", color: "bg-red-500", text: "text-red-700", bgLight: "bg-red-100" }
    };
    return map[s] || { label: status, color: "bg-gray-500", text: "text-gray-700", bgLight: "bg-gray-100" };
  };

  // Top Cards Stats
  const todayCount = useMemo(() => {
    const today = new Date(new Date().setHours(0,0,0,0)).getTime();
    return orders.filter(o => {
      const time = o.createdAt?.toMillis?.() || (o.createdAt as any)?.seconds * 1000 || new Date(o.createdAt).getTime() || Date.now();
      return time >= today;
    }).length;
  }, [orders]);

  const productionCount = orders.filter(o => ["production", "assembly", "approval"].includes((o.status||"").toLowerCase())).length;
  const pendingPaymentCount = orders.filter(o => ["waiting_payment", "waiting_deposit"].includes((o.status||"").toLowerCase())).length;
  const shippedCount = orders.filter(o => ["delivery"].includes((o.status||"").toLowerCase())).length;

  const handleDuplicate = async (order: Order) => {
    const { id, code, createdAt, ...rest } = order;
    await onSaveOrder({ ...rest, status: "novo pedido", deliveryDate: "" });
  };

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  // If a specific order is selected, render ONLY the details view
  if (selectedOrder) {
    return (
      <div className="h-full relative z-0">
        <OrderDetailsView 
          order={selectedOrder}
          products={products}
          insumos={insumos}
          onBack={() => setSelectedOrderId(null)} 
          onEdit={(o) => {
            setEditingOrder(o);
            setIsFormModalOpen(true); // Re-using OrderFormModal for editing since status is inside it.
          }}
          onSave={onSaveOrder}
          onPrint={(o) => {
            setReceiptType("coupon");
            setReceiptOrder(o);
          }}
        />
        {isFormModalOpen && (
          <OrderFormModal
            editingOrder={editingOrder}
            products={products}
            companyId={companyId}
            onClose={() => {
              setIsFormModalOpen(false);
              setEditingOrder(null);
            }}
            onSave={(data) => {
              onSaveOrder({ id: editingOrder?.id, ...data });
              setIsFormModalOpen(false);
            }}
          />
        )}
      </div>
    );
  }

  // Otherwise, render the main Orders operational center
  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] animate-in fade-in duration-300 relative z-0 overflow-hidden">
      
      {/* Top Header & Stats */}
      <div className="px-6 pt-6 pb-4 bg-white border-b border-gray-200 z-10 shrink-0">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pedidos</h1>
          <button
            onClick={() => setIsWizardOpen(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm"
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>

        {/* Top Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-gray-300 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pedidos Hoje</span>
            <span className="text-2xl font-bold text-gray-900">{todayCount}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-gray-300 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Em Produção</span>
            <span className="text-2xl font-bold text-blue-600">{productionCount}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-gray-300 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Aguardando Pgto</span>
            <span className="text-2xl font-bold text-amber-600">{pendingPaymentCount}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col justify-between hover:border-gray-300 transition-colors">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Enviados</span>
            <span className="text-2xl font-bold text-green-600">{shippedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row gap-4 items-center justify-between z-10 shrink-0">
        
        {/* Quick Filters */}
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
          {[
            { id: "all", label: "Todos" },
            { id: "today", label: "Hoje" },
            { id: "week", label: "Esta semana" },
            { id: "month", label: "Este mês" },
            { id: "production", label: "Produção" },
            { id: "pending_payment", label: "Pgto Pendente" },
            { id: "shipped", label: "Enviado" },
            { id: "completed", label: "Concluído" },
            { id: "cancelled", label: "Cancelado" },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${selectedFilter === f.id ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Pesquisar pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-black transition-colors text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 outline-none focus:border-black transition-colors"
          >
            <option value="newest">Mais recente</option>
            <option value="oldest">Mais antigo</option>
            <option value="highest_value">Maior valor</option>
            <option value="lowest_value">Menor valor</option>
            <option value="deadline">Prazo de entrega</option>
          </select>
        </div>
      </div>

        {/* Orders List Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 relative z-0">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4 py-20">
            <Package size={48} className="text-gray-300" />
            <p className="text-sm font-semibold uppercase tracking-wider">Nenhum pedido encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-7xl mx-auto">
            {filteredOrders.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                productInfo={getProductInfo(order)}
                statusInfo={getStatusInfo(order.status)}
                onViewDetails={(id) => setSelectedOrderId(id)}
                onChangeStatusRequest={(o) => {
                  setEditingOrder(o);
                  setIsFormModalOpen(true); // Re-using OrderFormModal for editing since status is inside it.
                }}
                onUpdateStatus={onUpdateStatus}
                onDuplicate={handleDuplicate}
                onPrint={(o) => {
                  setReceiptType("coupon");
                  setReceiptOrder(o);
                }}
                onGenerateLabel={(o) => {
                  setReceiptType("receipt");
                  setReceiptOrder(o);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {isWizardOpen && (
        <OrderWizardModal
          products={products}
          customers={customers}
          companyId={companyId}
          initialCustomerId={initialCustomerId}
          onClose={() => setIsWizardOpen(false)}
          onSave={async (data) => {
            await onSaveOrder(data);
            setIsWizardOpen(false);
          }}
        />
      )}

      {receiptOrder && (
        <OrderReceiptModal
          order={receiptOrder}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
};
