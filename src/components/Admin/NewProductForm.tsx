import React, { useState, useMemo } from "react";
import { X, Plus, Trash2, Box } from "lucide-react";
import { Product, Componente, CompanyId } from "../../types";

interface NewProductFormProps {
  companyId: CompanyId;
  components: Componente[];
  onSave: (productData: any) => Promise<void>;
  onClose: () => void;
  existingProducts: Product[];
}

export const NewProductForm: React.FC<NewProductFormProps> = ({ 
  companyId, 
  components, 
  onSave, 
  onClose,
  existingProducts
}) => {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    type: "fabricado" as "fabricado" | "kit" | "revenda" | "digital" | "servico",
    price: 0,
    insumos: [] as { insumoId: string; quantity: number; unit: string }[]
  });

  const [loading, setLoading] = useState(false);

  const generateCode = (category: string): string => {
    const categoryPrefix = category.substring(0, 3).toUpperCase();
    const sequence = Math.floor(1000 + Math.random() * 9000);
    return `${categoryPrefix}${sequence}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      alert("Nome e Categoria são obrigatórios!");
      return;
    }

    if ((formData.type === "fabricado" || formData.type === "kit") && formData.insumos.length === 0) {
        alert("Ficha técnica é obrigatória para produtos fabricados ou kits!");
        return;
    }

    setLoading(true);
    try {
      const code = generateCode(formData.category);
      await onSave({
        ...formData,
        code,
        company: companyId,
        isVisible: true,
        isFeatured: false,
        createdAt: new Date(),
        // Map insumos correctly for the Product type
        insumos: formData.insumos.map(i => ({ insumoId: i.insumoId, quantity: i.quantity }))
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar produto.");
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Novo Produto</h2>
            <button onClick={onClose}><X size={20} className="text-slate-400"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
           <div className="grid grid-cols-2 gap-4">
             <div className="col-span-2">
               <label className="block text-xs font-bold text-slate-500 uppercase">Nome do Produto *</label>
               <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"/>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Categoria *</label>
                <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"/>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Tipo do Produto *</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1">
                    <option value="fabricado">Produto Fabricado</option>
                    <option value="kit">Kit</option>
                    <option value="revenda">Revenda</option>
                    <option value="digital">Digital</option>
                    <option value="servico">Serviço</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase">Preço de Venda</label>
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1"/>
             </div>
           </div>

           {(formData.type === "fabricado" || formData.type === "kit") && (
               <div className="space-y-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-900">Ficha Técnica</h3>
                        <button type="button" onClick={addInsumo} className="text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg font-bold text-slate-700 flex items-center gap-1">
                            <Plus size={14}/> Adicionar Item
                        </button>
                    </div>
                    {formData.insumos.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                            <select className="col-span-6 bg-slate-50 border border-slate-200 rounded-lg p-2" value={item.insumoId} onChange={e => updateInsumo(index, "insumoId", e.target.value)}>
                                {components.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input type="number" className="col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-2" value={item.quantity} onChange={e => updateInsumo(index, "quantity", Number(e.target.value))}/>
                            <span className="col-span-2 text-xs font-bold text-slate-500">{item.unit}</span>
                            <button type="button" onClick={() => removeInsumo(index)} className="col-span-2 text-rose-500"><Trash2 size={16}/></button>
                        </div>
                    ))}
               </div>
           )}

           <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
            {loading ? "Salvando..." : "Salvar Produto"}
           </button>
        </form>
      </div>
    </div>
  );
};
