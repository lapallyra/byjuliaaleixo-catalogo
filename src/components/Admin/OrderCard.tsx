import React, { useState } from "react";
import { Order, Product } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatPhone } from "../../utils/masks";
import { Box, MoreVertical, Printer, Copy, MessageSquare, Tag, Eye, RefreshCw } from "lucide-react";
import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface OrderCardProps {
  order: Order;
  productInfo: { image: string | null | undefined; name: string; count: number };
  statusInfo: { label: string; color: string; bgLight: string; text: string };
  onViewDetails: (id: string) => void;
  onChangeStatusRequest: (order: Order) => void;
  onUpdateStatus: (id: string, status: Order["status"]) => void;
  onDuplicate: (order: Order) => void;
  onPrint: (order: Order) => void;
  onGenerateLabel: (order: Order) => void;
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
  onGenerateLabel
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
    { label: "Ver Resumo", icon: <Eye size={14} />, action: () => onViewDetails(order.id!) },
    { label: "Alterar Status", icon: <RefreshCw size={14} />, action: () => onChangeStatusRequest(order) },
    { label: "Imprimir", icon: <Printer size={14} />, action: () => onPrint(order) },
    { label: "Copiar Pedido", icon: <Copy size={14} />, action: () => onDuplicate(order) },
    { label: "Enviar WhatsApp", icon: <MessageSquare size={14} />, action: handleWhatsApp },
    { label: "Gerar Etiqueta", icon: <Tag size={14} />, action: () => onGenerateLabel(order) },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all duration-150 relative group">
      <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
        {/* Left Section: Order & Client Info */}
        <div className="flex items-center gap-4 flex-1 w-full md:w-auto">
          <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden relative">
            {productInfo.image ? (
              <img src={productInfo.image} alt="Produto" className="w-full h-full object-cover" />
            ) : (
              <Box size={20} className="text-gray-400" />
            )}
            {productInfo.count > 1 && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                {productInfo.count}
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-gray-900 truncate">{order.customerName || "Cliente não informado"}</span>
              <span className="text-xs text-gray-500 font-mono">#{order.code}</span>
            </div>
            <p className="text-sm text-gray-600 truncate">{productInfo.name}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              <span className="truncate">{order.contact ? formatPhone(order.contact) : "Sem contato"}</span>
              <span>•</span>
              <span className="truncate">{order.customerCity || "Cidade não informada"}</span>
            </div>
          </div>
        </div>

        {/* Middle Section: Value, Date, Payment */}
        <div className="flex flex-col gap-1 md:w-48 shrink-0">
          <div className="text-sm font-bold text-gray-900">{formatCurrency(Number(order.total) || 0)}</div>
          <div className="text-xs text-gray-500">
            {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy") : "--/--/--"}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {order.paymentMethod || "Não informado"}
          </div>
        </div>

        {/* Right Section: Status and Actions */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4 shrink-0">
          <span className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-md ${getStatusColor(order.status)}`}>
            {statusInfo.label}
          </span>
          
          <div className="flex items-center gap-2 relative">
            <button 
              onClick={() => {
                orchestrator.registerInteraction();
                onViewDetails(order.id!);
              }}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Ver Resumo
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {menuItems.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
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
