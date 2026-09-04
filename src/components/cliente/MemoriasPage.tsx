import React, { useState } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { useMemories } from '../../hooks/useMemories';
import { addMemory, updateMemory, deleteMemory } from '../../services/firebaseService';
import { Calendar, Heart, Gift, Trash2, Edit2, Plus, X, Save, Sparkles } from 'lucide-react';
import { Memory } from '../../types';

export const MemoriasPage: React.FC = () => {
  const { customer } = useCustomer();
  const { memories, loading } = useMemories();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Memory>>({});
  const [showForm, setShowForm] = useState(false);

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando suas memórias afetivas...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-2xs">
        <p className="text-xs text-[#6E645E]">Perfil de cliente não encontrado.</p>
      </div>
    );
  }

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
    <div className="space-y-5 pb-8 px-2 sm:px-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight">Minhas Memórias Afetivas</h1>
          <p className="text-xs text-[#6E645E] mt-0.5">Guarde datas especiais de pessoas queridas para mimos e surpresas</p>
        </div>
        <button 
          onClick={() => { setShowForm(true); setEditingId(null); setFormData({}); }} 
          className="flex items-center gap-2 bg-[#2A2421] hover:bg-[#8C6D37] text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Nova Memória</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
            <h3 className="font-bold text-sm text-[#2A2421]">
              {editingId ? 'Editar Memória' : 'Cadastrar Nova Memória Especial'}
            </h3>
            <button onClick={() => setShowForm(false)} className="text-stone-400 hover:text-[#2A2421]">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-[#6E645E] uppercase tracking-wider mb-1">Pessoa Homenageada</label>
              <input 
                placeholder="Ex: Maria, Mão, Sobrinha..." 
                value={formData.personName || ''} 
                onChange={(e) => setFormData({...formData, personName: e.target.value})} 
                className="w-full bg-[#F5F1EB] p-2.5 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6E645E] uppercase tracking-wider mb-1">Data Comemorativa</label>
              <input 
                type="date" 
                value={formData.date || ''} 
                onChange={(e) => setFormData({...formData, date: e.target.value})} 
                className="w-full bg-[#F5F1EB] p-2.5 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]" 
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#6E645E] uppercase tracking-wider mb-1">Tipo de Evento</label>
              <select 
                value={formData.eventType || 'Aniversário'} 
                onChange={(e) => setFormData({...formData, eventType: e.target.value as any})} 
                className="w-full bg-[#F5F1EB] p-2.5 rounded-xl border border-stone-200/80 text-xs text-[#2A2421] focus:outline-none focus:border-[#8C6D37]"
              >
                <option value="Aniversário">Aniversário</option>
                <option value="Casamento">Casamento</option>
                <option value="Maternidade">Maternidade / Batizado</option>
                <option value="Outro">Outra Ocasião Especial</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-2 justify-end">
            <button 
              onClick={() => setShowForm(false)} 
              className="bg-stone-100 hover:bg-stone-200 text-[#2A2421] px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="bg-[#2A2421] hover:bg-[#8C6D37] text-white px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1.5"
            >
              <Save size={14}/>
              <span>Salvar Memória</span>
            </button>
          </div>
        </div>
      )}

      {memories.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center mx-auto">
            <Sparkles size={24} />
          </div>
          <h3 className="text-base font-bold text-[#2A2421]">Nenhuma memória agendada</h3>
          <p className="text-xs text-[#6E645E] max-w-sm mx-auto">
            Cadastre os aniversários e datas marcantes dos seus entes queridos para não esquecer os presentes e mimos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memories.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold bg-[#F5F1EB] text-[#8C6D37] px-2.5 py-0.5 rounded-full border border-stone-200/80 uppercase">
                    {m.eventType}
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(m)} className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 transition-colors" title="Editar">
                      <Edit2 size={14}/>
                    </button>
                    <button onClick={() => deleteMemory(m.id!)} className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors" title="Excluir">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-base text-[#2A2421] mt-2">{m.personName}</h3>
                <div className="flex items-center gap-1.5 text-xs text-[#6E645E] mt-1">
                  <Calendar size={14} className="text-[#8C6D37]" />
                  <span>{m.date ? new Date(m.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
