import React, { useState, useMemo, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Box, 
  Tag, 
  DollarSign, 
  Calculator, 
  Layers, 
  Clock, 
  Info, 
  Maximize2, 
  Weight, 
  Layout, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Image as ImageIcon
} from "lucide-react";
import { Product, Componente, CompanyId, Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { calculateProductCost } from "../../lib/finance";
import { motion, AnimatePresence } from "motion/react";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { ImageUpload } from "./ImageUpload";

interface NewProductFormProps {
  companyId: CompanyId;
  components: Componente[];
  onSave: (productData: any) => Promise<void>;
  onClose: () => void;
  existingProducts: Product[];
  editingProduct?: Partial<Product> | null;
}

export const NewProductForm: React.FC<NewProductFormProps> = ({ 
  companyId, 
  components, 
  onSave, 
  onClose,
  existingProducts,
  editingProduct
}) => {
  const orchestrator = useAdminOrchestrator();
  const [activeSection, setActiveSection] = useState<number>(1);
  const [formData, setFormData] = useState({
    name: editingProduct?.product_name || "",
    code: editingProduct?.code || "",
    category: editingProduct?.category || "",
    type: (editingProduct as any)?.type || "fabricado" as "fabricado" | "kit" | "revenda" | "digital" | "servico",
    price: editingProduct?.retail_price || 0,
    original_price: editingProduct?.original_price || 0,
    isVisible: editingProduct?.isVisible ?? true,
    image: editingProduct?.image || "",
    description: editingProduct?.description || "",
    productionTime: editingProduct?.productionTime || 5,
    weight: editingProduct?.weight || 0,
    dimensions: {
      length: editingProduct?.dimensions?.length || 0,
      width: editingProduct?.dimensions?.width || 0,
      height: editingProduct?.dimensions?.height || 0
    },
    insumos: editingProduct?.insumos?.map(i => {
      const comp = components.find(c => c.id === i.insumoId);
      return { insumoId: i.insumoId, quantity: i.quantity, unit: comp?.unit || "unid" };
    }) || [] as { insumoId: string; quantity: number; unit: string }[]
  });

  const [loading, setLoading] = useState(false);

  const generateCode = (category: string): string => {
    if (formData.code) return formData.code;
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const sequence = Math.floor(1000 + Math.random() * 9000);
    return `${categoryPrefix}${sequence}`;
  };

  const estimatedCost = useMemo(() => {
    const tempProduct = { ...editingProduct, insumos: formData.insumos } as Product;
    return calculateProductCost(tempProduct, components);
  }, [formData.insumos, components, editingProduct]);

  const profit = formData.price - estimatedCost;
  const margin = formData.price > 0 ? (profit / formData.price) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Nome e Categoria são obrigatórios!",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Aviso' }
    });
      return;
    }

    setLoading(true);
    try {
      const code = generateCode(formData.category);
      await onSave({
        ...editingProduct,
        product_name: formData.name,
        category: formData.category,
        retail_price: formData.price,
        original_price: formData.original_price,
        isVisible: formData.isVisible,
        image: formData.image,
        description: formData.description,
        productionTime: formData.productionTime,
        weight: formData.weight,
        dimensions: formData.dimensions,
        code,
        company: companyId,
        type: formData.type,
        insumos: formData.insumos.map(i => ({ insumoId: i.insumoId, quantity: i.quantity }))
      });
      onClose();
    } catch (error) {
      console.error(error);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar produto.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    } finally {
      setLoading(false);
    }
  };

  const addInsumo = () => {
    setFormData(prev => ({
        ...prev,
        insumos: [...prev.insumos, { insumoId: components[0]?.id || "", quantity: 1, unit: components[0]?.unit || "unid" }]
    }));
  };

  const removeInsumo = (index: number) => {
    setFormData(prev => ({
        ...prev,
        insumos: prev.insumos.filter((_, i) => i !== index)
    }));
  };

  const updateInsumo = (index: number, field: string, value: any) => {
    setFormData(prev => {
        const newInsumos = [...prev.insumos];
        newInsumos[index] = { ...newInsumos[index], [field]: value };
        if (field === "insumoId") {
            const comp = components.find(c => c.id === value);
            if (comp) newInsumos[index].unit = comp.unit;
        }
        return { ...prev, insumos: newInsumos };
    });
  };

  const sections = [
    { id: 1, label: "Identificação", icon: <Tag size={14} /> },
    { id: 2, label: "Comercial", icon: <DollarSign size={14} /> },
    { id: 3, label: "Produção", icon: <Layout size={14} /> },
    { id: 4, label: "Informações Adicionais", icon: <Info size={14} /> }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[160] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#F5F5F7] rounded-[2.5rem] w-full max-w-4xl shadow-3d-deep overflow-hidden flex flex-col max-h-[90vh] border border-[#E5E5EA] elevated-3d"
      >
        {/* Header */}
        <div className="px-8 py-6 bg-white border-b border-[#E5E5EA] flex justify-between items-center relative z-10 shadow-3d-soft">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#1C1C1E] text-white flex items-center justify-center shadow-3d-soft elevated-3d">
                <Box size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-base font-black text-[#1C1C1E] uppercase tracking-widest">{editingProduct ? "Editar Produto" : "Novo Produto"}</h2>
                <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">Configuração Avançada de Item</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] hover:text-[#1C1C1E] transition-all border border-transparent hover:border-[#E5E5EA]">
              <X size={20} strokeWidth={3} />
            </button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Nav */}
          <div className="w-64 bg-white border-r border-[#E5E5EA] p-6 space-y-2 shrink-0">
            {sections.map(section => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeSection === section.id 
                    ? 'bg-[#1C1C1E] text-white shadow-3d-soft elevated-3d' 
                    : 'text-[#8E8E93] hover:bg-[#F5F5F7] hover:text-[#1C1C1E]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {section.icon}
                  {section.label}
                </div>
                <ChevronRight size={12} className={activeSection === section.id ? "opacity-100" : "opacity-0"} />
              </button>
            ))}

            <div className="mt-10 p-6 bg-[#1C1C1E] rounded-[2rem] text-white space-y-4 shadow-3d-soft elevated-3d">
               <div className="flex items-center gap-2 text-indigo-400">
                 <Zap size={14} fill="currentColor" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Resumo Comercial</span>
               </div>
               <div className="space-y-1">
                 <span className="text-[8px] font-bold text-white/40 uppercase">Preço Venda</span>
                 <p className="text-base font-black tracking-tighter">{formatCurrency(formData.price)}</p>
               </div>
               <div className="space-y-1">
                 <span className="text-[8px] font-bold text-white/40 uppercase">Margem Operacional</span>
                 <p className={`text-sm font-black ${margin > 30 ? 'text-emerald-400' : 'text-rose-400'}`}>{Math.round(margin)}%</p>
               </div>
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-10 scrollbar-hide">
            <AnimatePresence mode="wait">
              {activeSection === 1 && (
                <motion.div 
                  key="sec1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Identificação do Produto</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Imagem do Produto</label>
                      <ImageUpload 
                        label="Upload de Imagem"
                        path={`products/${companyId}`}
                        currentUrl={formData.image}
                        onUploadComplete={(url) => setFormData({...formData, image: url})}
                        onRemove={() => setFormData({...formData, image: ""})}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Nome do Produto *</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Planner Anual 2024" className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Código Interno / SKU</label>
                      <input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Automático" className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Categoria *</label>
                      <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="Ex: Papelaria" className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Tipo de Produto *</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["fabricado", "kit", "revenda", "digital", "servico"].map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setFormData({...formData, type: t as any})}
                            className={`p-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                              formData.type === t 
                                ? 'bg-[#1C1C1E] text-white border-[#1C1C1E] shadow-3d-soft elevated-3d' 
                                : 'bg-white text-[#8E8E93] border-[#E5E5EA] hover:border-[#1C1C1E]/20'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 2 && (
                <motion.div 
                  key="sec2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Posicionamento Comercial</h3>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Preço de Venda (R$)</label>
                        <input type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xl font-black text-[#1C1C1E] font-mono outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Preço Promocional / Original (R$)</label>
                        <input type="number" step="0.01" value={formData.original_price} onChange={e => setFormData({...formData, original_price: Number(e.target.value)})} className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-sm font-bold text-[#AEAEB2] font-mono outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-white border border-[#E5E5EA] rounded-2xl shadow-3d-soft elevated-3d">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-[#1C1C1E] uppercase tracking-widest">Produto Ativo</p>
                          <p className="text-[8px] font-bold text-[#8E8E93] uppercase mt-0.5">Visível no catálogo principal</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setFormData({...formData, isVisible: !formData.isVisible})}
                          className={`w-12 h-6 rounded-full relative transition-all ${formData.isVisible ? 'bg-emerald-500' : 'bg-[#AEAEB2]'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formData.isVisible ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-[#1C1C1E] rounded-[2.5rem] p-8 text-white space-y-8 shadow-3d-deep elevated-3d relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-indigo-400">
                          <TrendingUp size={20} />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Cálculos em Tempo Real</h4>
                      </div>

                      <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Custo Estimado</span>
                          <span className="text-sm font-black tracking-tight">{formatCurrency(estimatedCost)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-3">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Lucro Bruto</span>
                          <span className="text-xl font-black text-emerald-400 tracking-tighter">{formatCurrency(profit)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Margem (%)</span>
                          <span className={`text-xl font-black tracking-tighter ${margin > 30 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {Math.round(margin)}%
                          </span>
                        </div>
                      </div>

                      <p className="text-[8px] font-bold text-white/20 uppercase tracking-[0.2em] text-center italic">
                        Os valores são atualizados automaticamente <br/> conforme a ficha técnica é editada.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 3 && (
                <motion.div 
                  key="sec3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-8"
                >
                  <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-3">
                    <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em]">Ficha Técnica e Composição</h3>
                    <button 
                      type="button" 
                      onClick={addInsumo} 
                      className="flex items-center gap-2 bg-[#1C1C1E] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-3d-soft elevated-3d hover:bg-black transition-all"
                    >
                      <Plus size={14} strokeWidth={3} /> Adicionar Item
                    </button>
                  </div>

                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] overflow-hidden shadow-3d-soft elevated-3d">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[#F5F5F7] border-b border-[#E5E5EA]">
                          <th className="px-6 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Componente</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-center">Quantidade</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest">Unidade</th>
                          <th className="px-6 py-4 text-[9px] font-black text-[#8E8E93] uppercase tracking-widest text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F5F5F7]">
                        {formData.insumos.length > 0 ? (
                          formData.insumos.map((item, index) => (
                            <tr key={index} className="hover:bg-[#FAFAFA] transition-colors">
                              <td className="px-6 py-4">
                                <select 
                                  className="w-full bg-white border border-[#E5E5EA] rounded-xl p-2.5 text-[11px] font-black text-[#1C1C1E] uppercase tracking-tight outline-none focus:border-[#1C1C1E]/20 shadow-xs" 
                                  value={item.insumoId} 
                                  onChange={e => updateInsumo(index, "insumoId", e.target.value)}
                                >
                                  {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <input 
                                  type="number" 
                                  className="w-20 bg-white border border-[#E5E5EA] rounded-xl p-2.5 text-[11px] font-black text-[#1C1C1E] text-center outline-none focus:border-[#1C1C1E]/20 shadow-xs" 
                                  value={item.quantity} 
                                  onChange={e => updateInsumo(index, "quantity", Number(e.target.value))}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-[10px] font-black text-[#AEAEB2] uppercase tracking-widest">{item.unit}</span>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button 
                                  type="button" 
                                  onClick={() => removeInsumo(index)} 
                                  className="p-2.5 text-[#AEAEB2] hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-12 text-center text-[#AEAEB2]">
                               <div className="flex flex-col items-center gap-3">
                                 <AlertTriangle size={32} strokeWidth={1} />
                                 <p className="text-[10px] font-black uppercase tracking-widest">Nenhum componente na ficha técnica</p>
                               </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}

              {activeSection === 4 && (
                <motion.div 
                  key="sec4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <h3 className="text-xs font-black text-[#1C1C1E] uppercase tracking-[0.3em] border-b border-[#E5E5EA] pb-3">Informações de Suporte</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1">Observações Internas</label>
                      <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Instruções de embalagem, cuidados especiais..." rows={3} className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1 flex items-center gap-1.5"><Clock size={10} /> Tempo Médio Produção (dias)</label>
                      <input type="number" value={formData.productionTime} onChange={e => setFormData({...formData, productionTime: Number(e.target.value)})} className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-[#8E8E93] uppercase tracking-widest ml-1 flex items-center gap-1.5"><Weight size={10} /> Peso Estimado (g)</label>
                      <input type="number" value={formData.weight} onChange={e => setFormData({...formData, weight: Number(e.target.value)})} className="w-full bg-white border border-[#E5E5EA] rounded-2xl p-4 text-xs font-bold text-[#1C1C1E] outline-none focus:border-[#1C1C1E]/20 shadow-inner transition-all"/>
                    </div>
                    
                    <div className="col-span-2 p-6 bg-white border border-[#E5E5EA] rounded-[2rem] shadow-3d-soft elevated-3d">
                       <div className="flex items-center gap-2 mb-6">
                         <Maximize2 size={14} className="text-[#8E8E93]" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">Dimensões do Produto (cm)</span>
                       </div>
                       <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-bold text-[#AEAEB2] uppercase ml-1">Comprimento</span>
                            <input type="number" value={formData.dimensions.length} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions, length: Number(e.target.value)}})} className="w-full bg-[#F5F5F7] border border-transparent rounded-xl p-3 text-xs font-black text-[#1C1C1E] text-center outline-none focus:bg-white focus:border-[#1C1C1E]/20 shadow-inner"/>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-bold text-[#AEAEB2] uppercase ml-1">Largura</span>
                            <input type="number" value={formData.dimensions.width} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions, width: Number(e.target.value)}})} className="w-full bg-[#F5F5F7] border border-transparent rounded-xl p-3 text-xs font-black text-[#1C1C1E] text-center outline-none focus:bg-white focus:border-[#1C1C1E]/20 shadow-inner"/>
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-[8px] font-bold text-[#AEAEB2] uppercase ml-1">Altura</span>
                            <input type="number" value={formData.dimensions.height} onChange={e => setFormData({...formData, dimensions: {...formData.dimensions, height: Number(e.target.value)}})} className="w-full bg-[#F5F5F7] border border-transparent rounded-xl p-3 text-xs font-black text-[#1C1C1E] text-center outline-none focus:bg-white focus:border-[#1C1C1E]/20 shadow-inner"/>
                          </div>
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 bg-white border-t border-[#E5E5EA] flex justify-between items-center relative z-10 shadow-3d-soft">
           <button 
             type="button" 
             onClick={onClose}
             className="px-8 py-4 bg-[#F5F5F7] text-[#8E8E93] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#E5E5EA] transition-all"
           >
             Descartar
           </button>

           <div className="flex gap-4">
             {activeSection > 1 && (
               <button 
                 type="button" 
                 onClick={() => setActiveSection(s => s - 1)}
                 className="px-6 py-4 border border-[#E5E5EA] text-[#1C1C1E] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#F5F5F7] transition-all"
               >
                 Anterior
               </button>
             )}
             
             {activeSection < 4 ? (
               <button 
                 type="button" 
                 onClick={() => setActiveSection(s => s + 1)}
                 className="px-10 py-4 bg-[#1C1C1E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black shadow-3d-soft elevated-3d transition-all flex items-center gap-2"
               >
                 Próximo Passo <ChevronRight size={14} strokeWidth={3} />
               </button>
             ) : (
               <button 
                 disabled={loading} 
                 type="submit" 
                 onClick={handleSubmit}
                 className="px-12 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-3d-deep elevated-3d transition-all flex items-center gap-2"
               >
                {loading ? "Processando..." : editingProduct ? "Salvar Alterações" : "Confirmar Cadastro"}
               </button>
             )}
           </div>
        </div>
      </motion.div>
    </div>
  );
};
