import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Package,
  Copy,
  MapPin,
  FileText,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Order, CompanyId, Product, Insumo, SiteSettings, Customer } from "../../types";
import { generatePremiumThermalReceipt, generateA4ProductionOrder, generatePremiumA4Receipt, sharePDF } from "../../lib/pdfGenerator";
import { PDFPreviewModal } from "./PDFPreviewModal";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { OrderReceiptModal } from "./OrderReceiptModal";
import { exportOrdersReportPDF, exportOrderReceiptPDF } from "../../utils/pdfGenerator";
import { getSiteSettings } from "../../services/firebaseService";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { OrderWizardModal } from "./OrderWizardModal";


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
}


const ORDER_STATUSES = [
  { id: "novo pedido", label: "Novo Pedido", color: "bg-blue-500", text: "text-blue-500", bgLight: "bg-blue-50 border-blue-100" },
  { id: "pending", label: "Aguardando Informações", color: "bg-amber-400", text: "text-amber-500", bgLight: "bg-amber-50 border-amber-100" },
  { id: "waiting_payment", label: "Aguardando Pagamento", color: "bg-orange-500", text: "text-orange-500", bgLight: "bg-orange-50 border-orange-100" },
  { id: "waiting_deposit", label: "Aguardando Sinal", color: "bg-orange-400", text: "text-orange-400", bgLight: "bg-orange-50 border-orange-100" },
  { id: "quote", label: "Orçamento", color: "bg-slate-500", text: "text-slate-500", bgLight: "bg-slate-50 border-slate-100" },
  { id: "approval", label: "Arte em Desenvolvimento", color: "bg-purple-500", text: "text-purple-500", bgLight: "bg-purple-50 border-purple-100" },
  { id: "production", label: "Em Produção", color: "bg-pink-500", text: "text-pink-500", bgLight: "bg-pink-50 border-pink-100" },
  { id: "assembly", label: "Controle de Qualidade", color: "bg-rose-400", text: "text-rose-400", bgLight: "bg-rose-50 border-rose-100" },
  { id: "ready", label: "Pronto", color: "bg-emerald-400", text: "text-emerald-500", bgLight: "bg-emerald-50 border-emerald-100" },
  { id: "delivery", label: "Despachado", color: "bg-teal-500", text: "text-teal-500", bgLight: "bg-teal-50 border-teal-100" },
  { id: "delivered", label: "Entregue", color: "bg-emerald-600", text: "text-emerald-600", bgLight: "bg-emerald-50 border-emerald-100" },
  { id: "fully_paid", label: "Quitado", color: "bg-emerald-600", text: "text-emerald-600", bgLight: "bg-emerald-50 border-emerald-100" },
  { id: "cancelled", label: "Cancelado", color: "bg-red-500", text: "text-red-500", bgLight: "bg-red-50 border-red-100" },
];

