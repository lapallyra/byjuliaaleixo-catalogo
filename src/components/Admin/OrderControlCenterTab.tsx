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
  MoreVertical,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { 
  Order, 
  CompanyId 
} from "../../types";
import { HorizontalScroll } from "../shared/HorizontalScroll";
import { db } from "../../lib/firebase";
import { updateOrder } from "../../services/firebaseService";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  serverTimestamp,
  arrayUnion
} from "firebase/firestore";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { calculateOrderPriority, getPriorityStyles, PriorityResult } from "../../utils/priorityUtils";

interface OrderControlCenterTabProps {
  companyId: CompanyId;
  onOpenOrder: (order: Order) => void;
}

// Map requested statuses to actual order statuses
const STAGES = [
  { id: 'payment', label: 'Pagamento', statuses: ['waiting_payment', 'novo pedido'], color: 'slate' },
  { id: 'pending_prod', label: 'Aguard. Produção', statuses: ['pending', 'approval', 'waiting_production'], color: 'orange' },
  { id: 'in_production', label: 'Em Produção', statuses: ['production', 'assembly'], color: 'blue' },
  { id: 'quality', label: 'Conferência / Pronto', statuses: ['ready', 'conferencing'], color: 'indigo' },
  { id: 'shipping', label: 'Em Entrega', statuses: ['packaging', 'delivery'], color: 'emerald' }
];

const STATUS_FLOW: Record<string, string> = {
  'waiting_payment': 'pending',
  'novo pedido': 'pending',
  'pending': 'waiting_production',
  'approval': 'waiting_production',
  'waiting_production': 'production',
  'production': 'assembly',
  'assembly': 'ready',
  'ready': 'packaging',
  'packaging': 'delivery',
  'delivery': 'delivered'
};

