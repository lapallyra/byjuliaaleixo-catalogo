import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Phone, Calendar, Truck, CreditCard, 
  Edit, Trash2, User, 
  Clock, X, CheckCircle, Eye, Printer, Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, CompanyId, Product, Insumo } from '../../types';
import { safeFormat, safeFormatISO } from '../../lib/dateUtils';
import { formatCurrency } from '../../lib/currencyUtils';
import { OrderReceiptModal } from './OrderReceiptModal';

interface OrdersTabProps {
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  companyId: CompanyId;
  onUpdateStatus: (id: string, status: Order['status']) => void;
  onSaveOrder: (order: Partial<Order>) => void;
  onDeleteOrder: (id: string) => void;
  initialOrderId?: string | null;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ 
  orders, products, insumos, companyId, onUpdateStatus, onSaveOrder, onDeleteOrder, initialOrderId
}) => {
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const confirmDelete = () => {
    if (orderToDelete) {
      onDeleteOrder(orderToDelete);
      setOrderToDelete(null);
    }
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Partial<Order> | null>(null);
  const [selectedAteliers, setSelectedAteliers] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState<string | null>(initialOrderId || null);

  const atelieres = [
    { id: 'all', name: 'TODOS', prefix: 'ALL' },
    { id: 'pallyra', name: 'La Pallyra', prefix: 'LP' },
    { id: 'guennita', name: 'com amor, Guennita', prefix: 'CG' },
    { id: 'mimada', name: 'Mimada Sim', prefix: 'MS' },
  ];

  const statusOptions = [
    { value: 'novo pedido', label: 'NOVO PEDIDO', color: 'bg-purple-100/50 text-purple-600 border-purple-200' },
    { value: 'quote', label: 'ORÇAMENTO', color: 'bg-orange-100/50 text-orange-600 border-orange-200' },
    { value: 'approval', label: 'APROVAÇÃO DA ARTE', color: 'bg-indigo-100/50 text-indigo-600 border-indigo-200' },
    { value: 'waiting_deposit', label: 'AGUARDANDO SINAL', color: 'bg-yellow-100/50 text-yellow-700 border-yellow-300' },
    { value: 'production', label: 'EM PRODUÇÃO', color: 'bg-blue-100/50 text-blue-600 border-blue-200 shadow-[0_0_10px_rgba(59,130,246,0.1)]' },
    { value: 'assembly', label: 'EM MONTAGEM', color: 'bg-pink-100/50 text-pink-600 border-pink-200 shadow-[0_0_10px_rgba(236,72,153,0.1)]' },
    { value: 'ready', label: 'PRONTO PARA ENTREGA', color: 'bg-emerald-100/50 text-emerald-600 border-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.2)]' },
    { value: 'pending', label: 'PENDENTE', color: 'bg-yellow-100/50 text-yellow-600 border-yellow-200' },
    { value: 'delivered', label: 'ENTREGUE', color: 'bg-[#2b141e]/50 text-rose-300 border-rose-900/50' },
    { value: 'cancelled', label: 'CANCELADO', color: 'bg-[#2b141e]/50 text-rose-600 border-rose-200 shadow-[0_0_10px_rgba(239,68,68,0.1)]' },
  ];

  const statusLabels: Record<string, string> = {
    'novo pedido': 'Novo',
    'quote': 'Orçamento',
    'approval': 'Arte',
    'waiting_deposit': 'Sinal',
    'production': 'Produção',
    'assembly': 'Montagem',
    'ready': 'Pronto',
    'pending': 'Pendente',
    'delivered': 'Entregue',
    'cancelled': 'Cancelado'
  };

  const getDeliveryStatus = (deliveryDate: string, currentStatus: string) => {
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') return null;
    if (!deliveryDate) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const delivery = new Date(deliveryDate + 'T12:00:00');
    delivery.setHours(0, 0, 0, 0);
    
    const diffTime = delivery.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 3) {
      return { label: 'ATRASADO', color: 'bg-red-600 text-yellow-300 border-red-700 animate-pulse' };
    }
    if (diffDays <= 7) {
      return { label: 'ATENÇÃO', color: 'bg-yellow-400 text-red-700 border-yellow-500' };
    }
    return null;
  };

  const generateOrderCode = (cId: CompanyId) => {
    const prefixMap: Record<string, string> = {
      'pallyra': 'LP',
      'guennita': 'CG',
      'mimada': 'MS'
    };
    const prefix = prefixMap[cId] || 'XX';
    const randomNumbers = Math.floor(10000 + Math.random() * 90000);
    return `${prefix}${randomNumbers}`;
  };

  const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '').slice(0, 11);
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    return value;
  };

  useEffect(() => {
    if (initialOrderId) {
      setIsDetailOpen(initialOrderId);
      setSearchTerm(''); // Clear search if expanding a specific order
      setSelectedAteliers([]); // Show all by clearing selection
    }
  }, [initialOrderId]);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);
  
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (o.code || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAtelier = selectedAteliers.length === 0 ? true : selectedAteliers.includes(o.companyId || '');
    const matchesPayment = selectedPaymentStatuses.length === 0 ? true : selectedPaymentStatuses.includes(o.paymentStatus || 'pending');
    return matchesSearch && matchesAtelier && matchesPayment;
  }).sort((a, b) => {
    // Priority 1: Incomplete orders (not delivered/cancelled)
    const isInactiveA = ['delivered', 'cancelled'].includes(a.status);
    const isInactiveB = ['delivered', 'cancelled'].includes(b.status);
    if (isInactiveA !== isInactiveB) return isInactiveA ? 1 : -1;

    // Priority 2: Creation date (newest first) - To fix user's concern about "not appearing"
    const timeA = a.createdAt?.toMillis?.() || (a.createdAt as any)?.seconds * 1000 || Date.now();
    const timeB = b.createdAt?.toMillis?.() || (b.createdAt as any)?.seconds * 1000 || Date.now();
    return timeB - timeA;
  });

  const columns = [
    { id: 'budget', label: 'Orçamento', status: ['quote', 'novo pedido', 'waiting_deposit'] },
    { id: 'production', label: 'Produção', status: ['production', 'assembly', 'approval', 'pending'] },
    { id: 'done', label: 'Finalizado', status: ['ready', 'delivered'] },
  ];

  const getStatusType = (status: string) => {
    if (['ready', 'delivered'].includes(status)) return 'finished';
    if (['production', 'assembly', 'approval', 'pending'].includes(status)) return 'production';
    return 'budget';
  };

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Top Bar Refined */}
      <div className="flex flex-col lg:flex-row gap-6 justify-between items-center bg-[#140b0e] p-6 rounded-[1.5rem] border border-rose-900/30 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400" size={14} />
            <input 
              type="text" 
              placeholder="Pesquisar pedido..." 
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0b0507] border border-rose-900/30 text-[10px] uppercase font-semibold tracking-widest outline-none focus:border-[#C5A059] transition-all text-rose-100"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-[#0b0507] border border-rose-900/30 rounded-xl p-1">
             <button 
               onClick={() => setViewMode('kanban')}
               className={`px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-widest transition-all ${viewMode === 'kanban' ? 'bg-[#140b0e] text-[#C5A059] shadow-sm' : 'text-rose-300'}`}
             >
               Kanban
             </button>
             <button 
               onClick={() => setViewMode('list')}
               className={`px-3 py-1.5 rounded-lg text-[8px] font-semibold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-[#140b0e] text-[#C5A059] shadow-sm' : 'text-rose-300'}`}
             >
               Lista
             </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-center lg:justify-end">
           <div className="flex gap-2">
              {atelieres.filter(a => a.id !== 'all').map(atl => {
                const isSelected = selectedAteliers.includes(atl.id);
                return (
                  <button 
                    key={atl.id}
                    onClick={() => {
                        setSelectedAteliers(prev => 
                          prev.includes(atl.id) ? prev.filter(a => a !== atl.id) : [...prev, atl.id]
                        );
                    }}
                    className={`px-3 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest border transition-all ${isSelected ? 'bg-[#0b0507] border-[#C5A059] text-[#C5A059]' : 'bg-[#140b0e] border-rose-900/30 text-rose-300'}`}
                  >
                    {atl.prefix}
                  </button>
                );
              })}
           </div>
           
           <div className="h-6 w-px bg-[#F0E6D2] hidden sm:block" />

           <button 
            onClick={() => { setEditingOrder({ companyId: selectedAteliers.length === 1 ? (selectedAteliers[0] as CompanyId) : companyId }); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-[#C5A059] text-white font-semibold py-3 px-6 rounded-xl hover:scale-[1.02] transition-all shadow-[0_10px_20px_rgba(212,140,140,0.2)] text-[9px] uppercase tracking-widest"
          >
            <Plus size={16} /> Novo Pedido
          </button>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start min-h-[600px]">
          {columns.map((col) => {
            const colOrders = filteredOrders.filter(o => col.status.includes(o.status.toLowerCase()));
            return (
              <div key={col.id} className="flex flex-col h-full bg-[#0b0507]/50 rounded-[2rem] border border-rose-900/30 p-4">
                 <div className="flex items-center justify-between px-3 py-4 mb-4 border-b border-rose-900/30">
                    <div className="flex items-center gap-3">
                       <div className={`w-2 h-2 rounded-full ${col.id === 'done' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : col.id === 'production' ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]' : 'bg-[#C5A059]'}`} />
                       <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-rose-100">{col.label}</h3>
                    </div>
                    <span className="text-[8px] font-semibold text-rose-300 bg-[#140b0e] border border-rose-900/30 px-2 py-0.5 rounded-full">{colOrders.length}</span>
                 </div>

                 <div className="flex-1 space-y-4 overflow-y-auto max-h-[800px] scrollbar-hide pb-10">
                    {colOrders.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 bg-[#140b0e]/40 border border-dashed border-rose-900/30 rounded-2xl">
                         <Box size={24} className="text-rose-400 mb-2" />
                         <p className="text-[7px] font-semibold uppercase text-rose-400 tracking-widest">Coluna vazia</p>
                      </div>
                    )}
                    {colOrders.map((order, idx) => {
                      const delStatus = getDeliveryStatus(order.deliveryDate || '', order.status);
                      const isEmergency = delStatus?.label === 'ATRASADO' || order.isEmergency;
                      
                      return (
                        <motion.div 
                          key={order.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ y: -3 }}
                          onClick={() => setIsDetailOpen(isDetailOpen === order.id ? null : order.id)}
                          className={`bg-[#140b0e] p-5 rounded-[1.5rem] border transition-all cursor-pointer shadow-sm hover:shadow-[0_15px_30px_rgba(0,0,0,0.3)] group relative overflow-hidden ${isDetailOpen === order.id ? 'border-[#C5A059] ring-2 ring-[#D48C8C]/5' : 'border-rose-900/30'}`}
                        >
                           {isEmergency && (
                              <div className="absolute top-0 left-0 w-full h-1 bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                           )}
                           
                           <div className="flex justify-between items-start mb-3">
                              <span className="text-[8px] font-semibold text-rose-400 uppercase tracking-widest">#{order.code}</span>
                              <div className="flex items-center gap-1.5">
                                 {order.paymentStatus === 'paid' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]" title="Pago" />}
                                 {order.paymentStatus === 'pending' && <div className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,1)]" title="Pendente" />}
                                 <span className="text-[7px] font-semibold text-rose-300 uppercase tracking-widest">{order.companyId}</span>
                              </div>
                           </div>

                           <h4 className="text-[11px] font-semibold text-rose-100 uppercase mb-1 truncate">{order.customerName}</h4>
                           <div className="flex items-center gap-2 mb-4">
                              <span className={`text-[7px] font-semibold uppercase tracking-widest px-1.5 py-0.5 rounded ${statusOptions.find(s => s.value === order.status.toLowerCase())?.color || 'bg-[#2b141e]'}`}>
                                {statusLabels[order.status.toLowerCase()] || order.status}
                              </span>
                           </div>

                           <div className="flex items-center justify-between pt-3 border-t border-rose-900/30/50 text-rose-300">
                              <div className="flex items-center gap-1.5">
                                 <Calendar size={10} />
                                 <span className="text-[8px] font-semibold">{order.deliveryDate ? safeFormatISO(order.deliveryDate, 'dd/MM') : '--/--'}</span>
                              </div>
                              <p className="text-[10px] font-semibold text-rose-100">{formatCurrency(order.total || 0)}</p>
                           </div>
                        </motion.div>
                      );
                    })}
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.length === 0 && (
            <div className="py-20 text-center bg-[#140b0e] rounded-3xl border border-rose-900/30 text-rose-300 font-semibold uppercase tracking-widest text-[9px]">
              Nenhum pedido encontrado.
            </div>
          )}
          
          {filteredOrders.map((order, idx) => {
            const currentStatus = statusOptions.find(s => s.value === order.status.toLowerCase());
            
            return (
              <div 
                key={`order-card-${order.id}`}
                className="bg-[#140b0e] rounded-2xl border border-rose-900/30 shadow-sm transition-all hover:shadow-md overflow-hidden"
              >
                <div className="p-5 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6 w-full md:w-auto">
                      <div className="w-12 h-12 rounded-xl bg-[#0b0507] flex flex-col items-center justify-center border border-rose-900/30">
                          <span className="text-[7px] font-semibold uppercase text-rose-300 tracking-widest">PEDIDO</span>
                          <span className="text-[10px] font-semibold text-rose-100">#{order.code}</span>
                      </div>
                      <div>
                          <h3 className="text-[12px] font-semibold text-rose-100 uppercase tracking-tight">
                            {order.customerName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 underline-offset-4">
                            <span className="text-[9px] font-medium text-rose-300 flex items-center gap-1 uppercase tracking-widest"><Calendar size={10}/> {order.deliveryDate ? safeFormatISO(order.deliveryDate, 'dd/MM/yyyy') : 'N/A'}</span>
                          </div>
                      </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-center md:justify-start">
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-semibold tracking-widest border uppercase transition-shadow ${currentStatus?.color || 'bg-[#2b141e]'}`}>
                       {currentStatus?.label || order.status}
                     </span>
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-semibold tracking-widest border uppercase ${
                              order.paymentStatus === 'paid' ? 'bg-emerald-950/30 text-emerald-600 border-emerald-100 shadow-[0_0_10px_rgba(52,211,153,0.1)]' :
                              order.paymentStatus === 'cancelled' ? 'bg-[#1f0e16] text-rose-600 border-[#3e1b29]' :
                              order.paymentStatus === 'partial' ? 'bg-amber-950/30 text-amber-600 border-amber-100' :
                              'bg-orange-50 text-orange-600 border-orange-100 shadow-[0_0_10px_rgba(251,146,60,0.1)] animate-pulse'
                            }`}>
                       {order.paymentStatus === 'paid' ? 'PAGO' : order.paymentStatus === 'partial' ? 'PARCIAL' : order.paymentStatus === 'cancelled' ? 'CANC' : 'PENDENTE'}
                     </span>
                  </div>

                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                     <div className="text-right">
                        <p className="text-[8px] font-semibold uppercase text-rose-300 tracking-widest">Total</p>
                        <p className="text-xs font-semibold text-rose-100">{formatCurrency(order.total || 0)}</p>
                     </div>
                     <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPrintingOrder(order)}
                          className="p-3 rounded-xl bg-[#140b0e] text-rose-300 border border-rose-900/30 hover:text-[#C5A059] hover:bg-[#0b0507] transition-all" 
                        >
                          <Printer size={16} />
                        </button>
                        <button 
                          onClick={() => setIsDetailOpen(isDetailOpen === order.id ? null : order.id)}
                          className={`p-3 rounded-xl border transition-all ${isDetailOpen === order.id ? 'bg-[#C5A059] border-[#C5A059] text-white shadow-lg' : 'bg-[#140b0e] border-rose-900/30 text-rose-300 hover:bg-[#0b0507]'}`}
                        >
                          {isDetailOpen === order.id ? <X size={16} /> : <Eye size={16} />}
                        </button>
                        <button 
                          onClick={() => { setEditingOrder(order); setIsModalOpen(true); }}
                          className="p-3 rounded-xl bg-[#140b0e] border border-rose-900/30 text-rose-300 hover:text-[#C5A059] hover:bg-[#0b0507] transition-all"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => setOrderToDelete(order.id)}
                          className="p-3 rounded-xl bg-[#140b0e] border border-rose-900/30 text-rose-300 hover:text-red-500 hover:bg-red-50 transition-all font-semibold"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Overlay / In-line */}
      <AnimatePresence>
        {isDetailOpen && (
           <div 
             key="order-detail-overlay"
             className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
             onClick={() => setIsDetailOpen(null)}
           >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#140b0e] w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-rose-900/30 shadow-2xl p-12 relative scrollbar-hide"
              >
                  <button onClick={() => setIsDetailOpen(null)} className="absolute top-8 right-8 p-3 rounded-full hover:bg-[#0b0507] text-rose-300 transition-all"><X size={24}/></button>

                  {orders.find(o => o.id === isDetailOpen) && (
                    <div className="space-y-12">
                       {/* Header Detail */}
                       <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                          <div>
                             <div className="flex items-center gap-3 mb-4">
                               <span className="px-3 py-1 bg-[#0b0507] border border-rose-900/30 rounded-lg text-[10px] font-semibold text-rose-100 uppercase tracking-widest">Pedido #{orders.find(o => o.id === isDetailOpen)?.code}</span>
                               <span className="text-[10px] font-semibold uppercase text-[#C5A059] tracking-widest">{orders.find(o => o.id === isDetailOpen)?.companyId}</span>
                             </div>
                             <h2 className="text-3xl font-sans font-semibold text-rose-100 uppercase">{orders.find(o => o.id === isDetailOpen)?.customerName}</h2>
                             <div className="flex items-center gap-4 mt-6">
                                <a href={`tel:${orders.find(o => o.id === isDetailOpen)?.contact}`} className="flex items-center gap-2 text-rose-300 hover:text-[#C5A059] transition-all text-[11px] font-semibold uppercase tracking-widest">
                                   <Phone size={14} /> {orders.find(o => o.id === isDetailOpen)?.contact}
                                </a>
                                <div className="h-4 w-px bg-[#F0E6D2]" />
                                <div className="flex items-center gap-2 text-rose-300 text-[11px] font-semibold uppercase tracking-widest">
                                   <Calendar size={14} /> {orders.find(o => o.id === isDetailOpen)?.deliveryDate ? safeFormatISO(orders.find(o => o.id === isDetailOpen)!.deliveryDate!, 'dd/MM/yyyy') : 'N/A'}
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-3">
                             <div className="text-right">
                                <p className="text-[9px] font-semibold uppercase text-rose-300 tracking-[0.2em] mb-1">Status Atual</p>
                                <span className={`px-6 py-2 rounded-xl text-[10px] font-semibold tracking-widest border uppercase transition-shadow ${statusOptions.find(s => s.value === orders.find(o => o.id === isDetailOpen)?.status.toLowerCase())?.color || 'bg-[#2b141e]'}`}>
                                  {statusOptions.find(s => s.value === orders.find(o => o.id === isDetailOpen)?.status.toLowerCase())?.label || orders.find(o => o.id === isDetailOpen)?.status}
                                </span>
                             </div>
                             <div className="text-right mt-2">
                                <p className="text-[9px] font-semibold uppercase text-rose-300 tracking-[0.2em] mb-1">Total do Pedido</p>
                                <p className="text-3xl font-sans font-semibold text-rose-100">{formatCurrency(orders.find(o => o.id === isDetailOpen)?.total || 0)}</p>
                             </div>
                          </div>
                       </div>

                       {/* Products & Logistic */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-6">
                             <h3 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C5A059] border-b border-rose-900/30 pb-3">Itens Selecionados</h3>
                             <div className="space-y-3">
                                {orders.find(o => o.id === isDetailOpen)?.items?.map((item, i) => (
                                  <div key={i} className="flex justify-between items-center p-4 bg-[#0b0507] rounded-2xl border border-rose-900/30">
                                     <div>
                                        <p className="text-[11px] font-semibold text-rose-100 uppercase">{item.product_name}</p>
                                        <p className="text-[9px] text-rose-300 font-medium uppercase mt-0.5 tracking-wider">Quantidade: {item.quantity}</p>
                                     </div>
                                     <span className="text-[11px] font-semibold text-rose-100">{formatCurrency((item.retail_price || 0) * (item.quantity || 0))}</span>
                                  </div>
                                ))}
                             </div>
                             
                             <div className="bg-[#0b0507] p-5 rounded-2xl border border-rose-900/30 space-y-3">
                                <div className="flex justify-between text-[9px] font-semibold uppercase text-rose-300">
                                   <span>Subtotal</span>
                                   <span>{formatCurrency((orders.find(o => o.id === isDetailOpen)?.total || 0) - (orders.find(o => o.id === isDetailOpen)?.shippingCost || 0))}</span>
                                </div>
                                <div className="flex justify-between text-[9px] font-semibold uppercase text-rose-300">
                                   <span>Frete / Delivery</span>
                                   <span>{formatCurrency(orders.find(o => o.id === isDetailOpen)?.shippingCost || 0)}</span>
                                </div>
                                <div className="pt-3 border-t border-rose-900/30 flex justify-between text-[11px] font-semibold uppercase text-rose-100">
                                   <span>Total</span>
                                   <span>{formatCurrency(orders.find(o => o.id === isDetailOpen)?.total || 0)}</span>
                                </div>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <h3 className="text-[10px] font-semibold uppercase tracking-[0.4em] text-[#C5A059] border-b border-rose-900/30 pb-3">Logística & Observações</h3>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-[#0b0507] rounded-2xl border border-rose-900/30">
                                   <p className="text-[8px] font-semibold uppercase text-rose-300 tracking-widest mb-1">Entrega</p>
                                   <p className="text-[10px] font-semibold text-rose-100 uppercase">{orders.find(o => o.id === isDetailOpen)?.deliveryType}</p>
                                </div>
                                <div className="p-4 bg-[#0b0507] rounded-2xl border border-rose-900/30">
                                   <p className="text-[8px] font-semibold uppercase text-rose-300 tracking-widest mb-1">Pagamento</p>
                                   <p className="text-[10px] font-semibold text-[#C5A059] uppercase">{orders.find(o => o.id === isDetailOpen)?.paymentStatus}</p>
                                </div>
                             </div>
                             
                             <div className="p-5 bg-[#140b0e] border border-rose-900/30 rounded-2xl min-h-[100px]">
                                <p className="text-[8px] font-semibold uppercase text-rose-300 tracking-widest mb-3">Observações Adicionais</p>
                                <p className="text-[11px] text-rose-100 leading-relaxed italic">{orders.find(o => o.id === isDetailOpen)?.observations || 'Nenhuma observação informada.'}</p>
                             </div>

                             <div className="space-y-3">
                                <p className="text-[8px] font-semibold uppercase text-rose-300 tracking-widest">Alterar Fluxo do Pedido</p>
                                <div className="flex flex-wrap gap-2">
                                   {statusOptions.map(opt => (
                                     <button
                                       key={opt.value}
                                       onClick={() => onUpdateStatus(isDetailOpen!, opt.value as any)}
                                       className={`px-3 py-2 rounded-xl text-[8px] font-semibold uppercase tracking-widest border transition-all ${orders.find(o => o.id === isDetailOpen)?.status.toLowerCase() === opt.value ? 'bg-[#C5A059] border-[#C5A059] text-white' : 'bg-[#140b0e] text-rose-300 border-rose-900/30 hover:bg-[#0b0507]'}`}
                                     >
                                       {opt.label}
                                     </button>
                                   ))}
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  )}
              </motion.div>
           </div>
        )}
      </AnimatePresence>

      {/* Manual Order Modal Redesigned */}
      {isModalOpen && (
        <OrderFormModal 
          editingOrder={editingOrder}
          products={products}
          companyId={companyId}
          onClose={() => setIsModalOpen(false)}
          onSave={async (data) => {
            const atelier = data.companyId || companyId;
            const fullData = {
              ...data,
              id: editingOrder?.id,
              code: editingOrder?.code || generateOrderCode(atelier as any),
              companyId: atelier as CompanyId,
              source: (editingOrder?.source || 'admin') as any
            };
            await onSaveOrder(fullData);
            setIsModalOpen(false);
          }}
        />
      )}

      {printingOrder && (
        <OrderReceiptModal 
          order={printingOrder} 
          onClose={() => setPrintingOrder(null)} 
        />
      )}
      {orderToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#140b0e] max-w-md w-full rounded-3xl p-8 text-center animate-in zoom-in-95">
            <Trash2 size={48} className="mx-auto text-rose-500 mb-6" />
            <h3 className="text-xl font-black mb-2 uppercase">Excluir Pedido?</h3>
            <p className="text-sm text-gray-500 mb-8">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setOrderToDelete(null)}
                className="flex-1 py-4 bg-[#2b141e] rounded-2xl font-black text-gray-500 uppercase text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-xs shadow-lg shadow-rose-500/30"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface OrderFormModalProps {
  editingOrder: Partial<Order> | null;
  products: Product[];
  companyId: string;
  onClose: () => void;
  onSave: (data: Partial<Order>) => void;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({ editingOrder, products, companyId, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(editingOrder?.items || []);
  const [shipping, setShipping] = useState(editingOrder?.shippingCost || 0);
  const [isDepositPaid, setIsDepositPaid] = useState(editingOrder?.hasSignal || false);
  const [observations, setObservations] = useState(editingOrder?.observations || '');
  const [selectedAtelier, setSelectedAtelier] = useState<CompanyId>((editingOrder?.companyId as CompanyId) || (companyId as CompanyId));
  const [cpfCnpj, setCpfCnpj] = useState(editingOrder?.customerCpfCnpj || '');
  const [deliveryType, setDeliveryType] = useState(editingOrder?.deliveryType || 'pickup');
  const [isWholesale, setIsWholesale] = useState(editingOrder?.isWholesale || false);

  const subtotal = items.reduce((sum, it) => sum + (it.retail_price * it.quantity), 0);
  const totalWithShipping = subtotal + shipping;
  const depositValue = subtotal * 0.5;

  const maskCpfCnpj = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 11) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4").slice(0, 14);
    return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5").slice(0, 18);
  };

  const companiesList = [
    { id: 'pallyra', name: 'La Pallyra' },
    { id: 'guennita', name: 'com amor, Guennita' },
    { id: 'mimada', name: 'Mimada Sim' },
  ];

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
       <div className="bg-[#140b0e]   w-full   max-w-4xl   max-h-[90vh] overflow-y-auto rounded-[2rem] border border-lilac/30 p-8 md:p-10 shadow-2xl   relative max-h-[90vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-8 right-8 p-2 rounded-full hover:bg-[#2b141e] text-rose-300 transition-all"
          ><X size={24} /></button>

          <h2 className="text-xl font-black text-rose-50 uppercase tracking-widest mb-8">
            {editingOrder?.id ? 'Editar Pedido' : 'Novo Pedido'}
          </h2>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
              const formData = new FormData(e.currentTarget);
              await onSave({
                customerName: formData.get('customerName') as string,
                contact: formData.get('contact') as string,
                customerCpfCnpj: cpfCnpj,
                address: formData.get('address') as string,
                total: totalWithShipping,
                status: formData.get('status') as any,
                deliveryDate: formData.get('deliveryDate') as string,
                deliveryType: deliveryType as any,
                shippingCost: shipping,
                observations: observations,
                hasSignal: isDepositPaid,
                signalValue: depositValue,
                items,
                isWholesale: isWholesale,
                isEmergency: formData.get('isEmergency') === 'on',
                companyId: selectedAtelier
              });
              onClose();
            } catch (err) {
              console.error("Erro ao salvar pedido:", err);
              alert("Erro ao salvar pedido.");
            } finally {
              setLoading(false);
            }
          }} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Escolher Ateliê</label>
                <select 
                  value={selectedAtelier}
                  onChange={(e) => setSelectedAtelier(e.target.value as CompanyId)}
                  className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50"
                >
                  {companiesList.map((c, cIdx) => <option key={`company-opt-${c.id}-${cIdx}`} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Nome do Cliente</label>
                <input name="customerName" defaultValue={editingOrder?.customerName} required type="text" className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">CPF / CNPJ</label>
                <input 
                  value={cpfCnpj} 
                  onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                  placeholder="000.000.000-00"
                  required
                  type="text" 
                  className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Contato</label>
                <input name="contact" defaultValue={editingOrder?.contact} required type="text" placeholder="(44) 9 9999-9999" className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Endereço Completo</label>
                <input name="address" defaultValue={editingOrder?.address} required type="text" placeholder="Rua, Número, Bairro, Cidade" className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Tipo de Entrega</label>
                <select 
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as any)}
                  className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none text-rose-50"
                >
                  <option value="pickup">RETIRADA</option>
                  <option value="delivery">DELIVERY</option>
                  <option value="shipping">ENVIO</option>
                </select>
              </div>
            </div>

            {deliveryType === 'shipping' && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                 <label className="text-[9px] uppercase font-black text-blue-400 tracking-widest block mb-2">Custo do Frete (R$)</label>
                 <input 
                   type="number" 
                   step="0.01" 
                   value={shipping} 
                   onChange={(e) => setShipping(Number(e.target.value))}
                   className="w-full bg-[#140b0e] border border-blue-200 rounded-xl px-5 py-3 text-[11px] font-black outline-none font-mono text-blue-600" 
                 />
              </div>
            )}

            {/* Incluir Produto Select */}
            <div className="p-6 rounded-2xl bg-lilac/5 border border-lilac/10 space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-[10px] font-black uppercase text-lilac tracking-widest">Produtos Selecionados</h4>
                <div className="text-[10px] font-black text-rose-50">Ateliê: {selectedAtelier.toUpperCase()}</div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <select 
                  onChange={(e) => {
                    const p = products.find(prod => prod.id === e.target.value);
                    if (p) {
                      const existingIdx = items.findIndex(i => i.id === p.id);
                      if (existingIdx !== -1) {
                        const newItems = [...items];
                        newItems[existingIdx].quantity = (newItems[existingIdx].quantity || 1) + 1;
                        setItems(newItems);
                      } else {
                        setItems([...items, { ...p, quantity: 1 }]);
                      }
                    }
                    e.target.value = "";
                  }}
                  className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-4 py-3 text-[11px] font-bold outline-none"
                >
                  <option value="">+ Adicionar Produto do Catálogo...</option>
                  {products.filter(p => p.company === selectedAtelier).map((p, pIdx) => <option key={`prod-opt-${p.id}-${pIdx}`} value={p.id}>{p.product_name} - {formatCurrency(p.retail_price)}</option>)}
                </select>
              </div>

              {items.map((item, idx) => (
                <div key={`edit-cart-item-${item.id || 'new'}-${idx}`} className="flex items-center gap-4 bg-[#140b0e] p-3 rounded-xl border border-lilac/10 shadow-sm">
                   <span className="flex-1 text-[11px] font-bold text-gray-700">{item.product_name}</span>
                   <div className="flex items-center gap-2">
                     <span className="text-[9px] font-bold text-rose-300">QTD:</span>
                     <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[idx].quantity = Number(e.target.value);
                        setItems(newItems);
                      }}
                      className="w-16 bg-[#140b0e] border border-lilac/10 rounded-lg px-2 py-1 text-[11px] font-black text-center"
                     />
                   </div>
                   <span className="text-[11px] font-mono font-black text-rose-50 w-24 text-right">{formatCurrency((item.retail_price || 0) * (item.quantity || 0))}</span>
                   <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600 p-1"><Trash2 size={16} /></button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Data de Entrega / Evento</label>
                <input name="deliveryDate" defaultValue={editingOrder?.deliveryDate || safeFormat(new Date(), 'yyyy-MM-dd')} required type="date" className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none text-rose-50" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Status Inicial</label>
                <select name="status" defaultValue={editingOrder?.status || 'novo pedido'} className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-black outline-none text-rose-50">
                  <option value="novo pedido" className="text-purple-500">NOVO PEDIDO</option>
                  <option value="quote" className="text-gray-500">ORÇAMENTO</option>
                  <option value="approval" className="text-indigo-500">APROVAÇÃO DA ARTE</option>
                  <option value="waiting_deposit" className="text-amber-500">AGUARDANDO SINAL</option>
                  <option value="production" className="text-blue-500">EM PRODUÇÃO</option>
                  <option value="assembly" className="text-pink-500">EM MONTAGEM</option>
                  <option value="ready" className="text-emerald-500">PRONTO PARA ENTREGA</option>
                  <option value="delivered" className="text-rose-50">ENTREGUE</option>
                  <option value="cancelled" className="text-rose-500">CANCELADO</option>
                </select>
              </div>
            </div>

            {/* Checkcards for Payment/Delivery */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div 
                 onClick={() => setIsWholesale(!isWholesale)}
                 className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isWholesale ? 'bg-amber-950/30 border-amber-500' : 'bg-[#140b0e] border-lilac/10 text-rose-300'}`}
               >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isWholesale ? 'bg-amber-500 border-amber-500' : 'border-rose-900/50'}`}>
                    {isWholesale && <CheckCircle className="text-white" size={12} />}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isWholesale ? 'text-amber-700' : ''}`}>Pedido de Atacado</p>
                    <p className={`text-[8px] font-bold ${isWholesale ? 'text-amber-600' : ''}`}>Aplica aviso de atacado no comprovante</p>
                  </div>
               </div>

               <div 
                onClick={() => setIsDepositPaid(!isDepositPaid)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${isDepositPaid ? 'bg-emerald-950/30 border-emerald-500' : 'bg-[#140b0e] border-lilac/10 text-rose-300'}`}
               >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isDepositPaid ? 'bg-emerald-500 border-emerald-500' : 'border-rose-900/50'}`}>
                    {isDepositPaid && <CheckCircle className="text-white" size={12} />}
                  </div>
                  <div>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDepositPaid ? 'text-emerald-700' : ''}`}>Sinal Pago (50%)</p>
                    <p className={`text-[9px] font-bold ${isDepositPaid ? 'text-emerald-600' : ''}`}>{formatCurrency(depositValue || 0)}</p>
                  </div>
               </div>
               
               <div className="p-4 rounded-xl border border-lilac/10 bg-black text-white flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-300">Total a Pagar</p>
                    <p className="text-lg font-mono font-black">{formatCurrency(totalWithShipping || 0)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-rose-300">{isDepositPaid ? 'Restante' : 'Subtotal'}</p>
                    <p className="text-[11px] font-mono font-black text-lilac">{formatCurrency((isDepositPaid ? totalWithShipping - depositValue : totalWithShipping) || 0)}</p>
                  </div>
               </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-black text-rose-300 tracking-widest pl-2">Observações do Pedido</label>
              <textarea 
                value={observations} 
                onChange={(e) => setObservations(e.target.value)}
                className="w-full bg-[#140b0e] border border-lilac/20 rounded-xl px-5 py-3 text-[11px] font-bold outline-none h-24 text-rose-50 resize-none" 
                placeholder="Ex regular: Tamanho M, Cor Rosa, Nome Julia..." 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose} disabled={loading} className="flex-1 py-4 border border-lilac/10 rounded-xl font-bold uppercase text-[10px] tracking-widest text-rose-300 hover:bg-[#140b0e] transition-all">Cancelar</button>
              <button type="submit" disabled={loading} className="flex-1 py-4 bg-black text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] shadow-xl transition-all disabled:opacity-50">
                {loading ? 'Salvando...' : 'Salvar Pedido'}
              </button>
            </div>
          </form>
       </div>
    </div>
  );
};
