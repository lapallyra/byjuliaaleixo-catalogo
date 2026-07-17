
import React from 'react';
import { Package, Heart, Gift, MapPin } from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';

export const DashboardCliente: React.FC = () => {
  const { customer, loading } = useCustomer();

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando seus dados...</div>;
  if (!customer) return <div className="p-8 text-center text-gray-500">Perfil não encontrado.</div>;

  const stats = [
    { title: 'Meus pedidos', value: customer.ordersCount || 0, icon: Package, desc: 'Total de pedidos' },
    { title: 'Total gasto', value: `R$ ${(customer.totalSpent || 0).toFixed(2)}`, icon: Heart, desc: 'Valor total' },
    { title: 'Endereços', value: customer.addresses?.length || 0, icon: MapPin, desc: 'Cadastrados' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-mea-culpa text-4xl text-[#3A312D]">Olá, {customer.name.split(' ')[0]} 🌸</h1>
        <p className="text-gray-500 mt-2">Seus momentos especiais estão guardados aqui com carinho.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="text-[#cca062]" size={24} />
            </div>
            <h3 className="text-xs text-gray-500 uppercase tracking-wider">{stat.title}</h3>
            <p className="text-xl font-semibold text-[#3A312D] mt-1">{stat.value}</p>
            <p className="text-xs text-gray-400 mt-2">{stat.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
