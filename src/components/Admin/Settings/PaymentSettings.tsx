import React, { useState } from "react";
import { CreditCard, QrCode, Webhook, RefreshCcw, Activity } from "lucide-react";

export const PaymentSettings: React.FC = () => {
  const [mercadoPago, setMercadoPago] = useState(true);
  const [pix, setPix] = useState(true);
  const [environment, setEnvironment] = useState("sandbox");
  const [webhooks, setWebhooks] = useState(true);
  const [autoUpdate, setAutoUpdate] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-emerald-100/50 text-emerald-600">
          <CreditCard size={22} />
        </div>
        <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações de Pagamento</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <CreditCard size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Mercado Pago</p>
               <p className="text-xs text-[#8E8E93]">Aceitar cartões de crédito via Mercado Pago.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={mercadoPago} onChange={() => setMercadoPago(!mercadoPago)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <QrCode size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Pagamento via PIX</p>
               <p className="text-xs text-[#8E8E93]">Gerar QR Code automático no checkout.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={pix} onChange={() => setPix(!pix)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#E5E5EA] pb-4">
             <div className="flex items-center gap-3">
               <Activity size={20} className="text-[#8E8E93]" />
               <p className="text-sm font-semibold text-[#1C1C1E]">Ambiente de Execução</p>
             </div>
             <div className="flex gap-4 mt-2">
                <label className={`flex-1 border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${environment === 'sandbox' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-[#E5E5EA] hover:bg-[#F5F5F7]'}`}>
                    <input type="radio" name="env" value="sandbox" checked={environment === 'sandbox'} onChange={(e) => setEnvironment(e.target.value)} className="hidden" />
                    <span className="text-sm font-bold">Sandbox</span>
                </label>
                <label className={`flex-1 border rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer transition-all ${environment === 'production' ? 'border-[#34C759] bg-green-50 text-green-700' : 'border-[#E5E5EA] hover:bg-[#F5F5F7]'}`}>
                    <input type="radio" name="env" value="production" checked={environment === 'production'} onChange={(e) => setEnvironment(e.target.value)} className="hidden" />
                    <span className="text-sm font-bold">Produção</span>
                </label>
             </div>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Webhook size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Webhooks Ativos</p>
               <p className="text-xs text-[#8E8E93]">Receber notificações do Mercado Pago.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={webhooks} onChange={() => setWebhooks(!webhooks)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3">
             <RefreshCcw size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Atualização Automática</p>
               <p className="text-xs text-[#8E8E93]">Mudar status do pedido quando pago.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={autoUpdate} onChange={() => setAutoUpdate(!autoUpdate)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
