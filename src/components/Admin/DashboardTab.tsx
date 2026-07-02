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
  Componente 
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

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders = [],
  products = [],
  customers = [],
  companyId,
  onAction,
  onOpenOrder,
}) => {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [user, setUser] = useState(auth.currentUser);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', date: '', category: 'personalizado' as 'global' | 'nacional' | 'regional' | 'personalizado' });

  // Dynamic Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Bom dia";
    if (hour >= 12 && hour < 18) return "Boa tarde";
    return "Boa noite";
  }, []);

  const todayFormatted = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  // Fetch Checklist
  useEffect(() => {
    if (!companyId) return;
    const q = query(collection(db, "checklist"), where("companyId", "==", companyId));
    const unsub = onSnapshot(q, (snap) => {
      setChecklist(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistItem)));
    });
    return () => unsub();
  }, [companyId]);

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
        
        // Profissões
        { id: `c-jornalista-${year}`, title: 'Dia do Jornalista', date: new Date(`${year}-04-07`), category: 'nacional' },
        { id: `c-enfermagem-${year}`, title: 'Dia da Enfermagem', date: new Date(`${year}-05-12`), category: 'nacional' },
        { id: `c-advogado-${year}`, title: 'Dia do Advogado', date: new Date(`${year}-08-11`), category: 'nacional' },
        { id: `c-psicologo-${year}`, title: 'Dia do Psicólogo', date: new Date(`${year}-08-27`), category: 'nacional' },
        { id: `c-veterinario-${year}`, title: 'Dia do Médico Veterinário', date: new Date(`${year}-09-09`), category: 'nacional' },
        { id: `c-secretaria-${year}`, title: 'Dia da Secretária', date: new Date(`${year}-09-30`), category: 'nacional' },
        { id: `c-medico-${year}`, title: 'Dia do Médico', date: new Date(`${year}-10-18`), category: 'nacional' },
        { id: `c-dentista-${year}`, title: 'Dia do Dentista', date: new Date(`${year}-10-25`), category: 'nacional' },
        { id: `c-arquiteto-${year}`, title: 'Dia do Arquiteto', date: new Date(`${year}-12-15`), category: 'nacional' },
        
        // Regional (Querência do Norte - PR)
        { id: `c-qn-aniversario-${year}`, title: 'Aniversário de Querência do Norte - PR', date: new Date(`${year}-11-26`), category: 'regional' },
        { id: `c-qn-padroeiro-${year}`, title: 'Padroeiro de Querência do Norte - PR', date: new Date(`${year}-06-26`), category: 'regional' },
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
      {/* Background ambient blobs for glassmorphism */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-300/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none mix-blend-multiply" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-300/20 rounded-full blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none mix-blend-multiply" />
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {greeting}, Julia Aleixo
            </span>
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Sparkles className="text-amber-400" size={24} />
            </motion.div>
          </div>
          <p className="text-slate-500 font-bold text-sm capitalize">{todayFormatted}</p>
        </div>

        {/* Weather Mock */}
        <div className="flex items-center gap-4 clean-3d-card p-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-inner relative z-10">
            <Sun size={24} />
          </div>
          <div className="text-right relative z-10">
            <div className="text-lg font-black text-slate-900 drop-shadow-sm">28°C</div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ensolarado</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* BLOCO 01: META DO MÊS */}
        <div className="lg:col-span-2 clean-3d-card p-8 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-emerald-100/50 transition-colors" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-3d-deep">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Meta do Mês</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Faturamento mensal planejado</p>
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Objetivo</p>
                <p className="text-xl font-black text-slate-400">{formatCurrency(monthlyMetrics.goal)}</p>
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
              {monthlyMetrics.reached >= monthlyMetrics.goal && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-xs font-black text-emerald-600 uppercase tracking-widest"
                >
                  Meta alcançada 🎉
                </motion.p>
              )}
            </div>
          </div>
        </div>

        {/* BLOCO 02: AÇÕES RÁPIDAS */}
        <div className="clean-3d-card p-8 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Ações Rápidas</h3>
          <div className="grid grid-cols-1 gap-4">
            <button onClick={() => onAction('orders')} className="clean-3d-button w-full justify-start">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
              Novo Pedido
            </button>
            <button onClick={() => onAction('customers')} className="clean-3d-button w-full justify-start">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Users size={16} />
              </div>
              Novo Cliente
            </button>
            <button onClick={() => onAction('stock')} className="clean-3d-button w-full justify-start">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Package size={16} />
              </div>
              Novo Insumo
            </button>
            <button onClick={() => onAction('products')} className="clean-3d-button w-full justify-start">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                <Archive size={16} />
              </div>
              Novo Produto
            </button>
          </div>
        </div>
      </div>

      {/* BLOCO 03: PEDIDOS ATIVOS & CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ESQUERDA: PEDIDOS ATIVOS */}
        <div className="clean-3d-card p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-3d-deep">
                <Zap size={20} />
              </div>
              <h3 className="text-lg font-black text-slate-900">Pedidos Ativos</h3>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{activeOrders.length} EM ANDAMENTO</span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 pr-2">
            <AnimatePresence mode="popLayout">
              {activeOrders.map((order) => (
                <motion.div
                  layout
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => onOpenOrder(order)}
                  className="relative clean-3d-card bg-white p-5 pl-8 border-l-0 group cursor-pointer hover:shadow-lg transition-all"
                >
                  <div className={`led-strip rounded-l-[28px] ${
                    ['em produção', 'production', 'in_production'].includes(order.status?.toLowerCase()) ? 'bg-[#FFD100] shadow-[-6px_0_20px_2px_rgba(255,209,0,0.7)]' :
                    ['montagem', 'assembly'].includes(order.status?.toLowerCase()) ? 'bg-[#BD02FC] shadow-[-6px_0_20px_2px_rgba(189,2,252,0.7)]' :
                    ['aguardando sinal', 'waiting_payment', 'waiting_deposit', 'pending'].includes(order.status?.toLowerCase()) ? 'bg-[#0080FF] shadow-[-6px_0_20px_2px_rgba(0,128,255,0.7)]' :
                    ['enviado', 'delivery'].includes(order.status?.toLowerCase()) ? 'bg-[#FFFFFF] shadow-[-6px_0_20px_2px_rgba(255,255,255,0.7)]' :
                    ['novo pedido'].includes(order.status?.toLowerCase()) ? 'bg-[#37FD12] shadow-[-6px_0_20px_2px_rgba(55,253,18,0.7)]' :
                    'bg-[#7FFF00] shadow-[-6px_0_20px_2px_rgba(127,255,0,0.7)]'
                  }`} />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="mb-0.5">
                        <span className="text-[10px] text-[#8E8E93] font-mono bg-[#F5F5F7] px-1.5 py-0.5 rounded inline-block">#{order.code}</span>
                      </div>
                      <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{order.customerName}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {activeOrders.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                <Zap size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Nenhum pedido ativo</p>
              </div>
            )}
          </div>
        </div>

        {/* DIREITA: CHECKLIST DIÁRIO */}
        <div className="clean-3d-card p-8 flex flex-col h-[500px]">
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
            {checklist.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-12">
                <CheckCircle2 size={48} className="mb-4" />
                <p className="text-xs font-black uppercase tracking-widest">Sua lista está vazia</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input 
              type="text"
              value={newChecklistItem}
              onChange={(e) => setNewChecklistItem(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddChecklistItem()}
              placeholder="Adicionar novo item..."
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
      </div>

      {/* BLOCO 04: PRÓXIMOS EVENTOS */}
      <div className="clean-3d-card p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-3d-deep">
              <Calendar size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Próximos Eventos</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calendário estratégico dos próximos 60 dias</p>
            </div>
          </div>
          <button 
             onClick={() => setIsEventModalOpen(true)}
             className="clean-3d-button !h-10 !px-4 text-xs"
          >
            <Plus size={14} /> Novo Evento
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {events.map((event) => (
            <div key={event.id} className="clean-3d-card p-3 bg-white border border-slate-100 flex flex-col justify-between hover:border-amber-200">
              <div>
                <h4 className="text-xs font-black text-slate-900 line-clamp-2">{event.title}</h4>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase">{format(event.date, "dd MMM", { locale: ptBR })}</span>
                <Clock size={12} className="text-slate-300" />
              </div>
            </div>
          ))}
          {events.length === 0 && (
             <div className="flex items-center justify-center w-full py-8 opacity-20">
                <p className="text-xs font-black uppercase tracking-widest">Nenhum evento próximo</p>
             </div>
          )}
        </div>
      </div>

      {/* BLOCO 05: TOTAL VENDAS & FATURAMENTO (FLIP CLOCK STYLE) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ESQUERDA: TOTAL DE VENDAS */}
        <div className="clean-3d-card p-10 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent pointer-events-none" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12 relative z-10">Total de Pedidos Concluídos</h3>
          
          <div className="flex items-center gap-2 relative z-10">
            {totalMetrics.count.toString().padStart(4, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} />
            ))}
          </div>
          
          <div className="mt-12 flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Consolidado</span>
          </div>
        </div>

        {/* DIREITA: FATURAMENTO TOTAL */}
        <div className="clean-3d-card p-10 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/20 to-transparent pointer-events-none" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-12 relative z-10">Faturamento Total Acumulado</h3>
          
          <div className="flex items-center gap-2 relative z-10">
            <span className="text-3xl font-black text-slate-300 mr-2">R$</span>
            {Math.floor(totalMetrics.revenue).toString().padStart(6, '0').split('').map((digit, i) => (
              <FlipDigit key={i} digit={digit} color="emerald" />
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculado em Tempo Real</span>
          </div>
        </div>
      </div>

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
};

// COMPONENTES AUXILIARES

const FlipDigit = ({ digit, color = 'indigo' }: { digit: string, color?: 'indigo' | 'emerald' | 'slate' }) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-14 h-20 rounded-2xl flex items-center justify-center text-4xl font-black shadow-3d-soft border border-slate-100 ${
        color === 'indigo' ? 'bg-indigo-600 text-white' :
        color === 'emerald' ? 'bg-emerald-600 text-white' :
        'bg-slate-900 text-white'
      }`}
    >
      {digit}
    </motion.div>
  );
};
