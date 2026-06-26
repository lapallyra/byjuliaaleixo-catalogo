
import React from 'react';
import { Package, Heart, Gift, MapPin } from 'lucide-react';

const stats = [
  { title: 'Meu último pedido', value: '#166949', icon: Package, desc: 'Aguardando entrega' },
  { title: 'Favoritos', value: '12', icon: Heart, desc: 'Produtos salvos' },
  { title: 'Presentes criados', value: '5', icon: Gift, desc: 'Personalizações feitas' },
  { title: 'Endereços', value: '2', icon: MapPin, desc: 'Cadastrados' },
];

export const DashboardCliente: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-parisienne text-4xl text-[#3A312D]">Olá, Julia 🌸</h1>
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
