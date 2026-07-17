import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CustomerAddress, CustomerContact } from '../../types';

interface AddressesSectionProps {
  addresses: CustomerAddress[];
  onChange: (addresses: CustomerAddress[]) => void;
}

export const AddressesSection: React.FC<AddressesSectionProps> = ({ addresses, onChange }) => {
  const addAddress = () => {
    onChange([...addresses, {
      id: Math.random().toString(),
      alias: 'Novo Endereço',
      zipCode: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      isMain: addresses.length === 0
    }]);
  };

  const removeAddress = (id: string) => {
    onChange(addresses.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] flex items-center justify-between">
        Endereços
        <button type="button" onClick={addAddress} className="text-[#1C1C1E]"><Plus size={14} /></button>
      </h5>
      {addresses.map((addr, idx) => (
        <div key={addr.id} className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5EA] text-xs flex justify-between items-center">
          <span>{addr.alias} - {addr.street}, {addr.number}</span>
          <button type="button" onClick={() => removeAddress(addr.id)} className="text-rose-500"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
};

interface ContactsSectionProps {
  contacts: CustomerContact[];
  onChange: (contacts: CustomerContact[]) => void;
}

export const ContactsSection: React.FC<ContactsSectionProps> = ({ contacts, onChange }) => {
  const addContact = () => {
    onChange([...contacts, {
      id: Math.random().toString(),
      name: '',
      phone: '',
      type: 'Outro',
      isMain: contacts.length === 0
    }]);
  };

  const removeContact = (id: string) => {
    onChange(contacts.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-[#E5E5EA]">
      <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-[#cca062] flex items-center justify-between">
        Contatos
        <button type="button" onClick={addContact} className="text-[#1C1C1E]"><Plus size={14} /></button>
      </h5>
      {contacts.map((c, idx) => (
        <div key={c.id} className="bg-[#FAF9F6] p-3 rounded-xl border border-[#E5E5EA] text-xs flex justify-between items-center">
          <span>{c.name || 'Contato'} - {c.phone}</span>
          <button type="button" onClick={() => removeContact(c.id)} className="text-rose-500"><Trash2 size={14} /></button>
        </div>
      ))}
    </div>
  );
};
