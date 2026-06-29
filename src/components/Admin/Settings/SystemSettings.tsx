import React, { useState } from "react";
import { Settings, Database, Server, Download, Key, ShieldCheck } from "lucide-react";

export const SystemSettings: React.FC = () => {
  const [autoBackup, setAutoBackup] = useState(true);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
          <Settings size={22} />
        </div>
        <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações do Sistema</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Database size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Backup Automático</p>
               <p className="text-xs text-[#8E8E93]">Gerar backup de dados diariamente.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={autoBackup} onChange={() => setAutoBackup(!autoBackup)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#E5E5EA] pb-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Server size={20} className="text-[#8E8E93]" />
                   <div>
                     <p className="text-sm font-semibold text-[#1C1C1E]">Backup Manual</p>
                     <p className="text-xs text-[#8E8E93]">Forçar snapshot de dados agora.</p>
                   </div>
                </div>
                <button className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold rounded-xl transition-colors">Executar Backup</button>
             </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#E5E5EA] pb-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Download size={20} className="text-[#8E8E93]" />
                   <div>
                     <p className="text-sm font-semibold text-[#1C1C1E]">Exportação de Dados</p>
                     <p className="text-xs text-[#8E8E93]">Exportar banco de dados completo (JSON/CSV).</p>
                   </div>
                </div>
                <button className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold rounded-xl transition-colors">Exportar Tudo</button>
             </div>
          </div>

          <div className="flex flex-col gap-3 border-b border-[#E5E5EA] pb-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <Key size={20} className="text-[#8E8E93]" />
                   <div>
                     <p className="text-sm font-semibold text-[#1C1C1E]">Histórico de Logs</p>
                     <p className="text-xs text-[#8E8E93]">Acessar registros de atividade do sistema.</p>
                   </div>
                </div>
                <button className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1C1C1E] text-xs font-bold rounded-xl transition-colors">Ver Logs</button>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <ShieldCheck size={20} className="text-indigo-500" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-indigo-900">Permissões de Usuários</p>
               <p className="text-xs text-indigo-600/70">Estrutura preparada para futuros módulos de acesso.</p>
             </div>
             <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">Em Breve</span>
          </div>
        </div>
      </div>
    </div>
  );
};
