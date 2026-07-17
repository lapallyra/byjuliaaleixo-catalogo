import React, { useState } from "react";
import { Order, Product } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatPhone } from "../../utils/masks";
import { Box, MoreVertical, Printer, Copy, MessageSquare, Tag, Eye, RefreshCw, Calendar, Trash2, CreditCard, Edit } from "lucide-react";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface OrderCardProps {
  order: Order;
  productInfo: { image: string | null | undefined; name: string; count: number };
  statusInfo: { label: string; color: string; shadow: string; bgLight: string; text: string };
  onViewDetails: (id: string) => void;
  onChangeStatusRequest: (order: Order) => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onDuplicate: (order: Order) => void;
  onPrint: (order: Order) => void;
  onGenerateLabel: (order: Order) => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete?: (id: string) => void;
  onRegisterPayment?: (id: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  productInfo,
  statusInfo,
  onViewDetails,
  onChangeStatusRequest,
  onUpdateStatus,
  onDuplicate,
  onPrint,
  onGenerateLabel,
  isSelected,
  onToggleSelect,
  onDelete,
  onRegisterPayment
}) => {
  const orchestrator = useAdminOrchestrator();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === "waiting_payment" || s === "waiting_deposit" || s === "novo pedido" || s === "quote" || s === "pending" || s === "adjustments_requested") return "bg-gray-100 text-gray-700";
    if (s === "production" || s === "approval" || s === "assembly") return "bg-blue-100 text-blue-700";
    if (s === "ready") return "bg-purple-100 text-purple-700";
    if (s === "delivery" || s === "delivered" || s === "fully_paid" || s === "approved") return "bg-green-100 text-green-700";
    if (s === "cancelled") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const handleWhatsApp = () => {
    if (!order.contact) return;
    const phone = order.contact.replace(/\D/g, "");
    const text = encodeURIComponent(`Olá ${order.customerName}, sobre o seu pedido #${order.code}...`);
    window.open(`https://wa.me/${phone}?text=${text}`, "_blank");
  };

  const menuItems = [
    { label: "Abrir Resumo", icon: <Eye size={14} />, action: () => onViewDetails(order.id) },
    { label: "Registrar Pagamento", icon: <CreditCard size={14} />, action: () => {
        if (onRegisterPayment) onRegisterPayment(order.id);
    } },
    { label: "Alterar Status", icon: <RefreshCw size={14} />, action: () => onChangeStatusRequest(order) },
    { label: "Imprimir Etiqueta", icon: <Tag size={14} />, action: () => onGenerateLabel(order) },
    { label: "Imprimir Cupom", icon: <Printer size={14} />, action: () => onPrint(order) },
    { label: "Duplicar Pedido", icon: <Copy size={14} />, action: () => onDuplicate(order) },
    { label: "Editar", icon: <Edit size={14} />, action: () => onChangeStatusRequest(order) }, // Using edit modal
    { label: "Excluir", icon: <Trash2 size={14} className="text-rose-600" />, action: () => {
        if(window.confirm("Deseja realmente excluir este pedido?")) {
           if (onDelete) onDelete(order.id);
        }
    }},
  ];

  return (
    <div 
      onClick={(e) => {
        // Stop click propagation if clicking on checkbox
        if ((e.target as HTMLElement).tagName !== 'INPUT') {
            orchestrator.registerInteraction();
            onViewDetails(order.id!);
        }
      }}
      className={`clean-3d-card bg-white p-4 md:p-5 group flex flex-col md:flex-row items-start md:items-center justify-between relative pl-12 md:pl-16 ${isMenuOpen ? 'z-50' : 'z-10'} gap-4 md:gap-5 cursor-pointer hover:shadow-lg transition-all ${isSelected ? 'ring-2 ring-indigo-500' : ''}`}
    >
      <input type="checkbox" checked={isSelected} onChange={(e) => { e.stopPropagation(); onToggleSelect(); }} className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded border-gray-300" />
      
      {/* Faixa LED Lateral - Apenas a cor sólida e o brilho para fora */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[28px] ${statusInfo.color} z-20`} style={{ boxShadow: '-6px 0 20px 2px ' + statusInfo.color.replace('bg-[', '').replace(']', '') + '80' }} />
      
      <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between w-full">
        {/* Left Section: Order & Client Info */}
        <div className="flex items-center gap-4 flex-1 w-full min-w-0">
          <div className="flex-1 min-w-0 pr-2">
            <div className="mb-0.5 flex items-center gap-2 flex-wrap">
              <span className="text-[10px] text-[#8E8E93] font-mono bg-[#F5F5F7] px-1.5 py-0.5 rounded inline-block">#{order.code}</span>
              {order.priority && order.priority !== "normal" && (
                <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
                  order.priority === "baixa" ? "bg-slate-100 text-slate-600 border border-slate-200" :
                  order.priority === "alta" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                  "bg-rose-50 text-rose-700 border border-rose-200" // urgente
                }`}>
                  {order.priority}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-[#1C1C1E] truncate uppercase text-sm tracking-tight">{order.customerName || "Cliente não informado"}</span>
            </div>
            <p className="text-[11px] text-[#8E8E93] font-medium truncate">{productInfo.name} {productInfo.count > 1 ? `(${productInfo.count}x)` : ''}</p>
            <div className="flex items-center gap-3 mt-1.5 text-[10px] font-bold text-[#AEAEB2] truncate">
              <span className="shrink-0">{order.contact ? formatPhone(order.contact) : "Sem contato"}</span>
              <span className="shrink-0">•</span>
              <span className="truncate uppercase">{order.customerCity || "Cidade não informada"}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Value, Date, Payment */}
        <div className="flex flex-col gap-1 shrink-0 md:items-end">
          <div className="text-sm font-black text-[#1C1C1E] tracking-tighter">{formatCurrency(Number(order.total) || 0)}</div>
          <div className="text-[10px] font-bold text-[#8E8E93] flex items-center gap-1.5">
            <Calendar size={10} />
            {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--/--/--"}
          </div>
          <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
            {order.paymentMethod || "Não informado"}
          </div>
        </div>

        {/* Right Section: Status and Actions */}
        <div className="flex items-center justify-start md:justify-end gap-3 shrink-0 flex-wrap md:flex-nowrap">
          <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full shadow-xs border border-white/20 ${statusInfo.bgLight} ${statusInfo.text} truncate max-w-[100px]`}>
            {statusInfo.label}
          </span>
          
          <div className="flex items-center gap-2 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors shrink-0"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {menuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        item.action();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
