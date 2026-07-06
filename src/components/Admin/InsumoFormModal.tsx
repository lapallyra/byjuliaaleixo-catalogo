import React, { useState, useEffect } from "react";
import { X, Save, DollarSign, Package, Percent, ChevronRight, ChevronLeft, MapPin, Tag, Box, Info } from "lucide-react";
import { Componente } from "../../types";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface InsumoFormModalProps {
  editing: Partial<Componente> | null;
  onClose: () => void;
  onSave: (data: Partial<Componente>) => Promise<void>;
}

export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  editing,
  onClose,
  onSave,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<Partial<Componente>>({
    name: "",
    code: "",
    quantity: 0,
    unit: "unid",
    isActive: true,
    minQuantity: 0,
    category: "",
    classification: "insumo",
    investimento: 0,
    unitCost: 0,
    location: "",
    supplier: "",
    ...editing,
  });

  const [investimentoStr, setInvestimentoStr] = useState(
    editing?.investimento ? editing.investimento.toString() : "0"
  );
  const [quantityStr, setQuantityStr] = useState(
    editing?.quantity ? editing.quantity.toString() : "0"
  );

  // Update real-time calculated unitCost in Step 3 based on quantity and investment
  useEffect(() => {
    const qty = parseFloat(quantityStr) || 0;
    const inv = parseFloat(investimentoStr) || 0;
    if (qty > 0) {
      const calculatedUnitCost = Number((inv / qty).toFixed(4));
      setFormData((prev) => ({
        ...prev,
        quantity: qty,
        investimento: inv,
        unitCost: calculatedUnitCost,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        quantity: qty,
        investimento: inv,
        unitCost: prev.unitCost || 0,
      }));
    }
  }, [quantityStr, investimentoStr]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name?.trim()) {
        orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Por favor, informe o nome do item.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => (prev - 1) as any);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Por favor, informe o nome do item.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-[#E5E5EA] animate-scale-up"
        id="insumo-form-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#8E5BF5] to-[#7946E0] p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-black tracking-tight flex items-center gap-2">
              <Package size={22} className="text-[#E5D5FF]" />
              {editing?.id ? "Editar Item de Estoque" : "Novo Item de Estoque"}
            </h2>
            <p className="text-[#F5F5F7] text-xs opacity-90 mt-1 font-semibold">
              Cadastro unificado de insumos consumíveis e componentes de produtos.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-white transition-all active:scale-95"
            id="close-modal-btn"
          >
            <X size={20} />
          </button>
        </div>

        {/* Steps Progress Indicator */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 w-full">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      step === s
                        ? "bg-[#8E5BF5] text-white shadow-[0_0_12px_rgba(142,91,245,0.4)]"
                        : step > s
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {s}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      step === s ? "text-[#8E5BF5]" : "text-slate-400"
                    }`}
                  >
                    {s === 1 ? "Identificação" : s === 2 ? "Controle" : "Custo"}
                  </span>
                </div>
                {s < 3 && <div className="flex-1 h-[2px] bg-slate-200 mx-2" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: IDENTIFICAÇÃO */}
          {step === 1 && (
            <div className="space-y-5 animate-slide-in">
              {/* Type Switch / Checkbox - Single Checkbox or Gorgeous 3D Segmented Control */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Tipo de Item (Selecione ou clique no botão)
                </label>
                
                {/* Segments */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, classification: "insumo", category: prev.category || "Consumível" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.classification === "insumo"
                        ? "border-[#8E5BF5] bg-white shadow-md shadow-[#8E5BF5]/5"
                        : "border-slate-200 bg-slate-100/50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.classification === "insumo" ? "bg-[#8E5BF5]/10 text-[#8E5BF5]" : "bg-slate-200 text-slate-500"}`}>
                      <Percent size={18} />
                    </div>
                    <div>
                      <span className="block font-black text-xs text-slate-800">Insumo</span>
                      <span className="text-[10px] text-slate-400 font-medium">Material consumível</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, classification: "componente", category: prev.category || "Físico" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.classification === "componente"
                        ? "border-[#8E5BF5] bg-white shadow-md shadow-[#8E5BF5]/5"
                        : "border-slate-200 bg-slate-100/50 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.classification === "componente" ? "bg-[#8E5BF5]/10 text-[#8E5BF5]" : "bg-slate-200 text-slate-500"}`}>
                      <Box size={18} />
                    </div>
                    <div>
                      <span className="block font-black text-xs text-slate-800">Componente</span>
                      <span className="text-[10px] text-slate-400 font-medium">Parte do produto final</span>
                    </div>
                  </button>
                </div>

                {/* Single Checkbox representation requested as well */}
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-150 cursor-pointer hover:bg-slate-50/50 transition-all">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#8E5BF5] border-slate-300 rounded focus:ring-[#8E5BF5]"
                    checked={formData.classification === "componente"}
                    onChange={(e) => {
                      const isComponent = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        classification: isComponent ? "componente" : "insumo",
                        category: prev.category || (isComponent ? "Físico" : "Consumível")
                      }));
                    }}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-700">Este item faz parte do produto final (Componente)</span>
                    <span className="block text-[10px] text-slate-400 font-semibold">Deixe desmarcado se for um material consumível (Insumo)</span>
                  </div>
                </label>
              </div>

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Nome do Item <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fita de Cetim 22mm, Caixa Cartonada Rosa"
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  id="input-insumo-name"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Código interno */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Código Interno / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INS-001, COMP-449"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    id="input-insumo-code"
                  />
                </div>

                {/* Categoria */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Embalagem, Papelaria, Aviamento"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, category: e.target.value }))
                    }
                    id="input-insumo-category"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CONTROLE */}
          {step === 2 && (
            <div className="space-y-5 animate-slide-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Unidade */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Unidade de Medida
                  </label>
                  <select
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E] appearance-none"
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        unit: e.target.value as any,
                      }))
                    }
                    id="input-insumo-unit"
                  >
                    <option value="unid">un (Unidade)</option>
                    <option value="mt">m (Metro)</option>
                    <option value="kg">kg (Quilograma)</option>
                    <option value="g">g (Grama)</option>
                    <option value="ml">ml (Mililitro)</option>
                    <option value="pct">pacote (Pacote)</option>
                    <option value="cx">caixa (Caixa)</option>
                    <option value="folha">folha (Folha)</option>
                    <option value="rolo">rolo (Rolo)</option>
                    <option value="outro">outro (Outro)</option>
                  </select>
                </div>

                {/* Localização */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    Localização no Ateliê (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prateleira B, Gaveta 4"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.location || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    id="input-insumo-location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Quantidade Inicial */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quantidade em Estoque (Atual)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={quantityStr}
                    onChange={(e) => setQuantityStr(e.target.value)}
                    required
                    id="input-insumo-quantity"
                  />
                </div>

                {/* Estoque mínimo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-rose-600">
                    Ponto de Reposição (Estoque Mínimo)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minQuantity: parseFloat(e.target.value) || 0,
                      }))
                    }
                    required
                    id="input-insumo-minquantity"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CUSTO */}
          {step === 3 && (
            <div className="space-y-5 animate-slide-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Investimento (Valor Pago Total) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={13} className="text-slate-400" />
                    Valor Total Pago (Investimento)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                      value={investimentoStr}
                      onChange={(e) => setInvestimentoStr(e.target.value)}
                      required
                      id="input-insumo-investimento"
                    />
                  </div>
                </div>

                {/* Valor Unitário Calculado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Custo Unitário Calculado (Último custo)
                  </label>
                  <div className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-[#1C1C1E] flex items-center justify-between">
                    <span className="text-slate-400">R$</span>
                    <span className="font-mono text-sm text-[#8E5BF5]">
                      {formData.unitCost ? formData.unitCost.toFixed(4) : "0.0000"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custo Médio e Fornecedor Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custo Médio (pode iniciar igual ao Unitário) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Custo Médio de Aquisição
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                      value={formData.unitCost || 0}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          unitCost: parseFloat(e.target.value) || 0,
                        }))
                      }
                      id="input-insumo-averagecost"
                    />
                  </div>
                </div>

                {/* Fornecedor Principal */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Fornecedor Principal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora de Papéis, Armarinho..."
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-[#8E5BF5] focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.supplier || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                    }
                    id="input-insumo-supplier"
                  />
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/50 flex gap-3 text-emerald-800 text-[11px] leading-relaxed">
                <Info size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="block font-black mb-0.5">Cálculo de Custo Médio & Estoque:</strong>
                  Ao salvar, o sistema atualizará o custo ponderado do estoque. Estes valores serão integrados nas Fichas Técnicas dos produtos para cálculo exato de margens.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-[#E5E5EA] flex gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                id="back-step-btn"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-[#1C1C1E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                id="cancel-insumo-btn"
              >
                Cancelar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 bg-[#8E5BF5] hover:bg-[#7946E0] text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                id="next-step-btn"
              >
                Avançar <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                id="save-insumo-btn"
              >
                <Save size={16} /> Salvar Item
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
