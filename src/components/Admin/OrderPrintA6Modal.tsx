import React, { useEffect, useState } from "react";
import { Order } from "../../types";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";
import { OrderProductionLabel } from "./OrderProductionLabel";

interface OrderPrintA6ModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderPrintA6Modal: React.FC<OrderPrintA6ModalProps> = ({ order, onClose }) => {
  const [view, setView] = useState<"A6" | "LABEL">("A6");

  useEffect(() => {
    // A6 print is deprecated.
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-white print:bg-white flex flex-col items-center overflow-y-auto">
      {/* Action buttons (hidden when printing) */}
      <div className="w-full flex justify-between items-center p-4 print:hidden bg-slate-100 border-b border-slate-200">
        <div className="flex gap-2">
           <button 
             onClick={() => setView("A6")}
             className={`px-4 py-2 rounded font-bold uppercase text-xs tracking-widest ${view === "A6" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
           >
             Cupom A6
           </button>
           <button 
             onClick={() => setView("LABEL")}
             className={`px-4 py-2 rounded font-bold uppercase text-xs tracking-widest ${view === "LABEL" ? "bg-slate-900 text-white" : "bg-white text-slate-700 border border-slate-300"}`}
           >
             Etiqueta Prod.
           </button>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-rose-500 text-white rounded font-bold uppercase text-xs tracking-widest"
        >
          Fechar
        </button>
      </div>

      {view === "LABEL" ? (
        <div className="p-8">
           <OrderProductionLabel order={order} />
        </div>
      ) : (
        /* Cupom Não Fiscal Printable Area */
        <div className="w-[80mm] p-4 bg-white text-black font-sans text-[10px] leading-tight print:p-0 print:m-0 print:w-[80mm] mx-auto">
          {/* HEADER */}
          <div className="text-center mb-4 border-b border-gray-300 pb-2">
            <h2 className="font-bold text-sm">Ateliê By Julia Aleixo</h2>
            <p className="text-[9px]">Tel: (XX) XXXXX-XXXX</p>
          </div>

          <div className="mb-4 text-[10px]">
            <p className="font-bold">Pedido: #{order.code}</p>
            <p>Data: {order.createdAt ? safeFormatISO(order.createdAt, "dd/MM/yyyy HH:mm") : "--"}</p>
            <p>Cliente: {order.customerName}</p>
          </div>

          {/* ITENS */}
          <div className="border-t border-b border-dashed border-gray-400 py-2 mb-4">
             <div className="grid grid-cols-[auto,1fr,auto,auto] gap-1 text-[9px] font-bold uppercase mb-1">
               <span>Qtd</span>
               <span>Produto</span>
               <span>Un</span>
               <span>Total</span>
             </div>
             {order.items?.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[auto,1fr,auto,auto] gap-1 text-[9px] mb-1">
                  <span>{item.quantity}</span>
                  <span className="truncate">{item.product_name}</span>
                  <span>{formatCurrency(item.retail_price || item.current_price || 0)}</span>
                  <span>{formatCurrency((item.retail_price || item.current_price || 0) * (item.quantity || 1))}</span>
                </div>
             ))}
          </div>

          {/* RESUMO */}
          <div className="mb-4 text-[10px] space-y-0.5">
             <div className="flex justify-between font-bold text-[11px]">
               <span>TOTAL</span>
               <span>{formatCurrency(Number(order.total) || 0)}</span>
             </div>
             <div className="flex justify-between">
               <span>Forma de Pagamento:</span>
               <span>{order.paymentMethod || "N/A"}</span>
             </div>
             <div className="flex justify-between">
               <span>Valor Pago:</span>
               <span>{formatCurrency(typeof order.signalValue === 'number' ? order.signalValue : (order.hasSignal ? (Number(order.total) * 0.5) : 0))}</span>
             </div>
             {order.remainingValue && order.remainingValue > 0 && (
                <div className="flex justify-between font-bold text-red-600">
                  <span>Saldo Restante:</span>
                  <span>{formatCurrency(order.remainingValue)}</span>
                </div>
             )}
          </div>

          {/* RODAPÉ */}
          <div className="text-center text-[9px] mt-6">
            <p>Obrigado pela preferência!</p>
            <p className="font-bold">Ateliê By Julia Aleixo</p>
          </div>
        </div>
      )}

    </div>
  );
};
