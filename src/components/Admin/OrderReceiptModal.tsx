import React, { useState, useEffect } from "react";
import { X, Printer, FileText, Flower2 } from "lucide-react";
import { Order, CompanyId, SiteSettings } from "../../types";
import { getGlobalSettings, getSiteSettings } from "../../services/firebaseService";
import { safeFormat, safeFormatISO } from "../../lib/dateUtils";
import { ImageWithFallback } from "../ImageWithFallback";
import { exportOrderReceiptPDF } from "../../utils/pdfGenerator";

interface OrderReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({
  order,
  onClose,
}) => {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({});
  const [receiptType, setReceiptType] = useState<"receipt" | "coupon">(
    "receipt",
  );

  useEffect(() => {
    const load = async () => {
      const data = await getSiteSettings(order.companyId as CompanyId);
      const globalData = await getGlobalSettings();
      if (data) {
        setSettings({ ...data, ...globalData });
      } else if (globalData) {
        setSettings(globalData);
      }
    };
    load();
  }, [order.companyId]);

  const handlePrint = () => {
    window.print();
  };

  const atelierNames: Record<string, string> = {
    pallyra: "La Pallyra",
    guennita: "com amor, Guennita",
    mimada: "Mimada Sim",
  };

  const studioName =
    settings.store_name || atelierNames[order.companyId] || "Ateliê";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-transparent overflow-y-auto">
      {/* Printable Area */}
      <div className="bg-white w-full max-w-4xl max-h-[90vh] md:max-h-[95vh] rounded-[2rem] shadow-2xl overflow-y-auto scrollbar-hide flex flex-col relative print:shadow-none print:max-h-none print:w-full print:rounded-none my-auto">
        {/* Header - Not Printed */}
        <div className="p-6 border-b border-[#F0E6D2] flex justify-between items-center print:hidden bg-white sticky top-0 z-10">
          <div className="flex gap-2">
            <button
              onClick={() => setReceiptType("receipt")}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${receiptType === "receipt" ? "bg-black text-white" : "bg-slate-100 text-[#A09898] hover:text-slate-900"}`}
            >
              COMPROVANTE
            </button>
            <button
              onClick={() => setReceiptType("coupon")}
              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${receiptType === "coupon" ? "bg-black text-white" : "bg-slate-100 text-[#A09898] hover:text-slate-900"}`}
            >
              CUPOM
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => exportOrderReceiptPDF(order, settings)}
              className="flex items-center gap-2 px-4 py-3 bg-[#D48C8C] hover:bg-[#c37a7a] text-white rounded-xl transition-all text-xs font-bold uppercase tracking-widest"
              title="Baixar PDF"
            >
              <FileText size={18} />
              PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-widest"
              title="Imprimir"
            >
              <Printer size={18} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              className="p-3 bg-slate-50 text-[#A09898] rounded-xl hover:bg-rose-500 transition-all hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* The Receipt Content - Elegant A4 Style */}
        <div
          id="printable-receipt"
          className="p-8 md:p-12 font-sans text-slate-900 bg-white w-full max-w-[210mm] mx-auto print:p-0 print:m-0 print:max-w-none"
        >
          {/* Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1
                className="text-3xl font-bold uppercase tracking-tight"
                style={{ color: settings.theme_primary_color }}
              >
                {studioName}
              </h1>
              <p className="whitespace-pre-line text-sm text-gray-600 mt-2">
                {settings.store_address || ""}
              </p>
              <p className="text-sm text-gray-600">
                {settings.store_contact || order.contact}
              </p>
            </div>
            <div className="text-right">
              <ImageWithFallback
                src={settings.store_logo || "/logo_placeholder.png"}
                alt="Logo"
                className="w-24 h-24 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="border-t border-b border-slate-200 py-6 mb-8 flex justify-between text-sm">
            <div>
              <p className="text-gray-500 uppercase font-bold text-xs mb-1">
                Pedido
              </p>
              <p className="font-bold text-lg">{order.code}</p>
            </div>
            <div>
              <p className="text-gray-500 uppercase font-bold text-xs mb-1">
                Data
              </p>
              <p className="font-bold text-lg">
                {safeFormat(new Date(), "dd/MM/yyyy")}
              </p>
            </div>
            <div>
              <p className="text-gray-500 uppercase font-bold text-xs mb-1">
                Entrega
              </p>
              <p className="font-bold text-lg">
                {order.deliveryDate
                  ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy")
                  : "A Combinar"}
              </p>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-10 text-sm">
            <p className="text-gray-500 uppercase font-bold text-xs mb-1">
              Cliente
            </p>
            <p className="font-bold text-lg">{order.customerName}</p>
            <p className="text-gray-600">{order.contact}</p>
          </div>

          {/* Items Table */}
          <table className="w-full mb-12">
            <thead className="border-b border-gray-300 text-xs text-gray-500 uppercase tracking-wider">
              <tr className="text-left">
                <th className="py-3">Produto</th>
                <th className="py-3 text-center">Qtd</th>
                <th className="py-3">Detalhes</th>
                <th className="py-3 text-right">Unitário</th>
                <th className="py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {order.items?.map((item, idx) => (
                <tr
                  key={`receipt-item-${order.id || "ord"}-${item.id || item.product_name}-${idx}`}
                  className="border-b border-gray-50"
                >
                  <td className="py-4 font-bold">{item.product_name}</td>
                  <td className="py-4 text-center">{item.quantity}</td>
                  <td className="py-4 text-gray-500 italic text-xs">
                    Personalizado
                  </td>
                  <td className="py-4 text-right">
                    R$ {(item.retail_price || 0).toFixed(2)}
                  </td>
                  <td className="py-4 text-right font-bold">
                    R${" "}
                    {((item.retail_price || 0) * (item.quantity || 1)).toFixed(
                      2,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="flex justify-end mb-12">
            <div className="w-64 space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Frete</span>
                <span>R$ {order.shippingCost?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex justify-between font-bold text-xl pt-3 border-t border-slate-200">
                <span>Total</span>
                <span>R$ {order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Area */}
          <div className="text-gray-500 text-xs mt-auto">
            <p className="font-bold mb-2 uppercase">
              Observações e Informações Importantes
            </p>
            <p className="mb-4 whitespace-pre-wrap">
              {order.observations || "Nenhuma observação."}
            </p>
            <p className="italic">{settings.receipt_footer || ""}</p>
          </div>
        </div>

        {/* Footer for desktop view - Not Printed */}
        <div className="p-8 bg-slate-50 border-t border-[#F0E6D2] print:hidden text-center">
          <p className="text-[10px] text-[#A09898] font-bold uppercase tracking-widest">
            Sistema de Gestão Ateliê © 2025
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          /* Hide everything except the printable receipt */
          body > :not(.fixed) { display: none !important; }
          .fixed > :not(.bg-white) { display: none !important; }
          .fixed { position: static !important; inset: auto !important; width: 100% !important; background: transparent !important; }
          .fixed .bg-white { position: static !important; width: 100% !important; max-width: none !important; height: auto !important; max-height: none !important; margin: 0 !important; box-shadow: none !important; border: none !important; border-radius: 0 !important; }
          .print\:hidden { display: none !important; }
          
          #printable-receipt {
            visibility: visible !important;
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
          }
          
          @page {
            margin: 10mm;
            size: auto;
          }
        }
      `,
        }}
      />
    </div>
  );
};
