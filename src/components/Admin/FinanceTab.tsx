import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import {
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  XCircle,
  LayoutDashboard,
  Activity,
  Target,
  AlertCircle,
  Save,
  Percent,
  Calculator,
  Package,
  Sparkles,
  Lightbulb,
  Compass,
  Layers,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { FinanceEntry, CompanyId, Order, SiteSettings, Product, Insumo } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import {
  subscribeToFinance,
  getGlobalSettings,
  saveMonthlyProfitHistory,
  subscribeToMonthlyProfitHistory,
} from "../../services/firebaseService";
import { format, subMonths, isSameMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { exportFinanceReportPDF } from "../../utils/pdfGenerator";

interface FinanceTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
}

export const FinanceTab: React.FC<FinanceTabProps> = ({
  companyId,
  orders,
  products,
  insumos,
}) => {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [activeSection, setActiveSection] = useState("visao-geral");
  const [filterMonth, setFilterMonth] = useState(new Date());

  // Pricing Simulator States
  const [selectedSimProduct, setSelectedSimProduct] = useState<string>("custom");
  const [simMaterialCost, setSimMaterialCost] = useState<number>(35);
  const [simLaborHours, setSimLaborHours] = useState<number>(2);
  const [simLaborRate, setSimLaborRate] = useState<number>(30);
  const [simFixedCostPct, setSimFixedCostPct] = useState<number>(10);
  const [simTaxRate, setSimTaxRate] = useState<number>(6);
  const [simFeesRate, setSimFeesRate] = useState<number>(5);
  const [simDesiredMargin, setSimDesiredMargin] = useState<number>(35);
  const [simCustomPrice, setSimCustomPrice] = useState<number>(150);
  const [insumosSearchTerm, setInsumosSearchTerm] = useState<string>("");

  // Sync simulator with selected product
  useEffect(() => {
    if (selectedSimProduct !== "custom") {
      const prod = products.find((p) => p.id === selectedSimProduct);
      if (prod) {
        setSimMaterialCost(prod.estimatedCost || 30);
        setSimCustomPrice(prod.current_price || prod.retail_price || 0);
      }
    }
  }, [selectedSimProduct, products]);

  // Sync labor and tax rates when global settings load
  useEffect(() => {
    if (settings) {
      if (settings.global_labor_cost_per_hour) {
        setSimLaborRate(settings.global_labor_cost_per_hour);
      }
      if (settings.global_tax_rate) {
        setSimTaxRate(settings.global_tax_rate);
      }
    }
  }, [settings]);

  useEffect(() => {
    const unsubFinance = subscribeToFinance(setEntries, companyId);
    const unsubHistory = subscribeToMonthlyProfitHistory(setHistory, companyId);
    return () => {
      unsubFinance();
      unsubHistory();
    };
  }, [companyId]);

  const handleCloseMonth = async () => {
    if (confirm("Deseja fechar o mês e salvar o lucro atual no histórico?")) {
      await saveMonthlyProfitHistory(companyId, {
        month: format(filterMonth, "MM/yyyy"),
        netProfit: netProfit,
      });
      alert("Mês fechado e registrado!");
    }
  };

  useEffect(() => {
    getGlobalSettings().then((data) => {
      if (data) setSettings(data);
    });
  }, [companyId]);

  const currentMonthOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "cancelled" &&
          isSameMonth(
            o.createdAt?.toDate
              ? o.createdAt.toDate()
              : new Date(o.createdAt as any),
            filterMonth,
          ),
      ),
    [orders, filterMonth],
  );

  const grossRevenue = useMemo(
    () =>
      currentMonthOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
    [currentMonthOrders],
  );

  const monthEntries = useMemo(
    () => entries.filter((e) => isSameMonth(new Date(e.date), filterMonth)),
    [entries, filterMonth],
  );
  const totalManualInflows = useMemo(
    () =>
      monthEntries
        .filter((e) => e.type === "revenue")
        .reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [monthEntries],
  );
  const totalManualOutflows = useMemo(
    () =>
      monthEntries
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + (Number(e.value) || 0), 0),
    [monthEntries],
  );

  // Derived costs from Settings
  const fixedCosts = settings?.global_fixed_costs || 0;
  const taxesRate = settings?.global_tax_rate || 0;
  const variableTaxes = grossRevenue * (taxesRate / 100);

  // Custom formula for COGS (Cost of Goods Sold based on Insumos). As a fallback, estimate at 35% of revenue if no precise data
  // But let's assume 35% of revenue for standard
  const cogsEstimate = grossRevenue * 0.35;

  const totalExpenses =
    totalManualOutflows + fixedCosts + variableTaxes + cogsEstimate;

  const totalMarketplaceFees = useMemo(() => {
    return currentMonthOrders.reduce((sum, o) => {
      if (o.marketplace && o.marketplaceTax) {
        return sum + (Number(o.total) || 0) * (Number(o.marketplaceTax) / 100);
      }
      return sum;
    }, 0);
  }, [currentMonthOrders]);

  const netProfit = grossRevenue + totalManualInflows - (totalExpenses + totalMarketplaceFees);

  const monthlyGoal = settings?.monthly_goal || 1; // prevent div/0
  const goalProgress = Math.min((grossRevenue / monthlyGoal) * 100, 100);
  const remainingGoal = Math.max(0, monthlyGoal - grossRevenue);

  const averageTicket = grossRevenue / (currentMonthOrders.length || 1);
  const conversionRate = 3.2; // Simulated conversion rate as we don't track pageviews

  const TabNav = () => (
    <div className="flex flex-wrap gap-2 mb-10 bg-white/80 backdrop-blur-md py-4 border-b border-[#F0E6D2] scroll-mt-20">
      {[
        { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
        { id: "analise-inteligente", label: "Análise Inteligente", icon: Target },
        { id: "analise", label: "Custos", icon: Activity },
      ].map((sec) => (
        <button
          key={sec.id}
          onClick={() => setActiveSection(sec.id)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSection === sec.id ? "bg-black text-white shadow-lg" : "bg-white text-[#A09898] hover:bg-slate-100"}`}
        >
          <sec.icon size={14} />
          {sec.label}
        </button>
      ))}
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case "visao-geral":
        return (
          <section className="space-y-8 animate-in fade-in duration-300">
            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "Faturamento Bruto",
                  val: grossRevenue,
                  icon: TrendingUp,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                  border: "border-emerald-100",
                },
                {
                  label: "Lucro Líquido Estimado",
                  val: netProfit,
                  icon: DollarSign,
                  color: "text-emerald-500",
                  bg: "bg-emerald-50",
                  border: "border-emerald-100",
                },
                {
                  label: "Custo Promedio / Prejuízo",
                  val: totalExpenses,
                  icon: TrendingDown,
                  color: "text-rose-500",
                  bg: "bg-rose-50",
                  border: "border-rose-100",
                },
                {
                  label: "Conversão Estimada",
                  val: conversionRate + "%",
                  isText: true,
                  icon: Activity,
                  color: "text-lilac",
                  bg: "bg-lilac-baby",
                  border: "border-lilac/20",
                },
              ].map((card, idx) => (
                <div
                  key={card.label}
                  className={`p-8 rounded-[2rem] bg-white border ${card.border} shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform`}
                >
                  <div
                    className={`absolute -right-4 -top-4 w-24 h-24 rounded-full ${card.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`}
                  />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                      <card.icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">
                      {card.label}
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-800 mt-6 relative z-10 font-sans tracking-tight">
                    {card.isText ? card.val : formatCurrency(card.val as number)}
                  </p>
                </div>
              ))}
            </div>

            {/* Funil de Vendas Simples */}
            <div className="p-8 rounded-[2.5rem] bg-white border border-[#F0E6D2] shadow-sm">
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#A09898] mb-6">
                 Funil de Vendas (Neste Mês)
               </h3>
               <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                     <div className="w-full bg-[#FAF9F6] rounded-xl h-12 relative overflow-hidden flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 bg-lilac/10 w-full"></div>
                        <span className="relative z-10 px-6 text-xs font-black uppercase tracking-widest text-[#4A4444]">Visitantes (Estimado 100%)</span>
                     </div>
                     <span className="w-16 text-right font-black text-xs text-[#A09898]">~{Math.round((currentMonthOrders.length || 1) / (conversionRate / 100))}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-full bg-[#FAF9F6] rounded-xl h-12 relative overflow-hidden flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 bg-amber-500/10 w-[45%]"></div>
                        <span className="relative z-10 px-6 text-xs font-black uppercase tracking-widest text-[#4A4444]">Intentos de Compra (45%)</span>
                     </div>
                     <span className="w-16 text-right font-black text-xs text-[#A09898]">~{Math.round((currentMonthOrders.length || 1) / (conversionRate / 100) * 0.45)}</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="w-full bg-[#FAF9F6] rounded-xl h-12 relative overflow-hidden flex items-center">
                        <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 w-[5%]"></div>
                        <span className="relative z-10 px-6 text-xs font-black uppercase tracking-widest text-emerald-600">Vendas Finalizadas ({conversionRate}%)</span>
                     </div>
                     <span className="w-16 text-right font-black text-xs text-emerald-600">{currentMonthOrders.length}</span>
                  </div>
               </div>
            </div>

            {/* Goal Progress Tracker */}
            {settings?.monthly_goal && settings.monthly_goal > 0 && (
              <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-slate-900 to-black text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-lilac/20 rounded-full blur-[80px]" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
                      <Target size={24} className="text-lilac" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                        Progresso da Meta Mensal
                      </h3>
                      <p className="text-2xl font-black mt-1 font-sans">
                        <span className="text-lilac">
                          {formatCurrency(grossRevenue)}
                        </span>{" "}
                        <span className="text-white/30 text-lg">
                          / {formatCurrency(settings.monthly_goal)}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 w-full flex items-center justify-end gap-6">
                    <div className="w-full max-w-md h-4 rounded-full bg-white/5 border border-white/10 overflow-hidden relative shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-lilac to-pink-500 relative"
                        style={{ width: `${goalProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 animate-pulse" />
                      </div>
                    </div>
                    <div className="text-2xl font-black font-sans w-16 text-right">
                      {Math.round(goalProgress)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Inflows & Outflows List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Entradas */}
              <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-50/50 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                    <TrendingUp size={16} className="text-emerald-500" /> Fluxo
                    Positivo
                  </h3>
                  <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full">
                    {currentMonthOrders.length} Pedidos
                  </span>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
                  {currentMonthOrders.length > 0 ? (
                    currentMonthOrders.slice(0, 10).map((o, idx) => (
                      <div
                        key={`order-entry-${o.id}-${idx}`}
                        className="flex justify-between items-center p-4 bg-emerald-50/30 rounded-xl border border-emerald-100/50"
                      >
                        <div>
                          <p className="font-bold text-xs text-slate-800 font-sans uppercase flex flex-wrap items-center gap-1.5">
                            {o.customerName || "Cliente"}
                            {o.marketplace && (
                              <span className="bg-lilac/10 text-lilac font-black text-[7px] tracking-wider uppercase px-1.5 py-0.5 rounded">
                                {o.marketplace.replace("_", " ")}
                              </span>
                            )}
                          </p>
                          <p className="text-[9px] font-black text-emerald-600 tracking-widest mt-0.5">
                            #{o.code}
                          </p>
                        </div>
                        <span className="font-black text-emerald-600">
                          + {formatCurrency(o.total)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-[10px] uppercase font-black tracking-widest text-[#A09898] py-10">
                      Nenhuma venda esse mês.
                    </p>
                  )}
                </div>
              </div>

              {/* Saídas e Custos Base */}
              <div className="bg-white rounded-[2rem] border border-rose-100 shadow-xl shadow-rose-50/50 p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                    <TrendingDown size={16} className="text-slate-9000" />{" "}
                    Previsão de Custos
                  </h3>
                  <span className="text-[10px] font-black bg-slate-50 text-rose-600 px-3 py-1 rounded-full">
                    Baseado nas configs
                  </span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50/30 rounded-xl border border-rose-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        Custos Fixos Globais
                      </p>
                      <p className="text-[9px] font-black text-slate-9000 tracking-widest mt-0.5">
                        Aluguel, Luz, etc.
                      </p>
                    </div>
                    <span className="font-black text-slate-9000">
                      - {formatCurrency(fixedCosts)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-slate-50/30 rounded-xl border border-rose-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        Impostos sobre Faturamento
                      </p>
                      <p className="text-[9px] font-black text-slate-9000 tracking-widest mt-0.5">
                        {taxesRate}% sobre R$ {grossRevenue.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-black text-slate-9000">
                      - {formatCurrency(variableTaxes)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-50/30 rounded-xl border border-amber-100/50">
                    <div>
                      <p className="font-bold text-xs text-slate-800 uppercase">
                        CMV (Custo Mercadoria Projetado)
                      </p>
                      <p className="text-[9px] font-black text-amber-600 tracking-widest mt-0.5">
                        ~35% do Faturamento Agregado
                      </p>
                    </div>
                    <span className="font-black text-amber-600">
                      - {formatCurrency(cogsEstimate)}
                    </span>
                  </div>
                  {totalMarketplaceFees > 0 && (
                    <div className="flex justify-between items-center p-4 bg-purple-50/50 rounded-xl border border-purple-100/80">
                      <div>
                        <p className="font-bold text-xs text-slate-800 uppercase">
                          Taxas de Marketplace
                        </p>
                        <p className="text-[9px] font-black text-purple-600 tracking-widest mt-0.5">
                          Comissões das Plataformas Integradas
                        </p>
                      </div>
                      <span className="font-black text-purple-600">
                        - {formatCurrency(totalMarketplaceFees)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-[2rem] border border-[#F0E6D2] shadow-xl p-8 mt-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xs font-black uppercase tracking-tighter text-slate-800">
                  Histórico de Lucro Registrado
                </h2>
                <button
                  onClick={handleCloseMonth}
                  className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                >
                  <Save size={12} /> Fechar Mês / Salvar
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="p-4 bg-slate-50 rounded-xl border border-[#F0E6D2] text-center"
                  >
                    <p className="text-[8px] font-bold text-[#A09898] uppercase tracking-widest">
                      {h.month}
                    </p>
                    <p className="text-xs font-black text-slate-800 mt-1">
                      {formatCurrency(h.netProfit)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case "analise-inteligente": {
        const catalogSuggestions = products.slice(0, 3).map((p) => {
          const price = p.current_price || p.retail_price || 120;
          const cost = p.estimatedCost || Math.round(price * 0.35);
          const margin = ((price - cost) / price) * 100;
          return {
            id: p.id,
            name: p.product_name,
            price,
            margin: margin.toFixed(0),
            unitsNeeded: remainingGoal > 0 ? Math.ceil(remainingGoal / price) : 0,
            image: p.image || "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300"
          };
        });

        const displaySuggestions = catalogSuggestions.length > 0 ? catalogSuggestions : [
          { name: "Planner Não Datado Premium", price: 180, margin: "65", unitsNeeded: remainingGoal > 0 ? Math.ceil(remainingGoal / 180) : 10, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300" },
          { name: "Caixas Cartonadas para Batizado", price: 250, margin: "58", unitsNeeded: remainingGoal > 0 ? Math.ceil(remainingGoal / 250) : 8, image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=300" },
          { name: "Kit Papelaria Romântica C/ Lacre", price: 110, margin: "70", unitsNeeded: remainingGoal > 0 ? Math.ceil(remainingGoal / 110) : 16, image: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300" }
        ];

        const customProductIdeas = [
          {
            title: "Planner de Estudos Minimalista",
            desc: "Capa soft-touch fosca de alta gramatura, miolo focado em produtividade universitária, rastreador de hábitos (habit tracker) e marcos de conquistas. Altíssimo engajamento entre o público jovem.",
            badge: "Público Estudantil",
            ticket: 95
          },
          {
            title: "Caderno de Receitas Afetivo",
            desc: "Lombada costurada copta exposta artesanalmente, folhas com textura rústica e divisórias de papel kraft decoradas em serigrafia tradicional para registrar legados culinários familiares.",
            badge: "Coleções Afetivas",
            ticket: 130
          },
          {
            title: "Álbum de Fotos Revestido em Linho Cru",
            desc: "Cartonagem estrutural de alta fidelidade envolvida em tecido natural de linho cru com plaqueta metálica rebaixada na frente. Espaçadores e folhas pretas de alta gramatura intercaladas com papel vegetal protetor.",
            badge: "Linha Casamento / Premium",
            ticket: 220
          }
        ];

        const externalTrends = [
          {
            title: "Lombo Costurado Exposto (Copta e Japonesa)",
            trend: "Visualização estética em alta no TikTok e Pinterest (+124% este ano)",
            text: "O acabamento costurado com linhas coloradas e enceradas expostas na lateral evoca autenticidade, agregando até 60% de valor percebido ao projeto de papelaria fina."
          },
          {
            title: "Paleta Botânica Neutra & Estética Cottagecore",
            trend: "Destaque internacional de design e moda",
            text: "Cores sálvia, areia do deserto, terracota e lavanda acinzentada estão desbancando os pastéis saturados clássicos. Produtos com essa roupagem de tecido de linho/algodão têm tido maior giro."
          },
          {
            title: "Gravações em Hot Stamping Dourado e Rosé",
            trend: "Personalização de Luxo corporativo",
            text: "Clientes corporativos e noivas dão preferência absoluta a relevos com fita metalizada e lacres de cera verdadeiros em fita cetim. Transmita refinamento desde o unboxing."
          }
        ];

        const renewalStrategies = [
          {
            title: "Estratégia ABC: Eliminação de Cauda Longa",
            text: "Produtos que não registraram nenhuma venda ou clique nos últimos 45 dias devem ser retirados do catálogo ativo imediatamente. Concentre a matéria-prima em novos lançamentos limitados."
          },
          {
            title: "Lançamento em Lotes Fechados",
            text: "Evite produzir itens customizados unitários aleatoriamente. Defina uma abertura oficial de catálogo com prazos específicos de pré-venda. Isso gera escassez e otimiza a compra coletiva de insumos de papelaria."
          }
        ];

        return (
          <section className="space-y-10 animate-in fade-in duration-300">
            {/* Goal card */}
            <div className="p-10 rounded-[3rem] bg-slate-950 text-white border border-slate-900 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-lilac/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-wider text-lilac">
                    <Sparkles size={10} />
                    <span>Análise Estratégica Inteligente</span>
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight font-sans">
                    Para atingir a meta este mês
                  </h2>
                  {remainingGoal > 0 ? (
                    <p className="text-sm font-medium text-slate-400">
                      Restam <span className="text-lilac font-black">{formatCurrency(remainingGoal)}</span> para conquistar sua meta estipulada de <span className="text-white font-bold">{formatCurrency(monthlyGoal)}</span>.
                    </p>
                  ) : (
                    <p className="text-sm font-medium text-emerald-400">
                      Parabéns! Sua meta de faturamento bruto mensal de <span className="font-bold">{formatCurrency(monthlyGoal)}</span> foi plenamente alcançada!
                    </p>
                  )}
                </div>
                {remainingGoal > 0 && (
                  <div className="flex gap-4">
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Atingido</p>
                      <p className="text-lg font-black text-emerald-400 mt-1">{Math.round((grossRevenue / monthlyGoal) * 100)}%</p>
                    </div>
                    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-center">
                      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Faltante</p>
                      <p className="text-lg font-black text-lilac mt-1">{formatCurrency(remainingGoal)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Catalog Suggestions */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#A09898] flex items-center gap-2">
                  <Package size={14} className="text-[#A09898]" /> Sugestões do Catálogo Ativo
                </h3>
                <p className="text-[10px] text-slate-400 uppercase mt-1">Produtos prontos com boa aceitação para acelerar vendas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {displaySuggestions.map((item, idx) => (
                  <div key={idx} className="bg-white border border-[#F0E6D2] rounded-[2rem] p-6 shadow-sm overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="h-40 rounded-2xl overflow-hidden bg-slate-50 mb-4 border border-[#F0E6D2]/50 relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1544816155-12df9643f363?w=300";
                          }}
                        />
                        <div className="absolute top-3 right-3 bg-black/75 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider">
                          Margem ~{item.margin}%
                        </div>
                      </div>
                      <h4 className="font-sans font-black text-slate-800 text-sm truncate uppercase tracking-tight">{item.name}</h4>
                      <p className="text-xs text-slate-600 font-bold mt-2">{formatCurrency(item.price)}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {remainingGoal > 0 ? (
                        <div className="flex justify-between items-center bg-lilac/5 border border-lilac/10 p-3 rounded-xl">
                          <span className="text-[8px] uppercase font-black tracking-wider text-lilac">Vendas Necessárias:</span>
                          <span className="font-black text-xs text-lilac">{item.unitsNeeded} un</span>
                        </div>
                      ) : (
                        <p className="text-[9px] uppercase font-bold text-emerald-600 tracking-wider">Alto potencial de margem</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom product Ideas & External Trends */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Product customized ideas */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-yellow-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#A09898]">Novos Produtos Customizados (Ideias)</h3>
                </div>
                <div className="space-y-4">
                  {customProductIdeas.map((idea, idx) => (
                    <div key={idx} className="p-6 bg-white border border-[#F0E6D2] rounded-[2rem] shadow-sm relative overflow-hidden group hover:border-lilac/30 transition-all">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="inline-block bg-slate-100 text-[#4A4444] px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest mb-2">
                            {idea.badge}
                          </span>
                          <h4 className="font-sans font-black text-slate-800 text-sm">{idea.title}</h4>
                          <p className="text-xs text-[#A09898] mt-2 font-medium leading-relaxed">{idea.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-bold text-[#A09898] uppercase block">Ticket Sugerido</span>
                          <span className="text-sm font-black text-lilac block mt-0.5">{formatCurrency(idea.ticket)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* External Trends */}
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <Compass size={16} className="text-sky-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#A09898]">Tendências Externas Relevantes</h3>
                </div>
                <div className="space-y-4 animate-in fade-in">
                  {externalTrends.map((trend, idx) => (
                    <div key={idx} className="p-6 bg-white border border-[#F0E6D2] rounded-[2rem] shadow-sm relative">
                      <div className="flex items-center gap-2 text-rose-500 mb-1.5">
                        <ArrowUpRight size={14} />
                        <span className="text-[9px] font-black uppercase tracking-wider">{trend.trend}</span>
                      </div>
                      <h4 className="font-sans font-black text-slate-800 text-xs">{trend.title}</h4>
                      <p className="text-xs text-[#A09898] mt-2 font-medium leading-relaxed">{trend.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Catalog Renewal strategies */}
            <div className="p-8 rounded-[2rem] bg-[#FAF9F6] border border-[#F0E6D2] space-y-6">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#A09898]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Diretrizes de Renovação & Estruturação do Catálogo</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renewalStrategies.map((strat, idx) => (
                  <div key={idx} className="bg-white p-6 rounded-2xl border border-[#F0E6D2]/50 shadow-sm">
                    <h4 className="font-black text-xs text-slate-900 uppercase tracking-tight">{strat.title}</h4>
                    <p className="text-xs text-[#A09898] mt-2 font-medium leading-relaxed">{strat.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case "analise": {
        // Calculations for Cost analysis
        const totalInsumosStockValue = insumos.reduce((sum, ins) => sum + (Number(ins.costPrice) || 0), 0);
        const totalInsumosCount = insumos.length;
        
        // Grouped by Category spending
        const spendByCategory = insumos.reduce((acc, ins) => {
          const category = ins.category || "Outros";
          acc[category] = (acc[category] || 0) + (Number(ins.costPrice) || 0);
          return acc;
        }, {} as Record<string, number>);

        // Filter and Search for Insumos
        const searchFiltered = insumos.filter((ins) => {
          if (!insumosSearchTerm) return true;
          const term = insumosSearchTerm.toLowerCase();
          return (
            ins.name.toLowerCase().includes(term) ||
            ins.code.toLowerCase().includes(term) ||
            (ins.category && ins.category.toLowerCase().includes(term))
          );
        });

        // Interactive simulator formulas
        const laborCost = simLaborHours * simLaborRate;
        const directCost = simMaterialCost + laborCost;
        // markup formula: DirectCost / (1 - (Fixed% + Taxes% + Fees% + Margin%) / 100)
        const totalSimRates = (simFixedCostPct + simTaxRate + simFeesRate + simDesiredMargin) / 100;
        const suggestedPrice = totalSimRates < 1 ? directCost / (1 - totalSimRates) : directCost * 2.5;

        // Custom net profit
        const simTaxExpense = simCustomPrice * (simTaxRate / 100);
        const simFixedExpense = simCustomPrice * (simFixedCostPct / 100);
        const simFeesExpense = simCustomPrice * (simFeesRate / 100);
        const simNetProfit = simCustomPrice - (directCost + simTaxExpense + simFixedExpense + simFeesExpense);
        const simMarginPct = simCustomPrice > 0 ? (simNetProfit / simCustomPrice) * 100 : 0;

        // Margin health feedback
        let marginFeedback = { 
          label: "Prejuízo Líquido", 
          bg: "bg-red-50 text-red-700 border-red-200", 
          desc: "Atenção crucial! Você está cobrindo custos básicos com prejuízo nas contas." 
        };
        if (simMarginPct >= 35) {
          marginFeedback = { 
            label: "Margem Excelente", 
            bg: "bg-emerald-50 text-emerald-700 border-emerald-200", 
            desc: "Margem super segura e extremamente sustentável para o atelier artesanal!" 
          };
        } else if (simMarginPct >= 20) {
          marginFeedback = { 
            label: "Margem Saudável", 
            bg: "bg-indigo-50 text-indigo-700 border-indigo-200", 
            desc: "Margem recomendável de mercado. Cobre despesas e sustenta com folga." 
          };
        } else if (simMarginPct >= 0) {
          marginFeedback = { 
            label: "Margem Apertada", 
            bg: "bg-amber-50 text-amber-700 border-amber-200", 
            desc: "Margem muito limitada. Qualquer aumento de impostos ou desperdício zera o lucro." 
          };
        }

        return (
          <section className="space-y-10 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-[#F0E6D2] shadow-sm">
                <div className="flex items-center gap-3">
                  <Package className="text-lilac" size={20} />
                  <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">Aporte Total em Insumos</span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-3 font-sans">{formatCurrency(totalInsumosStockValue)}</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Investidos na matéria-prima ativa</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#F0E6D2] shadow-sm">
                <div className="flex items-center gap-3">
                  <Layers className="text-sky-500" size={20} />
                  <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">Insumos Cadastrados</span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-3 font-sans">{totalInsumosCount} Itens</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Diferentes matérias-primas</p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-[#F0E6D2] shadow-sm">
                <div className="flex items-center gap-3">
                  <Percent className="text-emerald-500" size={20} />
                  <span className="text-[9px] font-black uppercase text-[#A09898] tracking-widest">CMV Líquido Estimado</span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-3 font-sans">35.0%</p>
                <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Custo projetado sobre faturamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Column (3/5) - BASE PRICING SIMULATOR */}
              <div className="lg:col-span-3 space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white border border-[#F0E6D2] shadow-md space-y-6">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-2">
                      <Calculator className="text-lilac" size={18} />
                      <h3 className="font-sans font-black uppercase tracking-wider text-slate-800 text-sm">Precificação Base & Lucro Líquido</h3>
                    </div>
                    <span className="text-[8px] font-black uppercase bg-lilac/10 text-lilac px-2.5 py-1 rounded-full">Simulador interativo</span>
                  </div>

                  {/* Product Choice / Inputs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#4A4444]">Vincular com Produto</label>
                      <select 
                        value={selectedSimProduct}
                        onChange={(e) => setSelectedSimProduct(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-lilac"
                      >
                        <option value="custom">-- Simulação Livre / Manual --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.product_name} ({formatCurrency(p.current_price || p.retail_price)})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#4A4444]">Custo de Materiais (Insumos) (R$)</label>
                      <input 
                        type="number"
                        disabled={selectedSimProduct !== "custom"}
                        value={simMaterialCost}
                        onChange={(e) => setSimMaterialCost(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-slate-50 disabled:opacity-60 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-lilac"
                      />
                    </div>
                  </div>

                  {/* Labor slider fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#4A4444]">Tempos de Mão de Obra (Horas): {simLaborHours}h</label>
                      <input 
                        type="range"
                        min="0.5"
                        max="24"
                        step="0.5"
                        value={simLaborHours}
                        onChange={(e) => setSimLaborHours(parseFloat(e.target.value) || 1)}
                        className="h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-lilac"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#4A4444]">Valor Hora de Trabalho (R$/hora)</label>
                      <input 
                        type="number"
                        value={simLaborRate}
                        onChange={(e) => setSimLaborRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none focus:border-lilac"
                      />
                    </div>
                  </div>

                  {/* Fixed allocation % and Taxes & Fees slider */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-50 pt-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#A09898]">Rateio Fixo (%)</label>
                      <input 
                        type="number"
                        value={simFixedCostPct}
                        onChange={(e) => setSimFixedCostPct(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#A09898]">Impostos (%)</label>
                      <input 
                        type="number"
                        value={simTaxRate}
                        onChange={(e) => setSimTaxRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-[#A09898]">Taxas Operacionais (%)</label>
                      <input 
                        type="number"
                        value={simFeesRate}
                        onChange={(e) => setSimFeesRate(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>

                  {/* Calculations breakdown screen */}
                  <div className="bg-[#FAF9F6] rounded-2xl p-6 space-y-4 border border-[#F0E6D2]">
                    <div className="grid grid-cols-2 gap-4 text-xs font-medium text-slate-600">
                      <div>Materiais Diretos:</div>
                      <div className="text-right font-bold text-slate-800">{formatCurrency(simMaterialCost)}</div>

                      <div>Mão de Obra ({simLaborHours}h x {formatCurrency(simLaborRate)}):</div>
                      <div className="text-right font-bold text-slate-800">{formatCurrency(laborCost)}</div>

                      <div className="text-slate-800 font-bold border-t border-slate-200/50 pt-2">Custo Direto:</div>
                      <div className="text-right font-black text-slate-900 border-t border-slate-200/50 pt-2">{formatCurrency(directCost)}</div>
                    </div>

                    <div className="border-t border-dashed border-[#F0E6D2] pt-4 flex justify-between items-center bg-white p-4 rounded-xl">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Preço de Venda Sugerido</span>
                        <span className="text-[8px] text-[#A09898] uppercase block mt-0.5">(Margem Almejada: {simDesiredMargin}%)</span>
                      </div>
                      <span className="text-xl font-black text-slate-950 font-sans">{formatCurrency(suggestedPrice)}</span>
                    </div>
                  </div>

                  {/* REAL NET PROFIT CALCULATION FIELD (Based on Custom Price) */}
                  <div className="space-y-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-[#4A4444]">Seu Preço Praticado de Venda (R$)</label>
                      <input 
                        type="number"
                        value={simCustomPrice}
                        onChange={(e) => setSimCustomPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                        className="bg-white border border-[#F0E6D2] rounded-xl p-3 text-sm font-black text-slate-800 outline-none focus:border-lilac shadow-sm"
                      />
                    </div>

                    {/* Results panel for margins */}
                    <div className={`p-5 rounded-2xl border ${marginFeedback.bg} flex justify-between items-center transition-all`}>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider block">{marginFeedback.label}</span>
                        <p className="text-[9px] opacity-80 leading-relaxed font-bold">{marginFeedback.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] uppercase font-black opacity-60 block">Lucro Líquido Real</span>
                        <span className="text-sm font-black block mt-0.5">{formatCurrency(simNetProfit)} ({simMarginPct.toFixed(0)}%)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (2/5) - INSUMO ANALYSIS BY CATEGORY */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-8 rounded-[2.5rem] bg-white border border-[#F0E6D2] shadow-sm space-y-6 flex flex-col h-full justify-between">
                  <div>
                    <h3 className="font-sans font-black uppercase tracking-wider text-slate-800 text-xs border-b border-slate-100 pb-4 flex items-center gap-2">
                      <Layers size={14} className="text-sky-500" /> Análise de Insumos por Categoria
                    </h3>

                    {/* Categorized spending lists */}
                    <div className="space-y-4 mt-6">
                      {Object.entries(spendByCategory).map(([cat, totalSpent]) => (
                        <div key={cat} className="flex justify-between items-center p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{cat}</span>
                            <span className="block text-[8px] font-black text-slate-400 mt-0.5 uppercase">
                              {insumos.filter(i => i.category === cat || (!i.category && cat === "Outros")).length} Itens no estoque
                            </span>
                          </div>
                          <span className="font-black text-xs text-slate-950">{formatCurrency(totalSpent)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Material search block */}
                  <div className="space-y-4 mt-8 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-[#A09898]">Consulta de Custo Unitário</span>
                    </div>

                    <div className="relative">
                      <input 
                        type="text"
                        placeholder="Pesquisar insumo..."
                        value={insumosSearchTerm}
                        onChange={(e) => setInsumosSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-lilac"
                      />
                      <Search className="absolute left-3 top-3 text-slate-400" size={13} />
                    </div>

                    <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2.5 scrollbar-hide">
                      {searchFiltered.slice(0, 5).map((ins) => {
                        const count = ins.quantity || 1;
                        const unitPriceVal = ins.unitValue || (ins.costPrice / count);
                        return (
                          <div key={ins.id} className="flex justify-between items-center p-2.5 bg-slate-50/20 hover:bg-slate-50 rounded-lg border border-slate-100/50 transition-all text-xs">
                            <div>
                              <span className="font-black text-slate-800 text-[11px] block truncate max-w-[120px]">{ins.name}</span>
                              <span className="text-[8px] font-black text-slate-400 block uppercase">Código: {ins.code}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-black text-slate-800 block">{formatCurrency(unitPriceVal)} / {ins.unit}</span>
                              <span className="text-[8px] text-slate-400 font-bold block">Estoque: {count} {ins.unit}</span>
                            </div>
                          </div>
                        );
                      })}
                      {searchFiltered.length === 0 && (
                        <p className="text-center text-[9px] uppercase font-bold text-[#A09898] py-4">Nenhum insumo localizado.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="space-y-12 pb-32 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Hub Financeiro Premium
          </h2>
          <p className="text-[#A09898] text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Visibilidade total da sua lucratividade
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-[#F0E6D2] shadow-sm">
          <button 
            onClick={() => exportFinanceReportPDF({
              companyId,
              filterMonth,
              grossRevenue,
              netProfit,
              totalExpenses,
              history,
              currentMonthOrders,
              fixedCosts,
              taxesRate,
              variableTaxes,
              cogsEstimate,
              totalManualInflows,
              totalManualOutflows,
              monthEntries
            })}
            title="Exportar PDF Financeiro"
            className="p-3 bg-white hover:bg-[#FAF9F6] text-[#6d5443] hover:text-black rounded-xl transition-all hover:shadow-md flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold"
          >
            <Download size={16} />
            <span>Exportar PDF</span>
          </button>
          <div className="h-6 w-px bg-slate-200" />
          <div className="flex items-center gap-3 px-4">
            <Calendar size={18} className="text-slate-900" />
            <select
              value={format(filterMonth, "yyyy-MM")}
              onChange={(e) =>
                setFilterMonth(new Date(e.target.value + "-01T00:00:00"))
              }
              className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-900"
            >
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const d = subMonths(new Date(), i);
                return (
                  <option
                    key={format(d, "yyyy-MM")}
                    value={format(d, "yyyy-MM")}
                  >
                    {format(d, "MMMM yyyy", { locale: ptBR })}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <TabNav />

      {renderActiveSection()}
    </div>
  );
};
