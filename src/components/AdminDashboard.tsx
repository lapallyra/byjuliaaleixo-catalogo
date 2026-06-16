import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Product, CompanyId, Order, Insumo, Customer } from "../types";
import {
  addProduct,
  updateProduct,
  deleteProduct,
  subscribeToProducts,
  subscribeToSales,
  subscribeToInsumos,
  subscribeToCustomers,
  subscribeToSuggestions,
  subscribeToFeedbacks,
  markSuggestionAsRead,
  subscribeToAllSettings,
  addInsumo,
  updateInsumo,
  deleteInsumo,
  updateOrderStatus,
  updateOrder,
  saveSale,
  subscribeToCheckoutEvents,
} from "../services/firebaseService";
import { db } from "../lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import {
  ArrowLeft,
  LayoutDashboard,
  ShoppingBag,
  Calendar,
  Archive,
  Box,
  Search,
  Bell,
  LogOut,
  Settings,
  User,
  X,
  DollarSign,
  BarChart3,
  Sparkles,
  Gift,
  ChevronRight,
  Star,
  Heart,
  TrendingUp,
  FileCheck,
  PackagePlus,
} from "lucide-react";
import { playSuccessSound } from "../utils/audio";
import { useAuth } from "./AuthProvider";

// Modular Tabs
import { DashboardTab } from "./Admin/DashboardTab";
import { OrdersTab } from "./Admin/OrdersTab";
import { InventoryTab } from "./Admin/InventoryTab";
import { ProductsTab } from "./Admin/ProductsTab";
import { KitsTab } from "./Admin/KitsTab";
import { ClientsTab } from "./Admin/ClientsTab";
import { FinanceTab } from "./Admin/FinanceTab";
import { ReportsTab } from "./Admin/ReportsTab";
import { SettingsTab } from "./Admin/SettingsTab";
import { GiftListsTab } from "./Admin/GiftListsTab";
import { CommemorativeDatesTab } from "./Admin/CommemorativeDatesTab";
import { AddonsTab } from "./Admin/AddonsTab";
import { PrizesTab } from "./Admin/PrizesTab";
import { FeedbacksTab } from "./Admin/FeedbacksTab";
import { FunnelLogsTab } from "./Admin/FunnelLogsTab";
import { AuditoriaTab } from "./Admin/AuditoriaTab";

import { AdminNotificationPortal } from "./AdminNotificationPortal";
import { OrderReceiptModal } from "./Admin/OrderReceiptModal";
import { safeFormatISO } from "../lib/dateUtils";
import { ErrorBoundary } from "./ErrorBoundary";
import { ImageWithFallback } from "./ImageWithFallback";

type TabType =
  | "dashboard"
  | "orders"
  | "inventory"
  | "products"
  | "kits"
  | "clients"
  | "finance"
  | "auditoria"
  | "gift-lists"
  | "commemorative-dates"
  | "reports"
  | "settings"
  | "addons"
  | "prizes"
  | "feedbacks"
  | "funnel";

interface AdminDashboardProps {
  onGoBack: () => void;
}

