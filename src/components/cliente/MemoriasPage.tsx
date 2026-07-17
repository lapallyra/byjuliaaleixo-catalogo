import React, { useState } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { useMemories } from '../../hooks/useMemories';
import { addMemory, updateMemory, deleteMemory } from '../../services/firebaseService';
import { Calendar, Heart, Gift, Trash2, Edit2, Plus, X, Save } from 'lucide-react';
import { Memory } from '../../types';

export const MemoriasPage: React.FC = () => {
  const { customer } = useCustomer();
  const { memories, loading } = useMemories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Memory>>({});
  const [showForm, setShowForm] = useState(false);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando memórias...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Perfil não encontrado.</div>;

  const handleSave = async () => {
    if (!customer) return;
    if (editingId) {
      await updateMemory(editingId, formData);
      setEditingId(null);
    } else {
      await addMemory({ 
        ...formData, 
        customerId: customer.id,
        customerEmail: customer.email,
        customerName: customer.name 
      } as Memory);
      setShowForm(false);
    }
    setFormData({});
  };

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id || null);
    setFormData(memory);
    setShowForm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-mea-culpa text-[#3A312D]">Minhas Memórias</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setFormData({}); }} className="flex items-center gap-2 bg-[#1C1C1E] text-white px-4 py-2 rounded-full text-sm">
          <Plus size={16} /> Nova Memória
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
          <input placeholder="Nome da pessoa" value={formData.personName || ''} onChange={(e) => setFormData({...formData, personName: e.target.value})} className="w-full p-3 rounded-xl border border-gray-100" />
          <input type="date" value={formData.date || ''} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-3 rounded-xl border border-gray-100" />
          <select value={formData.eventType || 'Aniversário'} onChange={(e) => setFormData({...formData, eventType: e.target.value as any})} className="w-full p-3 rounded-xl border border-gray-100">
            <option>Aniversário</option>
            <option>Casamento</option>
            <option>Maternidade</option>
            <option>Outro</option>
          </select>
          <div className="flex gap-2">
            <button onClick={handleSave} className="flex-1 bg-indigo-600 text-white p-3 rounded-xl"><Save size={16}/></button>
            <button onClick={() => setShowForm(false)} className="bg-gray-100 p-3 rounded-xl"><X size={16}/></button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {memories.map(m => (
          <div key={m.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900">{m.personName}</h3>
            <p className="text-sm text-gray-500">{m.eventType} - {new Date(m.date).toLocaleDateString()}</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => startEdit(m)} className="text-indigo-600"><Edit2 size={16}/></button>
              <button onClick={() => deleteMemory(m.id!)} className="text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
