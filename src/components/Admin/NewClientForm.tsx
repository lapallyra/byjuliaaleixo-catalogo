import React, { useState, useEffect } from "react";
import { User, Phone, Mail, MapPin, Hash, Clipboard, Check, X } from "lucide-react";
import { Customer, CompanyId } from "../../types";

interface NewClientFormProps {
  companyId: CompanyId;
  onSave: (clientData: any) => Promise<void>;
  onClose: () => void;
  existingCustomers: Customer[];
  selectedCustomer?: Customer | null;
}

export const NewClientForm: React.FC<NewClientFormProps> = ({ companyId, onSave, onClose, existingCustomers, selectedCustomer }) => {
  const [formData, setFormData] = useState({
    name: selectedCustomer?.name || "",
    type: "PF" as "PF" | "PJ",
    cpfCnpj: selectedCustomer?.cpfCnpj || "",
    contact: selectedCustomer?.contact || "",
    email: selectedCustomer?.email || "",
    zipCode: selectedCustomer?.zipCode || "",
    address: selectedCustomer?.address || "",
    number: selectedCustomer?.number || "",
    complement: "",
    neighborhood: selectedCustomer?.neighborhood || "",
    city: selectedCustomer?.city || "",
    state: selectedCustomer?.state || "",
    status: (selectedCustomer?.status || "Ativo") as "Ativo" | "Inativo" | "Cadastro Incompleto",
    receivePromos: true,
    notes: selectedCustomer?.notes || "",
  });

  const [loading, setLoading] = useState(false);

  const generateCode = (): string => {
    const prefixMap: Record<CompanyId, string> = {
      pallyra: "LP",
      mimada: "MS",
      guennita: "CG",
      tuttymimo: "TM"
    };
    
    const prefix = prefixMap[companyId] || "";
    const random = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${random}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.contact) {
      alert("Nome e Telefone são obrigatórios!");
      return;
    }

    if (!selectedCustomer) {
        const isDuplicate = existingCustomers.some(c => 
          c.contact === formData.contact || 
          (formData.cpfCnpj && c.cpfCnpj === formData.cpfCnpj) ||
          (formData.email && c.email === formData.email)
        );
    
        if (isDuplicate) {
          alert("Cliente já cadastrado com estes dados!");
          return;
        }
    }

    setLoading(true);
    try {
      const code = selectedCustomer ? selectedCustomer.code : generateCode();
      await onSave({
        ...formData,
        code,
        companyId,
        totalSpent: selectedCustomer ? selectedCustomer.totalSpent : 0,
        ordersCount: selectedCustomer ? selectedCustomer.ordersCount : 0,
        createdAt: selectedCustomer ? selectedCustomer.createdAt : new Date(),
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase">Nome Completo *</label>
          <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Tipo *</label>
          <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400">
              <option value="PF">Pessoa Física</option>
              <option value="PJ">Pessoa Jurídica</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">CPF/CNPJ</label>
          <input value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">WhatsApp *</label>
          <input required value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">E-mail</label>
          <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <label className="block text-xs font-bold text-slate-500 uppercase">CEP</label>
          <input value={formData.zipCode} onChange={e => setFormData({...formData, zipCode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-bold text-slate-500 uppercase">Rua</label>
          <input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Número</label>
          <input value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Bairro</label>
          <input value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Cidade</label>
          <input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
        </div>
      </div>

      <div>
          <label className="block text-xs font-bold text-slate-500 uppercase">Observações</label>
          <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 mt-1 outline-none focus:border-slate-400"/>
      </div>

      <button disabled={loading} type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 transition-colors">
      {loading ? "Salvando..." : selectedCustomer ? "Atualizar Cliente" : "Cadastrar Cliente"}
      </button>
    </form>
  );
};


