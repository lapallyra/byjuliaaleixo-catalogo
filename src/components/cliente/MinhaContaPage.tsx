import React, { useState, useEffect } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { updateCustomer } from '../../services/firebaseService';
import { User, Phone, Mail, Save, X, Edit2 } from 'lucide-react';

export const MinhaContaPage: React.FC = () => {
  const { customer, loading } = useCustomer();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
      });
    }
  }, [customer]);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando dados da conta...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Perfil não encontrado.</div>;

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      await updateCustomer(customer.id, { ...customer, ...formData });
      setEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mea-culpa text-[#3A312D]">Minha Conta</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-sm bg-gray-100 px-4 py-2 rounded-full">
            <Edit2 size={16} /> Editar
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="text-sm bg-gray-100 px-4 py-2 rounded-full"><X size={16} /></button>
            <button onClick={handleSave} className="text-sm bg-[#1C1C1E] text-white px-4 py-2 rounded-full" disabled={saving}>
              {saving ? 'Salvando...' : <Save size={16} />}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
            {editing ? (
              <input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100" />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><User size={20} className="text-[#cca062]" /> {customer.name}</div>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">E-mail</label>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl opacity-70"><Mail size={20} className="text-[#cca062]" /> {customer.email}</div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
            {editing ? (
              <input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 p-3 rounded-xl border border-gray-100" />
            ) : (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"><Phone size={20} className="text-[#cca062]" /> {customer.phone || 'Não informado'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
