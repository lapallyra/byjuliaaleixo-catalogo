import React, { useState } from "react";
import { Users, Smartphone, ShieldAlert, Edit3, AlertCircle } from "lucide-react";

export const ClientSettings: React.FC = () => {
  const [usePhoneId, setUsePhoneId] = useState(true);
  const [requireCpf, setRequireCpf] = useState(true);
  const [alertIncomplete, setAlertIncomplete] = useState(true);
  const [allowEdit, setAllowEdit] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
          <Users size={22} />
        </div>
        <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações de Clientes</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Smartphone size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Identificador Principal</p>
               <p className="text-xs text-[#8E8E93]">Usar telefone como chave única de cadastro.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={usePhoneId} onChange={() => setUsePhoneId(!usePhoneId)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
          
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <ShieldAlert size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">CPF/CNPJ Obrigatório</p>
               <p className="text-xs text-[#8E8E93]">Exigir documento para finalização de pedido.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={requireCpf} onChange={() => setRequireCpf(!requireCpf)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <AlertCircle size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Alerta de Cadastro Incompleto</p>
               <p className="text-xs text-[#8E8E93] flex items-center gap-1">Exibir <span className="inline-flex items-center text-amber-500 gap-1 font-medium"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> LED Laranja</span> para pendências.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={alertIncomplete} onChange={() => setAlertIncomplete(!alertIncomplete)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3">
             <Edit3 size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Permitir Edição pelo Cliente</p>
               <p className="text-xs text-[#8E8E93]">Clientes podem editar seus dados no checkout.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={allowEdit} onChange={() => setAllowEdit(!allowEdit)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
