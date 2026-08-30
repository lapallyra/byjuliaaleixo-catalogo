
import React from 'react';
import { Package, Heart, Gift, MapPin, Sparkles, ArrowRight, BookOpen, Clock, Search } from 'lucide-react';
import { useCustomer } from '../../hooks/useCustomer';
import { useOrders } from '../../hooks/useOrders';
import { useAuth } from '../AuthProvider';
import { useNavigate } from 'react-router-dom';

export const DashboardCliente: React.FC = () => {
  const { customer, loading: customerLoading } = useCustomer();
  const { orders, loading: ordersLoading } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (customerLoading || ordersLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#CCA062] border-t-transparent animate-spin mb-3" />
        <p className="text-xs">Carregando seu painel de experiências...</p>
      </div>
    );
  }

  const name = customer?.name || user?.displayName || 'Cliente Especial';
  const firstName = name.split(' ')[0];

  const totalOrders = orders.length || customer?.ordersCount || 0;
  const totalSpent = customer?.totalSpent || orders.reduce((acc, o) => acc + (o.total || 0), 0);
  const addressesCount = customer?.addresses?.length || 0;

  const stats = [
    { title: 'Meus Pedidos', value: totalOrders, icon: Package, desc: 'Histórico de compras', link: '/minha-experiencia/pedidos' },
    { title: 'Investimento em Afeto', value: `R$ ${totalSpent.toFixed(2).replace('.', ',')}`, icon: Heart, desc: 'Total em presentes e memórias', link: '/minha-experiencia/pedidos' },
    { title: 'Endereços Salvos', value: addressesCount, icon: MapPin, desc: 'Locais de entrega', link: '/minha-experiencia/enderecos' },
    { title: 'Memórias Guardadas', value: '1', icon: BookOpen, desc: 'Seus momentos inesquecíveis', link: '/minha-experiencia/memorias' },
  ];

  const recentOrder = orders[0];

  return (
    <div className="space-y-8">
      
      {/* WELCOME BANNER */}
      <div className="bg-gradient-to-r from-[#FAF6F0] via-white to-[#FAF6F0] p-6 sm:p-8 rounded-3xl border border-[#E8DFC8] shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF0E6] text-[#8C6D37] text-[10px] font-bold uppercase tracking-[0.2em] border border-[#E8DFC8]">
            <Sparkles size={12} />
            <span>Sua Central Afetiva</span>
          </div>
          <h1 className="font-mea-culpa text-4xl sm:text-5xl text-[#2C1810]">
            Seja bem-vindo(a), {firstName}!
          </h1>
          <p className="text-xs sm:text-sm text-[#6D5443] font-light leading-relaxed">
            Aqui você acompanha cada detalhe da confecção artesanal dos seus mimos, gerencia seus endereços e guarda suas memórias com carinho.
          </p>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              onClick={() => navigate(stat.link)}
              className="bg-white p-5 rounded-2xl border border-[#E8DFC8] shadow-xs hover:shadow-md hover:border-[#8C6D37] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0E6] text-[#8C6D37] flex items-center justify-center group-hover:bg-[#2C1810] group-hover:text-white transition-colors">
                  <Icon size={20} />
                </div>
                <ArrowRight size={14} className="text-[#8C6D37] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-[11px] font-bold text-[#6D5443] uppercase tracking-wider">{stat.title}</h3>
              <p className="text-xl font-serif font-bold text-[#2C1810] mt-1">{stat.value}</p>
              <p className="text-[10px] text-[#8C6D37] mt-1 font-light">{stat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* RECENT ORDER / QUICK TRACKING SECTION */}
      {recentOrder ? (
        <div className="bg-white p-6 rounded-3xl border border-[#E8DFC8] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DFC8]/60 pb-3">
            <h3 className="text-xs font-bold text-[#2C1810] uppercase tracking-wider flex items-center gap-2">
              <Clock size={16} className="text-[#8C6D37]" />
              <span>Último Pedido em Andamento</span>
            </h3>
            <button 
              onClick={() => navigate('/minha-experiencia/pedidos')}
              className="text-xs font-semibold text-[#8C6D37] hover:underline"
            >
              Ver todos os pedidos →
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF6F0] border border-[#E8DFC8]">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D37] bg-white px-2.5 py-0.5 rounded-full border border-[#E8DFC8]">
                Pedido #{recentOrder.code}
              </span>
              <p className="text-xs font-bold text-[#2C1810] mt-1">
                Valor Total: R$ {(recentOrder.total || 0).toFixed(2).replace('.', ',')}
              </p>
              <p className="text-[11px] text-[#6D5443]">
                Status: <strong className="text-[#8C6D37] uppercase">{recentOrder.status || 'Em processamento'}</strong>
              </p>
            </div>

            <button
              onClick={() => navigate(`/document?code=${recentOrder.code}`)}
              className="px-4 py-2 rounded-full bg-[#2C1810] hover:bg-[#8C6D37] text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
            >
              <Search size={14} />
              <span>Rastrear Pedido</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* QUICK ACTIONS SHORTCUTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => navigate('/comomontar')}
          className="p-5 rounded-2xl bg-[#2C1810] text-white border border-[#8C6D37] shadow-sm hover:shadow-md transition-all cursor-pointer group"
        >
          <Gift size={24} className="text-[#CCA062] mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif font-bold text-sm">Monte Seu Kit</h4>
          <p className="text-[11px] text-amber-100/70 font-light mt-1">
            Personalize um presente do seu jeito com seleções nobres.
          </p>
        </div>

        <div 
          onClick={() => navigate('/personalize')}
          className="p-5 rounded-2xl bg-white text-[#2C1810] border border-[#E8DFC8] shadow-sm hover:border-[#8C6D37] transition-all cursor-pointer group"
        >
          <Sparkles size={24} className="text-[#8C6D37] mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif font-bold text-sm">Personalizar Objetos</h4>
          <p className="text-[11px] text-[#6D5443] font-light mt-1">
            Transforme itens comuns em lembranças afetivas personalizadas.
          </p>
        </div>

        <div 
          onClick={() => navigate('/listadepresentes')}
          className="p-5 rounded-2xl bg-[#FAF0E6] text-[#2C1810] border border-[#E8DFC8] shadow-sm hover:border-[#8C6D37] transition-all cursor-pointer group"
        >
          <Heart size={24} className="text-[#8C6D37] mb-3 group-hover:scale-110 transition-transform" />
          <h4 className="font-serif font-bold text-sm">Lista de Presentes</h4>
          <p className="text-[11px] text-[#6D5443] font-light mt-1">
            Crie e compartilhe sua lista para casamentos, chá ou eventos.
          </p>
        </div>
      </div>

    </div>
  );
};