const getStatusRGB = (status: string) => {
  const s = status.toLowerCase();
  if (s === "novo pedido") return "59, 130, 246"; // blue-500
  if (s === "pending") return "251, 191, 36"; // amber-400
  if (s === "waiting_payment") return "249, 115, 22"; // orange-500
  if (s === "waiting_deposit") return "251, 146, 60"; // orange-400
  if (s === "quote") return "107, 114, 128"; // slate-500
  if (s === "approval") return "168, 85, 247"; // purple-500
  if (s === "production") return "236, 72, 153"; // pink-500
  if (s === "assembly") return "251, 113, 133"; // rose-400
  if (s === "ready") return "52, 211, 153"; // emerald-400
  if (s === "delivery") return "20, 184, 166"; // teal-500
  if (s === "delivered") return "5, 150, 105"; // emerald-600
  if (s === "fully_paid") return "5, 150, 105"; // emerald-600
  if (s === "cancelled") return "239, 68, 68"; // red-500
  return "107, 114, 128"; // fallback gray
};

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
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfData, setPdfData] = useState<{ doc: any; fileName: string } | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);

  useEffect(() => {
    getSiteSettings(companyId).then(setSettings);
  }, [companyId]);

  const filteredOrders = React.useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = 
        (o.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.code || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || o.status.toLowerCase() === selectedStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || new Date(a.createdAt).getTime() || Date.now();
      const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || new Date(b.createdAt).getTime() || Date.now();
      return timeB - timeA;
    });
  }, [orders, searchTerm, selectedStatus]);

  const selectedOrder = React.useMemo(() => orders.find(o => o.id === selectedOrderId), [orders, selectedOrderId]);

  const getStatusInfo = (status: string) => {
    const found = ORDER_STATUSES.find(s => s.id === status.toLowerCase());
    return found || { id: status, label: status, color: "bg-slate-300", text: "text-slate-500", bgLight: "bg-slate-50 border-slate-200" };
  };

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

  const handleDuplicate = async (order: Order) => {
    const { id, code, createdAt, ...rest } = order;
    await onSaveOrder({ ...rest, status: "novo pedido", deliveryDate: "" });
  };

  return (
    <div className="flex h-[calc(100vh-100px)] animate-in fade-in max-w-[1600px] mx-auto bg-white rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
      
      {/* Left side: List */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${selectedOrderId ? 'hidden lg:flex lg:w-1/3 xl:w-2/5 border-r border-[#E5E5EA]' : 'w-full'}`}>
        
        {/* Top Bar */}
        <div className="p-4 border-b border-[#E5E5EA] space-y-4 bg-white z-10 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-xl font-semibold text-[#1C1C1E] tracking-tight">Pedidos</h1>
            <button
              onClick={() => {
                setEditingOrder(null);
                setIsWizardOpen(true);
              }}
              className="flex items-center gap-2 bg-[#1C1C1E] text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-[#2C2C2E] transition-all shadow-sm active:scale-95"
            >
              <Plus size={16} /> Novo Pedido
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
              <input
                type="text"
                placeholder="Pesquisar pedido ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#F5F5F7] border border-transparent rounded-xl text-sm outline-none focus:border-[#E5E5EA] focus:bg-white transition-all text-[#1C1C1E]"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[#F5F5F7] border border-transparent rounded-xl px-4 py-2 text-[11px] text-[#1C1C1E] outline-none focus:border-[#E5E5EA] focus:bg-white transition-all"
              >
                <option value="all">Todos os Status</option>
                {ORDER_STATUSES.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-xs font-medium text-[#8E8E93]">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'} {searchTerm && 'encontrados'}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-[#F9F9F9] scrollbar-hide">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8E8E93] space-y-3">
              <Package size={48} className="text-[#D1D1D6]" />
              <p className="text-sm font-medium">Nenhum pedido encontrado.</p>
            </div>
          ) : (
            filteredOrders.map(order => {
              const statusInfo = getStatusInfo(order.status);
              const productInfo = getProductInfo(order);
              const isSelected = selectedOrderId === order.id;
              const isOrderActive = order.status.toLowerCase() !== "delivered" && 
                                   order.status.toLowerCase() !== "fully_paid" && 
                                   order.status.toLowerCase() !== "cancelled";
              const isLate = (() => {
                if (!order.deliveryDate || !isOrderActive) return false;
                try {
                  const todayStr = new Date().toISOString().split('T')[0];
                  return order.deliveryDate < todayStr;
                } catch (e) {
                  return false;
                }
              })();

              return (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`flex flex-col pt-4 pb-4 pr-4 pl-6 rounded-[1.25rem] cursor-pointer transition-all border relative overflow-hidden ${isSelected ? 'bg-white border-[#1C1C1E] shadow-[0_4px_20px_rgb(0,0,0,0.06)] scale-[1.02]' : 'bg-white border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-sm hover:scale-[1.01]'}`}
                >
                  {isOrderActive && (
                    <div 
                      className={`absolute left-0 top-0 bottom-0 w-1.5 transition-all z-10 ${isLate ? 'animate-pulse-glow' : ''}`}
                      style={{
                        backgroundColor: `rgb(${getStatusRGB(order.status)})`,
                        boxShadow: isLate 
                          ? undefined 
                          : `0 0 15px 4px rgba(${getStatusRGB(order.status)}, 0.95), inset -1px 0 2px rgba(255, 255, 255, 0.5)`,
                        ...({ '--glow-color': `rgba(${getStatusRGB(order.status)}, 0.95)` } as React.CSSProperties)
                      }}
                    />
                  )}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 mb-1">
                         <span className="font-mono text-xs font-bold text-[#1C1C1E]">#{order.code}</span>
                      </div>
                    </div>
                    <span className={`text-[9px] font-semibold px-2 py-1 rounded-lg border ${statusInfo.bgLight} ${statusInfo.text} uppercase tracking-wider`}>
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="flex gap-3 items-center bg-[#F5F5F7]/50 p-2.5 rounded-xl border border-[#E5E5EA]/50">
                    <div className="w-12 h-12 rounded-xl bg-white border border-[#E5E5EA] overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                      {productInfo.image ? (
                        <img src={productInfo.image} alt="Produto" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Box size={20} className="text-[#D1D1D6]" />
                      )}
                      {productInfo.count > 1 && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#1C1C1E] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                          {productInfo.count}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-semibold text-[#1C1C1E] truncate mb-0.5">{order.customerName || "Cliente não inf."}</h4>
                      <p className="text-[11px] text-[#8E8E93] font-medium truncate">{productInfo.name}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93] font-medium">
                        <Calendar size={12} className="text-[#D1D1D6]" /> 
                        {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yy") : "--/--/--"}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8E8E93] font-medium">
                        <Truck size={12} className="text-[#D1D1D6]" /> 
                        <span className="text-[#1C1C1E] font-semibold">
                          {order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yy") : "A combinar"}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1C1C1E] font-mono tracking-tight bg-[#F5F5F7] px-2 py-1 rounded-lg border border-[#E5E5EA]">
                      {formatCurrency(Number(order.total) || 0)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right side: Side Panel */}
      <AnimatePresence>
        {selectedOrder ? (
          <motion.div 
            key="order-detail"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 lg:static lg:flex-1 lg:z-auto bg-white flex flex-col overflow-hidden shadow-[-10px_0_30px_rgba(0,0,0,0.05)]"
          >
            {/* Mobile Close Button Overlay */}
            <div className="lg:hidden absolute top-4 right-4 z-50">
              <button onClick={() => setSelectedOrderId(null)} className="p-2 bg-white rounded-full shadow-md text-[#1C1C1E]">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide flex flex-col relative">
              {/* Header */}
              <div className="bg-[#F5F5F7]/80 p-6 lg:p-8 border-b border-[#E5E5EA] shrink-0 sticky top-0 z-10 backdrop-blur-xl">
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1C1C1E] font-mono">#{selectedOrder.code}</h2>
                    <p className="text-xs text-[#8E8E93] font-medium mt-1 uppercase tracking-widest">
                      {selectedOrder.createdAt ? safeFormatISO(selectedOrder.createdAt, "dd/MM/yyyy 'às' HH:mm") : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => {
                        const win = window.open(`https://wa.me/${selectedOrder.contact.replace(/\D/g, "")}?text=Olá ${encodeURIComponent(selectedOrder.customerName)}`, "_blank");
                        win?.focus();
                      }} 
                      className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 text-[11px] font-bold uppercase tracking-wider"
                    >
                      <Phone size={14} /> Falar com Cliente
                    </button>
                    <button onClick={async () => {
                        const doc = await generatePremiumA4Receipt(selectedOrder, settings);
                        setPdfData({ doc, fileName: "Pedido_" + selectedOrder.code });
                        setIsPdfPreviewOpen(true);
                      }} 
                      className="p-2.5 bg-white text-[#1C1C1E] rounded-xl hover:bg-[#F5F5F7] transition-all border border-[#E5E5EA] shadow-sm" title="Imprimir"
                    >
                      <Printer size={16} />
                    </button>
                    <button onClick={() => handleDuplicate(selectedOrder)} className="p-2.5 bg-white text-[#1C1C1E] rounded-xl hover:bg-[#F5F5F7] transition-all border border-[#E5E5EA] shadow-sm" title="Duplicar">
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                {/* Visual Status Flow */}
                <div className="w-full mt-4 bg-white p-4 rounded-[1.25rem] border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                   <div className="flex items-center justify-between relative px-4">
                      <div className="absolute left-8 right-8 top-[14px] h-[2px] bg-[#F5F5F7] -translate-y-1/2 z-0" />
                      
                      {(() => {
                        const milestones = [
                          { id: "novo pedido", label: "Novo" },
                          { id: "approval", label: "Arte" },
                          { id: "waiting_deposit", label: "Sinal" },
                          { id: "production", label: "Produção" },
                          { id: "ready", label: "Pronto" },
                          { id: "delivered", label: "Entregue" }
                        ];
                        let currentIndex = milestones.findIndex(m => m.id === selectedOrder.status.toLowerCase());
                        if (currentIndex === -1) {
                           if (["pending", "quote", "waiting_payment"].includes(selectedOrder.status.toLowerCase())) currentIndex = 0;
                           else if (["assembly"].includes(selectedOrder.status.toLowerCase())) currentIndex = 3;
                           else if (["delivery", "waiting_remaining"].includes(selectedOrder.status.toLowerCase())) currentIndex = 4;
                           else if (["fully_paid"].includes(selectedOrder.status.toLowerCase())) currentIndex = 5;
                           else if (["cancelled"].includes(selectedOrder.status.toLowerCase())) currentIndex = -1;
                           else currentIndex = 0;
                        }

                        if (selectedOrder.status.toLowerCase() === "cancelled") {
                            return <div className="text-center w-full text-red-500 font-bold uppercase tracking-widest text-xs py-2">Pedido Cancelado</div>
                        }

                        return (
                          <>
                            <div 
                              className="absolute left-8 top-[14px] h-[2px] bg-[#1C1C1E] -translate-y-1/2 z-0 transition-all duration-500"
                              style={{ width: `${(currentIndex / (milestones.length - 1)) * 90}%` }}
                            />
                            {milestones.map((ms, idx) => {
                              const isActive = idx === currentIndex;
                              const isCompleted = idx < currentIndex;
                              return (
                                <div key={ms.id} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => onUpdateStatus(selectedOrder.id, ms.id as any)}>
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-all ${isActive ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-md scale-110' : isCompleted ? 'bg-white border-[#1C1C1E] text-[#1C1C1E]' : 'bg-white border-[#E5E5EA] text-[#8E8E93] group-hover:border-[#D1D1D6]'}`}>
                                    {isCompleted ? <CheckCircle2 size={12} /> : idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-semibold uppercase tracking-wider text-center ${isActive ? 'text-[#1C1C1E]' : 'text-[#8E8E93]'}`}>{ms.label}</span>
                                </div>
                              );
                            })}
                          </>
                        );
                      })()}
                   </div>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-6 lg:p-8 space-y-8 flex-1 bg-[#FAFAFA]">
                
                {/* 1. Cliente */}
                <section>
                  <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                    <User size={14} /> Informações do Cliente
                  </h3>
                  <div className="bg-white rounded-[1.5rem] p-6 border border-[#E5E5EA] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                    <div>
                      <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Nome Completo</p>
                      <p className="text-[13px] font-semibold text-[#1C1C1E] mt-1 truncate" title={selectedOrder.customerName}>{selectedOrder.customerName || "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Contato (WhatsApp)</p>
                      <p className="text-[13px] font-semibold text-[#1C1C1E] mt-1 font-mono tracking-tight">{selectedOrder.contact ? formatPhone(selectedOrder.contact) : "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">CPF / CNPJ</p>
                      <p className="text-[13px] font-mono font-medium text-[#1C1C1E] mt-1 tracking-tight">{selectedOrder.customerCpfCnpj ? formatCPFOrCNPJ(selectedOrder.customerCpfCnpj) : "Não informado"}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">E-mail</p>
                      <p className="text-[13px] font-medium text-[#1C1C1E] mt-1 truncate" title={(selectedOrder as any).email || (selectedOrder as any).customerEmail}>{(selectedOrder as any).email || (selectedOrder as any).customerEmail || "Não informado"}</p>
                    </div>
                  </div>
                </section>

                {/* 2. Produto */}
                <section>
                  <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                    <Package size={14} /> Produtos do Pedido
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-[1.5rem] p-5 border border-[#E5E5EA] flex flex-col sm:flex-row gap-5 sm:items-center shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                        <div className="w-16 h-16 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] shrink-0 overflow-hidden flex items-center justify-center">
                          {item.image ? <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" /> : <Box className="text-[#D1D1D6]" size={24} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#1C1C1E] leading-snug">{item.product_name}</p>
                          <p className="text-[11px] font-medium text-[#8E8E93] mt-1">Ref: {item.productId || item.id || "N/A"}</p>
                        </div>
                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center bg-[#F5F5F7] sm:bg-transparent p-3 sm:p-0 rounded-xl gap-2">
                           <div className="flex flex-col sm:items-end">
                             <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Quantidade</p>
                             <p className="text-xs font-semibold text-[#1C1C1E] bg-white sm:bg-transparent px-2 py-0.5 rounded-md border sm:border-transparent border-[#E5E5EA]">{item.quantity} un</p>
                           </div>
                           <div className="flex flex-col sm:items-end text-right">
                             <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Total do Item</p>
                             <p className="text-sm font-mono font-bold text-[#1C1C1E]">{formatCurrency((item.quantity || 0) * (item.retail_price || 0))}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                    {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                      <div className="bg-white p-6 rounded-[1.5rem] border border-[#E5E5EA] text-center text-xs font-medium text-[#8E8E93] shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                        Nenhum item catalogado adicionado a este pedido.
                      </div>
                    )}
                  </div>
                </section>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* 3. Entrega */}
                  <section>
                    <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                      <Truck size={14} /> Detalhes de Entrega
                    </h3>
                    <div className="bg-white rounded-[1.5rem] p-6 border border-[#E5E5EA] space-y-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                      <div className="grid grid-cols-2 gap-6 pb-6 border-b border-[#F5F5F7]">
                        <div>
                          <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Método</p>
                          <p className="text-[13px] font-semibold text-[#1C1C1E] mt-1.5 uppercase flex items-center gap-2">
                            {selectedOrder.deliveryType === 'retirada' ? <><Box size={14}/> Retirada</> : 
                             selectedOrder.deliveryType === 'delivery' ? <><Truck size={14}/> Delivery</> : 
                             <><Truck size={14}/> Envio / Correios</>}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Data Limite</p>
                          <p className="text-[13px] font-semibold text-[#1C1C1E] mt-1.5 flex items-center gap-2">
                            <Calendar size={14} />
                            {selectedOrder.deliveryDate ? safeFormatISO(selectedOrder.deliveryDate, "dd/MM/yyyy") : "A Combinar"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest">Endereço de Destino</p>
                        <div className="bg-[#F5F5F7] p-4 rounded-xl mt-2 flex items-start gap-3">
                          <MapPin size={18} className="text-[#8E8E93] shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-[#1C1C1E] leading-relaxed">
                            {selectedOrder.address || "Retirada no Ateliê (Sem endereço cadastrado)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 4. Pagamento */}
                  <section>
                    <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                      <CreditCard size={14} /> Resumo Financeiro
                    </h3>
                    <div className="bg-white rounded-[1.5rem] p-6 border border-[#E5E5EA] space-y-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col justify-between h-[calc(100%-2.25rem)]">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-4 border-b border-[#F5F5F7]">
                           <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Subtotal dos Produtos</span>
                           <span className="text-[13px] font-mono font-medium text-[#1C1C1E]">{formatCurrency((selectedOrder.total || 0) - (selectedOrder.shippingCost || 0))}</span>
                        </div>
                        <div className="flex justify-between items-center pb-4 border-b border-[#F5F5F7]">
                           <span className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest">Custo de Frete</span>
                           <span className="text-[13px] font-mono font-medium text-[#1C1C1E]">{formatCurrency(selectedOrder.shippingCost || 0)}</span>
                        </div>
                        {selectedOrder.hasSignal && (
                          <div className="flex justify-between items-center pb-4 border-b border-[#F5F5F7]">
                             <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-widest">Sinal Pago Adiantado</span>
                             <span className="text-[13px] font-mono font-medium text-emerald-600">-{formatCurrency(selectedOrder.signalValue || ((selectedOrder.total || 0) / 2))}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center bg-[#F5F5F7] p-4 rounded-xl mt-4">
                         <span className="text-xs font-bold text-[#1C1C1E] uppercase tracking-widest">Total {selectedOrder.hasSignal ? 'Restante' : 'Geral'}</span>
                         <span className="text-xl font-mono font-bold text-[#1C1C1E] tracking-tight">{formatCurrency((selectedOrder.total || 0) - (selectedOrder.hasSignal ? (selectedOrder.signalValue || ((selectedOrder.total || 0) / 2)) : 0))}</span>
                      </div>
                    </div>
                  </section>
                </div>

                {/* 5. Observações */}
                <section>
                  <h3 className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-widest mb-4 flex items-center gap-2 ml-1">
                    <FileText size={14} /> Observações Internas
                  </h3>
                  <div className={`p-5 rounded-[1.5rem] text-sm font-medium whitespace-pre-wrap border shadow-[0_4px_20px_rgb(0,0,0,0.02)] ${(selectedOrder.observations || "").trim().length > 0 ? 'bg-amber-50/50 text-amber-900 border-amber-200/50' : 'bg-white text-[#8E8E93] border-[#E5E5EA] text-center'}`}>
                    {(selectedOrder.observations || "").trim().length > 0 ? selectedOrder.observations : "Nenhuma observação registrada para este pedido."}
                  </div>
                </section>

              </div>
              
              {/* Actions Footer */}
              <div className="p-6 bg-white border-t border-[#E5E5EA] shrink-0 sticky bottom-0 z-10 flex gap-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                 <button onClick={() => setOrderToDelete(selectedOrder.id)} className="p-4 bg-white border border-[#E5E5EA] text-rose-500 rounded-xl hover:bg-rose-50 hover:border-rose-100 transition-all font-semibold flex items-center justify-center">
                   <Trash2 size={20} />
                 </button>
                 <button onClick={() => {
                   setEditingOrder(selectedOrder);
                   setIsModalOpen(true);
                 }} className="flex-1 bg-[#1C1C1E] text-white py-4 rounded-xl font-bold uppercase tracking-wider text-[11px] hover:bg-[#2C2C2E] transition-all flex items-center justify-center gap-2 shadow-md">
                   <Edit size={16} /> Editar Pedido Completo
                 </button>
              </div>

            </div>
          </motion.div>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-[#F9F9F9] text-[#8E8E93] p-8 text-center">
             <div className="w-24 h-24 bg-white rounded-full border border-[#E5E5EA] flex items-center justify-center shadow-sm mb-6">
                <Package size={40} className="text-[#D1D1D6]" />
             </div>
             <h2 className="text-xl font-bold text-[#1C1C1E] tracking-tight">Gerenciamento de Pedidos</h2>
             <p className="text-sm max-w-sm mt-3 font-medium leading-relaxed">
               Selecione um pedido na lista para visualizar todos os detalhes, atualizar status ou emitir comprovantes.
             </p>
          </div>
        )}
      </AnimatePresence>

      {/* PDF Modal */}
      {isPdfPreviewOpen && pdfData && (
        <PDFPreviewModal 
          order={orders.find(o => o.id === selectedOrderId)}
          onClose={() => setIsPdfPreviewOpen(false)}
          pdfDoc={pdfData.doc}
          fileName={pdfData.fileName}
        />
      )}

      {/* Manual Order Modal Redesigned */}
      {isModalOpen && (
        <OrderFormModal
          editingOrder={editingOrder}
          products={products}
          companyId={companyId}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const atelier = data.companyId || companyId;
            const prefixMap: Record<string, string> = {
              pallyra: "LP",
              guennita: "CG",
              mimada: "MS",
            };
            const prefix = prefixMap[atelier as string] || "LP";
            const randomNumbers = Math.floor(10000 + Math.random() * 90000);
            
            const fullData = {
              ...data,
              id: editingOrder?.id,
              code: editingOrder?.code || `${prefix}${randomNumbers}`,
              companyId: atelier as CompanyId,
              source: (editingOrder?.source || "admin") as any,
            };
            await onSaveOrder(fullData);
            setIsModalOpen(false);
          }}
        />
      )}

      {isWizardOpen && (
        <OrderWizardModal
          products={products}
          customers={customers}
          companyId={companyId}
          onClose={() => setIsWizardOpen(false)}
          onSave={async (data) => {
            const atelier = data.companyId || companyId;
            const prefixMap: Record<string, string> = {
              pallyra: "LP",
              guennita: "CG",
              mimada: "MS",
            };
            const prefix = prefixMap[atelier as string] || "LP";
            const randomNumbers = Math.floor(10000 + Math.random() * 90000);
            const newCode = data.code || `${prefix}${randomNumbers}`;

            const fullData = {
              ...data,
              code: newCode,
              companyId: atelier as CompanyId,
              source: "admin" as const,
            };
            await onSaveOrder(fullData);
            setSelectedOrderId(newCode);
            return newCode;
          }}
        />
      )}

      {orderToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white max-w-sm w-full rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#1C1C1E] mb-2 tracking-tight">
              Excluir Pedido?
            </h3>
            <p className="text-sm text-[#8E8E93] mb-8 font-medium">
              Esta ação é permanente e não pode ser desfeita. O pedido será removido do sistema.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  if (orderToDelete) onDeleteOrder(orderToDelete);
                  if (selectedOrderId === orderToDelete) setSelectedOrderId(null);
                  setOrderToDelete(null);
                }}
                className="w-full py-4 bg-rose-500 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-md shadow-rose-500/20 active:scale-[0.98] transition-all"
              >
                Sim, Excluir Pedido
              </button>
              <button
                onClick={() => setOrderToDelete(null)}
                className="w-full py-4 bg-[#F5F5F7] text-[#1C1C1E] rounded-xl font-bold text-[11px] uppercase tracking-wider hover:bg-[#E5E5EA] transition-all"
              >
                Cancelar
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
    editingOrder?.deliveryType || "retirada",
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
      <div className="bg-white   w-full   max-w-4xl   max-h-[90vh] overflow-y-auto rounded-2xl border border-lilac/30 p-8 md:p-10 shadow-2xl   relative max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-[#8E8E93] transition-all"
        >
          <X size={24} />
        </button>

        <h2 className="text-xl font-medium text-slate-900 tracking-normal mb-8">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Tipo de Entrega
              </label>
              <select
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value as any)}
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
              >
                <option value="retirada">RETIRADA</option>
                <option value="delivery">DELIVERY</option>
                <option value="shipping">ENVIO</option>
              </select>
            </div>
          </div>

          {deliveryType === "shipping" && (
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
              <label className="text-[9px] uppercase font-medium text-blue-400 tracking-widest block mb-2">
                Custo do Frete (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={shipping}
                onChange={(e) => setShipping(Number(e.target.value))}
                className="w-full bg-white border border-blue-200 rounded-xl px-5 py-3 text-[11px] font-medium outline-none font-mono text-blue-600"
              />
            </div>
          )}

          {/* Incluir Produto Select */}
          <div className="p-6 rounded-2xl bg-lilac/5 border border-lilac/10 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-[10px] font-medium uppercase text-lilac tracking-widest">
                Produtos Selecionados
              </h4>
              <div className="text-[10px] font-medium text-slate-900">
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
                  <span className="text-[9px] font-bold text-[#8E8E93]">
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
                    className="w-16 bg-white border border-lilac/10 rounded-lg px-2 py-1 text-[11px] font-medium text-center"
                  />
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-900 w-24 text-right">
                  {formatCurrency(
                    (item.retail_price || 0) * (item.quantity || 0),
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  className="text-[#D1D1D6] hover:text-rose-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                Status Inicial
              </label>
              <select
                name="status"
                defaultValue={editingOrder?.status || "novo pedido"}
                className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
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
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isWholesale ? "bg-amber-50 border-amber-500" : "bg-white border-lilac/10 text-[#8E8E93]"}`}
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
                  className={`text-[10px] font-medium tracking-normal ${isWholesale ? "text-amber-700" : ""}`}
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
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isDepositPaid ? "bg-emerald-50 border-emerald-500" : "bg-white border-lilac/10 text-[#8E8E93]"}`}
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
                  className={`text-[10px] font-medium tracking-normal ${isDepositPaid ? "text-emerald-700" : ""}`}
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
                <p className="text-[9px] font-medium tracking-tight text-[#8E8E93]">
                  Total a Pagar
                </p>
                <p className="text-lg font-mono font-medium">
                  {formatCurrency(totalWithShipping || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-bold text-[#8E8E93]">
                  {isDepositPaid ? "Restante" : "Subtotal"}
                </p>
                <p className="text-[11px] font-mono font-medium text-lilac">
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
            <h4 className="text-[10px] font-medium uppercase text-slate-800 tracking-widest pl-1">
              Integração Marketplace / Origem da Venda
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Plataforma / Canal (Ex: Shopee, Mercado Livre, Elo7)
                </label>
                <select
                  name="marketplace"
                  defaultValue={editingOrder?.marketplace || ""}
                  className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-medium outline-none text-slate-900"
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
                <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
                  Taxa do Marketplace (%)
                </label>
                <input
                  name="marketplaceTax"
                  type="number"
                  step="0.01"
                  defaultValue={editingOrder?.marketplaceTax || 0}
                  placeholder="Ex: 12.5 (12.5% de taxa)"
                  className="w-full bg-white border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-medium outline-none font-mono text-slate-900"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-medium text-[#8E8E93] tracking-widest pl-2">
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
              className="flex-1 py-4 border border-lilac/10 rounded-xl font-bold uppercase text-[10px] tracking-widest text-[#8E8E93] hover:bg-white transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-black text-white rounded-xl font-medium uppercase text-[10px] tracking-widest hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
