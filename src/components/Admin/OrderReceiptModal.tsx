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
    exportOrderReceiptPDF(order, settings);
  };

  const atelierNames: Record<string, string> = {
    pallyra: "La Pallyra",
    guennita: "com amor, Guennita",
    mimada: "Mimada Sim",
    tuttymimo: "Tutty Mimo",
  };

  const studioName =
    settings.store_name || atelierNames[order.companyId] || "Ateliê";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-transparent overflow-y-auto">
      {/* Printable Area */}
      <div className="bg-white w-full max-w-screen-lg max-h-[90vh] md:max-h-[95vh] rounded-[2rem] shadow-2xl overflow-y-auto scrollbar-hide flex flex-col relative print:shadow-none print:max-h-none print:w-full print:rounded-none my-auto">
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
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all text-xs font-bold uppercase tracking-widest"
              title="Abrir PDF"
            >
              <Printer size={18} />
              Abrir PDF
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

          <div className="flex flex-col gap-6 py-8 border-y border-slate-100 mb-10">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Código do Pedido</label>
              <div className="text-xl font-black text-slate-900 tracking-tighter italic">#{order.code}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Data de Emissão</label>
              <div className="text-xl font-black text-slate-900 tracking-tighter">{safeFormat(new Date(), "dd/MM/yyyy")}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Previsão de Entrega</label>
              <div className="text-xl font-black text-[#D88D85] tracking-tighter">
                {order.deliveryDate
                  ? safeFormatISO(order.deliveryDate, "dd/MM/yyyy")
                  : "A Combinar"}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="mb-12 flex flex-col gap-6 bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Cliente / Comprador</label>
              <div className="text-xl font-black text-slate-900 uppercase tracking-tight">{order.customerName}</div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Canal de Contato</label>
              <div className="text-xl font-black text-slate-600 truncate">{order.contact}</div>
            </div>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-4 mb-12">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-gray-300 pb-2">Itens do Pedido</h3>
            {order.items?.map((item, idx) => (
              <div 
                key={`receipt-item-${order.id || "ord"}-${item.id || item.product_name}-${idx}`}
                className="flex flex-col gap-2 p-4 bg-white border border-slate-100 rounded-xl"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Produto</label>
                  <div className="text-[14px] font-bold text-slate-800 uppercase leading-snug">{item.product_name}</div>
                </div>
                
                <div className="text-xs text-gray-600 mt-1 mb-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Detalhes / Personalização</span>
                  {(item as any).selectedVariation && <p className="mb-0.5"><strong>Opção:</strong> {(item as any).selectedVariation}</p>}
                  {(item as any).customName && <p className="mb-0.5"><strong>Nome:</strong> {(item as any).customName}</p>}
                  {(item as any).customPhrase && <p className="mb-0.5"><strong>Frase:</strong> {(item as any).customPhrase}</p>}
                  {(item as any).customFile && (
                    <p className="mb-0.5">
                      <strong>Img/Anexo:</strong>{" "}
                      <a href={(item as any).customFile} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-bold">
                        [Ver Arquivo]
                      </a>
                    </p>
                  )}
                  {(item as any).customNotes && <p className="mb-0.5 text-neutral-500 italic"><strong>Obs:</strong> {(item as any).customNotes}</p>}
                  {!((item as any).selectedVariation || (item as any).customName || (item as any).customPhrase || (item as any).customFile || (item as any).customNotes) && (
                    <span className="text-gray-400 italic">Padrão</span>
                  )}
                </div>

                <div className="flex gap-6 border-t border-slate-50 pt-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Qtd</label>
                    <div className="text-[14px] font-bold text-slate-600">{item.quantity}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Unitário</label>
                    <div className="text-[14px] text-slate-500 font-mono">R$ {(item.retail_price || 0).toFixed(2)}</div>
                  </div>
                  <div className="space-y-1 ml-auto text-right">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total do Item</label>
                    <div className="text-[14px] font-bold text-slate-800 font-mono">R$ {((item.retail_price || 0) * (item.quantity || 1)).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-6 mb-12 bg-slate-50 border border-slate-100 p-6 rounded-2xl items-end">
            <div className="w-full md:w-64 flex flex-col gap-6 text-right font-sans">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Subtotal</label>
                <div className="text-[15px] font-black text-slate-700 font-mono">R$ {order.total.toFixed(2)}</div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Frete / Entrega</label>
                <div className="text-[15px] font-black text-slate-700 font-mono">R$ {order.shippingCost?.toFixed(2) || "0.00"}</div>
              </div>

              <div className="space-y-1 pt-6 border-t border-slate-200">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Total Geral</label>
                <div className="text-2xl font-black text-slate-900 font-mono">R$ {order.total.toFixed(2)}</div>
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
