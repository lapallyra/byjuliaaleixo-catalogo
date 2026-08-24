import React, { useState, useEffect } from "react";
import { X, Save, DollarSign, Package, Percent, ChevronRight, ChevronLeft, MapPin, Tag, Box, Info } from "lucide-react";
import { Componente, CompanyId } from "../../types";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface InsumoFormModalProps {
  companyId: CompanyId;
  editing: Partial<Componente> | null;
  onClose: () => void;
  onSave: (data: Partial<Componente>) => Promise<void>;
}

export const InsumoFormModal: React.FC<InsumoFormModalProps> = ({
  companyId,
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
      companyId: companyId,
      data: { success: false, title: 'Erro' }
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
      companyId: companyId,
      data: { success: false, title: 'Erro' }
    });
      return;
    }
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-all animate-fade-in">
      <div 
        className="bg-white rounded-[22px] w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-pink-100/40 animate-scale-up"
        id="insumo-form-modal"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-400 to-pink-500 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <Package size={22} className="text-pink-100" />
              {editing?.id ? "Editar Item de Estoque" : "Novo Item de Estoque"}
            </h2>
            <p className="text-pink-50/90 text-xs mt-1 font-semibold">
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
        <div className="px-6 py-4 bg-pink-50/10 border-b border-pink-100/20 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 w-full">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step === s
                        ? "bg-pink-500 text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]"
                        : step > s
                        ? "bg-emerald-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {s}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      step === s ? "text-pink-500" : "text-gray-400"
                    }`}
                  >
                    {s === 1 ? "Identificação" : s === 2 ? "Controle" : "Custo"}
                  </span>
                </div>
                {s < 3 && <div className="flex-1 h-[2px] bg-pink-100/20 mx-2" />}
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
              <div className="bg-pink-50/10 p-5 rounded-[18px] border border-pink-100/20 space-y-4">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  Tipo de Item (Selecione ou clique no botão)
                </label>
                
                {/* Segments */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, classification: "insumo", category: prev.category || "Consumível" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.classification === "insumo"
                        ? "border-pink-300 bg-white shadow-md shadow-pink-500/5"
                        : "border-pink-100/30 bg-pink-50/5 hover:border-pink-200"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.classification === "insumo" ? "bg-pink-50 text-pink-500" : "bg-gray-100 text-gray-500"}`}>
                      <Percent size={18} />
                    </div>
                    <div>
                      <span className="block font-bold text-xs text-gray-800">Insumo</span>
                      <span className="text-[10px] text-gray-400 font-medium">Material consumível</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, classification: "componente", category: prev.category || "Físico" }))}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                      formData.classification === "componente"
                        ? "border-pink-300 bg-white shadow-md shadow-pink-500/5"
                        : "border-pink-100/30 bg-pink-50/5 hover:border-pink-200"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.classification === "componente" ? "bg-pink-50 text-pink-500" : "bg-gray-100 text-gray-500"}`}>
                      <Box size={18} />
                    </div>
                    <div>
                      <span className="block font-bold text-xs text-gray-800">Componente</span>
                      <span className="text-[10px] text-gray-400 font-medium">Parte do produto final</span>
                    </div>
                  </button>
                </div>

                {/* Single Switch representation requested */}
                <div 
                  className="flex items-center justify-between p-4 bg-white rounded-xl border border-pink-100/30 cursor-pointer"
                  onClick={() => {
                    const isComponent = formData.classification !== "componente";
                    setFormData(prev => ({
                      ...prev,
                      classification: isComponent ? "componente" : "insumo",
                      category: prev.category || (isComponent ? "Físico" : "Consumível")
                    }));
                  }}
                >
                  <div className="flex-1">
                    <span className="text-xs font-bold text-gray-700 block">Este item faz parte do produto final?</span>
                    <span className="text-[10px] text-gray-400 font-semibold">Insumo (Consumível) vs Componente (Físico)</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${formData.classification === "componente" ? "bg-emerald-500" : "bg-slate-200"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${formData.classification === "componente" ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                </div>
              </div>

              {/* Nome */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Nome do Item <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Fita de Cetim 22mm, Caixa Cartonada Rosa"
                  className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Código Interno / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: INS-001, COMP-449"
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, code: e.target.value }))
                    }
                    id="input-insumo-code"
                  />
                </div>

                {/* Categoria */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Categoria
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Embalagem, Papelaria, Aviamento"
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Unidade de Medida
                  </label>
                  <select
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E] appearance-none"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    Localização no Ateliê (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Prateleira B, Gaveta 4"
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Quantidade em Estoque (Atual)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={quantityStr}
                    onChange={(e) => setQuantityStr(e.target.value)}
                    required
                    id="input-insumo-quantity"
                  />
                </div>

                {/* Estoque mínimo */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider text-rose-600">
                    Ponto de Reposição (Estoque Mínimo)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="0"
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <DollarSign size={13} className="text-gray-400" />
                    Valor Total Pago (Investimento)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
                      value={investimentoStr}
                      onChange={(e) => setInvestimentoStr(e.target.value)}
                      required
                      id="input-insumo-investimento"
                    />
                  </div>
                </div>

                {/* Valor Unitário Calculado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Custo Unitário Calculado (Último custo)
                  </label>
                  <div className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-bold text-[#1C1C1E] flex items-center justify-between">
                    <span className="text-gray-400">R$</span>
                    <span className="font-mono text-sm text-pink-500">
                      {formData.unitCost ? formData.unitCost.toFixed(4) : "0.0000"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Custo Médio e Fornecedor Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custo Médio (pode iniciar igual ao Unitário) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Custo Médio de Aquisição
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0"
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
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
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Fornecedor Principal (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Distribuidora de Papéis, Armarinho..."
                    className="w-full p-3.5 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold focus:border-pink-300 focus:bg-white outline-none transition-all text-[#1C1C1E]"
                    value={formData.supplier || ""}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, supplier: e.target.value }))
                    }
                    id="input-insumo-supplier"
                  />
                </div>
              </div>

              {/* Informações adicionais */}
              <div className="p-4 bg-pink-50/20 rounded-[18px] border border-pink-100/10 flex gap-3 text-pink-900 text-[11px] leading-relaxed">
                <Info size={16} className="text-pink-500 shrink-0 mt-0.5" />
                <p>
                  <strong className="block font-bold mb-0.5">Cálculo de Custo Médio & Estoque:</strong>
                  Ao salvar, o sistema atualizará o custo ponderado do estoque. Estes valores serão integrados nas Fichas Técnicas dos produtos para cálculo exato de margens.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-pink-100/20 flex gap-3 shrink-0">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1C1C1E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                id="back-step-btn"
              >
                <ChevronLeft size={16} /> Voltar
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-[#1C1C1E] rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                id="cancel-insumo-btn"
              >
                Cancelar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3.5 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
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
