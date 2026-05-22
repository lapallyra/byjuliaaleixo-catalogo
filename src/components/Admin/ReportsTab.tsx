import React, { useState, useMemo } from 'react';
import { 
  Trophy, TrendingUp, Package, Users, ShoppingBag, 
  ArrowUpRight, ArrowDownRight, ChevronDown, Filter,
  Star, PieChart, BarChart2, Zap, Layout
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, Cell
} from 'recharts';
import { Product, Order, Customer, Insumo, CompanyId } from '../../types';
import { safeFormat } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/currencyUtils';
import { subMonths, startOfMonth, endOfMonth, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ImageWithFallback } from '../ImageWithFallback';

interface ReportsTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  insumos: Insumo[];
}

export const ReportsTab: React.FC<ReportsTabProps> = ({ companyId, orders, products, customers, insumos }) => {
  const [selectedMonth, setSelectedMonth] = useState(safeFormat(new Date(), 'yyyy-MM'));
  const [activeCard, setActiveCard] = useState<string | null>(null);

  // Sales volume data for last 6 months
  const salesVolumeData = useMemo(() => {
    return [...Array(6)].map((_, i) => {
      const date = subMonths(new Date(), 5 - i);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const monthLabel = safeFormat(date, 'MMM', { locale: ptBR });
      
      const monthOrders = orders.filter(o => {
        const oDate = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt as any);
        const orderDate = isNaN(oDate.getTime()) ? new Date() : oDate;
        return o.status !== 'cancelled' && isAfter(orderDate, monthStart) && isBefore(orderDate, monthEnd);
      });

      return {
        name: monthLabel,
        vendas: monthOrders.length,
        receita: monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      };
    });
  }, [orders]);

  // Rankings
  const { customerRank, productRank, topRentable, topInsumos } = useMemo(() => {
    const custRank = [...customers]
      .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
      .slice(0, 10);

    const prodRank = [...products]
      .map(p => ({
        ...p,
        sold: orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => {
          const item = o.items?.find(i => i.productId === p.id);
          return sum + (item ? item.quantity : 0);
        }, 0)
      }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    const rentRank = [...products]
      .sort((a, b) => (b.retail_price - (b.estimatedCost || 0)) - (a.retail_price - (a.estimatedCost || 0)))
      .slice(0, 5);

    const lowInsumos = [...insumos]
      .sort((a, b) => (a.quantity < a.criticalLimit ? 1 : -1))
      .slice(0, 5);

    return {
      customerRank: custRank,
      productRank: prodRank,
      topRentable: rentRank,
      topInsumos: lowInsumos
    };
  }, [customers, products, orders, insumos]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      
      {/* Month Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-rose-50 uppercase tracking-[0.2em]">Análise Gerencial</h2>
          <p className="text-[10px] text-rose-300 uppercase font-black tracking-widest mt-1">Inteligência de vendas e performance</p>
        </div>
        <div className="flex items-center gap-3 bg-[#140b0e] border border-lilac/20 p-2 px-4 rounded-2xl shadow-sm">
          <Filter size={14} className="text-lilac" />
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none pr-4 cursor-pointer text-rose-50"
          >
            {[...Array(12)].map((_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = safeFormat(d, 'yyyy-MM');
              const label = safeFormat(d, 'MMMM yyyy', { locale: ptBR });
              return <option key={val} value={val}>{label}</option>;
            })}
          </select>
        </div>
      </div>

      {/* Sales Volume Chart */}
      <div className="p-8 rounded-[2.5rem] bg-[#140b0e] border border-lilac/10 shadow-sm">
        <div className="flex justify-between items-center mb-8">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-50">Volume de Vendas (Últimos 6 Meses)</h3>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-lilac" />
                 <span className="text-[8px] font-black uppercase text-rose-300">Qtd Pedidos</span>
              </div>
           </div>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesVolumeData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }} />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 900, color: '#000', marginBottom: '4px' }}
              />
              <Bar dataKey="vendas" fill="#a376f9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Rankings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Leading Customers */}
        <div className="p-8 rounded-[2.5rem] bg-[#140b0e] border border-lilac/10 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-lilac/5 text-lilac">
                 <Trophy size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-rose-50">Clientes em Destaque</h3>
           </div>
           <div className="space-y-4">
              {customerRank.map((c, idx) => (
                <div key={`customer-rank-final-${c.id}-${idx}`} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-lilac-baby/30 transition-all group border border-transparent hover:border-lilac/20">
                   <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-[10px] font-black ${idx < 3 ? 'bg-black text-white' : 'bg-[#2b141e] text-rose-300'}`}>
                      {idx + 1}
                   </span>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{c.name}</p>
                      <p className="text-[9px] text-rose-300 uppercase font-black tracking-tighter">{c.ordersCount} pedidos confirmados</p>
                   </div>
                   <span className="font-mono text-xs font-black text-emerald-500">{formatCurrency(c.totalSpent || 0)}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Leading Products */}
        <div className="p-8 rounded-[2.5rem] bg-[#140b0e] border border-lilac/10 shadow-sm">
           <div className="flex items-center gap-4 mb-8">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-500">
                 <TrendingUp size={20} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-rose-50">Produtos Mais Vendidos</h3>
           </div>
           <div className="space-y-4">
              {productRank.map((p, idx) => (
                <div key={`prod-rank-final-${p.id}-${idx}`} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50/50 transition-all group border border-transparent hover:border-blue-200">
                   <div className="w-12 h-12 rounded-xl bg-[#140b0e] flex items-center justify-center border border-rose-900/30 overflow-hidden">
                      <ImageWithFallback src={p.image} alt={p.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-bold text-gray-800">{p.product_name}</p>
                      <p className="text-[9px] text-rose-300 uppercase font-black">{p.category}</p>
                   </div>
                   <div className="text-right">
                      <p className="font-mono text-xs font-black text-blue-500">{p.sold || 0} unid.</p>
                      <p className="text-[8px] text-rose-300 font-bold uppercase">Vendido</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Interactive Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 'vendas', label: 'Favoritos do Ano', desc: 'Produtos com maior rotatividade', icon: Star, color: 'text-amber-500' },
          { id: 'pagamentos', label: 'Formas de Pagamento', desc: 'Preferências de recebimento', icon: Layout, color: 'text-blue-500' },
          { id: 'estoque', label: 'Curva de Insumos', desc: 'Uso intenso e crítico', icon: Package, color: 'text-emerald-500' },
          { id: 'rentabilidade', label: 'Top Rentabilidade', desc: 'Melhores margens líquidas', icon: Zap, color: 'text-lilac' },
        ].map(insight => (
          <div key={insight.id} className="space-y-4">
            <button 
              onClick={() => setActiveCard(activeCard === insight.id ? null : insight.id)}
              className={`w-full p-8 rounded-[2.5rem] border transition-all text-left group flex flex-col shadow-sm ${activeCard === insight.id ? 'bg-lilac/5 border-lilac' : 'bg-[#140b0e] border-lilac/10 hover:border-lilac'}`}
            >
              <div className={`p-3 rounded-2xl bg-[#140b0e] w-fit mb-6 ${insight.color}`}>
                 <insight.icon size={20} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-50 transition-colors">{insight.label}</h4>
              <p className="text-[9px] text-rose-300 mt-2 leading-relaxed font-bold">{insight.desc}</p>
              <div className={`mt-6 pt-4 border-t border-gray-50 flex items-center justify-between transition-all ${activeCard === insight.id ? 'opacity-100' : 'opacity-40 group-hover:opacity-100'}`}>
                 <span className="text-[8px] font-black uppercase tracking-widest text-lilac">Ver Detalhes</span>
                 <ChevronDown size={14} className={`text-lilac transition-transform duration-300 ${activeCard === insight.id ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expandable Detail Area */}
            {activeCard === insight.id && (
              <div className="p-6 rounded-[2rem] bg-[#140b0e] border border-lilac/10 animate-in slide-in-from-top-2 duration-300 shadow-inner">
                {insight.id === 'vendas' && (
                  <div className="space-y-3">
                     {productRank.slice(0, 5).map((p, pIdx) => (
                       <div key={`insight-vendas-${p.id}-${pIdx}`} className="flex justify-between items-center text-[10px] border-b border-rose-900/50/50 pb-2 font-bold uppercase tracking-tight">
                          <span className="text-gray-500">{p.product_name}</span>
                          <span className="text-rose-50 font-mono">{p.sold} unid.</span>
                       </div>
                     ))}
                  </div>
                )}
                {insight.id === 'pagamentos' && (
                  <div className="space-y-3">
                     <div className="flex justify-between items-center text-[10px] pb-2 border-b border-rose-900/50/50 font-bold uppercase">
                        <span className="text-gray-500">PIX (Mais Rápido)</span>
                        <span className="text-emerald-500 font-mono">68%</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] pb-2 border-b border-rose-900/50/50 font-bold uppercase">
                        <span className="text-gray-500">Cartão de Crédito</span>
                        <span className="text-blue-500 font-mono">22%</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] pb-2 border-b border-rose-900/50/50 font-bold uppercase">
                        <span className="text-gray-500">PIX Parcelado</span>
                        <span className="text-amber-500 font-mono">7%</span>
                     </div>
                     <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                        <span className="text-gray-500">Dinheiro/Outros</span>
                        <span className="text-rose-300 font-mono">3%</span>
                     </div>
                  </div>
                )}
                {insight.id === 'estoque' && (
                   <div className="space-y-3">
                      {topInsumos.map((ins, insIdx) => (
                        <div key={`insight-insumo-${ins.id}-${insIdx}`} className="flex justify-between items-center text-[10px] pb-2 border-b border-rose-900/50/50 font-bold uppercase">
                           <span className="text-gray-500">{ins.name}</span>
                           <span className={`font-mono ${ins.quantity < ins.criticalLimit ? 'text-rose-500' : 'text-rose-300'}`}>
                             {ins.quantity}{ins.unit}
                           </span>
                        </div>
                      ))}
                   </div>
                )}
                {insight.id === 'rentabilidade' && (
                  <div className="space-y-3">
                     {topRentable.map((p, rIdx) => (
                       <div key={`insight-rentable-${p.id}-${rIdx}`} className="flex justify-between items-center text-[10px] pb-2 border-b border-rose-900/50/50 font-bold uppercase">
                          <span className="text-gray-500">{p.product_name}</span>
                          <span className="text-emerald-500 font-mono">
                            { (p.retail_price > 0 ? ( (p.retail_price - (p.estimatedCost || 20)) / p.retail_price * 100 ) : 0).toFixed(0) }%
                          </span>
                       </div>
                     ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
};
