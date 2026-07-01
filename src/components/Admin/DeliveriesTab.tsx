import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Clock, 
  Search, 
  Filter, 
  ChevronRight, 
  MoreHorizontal,
  FileText,
  CheckCircle2,
  AlertCircle,
  Hash,
  User,
  Calendar,
  Box,
  ArrowRight,
  Info,
  ExternalLink,
  Printer,
  Edit2,
  Check,
  Send,
  ShoppingBag,
  History,
  ClipboardList,
  Star,
  AlertTriangle,
  Archive,
  BarChart3,
  TrendingUp,
  X,
  Target
} from 'lucide-react';
import { Order, CompanyId, Product } from '../../types';
import { formatCurrency } from '../../lib/currencyUtils';
import { safeFormat } from '../../lib/dateUtils';
import { updateOrder } from '../../services/firebaseService';

interface DeliveriesTabProps {
  companyId: CompanyId;
  orders: Order[];
}

type DeliveryStage = 'ready' | 'packaging' | 'delivery' | 'delivered';

const STAGES: { id: DeliveryStage; label: string; color: string; icon: any }[] = [
  { id: 'ready', label: 'Pronto p/ Envio', color: 'indigo', icon: Box },
  { id: 'packaging', label: 'Em Separação', color: 'orange', icon: ClipboardList },
  { id: 'delivery', label: 'Em Transporte', color: 'sky', icon: Truck },
  { id: 'delivered', label: 'Entregue', color: 'emerald', icon: CheckCircle2 }
];

