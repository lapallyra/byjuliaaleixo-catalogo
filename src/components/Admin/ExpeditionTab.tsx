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
  ClipboardList
} from 'lucide-react';
import { Order, CompanyId, Product } from '../../types';
import { formatCurrency } from '../../lib/currencyUtils';
import { safeFormat } from '../../lib/dateUtils';
import { updateOrder } from '../../services/firebaseService';

interface ExpeditionTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
}

type ExpeditionStatus = 'all' | 'waiting_expedition' | 'ready_for_shipping' | 'shipped' | 'delivered' | 'store_pickup';

export const ExpeditionTab: React.FC<ExpeditionTabProps> = ({ companyId, orders, products }) => {
  const [activeFilter, setActiveFilter] = useState<ExpeditionStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Mapping internal statuses to Expedition filters
  // Internal statuses: 'ready', 'delivery', 'delivered', 'novo pedido', 'production', etc.
  // We consider 'ready' as "Waiting Expedition" or "Store Pickup" depending on deliveryType
  
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Basic company filter
      if (order.companyId !== companyId && companyId !== 'all' as any) return false;
      
      // Filter out orders that are not yet ready for expedition (unless 'all' is selected)
      // Usually, only 'ready', 'delivery', 'delivered' are relevant for Expedition
      const relevantStatuses = ['ready', 'delivery', 'delivered'];
      if (!relevantStatuses.includes(order.status) && activeFilter !== 'all') return false;

      // Status Filter logic
      if (activeFilter === 'waiting_expedition') {
        if (order.status !== 'ready' || order.deliveryType === 'retirada') return false;
      } else if (activeFilter === 'ready_for_shipping') {
        if (order.status !== 'ready' || order.deliveryType === 'retirada') return false;
        // In a real app, maybe there's a sub-status for label generated.
      } else if (activeFilter === 'shipped') {
        if (order.status !== 'delivery') return false;
      } else if (activeFilter === 'delivered') {
        if (order.status !== 'delivered') return false;
      } else if (activeFilter === 'store_pickup') {
        if (order.deliveryType !== 'retirada' || order.status !== 'ready') return false;
      }

      // Search filter
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          order.code.toLowerCase().includes(term) ||
          order.customerName.toLowerCase().includes(term) ||
          order.contact.toLowerCase().includes(term)
        );
      }

      return true;
    }).sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
  }, [orders, companyId, activeFilter, searchTerm]);

  const selectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const getDeliveryMethodIcon = (type: Order['deliveryType']) => {
    switch (type) {
      case 'retirada': return <ShoppingBag size={14} />;
      case 'delivery': return <Truck size={14} />;
      case 'shipping': return <Package size={14} />;
      default: return <Package size={14} />;
    }
  };

  const getDeliveryMethodLabel = (type: Order['deliveryType']) => {
    switch (type) {
      case 'retirada': return 'Retirada na Loja';
      case 'delivery': return 'Motoboy / Delivery Local';
      case 'shipping': return 'Correios / Transportadora';
      default: return 'Não informado';
    }
  };

  const getStatusBadge = (order: Order) => {
    if (order.status === 'delivered') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-emerald-100 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
          Entregue
        </span>
      );
    }
    if (order.status === 'delivery') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-sky-100 shadow-[0_0_10px_rgba(14,165,233,0.15)]">
          <div className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse shadow-[0_0_5px_rgba(14,165,233,0.5)]" />
          Enviado
        </span>
      );
    }
    if (order.status === 'ready') {
      if (order.deliveryType === 'retirada') {
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-100 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
            Pronto p/ Retirada
          </span>
        );
      }
      return (
        <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border border-indigo-100 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
          Pronto p/ Envio
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider border border-slate-200">
        {order.status}
      </span>
    );
  };

  const handleUpdateStatus = async (orderId: string, newStatus: Order['status'], notes?: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const historyEntry = {
      status: newStatus,
      timestamp: new Date(),
      notes: notes || `Status alterado para ${newStatus} no módulo de expedição.`
    };

    const updatedHistory = [...(order.history || []), historyEntry];
    
    await updateOrder(orderId, { 
      status: newStatus,
      history: updatedHistory
    });
    
    // If it was the selected order, we might want to refresh details implicitly via props
  };

  const handleSaveTracking = async (orderId: string, trackingCode: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const historyEntry = {
      status: order.status,
      timestamp: new Date(),
      notes: `Código de rastreio informado: ${trackingCode}`
    };

    await updateOrder(orderId, { 
      trackingCode,
      history: [...(order.history || []), historyEntry]
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-medium text-[#1C1C1E] tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
              <Truck size={20} strokeWidth={1.5} />
            </div>
            Expedição & Logística
          </h2>
          <p className="text-[11px] font-bold text-[#8E8E93] uppercase tracking-wider mt-2 ml-13">
            Gestão de envios, retiradas e rastreamento
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93] group-focus-within:text-[#1C1C1E] transition-colors" size={16} />
          <input
            type="text"
            placeholder="Buscar por pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#E5E5EA] rounded-2xl py-3 pl-11 pr-4 text-xs font-medium focus:ring-2 focus:ring-[#1C1C1E]/5 outline-none transition-all placeholder:text-[#AEAEB2]"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'all', label: 'Todos', icon: ClipboardList },
          { id: 'waiting_expedition', label: 'Aguardando Expedição', icon: Clock },
          { id: 'ready_for_shipping', label: 'Prontos para Envio', icon: Box },
          { id: 'shipped', label: 'Enviados', icon: Truck },
          { id: 'delivered', label: 'Entregues', icon: CheckCircle2 },
          { id: 'store_pickup', label: 'Retirada na Loja', icon: ShoppingBag },
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as ExpeditionStatus)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.12em] whitespace-nowrap transition-all border ${
              activeFilter === filter.id 
                ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-[0_8px_20px_rgba(0,0,0,0.12)]' 
                : 'bg-white border-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] hover:border-[#1C1C1E]/20'
            }`}
          >
            <filter.icon size={13} strokeWidth={activeFilter === filter.id ? 2.5 : 2} />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`group relative bg-white border border-[#E5E5EA] rounded-[2.5rem] p-6 transition-all hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] hover:-translate-y-1 cursor-pointer overflow-hidden ${selectedOrderId === order.id ? 'ring-2 ring-[#1C1C1E]' : ''}`}
                onClick={() => setSelectedOrderId(order.id)}
              >
                {/* Visual LED status indicator */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-colors ${
                  order.status === 'delivered' ? 'bg-emerald-500' : 
                  order.status === 'delivery' ? 'bg-sky-500' : 
                  'bg-amber-500'
                }`} />

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] flex flex-col items-center justify-center text-[#1C1C1E] shadow-sm">
                      <Hash size={14} className="opacity-40" />
                      <span className="text-xs font-black tracking-tighter mt-0.5">{order.code.replace(/\D/g, '')}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1C1C1E] tracking-tight truncate max-w-[150px]">
                        {order.customerName}
                      </h4>
                      <p className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider mt-0.5 flex items-center gap-1.5">
                        {getDeliveryMethodIcon(order.deliveryType)}
                        {getDeliveryMethodLabel(order.deliveryType)}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(order)}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3.5 bg-[#F5F5F7]/50 border border-[#E5E5EA]/50 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-[#8E8E93] tracking-[0.15em] block mb-1">Previsão Envio</span>
                    <div className="flex items-center gap-2 text-[#1C1C1E]">
                      <Calendar size={12} className="opacity-40" />
                      <span className="text-[11px] font-bold tracking-tight">
                        {order.deliveryDate ? safeFormat(new Date(order.deliveryDate), "dd/MM/yyyy") : '---'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 bg-[#F5F5F7]/50 border border-[#E5E5EA]/50 rounded-2xl">
                    <span className="text-[8px] font-black uppercase text-[#8E8E93] tracking-[0.15em] block mb-1">Total Pedido</span>
                    <div className="flex items-center gap-2 text-[#1C1C1E]">
                      <Box size={12} className="opacity-40" />
                      <span className="text-[11px] font-black tracking-tight">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#E5E5EA]/50">
                  <div className="flex -space-x-2">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center overflow-hidden">
                        <img 
                          src={item.image} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=Prod')}
                        />
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-[#F5F5F7] shadow-sm flex items-center justify-center text-[8px] font-black text-[#8E8E93]">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  
                  <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1C1C1E] opacity-0 group-hover:opacity-100 transition-all">
                    Ver Detalhes <ArrowRight size={12} />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full h-80 flex flex-col items-center justify-center text-center p-10 bg-white border border-[#E5E5EA] border-dashed rounded-[3rem] opacity-60">
              <div className="w-16 h-16 rounded-[2rem] bg-[#F5F5F7] flex items-center justify-center text-[#8E8E93] mb-4">
                <Search size={24} strokeWidth={1} />
              </div>
              <p className="text-xs font-bold text-[#8E8E93] uppercase tracking-widest">Nenhum pedido encontrado nesta etapa</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Order Detail Drawer/Sidepanel */}
      <AnimatePresence>
        {selectedOrderId && selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrderId(null)}
              className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-[#F5F5F7] z-[110] shadow-2xl border-l border-[#E5E5EA] flex flex-col overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-8 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[1.5rem] bg-white border border-[#E5E5EA] shadow-sm flex items-center justify-center text-[#1C1C1E]">
                    <Package size={20} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#1C1C1E] tracking-tight">Pedido {selectedOrder.code}</h3>
                    <p className="text-[10px] font-black uppercase text-[#8E8E93] tracking-wider mt-0.5">Detalhes da Logística</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(selectedOrder)}
                  <button
                    onClick={() => setSelectedOrderId(null)}
                    className="p-3 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">
                {/* Expedition Actions Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button 
                    onClick={() => {
                      alert('Funcionalidade de geração de etiqueta em preparação para integração com Melhor Envio/Correios.');
                    }}
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#E5E5EA] rounded-3xl hover:shadow-md transition-all group"
                  >
                    <Printer size={18} className="text-[#8E8E93] group-hover:text-[#1C1C1E] transition-colors" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#8E8E93] group-hover:text-[#1C1C1E]">Gerar Etiqueta</span>
                  </button>
                  
                  {selectedOrder.status === 'ready' && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'delivery', 'Pedido marcado como enviado.')}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#E5E5EA] rounded-3xl hover:shadow-md transition-all group"
                    >
                      <Send size={18} className="text-sky-600 group-hover:text-sky-700 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#8E8E93] group-hover:text-sky-700">Marcar Enviado</span>
                    </button>
                  )}

                  {(selectedOrder.status === 'delivery' || (selectedOrder.status === 'ready' && selectedOrder.deliveryType === 'retirada')) && (
                    <button 
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered', selectedOrder.deliveryType === 'retirada' ? 'Pedido retirado na loja.' : 'Pedido marcado como entregue.')}
                      className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#E5E5EA] rounded-3xl hover:shadow-md transition-all group"
                    >
                      <CheckCircle2 size={18} className="text-emerald-600 group-hover:text-emerald-700 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#8E8E93] group-hover:text-emerald-700">
                        {selectedOrder.deliveryType === 'retirada' ? 'Finalizar Retirada' : 'Marcar Entregue'}
                      </span>
                    </button>
                  )}

                  <button 
                    className="flex flex-col items-center justify-center gap-2 p-4 bg-white border border-[#E5E5EA] rounded-3xl hover:shadow-md transition-all group"
                  >
                    <Edit2 size={18} className="text-[#8E8E93] group-hover:text-[#1C1C1E] transition-colors" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-[#8E8E93] group-hover:text-[#1C1C1E]">Editar Dados</span>
                  </button>
                </div>

                {/* Tracking Input */}
                {selectedOrder.deliveryType !== 'retirada' && (
                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Truck size={18} />
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Informações de Rastreio</h4>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={14} />
                        <input 
                          type="text" 
                          placeholder="Código de rastreamento..."
                          defaultValue={selectedOrder.trackingCode || ''}
                          onBlur={(e) => handleSaveTracking(selectedOrder.id, e.target.value)}
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold text-[#1C1C1E] focus:ring-2 focus:ring-[#1C1C1E]/5 outline-none transition-all"
                        />
                      </div>
                      <button className="px-6 bg-[#1C1C1E] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition-all active:scale-95">
                        Salvar
                      </button>
                    </div>
                    {selectedOrder.trackingCode && (
                      <div className="mt-4 p-3 bg-sky-50/50 border border-sky-100 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wide">Acompanhar entrega: {selectedOrder.trackingCode}</span>
                        <ExternalLink size={12} className="text-sky-700 cursor-pointer" />
                      </div>
                    )}
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer & Address */}
                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <User size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Dados do Cliente</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Nome Completo</span>
                        <p className="text-xs font-bold text-[#1C1C1E]">{selectedOrder.customerName}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Contato</span>
                        <p className="text-xs font-bold text-[#1C1C1E]">{selectedOrder.contact}</p>
                      </div>
                      {selectedOrder.deliveryType !== 'retirada' && (
                        <div>
                          <span className="text-[9px] font-black uppercase text-[#8E8E93] tracking-wider block mb-1">Endereço de Entrega</span>
                          <div className="flex gap-2">
                            <MapPin size={14} className="text-[#8E8E93] shrink-0 mt-0.5" />
                            <p className="text-xs font-bold text-[#1C1C1E] leading-relaxed">
                              {selectedOrder.address || 'Endereço não informado'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <FileText size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Resumo Financeiro</h4>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                        <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Produtos</span>
                        <span className="text-xs font-bold text-[#1C1C1E]">{formatCurrency(selectedOrder.total - (selectedOrder.shippingCost || 0))}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                        <span className="text-[10px] font-bold text-[#8E8E93] uppercase">Frete</span>
                        <span className="text-xs font-bold text-[#1C1C1E]">{formatCurrency(selectedOrder.shippingCost || 0)}</span>
                      </div>
                      {selectedOrder.discountAmount && (
                        <div className="flex justify-between items-center py-2 border-b border-[#F5F5F7]">
                          <span className="text-[10px] font-bold text-rose-500 uppercase">Desconto</span>
                          <span className="text-xs font-bold text-rose-500">-{formatCurrency(selectedOrder.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-[10px] font-black text-[#1C1C1E] uppercase tracking-wider">Total</span>
                        <span className="text-lg font-black text-[#1C1C1E]">{formatCurrency(selectedOrder.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Box size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Produtos do Pedido</h4>
                    </div>
                    <span className="text-[9px] font-black bg-[#F5F5F7] px-3 py-1 rounded-full text-[#8E8E93] uppercase tracking-widest">
                      {selectedOrder.items.length} ITENS
                    </span>
                  </div>
                  <div className="space-y-4">
                    {selectedOrder.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-[#F5F5F7]/30 border border-[#E5E5EA] rounded-[1.5rem] hover:bg-white transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-white border border-[#E5E5EA] overflow-hidden shadow-sm">
                            <img src={item.image} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-[#1C1C1E]">{item.product_name}</h5>
                            <p className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-widest mt-1">
                              Qtd: {item.quantity} • {item.selectedVariation || 'Padrão'}
                            </p>
                            {item.customization && (
                              <div className="mt-2 space-y-1">
                                {item.customization.name && (
                                  <p className="text-[10px] text-[#1C1C1E] font-medium">Nome: <span className="font-bold">{item.customization.name}</span></p>
                                )}
                                {item.customization.text && (
                                  <p className="text-[10px] text-[#1C1C1E] font-medium">Texto: <span className="font-bold">{item.customization.text}</span></p>
                                )}
                                {item.customization.notes && (
                                  <p className="text-[10px] text-[#8E8E93] italic">Obs: {item.customization.notes}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-[#1C1C1E]">{formatCurrency(item.current_price * item.quantity)}</p>
                          <p className="text-[9px] font-medium text-[#8E8E93] mt-0.5">{formatCurrency(item.current_price)} / un</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observations */}
                {selectedOrder.observations && (
                  <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <ClipboardList size={16} className="text-[#8E8E93]" />
                      <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Observações do Pedido</h4>
                    </div>
                    <div className="p-4 bg-amber-50/50 border border-amber-100/50 rounded-2xl">
                      <p className="text-xs font-medium text-[#3A312D] leading-relaxed italic opacity-80">
                        "{selectedOrder.observations}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Expedition Timeline */}
                <div className="bg-white border border-[#E5E5EA] rounded-[2.5rem] p-8 space-y-8 shadow-sm mb-10">
                  <div className="flex items-center gap-3">
                    <History size={16} className="text-[#1C1C1E]" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-[#1C1C1E]">Linha do Tempo da Expedição</h4>
                  </div>
                  
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#E5E5EA]">
                    {selectedOrder.history?.filter(h => ['ready', 'delivery', 'delivered'].includes(h.status) || h.notes?.includes('rastreio')).slice().reverse().map((event, idx) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-10 top-1 w-6 h-6 rounded-full border-4 border-white flex items-center justify-center shadow-sm z-10 ${
                          event.status === 'delivered' ? 'bg-emerald-500' : 
                          event.status === 'delivery' ? 'bg-sky-500' : 
                          'bg-[#1C1C1E]'
                        }`}>
                          {event.status === 'delivered' ? <Check size={10} className="text-white" /> : 
                           event.status === 'delivery' ? <Truck size={10} className="text-white" /> : 
                           <Package size={10} className="text-white" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#1C1C1E]">
                            {event.status === 'ready' ? 'Pronto para Expedição' : 
                             event.status === 'delivery' ? 'Objeto Postado / Saiu para Entrega' : 
                             event.status === 'delivered' ? 'Pedido Entregue' : event.status}
                          </span>
                          <span className="text-[9px] font-bold text-[#8E8E93] mt-0.5">
                            {event.timestamp ? safeFormat(event.timestamp.toDate ? event.timestamp.toDate() : new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm") : 'Data não informada'}
                          </span>
                          <p className="text-[11px] font-medium text-[#8E8E93] mt-2 italic leading-relaxed">
                            {event.notes}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Final Step placeholder if not delivered */}
                    {selectedOrder.status !== 'delivered' && (
                      <div className="relative opacity-30 grayscale">
                        <div className="absolute -left-10 top-1 w-6 h-6 rounded-full border-4 border-white bg-slate-200 flex items-center justify-center shadow-sm z-10">
                          <CheckCircle2 size={10} className="text-slate-400" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Entrega Finalizada</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-0.5">Aguardando confirmação</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Drawer Footer Actions */}
              <div className="p-8 bg-white border-t border-[#E5E5EA] flex items-center gap-4">
                <button 
                  onClick={() => setSelectedOrderId(null)}
                  className="flex-1 py-4 bg-[#F5F5F7] text-[#1C1C1E] rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#E5E5EA] transition-all"
                >
                  Fechar Painel
                </button>
                <button 
                  onClick={() => {
                    const waMsg = `Olá ${selectedOrder.customerName}, o seu pedido ${selectedOrder.code} já está pronto para ${selectedOrder.deliveryType === 'retirada' ? 'retirada' : 'envio'}. ${selectedOrder.trackingCode ? `O código de rastreio é: ${selectedOrder.trackingCode}` : ''}`;
                    const contact = selectedOrder.contact.replace(/\D/g, '');
                    window.open(`https://wa.me/${contact}?text=${encodeURIComponent(waMsg)}`, '_blank');
                  }}
                  className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-[0_8px_20px_rgba(16,185,129,0.25)] flex items-center justify-center gap-2"
                >
                  <Send size={14} /> Notificar Cliente
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
