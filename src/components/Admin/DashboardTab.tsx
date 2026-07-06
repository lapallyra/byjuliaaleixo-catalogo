import React, { useState, useMemo, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  Users,
  Archive,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Package,
  Activity,
  ArrowRight,
  Truck,
  Plus,
  Trash2,
  Sun,
  Cloud,
  Moon,
  Sparkles,
  Zap,
  Target,
  X
} from "lucide-react";
import { 
  format, 
  startOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  subMonths,
  addDays,
  isAfter,
  isBefore
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Order, 
  Product, 
  Customer, 
  CompanyId, 
  PurchaseOrder, 
  Componente,
  Campaign 
} from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";
import { db, auth } from "../../lib/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  serverTimestamp,
  getDocs,
  orderBy
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { HorizontalScroll } from "../shared/HorizontalScroll";
import { commemorativeDateService } from "../../services/commemorativeDateService";
import { subscribeToCampaigns } from "../../services/firebaseService";

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  companyId: CompanyId;
  onAction: (action: any) => void;
  onOpenOrder: (order: Order) => void;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  companyId: string;
}

interface EventItem {
  id: string;
  title: string;
  date: Date;
  category: 'global' | 'nacional' | 'regional' | 'personalizado';
}

export const DashboardTab: React.FC<DashboardTabProps> = React.memo(({
  orders = [],
  products = [],
  customers = [],
  companyId,
  onAction,
  onOpenOrder,
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', category: 'personalizado' as 'global' | 'nacional' | 'regional' | 'personalizado' });

  // Fetch Checklist
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "checklist"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => {
      setChecklist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistItem)));
    });
    return () => unsub();
  }, [companyId]);

  // Fetch Campaigns
  useEffect(() => {
    const unsub = subscribeToCampaigns(setCampaigns);
    return () => unsub();
  }, []);

  // Fetch Events (Mocked base + custom from Firestore + commemorative dates)
  useEffect(() => {
    if (!companyId) return;

    let systemCommemorativeDates: any[] = [];
    
    // Subscribe to commemorative dates
    const unsubCommemorative = commemorativeDateService.subscribe((dates) => {
        systemCommemorativeDates = dates;
        updateEvents();
    });

    let customEvents: EventItem[] = [];

    const q = query(collection(db, "events"), where("companyId", "==", companyId));
    const unsubEvents = onSnapshot(q, (snap) => {
      customEvents = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() ? doc.data().date.toDate() : new Date(doc.data().date)
      } as EventItem));
      updateEvents();
    });

    const updateEvents = () => {
      const currentYear = new Date().getFullYear();
      
      const mapCommemorativeDates = (year: number) => {
          return systemCommemorativeDates.map(c => {
             const month = c.month.toString().padStart(2, '0');
             const day = c.day.toString().padStart(2, '0');
             return {
                 id: `commemorative-${c.id}-${year}`,
                 title: c.name,
                 date: new Date(`${year}-${month}-${day}T00:00:00`),
                 category: c.categoryId === 'global' ? 'global' : c.categoryId === 'national' ? 'nacional' : 'regional'
             }
          });
      };

      const generateBaseEvents = (year: number): EventItem[] => [
        // Globais
        { id: `c-anonovo-${year}`, title: 'Confraternização Universal (Ano Novo)', date: new Date(`${year}-01-01`), category: 'global' },
        { id: `c-diamulher-${year}`, title: 'Dia Internacional da Mulher', date: new Date(`${year}-03-08`), category: 'global' },
        { id: `c-consumidor-${year}`, title: 'Dia do Consumidor', date: new Date(`${year}-03-15`), category: 'global' },
        { id: `c-trabalhador-${year}`, title: 'Dia do Trabalhador', date: new Date(`${year}-05-01`), category: 'global' },
        { id: `c-amigo-${year}`, title: 'Dia do Amigo', date: new Date(`${year}-07-20`), category: 'global' },
        { id: `c-halloween-${year}`, title: 'Halloween', date: new Date(`${year}-10-31`), category: 'global' },
        { id: `c-natal-${year}`, title: 'Natal', date: new Date(`${year}-12-25`), category: 'global' },
        { id: `c-reveillon-${year}`, title: 'Véspera de Ano Novo', date: new Date(`${year}-12-31`), category: 'global' },
        
        // Nacionais
        { id: `c-indio-${year}`, title: 'Dia dos Povos Indígenas', date: new Date(`${year}-04-19`), category: 'nacional' },
        { id: `c-tiradentes-${year}`, title: 'Tiradentes', date: new Date(`${year}-04-21`), category: 'nacional' },
        { id: `c-descobrimento-${year}`, title: 'Descobrimento do Brasil', date: new Date(`${year}-04-22`), category: 'nacional' },
        { id: `c-maes-${year}`, title: 'Dia das Mães', date: new Date(`${year}-05-10`), category: 'nacional' },
        { id: `c-namorados-${year}`, title: 'Dia dos Namorados', date: new Date(`${year}-06-12`), category: 'nacional' },
        { id: `c-saojoao-${year}`, title: 'Dia de São João', date: new Date(`${year}-06-24`), category: 'nacional' },
        { id: `c-avos-${year}`, title: 'Dia dos Avós', date: new Date(`${year}-07-26`), category: 'nacional' },
        { id: `c-pais-${year}`, title: 'Dia dos Pais', date: new Date(`${year}-08-09`), category: 'nacional' },
        { id: `c-independencia-${year}`, title: 'Independência do Brasil', date: new Date(`${year}-09-07`), category: 'nacional' },
        { id: `c-cliente-${year}`, title: 'Dia do Cliente', date: new Date(`${year}-09-15`), category: 'nacional' },
        { id: `c-arvore-${year}`, title: 'Dia da Árvore', date: new Date(`${year}-09-21`), category: 'nacional' },
        { id: `c-criancas-${year}`, title: 'Nossa Senhora Aparecida / Crianças', date: new Date(`${year}-10-12`), category: 'nacional' },
        { id: `c-professores-${year}`, title: 'Dia do Professor', date: new Date(`${year}-10-15`), category: 'nacional' },
        { id: `c-finados-${year}`, title: 'Finados', date: new Date(`${year}-11-02`), category: 'nacional' },
        { id: `c-republica-${year}`, title: 'Proclamação da República', date: new Date(`${year}-11-15`), category: 'nacional' },
        { id: `c-bandeira-${year}`, title: 'Dia da Bandeira', date: new Date(`${year}-11-19`), category: 'nacional' },
        { id: `c-consciencia-${year}`, title: 'Dia da Consciência Negra', date: new Date(`${year}-11-20`), category: 'nacional' },
      ];

      const baseEvents = [
        ...generateBaseEvents(currentYear),
        ...generateBaseEvents(currentYear + 1),
        ...mapCommemorativeDates(currentYear),
        ...mapCommemorativeDates(currentYear + 1)
      ];

      // Remove duplicates by title, keeping the first occurrence (earliest date)
      const allPossibleEvents = [...baseEvents, ...customEvents];
      allPossibleEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

      const uniqueEventsMap = new Map();
      allPossibleEvents.forEach(e => {
        if (!uniqueEventsMap.has(e.title)) {
          uniqueEventsMap.set(e.title, e);
        }
      });

      const allEvents = Array.from(uniqueEventsMap.values())
        .filter(e => {
          const sixtyDaysFromNow = addDays(new Date(), 60);
          return isAfter(e.date, subDays(new Date(), 1)) && isBefore(e.date, sixtyDaysFromNow);
        })
        .sort((a, b) => a.date.getTime() - b.date.getTime());

      setEvents(allEvents);
    };

    return () => {
        unsubCommemorative();
        unsubEvents();
    };
  }, [companyId]);

  // Metrics: Monthly Goal (R$ 2.500,00)
  const monthlyMetrics = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    
    const monthOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return isWithinInterval(date, { start, end }) && o.status !== 'cancelled';
    });

    const reached = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const goal = 2500;
    const percent = Math.min(100, (reached / goal) * 100);
    const remaining = Math.max(0, goal - reached);

    return { reached, goal, percent, remaining };
  }, [orders]);

  // Total Sales and Faturamento
  const totalMetrics = useMemo(() => {
    const completedOrders = orders.filter(o => !['cancelled', 'pending'].includes(o.status));
    const count = completedOrders.length;
    const revenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { count, revenue };
  }, [orders]);

  const activeOrders = useMemo(() => {
    return orders
      .filter(o => ['novo pedido', 'approval', 'waiting_payment', 'production', 'in_production', 'assembly', 'packaging', 'delivery'].includes(o.status))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }, [orders]);

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    await addDoc(collection(db, "checklist"), {
      text: newChecklistItem,
      completed: false,
      companyId,
      createdAt: serverTimestamp()
    });
    setNewChecklistItem("");
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    await updateDoc(doc(db, "checklist", item.id), {
      completed: !item.completed
    });
  };

  const deleteChecklistItem = async (id: string) => {
    await deleteDoc(doc(db, "checklist", id));
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.date) return;
    await addDoc(collection(db, "events"), {
      title: newEvent.title,
      date: new Date(newEvent.date),
      category: newEvent.category,
      companyId,
      createdAt: serverTimestamp()
    });
    setNewEvent({ title: '', date: '', category: 'personalizado' });
    setIsEventModalOpen(false);
  };


  return (
    <div className="space-y-10 pb-12 font-sans selection:bg-indigo-100 selection:text-indigo-900 relative">
      
      {/* BLOCO 01: META DO MÊS */}
      <section>
        <div className="clean-3d-card p-8 flex flex-col justify-between relative overflow-hidden group border border-slate-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-100/50 transition-colors" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-3d-deep">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Meta Mensal</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo de faturamento para o mês atual</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{monthlyMetrics.percent.toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alcançado</p>
                <p className="text-xl font-black text-emerald-600">{formatCurrency(monthlyMetrics.reached)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restante</p>
                <p className="text-xl font-black text-slate-900">{formatCurrency(monthlyMetrics.remaining)}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta Fixa</p>
                <p className="text-xl font-black text-slate-400">{formatCurrency(2500)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full h-4 bg-slate-50 rounded-full border border-slate-100 overflow-hidden p-0.5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${monthlyMetrics.percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 02: CHECK LIST DIÁRIO */}
      <section>
        <div className="clean-3d-card p-8 flex flex-col h-[400px] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-3d-deep">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Checklist Diário</h3>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-3 mb-6">
            <AnimatePresence mode="popLayout">
              {checklist.sort((a, b) => Number(a.completed) - Number(b.completed)).map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 group"
                >
                  <button 
                    onClick={() => toggleChecklistItem(item)}
                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      item.completed 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'bg-white border-slate-200 text-transparent hover:border-emerald-500'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <span className={`text-sm font-medium flex-1 ${item.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              placeholder="Adicionar tarefa..."
              className="flex-1 h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner"
            />
            <button 
              onClick={handleAddChecklistItem}
              className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* BLOCO 03: LISTA DE PEDIDOS ATIVOS (CARROSSEL) */}
      <section>
        <div className="clean-3d-card p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center shadow-3d-deep">
                <ShoppingBag size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Pedidos Ativos</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeOrders.length} EM ANDAMENTO</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LADO ESQUERDO (Top 10) */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {activeOrders.slice(0, 10).map((order) => (
                  <motion.div
                    layout
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onOpenOrder(order)}
                    className="relative clean-3d-card bg-white p-4 pl-10 border border-slate-50 group cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className={`led-strip rounded-l-[28px] ${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }`} />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono">#{order.code}</span>
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{order.customerName}</h4>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* LADO DIREITO (11-20) */}
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {activeOrders.slice(10, 20).map((order) => (
                  <motion.div
                    layout
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => onOpenOrder(order)}
                    className="relative clean-3d-card bg-white p-4 pl-10 border border-slate-50 group cursor-pointer hover:shadow-lg transition-all"
                  >
                    <div className={`led-strip rounded-l-[28px] ${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }`} />
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 font-mono">#{order.code}</span>
                        <h4 className="text-sm font-black text-slate-900 line-clamp-1">{order.customerName}</h4>
                      </div>
                      <p className="text-sm font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeOrders.length <= 10 && (
                <div className="h-full flex items-center justify-center opacity-10 border-2 border-dashed border-slate-200 rounded-3xl">
                  <p className="text-[10px] font-black uppercase tracking-widest">Espaço para mais pedidos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 04: MINI CARDS CAMPANHAS */}
      <section>
        <div className="clean-3d-card p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-3d-deep">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Campanhas</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {campaigns.length > 0 ? campaigns.slice(0, 4).map(campaign => (
              <div key={campaign.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2 inline-block ${
                  campaign.active ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  {campaign.active ? 'Ativa' : 'Programada'}
                </span>
                <h4 className="text-xs font-black text-slate-900 mb-1">{campaign.title}</h4>
                <p className="text-[10px] text-slate-400">{campaign.type}</p>
              </div>
            )) : (
              [1,2,3,4].map(i => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 opacity-40">
                  <div className="w-12 h-2 bg-slate-200 rounded-full mb-3" />
                  <div className="w-full h-3 bg-slate-200 rounded-full" />
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* BLOCO 05: MINI CARDS EVENTOS */}
      <section>
        <div className="clean-3d-card p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-3d-deep">
                <Calendar size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Eventos Próximos</h3>
            </div>
            <button onClick={() => setIsEventModalOpen(true)} className="p-2 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
              <Plus size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {events.slice(0, 6).map((event) => (
              <div key={event.id} className="p-4 bg-white border border-slate-100 rounded-2xl hover:border-amber-200 transition-all shadow-sm">
                <h4 className="text-[11px] font-black text-slate-900 mb-2 line-clamp-1">{event.title}</h4>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-amber-600 uppercase">{format(event.date, "dd MMM", { locale: ptBR })}</span>
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    event.category === 'global' ? 'bg-sky-400' : event.category === 'nacional' ? 'bg-emerald-400' : 'bg-pink-400'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCO 06: FATURAMENTO & PEDIDOS CONCLUÍDOS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LADO ESQUERDO: FATURAMENTO */}
        <div className="clean-3d-card p-10 flex flex-col items-center justify-center border border-slate-100 group">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Faturamento Total</h3>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-300 mr-2">R$</span>
            {Math.floor(totalMetrics.revenue).toString().padStart(6, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} color="emerald" />
            ))}
          </div>
        </div>

        {/* DIREITA: PEDIDOS CONCLUÍDOS */}
        <div className="clean-3d-card p-10 flex flex-col items-center justify-center border border-slate-100 group">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Pedidos Concluídos</h3>
          <div className="flex items-center gap-2">
            {totalMetrics.count.toString().padStart(4, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} color="pink" />
            ))}
          </div>
        </div>
      </section>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900">Novo Evento</h2>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Título</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner"
                    placeholder="Ex: Lançamento de Inverno"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Data</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner text-slate-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Categoria</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-indigo-300 focus:bg-white transition-all shadow-inner text-slate-700"
                  >
                    <option value="personalizado">Personalizado</option>
                    <option value="global">Global</option>
                    <option value="nacional">Nacional</option>
                    <option value="regional">Regional</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateEvent}
                  className="w-full h-12 bg-indigo-600 text-white rounded-xl font-bold mt-4 shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors"
                >
                  Salvar Evento
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});

// COMPONENTES AUXILIARES

const FlipDigit = ({ digit, color = 'indigo' }: { digit: string, color?: 'indigo' | 'emerald' | 'slate' | 'pink' }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-14 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-3d-soft border border-slate-100 ${
        color === 'indigo' ? 'bg-indigo-600 text-white' :
        color === 'emerald' ? 'bg-emerald-600 text-white' :
        color === 'pink' ? 'bg-pink-500 text-white' :
        'bg-slate-900 text-white'
      }`}
    >
      {digit}
    </motion.div>
  );
};