export const DeliveriesTab: React.FC<DeliveriesTabProps> = ({ companyId, orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showChecklist, setShowChecklist] = useState<string | null>(null);
  const [showRating, setShowRating] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    productsChecked: false,
    quantityCorrect: false,
    packagingApplied: false,
    personalizationChecked: false,
    internalNoteValidated: false
  });
  const [rating, setRating] = useState({
    quality: 5,
    time: 5,
    margin: 5,
    notes: ''
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (order.companyId !== companyId && companyId !== 'all' as any) return false;
      
      const relevantStatuses: Order['status'][] = ['ready', 'packaging', 'delivery', 'delivered', 'finalized'];
      if (!relevantStatuses.includes(order.status)) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          order.code.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term)
        );
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
      const dateB = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders, companyId, searchTerm]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status'], notes?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const historyEntry = {
      status: newStatus,
      timestamp: new Date(),
      notes: notes || `Status alterado para ${newStatus} no módulo de entregas.`
    };

    const updatedData: Partial<Order> = {
      status: newStatus,
      history: [...(order.history || []), historyEntry],
      updatedAt: new Date()
    };

    if (newStatus === 'delivered') {
      // Logic for delivered: update financial or timeline if needed
      updatedData.paymentStatus = order.paymentStatus === 'paid' ? 'paid' : order.paymentStatus;
    }

    await updateOrder(orderId, updatedData);
  };

  const handleFinalizeWithChecklist = async () => {
    if (!showChecklist) return;
    
    const orderId = showChecklist;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const nextStatusMap: Record<string, Order['status']> = {
      'ready': 'packaging',
      'packaging': 'delivery',
      'delivery': 'delivered'
    };

    const nextStatus = nextStatusMap[order.status] || 'delivery';

    await updateOrder(orderId, {
      status: nextStatus,
      deliveryChecklist: checklist,
      history: [...(order.history || []), {
        status: nextStatus,
        timestamp: new Date(),
        notes: `Conferência final concluída e pedido avançado para ${nextStatus}.`
      }],
      updatedAt: new Date()
    });

    setShowChecklist(null);
    setChecklist({
      productsChecked: false,
      quantityCorrect: false,
      packagingApplied: false,
      personalizationChecked: false,
      internalNoteValidated: false
    });
  };

  const handleFinalizeRating = async () => {
    if (!showRating) return;
    const orderId = showRating;
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    await updateOrder(orderId, {
      status: 'finalized',
      deliveryRating: rating,
      history: [...(order.history || []), {
        status: 'finalized',
        timestamp: new Date(),
        notes: 'Pedido avaliado internamente e arquivado no histórico.'
      }],
      updatedAt: new Date()
    });

    setShowRating(null);
  };

  const alerts = useMemo(() => {
    const now = new Date();
    return orders.filter(o => o.companyId === companyId || companyId === 'all' as any).map(o => {
      const alertsList = [];
      const updatedAt = o.updatedAt?.toDate?.() || new Date(o.updatedAt || 0);
      const diffHours = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

      if (o.status === 'ready' && diffHours > 24) {
        alertsList.push('Pedido pronto há mais de 24h mas não enviado.');
      }
      if (o.status === 'delivery' && diffHours > 72) {
        alertsList.push('Pedido em transporte há mais de 3 dias.');
      }
      if (o.status === 'delivered' && !o.deliveryChecklist) {
        alertsList.push('Entrega concluída sem registro de conferência.');
      }
      
      return { orderId: o.id, code: o.code, customerName: o.customerName, alerts: alertsList };
    }).filter(a => a.alerts.length > 0);
  }, [orders, companyId]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0 px-1">
        <div>
          <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
             <Truck size={24} className="text-emerald-500" /> Fluxo de Entregas
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Conferência, Envio e Finalização Operacional</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                type="text" 
                placeholder="Buscar pedido ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-2 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                {filteredOrders.length} EM FLUXO
              </span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Kanban Area */}
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
          {STAGES.map((stage) => {
            const stageOrders = filteredOrders.filter(o => o.status === stage.id || (stage.id === 'delivered' && o.status === 'finalized'));
            
            return (
              <div key={stage.id} className="flex flex-col min-w-[300px] w-full max-w-[350px] h-full bg-slate-50/50 rounded-3xl border border-slate-100/50 p-2">
                <div className="flex items-center justify-between p-4 mb-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg bg-${stage.color}-100 text-${stage.color}-600`}>
                      <stage.icon size={14} />
                    </div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">{stage.label}</h3>
                  </div>
                  <span className="text-xs font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                    {stageOrders.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 px-2 scrollbar-none pb-4">
                  {stageOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale">
                      <Package size={32} className="text-slate-300 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const timeInStatus = order.updatedAt?.toDate ? safeFormat(order.updatedAt.toDate(), "dd/MM HH:mm") : 'N/A';
                      const isFinalized = order.status === 'finalized';

                      return (
                        <div 
                          key={order.id} 
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-lg hover:border-emerald-300 group cursor-pointer relative overflow-hidden border-l-4 ${
                            stage.id === 'ready' ? 'border-l-indigo-500' : 
                            stage.id === 'packaging' ? 'border-l-orange-500' : 
                            stage.id === 'delivery' ? 'border-l-sky-500' : 'border-l-emerald-500'
                          } ${isFinalized ? 'opacity-60 grayscale-[0.5]' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">#{order.code}</span>
                                {order.deliveryType && (
                                  <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                                    {order.deliveryType}
                                  </span>
                                )}
                             </div>
                             {isFinalized && <CheckCircle2 size={14} className="text-emerald-500" />}
                          </div>

                          <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-1 truncate">
                            {order.customerName}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-4">
                             <MapPin size={12} className="text-slate-400" />
                             <p className="text-[10px] font-medium text-slate-500 truncate">
                                {order.address || 'Retirada na loja'}
                             </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                   <Clock size={10} />
                                   ATU: {timeInStatus}
                                </div>
                             </div>
                             
                             {!isFinalized && (
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   if (order.status === 'delivered') {
                                     setShowRating(order.id);
                                   } else {
                                     setShowChecklist(order.id);
                                   }
                                 }}
                                 className="p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-slate-200"
                               >
                                 <ArrowRight size={16} />
                               </button>
                             )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sidebar Alerts & Metrics */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-none">
           {/* Alerts */}
           {alerts.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5">
                 <div className="flex items-center gap-2 mb-4 text-amber-700">
                    <AlertTriangle size={18} />
                    <h3 className="text-sm font-black uppercase tracking-tight">Alertas de Entrega</h3>
                 </div>
                 <div className="space-y-3">
                    {alerts.slice(0, 5).map((a, idx) => (
                       <div key={idx} className="p-3 bg-white/60 border border-amber-200 rounded-2xl">
                          <p className="text-[10px] font-black text-amber-700 mb-1">#{a.code} - {a.customerName}</p>
                          <div className="space-y-1">
                            {a.alerts.map((msg, i) => (
                              <p key={i} className="text-[9px] font-bold text-slate-600 leading-tight">• {msg}</p>
                            ))}
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Metrics */}
           <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Eficiência de Entrega</h3>
                 
                 <div className="space-y-6">
                    <div className="flex items-end justify-between">
                       <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Taxa de Conclusão</p>
                          <p className="text-2xl font-black">
                            {orders.length > 0 ? Math.round((orders.filter(o => o.status === 'finalized').length / orders.length) * 100) : 0}%
                          </p>
                       </div>
                       <TrendingUp className="text-emerald-500 mb-1" size={20} />
                    </div>

                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black uppercase">
                          <span>Processo</span>
                          <span>{Math.round((filteredOrders.filter(o => o.status !== 'ready').length / (filteredOrders.length || 1)) * 100)}%</span>
                       </div>
                       <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500" 
                            style={{ width: `${(filteredOrders.filter(o => o.status !== 'ready').length / (filteredOrders.length || 1)) * 100}%` }} 
                          />
                       </div>
                    </div>
                 </div>
              </div>
              <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"></div>
           </div>

           {/* Quick Stats */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Em Trânsito</p>
                 <p className="text-xl font-black text-slate-900">
                    {orders.filter(o => o.status === 'delivery').length}
                 </p>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-4">
                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Entregues Hoje</p>
                 <p className="text-xl font-black text-emerald-600">
                    {orders.filter(o => o.status === 'delivered' && o.updatedAt?.toDate?.().toDateString() === new Date().toDateString()).length}
                 </p>
              </div>
           </div>
        </div>
      </div>

      {/* Checklist Modal */}
      <AnimatePresence>
        {showChecklist && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                         <Target size={20} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Conferência Final</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validar para avançar etapa</p>
                      </div>
                   </div>
                   <button onClick={() => setShowChecklist(null)} className="p-2 text-slate-300 hover:text-slate-900 transition-all">
                      <X size={20} />
                   </button>
                </div>

                <div className="p-8 space-y-4">
                   {[
                     { id: 'productsChecked', label: 'Produtos conferidos individualmente' },
                     { id: 'quantityCorrect', label: 'Quantidade total validada' },
                     { id: 'packagingApplied', label: 'Embalagem de envio aplicada' },
                     { id: 'personalizationChecked', label: 'Personalizações validadas' },
                     { id: 'internalNoteValidated', label: 'Nota interna / Recibo validado' },
                   ].map((item) => (
                     <label key={item.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all cursor-pointer group">
                        <input 
                          type="checkbox"
                          checked={(checklist as any)[item.id]}
                          onChange={(e) => setChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="w-5 h-5 rounded-lg border-2 border-slate-200 text-emerald-600 focus:ring-emerald-500/20 transition-all"
                        />
                        <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">{item.label}</span>
                     </label>
                   ))}
                </div>

                <div className="p-8 bg-slate-50 flex gap-3">
                   <button 
                     onClick={() => setShowChecklist(null)}
                     className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     disabled={!Object.values(checklist).every(v => v)}
                     onClick={handleFinalizeWithChecklist}
                     className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:shadow-none"
                   >
                     Confirmar Etapa
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post-Delivery Rating Modal */}
      <AnimatePresence>
        {showRating && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden"
             >
                <div className="p-8 border-b border-slate-100 text-center">
                   <div className="w-16 h-16 rounded-[2rem] bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                      <Star size={32} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900">Avaliação do Pedido</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise interna de performance</p>
                </div>

                <div className="p-8 space-y-8">
                   {[
                     { id: 'quality', label: 'Qualidade Final', icon: Box },
                     { id: 'time', label: 'Tempo de Resposta', icon: Clock },
                     { id: 'margin', label: 'Margem / Lucratividade', icon: TrendingUp },
                   ].map((metric) => (
                     <div key={metric.id}>
                        <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                              <metric.icon size={14} className="text-slate-400" />
                              <span className="text-[10px] font-black text-slate-400 uppercase">{metric.label}</span>
                           </div>
                           <span className="text-xs font-black text-slate-900">{(rating as any)[metric.id]} / 5</span>
                        </div>
                        <div className="flex gap-2">
                           {[1, 2, 3, 4, 5].map(val => (
                             <button 
                               key={val}
                               onClick={() => setRating(prev => ({ ...prev, [metric.id]: val }))}
                               className={`flex-1 h-2 rounded-full transition-all ${val <= (rating as any)[metric.id] ? 'bg-emerald-500' : 'bg-slate-100'}`}
                             />
                           ))}
                        </div>
                     </div>
                   ))}

                   <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-2">Notas Internas (Opcional)</span>
                      <textarea 
                        value={rating.notes}
                        onChange={(e) => setRating(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Observações sobre a produção ou entrega..."
                        className="w-full bg-slate-50 border-none rounded-2xl p-4 text-xs font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all min-h-[100px]"
                      />
                   </div>
                </div>

                <div className="p-8 bg-slate-50 flex gap-3">
                   <button 
                     onClick={() => setShowRating(null)}
                     className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-all"
                   >
                     Pular
                   </button>
                   <button 
                     onClick={handleFinalizeRating}
                     className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                   >
                     Finalizar e Arquivar
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Detail Modal - Placeholder or use existing logic if shared */}
      {selectedOrderId && (
        <OrderDetailsView 
          order={selectedOrder!}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
};

// Internal Order Details View (simplified for this context)
const OrderDetailsView = ({ order, isOpen, onClose }: { order: Order, isOpen: boolean, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div 
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        className="bg-white w-full max-w-4xl h-[90vh] sm:rounded-[3rem] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-900 font-black">
                 #{order.code.slice(-4)}
              </div>
              <div>
                 <h2 className="text-xl font-black text-slate-900">{order.customerName}</h2>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detalhes Logísticos do Pedido</p>
              </div>
           </div>
           <button onClick={onClose} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all">
              <X size={20} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                 {/* Items */}
                 <div className="bg-slate-50 rounded-[2rem] p-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Itens a Conferir</h3>
                    <div className="space-y-3">
                       {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-100">
                             <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                                <img src={item.image} className="w-full h-full object-cover" />
                             </div>
                             <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-900 truncate">{item.product_name}</p>
                                <p className="text-[10px] font-medium text-slate-500">Qtd: {item.quantity} • {item.selectedVariation || 'Padrão'}</p>
                             </div>
                             <div className="text-right shrink-0">
                                <p className="text-xs font-black text-slate-900">R$ {(item.current_price * item.quantity).toFixed(2)}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Address Info */}
                 <div className="bg-white border border-slate-100 rounded-[2rem] p-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Destino da Entrega</h3>
                    <div className="flex items-start gap-3">
                       <MapPin className="text-emerald-500 mt-1" size={18} />
                       <div>
                          <p className="text-sm font-bold text-slate-900">{order.address || 'NÃO INFORMADO'}</p>
                          <p className="text-xs text-slate-500 mt-1">Tipo: {order.deliveryType || 'Padrão'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 {/* Status Flow */}
                 <div className="bg-slate-900 text-white rounded-[2rem] p-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Status Operacional</h3>
                    <div className="space-y-4">
                       {['ready', 'packaging', 'delivery', 'delivered'].map((s, idx) => {
                          const isActive = order.status === s || (s === 'delivered' && order.status === 'finalized');
                          const isPast = ['ready', 'packaging', 'delivery', 'delivered', 'finalized'].indexOf(order.status) >= ['ready', 'packaging', 'delivery', 'delivered'].indexOf(s);
                          
                          return (
                             <div key={s} className={`flex items-center gap-3 ${isActive ? 'opacity-100' : isPast ? 'opacity-50' : 'opacity-20'}`}>
                                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-white'}`} />
                                <span className={`text-[10px] font-black uppercase ${isActive ? 'text-emerald-500' : ''}`}>
                                   {STAGES.find(stage => stage.id === s)?.label}
                                </span>
                             </div>
                          );
                       })}
                    </div>
                 </div>

                 {/* Finances */}
                 <div className="bg-white border border-slate-100 rounded-[2rem] p-6">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Financeiro</h3>
                    <div className="space-y-2">
                       <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Subtotal</span>
                          <span>R$ {(order.total - (order.shippingCost || 0)).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span>Frete</span>
                          <span>R$ {(order.shippingCost || 0).toFixed(2)}</span>
                       </div>
                       <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t">
                          <span>Total</span>
                          <span>R$ {order.total.toFixed(2)}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        <div className="p-8 bg-slate-50 flex justify-end shrink-0">
           <button onClick={onClose} className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
              Fechar Detalhes
           </button>
        </div>
      </motion.div>
    </div>
  );
};