export const OrderControlCenterTab: React.FC<OrderControlCenterTabProps> = React.memo(({ companyId, onOpenOrder }) => {
  const [orders, setOrders] = useState<(Order & { priorityInfo: PriorityResult })[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "orders"), 
      where("companyId", "==", companyId),
      where("status", "not-in", ["delivered", "cancelled"])
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const ordersData = snap.docs.map(doc => {
        const data = { id: doc.id, ...doc.data() } as Order;
        return {
          ...data,
          priorityInfo: calculateOrderPriority(data)
        };
      });
      setOrders(ordersData);
      setLoading(false);
    });

    return () => unsub();
  }, [companyId]);

  const handleMoveStatus = async (order: Order) => {
    const nextStatus = STATUS_FLOW[order.status];
    if (!nextStatus) return;

    try {
      await updateOrder(order.id, {
        status: nextStatus as any,
        updatedAt: serverTimestamp() as any,
        history: arrayUnion({
          status: nextStatus,
          timestamp: new Date(),
          description: `Movimentação rápida via Centro de Controle`
        }) as any
      });
    } catch (error) {
      console.error("Error moving order:", error);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recommendedProductionOrder = useMemo(() => {
    return [...orders]
      .filter(o => ['waiting_production', 'production', 'assembly'].includes(o.status))
      .sort((a, b) => b.priorityInfo.score - a.priorityInfo.score)
      .slice(0, 5);
  }, [orders]);

  const urgentAlerts = useMemo(() => {
    return orders.filter(o => o.priorityInfo.priority === 'URGENTE' && ['waiting_production', 'pending'].includes(o.status));
  }, [orders]);

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in duration-500 overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
             <Zap size={24} className="text-amber-500 fill-amber-500" /> Centro de Controle
          </h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Inteligência Operacional em Tempo Real</p>
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
                {orders.length} Ativos
              </span>
           </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Kanban Board Area */}
        <HorizontalScroll className="flex-1 gap-4 pb-4">
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

                <div className="flex-1 overflow-y-auto space-y-3 px-2 scrollbar-none pb-4">
                  {stageOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 opacity-30 grayscale">
                      <Package size={32} className="text-slate-300 mb-2" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vazio</p>
                    </div>
                  ) : (
                    stageOrders.map((order) => {
                      const styles = getPriorityStyles(order.priorityInfo.priority);
                      const timeInStatus = order.updatedAt?.toDate ? formatDistanceToNow(order.updatedAt.toDate(), { locale: ptBR }) : 'N/A';

                      return (
                        <div 
                          key={order.id} 
                          className={`bg-white p-4 rounded-2xl border transition-all hover:shadow-lg hover:border-slate-300 group cursor-default relative overflow-hidden border-l-4 ${
                            order.priorityInfo.priority === 'URGENTE' ? 'border-l-rose-500' : 
                            order.priorityInfo.priority === 'ALTA' ? 'border-l-orange-500' : 
                            order.priorityInfo.priority === 'NORMAL' ? 'border-l-blue-500' : 'border-l-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase">#{order.code}</span>
                                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${styles.bg} ${styles.text}`}>
                                   <div className={`w-1 h-1 rounded-full ${styles.dot}`} />
                                   {order.priorityInfo.priority}
                                </div>
                             </div>
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
                             </p>
                          </div>

                          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                             <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase">
                                   <Clock size={10} />
                                   HA {timeInStatus.toUpperCase()}
                                </div>
                                <div className={`flex items-center gap-1 text-[10px] font-black mt-1 ${order.priorityInfo.isDelayed ? 'text-rose-600' : 'text-slate-900'}`}>
                                   {order.priorityInfo.remainingTime.toUpperCase()}
                                </div>
                             </div>
                             
                             {STATUS_FLOW[order.status] && (
                               <button 
                                 onClick={() => handleMoveStatus(order)}
                                 className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 shadow-lg shadow-slate-200"
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
        </HorizontalScroll>

        {/* Intelligence Panel Sidebar */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto pr-2 scrollbar-none">
           {/* Alerts */}
           {urgentAlerts.length > 0 && (
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5">
                 <div className="flex items-center gap-2 mb-4 text-rose-700">
                    <AlertTriangle size={18} />
                    <h3 className="text-sm font-black uppercase">Alertas Críticos</h3>
                 </div>
                 <div className="space-y-3">
                    {urgentAlerts.map(o => (
                       <div key={o.id} className="p-3 bg-white/60 border border-rose-200 rounded-2xl">
                          <p className="text-[10px] font-black text-rose-600 mb-1">#{o.code} - {o.customerName}</p>
                          <p className="text-[9px] font-bold text-slate-600">Pedido urgente sem produção iniciada!</p>
                          <button 
                            onClick={() => handleMoveStatus(o)}
                            className="mt-2 w-full py-1.5 bg-rose-600 text-white rounded-lg text-[9px] font-black hover:bg-rose-700 transition-colors"
                          >
                            INICIAR AGORA
                          </button>
                       </div>
                    ))}
                 </div>
              </div>
           )}

           {/* Recommended Production Order */}
           <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ordem Recomendada</h3>
                    <div className="px-2 py-1 bg-amber-500 rounded text-[9px] font-black text-black">TOP PRIORIDADE</div>
                 </div>
                 
                 <div className="space-y-4">
                    {recommendedProductionOrder.length === 0 ? (
                       <div className="py-8 text-center opacity-40">
                          <CheckCircle2 size={24} className="mx-auto mb-2" />
                          <p className="text-[10px] font-bold">Tudo em dia!</p>
                       </div>
                    ) : (
                       recommendedProductionOrder.map((o, idx) => (
                          <div key={o.id} className="flex items-start gap-3 relative">
                             <div className="w-5 h-5 bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">
                                {idx + 1}
                             </div>
                             <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                   <p className="text-xs font-bold truncate">{o.customerName}</p>
                                   <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${getPriorityStyles(o.priorityInfo.priority).bg} ${getPriorityStyles(o.priorityInfo.priority).text}`}>
                                      {o.priorityInfo.priority}
                                   </span>
                                </div>
                                <div className="flex items-center justify-between mt-1 opacity-60">
                                   <p className="text-[9px] font-medium">{o.priorityInfo.remainingTime}</p>
                                   <p className="text-[9px] font-bold">R$ {o.total.toFixed(0)}</p>
                                </div>
                             </div>
                          </div>
                       ))
                    )}
                 </div>

                 <button className="w-full mt-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-[10px] font-black flex items-center justify-center gap-2 transition-all">
                    Ver Plano de Produção <ArrowUpRight size={14} />
                 </button>
              </div>
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl"></div>
           </div>

           {/* Metrics */}
           <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Gargalos Agora</h3>
              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Atrasados</span>
                    <span className="text-xs font-black text-rose-600">{orders.filter(o => o.priorityInfo.isDelayed).length}</span>
                 </div>
                 <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Ticket Médio Ativo</span>
                    <span className="text-xs font-black text-slate-900">
                       R$ {(orders.reduce((acc, o) => acc + o.total, 0) / (orders.length || 1)).toFixed(0)}
                    </span>
                 </div>
                 <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-rose-500" style={{ width: `${(orders.filter(o => o.priorityInfo.priority === 'URGENTE').length / orders.length) * 100}%` }} />
                    <div className="h-full bg-orange-500" style={{ width: `${(orders.filter(o => o.priorityInfo.priority === 'ALTA').length / orders.length) * 100}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${(orders.filter(o => o.priorityInfo.priority === 'NORMAL').length / orders.length) * 100}%` }} />
                 </div>
                 <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                    <span>Urgente</span>
                    <span>Alta</span>
                    <span>Normal</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
});
