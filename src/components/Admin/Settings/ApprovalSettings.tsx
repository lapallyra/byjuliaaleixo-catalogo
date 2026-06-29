import React, { useState } from "react";
import { CheckCircle2, Lock, History, MessageSquare } from "lucide-react";

export const ApprovalSettings: React.FC = () => {
  const [approvalFlow, setApprovalFlow] = useState(true);
  const [allowAdjustments, setAllowAdjustments] = useState(true);
  const [lockAfterApproval, setLockAfterApproval] = useState(true);
  const [versionHistory, setVersionHistory] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
          <CheckCircle2 size={22} />
        </div>
        <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações de Aprovação</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <CheckCircle2 size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Ativar Fluxo de Aprovação</p>
               <p className="text-xs text-[#8E8E93]">Exigir aprovação do cliente antes do checkout.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={approvalFlow} onChange={() => setApprovalFlow(!approvalFlow)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <MessageSquare size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Permitir Solicitação de Ajustes</p>
               <p className="text-xs text-[#8E8E93]">Clientes podem pedir mudanças no pedido.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={allowAdjustments} onChange={() => setAllowAdjustments(!allowAdjustments)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Lock size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Travar Pedido Após Aprovação</p>
               <p className="text-xs text-[#8E8E93]">Impedir edições após o cliente aprovar a arte.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={lockAfterApproval} onChange={() => setLockAfterApproval(!lockAfterApproval)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3">
             <History size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Ativar Histórico de Versões</p>
               <p className="text-xs text-[#8E8E93]">Salvar cada versão do pedido alterada.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={versionHistory} onChange={() => setVersionHistory(!versionHistory)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
