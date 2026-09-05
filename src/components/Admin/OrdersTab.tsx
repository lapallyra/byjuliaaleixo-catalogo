import React, { useState, useEffect, useMemo } from "react";
import { Plus, Search, Filter, SortDesc, Calendar, Box, Package, FileText, CheckCircle2, Trash2, Printer } from "lucide-react";
import { Order, CompanyId, Product, Insumo, SiteSettings, Customer } from "../../types";
import { getSiteSettings } from "../../services/firebaseService";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { OrderCard } from "./OrderCard";
import { OrderDetailsView } from "./OrderDetailsView";
import { OrderFormModal } from "./OrderFormModal";
import { OrderWizardModal } from "./OrderWizardModal";
import { OrderReceiptModal } from "./OrderReceiptModal";
import { HorizontalScroll } from "../shared/HorizontalScroll";
import { exportActiveOrdersVerificationPDF } from "../../utils/pdfGenerator";

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  customers: Customer[];
  companyId?: CompanyId;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onSaveOrder: (order: Partial<Order>) => Promise<string | void>;
  onDeleteOrder: (id: string) => void;
  initialOrderId?: string | null;
  initialCustomerId?: string | null;
  onNavigateNewOrder?: () => void;
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
  onNavigateNewOrder,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  // View States
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [detailsTab, setDetailsTab] = useState<"geral" | "cliente" | "produtos" | "financeiro" | "producao" | "arquivos" | "historico">("geral");
  const [autoOpenPayment, setAutoOpenPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [filterResponsible, setFilterResponsible] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  
  // Modal States
  const [isWizardOpen, setIsWizardOpen] = useState(!!initialCustomerId);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [receiptType, setReceiptType] = useState<"coupon" | "receipt">("coupon");
  
  useEffect(() => {
    const handleNewOrder = () => {
      if (onNavigateNewOrder) onNavigateNewOrder();
      else setIsWizardOpen(true);
    };
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
      const term = searchTerm.toLowerCase().trim();
      
      const codeMatch = (o.code || "").toLowerCase().includes(term);
      const customerMatch = (o.customerName || "").toLowerCase().includes(term);
      const contactMatch = (o.contact || "").toLowerCase().includes(term);
      const cityMatch = (o.customerCity || "").toLowerCase().includes(term);
      const observationsMatch = (o.observations || "").toLowerCase().includes(term);
      const purposeMatch = (o.investmentPurpose || "").toLowerCase().includes(term);
      
      const productsMatch = (o.items || []).some(item => {
        const nameMatch = (item.product_name || "").toLowerCase().includes(term);
        const categoryMatch = (item.category || "").toLowerCase().includes(term);
        return nameMatch || categoryMatch;
      });

      const searchMatch = codeMatch || customerMatch || contactMatch || cityMatch || observationsMatch || productsMatch || purposeMatch;
      
      if (!searchMatch) return false;

      // Filter by Responsible
      if (filterResponsible !== "all") {
        const resp = (o.responsible || o.assignee || "").toLowerCase().trim();
        if (resp !== filterResponsible.toLowerCase().trim()) return false;
      }

      // Filter by Priority
      if (filterPriority !== "all") {
        const prio = (o.priority || o.productionPriority || "normal").toLowerCase().trim();
        if (prio !== filterPriority.toLowerCase().trim()) return false;
      }

      // Filter by Atelier (optional local filter)
      if (filterAtelier !== "all" && o.companyId !== filterAtelier) {
        return false;
      }

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
        case "cancelled": return ["cancelled", "cancelado"].includes(s);
        case "quote": return ["quote", "orcamento", "orçamento"].includes(s);
        case "all":
        default: return true;
      }
    });

    // Sorting
    result.sort((a, b) => {
      const isCancelledA = ["cancelled", "cancelado"].includes((a.status || "").toLowerCase()) ? 1 : 0;
      const isCancelledB = ["cancelled", "cancelado"].includes((b.status || "").toLowerCase()) ? 1 : 0;
      
      if (isCancelledA !== isCancelledB) {
        return isCancelledA - isCancelledB; // Canceled always at the very bottom of queue
      }

      const isCompletedA = ["delivered", "fully_paid"].includes((a.status || "").toLowerCase()) ? 1 : 0;
      const isCompletedB = ["delivered", "fully_paid"].includes((b.status || "").toLowerCase()) ? 1 : 0;
      
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
  }, [orders, searchTerm, selectedFilter, sortOption, currentPage, rowsPerPage, filterResponsible, filterPriority]);

  const uniqueResponsibles = useMemo(() => {
    return Array.from(new Set(orders.map(o => o.responsible || o.assignee).filter(Boolean))) as string[];
  }, [orders]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedFilter, sortOption, filterResponsible, filterPriority]);

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
      "orçamento": { label: "ORÇAMENTO", color: "bg-[#7FFF00]", shadow: "shadow-[2px_0_20px_rgba(127,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "novo pedido": { label: "NOVO PEDIDO", color: "bg-[#37FD12]", shadow: "shadow-[2px_0_20px_rgba(55,253,18,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando sinal": { label: "SINAL", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando aprovação cliente": { label: "APROVAÇÃO", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "em produção": { label: "EM PRODUÇÃO", color: "bg-[#FFD100]", shadow: "shadow-[2px_0_20px_rgba(255,209,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "montagem": { label: "MONTAGEM", color: "bg-[#BD02FC]", shadow: "shadow-[2px_0_20px_rgba(189,2,252,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "conferência": { label: "CONFERÊNCIA", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "embalagem": { label: "EMBALAGEM", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "pronto para entregar": { label: "PRONTO PARA ENTREGAR", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "enviado": { label: "ENVIADO/ENTREGA", color: "bg-[#FFFFFF]", shadow: "shadow-[2px_0_20px_rgba(255,255,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "recebido": { label: "ENTREGUE/RECEBIDO", color: "bg-[#3FFF00]", shadow: "shadow-[2px_0_20px_rgba(63,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "aguardando o pagamento restante": { label: "Aguardando Pagamento Restante", color: "bg-[#FFFF66]", shadow: "shadow-[2px_0_20px_rgba(255,255,102,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "concluído (pagamento completo)": { label: "ENTREGUE/RECEBIDO", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" },
      "cancelled": { label: "CANCELADO", color: "bg-[#EC7216]", shadow: "shadow-[2px_0_20px_rgba(236,114,22,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      
      "pending": { label: "SINAL", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "adjustments_requested": { label: "ARTE", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      
      // Fallbacks para compatibilidade
      "quote": { label: "ORÇAMENTO", color: "bg-[#7FFF00]", shadow: "shadow-[2px_0_20px_rgba(127,255,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "waiting_payment": { label: "SINAL", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "waiting_deposit": { label: "SINAL", color: "bg-[#0080FF]", shadow: "shadow-[2px_0_20px_rgba(0,128,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "approval": { label: "APROVAÇÃO", color: "bg-[#FBBD04]", shadow: "shadow-[2px_0_20px_rgba(251,189,4,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "production": { label: "EM PRODUÇÃO", color: "bg-[#FFD100]", shadow: "shadow-[2px_0_20px_rgba(255,209,0,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "assembly": { label: "MONTAGEM", color: "bg-[#BD02FC]", shadow: "shadow-[2px_0_20px_rgba(189,2,252,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "conferencing": { label: "CONFERÊNCIA", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "packaging": { label: "EMBALAGEM", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "ready": { label: "PRONTO PARA ENTREGAR", color: "bg-[#C7EA46]", shadow: "shadow-[2px_0_20px_rgba(199,234,70,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "delivery": { label: "ENVIADO/ENTREGA", color: "bg-[#FFFFFF]", shadow: "shadow-[2px_0_20px_rgba(255,255,255,0.7)]", text: "text-slate-700", bgLight: "bg-slate-100" },
      "delivered": { label: "ENTREGUE/RECEBIDO", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" },
      "fully_paid": { label: "ENTREGUE/RECEBIDO", color: "bg-transparent", shadow: "shadow-none", text: "text-slate-700", bgLight: "bg-slate-100" }
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
          onBack={() => {
            setSelectedOrderId(null);
            setDetailsTab("geral");
            setAutoOpenPayment(false);
          }} 
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
          initialTab={detailsTab}
          openPaymentModalOnMount={autoOpenPayment}
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
    <div className="w-full flex flex-col space-y-3 sm:space-y-4 animate-in fade-in duration-300 relative z-0">
      
      {/* Top Header & Stats */}
      <div className="p-4 sm:p-5 bg-white border border-slate-200/80 z-10 shrink-0 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
              <input type="checkbox" checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer" />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-[#1C1C1E] tracking-tight uppercase">Centro de Pedidos</h1>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mt-0.5">Gestão Completa do Fluxo Comercial</p>
              </div>
            </div>
          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => {
                const active = orders.filter(o => 
                  !["delivered", "cancelled", "fully_paid", "finalized", "concluído (pagamento completo)"].includes((o.status || "").toLowerCase())
                );
                exportActiveOrdersVerificationPDF(active, companyId);
              }}
              className="clean-3d-button w-full sm:w-auto bg-[#cca062] hover:bg-[#b28950] text-white flex items-center justify-center gap-2"
              title="Gerar PDF de Conferência de Pedidos Ativos"
            >
              <Printer size={16} /> Conferência de Ativos
            </button>
            <button
              onClick={() => {
                if (onNavigateNewOrder) onNavigateNewOrder();
                else setIsWizardOpen(true);
              }}
              className="clean-3d-button w-full sm:w-auto"
            >
              <Plus size={16} strokeWidth={3} /> Novo Pedido
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <div className="clean-3d-card p-3.5 sm:p-4 flex flex-col justify-between border-slate-100 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Pedidos Hoje</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{todayCount}</span>
          </div>
          <div className="clean-3d-card p-3.5 sm:p-4 flex flex-col justify-between border-slate-100 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Em Produção</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{productionCount}</span>
          </div>
          <div className="clean-3d-card p-3.5 sm:p-4 flex flex-col justify-between border-slate-100 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Aguardando Pgto</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{pendingPaymentCount}</span>
          </div>
          <div className="clean-3d-card p-3.5 sm:p-4 flex flex-col justify-between border-slate-100 transition-all group">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 transition-colors">Enviados</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter">{shippedCount}</span>
          </div>
        </div>
      </div>

      {/* Filters and Search Bar Card */}
      <div className="bg-white border border-slate-200/80 p-3 sm:p-4 flex flex-col gap-3 z-10 shrink-0 rounded-2xl shadow-sm">
        
        {/* Linha 1: Campo de Busca e Dropdowns de Filtro */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full">
          <div className="relative flex-1 min-w-[220px] max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-800 transition-colors" size={15} />
            <input
              type="text"
              placeholder="Pesquisar pedido por código, cliente, produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-slate-400 transition-all text-slate-800 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all cursor-pointer"
            >
              <option value="newest">Mais recente</option>
              <option value="oldest">Mais antigo</option>
              <option value="highest_value">Maior valor</option>
              <option value="lowest_value">Menor valor</option>
              <option value="deadline">Prazo de entrega</option>
            </select>

            {/* Filtro de Responsável */}
            <select
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all cursor-pointer"
            >
              <option value="all">Responsável: Todos</option>
              {uniqueResponsibles.map((resp) => (
                <option key={resp} value={resp}>
                  {resp}
                </option>
              ))}
            </select>

            {/* Filtro de Ateliê */}
            <select
              value={filterAtelier}
              onChange={(e) => setFilterAtelier(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all cursor-pointer"
            >
              <option value="all">Ateliê: Todos (Consolidado)</option>
              <option value="pallyra">Pallyra</option>
              <option value="guennita">Guennita</option>
              <option value="mimada">Mimada</option>
              <option value="tuttymimo">Tuttymimo</option>
              <option value="madrinha">Madrinha</option>
            </select>

            {/* Filtro de Prioridade */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-slate-400 transition-all cursor-pointer"
            >
              <option value="all">Prioridade: Todas</option>
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
              <option value="urgente">Urgente</option>
            </select>
          </div>
        </div>

        {/* Linha 2: Abas de Status com Scroll Horizontal Limpo e sem Sobreposição */}
        <div className="w-full min-w-0 overflow-x-auto pb-1 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: "all", label: "Todos" },
              { id: "quote", label: "Orçamentos" },
              { id: "today", label: "Hoje" },
              { id: "week", label: "Esta semana" },
              { id: "month", label: "Este mês" },
              { id: "production", label: "Produção" },
              { id: "pending_payment", label: "Pgto Pendente" },
              { id: "shipped", label: "Enviado" },
              { id: "completed", label: "Concluído" },
              { id: "cancelled", label: "Cancelados" },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl whitespace-nowrap transition-all shrink-0 ${
                  selectedFilter === f.id
                    ? 'bg-[#1C1C1E] text-white shadow-sm'
                    : 'text-slate-600 bg-slate-100 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List Area */}
      <div className="w-full py-1 relative z-0">
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
          <div className="flex flex-col gap-4 w-full pb-20">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
                  onDelete={(id) => {
                    onDeleteOrder(id);
                  }}
                  onRegisterPayment={(id) => {
                    setSelectedOrderId(id);
                    setDetailsTab("financeiro");
                    setAutoOpenPayment(true);
                  }}
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
          <button
            onClick={() => {
              const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id!));
              exportActiveOrdersVerificationPDF(selectedOrders, companyId);
            }}
            className="p-2 hover:bg-white/10 rounded-lg flex items-center gap-1.5 text-xs text-amber-300 font-bold cursor-pointer"
            title="Gerar PDF de Conferência para os selecionados"
          >
            <Printer size={16} /> Conferência
          </button>
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
