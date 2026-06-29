import React, { useState } from "react";
import { Bell, ShoppingBag, CheckCircle2, MessageSquare, CreditCard, UserX } from "lucide-react";

export const NotificationSettings: React.FC = () => {
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyApproved, setNotifyApproved] = useState(true);
  const [notifyAdjustments, setNotifyAdjustments] = useState(true);
  const [notifyPayment, setNotifyPayment] = useState(true);
  const [notifyIncompleteClient, setNotifyIncompleteClient] = useState(true);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <ShoppingBag size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Novo Pedido</p>
               <p className="text-xs text-[#8E8E93]">Notificar quando um novo pedido for criado.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={notifyNewOrder} onChange={() => setNotifyNewOrder(!notifyNewOrder)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <CheckCircle2 size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Pedido Aprovado</p>
               <p className="text-xs text-[#8E8E93]">Aviso quando o cliente aprovar as artes.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={notifyApproved} onChange={() => setNotifyApproved(!notifyApproved)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <MessageSquare size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Solicitação de Ajustes</p>
               <p className="text-xs text-[#8E8E93]">Alerta quando houver pedido de mudança na arte.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={notifyAdjustments} onChange={() => setNotifyAdjustments(!notifyAdjustments)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <CreditCard size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Pagamento Aprovado</p>
               <p className="text-xs text-[#8E8E93]">Notificação de sucesso no pagamento.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={notifyPayment} onChange={() => setNotifyPayment(!notifyPayment)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
          
          <div className="flex items-center gap-3">
             <UserX size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Cadastro de Cliente Incompleto</p>
               <p className="text-xs text-[#8E8E93]">Alertar se faltar dados como CPF/CNPJ.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={notifyIncompleteClient} onChange={() => setNotifyIncompleteClient(!notifyIncompleteClient)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
