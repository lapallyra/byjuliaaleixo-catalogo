import React from 'react';
import { useOrders } from '../../hooks/useOrders';
import { normalizeStatus } from '../../services/firebaseService';
import { Package, Calendar, DollarSign, Tag } from 'lucide-react';

export const MeusPedidosPage: React.FC = () => {
  const { orders, loading } = useOrders();

  if (loading) return <div className="p-8 text-center text-gray-500">Carregando seus pedidos...</div>;
  if (orders.length === 0) return <div className="p-8 text-center text-gray-500">Você ainda não realizou nenhum pedido.</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-mea-culpa text-[#3A312D]">Meus Pedidos</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-gray-50 p-3 rounded-2xl text-gray-500">
                <Package size={24} />
              </div>
              <div>
                <p className="font-bold text-gray-900">Pedido {order.code}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Data indisponível'}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-bold text-gray-900 flex items-center justify-end gap-1">
                <DollarSign size={14} />
                {order.total.toFixed(2)}
              </p>
              <p className="text-xs text-[#cca062] uppercase font-bold mt-1">
                {normalizeStatus(order.status)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
