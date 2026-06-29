import React, { useState } from "react";
import { Package, Upload, Type, Shield, Layers } from "lucide-react";

export const ProductSettings: React.FC = () => {
  const [allowUpload, setAllowUpload] = useState(true);
  const [fileLimit, setFileLimit] = useState("5");
  const [requireCustom, setRequireCustom] = useState(true);
  const [exclusiveProducts, setExclusiveProducts] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-100/50 text-purple-600">
          <Package size={22} />
        </div>
        <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações de Produtos</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#E5E5EA] shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-6">
          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Upload size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Upload Permitido</p>
               <p className="text-xs text-[#8E8E93]">Permite que clientes enviem imagens/arquivos.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={allowUpload} onChange={() => setAllowUpload(!allowUpload)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Layers size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Limite de Arquivos</p>
               <p className="text-xs text-[#8E8E93]">Máximo de arquivos por produto.</p>
             </div>
             <input type="number" min="1" max="20" className="w-16 p-2 text-center text-sm border border-[#E5E5EA] rounded-xl outline-none focus:border-[#1C1C1E]" value={fileLimit} onChange={(e) => setFileLimit(e.target.value)} />
          </div>

          <div className="flex items-center gap-3 border-b border-[#E5E5EA] pb-4">
             <Type size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Personalização Obrigatória</p>
               <p className="text-xs text-[#8E8E93]">Exige preenchimento de campos para adicionar.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={requireCustom} onChange={() => setRequireCustom(!requireCustom)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
          
          <div className="flex flex-col gap-2 border-b border-[#E5E5EA] pb-4">
             <p className="text-sm font-semibold text-[#1C1C1E]">Campos Personalizados Padrão</p>
             <div className="flex flex-wrap gap-2">
                <span className="bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-xs px-3 py-1.5 rounded-lg">Nome</span>
                <span className="bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-xs px-3 py-1.5 rounded-lg">Data</span>
                <span className="bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] text-xs px-3 py-1.5 rounded-lg">Mensagem</span>
                <span className="bg-white border border-dashed border-[#E5E5EA] text-[#8E8E93] text-xs px-3 py-1.5 rounded-lg cursor-pointer hover:border-[#1C1C1E]">+ Adicionar</span>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <Shield size={20} className="text-[#8E8E93]" />
             <div className="flex-1">
               <p className="text-sm font-semibold text-[#1C1C1E]">Produtos Exclusivos</p>
               <p className="text-xs text-[#8E8E93]">Apenas clientes cadastrados podem visualizar.</p>
             </div>
             <label className="relative inline-flex items-center cursor-pointer">
               <input type="checkbox" className="sr-only peer" checked={exclusiveProducts} onChange={() => setExclusiveProducts(!exclusiveProducts)} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
