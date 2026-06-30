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
  ArrowRight
} from "lucide-react";
import { 
  format, 
  startOfDay, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval,
  subMonths
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
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from "recharts";
import { db } from "../../lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  companyId: CompanyId;
  onAction: (action: any) => void;
  onOpenOrder: (order: Order) => void;
}

type TimePeriod = 'today' | '7d' | '30d' | 'thisMonth' | 'lastMonth';

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders = [],
  products = [],
  customers = [],
  companyId,
  onAction,
  onOpenOrder,
}) => {
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [purchases, setPurchases] = useState<PurchaseOrder[]>([]);
  const [insumos, setInsumos] = useState<Componente[]>([]);

  // Fetch additional data needed for consolidated view
  useEffect(() => {
    const qPurchases = query(collection(db, "purchase_orders"), where("companyId", "==", companyId));
    const unsubPurchases = onSnapshot(qPurchases, (snap) => {
      setPurchases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder)));
    });

    const qInsumos = query(collection(db, "componentes"), where("isActive", "==", true));
    const unsubInsumos = onSnapshot(qInsumos, (snap) => {
      setInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Componente)));
    });

    return () => {
      unsubPurchases();
      unsubInsumos();
    };
  }, [companyId]);

  // Filter orders based on period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (period) {
      case 'today':
        start = startOfDay(now);
        break;
      case '7d':
        start = startOfDay(subDays(now, 7));
        break;
      case '30d':
        start = startOfDay(subDays(now, 30));
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
        break;
      default:
        start = subDays(now, 30);
    }

    return orders.filter(o => {
      const orderDate = o.createdAt?.toDate ? o.createdAt.toDate() : (o.createdAt ? new Date(o.createdAt) : null);
      if (!orderDate) return false;
      return isWithinInterval(orderDate, { start, end }) && o.status !== 'cancelled';
    });
  }, [orders, period]);

  // Metrics Calculation
  const metrics = useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let productionCount = 0;
    let pendingCount = 0;

    filteredOrders.forEach(order => {
      revenue += Number(order.total) || 0;
      
      // Calculate production cost for this order
      order.items?.forEach(item => {
        // Fallback to estimatedCost if available
        const product = products.find(p => p.id === (item.productId || item.id));
        const itemCost = product?.estimatedCost || 0;
        cost += itemCost * (item.quantity || 1);
      });

      if (['production', 'in_production', 'assembly'].includes(order.status)) {
        productionCount++;
      }
      if (['novo pedido', 'pending', 'waiting_payment', 'approval'].includes(order.status)) {
        pendingCount++;
      }
    });

    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      revenue,
      cost,
      profit,
      margin,
      productionCount,
      pendingCount
    };
  }, [filteredOrders, products]);

  // Chart Data
  const chartData = useMemo(() => {
    const dataMap: { [key: string]: { date: string; revenue: number; cost: number; profit: number } } = {};
    
    // Fill last 30 days if period is 30d
    const days = period === '7d' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'dd/MM');
      dataMap[d] = { date: d, revenue: 0, cost: 0, profit: 0 };
    }

    filteredOrders.forEach(order => {
      const d = format(order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt), 'dd/MM');
      if (dataMap[d]) {
        const orderRev = Number(order.total) || 0;
        let orderCost = 0;
        order.items?.forEach(item => {
          const product = products.find(p => p.id === (item.productId || item.id));
          orderCost += (product?.estimatedCost || 0) * (item.quantity || 1);
        });

        dataMap[d].revenue += orderRev;
        dataMap[d].cost += orderCost;
        dataMap[d].profit += (orderRev - orderCost);
      }
    });

    return Object.values(dataMap);
  }, [filteredOrders, products, period]);

  // Top Products
  const topProducts = useMemo(() => {
    const productStats: { [key: string]: { name: string; qty: number; revenue: number; profit: number } } = {};

    filteredOrders.forEach(order => {
      order.items?.forEach(item => {
        const id = item.productId || item.id;
        if (!productStats[id]) {
          productStats[id] = { name: item.product_name || "Desconhecido", qty: 0, revenue: 0, profit: 0 };
        }
        const qty = item.quantity || 1;
        const price = Number(item.current_price || item.price || 0);
        const product = products.find(p => p.id === id);
        const cost = (product?.estimatedCost || 0) * qty;
        
        productStats[id].qty += qty;
        productStats[id].revenue += price * qty;
        productStats[id].profit += (price * qty) - cost;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
  }, [filteredOrders, products]);

  // Top Customers
  const topCustomers = useMemo(() => {
    const customerStats: { [key: string]: { name: string; totalSpent: number; ordersCount: number; lastPurchase: any } } = {};

    filteredOrders.forEach(order => {
      const name = order.customerName || "Desconhecido";
      if (!customerStats[name]) {
        customerStats[name] = { name, totalSpent: 0, ordersCount: 0, lastPurchase: null };
      }
      customerStats[name].totalSpent += Number(order.total) || 0;
      customerStats[name].ordersCount += 1;
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      if (!customerStats[name].lastPurchase || orderDate > customerStats[name].lastPurchase) {
        customerStats[name].lastPurchase = orderDate;
      }
    });

    return Object.values(customerStats)
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [filteredOrders]);

  // Critical Stock
  const criticalStock = useMemo(() => {
    return insumos
      .filter(i => i.quantity <= i.minQuantity)
      .sort((a, b) => (a.quantity / a.minQuantity) - (b.quantity / b.minQuantity))
      .slice(0, 5);
  }, [insumos]);

  // Alerts
  const alerts = useMemo(() => {
    const list = [];
    if (metrics.margin < 30 && metrics.revenue > 0) {
      list.push({ type: 'warning', message: `Margem média abaixo do esperado (${metrics.margin.toFixed(1)}%)`, icon: <TrendingDown size={14} /> });
    }
    if (criticalStock.length > 0) {
      list.push({ type: 'error', message: `${criticalStock.length} itens com estoque crítico ou zerado`, icon: <AlertTriangle size={14} /> });
    }
    // Check for late orders (older than 7 days and not delivered)
    const lateOrders = orders.filter(o => {
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      const isOld = (Date.now() - date.getTime()) > (7 * 24 * 60 * 60 * 1000);
      return isOld && !['delivered', 'cancelled'].includes(o.status);
    });
    if (lateOrders.length > 0) {
      list.push({ type: 'info', message: `${lateOrders.length} pedidos em atraso ou aguardando há mais de 7 dias`, icon: <Clock size={14} /> });
    }
    return list;
  }, [metrics, criticalStock, orders]);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* CEO Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Visão Geral do Negócio</h1>
          <p className="text-slate-500 font-medium text-sm">Dashboard Estratégico & KPIs em Tempo Real</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
          {(['today', '7d', '30d', 'thisMonth', 'lastMonth'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === p 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7d' ? '7 Dias' : p === '30d' ? '30 Dias' : p === 'thisMonth' ? 'Mês Atual' : 'Mês Anterior'}
            </button>
          ))}
        </div>
      </div>

      {/* Smart Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert, idx) => (
            <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border ${
              alert.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-700' :
              alert.type === 'warning' ? 'bg-orange-50 border-orange-100 text-orange-700' :
              'bg-blue-50 border-blue-100 text-blue-700'
            }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                alert.type === 'error' ? 'bg-rose-100' :
                alert.type === 'warning' ? 'bg-orange-100' :
                'bg-blue-100'
              }`}>
                {alert.icon}
              </div>
              <p className="text-xs font-bold leading-tight">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPICard 
          title="Faturamento" 
          value={formatCurrency(metrics.revenue)} 
          icon={<DollarSign size={20} />} 
          trend="+12%" 
          color="slate" 
        />
        <KPICard 
          title="Lucro Líquido" 
          value={formatCurrency(metrics.profit)} 
          icon={<TrendingUp size={20} />} 
          trend="+8.4%" 
          color="emerald" 
        />
        <KPICard 
          title="Custo Produção" 
          value={formatCurrency(metrics.cost)} 
          icon={<Package size={20} />} 
          trend="-2.1%" 
          color="rose" 
        />
        <KPICard 
          title="Margem Média" 
          value={`${metrics.margin.toFixed(1)}%`} 
          icon={<Activity size={20} />} 
          trend="Estável" 
          color="blue" 
        />
        <KPICard 
          title="Em Produção" 
          value={metrics.productionCount.toString()} 
          icon={<Archive size={20} />} 
          trend="Ativos" 
          color="indigo" 
        />
        <KPICard 
          title="Pendentes" 
          value={metrics.pendingCount.toString()} 
          icon={<Clock size={20} />} 
          trend="Aguardando" 
          color="amber" 
        />
      </div>

      {/* Main Row: Chart & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Performance Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-8">
             <div>
                <h3 className="font-bold text-slate-900">Performance de Vendas</h3>
                <p className="text-xs text-slate-500 font-medium">Receita vs Custo vs Lucro</p>
             </div>
             <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900"></span> Receita</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lucro</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400"></span> Custo</div>
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  hide 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  labelStyle={{ fontWeight: 800, marginBottom: '8px', color: '#1e293b' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#0f172a" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="profit" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#fb7185" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="none" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Top Produtos</h3>
            <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">Volume</span>
          </div>
          <div className="flex-1 space-y-4">
             {topProducts.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                 <ShoppingBag size={24} />
                 <p className="text-xs font-bold uppercase tracking-wider">Sem dados de vendas</p>
               </div>
             ) : (
               topProducts.map((p, idx) => (
                 <div key={idx} className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-900 font-bold text-xs">
                          #{idx + 1}
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900 truncate max-w-[140px] group-hover:text-indigo-600 transition-colors">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{p.qty} vendas</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-slate-900">{formatCurrency(p.revenue)}</p>
                       <p className="text-[10px] text-emerald-600 font-bold">+{formatCurrency(p.profit)}</p>
                    </div>
                 </div>
               ))
             )}
          </div>
          <button 
            onClick={() => onAction('products')}
            className="w-full mt-6 py-3 bg-slate-50 text-slate-900 rounded-2xl text-xs font-bold hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
          >
            Ver todos os produtos <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Grid: Customers, Production, Stock */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        
        {/* Top Customers */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Principais Clientes</h3>
              <Users size={18} className="text-slate-400" />
           </div>
           <div className="space-y-4">
              {topCustomers.map((c, idx) => (
                <div key={idx} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-black text-xs">
                         {c.name.charAt(0)}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{c.name}</p>
                         <p className="text-[10px] text-slate-400 font-bold">{c.ordersCount} pedidos</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{formatCurrency(c.totalSpent)}</p>
                      <p className="text-[10px] text-slate-400 font-bold">LTV</p>
                   </div>
                </div>
              ))}
              {topCustomers.length === 0 && <p className="text-center py-8 text-xs text-slate-400 font-bold uppercase tracking-widest">Aguardando dados</p>}
           </div>
        </div>

        {/* Ongoing Production */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Produção Ativa</h3>
              <Activity size={18} className="text-blue-500" />
           </div>
           <div className="space-y-3">
              {filteredOrders.filter(o => ['production', 'assembly'].includes(o.status)).slice(0, 5).map((order) => (
                <div key={order.id} onClick={() => onOpenOrder(order)} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase">#{order.code}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md">
                         {order.status === 'assembly' ? 'Montagem' : 'Produzindo'}
                      </span>
                   </div>
                   <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{order.customerName}</p>
                   <p className="text-[10px] text-slate-400 font-medium mt-1">Previsão: {order.deliveryDate || 'N/A'}</p>
                </div>
              ))}
              {filteredOrders.filter(o => ['production', 'assembly'].includes(o.status)).length === 0 && (
                 <div className="text-center py-12">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Fábrica em pausa</p>
                 </div>
              )}
           </div>
        </div>

        {/* Critical Stock */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900">Estoque Crítico</h3>
              <AlertTriangle size={18} className="text-rose-500" />
           </div>
           <div className="space-y-4">
              {criticalStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${item.quantity === 0 ? 'bg-rose-100 text-rose-600' : 'bg-orange-100 text-orange-600'}`}>
                         <Package size={16} />
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{item.name}</p>
                         <div className="flex items-center gap-2">
                           <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${item.quantity === 0 ? 'bg-rose-500' : 'bg-orange-500'}`} 
                                style={{ width: `${Math.min(100, (item.quantity / item.minQuantity) * 100)}%` }}
                              />
                           </div>
                           <span className="text-[10px] text-slate-400 font-bold">{item.quantity}{item.unit}</span>
                         </div>
                      </div>
                   </div>
                   <div className="text-right">
                      <button 
                        onClick={() => onAction('purchases')}
                        className="text-[10px] font-black text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
                      >
                         COMPRAR
                      </button>
                   </div>
                </div>
              ))}
              {criticalStock.length === 0 && (
                 <div className="text-center py-12">
                    <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-2" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estoque Saudável</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

interface KPICardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: string;
  color: 'slate' | 'emerald' | 'rose' | 'blue' | 'indigo' | 'amber';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, trend, color }) => {
  const colorMap = {
    slate: 'bg-slate-900 text-white',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose: 'bg-rose-50 border-rose-100 text-rose-900',
    blue: 'bg-blue-50 border-blue-100 text-blue-900',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    amber: 'bg-amber-50 border-amber-100 text-amber-900'
  };

  const iconColorMap = {
    slate: 'text-slate-400',
    emerald: 'text-emerald-500',
    rose: 'text-rose-500',
    blue: 'text-blue-500',
    indigo: 'text-indigo-500',
    amber: 'text-amber-500'
  };

  return (
    <div className={`p-4 rounded-3xl border flex flex-col justify-between h-32 transition-all hover:shadow-lg hover:-translate-y-1 ${color === 'slate' ? colorMap.slate : 'bg-white border-slate-200'}`}>
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color === 'slate' ? 'bg-slate-800' : colorMap[color]}`}>
          {icon}
        </div>
        <span className={`text-[10px] font-black uppercase tracking-wider ${color === 'slate' ? 'text-slate-400' : 'text-slate-400'}`}>
          {trend}
        </span>
      </div>
      <div>
        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-1 ${color === 'slate' ? 'text-slate-400' : 'text-slate-400'}`}>
          {title}
        </span>
        <span className="text-lg font-black tracking-tight font-mono truncate block">
          {value}
        </span>
      </div>
    </div>
  );
};