const TabLoader = () => (
  <div className="h-64 flex flex-col items-center justify-center gap-4 animate-in fade-in">
    <div className="w-12 h-12 border-4 border-lilac border-t-transparent rounded-full animate-spin" />
    <span className="text-[10px] font-black uppercase text-lilac tracking-widest">
      Carregando...
    </span>
  </div>
);

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onGoBack }) => {
  const { user, isAdmin, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [selectedCompanyId, setSelectedCompanyId] =
    useState<CompanyId>("pallyra"); // Default to first
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [tabError, setTabError] = useState<string | null>(null);

  // Clear tab error when switching tabs
  useEffect(() => {
    setTabError(null);
  }, [activeTab]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Order[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [checkoutEvents, setCheckoutEvents] = useState<any[]>([]);
  const [activeNotificationTab, setActiveNotificationTab] = useState<'suggestions' | 'feedbacks'>('suggestions');
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [globalSearch, setGlobalSearch] = useState("");
  const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [printingOrder, setPrintingOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAdmin || !user) return;

    console.log("Attaching admin listeners as:", user.email);

    const handleEditOrder = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setSelectedOrderId(customEvent.detail);
        setActiveTab("orders");
      }
    };

    window.addEventListener('edit-order', handleEditOrder);

    const unsubProducts = subscribeToProducts(setProducts);
    const unsubSales = subscribeToSales((loaded) =>
      setSales(loaded as Order[]),
    );
    const unsubSettings = subscribeToAllSettings(setSettings);
    const unsubInsumos = subscribeToInsumos(setInsumos);
    const unsubCustomers = subscribeToCustomers(setCustomers);
    const unsubSuggestions = subscribeToSuggestions(setSuggestions);
    const unsubFeedbacks = subscribeToFeedbacks(setFeedbacks);
    const unsubFunnel = subscribeToCheckoutEvents(setCheckoutEvents);

    return () => {
      window.removeEventListener('edit-order', handleEditOrder);
      unsubProducts();
      unsubSales();
      unsubSettings();
      unsubInsumos();
      unsubCustomers();
      unsubSuggestions();
      unsubFeedbacks();
      unsubFunnel();
    };
  }, [isAdmin, user]);

  if (loading) {
    return (
      <div className="feminine-admin min-h-screen admin-bg flex flex-col items-center justify-center p-8">
        <TabLoader />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="feminine-admin min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gold/10 rounded-[2rem] flex items-center justify-center mb-6 border border-gold/20">
          <Box className="text-gold" size={40} />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter">
          Acesso Restrito
        </h2>
        <p className="text-[#A09898] mb-8 max-w-sm font-sans text-xs uppercase tracking-widest leading-loose">
          Este painel é exclusivo para a administração. Faça login com as
          credenciais autorizadas.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => import("../lib/firebase").then((m) => m.login())}
            className="bg-gold text-slate-900 font-bold py-4 px-10 rounded-2xl hover:scale-105 transition-all shadow-[0_20px_60px_rgba(212,175,55,0.3)]"
          >
            Acessar com Google
          </button>
          <button
            onClick={onGoBack}
            className="text-slate-500 hover:text-white transition-all text-[9px] uppercase font-black tracking-[0.3em] mt-4"
          >
            ← Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  const menuItems: { id: TabType; label: string; icon: any; category: string }[] = [
    { id: "dashboard", label: "Dashboard", category: "PAINEL", icon: LayoutDashboard },
    { id: "orders", label: "Pedidos", category: "OPERAÇÃO", icon: ShoppingBag },
    { id: "clients", label: "Clientes", category: "OPERAÇÃO", icon: User },
    { id: "products", label: "Produtos", category: "OPERAÇÃO", icon: Box },
    { id: "kits", label: "Kits", category: "OPERAÇÃO", icon: PackagePlus },
    { id: "inventory", label: "Estoque", category: "OPERAÇÃO", icon: Archive },
    { id: "finance", label: "Financeiro", category: "FINANCEIRO", icon: DollarSign },
    { id: "auditoria", label: "Auditoria", category: "FINANCEIRO", icon: FileCheck },
    { id: "reports", label: "Relatórios", category: "FINANCEIRO", icon: BarChart3 },
    { id: "settings", label: "Configurações", category: "SISTEMA", icon: Settings },
  ];

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="feminine-admin h-screen bg-[#FAF9F6] text-[#4A4444] flex font-sans overflow-hidden relative">
      <AdminNotificationPortal />

      {/* Sidebar navigation - Desktop */}
      <aside
        className={`bg-white border-r border-[#F0E6D2] flex flex-col hidden lg:flex flex-shrink-0 relative z-[60] shadow-[10px_0_30px_rgba(240,230,210,0.2)] transition-all duration-300 ${isSidebarCollapsed ? "w-20 items-center" : "w-64"}`}
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,1), rgba(250,246,243,1))" }}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-1.5 top-10 bg-white border border-[#F0E6D2] w-4 h-4 flex items-center justify-center rounded-full z-50 text-[#A09088] hover:text-[#B48E4D] transition-all opacity-70 hover:opacity-100"
        >
          <ChevronRight
            size={10}
            className={`transition-transform duration-300 ${!isSidebarCollapsed ? "rotate-180" : ""}`}
          />
        </button>

        <div className={`flex flex-col flex-1 overflow-hidden p-6 ${isSidebarCollapsed ? "px-4" : ""}`}>
          <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D88D85] to-[#F0E6D2] flex items-center justify-center text-white shadow-[0_8px_20px_rgba(216,141,133,0.3)]">
              <Sparkles size={20} />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-sans font-semibold text-xs tracking-[0.1em] uppercase text-[#4A3A34]">
                   By Julia Aleixo
                </h1>
                <p className="text-[7px] text-[#D88D85] uppercase tracking-widest font-bold">
                  CEO PRINCIPAL
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-2">
            <nav className="space-y-8 pb-10">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category}>
                  {!isSidebarCollapsed && (
                    <h3 className="text-[9px] font-black uppercase text-[#A09088] tracking-[0.2em] pl-4 mb-4 opacity-60">{category}</h3>
                  )}
                  <div className="space-y-1.5">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all relative group overflow-hidden ${activeTab === item.id ? "text-[#2D221F] shadow-sm" : "text-[#5F524C] hover:text-[#2D221F] hover:bg-white/50"}`}
                      >
                        {activeTab === item.id && (
                          <motion.div
                            layoutId="activeNavBg"
                            className="absolute inset-0 bg-[#FFFDFB] border border-[#F0E6D2] rounded-2xl"
                          />
                        )}
                        <item.icon
                          size={18}
                          className={`${activeTab === item.id ? "text-[#D88D85] opacity-100 scale-110" : "text-[#A09088] opacity-70 group-hover:text-[#D88D85] group-hover:opacity-100 group-hover:scale-110"} transition-all duration-300 relative z-10 w-5 h-5`}
                        />
                        {!isSidebarCollapsed && (
                          <span
                            className={`text-[10px] uppercase font-bold tracking-[0.15em] relative z-10 ${activeTab === item.id ? "translate-x-1" : "group-hover:translate-x-1"} transition-transform duration-300`}
                          >
                            {item.label}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="p-6 border-t border-[#F0E6D2] space-y-3 bg-white/30 backdrop-blur-sm">
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-[#A09898] hover:bg-[#FAF9F6] hover:text-[#D48C8C] transition-all text-[9px] font-bold uppercase tracking-[0.15em] border border-transparent"
          >
            <LogOut size={16} /> {!isSidebarCollapsed && "Sair"}
          </button>
        </div>
      </div>
    </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-[110] lg:hidden border-r border-[#F0E6D2] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#D48C8C] text-white flex items-center justify-center shadow-lg shadow-rose-100">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <h1 className="font-sans font-semibold text-xs tracking-[0.1em] uppercase text-[#4A4444]">
                        By Julia Aleixo
                      </h1>
                      <p className="text-[7px] text-[#D48C8C] uppercase tracking-widest font-bold">
                        CEO PRINCIPAL
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 bg-[#FAF9F6] rounded-xl text-[#A09898] hover:text-[#D48C8C] transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(groupedMenu).map(([category, items]) => (
                    <div key={`mob-cat-${category}`}>
                      <h3 className="text-[9px] font-black uppercase text-[#D1CACA] tracking-widest pl-4 mb-2">{category}</h3>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <button
                            key={`mob-${item.id}`}
                            onClick={() => {
                              setActiveTab(item.id);
                              setTimeout(() => setIsMobileMenuOpen(false), 100);
                            }}
                            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? "bg-[#FAF9F6] text-[#D48C8C]" : "text-[#A09898] hover:text-[#D48C8C] hover:bg-[#FAF9F6]"}`}
                          >
                            <item.icon
                              size={18}
                              className={
                                activeTab === item.id
                                  ? "text-[#D48C8C]"
                                  : "text-[#D1CACA]"
                              }
                            />
                            <span className="text-[9px] uppercase font-semibold tracking-[0.15em]">
                              {item.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="mt-auto pt-4 border-t border-[#F0E6D2] space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      window.location.href = "/";
                    }}
                    className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-[#D48C8C] bg-[#FAF9F6] transition-all text-[9px] font-bold uppercase tracking-[0.15em]"
                  >
                    <LogOut size={16} /> Sair
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-[#FAF9F6]">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-[#F0E6D2] px-6 lg:px-8 flex items-center justify-between z-50 flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-6 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#A09898] hover:text-[#D48C8C] transition-all"
            >
              <LayoutDashboard size={20} />
            </button>
            <div className="relative w-full max-w-sm md:block hidden">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D1CACA]"
                size={14}
              />
              <input
                type="text"
                placeholder="Pesquisar..."
                className="w-full bg-[#FAF9F6] border border-[#F0E6D2] focus:border-[#D48C8C] focus:ring-1 focus:ring-[#D48C8C]/10 rounded-xl pl-10 pr-4 py-2 text-[9px] uppercase font-bold tracking-[0.1em] outline-none transition-all text-[#4A4444] placeholder:text-[#D1CACA]"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <div className="relative">
              <button
                onClick={() => setIsSuggestionsModalOpen(true)}
                className={`p-2 rounded-xl transition-all relative border border-transparent ${suggestions.some((s) => !s.read) ? "text-[#D48C8C] bg-[#FAF9F6]" : "text-[#A09898] hover:bg-[#FAF9F6]"}`}
              >
                <Bell size={18} />
                {suggestions.filter((s) => !s.read).length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D48C8C] rounded-full ring-2 ring-white" />
                )}
              </button>
            </div>

            <div className="h-5 w-px bg-[#F0E6D2] mx-2" />

            <div className="flex items-center gap-3 bg-[#FAF9F6] border border-[#F0E6D2] px-3 py-1 rounded-xl">
              <div className="flex flex-col items-end mr-1 hidden sm:flex">
                <span className="text-[8px] font-black uppercase text-[#4A3A34] tracking-widest">
                  JULIA ALEIXO
                </span>
                <span className="text-[6px] font-black uppercase text-[#D88D85] tracking-[0.2em]">
                  CEO PRINCIPAL
                </span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-white border border-[#F0E6D2] p-0.5 shadow-sm overflow-hidden">
                {user?.photoURL ? (
                  <ImageWithFallback
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full object-cover rounded shadow-inner"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D1CACA]">
                    <User size={12} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Tabs Container */}
        <div className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto px-6 py-6 lg:px-10 lg:py-8 scrollbar-hide scroll-smooth h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.995, y: 5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.005, y: -5 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="pb-24 lg:pb-12"
            >
              <React.Suspense fallback={<TabLoader />}>
                <ErrorBoundary
                  key={activeTab}
                  fallback={
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-9000 mb-6">
                        <X size={32} />
                      </div>
                      <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest mb-2">
                        Ops! Algo deu errado no Dashboard
                      </h3>
                      <p className="text-[10px] text-[#A09898] font-bold uppercase tracking-widest max-w-xs">
                        Encontramos um erro ao carregar as informações. Tente
                        recarregar a página.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-8 py-3 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest"
                      >
                        Recarregar Dashboard
                      </button>
                    </div>
                  }
                >
                  {activeTab === "dashboard" && (
                    <DashboardTab
                      orders={sales}
                      products={products}
                      customers={customers}
                      monthlyGoal={
                        settings[selectedCompanyId]?.monthly_goal || 0
                      }
                      onAction={(action) => {
                        if (action === "view_agenda") {
                          // Agenda tab is removed. Do nothing.
                        } else if (action === "new_order") setActiveTab("orders");
                        else if (action === "new_client")
                          setActiveTab("clients");
                        else if (action === "new_insumo")
                          setActiveTab("inventory");
                      }}
                      onOpenOrder={(order) => setPrintingOrder(order)}
                    />
                  )}
                  {printingOrder && (
                    <OrderReceiptModal
                      order={printingOrder}
                      onClose={() => setPrintingOrder(null)}
                    />
                  )}
                  {activeTab === "orders" && (
                    <OrdersTab
                      orders={sales}
                      products={products}
                      insumos={insumos}
                      companyId={selectedCompanyId}
                      onUpdateStatus={async (id, status) => {
                        await updateOrderStatus(id, status);
                        if (["fully_paid", "paid", "ready", "delivered", "planned_active"].includes(status)) {
                          playSuccessSound();
                        }
                      }}
                      onSaveOrder={async (data) => {
                        if (data.id) {
                          await updateOrder(data.id, data);
                          if (data.status && ["fully_paid", "paid", "ready", "delivered", "planned_active"].includes(data.status)) {
                            playSuccessSound();
                          }
                        } else {
                          await saveSale(data);
                          playSuccessSound();
                        }
                      }}
                      onDeleteOrder={async (id) => {
                        await deleteDoc(doc(db, "sales", id));
                      }}
                      initialOrderId={selectedOrderId}
                    />
                  )}
                  {activeTab === "inventory" && (
                    <InventoryTab
                      insumos={insumos}
                      onSaveInsumo={async (data) => {
                        if (data.id) {
                          await updateInsumo(data.id, data);
                        } else {
                          await addInsumo(data as any);
                        }
                      }}
                      onDeleteInsumo={(id) => deleteInsumo(id)}
                    />
                  )}
                  {activeTab === "products" && (
                    <ProductsTab
                      products={products}
                      insumos={insumos}
                      companyId={selectedCompanyId}
                      onSaveProduct={async (p) => {
                        if (p.id) {
                          await updateProduct(p.id, p);
                        } else {
                          await addProduct(p as any);
                        }
                      }}
                      onDeleteProduct={(id) => deleteProduct(id)}
                    />
                  )}
                  {activeTab === "kits" && (
                    <KitsTab
                      products={products}
                      insumos={insumos}
                      companyId={selectedCompanyId}
                    />
                  )}
                  {activeTab === "clients" && (
                    <ClientsTab
                      companyId={selectedCompanyId}
                      customers={customers}
                    />
                  )}
                  {activeTab === "gift-lists" && (
                    <GiftListsTab companyId={selectedCompanyId} />
                  )}
                  {activeTab === "commemorative-dates" && (
                    <CommemorativeDatesTab />
                  )}
                  {activeTab === "finance" && (
                    <FinanceTab
                      companyId={selectedCompanyId}
                      orders={sales}
                      products={products}
                      insumos={insumos}
                    />
                  )}
                  {activeTab === "reports" && (
                    <ReportsTab
                      companyId={selectedCompanyId}
                      orders={sales}
                      products={products}
                      customers={customers}
                      insumos={insumos}
                    />
                  )}
                  {activeTab === "auditoria" && (
                    <AuditoriaTab
                      companyId={selectedCompanyId}
                      orders={sales}
                      products={products}
                      insumos={insumos}
                    />
                  )}
                  {activeTab === "settings" && (
                    <SettingsTab companyId={selectedCompanyId} />
                  )}
                  {activeTab === "addons" && (
                    <AddonsTab companyId={selectedCompanyId} />
                  )}
                  {activeTab === "prizes" && (
                    <PrizesTab companyId={selectedCompanyId} />
                  )}
                  {activeTab === "feedbacks" && (
                    <FeedbacksTab feedbacks={feedbacks} />
                  )}
                  {activeTab === "funnel" && (
                    <FunnelLogsTab events={checkoutEvents} selectedCompanyId={selectedCompanyId} />
                  )}
                </ErrorBoundary>
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Suggestions Modal Overlay */}
        <AnimatePresence>
          {isSuggestionsModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-end p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-lg bg-[#FAF9F6] h-full lg:rounded-l-[2rem] border-l border-[#F0E6D2] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-8 border-b border-[#F0E6D2] bg-white space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FAF9F6] text-[#D48C8C] flex items-center justify-center border border-[#F0E6D2] shadow-sm">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#4A4444]">
                          Feedback & Sugestões
                        </h2>
                        <p className="text-[8px] text-[#D48C8C] font-medium uppercase tracking-[0.1em] mt-0.5">
                          Notificações e Ideias
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSuggestionsModalOpen(false)}
                      className="p-2.5 bg-[#FAF9F6] hover:bg-[#F0E6D2] rounded-xl text-[#A09898] transition-all cursor-pointer outline-none"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Tab menu */}
                  <div className="flex gap-2 p-1 bg-[#FAF9F6] rounded-xl border border-[#F0E6D2]">
                    <button
                      type="button"
                      onClick={() => setActiveNotificationTab('suggestions')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer outline-none ${
                        activeNotificationTab === 'suggestions'
                          ? 'bg-[#D48C8C] text-white'
                          : 'text-[#A09898] hover:text-[#4A4444]'
                      }`}
                    >
                      Sugestões ({suggestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNotificationTab('feedbacks')}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer outline-none ${
                        activeNotificationTab === 'feedbacks'
                          ? 'bg-[#D48C8C] text-white'
                          : 'text-[#A09898] hover:text-[#4A4444]'
                      }`}
                    >
                      Feedbacks ({feedbacks.length})
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-hide">
                  {activeNotificationTab === 'suggestions' ? (
                    <>
                      {suggestions.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                          <Box size={40} className="text-[#D1CACA] mb-4" />
                          <p className="text-[9px] font-medium uppercase tracking-widest text-[#A09898]">
                            Sem novas sugestões no momento.
                          </p>
                        </div>
                      )}
                      {[...suggestions]
                        .sort((a, b) => {
                          const timeA =
                            a.createdAt?.toMillis?.() ||
                            a.createdAt?.seconds * 1000 ||
                            0;
                          const timeB =
                            b.createdAt?.toMillis?.() ||
                            b.createdAt?.seconds * 1000 ||
                            0;
                          return timeB - timeA;
                        })
                        .map((s, idx) => (
                          <motion.div
                            key={s.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={() => {
                              if (!s.read) markSuggestionAsRead(s.id);
                            }}
                            className={`p-6 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${s.read ? "bg-white/50 border-[#F0E6D2] opacity-50" : "bg-white border-[#D48C8C]/20 shadow-lg shadow-[#D48C8C]/5"}`}
                          >
                            <div className="flex justify-between items-center mb-4">
                              <span
                                className={`text-[8px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded ${s.read ? "bg-[#F0E6D2] text-[#A09898]" : "bg-[#D48C8C] text-white"}`}
                              >
                                {s.companyId}
                              </span>
                              <span className="text-[8px] font-medium text-[#A09898] uppercase tracking-widest">
                                {s.createdAt?.toDate
                                  ? s.createdAt.toDate().toLocaleDateString()
                                  : "Recent"}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-[#4A4444] leading-relaxed whitespace-pre-wrap">
                              {s.message}
                            </p>
                            {!s.read && (
                              <div className="mt-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D48C8C] shadow-[0_0_8px_rgba(212,140,140,1)] animate-pulse" />
                                <span className="text-[7px] font-semibold uppercase text-[#D48C8C] tracking-widest">
                                  Nova atividade
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </>
                  ) : (
                    <>
                      {feedbacks.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-40">
                          <Heart size={40} className="text-[#D1CACA] mb-4 animate-pulse text-[#D1CACA]" />
                          <p className="text-[9px] font-medium uppercase tracking-widest text-[#A09898]">
                            Nenhum feedback recebido ainda.
                          </p>
                        </div>
                      )}
                      {[...feedbacks]
                        .sort((a, b) => {
                          const timeA =
                            a.createdAt?.toMillis?.() ||
                            a.createdAt?.seconds * 1000 ||
                            0;
                          const timeB =
                            b.createdAt?.toMillis?.() ||
                            b.createdAt?.seconds * 1000 ||
                            0;
                          return timeB - timeA;
                        })
                        .map((fb, idx) => (
                          <motion.div
                            key={fb.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-6 rounded-2xl border border-[#F0E6D2] bg-white shadow-sm hover:shadow-md transition-all text-[#4A4444]"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest">
                                {fb.name}
                              </span>
                              <span className="text-[8px] font-medium text-[#A09898] uppercase tracking-widest">
                                {fb.createdAt?.toDate
                                  ? fb.createdAt.toDate().toLocaleDateString()
                                  : "Recent"}
                              </span>
                            </div>
                            
                            <div className="flex gap-0.5 mb-3 text-[#D48C8C]">
                              {Array.from({ length: fb.stars || 5 }).map((_, i) => (
                                <Star key={i} size={11} fill="currentColor" stroke="none" />
                              ))}
                            </div>

                            <p className="text-[11px] text-gray-500 leading-relaxed italic">
                              "{fb.text}"
                            </p>
                          </motion.div>
                        ))}
                    </>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
