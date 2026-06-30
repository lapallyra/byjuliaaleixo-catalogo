import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBag,
  DollarSign,
  Layers
} from "lucide-react";
import { formatCurrency } from "../../lib/currencyUtils";
import { Order } from "../../types";

interface AdminSalesStreamProps {
  orders: Order[];
  onOpenOrder?: (order: any) => void;
}

const getStatusRGB = (status: string) => {
  const s = (status || "").toLowerCase();
  if (s === "novo pedido") return "59, 130, 246"; // blue-500
  if (s === "approved" || s === "aprovado") return "16, 185, 129"; // emerald-500
  if (s === "adjustments_requested") return "168, 85, 247"; // purple-500
  if (s === "pending") return "251, 191, 36"; // amber-400
  if (s === "waiting_payment") return "249, 115, 22"; // orange-500
  if (s === "waiting_deposit") return "251, 146, 60"; // orange-400
  if (s === "quote") return "107, 114, 128"; // slate-500
  if (s === "approval") return "168, 85, 247"; // purple-500
  if (s === "production" || s === "em produção") return "236, 72, 153"; // pink-500
  if (s === "assembly" || s === "em montagem") return "251, 113, 133"; // rose-400
  if (s === "ready" || s === "pronto") return "52, 211, 153"; // emerald-400
  if (s === "delivery") return "20, 184, 166"; // teal-500
  if (s === "delivered" || s === "entregue") return "5, 150, 105"; // emerald-600
  if (s === "fully_paid") return "5, 150, 105"; // emerald-600
  if (s === "cancelled") return "239, 68, 68"; // red-500
  return "107, 114, 128"; // fallback gray
};

export const AdminSalesStream: React.FC<AdminSalesStreamProps> = ({ orders, onOpenOrder }) => {
  
  // Cleanly sort real orders by timestamp (newest first)
  const realOrders = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return [...orders].sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [orders]);

  // Compute actual real financials for the stream header
  const totalVolume = React.useMemo(() => {
    return realOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  }, [realOrders]);

  // Format time elapsed nicely for real orders
  const getElapsedText = (createdAt: any) => {
    if (!createdAt) return "agora";
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const elapsedMs = Date.now() - date.getTime();
    const secs = Math.floor(elapsedMs / 1000);
    if (secs < 10) return "agora";
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <div id="admin-sales-stream-panel" className="bg-white/90 border border-[#E5E5EA] rounded-[2rem] p-6 shadow-[0_15px_50px_rgba(0,0,0,0.015)] flex flex-col h-full">
      
      {/* Real Ticker Operational Stats Line - RETURNED as per user request */}
      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono font-bold text-gray-400 tracking-wider border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-1">
          <DollarSign size={10} className="text-[#CCA062]" />
          <span>VOLUME TOTAL:</span>
          <span className="text-gray-800 font-extrabold">{formatCurrency(totalVolume)}</span>
        </div>
        <div className="hidden sm:block h-2.5 w-px bg-gray-200" />
        <div className="flex items-center gap-1">
          <Layers size={10} className="text-blue-500" />
          <span>PEDIDOS REGISTRADOS:</span>
          <span className="text-gray-800 font-extrabold">{realOrders.length}</span>
        </div>
      </div>

      {/* OPERATIONAL ORDERS FEED */}
      <div className="flex-1 space-y-2.5 min-h-[280px]">
        {realOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingBag className="w-8 h-8 text-gray-300 mb-2" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider font-mono">Nenhum pedido real encontrado</p>
            <p className="text-[10px] text-gray-400 mt-1">Aguardando novos lançamentos no banco de dados.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {realOrders.slice(0, 6).map((order) => {
              const orderId = order.code || (order.id && typeof order.id === 'string' ? order.id.substring(0, 6) : '000000');
              const orderValue = Number(order.total) || 0;
              const customerName = order.customerName || "Cliente Anonimizado";
              const productName = order.items?.[0]?.product_name || "Mimos de Ateliê";
              
              // Map real order status to local badges
              const statusLabel = order.status === "production" ? "Produção" : 
                                  order.status === "assembly" ? "Montagem" : 
                                  order.status === "approved" ? "Aprovado" : "Pendente";

              const statusColorClass = order.status === "production" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                       order.status === "approved" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                                       "bg-blue-100 text-blue-700 border-blue-200";

              return (
                <motion.div
                  key={order.id}
                  layoutId={`admin-order-row-${order.id}`}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onClick={() => {
                    if (onOpenOrder) onOpenOrder(order);
                  }}
                  className="group border border-gray-100/80 rounded-xl p-3 pl-5 sm:pl-6 sm:pr-4 flex items-center justify-between gap-3 transition-all cursor-pointer select-none bg-white hover:border-[#CCA062]/30 hover:shadow-sm relative overflow-visible"
                >
                  {/* Left indicator line with intense LED glow */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 z-10 rounded-l-xl"
                    style={{
                      background: `linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgb(${getStatusRGB(order.status)}) 40%, rgb(${getStatusRGB(order.status)}) 100%)`,
                      boxShadow: `0 0 8px rgb(${getStatusRGB(order.status)}), 0 0 16px rgb(${getStatusRGB(order.status)})`,
                    }}
                  />

                  {/* Left Column: ID, Client, Product */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Tiny visual representation of atelier item */}
                    <div className="w-8 h-8 rounded-lg bg-[#FAF9F6] border border-[#F2F2F7] flex items-center justify-center shrink-0 shadow-xs relative">
                      <ShoppingBag className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#CCA062] transition-colors" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-[#1C1C1E] uppercase tracking-tight truncate">
                          {customerName}
                        </span>
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-gray-50 border border-gray-150/70 rounded text-gray-500 uppercase">
                          #{orderId}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 truncate leading-tight">
                        {productName}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Price and Status/Time */}
                  <div className="text-right shrink-0 flex items-center gap-4">
                    <div>
                      <p className="text-[11px] font-black text-gray-900 font-mono">
                        {formatCurrency(orderValue)}
                      </p>
                      <span className="text-[8px] font-bold text-gray-400 font-mono block mt-0.5 uppercase">
                        há {getElapsedText(order.createdAt)}
                      </span>
                    </div>

                    {/* Operational badge */}
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-1 rounded-md border shrink-0 ${statusColorClass}`}>
                      {statusLabel}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
