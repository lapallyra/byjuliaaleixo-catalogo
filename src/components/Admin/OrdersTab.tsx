import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, SortDesc, Calendar, Box, Package, FileText, CheckCircle2, Trash2 } from "lucide-react";
import { Order, CompanyId, Product, Insumo, SiteSettings, Customer } from "../../types";
import { getSiteSettings } from "../../services/firebaseService";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { OrderCard } from "./OrderCard";
import { OrderDetailsView } from "./OrderDetailsView";
import { OrderFormModal } from "./OrderFormModal";
import { OrderWizardModal } from "./OrderWizardModal";
import { OrderReceiptModal } from "./OrderReceiptModal";
import { HorizontalScroll } from "../shared/HorizontalScroll";

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  customers: Customer[];
  companyId: CompanyId;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onSaveOrder: (order: Partial<Order>) => Promise<string | void>;
  onDeleteOrder: (id: string) => void;
  initialOrderId?: string | null;
  initialCustomerId?: string | null;
}

export const OrdersTab: React.FC<OrdersTabProps> = React.memo(({
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
    const handleNewOrder = () => setIsWizardOpen(true);
    const handleClose = () => {
        setIsWizardOpen(false);
        setIsFormModalOpen(false);
        setReceiptOrder(null);
    };
    window.addEventListener('trigger-new-order', handleNewOrder);
    window.addEventListener('trigger-close-modals', handleClose);
    return () => {
        window.removeEventListener('trigger-new-order', handleNewOrder);
        window.removeEventListener('trigger-close-modals', handleClose);
    };
  }, []);
  
  // Selection Logic
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const toggleOrder = (id: string) => {
    setSelectedOrderIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) setSelectedOrderIds([]);
    else setSelectedOrderIds(filteredOrders.map(o => o.id!));
  };
  const clearSelection = () => setSelectedOrderIds([]);

  // Barcode Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [toast, setToast] = useState<{ message: string } | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        const found = orders.find(o => o.code === barcode);
        if (found) {
          setSelectedOrderId(found.id);
        } else {
          setToast({ message: "Produto não localizado." });
          setTimeout(() => setToast(null), 3000);
        }
        setBarcode("");
        setIsScanning(false);
      } else if (e.key.length === 1) {
        setBarcode(prev => prev + e.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isScanning, barcode, orders]);

  // Batch Handlers
  const handleBatchDelete = () => {
    if (window.confirm(`Deseja realmente excluir os ${selectedOrderIds.length} pedidos selecionados?`)) {
      selectedOrderIds.forEach(onDeleteOrder);
      clearSelection();
    }
  };
  
  // ... existing code ...

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filtering Logic
  const { filteredOrders, paginatedOrders, totalPages } = useMemo(() => {
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

    const totalPages = Math.ceil(result.length / rowsPerPage);
    const paginatedOrders = result.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    return { filteredOrders: result, paginatedOrders, totalPages };
  }, [orders, searchTerm, selectedFilter, sortOption, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, sortOption]);

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
    const map: Record<string, { label: string; color: string; shadow: string; bgLight: string; text: string }> = {
      "orçamento": { label: "Orçamento", color: "bg-[#7FFF00]", shadow: "shadow-[2px_0_20px_rgba(127,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "novo pedido": { label: "Novo Pedido", color: "bg-[#37FD12]", shadow: "shadow-[2px_0_20px_rgba(55,253,18,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando sinal": { label: "Aguardando Sinal", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando aprovação cliente": { label: "Aprovação Cliente", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "em produção": { label: "Em Produção", color: "bg-[#FFD100]", shadow: "shadow-[2px_0_20px_rgba(255,209,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "montagem": { label: "Montagem", color: "bg-[#BD02FC]", shadow: "shadow-[2px_0_20px_rgba(189,2,252,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "pronto para entregar": { label: "Pronto p/ Entregar", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "enviado": { label: "Enviado", color: "bg-[#FFFFFF]", shadow: "shadow-[2px_0_20px_rgba(255,255,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "recebido": { label: "Recebido", color: "bg-[#3FFF00]", shadow: "shadow-[2px_0_20px_rgba(63,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando o pagamento restante": { label: "Aguardando Pagto", color: "bg-[#FFFF66]", shadow: "shadow-[2px_0_20px_rgba(255,255,102,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "concluído (pagamento completo)": { label: "Concluído", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" },
      "cancelled": { label: "Cancelado", color: "bg-[#EC7216]", shadow: "shadow-[2px_0_20px_rgba(236,114,22,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      
      "pending": { label: "Pendente", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "adjustments_requested": { label: "Ajustes", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      
      // Fallbacks para compatibilidade
      "quote": { label: "Orçamento", color: "bg-[#7FFF00]", shadow: "shadow-[2px_0_20px_rgba(127,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "waiting_payment": { label: "Pagamento Pendente", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "waiting_deposit": { label: "Aguardando Sinal", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "approval": { label: "Arte / Aprovação", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "production": { label: "Em Produção", color: "bg-[#FFD100]", shadow: "shadow-[2px_0_20px_rgba(255,209,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "assembly": { label: "Montagem", color: "bg-[#BD02FC]", shadow: "shadow-[2px_0_20px_rgba(189,2,252,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "ready": { label: "Pronto", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "delivery": { label: "Enviado", color: "bg-[#FFFFFF]", shadow: "shadow-[2px_0_20px_rgba(255,255,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "delivered": { label: "Concluído", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" },
      "fully_paid": { label: "Concluído", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" }
    };
    return map[s] || { label: status, color: "bg-gray-500", shadow: "shadow-[2px_0_20px_rgba(107,114,128,0.7)]", text: "text-gray-700", bgLight: "bg-gray-100" };
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
          onUpdateStatus={onUpdateStatus}
          onPrint={(o) => {
            setReceiptType("coupon");
            setReceiptOrder(o);
          }}
          onDelete={(id) => {
            onDeleteOrder(id);
            setSelectedOrderId(null);
          }}
          onDuplicate={async (o) => {
            await handleDuplicate(o);
            setSelectedOrderId(null);
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
    <div className="flex flex-col h-full bg-[#F5F5F7] animate-in fade-in duration-300 relative z-0 overflow-hidden">
      
      {/* Top Header & Stats */}
      <div className="px-6 pt-6 pb-6 glass-3d border-b border-[#E5E5EA]/50 z-10 shrink-0 mx-6 mt-6 rounded-[2.5rem] shadow-3d-soft">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
              <input type="checkbox" checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300" />
              <div>
                <h1 className="text-2xl font-black text-[#1C1C1E] tracking-tight uppercase">Centro de Pedidos</h1>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">Gestão Completa do Fluxo Comercial</p>
              </div>
            </div>
          <div className="flex gap-2">
            <div className="flex flex-col">
              <button
                onClick={() => setIsScanning(!isScanning)}
                className={`clean-3d-button ${isScanning ? 'bg-indigo-600 text-white shadow-3d-soft-active' : ''}`}
              >
                {isScanning ? "Aguardando leitura..." : "Bipar Código"}
              </button>
              {isScanning && (
                <input
                  type="text"
                  placeholder="Testar código (Enter)..."
                  className="mt-2 px-3 py-1.5 text-xs border rounded-lg"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const found = orders.find(o => o.code === barcode);
                        if (found) {
                          setSelectedOrderId(found.id);
                        } else {
                          setToast({ message: "Produto não localizado." });
                          setTimeout(() => setToast(null), 3000);
                        }
                        setBarcode("");
                        setIsScanning(false);
                    }
                  }}
                  onChange={(e) => setBarcode(e.target.value)}
                  value={barcode}
                />
              )}
            </div>
            <button
              onClick={() => setIsWizardOpen(true)}
              className="clean-3d-button w-full md:w-auto"
            >
              <Plus size={18} strokeWidth={3} /> Novo Pedido
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-4 right-4 bg-rose-500 text-white px-6 py-3 rounded-2xl shadow-3d-soft z-50 animate-in slide-in-from-bottom-4">
            {toast.message}
          </div>
        )}

        {/* Top Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="clean-3d-card p-6 flex flex-col justify-between hover:border-slate-300 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Pedidos Hoje</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{todayCount}</span>
          </div>
          <div className="clean-3d-card p-6 flex flex-col justify-between hover:border-blue-300 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-blue-600 transition-colors">Em Produção</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{productionCount}</span>
          </div>
          <div className="clean-3d-card p-6 flex flex-col justify-between hover:border-amber-300 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-amber-600 transition-colors">Aguardando Pgto</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{pendingPaymentCount}</span>
          </div>
          <div className="clean-3d-card p-6 flex flex-col justify-between hover:border-emerald-300 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-hover:text-emerald-600 transition-colors">Enviados</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">{shippedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="glass-3d border-b border-[#E5E5EA]/30 px-6 py-4 flex flex-col md:flex-row gap-6 items-center justify-between z-10 shrink-0 mx-6 mt-6 rounded-[2rem] shadow-3d-soft">
        
        {/* Quick Filters */}
        <div className="w-full md:w-auto">
          <HorizontalScroll className="gap-2 pb-2 md:pb-0">
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
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl whitespace-nowrap transition-all elevated-3d ${selectedFilter === f.id ? 'bg-[#1C1C1E] text-white shadow-3d-soft' : 'text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white/60'}`}
              >
                {f.label}
              </button>
            ))}
          </HorizontalScroll>
        </div>

        {/* Search & Sort */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={14} />
            <input
              type="text"
              placeholder="Pesquisar pedido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-xs outline-none focus:bg-white focus:border-[#1C1C1E]/20 transition-all text-[#1C1C1E] placeholder:text-[#AEAEB2] shadow-inner"
            />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-4 py-2.5 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-xs font-bold text-[#1C1C1E] outline-none focus:bg-white transition-all shadow-inner cursor-pointer"
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
      <div className="flex-1 overflow-y-auto p-6 md:p-10 relative z-0 scrollbar-hide">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#AEAEB2] space-y-6 py-20 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 rounded-[2.5rem] bg-white border border-[#E5E5EA] flex items-center justify-center shadow-3d-soft elevated-3d">
              <Package size={40} className="text-[#AEAEB2]" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <p className="text-sm font-black text-[#1C1C1E] uppercase tracking-widest">Nenhum pedido encontrado</p>
              <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">Refine sua busca ou filtros</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-[1400px] mx-auto pb-20">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {paginatedOrders.map(order => (
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
                  isSelected={selectedOrderIds.includes(order.id!)}
                  onToggleSelect={() => toggleOrder(order.id!)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-[#E5E5EA]">
              <div className="text-xs text-[#8E8E93]">
                Exibindo {((currentPage - 1) * rowsPerPage) + 1} - {Math.min(currentPage * rowsPerPage, filteredOrders.length)} de {filteredOrders.length}
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="px-2 py-1 text-xs border rounded-lg"
                >
                  {[10, 25, 50].map(v => <option key={v} value={v}>{v} por página</option>)}
                </select>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Anterior</button>
                <span className="text-xs font-bold">{currentPage} de {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs border rounded-lg disabled:opacity-50">Próximo</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Batch Action Bar */}
      {selectedOrderIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-3d-soft animate-in slide-in-from-bottom-4">
          <span className="text-xs font-bold mr-2">{selectedOrderIds.length} selecionados</span>
          <button onClick={handleBatchDelete} className="p-2 hover:bg-white/10 rounded-lg"><Trash2 size={16} className="text-rose-400"/></button>
          <button onClick={clearSelection} className="p-2 hover:bg-white/10 rounded-lg">Cancelar</button>
        </div>
      )}

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
});
