import React, { useEffect } from "react";
import { Order } from "../../types";
import { safeFormatISO } from "../../lib/dateUtils";
import { formatCurrency } from "../../lib/currencyUtils";

interface OrderPrintA6ModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderPrintA6Modal: React.FC<OrderPrintA6ModalProps> = ({ order, onClose }) => {

  useEffect(() => {
    // Automatically trigger print when modal opens
    // Optional: wait a moment for rendering
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[300] bg-white print:bg-white flex flex-col items-center overflow-y-auto">
      {/* Action buttons (hidden when printing) */}
      <div className="w-full flex justify-end p-4 print:hidden bg-slate-100 border-b border-slate-200">
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-rose-500 text-white rounded font-bold uppercase text-xs tracking-widest"
        >
          Fechar
        </button>
      </div>

      {/* A6 Printable Area (105mm x 148mm approximately, but we let it flow) */}
      <div className="w-full max-w-[105mm] p-4 bg-white text-black font-sans text-[11px] leading-tight print:p-0 print:m-0 print:w-full mx-auto pb-12">
        <div className="text-center border-b border-dashed border-gray-400 pb-3 mb-3">
          <h1 className="text-xl font-bold uppercase tracking-widest">Pedido #{order.code}</h1>
          <p className="text-sm font-semibold">{order.companyId}</p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <p className="font-bold border-b border-gray-200 mb-1">CLIENTE</p>
            <p className="font-semibold text-sm">{order.customerName}</p>
            <p>{order.contact}</p>
          </div>

          <div>
            <p className="font-bold border-b border-gray-200 mb-1">DATA DE ENTREGA</p>
            <p className="text-sm font-bold">{order.deliveryDate ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy") : "Não agendada"}</p>
          </div>

          <div>
            <p className="font-bold border-b border-gray-200 mb-1">FORMA DE ENTREGA</p>
            <p className="font-semibold uppercase text-xs">
              {order.deliveryType === 'retirada' ? 'Retirada no Ateliê' : order.deliveryType === 'delivery' ? 'Delivery Local' : 'Correios/Transportadora'}
            </p>
            {order.deliveryType !== 'retirada' && (
               <p className="text-[10px] mt-1">{order.address}</p>
            )}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <p className="font-bold border-b border-gray-200 mb-1">PRODUTOS</p>
          {order.items?.map((item, idx) => (
             <div key={idx} className="pb-2 mb-2 border-b border-dashed border-gray-200 last:border-0">
               <p className="font-bold text-sm">
                 {item.quantity}x {item.product_name}
               </p>
               {item.observations && (
                 <p className="text-[10px] italic text-gray-700 mt-1">Obs: {item.observations}</p>
               )}
             </div>
          ))}
        </div>

        {(order.giftName || order.giftTheme || order.giftColors) && (
          <div className="space-y-1 mb-4 border p-2 rounded">
             <p className="font-bold border-b border-gray-200 mb-1">PERSONALIZAÇÕES (INFANTIL)</p>
             {order.giftName && <p>Nome: {order.giftName}</p>}
             {order.giftTheme && <p>Tema: {order.giftTheme}</p>}
             {order.giftColors && <p>Cores: {order.giftColors}</p>}
          </div>
        )}

        {order.observations && (
          <div className="mb-4">
            <p className="font-bold border-b border-gray-200 mb-1">OBSERVAÇÕES GERAIS</p>
            <p className="text-[10px] p-2 bg-gray-50">{order.observations}</p>
          </div>
        )}

        <div className="space-y-1 pt-3 border-t border-dashed border-gray-400">
           <p className="font-bold mb-1">RESUMO FINANCEIRO</p>
           <p className="font-semibold text-xs border-b border-gray-100 pb-1 mb-1">
             Pagamento: <span className="uppercase">{order.payment_method === 'full' ? 'Integral' : 'Sinal (50%) - Restante na entrega'}</span>
           </p>
           
           <div className="flex justify-between items-center text-xs">
              <span>Subtotal:</span>
              <span>{formatCurrency((Number(order.total) || 0) - (order.shippingCost || 0))}</span>
           </div>
           
           {order.shippingCost > 0 && (
             <div className="flex justify-between items-center text-xs">
                <span>Frete/Taxa:</span>
                <span>{formatCurrency(order.shippingCost)}</span>
             </div>
           )}

           <div className="flex justify-between items-center font-bold text-sm mt-1 pt-1 border-t border-gray-300">
              <span>TOTAL:</span>
              <span>{formatCurrency(Number(order.total) || 0)}</span>
           </div>
        </div>
        
      </div>

    </div>
  );
};
