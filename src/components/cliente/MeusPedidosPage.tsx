import React from 'react';
import { useOrders } from '../../hooks/useOrders';
import { normalizeStatus } from '../../services/firebaseService';
import { Package, Calendar, DollarSign, ArrowUpRight, Search } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export const MeusPedidosPage: React.FC = () => {
  const { orders, loading } = useOrders();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.toLowerCase() || '';
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[#8C6D37] border-t-transparent animate-spin mb-3" />
        <p className="text-xs font-semibold text-[#2A2421]">Carregando seus pedidos...</p>
      </div>
    );
  }

  const filteredOrders = orders.filter(o => 
    !query || 
    o.code.toLowerCase().includes(query) || 
    (o.status && o.status.toLowerCase().includes(query))
  );

  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-center justify-between bg-white rounded-3xl p-5 border border-stone-200/80 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-[#2A2421]">Meus Pedidos</h2>
          <p className="text-xs text-[#6E645E] mt-0.5">Acompanhe seus projetos artesanais e o status de entrega</p>
        </div>
        <span className="text-xs font-bold bg-[#F5F1EB] text-[#8C6D37] px-3.5 py-1.5 rounded-full border border-stone-200/80">
          {filteredOrders.length} {filteredOrders.length === 1 ? 'pedido' : 'pedidos'}
        </span>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center mx-auto">
            <Package size={24} />
          </div>
          <h3 className="text-base font-bold text-[#2A2421]">Nenhum pedido encontrado</h3>
          <p className="text-xs text-[#6E645E] max-w-sm mx-auto">
            {query ? `Nenhum resultado para "${query}".` : 'Você ainda não possui pedidos realizados no Ateliê VIP.'}
          </p>
          <button
            onClick={() => navigate('/comomontar')}
            className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#2A2421] hover:bg-[#8C6D37] text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <span>Montar Meu Primeiro Kit</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map(order => (
            <div 
              key={order.id} 
              className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F1EB] text-[#8C6D37] flex items-center justify-center font-bold text-sm shrink-0 border border-stone-200/70">
                  #{order.code}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#2A2421]">Pedido #{order.code}</h4>
                  <div className="flex items-center gap-3 text-xs text-[#6E645E] mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={13} />
                      {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString('pt-BR') : 'Data recente'}
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-[#2A2421]">
                      R$ {(order.total || 0).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs font-bold px-3.5 py-1 rounded-full bg-[#2A2421] text-white shadow-2xs uppercase tracking-wider">
                  {normalizeStatus(order.status)}
                </span>
                <button
                  onClick={() => navigate(`/document?code=${order.code}`)}
                  className="w-9 h-9 rounded-2xl bg-[#F5F1EB] hover:bg-[#2A2421] text-[#2A2421] hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  title="Detalhes do Pedido"
                >
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

