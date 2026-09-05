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
import { eventBus } from "../../services/eventBus";
import { matchesAtelierScope } from '../../services/atelierScopePolicy';
import { AtelierBadge } from './AtelierBadge';

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  companyId?: CompanyId;
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

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders = [],
  products = [],
  customers = [],
  companyId,
  onAction,
  onOpenOrder,
}) => {
  const filteredOrders = useMemo(() => companyId && companyId !== 'all' as any ? orders.filter(o => matchesAtelierScope(o, companyId, 'pedidos')) : orders, [orders, companyId]);
  const filteredProducts = useMemo(() => companyId && companyId !== 'all' as any ? products.filter(p => matchesAtelierScope(p, companyId, 'produtos')) : products, [products, companyId]);
  const filteredCustomers = useMemo(() => companyId && companyId !== 'all' as any ? customers.filter(c => matchesAtelierScope(c, companyId, 'clientes')) : customers, [customers, companyId]);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', category: 'personalizado' as 'global' | 'nacional' | 'regional' | 'personalizado' });
  const [liveEvents, setLiveEvents] = useState<any[]>([]);

  // Pre-populate with recent filteredOrders when filteredOrders load
  useEffect(() => {
    if (filteredOrders.length > 0 && liveEvents.length === 0) {
      const initial = filteredOrders.slice(0, 10).map(order => ({
        id: `initial-ev-${order.id}`,
        type: order.status === 'paid' || order.status === 'fully_paid' ? 'ORDER_PAID' : 'ORDER_CREATED',
        message: order.status === 'paid' || order.status === 'fully_paid' 
          ? `Pedido #${order.code || ''} de ${order.customerName} confirmado como PAGO!`
          : `Pedido #${order.code || ''} criado por ${order.customerName} - ${formatCurrency(order.total)}`,
        color: order.status === 'paid' || order.status === 'fully_paid' ? '#10B981' : '#3B82F6',
        badge: order.status === 'paid' || order.status === 'fully_paid' ? 'PAGO' : 'NOVO PEDIDO',
        timestamp: order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date()),
        rawData: order
      }));
      setLiveEvents(initial);
    }
  }, [filteredOrders]);

  // Subscribe to real-time eventBus events
  useEffect(() => {
    const addLiveEvent = (type: string, message: string, color: string, badge: string, rawData: any) => {
      const newEv = {
        id: `live-ev-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        color,
        badge,
        timestamp: new Date(),
        rawData
      };
      setLiveEvents(prev => [newEv, ...prev].slice(0, 20));
    };

    const unsubCreated = eventBus.on('ORDER_CREATED', ({ order }) => {
      addLiveEvent(
        'ORDER_CREATED',
        `Pedido #${order.code || ''} criado por ${order.customerName} - ${formatCurrency(order.total)}`,
        '#10B981',
        'NOVO PEDIDO',
        order
      );
    });

    const unsubPaid = eventBus.on('ORDER_PAID', ({ order }) => {
      addLiveEvent(
        'ORDER_PAID',
        `Pedido #${order.code || ''} de ${order.customerName} confirmado como PAGO!`,
        '#10B981',
        'PAGO',
        order
      );
    });

    const unsubUpdated = eventBus.on('ORDER_UPDATED', ({ order }) => {
      addLiveEvent(
        'ORDER_UPDATED',
        `Status do pedido #${order.code || ''} alterado para "${order.status}"`,
        '#3B82F6',
        'ATUALIZADO',
        order
      );
    });

    const unsubStock = eventBus.on('STOCK_LOW', ({ product, currentStock }) => {
      addLiveEvent(
        'STOCK_LOW',
        `Estoque de "${product.product_name}" caiu para ${currentStock} (crítico!)`,
        '#F59E0B',
        'ESTOQUE CRÍTICO',
        product
      );
    });

    const unsubClient = eventBus.on('CLIENT_CREATED', ({ customer }) => {
      addLiveEvent(
        'CLIENT_CREATED',
        `Novo cliente "${customer.name}" registrado no sistema`,
        '#8B5CF6',
        'NOVO CLIENTE',
        customer
      );
    });

    return () => {
      unsubCreated();
      unsubPaid();
      unsubUpdated();
      unsubStock();
      unsubClient();
    };
  }, []);

  // Fetch Checklist
  useEffect(() => {
    const q = companyId 
      ? query(collection(db, "checklist"), where("companyId", "==", companyId))
      : query(collection(db, "checklist"));
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
    let systemCommemorativeDates: any[] = [];
    
    // Subscribe to commemorative dates
    const unsubCommemorative = commemorativeDateService.subscribe((dates) => {
        systemCommemorativeDates = dates;
        updateEvents();
    });

    let customEvents: EventItem[] = [];

    const q = companyId 
      ? query(collection(db, "events"), where("companyId", "==", companyId))
      : query(collection(db, "events"));
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
    
    const monthOrders = filteredOrders.filter(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return isWithinInterval(date, { start, end }) && o.status !== 'cancelled';
    });

    const reached = monthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    const goal = 2500;
    const percent = Math.min(100, (reached / goal) * 100);
    const remaining = Math.max(0, goal - reached);

    return { reached, goal, percent, remaining };
  }, [filteredOrders]);

  // Total Sales and Faturamento
  const totalMetrics = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => !['cancelled', 'pending'].includes(o.status));
    const count = completedOrders.length;
    const revenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { count, revenue };
  }, [filteredOrders]);

  
  const atelierMetrics = useMemo(() => {
    const completedOrders = filteredOrders.filter(o => !['cancelled', 'pending'].includes(o.status));
    const companies = [
      { id: 'pallyra', name: 'La Pallyra' },
      { id: 'guennita', name: 'com amor, Guennita' },
      { id: 'mimada', name: 'Mimada Sim' },
      { id: 'tuttymimo', name: 'Tutty Mimo' },
      { id: 'madrinha', name: 'Madrinha' }
    ];

    return companies.map(company => {
      const companyOrders = completedOrders.filter(o => o.companyId === company.id);
      const count = companyOrders.length;
      const revenue = companyOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
      return { ...company, count, revenue };
    });
  }, [filteredOrders]);

  const activeOrders = useMemo(() => {
    return filteredOrders
      .filter(o => ['novo pedido', 'approval', 'waiting_payment', 'production', 'in_production', 'assembly', 'packaging', 'delivery'].includes(o.status))
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }, [filteredOrders]);

  const handleAddChecklistItem = async () => {
    if (!newChecklistItem.trim()) return;
    await addDoc(collection(db, "checklist"), {
      text: newChecklistItem,
      completed: false,
      companyId: companyId || 'empresa',
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
      companyId: companyId || 'empresa',
      createdAt: serverTimestamp()
    });
    setNewEvent({ title: '', date: '', category: 'personalizado' });
    setIsEventModalOpen(false);
  };


  return (
    <div className="space-y-10 pb-12 font-sans selection:bg-pink-100 selection:text-pink-900 relative">
      
      {/* BLOCO 01: META DO MÊS */}
      <section>
        <div className="clean-3d-card p-5 flex flex-col justify-between relative overflow-hidden group border border-slate-100">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50/30 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-pink-100/30 transition-colors" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-500/10 text-pink-500 flex items-center justify-center border border-pink-200/50 shadow-sm">
                  <Target size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Meta Mensal</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Objetivo de faturamento para o mês atual</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-gray-800">{monthlyMetrics.percent.toFixed(0)}%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Alcançado</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(monthlyMetrics.reached)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Restante</p>
                <p className="text-xl font-bold text-gray-800">{formatCurrency(monthlyMetrics.remaining)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Meta Fixa</p>
                <p className="text-xl font-bold text-gray-400">{formatCurrency(2500)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="w-full h-4 bg-gray-50 rounded-full border border-gray-100 overflow-hidden p-0.5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${monthlyMetrics.percent}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-pink-400 to-pink-600 shadow-[0_0_10px_rgba(255,20,147,0.3)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* BLOCO 02: CHECK LIST DIÁRIO */}
      <section>
        <div className="clean-3d-card p-5 flex flex-col h-[400px] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center border border-pink-200/50 shadow-sm">
                <CheckCircle2 size={20} strokeWidth={1.5} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Checklist Diário</h3>
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
                        ? 'bg-pink-500 border-pink-500 text-white' 
                        : 'bg-white border-gray-200 text-transparent hover:border-pink-500'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                  </button>
                  <span className={`text-sm font-medium flex-1 ${item.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                  <button 
                    onClick={() => deleteChecklistItem(item.id)}
                    className="p-2 text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
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
              className="flex-1 h-12 bg-white/60 border border-white/70 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
            />
            <button 
              onClick={handleAddChecklistItem}
              className="w-12 h-12 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* BLOCO 03: LISTA DE PEDIDOS ATIVOS (CARROSSEL) */}
      <section>
        <div className="clean-3d-card p-5 border border-slate-100">
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
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 ${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }`} style={{ 
                      boxShadow: `0 0 12px 1px ${
                        ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? '#FFD10060' :
                        ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? '#BD02FC60' :
                        ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? '#0080FF60' :
                        ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? '#FFFFFF60' :
                        ['novo pedido'].includes(order.status?.toLowerCase()) ? '#37FD1260' :
                        '#7FFF0060'
                      }`
                    }} />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">#{order.code}</span>
                          {order.companyId && <AtelierBadge companyId={order.companyId} size="xs" />}
                        </div>
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
                    <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl z-20 ${
                      ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100]' :
                      ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC]' :
                      ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF]' :
                      ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF]' :
                      ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12]' :
                      'bg-[#7FFF00]'
                    }`} style={{ 
                      boxShadow: `0 0 12px 1px ${
                        ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? '#FFD10060' :
                        ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? '#BD02FC60' :
                        ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? '#0080FF60' :
                        ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? '#FFFFFF60' :
                        ['novo pedido'].includes(order.status?.toLowerCase()) ? '#37FD1260' :
                        '#7FFF0060'
                      }`
                    }} />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400 font-mono">#{order.code}</span>
                          {order.companyId && <AtelierBadge companyId={order.companyId} size="xs" />}
                        </div>
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
        <div className="clean-3d-card p-5 border border-slate-100">
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
        <div className="clean-3d-card p-5 border border-slate-100">
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
        <div className="clean-3d-card p-6 flex flex-col items-center justify-center border border-slate-100 group">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Faturamento Total</h3>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-300 mr-2">R$</span>
            {Math.floor(totalMetrics.revenue).toString().padStart(6, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} color="emerald" />
            ))}
          </div>
        </div>

        {/* DIREITA: PEDIDOS CONCLUÍDOS */}
        <div className="clean-3d-card p-6 flex flex-col items-center justify-center border border-slate-100 group">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">Pedidos Concluídos</h3>
          <div className="flex items-center gap-2">
            {totalMetrics.count.toString().padStart(4, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} color="pink" />
            ))}
          </div>
        </div>
      </section>

      {/* BLOCO 07: FATURAMENTO & PEDIDOS POR ATELIÊ */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {atelierMetrics.map(atelier => (
          <div key={atelier.id} className="clean-3d-card p-4 flex flex-col justify-between border border-slate-100/50 relative overflow-hidden group">
            {/* Soft decorative background glow */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-slate-50 rounded-full blur-2xl opacity-50 pointer-events-none" />
            
            <div className="mb-4">
              <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest leading-tight truncate">{atelier.name}</h4>
              <div className="w-6 h-[2px] bg-slate-200 mt-2 rounded-full" />
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pedidos</p>
                <p className="text-sm font-black text-slate-700">{atelier.count.toString().padStart(2, '0')}</p>
              </div>
              
              <div>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Faturamento</p>
                <p className="text-sm font-black text-slate-700">{formatCurrency(atelier.revenue)}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* EVENT MODAL */}
      <AnimatePresence>
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1F1F1F]/15 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/90 backdrop-blur-2xl rounded-[28px] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] w-full max-w-md overflow-hidden border border-white/80"
            >
              <div className="p-6 border-b border-white/50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">Novo Evento</h2>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Título</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="w-full h-12 bg-white/60 border border-white/70 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner"
                    placeholder="Ex: Lançamento de Inverno"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Data</label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="w-full h-12 bg-white/60 border border-white/70 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner text-gray-700"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Categoria</label>
                  <select
                    value={newEvent.category}
                    onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value as any })}
                    className="w-full h-12 bg-white/60 border border-white/70 rounded-xl px-4 text-sm font-medium focus:outline-none focus:border-pink-300 focus:bg-white transition-all shadow-inner text-gray-700"
                  >
                    <option value="personalizado">Personalizado</option>
                    <option value="global">Global</option>
                    <option value="nacional">Nacional</option>
                    <option value="regional">Regional</option>
                  </select>
                </div>
                <button
                  onClick={handleCreateEvent}
                  className="w-full h-12 bg-gradient-to-b from-pink-400 to-pink-500 text-white rounded-xl font-bold mt-4 shadow-md hover:from-pink-500 hover:to-pink-600 transition-colors"
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
};

// COMPONENTES AUXILIARES

const FlipDigit = ({ digit, color = 'pink' }: { digit: string, color?: 'indigo' | 'emerald' | 'slate' | 'pink' }) => {
  return (
    <motion.div
      initial={{ y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-14 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-3d-soft border border-white/80 bg-white/80 backdrop-blur-md ${
        color === 'pink' ? 'text-pink-600' :
        color === 'emerald' ? 'text-emerald-600' :
        'text-gray-800'
      }`}
    >
      {digit}
    </motion.div>
  );
};
