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
  Activity,
  Layers,
  UploadCloud,
  Megaphone,
  Tag,
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
import { ActivityLogTab } from "./Admin/ActivityLogTab";
import { CollectionsTab } from "./Admin/CollectionsTab";
import { MediaCenterTab } from "./Admin/MediaCenterTab";
import { CampaignsTab } from "./Admin/CampaignsTab";
import { CouponsTab } from "./Admin/CouponsTab";

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
  | "funnel"
  | "activity-logs"
  | "collections"
  | "media-center"
  | "campaigns"
  | "coupons";

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
      <div className="min-h-screen bg-[#F5F5F7] flex flex-col items-center justify-center p-8">
        <TabLoader />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#1C1C1E] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <Box className="text-[#F5F5F7]" size={40} />
        </div>
        <h2 className="text-3xl font-medium text-white mb-4 tracking-tight">
          Acesso Restrito
        </h2>
        <p className="text-[#8E8E93] mb-8 max-w-sm text-sm leading-relaxed">
          Este painel é exclusivo para a administração. Faça login com as
          credenciais autorizadas.
        </p>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => import("../lib/firebase").then((m) => m.login())}
            className="relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 text-white font-medium py-3.5 px-8 rounded-2xl hover:bg-white/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
            <div className="absolute inset-0 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2)] rounded-2xl" />
            <span className="relative z-10 flex items-center justify-center gap-2">
               Acessar com Google
            </span>
          </button>
          <button
            onClick={onGoBack}
            className="text-[#8E8E93] hover:text-white transition-colors text-xs font-medium mt-4"
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
    { id: "collections", label: "Coleções", category: "OPERAÇÃO", icon: Layers },
    { id: "campaigns", label: "Campanhas", category: "OPERAÇÃO", icon: Megaphone },
    { id: "coupons", label: "Cupons", category: "OPERAÇÃO", icon: Tag },
    { id: "gift-lists", label: "Lista de Presentes", category: "OPERAÇÃO", icon: Gift },
    { id: "media-center", label: "Central de Mídia", category: "OPERAÇÃO", icon: UploadCloud },
    { id: "kits", label: "Kits", category: "OPERAÇÃO", icon: PackagePlus },
    { id: "inventory", label: "Estoque", category: "OPERAÇÃO", icon: Archive },
    { id: "finance", label: "Financeiro", category: "FINANCEIRO", icon: DollarSign },
    { id: "auditoria", label: "Auditoria", category: "FINANCEIRO", icon: FileCheck },
    { id: "reports", label: "Relatórios", category: "FINANCEIRO", icon: BarChart3 },
    { id: "settings", label: "Configurações", category: "SISTEMA", icon: Settings },
    { id: "activity-logs", label: "Atividades", category: "SISTEMA", icon: Activity },
  ];

  const groupedMenu = menuItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof menuItems>);

  return (
    <div className="h-screen bg-[#F5F5F7] text-[#1C1C1E] flex font-sans overflow-hidden relative selection:bg-[#E5E5EA] selection:text-[#1C1C1E]">
      <AdminNotificationPortal />

      {/* Sidebar navigation - Desktop */}
      <aside
        className={`bg-white/30 backdrop-blur-2xl border-r border-white/20 flex flex-col hidden lg:flex flex-shrink-0 relative z-[60] transition-all duration-300 ${isSidebarCollapsed ? "w-20 items-center" : "w-64"}`}
      >
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 bg-white border border-[#E5E5EA] w-6 h-6 flex items-center justify-center rounded-full z-50 text-[#8E8E93] hover:text-[#1C1C1E] shadow-sm transition-all"
        >
          <ChevronRight
            size={12}
            className={`transition-transform duration-300 ${!isSidebarCollapsed ? "rotate-180" : ""}`}
          />
        </button>

        <div className={`flex flex-col flex-1 overflow-hidden p-6 ${isSidebarCollapsed ? "px-4" : ""}`}>
          <div className="flex items-center gap-3 mb-10 px-2 shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white/50 border border-white/20 flex items-center justify-center text-[#1C1C1E] shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative backdrop-blur-sm">
               {/* Ambient glowing dot */}
               <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#34C759] rounded-full shadow-[0_0_8px_#34C759]" />
               <Sparkles size={16} className="text-[#1C1C1E] opacity-80" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="font-sans font-medium text-sm text-[#1C1C1E] tracking-tight">
                   By Julia Aleixo
                </h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1 h-1 bg-[#34C759] rounded-full shadow-[0_0_6px_#34C759]" />
                  <p className="text-[10px] text-[#8E8E93] uppercase font-medium tracking-wider">
                    Online
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-0 py-2">
            <nav className="space-y-8 pb-10">
              {Object.entries(groupedMenu).map(([category, items]) => (
                <div key={category}>
                  {!isSidebarCollapsed && (
                    <h3 className="text-[10px] font-medium uppercase text-[#8E8E93] tracking-widest pl-4 mb-3">{category}</h3>
                  )}
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative group overflow-hidden ${isActive ? "text-[#1C1C1E]" : "text-[#8E8E93] hover:text-[#1C1C1E]"}`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="activeNavBg"
                              className="absolute inset-0 bg-white border border-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.04)] rounded-xl backdrop-blur-xl"
                            />
                          )}
                          <div className="relative z-10 flex items-center justify-center w-5 h-5">
                             <item.icon
                               size={16}
                               strokeWidth={isActive ? 2.5 : 2}
                               className={`${isActive ? "text-[#1C1C1E]" : "text-[#8E8E93] group-hover:text-[#1C1C1E]"} transition-colors duration-300`}
                             />
                          </div>
                          {!isSidebarCollapsed && (
                            <span
                              className={`text-xs font-medium relative z-10 transition-colors duration-300 ${isActive ? "text-[#1C1C1E]" : "text-[#8E8E93] group-hover:text-[#1C1C1E]"}`}
                            >
                              {item.label}
                            </span>
                          )}
                          {isActive && !isSidebarCollapsed && (
                            <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#1C1C1E] z-10" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </div>

          <div className="pt-6 space-y-3">
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-[#8E8E93] hover:bg-white hover:text-[#1C1C1E] hover:shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-all text-xs font-medium"
          >
            <LogOut size={14} /> {!isSidebarCollapsed && "Encerrar Sessão"}
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
              className="fixed left-0 top-0 bottom-0 w-72 bg-[#F5F5F7] z-[110] lg:hidden border-r border-[#E5E5EA] flex flex-col shadow-2xl"
            >
              <div className="p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white border border-[#E5E5EA] text-[#1C1C1E] flex items-center justify-center shadow-sm relative">
                       <div className="absolute top-1 right-1 w-1 h-1 bg-[#34C759] rounded-full shadow-[0_0_8px_#34C759]" />
                       <Sparkles size={16} />
                    </div>
                    <div>
                      <h1 className="font-sans font-medium text-sm tracking-tight text-[#1C1C1E]">
                        By Julia Aleixo
                      </h1>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1 h-1 bg-[#34C759] rounded-full" />
                        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-medium">
                          Online
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 bg-white rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] shadow-sm transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
                  {Object.entries(groupedMenu).map(([category, items]) => (
                    <div key={`mob-cat-${category}`}>
                      <h3 className="text-[10px] font-medium uppercase text-[#8E8E93] tracking-widest pl-4 mb-2">{category}</h3>
                      <div className="space-y-1">
                        {items.map((item) => {
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={`mob-${item.id}`}
                              onClick={() => {
                                setActiveTab(item.id);
                                setTimeout(() => setIsMobileMenuOpen(false), 100);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all relative ${isActive ? "bg-white text-[#1C1C1E] shadow-sm" : "text-[#8E8E93] hover:text-[#1C1C1E] hover:bg-white/50"}`}
                            >
                              <item.icon
                                size={16}
                                strokeWidth={isActive ? 2.5 : 2}
                                className={isActive ? "text-[#1C1C1E]" : "text-[#8E8E93]"}
                              />
                              <span className="text-xs font-medium">
                                {item.label}
                              </span>
                              {isActive && (
                                <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-[#1C1C1E]" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </nav>

                <div className="mt-auto pt-4 space-y-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                      window.location.href = "/";
                    }}
                    className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-[#8E8E93] bg-white hover:text-[#1C1C1E] hover:shadow-sm transition-all text-xs font-medium"
                  >
                    <LogOut size={14} /> Encerrar Sessão
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 bg-[#F5F5F7]">
        {/* Top Header Bar */}
        <header className="h-16 bg-white/30 backdrop-blur-2xl border-b border-white/20 px-6 lg:px-10 flex items-center justify-between z-50 flex-shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-[#8E8E93] hover:text-[#1C1C1E] transition-colors"
            >
              <LayoutDashboard size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setIsSuggestionsModalOpen(true)}
                className={`p-2 rounded-xl transition-all relative bg-white border border-[#E5E5EA] shadow-sm hover:shadow-md ${suggestions.some((s) => !s.read) ? "text-[#1C1C1E]" : "text-[#8E8E93]"}`}
              >
                <Bell size={16} />
                {suggestions.filter((s) => !s.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,59,48,0.5)]" />
                )}
              </button>
            </div>

            <div className="h-6 w-px bg-[#E5E5EA] mx-1" />

            <div className="flex items-center gap-3 bg-white border border-[#E5E5EA] px-3 py-1.5 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow">
              <div className="w-7 h-7 rounded-lg bg-[#F5F5F7] border border-[#E5E5EA] overflow-hidden flex items-center justify-center">
                {user?.photoURL ? (
                  <ImageWithFallback
                    src={user.photoURL}
                    alt=""
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <User size={14} className="text-[#8E8E93]" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Tabs Container */}
        <div className="flex-1 overflow-y-auto w-full max-w-[1600px] mx-auto px-6 py-8 lg:px-10 lg:py-10 scrollbar-hide scroll-smooth h-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="pb-24 lg:pb-12"
            >
              <React.Suspense fallback={<TabLoader />}>
                <ErrorBoundary
                  key={activeTab}
                  fallback={
                    <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in fade-in">
                      <div className="w-16 h-16 bg-white border border-[#E5E5EA] rounded-2xl flex items-center justify-center text-[#FF3B30] mb-6 shadow-sm">
                        <X size={24} />
                      </div>
                      <h3 className="text-sm font-medium text-[#1C1C1E] mb-2">
                        Falha ao carregar o módulo
                      </h3>
                      <p className="text-xs text-[#8E8E93] max-w-xs mb-8">
                        Ocorreu um erro interno. Por favor, recarregue a página para continuar.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-6 py-2.5 bg-white border border-[#E5E5EA] hover:border-[#1C1C1E] text-[#1C1C1E] rounded-xl text-xs font-medium shadow-sm transition-all"
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
                      customers={customers}
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
                  {activeTab === "collections" && (
                    <CollectionsTab />
                  )}
                  {activeTab === "campaigns" && (
                    <CampaignsTab />
                  )}
                  {activeTab === "coupons" && (
                    <CouponsTab
                      companyId={selectedCompanyId}
                      orders={sales}
                      products={products}
                    />
                  )}
                  {activeTab === "media-center" && (
                    <MediaCenterTab />
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
                    <GiftListsTab companyId={selectedCompanyId} products={products} />
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
                  {activeTab === "activity-logs" && (
                    <ActivityLogTab />
                  )}
                </ErrorBoundary>
              </React.Suspense>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Suggestions Modal Overlay */}
        <AnimatePresence>
          {isSuggestionsModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-end p-0 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSuggestionsModalOpen(false)}
                className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-md bg-[#F5F5F7] h-full sm:rounded-[2rem] border border-[#E5E5EA] shadow-2xl flex flex-col overflow-hidden"
              >
                <div className="p-6 border-b border-[#E5E5EA] bg-white/80 backdrop-blur-xl space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-white text-[#1C1C1E] flex items-center justify-center border border-[#E5E5EA] shadow-sm relative">
                         <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#007AFF] rounded-full" />
                         <Bell size={16} />
                      </div>
                      <div>
                        <h2 className="text-sm font-medium text-[#1C1C1E]">
                          Notificações
                        </h2>
                        <p className="text-[10px] text-[#8E8E93] uppercase tracking-wider font-medium mt-0.5">
                          Sistema & Interações
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSuggestionsModalOpen(false)}
                      className="p-2.5 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl text-[#8E8E93] hover:text-[#1C1C1E] transition-all cursor-pointer outline-none shadow-sm"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  {/* Tab menu */}
                  <div className="flex p-1 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA] relative">
                    <button
                      type="button"
                      onClick={() => setActiveNotificationTab('suggestions')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer outline-none relative z-10 ${
                        activeNotificationTab === 'suggestions'
                          ? 'text-[#1C1C1E]'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                      }`}
                    >
                      Alertas ({suggestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveNotificationTab('feedbacks')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all cursor-pointer outline-none relative z-10 ${
                        activeNotificationTab === 'feedbacks'
                          ? 'text-[#1C1C1E]'
                          : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                      }`}
                    >
                      Mensagens ({feedbacks.length})
                    </button>
                    <motion.div
                       layoutId="notificationTabIndicator"
                       className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm border border-[#E5E5EA]"
                       animate={{ left: activeNotificationTab === 'suggestions' ? 4 : 'calc(50% + 0px)' }}
                       transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 scrollbar-hide">
                  {activeNotificationTab === 'suggestions' ? (
                    <>
                      {suggestions.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10">
                          <Box size={32} className="text-[#D1D1D6] mb-4" />
                          <p className="text-xs font-medium text-[#8E8E93]">
                            Nenhum alerta pendente.
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
                            className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${s.read ? "bg-transparent border-[#E5E5EA] opacity-60" : "bg-white border-[#E5E5EA] shadow-sm"}`}
                          >
                            <div className="flex justify-between items-center mb-3">
                              <span
                                className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${s.read ? "bg-[#E5E5EA] text-[#8E8E93]" : "bg-[#007AFF]/10 text-[#007AFF] border border-[#007AFF]/20"}`}
                              >
                                {s.companyId}
                              </span>
                              <span className="text-[10px] font-medium text-[#8E8E93]">
                                {s.createdAt?.toDate
                                  ? s.createdAt.toDate().toLocaleDateString()
                                  : "Recente"}
                              </span>
                            </div>
                            <p className="text-xs font-medium text-[#1C1C1E] leading-relaxed whitespace-pre-wrap">
                              {s.message}
                            </p>
                            {!s.read && (
                              <div className="mt-3 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#007AFF] shadow-[0_0_8px_#007AFF]" />
                                <span className="text-[10px] font-medium text-[#007AFF]">
                                  Novo Evento
                                </span>
                              </div>
                            )}
                          </motion.div>
                        ))}
                    </>
                  ) : (
                    <>
                      {feedbacks.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-center p-10">
                          <Heart size={32} className="text-[#D1D1D6] mb-4" />
                          <p className="text-xs font-medium text-[#8E8E93]">
                            Nenhuma mensagem recebida.
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
                            className="p-5 rounded-2xl border border-[#E5E5EA] bg-white shadow-sm transition-all"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-medium text-[#1C1C1E]">
                                {fb.name}
                              </span>
                              <span className="text-[10px] font-medium text-[#8E8E93]">
                                {fb.createdAt?.toDate
                                  ? fb.createdAt.toDate().toLocaleDateString()
                                  : "Recente"}
                              </span>
                            </div>
                            
                            <div className="flex gap-1 mb-3 text-[#FF9500]">
                              {Array.from({ length: fb.stars || 5 }).map((_, i) => (
                                <Star key={i} size={12} fill="currentColor" stroke="none" />
                              ))}
                            </div>

                            <p className="text-xs text-[#8E8E93] leading-relaxed">
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
