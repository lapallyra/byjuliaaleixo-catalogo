import React, { useState } from 'react';
import { useCustomer } from '../../hooks/useCustomer';
import { updateCustomer } from '../../services/firebaseService';
import { CustomerAddress, Customer } from '../../types';
import { MapPin, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

export const MeusEnderecosPage: React.FC = () => {
  const { customer, loading } = useCustomer();
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando endereços...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Perfil não encontrado.</div>;

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
    <div className="space-y-6">
      <h1 className="text-2xl font-mea-culpa text-[#3A312D]">Meus Endereços</h1>
      
      <div className="grid gap-4 md:grid-cols-2">
        {addresses.map(addr => (
          <div key={addr.id} className={`bg-white p-6 rounded-3xl border ${addr.isMain ? 'border-indigo-500' : 'border-gray-100'} shadow-sm relative`}>
            {addr.isMain && <span className="absolute top-2 right-2 text-indigo-500"><CheckCircle size={16} /></span>}
            <div className="flex items-start gap-3 mb-4">
              <MapPin className="text-[#cca062]" size={20} />
              <div>
                <h3 className="font-bold text-gray-900">{addr.alias || 'Endereço'}</h3>
                <p className="text-sm text-gray-600">{addr.street}, {addr.number} {addr.complement && `- ${addr.complement}`}</p>
                <p className="text-sm text-gray-600">{addr.neighborhood} - {addr.city}/{addr.state}</p>
                <p className="text-sm text-gray-600">CEP: {addr.zipCode}</p>
              </div>
            </div>
            <div className="flex gap-2">
              {!addr.isMain && (
                <button onClick={() => setAsMain(addr.id)} className="text-xs bg-gray-100 px-3 py-1 rounded-full">Principal</button>
              )}
              <button onClick={() => removeAddress(addr.id)} className="text-xs text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
