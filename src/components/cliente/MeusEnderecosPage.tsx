import React, { useState } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { updateCustomer } from '../../services/firebaseService';
import { CustomerAddress, Customer } from '../../types';
import { MapPin, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

export const MeusEnderecosPage: React.FC = () => {
  const { customer, loading } = useCustomer();
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando seus endereços...</p>
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

  const addresses = customer.addresses || [];

  const handleUpdate = async (updatedAddresses: CustomerAddress[]) => {
    if (!customer) return;
    try {
      await updateCustomer(customer.id, { ...customer, addresses: updatedAddresses });
      setEditingAddress(null);
    } catch (error) {
      console.error('Erro ao atualizar endereço:', error);
    }
  };

  const setAsMain = (id: string) => {
    const updated = addresses.map(addr => ({ ...addr, isMain: addr.id === id }));
    handleUpdate(updated);
  };

  const removeAddress = (id: string) => {
    handleUpdate(addresses.filter(addr => addr.id !== id));
  };

  return (
    <div className="space-y-5 pb-8 px-2 sm:px-3">
      <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2A2421] tracking-tight">Meus Endereços</h1>
          <p className="text-xs text-[#6E645E] mt-0.5">Gerencie os locais de entrega dos seus pedidos artesanais</p>
        </div>
        <span className="text-xs font-bold bg-[#F5F1EB] text-[#8C6D37] px-3.5 py-1.5 rounded-full border border-stone-200/80">
          {addresses.length} {addresses.length === 1 ? 'endereço' : 'endereços'}
        </span>
      </div>
      
      {addresses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center mx-auto">
            <MapPin size={24} />
          </div>
          <h3 className="text-base font-bold text-[#2A2421]">Nenhum endereço cadastrado</h3>
          <p className="text-xs text-[#6E645E] max-w-sm mx-auto">
            Seus endereços salvos durante a compra aparecerão aqui para consultas e entregas futuras.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {addresses.map(addr => (
            <div 
              key={addr.id} 
              className={`bg-white p-5 rounded-3xl border ${addr.isMain ? 'border-[#8C6D37] ring-1 ring-[#8C6D37]/30' : 'border-stone-200/80'} shadow-2xs relative flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center">
                      <MapPin size={16} />
                    </div>
                    <h3 className="font-bold text-sm text-[#2A2421]">{addr.alias || 'Endereço de Entrega'}</h3>
                  </div>
                  {addr.isMain && (
                    <span className="text-[10px] font-bold bg-[#2A2421] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Principal
                    </span>
                  )}
                </div>

                <div className="space-y-1 text-xs text-[#6E645E] pl-1">
                  <p className="font-medium text-[#2A2421]">{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
                  <p>{addr.neighborhood} - {addr.city}/{addr.state}</p>
                  <p className="text-stone-400 font-mono text-[11px]">CEP: {addr.zipCode}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100">
                {!addr.isMain ? (
                  <button 
                    onClick={() => setAsMain(addr.id)} 
                    className="text-xs font-bold text-[#8C6D37] hover:underline cursor-pointer"
                  >
                    Definir como principal
                  </button>
                ) : (
                  <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle size={13} /> Usado por padrão
                  </span>
                )}
                <button 
                  onClick={() => removeAddress(addr.id)} 
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="Excluir Endereço"
                >
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
