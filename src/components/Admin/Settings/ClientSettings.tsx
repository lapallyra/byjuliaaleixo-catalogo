import React, { useState, useEffect } from "react";
import { Users, Smartphone, ShieldAlert, Edit3, AlertCircle, Save, Loader2, Check } from "lucide-react";
import { CompanyId, CrmSettings } from "../../../types";
import { getCrmSettings, saveCrmSettings } from "../../../services/firebaseService";

export const ClientSettings: React.FC<{ companyId: CompanyId }> = ({ companyId }) => {
  const [settings, setSettings] = useState<CrmSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      const data = await getCrmSettings(companyId);
      setSettings(data);
      setLoading(false);
    };
    loadSettings();
  }, [companyId]);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await saveCrmSettings(companyId, settings);
      setShowFeedback(true);
      setTimeout(() => setShowFeedback(false), 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#1C1C1E]" /></div>;
  }

  if (!settings) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100/50 text-blue-600">
            <Users size={22} />
          </div>
          <h3 className="text-lg font-medium text-[#1C1C1E] tracking-normal">Configurações de Clientes</h3>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-[#1C1C1E] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : showFeedback ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : showFeedback ? "Salvo" : "Salvar Alterações"}
        </button>
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
               <input type="checkbox" className="sr-only peer" checked={settings.usePhoneId} onChange={() => setSettings({...settings, usePhoneId: !settings.usePhoneId})} />
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
               <input type="checkbox" className="sr-only peer" checked={settings.requireCpf} onChange={() => setSettings({...settings, requireCpf: !settings.requireCpf})} />
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
               <input type="checkbox" className="sr-only peer" checked={settings.alertIncomplete} onChange={() => setSettings({...settings, alertIncomplete: !settings.alertIncomplete})} />
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
               <input type="checkbox" className="sr-only peer" checked={settings.allowEditCheckout} onChange={() => setSettings({...settings, allowEditCheckout: !settings.allowEditCheckout})} />
               <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1C1C1E]"></div>
             </label>
          </div>
        </div>
      </div>
    </div>
  );
};
