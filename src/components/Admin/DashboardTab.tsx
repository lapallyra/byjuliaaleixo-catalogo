import React, { useMemo, useState, useEffect } from "react";
import {
  Search,
  Bell,
  User,
  ShoppingBag,
  Package,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  Tag,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { format, isToday, parseISO, startOfDay, addDays, isBefore, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Order, Product, Customer, CommemorativeDate } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { commemorativeDateService } from "../../services/commemorativeDateService";
import { getMobileDateOccurrence } from "../../lib/commemorativeDateUtils";

interface DashboardTabProps {
  orders: Order[];
  products: Product[];
  customers: Customer[];
  monthlyGoal: number;
  onAction: (action: "new_order" | "new_client" | "new_insumo" | "view_agenda") => void;
  onOpenOrder: (order: Order) => void;
}

const KpiCard = ({ title, value, icon: Icon, growthText, growthPositive }: { title: string, value: string | number, icon: any, growthText?: string, growthPositive?: boolean }) => {
  return (
    <div className="relative bg-white/40 backdrop-blur-md p-5 rounded-[1.25rem] border border-white/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col gap-3 transition-transform hover:-translate-y-1">
      <div className="w-10 h-10 rounded-full bg-white/50 flex items-center justify-center text-[#1C1C1E]">
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-[#1C1C1E]/70">{title}</p>
        <div className="flex items-end gap-2 mt-1">
          <p className="text-xl font-semibold text-[#1C1C1E] leading-none">{value}</p>
          {growthText && (
            <span className={`text-[10px] font-medium mb-0.5 flex items-center ${growthPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              <TrendingUp className={`w-3 h-3 mr-0.5 ${!growthPositive ? 'rotate-180' : ''}`} />
              {growthText}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ActivityList = ({ title, items, type, onMore }: { title: string, items: any[], type: 'order'|'customer'|'product', onMore: () => void }) => {
  return (
    <div className="bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-white/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#1C1C1E]">{title}</h3>
      </div>
      <div className="flex-1 space-y-3">
        {items.length === 0 ? (
          <p className="text-xs text-[#8E8E93] text-center py-4">Nenhum registro encontrado.</p>
        ) : (
          items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3 p-2 hover:bg-white/50 rounded-xl transition-all cursor-default">
              <div className="w-8 h-8 rounded-full bg-white/50 border border-white/20 flex items-center justify-center shrink-0">
                {type === 'order' && <ShoppingBag className="w-4 h-4 text-[#1C1C1E]" />}
                {type === 'customer' && <User className="w-4 h-4 text-[#1C1C1E]" />}
                {type === 'product' && <Package className="w-4 h-4 text-[#1C1C1E]" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[#1C1C1E] truncate">
                  {type === 'order' && `#${item.code || (item.id && typeof item.id === 'string' ? item.id.substring(0,5) : '')} - ${item.customerName || ''}`}
                  {type === 'customer' && item.name}
                  {type === 'product' && item.product_name}
                </p>
                <p className="text-[10px] text-[#8E8E93] truncate">
                  {type === 'order' && `${formatCurrency(Number(item.total) || 0)}`}
                  {type === 'customer' && item.contact}
                  {type === 'product' && (item.category || 'Sem categoria')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={onMore} className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium text-[#1C1C1E] bg-white/50 hover:bg-white transition-all flex items-center justify-center gap-1">
        Ver mais <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
};

const AlertItem = ({ icon: Icon, title, text, color }: { icon: any, title: string, text: string, color: 'rose'|'amber'|'blue' }) => {
  const colorMap = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
  };
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl border border-white/20 hover:border-[#1C1C1E]/20 transition-all bg-white/40 backdrop-blur-md">
      <div className={`p-2 rounded-lg border ${colorMap[color]} shrink-0`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-[#1C1C1E]">{title}</h4>
        <p className="text-[10px] text-[#8E8E93] leading-relaxed mt-0.5">{text}</p>
      </div>
    </div>
  );
};

export const DashboardTab: React.FC<DashboardTabProps> = ({
  orders,
  products,
  customers,
  monthlyGoal,
  onAction,
  onOpenOrder,
}) => {
  const now = new Date();
  const [dates, setDates] = useState<CommemorativeDate[]>([]);
  
  useEffect(() => {
    return commemorativeDateService.subscribe(setDates);
  }, []);

  const upcomingCampaigns = useMemo(() => {
    const getFullDate = (d: CommemorativeDate, year = new Date().getFullYear()) => {
      if (d.year_fixed) return new Date(year, d.month - 1, d.day);
      if (d.mobile_id) {
        const occurrence = getMobileDateOccurrence(d.mobile_id, year);
        return new Date(year, occurrence.month - 1, occurrence.day);
      }
      return new Date(year, d.month - 1, d.day);
    };

    const today = startOfDay(new Date());
    return dates
      .filter((d) => d.active && getFullDate(d) >= today && getFullDate(d) <= addDays(today, 30))
      .sort((a, b) => getFullDate(a).getTime() - getFullDate(b).getTime());
  }, [dates]);

  const metrics = useMemo(() => {
    let todayOrdersCount = 0;
    let yesterdayOrdersCount = 0;
    let inProductionCount = 0;
    let waitingApprovalCount = 0;
    let todayRevenue = 0;
    let yesterdayRevenue = 0;
    const lowStockProducts: Product[] = [];
    let activeProductsCount = 0;
    const delayedOrders: Order[] = [];
    const productsNoImage: Product[] = [];
    const productsNoCategory: Product[] = [];

    const yesterday = subDays(startOfDay(now), 1);
    const todayStart = startOfDay(now);

    orders.forEach(o => {
      const orderDate = new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt || Date.now());
      const status = o.status.toLowerCase();
      
      const isCanceled = ['cancelled', 'canceled', 'refunded'].includes(status);
      const isDelivered = ['delivered', 'fully_paid'].includes(status);

      if (orderDate >= todayStart) {
        todayOrdersCount++;
        if (!isCanceled) todayRevenue += (Number(o.total) || 0);
      } else if (orderDate >= yesterday && orderDate < todayStart) {
        yesterdayOrdersCount++;
        if (!isCanceled) yesterdayRevenue += (Number(o.total) || 0);
      }

      if (['production', 'in_production', 'assembly'].includes(status)) {
        inProductionCount++;
      } else if (['waiting_deposit', 'waiting_payment', 'approval', 'pending', 'quote'].includes(status)) {
        waitingApprovalCount++;
      }

      if (!isCanceled && !isDelivered && o.deliveryDate) {
         try {
           const delDate = startOfDay(parseISO(o.deliveryDate));
           if (isBefore(delDate, todayStart)) {
             delayedOrders.push(o);
           }
         } catch(e) {}
      }
    });

    products.forEach(p => {
      if (p.isVisible) activeProductsCount++;
      if (p.stock !== undefined && p.stock <= 5) lowStockProducts.push(p);
      if (!p.image) productsNoImage.push(p);
      if (!p.category || p.category.trim() === '') productsNoCategory.push(p);
    });

    const recentOrders = [...orders]
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || Date.now();
        const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || Date.now();
        return timeB - timeA;
      })
      .slice(0, 5);

    const recentCustomers = [...(customers || [])]
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || Date.now();
        const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || Date.now();
        return timeB - timeA;
      })
      .slice(0, 5);

    const recentProducts = [...products]
      .sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || new Date(a.createdAt).getTime() || Date.now();
        const timeB = b.createdAt?.toMillis?.() || new Date(b.createdAt).getTime() || Date.now();
        return timeB - timeA;
      })
      .slice(0, 5);

    return {
      todayOrdersCount,
      yesterdayOrdersCount,
      inProductionCount,
      waitingApprovalCount,
      todayRevenue,
      yesterdayRevenue,
      lowStockProducts,
      activeProductsCount,
      recentOrders,
      recentCustomers,
      recentProducts,
      delayedOrders,
      productsNoImage,
      productsNoCategory
    };
  }, [orders, products, customers]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? { text: "+100%", positive: true } : undefined;
    const diff = current - previous;
    const percentage = Math.round((diff / previous) * 100);
    return {
      text: `${percentage > 0 ? '+' : ''}${percentage}%`,
      positive: percentage >= 0
    };
  };

  const ordersGrowth = calculateGrowth(metrics.todayOrdersCount, metrics.yesterdayOrdersCount);
  const revenueGrowth = calculateGrowth(metrics.todayRevenue, metrics.yesterdayRevenue);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20 max-w-[1600px] mx-auto">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-[#1C1C1E] tracking-tight">Olá, CEO  BILIONÁRIA 👋</h1>
          <p className="text-sm font-medium text-[#8E8E93] mt-1 capitalize">{format(now, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93] w-4 h-4" />
            <input type="text" placeholder="Pesquisar..." className="w-full md:w-64 pl-10 pr-4 py-2.5 bg-white border border-[#E5E5EA] rounded-full text-sm outline-none focus:border-[#1C1C1E] transition-all shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]" />
          </div>
        </div>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard 
          title="Pedidos de Hoje" 
          value={metrics.todayOrdersCount} 
          icon={ShoppingBag} 
          growthText={ordersGrowth?.text} 
          growthPositive={ordersGrowth?.positive} 
        />
        <KpiCard 
          title="Em Produção" 
          value={metrics.inProductionCount} 
          icon={Package} 
        />
        <KpiCard 
          title="Aguardando Aprovação" 
          value={metrics.waitingApprovalCount} 
          icon={Clock} 
        />
        <KpiCard 
          title="Faturamento do Dia" 
          value={formatCurrency(metrics.todayRevenue)} 
          icon={DollarSign} 
          growthText={revenueGrowth?.text}
          growthPositive={revenueGrowth?.positive}
        />
        <KpiCard 
          title="Estoque Baixo" 
          value={metrics.lowStockProducts.length} 
          icon={AlertTriangle} 
        />
        <KpiCard 
          title="Produtos Ativos" 
          value={metrics.activeProductsCount} 
          icon={CheckCircle2} 
        />
      </div>

      {/* ACTIVITIES & ALERTS */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-[#1C1C1E] tracking-tight">Painel de Atividades</h2>
          
          <div className="w-full">
            <ActivityList title="Últimos Pedidos" items={metrics.recentOrders} type="order" onMore={() => onAction("new_order")} />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-lg font-semibold text-[#1C1C1E] tracking-tight">Alertas Inteligentes</h2>
          <div className="bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-white/20 shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-6 space-y-4">
            {metrics.lowStockProducts.length > 0 && (
              <AlertItem icon={AlertTriangle} title="Estoque Baixo" text={`${metrics.lowStockProducts.length} produto(s) com estoque inferior a 5 unidades.`} color="rose" />
            )}
            {metrics.delayedOrders.length > 0 && (
              <AlertItem icon={Clock} title="Pedidos Atrasados" text={`${metrics.delayedOrders.length} pedido(s) passaram da data de entrega.`} color="amber" />
            )}
            {upcomingCampaigns.length > 0 && (
              <AlertItem icon={Calendar} title="Campanhas Próximas" text={`${upcomingCampaigns.length} evento(s) nos próximos 30 dias.`} color="blue" />
            )}
            {metrics.productsNoImage.length > 0 && (
              <AlertItem icon={ImageIcon} title="Produtos sem Imagem" text={`${metrics.productsNoImage.length} produto(s) no catálogo estão sem foto.`} color="amber" />
            )}
            {metrics.productsNoCategory.length > 0 && (
              <AlertItem icon={Tag} title="Produtos sem Categoria" text={`${metrics.productsNoCategory.length} produto(s) não possuem categoria definida.`} color="amber" />
            )}
            
            {[metrics.lowStockProducts, metrics.delayedOrders, upcomingCampaigns, metrics.productsNoImage, metrics.productsNoCategory].every(arr => arr.length === 0) && (
              <div className="text-center py-8">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-[#1C1C1E]">Tudo em ordem!</p>
                <p className="text-xs text-[#8E8E93] mt-1">Nenhum alerta crítico no momento.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
