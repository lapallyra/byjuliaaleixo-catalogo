import React, { useState } from "react";
import { X, Save, Plus, Trash2, Search } from "lucide-react";
import { CompanyId, Supplier } from "../../types";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";

interface SupplierFormProps {
  companyId: CompanyId;
  editingSupplier?: Supplier | null;
  onClose: () => void;
}

export const SupplierForm: React.FC<SupplierFormProps> = ({ 
  companyId, 
  editingSupplier, 
  onClose 
}) => {
  const [formData, setFormData] = useState({
    name: editingSupplier?.name || "",
    contactName: editingSupplier?.contactName || "",
    phone: editingSupplier?.phone || "",
    email: editingSupplier?.email || "",
    cnpj: editingSupplier?.cnpj || "",
    address: editingSupplier?.address || "",
    tags: editingSupplier?.tags?.join(", ") || "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert("Nome e Telefone são obrigatórios!");
      return;
    }

    setLoading(true);
    try {
      const data = {
        ...formData,
        tags: formData.tags.split(",").map(t => t.trim()).filter(t => t),
        companyId,
        updatedAt: serverTimestamp()
      };

      if (editingSupplier) {
        await updateDoc(doc(db, "suppliers", editingSupplier.id), data);
      } else {
        await addDoc(collection(db, "suppliers"), {
          ...data,
          createdAt: serverTimestamp()
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving supplier:", error);
      alert("Erro ao salvar fornecedor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">
            {editingSupplier ? "Editar Fornecedor" : "Novo Fornecedor"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Empresa *</label>
            <input 
              required
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
              placeholder="Ex: Madeireira Silva"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contato</label>
              <input 
                value={formData.contactName} 
                onChange={e => setFormData({...formData, contactName: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
                placeholder="Nome do contato"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp / Telefone *</label>
              <input 
                required
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
            <input 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
              placeholder="contato@fornecedor.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ</label>
            <input 
              value={formData.cnpj} 
              onChange={e => setFormData({...formData, cnpj: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
              placeholder="00.000.000/0000-00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Endereço</label>
            <textarea 
              value={formData.address} 
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400 min-h-[80px]"
              placeholder="Rua, Número, Bairro, Cidade - UF"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tags (separadas por vírgula)</label>
            <input 
              value={formData.tags} 
              onChange={e => setFormData({...formData, tags: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm outline-none focus:border-slate-400"
              placeholder="Papelaria, Insumos, Embalagens"
            />
          </div>

          <div className="pt-4">
            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              {loading ? "Salvando..." : <><Save size={18} /> Salvar Fornecedor</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
