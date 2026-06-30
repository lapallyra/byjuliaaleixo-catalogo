import React, { useState, useMemo, useEffect } from "react";
import { 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  ArrowRight, 
  Package, 
  User, 
  DollarSign, 
  Settings, 
  Search,
  CheckCircle2,
  Zap,
  MoreVertical
} from "lucide-react";
import { 
  Order, 
  CompanyId 
} from "../../types";
import { db } from "../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderControlCenterTabProps {
  companyId: CompanyId;
  onOpenOrder: (order: Order) => void;
}

// Map requested statuses to actual order statuses
const STAGES = [
  { id: 'payment', label: 'Pagamento', statuses: ['waiting_payment', 'novo pedido'], color: 'slate' },
  { id: 'pending_prod', label: 'Aguard. Produção', statuses: ['pending', 'approval'], color: 'orange' },
  { id: 'in_production', label: 'Em Produção', statuses: ['production', 'assembly'], color: 'blue' },
  { id: 'quality', label: 'Em Conferência', statuses: ['ready'], color: 'indigo' },
  { id: 'shipping', label: 'Pronto p/ Entrega', statuses: ['packaged', 'shipped_waiting'], color: 'emerald' }
];

const STATUS_FLOW: Record<string, string> = {
  'waiting_payment': 'pending',
  'novo pedido': 'pending',
  'pending': 'production',
  'approval': 'production',
  'production': 'assembly',
  'assembly': 'ready',
  'ready': 'packaged',
  'packaged': 'delivered'
};

export const OrderControlCenterTab: React.FC<OrderControlCenterTabProps> = ({ companyId, onOpenOrder }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Note: status not-in delivered/cancelled works in firestore if status is a string
    const q = query(
      collection(db, "orders"), 
      where("companyId", "==", companyId),
      where("status", "not-in", ["delivered", "cancelled"])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);

  const handleMoveStatus = async (order: Order) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    try {
      const orderRef = doc(db, "orders", order.id);
      await updateDoc(orderRef, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
        history: arrayUnion({
          status: nextStatus,
          timestamp: new Date(),
          description: `Movimentação rápida via Centro de Controle`
        })
      });
    } catch (error) {
      console.error("Error moving order:", error);
    }
  };

  const getUrgency = (deliveryDate?: string) => {
    if (!deliveryDate) return 'normal';
    try {
        const date = new Date(deliveryDate);
        if (isNaN(date.getTime())) return 'normal';
        const diff = differenceInDays(date, new Date());
        
        if (diff < 0) return 'critical';
        if (diff <= 2) return 'warning';
        return 'normal';
    } catch (e) {
        return 'normal';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Zap size={24} className="text-amber-500 fill-amber-500" /> Operação ao Vivo
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Acompanhamento Operacional em Tempo Real</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por código ou cliente..." 
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 transition-all w-64 shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
                {orders.length} Pedidos Ativos
              </span>
           </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200">
        {STAGES.map((stage) => {
          const stageOrders = filteredOrders.filter(o => stage.statuses.includes(o.status));
          
          return (
            <div key={stage.id} className="flex flex-col min-w-[300px] w-full max-w-[350px] h-full bg-slate-50/50 rounded-3xl border border-slate-100/50 p-2">
              <div className="flex items-center justify-between p-4 mb-2 shrink-0">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full bg-${stage.color}-500`} />
                   <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">{stage.label}</h3>
                </div>
                <span className="text-xs font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                  {stageOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 px-2 scrollbar-none">
                {stageOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale">
                    <Package size={32} className="text-slate-300 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sem pedidos</p>
                  </div>
                ) : (
                  stageOrders.map((order) => {
                    const urgency = getUrgency(order.deliveryDate);
                    const timeInStatus = order.updatedAt?.toDate ? formatDistanceToNow(order.updatedAt.toDate(), { locale: ptBR }) : 'N/A';

                    return (
                      <div 
                        key={order.id} 
                        className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-lg hover:border-slate-300 group cursor-default relative overflow-hidden ${
                          urgency === 'critical' ? 'border-l-4 border-l-rose-500' : 
                          urgency === 'warning' ? 'border-l-4 border-l-amber-500' : 'border-l-4 border-l-emerald-500'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                           <span className="text-[10px] font-black text-slate-400 uppercase">#{order.code}</span>
                           <button onClick={() => onOpenOrder(order)} className="p-1 text-slate-300 hover:text-slate-900 transition-colors">
                              <MoreVertical size={14} />
                           </button>
                        </div>

                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 truncate">
                          {order.customerName}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-4">
                           <Package size={12} className="text-slate-400" />
                           <p className="text-[10px] font-medium text-slate-500 truncate">
                              {order.items?.[0]?.product_name || 'Personalizado'}
                              {order.items && order.items.length > 1 && ` + ${order.items.length - 1} itens`}
                           </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                           <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                 <Clock size={10} />
                                 HÁ {timeInStatus.toUpperCase()}
                              </div>
                              <div className="flex items-center gap-1 text-[10px] font-black text-slate-900 mt-1">
                                 {order.deliveryDate || 'SEM PRAZO'}
                              </div>
                           </div>
                           
                           {STATUS_FLOW[order.status] && (
                             <button 
                               onClick={() => handleMoveStatus(order)}
                               className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-lg shadow-slate-200"
                               title="Avançar para próximo estágio"
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
    </div>
  );
};
