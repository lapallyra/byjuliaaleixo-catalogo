import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Tag,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Archive,
  Eye,
  Check,
  X,
  Calendar,
  Sparkles,
  Percent,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Users,
  ShoppingBag,
  Clock,
  Briefcase,
  ChevronRight,
  HelpCircle,
  CheckCircle2,
  XCircle,
  FolderOpen,
  ArrowRight
} from "lucide-react";
import { Coupon, CompanyId, Order, Product } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import {
  subscribeToCoupons,
  saveCoupon,
  deleteCoupon,
  subscribeToCollections
} from "../../services/firebaseService";
import { format, isAfter, isBefore, parseISO } from "date-fns";

interface CouponsTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
}

export const CouponsTab: React.FC<CouponsTabProps> = ({
  companyId,
  orders,
  products
}) => {
  // Database Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive" | "archived" | "expired">("all");
  const [selectedType, setSelectedType] = useState<"all" | "percentage" | "fixed">("all");
  const [selectedScope, setSelectedScope] = useState<"all" | "products" | "categories" | "collections">("all");

  // Selected coupon for sidebar details
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Form State
  const [editingCoupon, setEditingCoupon] = useState<Partial<Coupon> | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubCoupons = subscribeToCoupons((data) => {
      // Filter by companyId if not "all"
      if ((companyId as string) === "all") {
        setCoupons(data);
      } else {
        setCoupons(data.filter(c => c.companyId === companyId));
      }
      setLoading(false);
    });

    const unsubCol = subscribeToCollections((data) => {
      setCollections(data);
    });

    return () => {
      unsubCoupons();
      unsubCol();
    };
  }, [companyId]);

  // Extract unique categories from products
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [products]);

  // Helper to check if coupon is currently expired
  const isCouponExpired = (coupon: Coupon): boolean => {
    if (!coupon.endDate) return false;
    const end = parseISO(coupon.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(end, today);
  };

  // Helper to check if coupon is near expiration (within 7 days)
  const isCouponNearExpiration = (coupon: Coupon): boolean => {
    if (!coupon.endDate) return false;
    const end = parseISO(coupon.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  };

  // Helper to count uses and total discount granted for a coupon code
  const couponStats = useMemo(() => {
    const stats: Record<string, { uses: number; totalDiscount: number; uniqueClients: Set<string>; history: any[] }> = {};

    // Initialize stats for each coupon
    coupons.forEach(c => {
      stats[c.code.toUpperCase()] = {
        uses: 0,
        totalDiscount: 0,
        uniqueClients: new Set<string>(),
        history: []
      };
    });

    // Populate from orders
    orders.forEach(o => {
      if (o.couponCode) {
        const code = o.couponCode.toUpperCase();
        if (!stats[code]) {
          stats[code] = {
            uses: 0,
            totalDiscount: 0,
            uniqueClients: new Set<string>(),
            history: []
          };
        }
        
        const discountVal = o.discountAmount || 0;
        stats[code].uses += 1;
        stats[code].totalDiscount += discountVal;
        if (o.customerName) {
          stats[code].uniqueClients.add(o.customerName);
        }
        
        // Parse order date
        let oDate = new Date();
        if (o.createdAt) {
          if (typeof o.createdAt.toDate === "function") {
            oDate = o.createdAt.toDate();
          } else if (o.createdAt.seconds) {
            oDate = new Date(o.createdAt.seconds * 1000);
          } else {
            oDate = new Date(o.createdAt);
          }
        }

        stats[code].history.push({
          orderId: o.id,
          orderCode: o.code,
          clientName: o.customerName || "Anônimo",
          total: o.total,
          discount: discountVal,
          date: oDate
        });
      }
    });

    return stats;
  }, [coupons, orders]);

  // KPIs
  const kpis = useMemo(() => {
    const total = coupons.length;
    let active = 0;
    let expired = 0;
    let usedCount = 0;
    let totalDiscountGranted = 0;

    coupons.forEach(c => {
      const isExp = isCouponExpired(c);
      if (c.status === "active" && !isExp) {
        active++;
      } else if (isExp && c.status !== "archived") {
        expired++;
      }

      const cStat = couponStats[c.code.toUpperCase()];
      if (cStat) {
        usedCount += cStat.uses;
        totalDiscountGranted += cStat.totalDiscount;
      }
    });

    return {
      total,
      active,
      expired,
      usedCount,
      totalDiscountGranted
    };
  }, [coupons, couponStats]);

  // Filter and Search coupons
  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      // 1. Search term (Code, Name, Description)
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const codeMatch = c.code.toLowerCase().includes(term);
        const nameMatch = c.name.toLowerCase().includes(term);
        const descMatch = c.description?.toLowerCase().includes(term) || false;
        if (!codeMatch && !nameMatch && !descMatch) return false;
      }

      // 2. Status Filter
      const isExp = isCouponExpired(c);
      if (selectedStatus === "active") {
        if (c.status !== "active" || isExp) return false;
      } else if (selectedStatus === "inactive") {
        if (c.status !== "inactive") return false;
      } else if (selectedStatus === "archived") {
        if (c.status !== "archived") return false;
      } else if (selectedStatus === "expired") {
        if (!isExp) return false;
      }

      // 3. Discount Type Filter
      if (selectedType !== "all" && c.discountType !== selectedType) return false;

      // 4. Scope Filter
      if (selectedScope !== "all" && c.scope !== selectedScope) return false;

      return true;
    });
  }, [coupons, searchTerm, selectedStatus, selectedType, selectedScope]);

  // Automatic Indicators
  const indicators = useMemo(() => {
    let mostUsed: { coupon: Coupon; uses: number } | null = null;
    let highestDiscount: { coupon: Coupon; discount: number } | null = null;
    const nearExpiration: Coupon[] = [];
    const expiredList: Coupon[] = [];

    coupons.forEach(c => {
      const cStat = couponStats[c.code.toUpperCase()];
      const uses = cStat ? cStat.uses : 0;
      const discount = cStat ? cStat.totalDiscount : 0;

      if (uses > 0 && (!mostUsed || uses > mostUsed.uses)) {
        mostUsed = { coupon: c, uses };
      }

      if (discount > 0 && (!highestDiscount || discount > highestDiscount.discount)) {
        highestDiscount = { coupon: c, discount };
      }

      if (isCouponNearExpiration(c) && c.status === "active") {
        nearExpiration.push(c);
      }

      if (isCouponExpired(c) && c.status !== "archived") {
        expiredList.push(c);
      }
    });

    return {
      mostUsed,
      highestDiscount,
      nearExpiration: nearExpiration.slice(0, 3),
      expiredCount: expiredList.length
    };
  }, [coupons, couponStats]);

  // Actions
  const handleOpenCreateForm = () => {
    setEditingCoupon({
      companyId: (companyId as string) === "all" ? "mimada" : companyId,
      status: "active",
      discountType: "percentage",
      discountValue: 10,
      scope: "all",
      usesCount: 0,
      appliedProducts: [],
      appliedCategories: [],
      appliedCollections: [],
      excludedProducts: []
    });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (coupon: Coupon) => {
    setEditingCoupon({ ...coupon });
    setFormErrors({});
    setIsFormOpen(true);
  };

  const handleDuplicate = async (coupon: Coupon) => {
    const duplicated: Partial<Coupon> = {
      ...coupon,
      id: undefined,
      name: `${coupon.name} (Cópia)`,
      code: `${coupon.code}_COPY`.toUpperCase(),
      usesCount: 0,
      createdAt: undefined
    };
    await saveCoupon(duplicated);
  };

  const handleToggleStatus = async (coupon: Coupon) => {
    const newStatus = coupon.status === "active" ? "inactive" : "active";
    await saveCoupon({ ...coupon, status: newStatus });
    if (selectedCoupon?.id === coupon.id) {
      setSelectedCoupon(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const handleArchive = async (coupon: Coupon) => {
    await saveCoupon({ ...coupon, status: "archived" });
    if (selectedCoupon?.id === coupon.id) {
      setSelectedCoupon(prev => prev ? { ...prev, status: "archived" } : null);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja realmente excluir permanentemente este cupom? Esta ação não pode ser desfeita.")) {
      await deleteCoupon(id);
      setSelectedCoupon(null);
    }
  };

  // Form Submission Validation & Save
  const handleSaveCouponForm = async () => {
    if (!editingCoupon) return;

    const errors: Record<string, string> = {};

    if (!editingCoupon.name?.trim()) {
      errors.name = "Nome interno é obrigatório";
    }

    if (!editingCoupon.code?.trim()) {
      errors.code = "Código do cupom é obrigatório";
    } else {
      const cleanCode = editingCoupon.code.trim().toUpperCase().replace(/\s+/g, "");
      // Check duplicate code
      const duplicate = coupons.find(c => c.code.toUpperCase() === cleanCode && c.id !== editingCoupon.id);
      if (duplicate) {
        errors.code = "Este código de cupom já está em uso";
      }
    }

    if (!editingCoupon.discountValue || editingCoupon.discountValue <= 0) {
      errors.discountValue = "Insira um valor de desconto positivo";
    } else if (editingCoupon.discountType === "percentage" && editingCoupon.discountValue > 100) {
      errors.discountValue = "Desconto percentual não pode ser maior que 100%";
    }

    if (editingCoupon.startDate && editingCoupon.endDate) {
      if (isAfter(parseISO(editingCoupon.startDate), parseISO(editingCoupon.endDate))) {
        errors.endDate = "A data final deve ser igual ou posterior à data inicial";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const finalCouponData = {
      ...editingCoupon,
      code: editingCoupon.code!.trim().toUpperCase().replace(/\s+/g, "")
    } as Coupon;

    await saveCoupon(finalCouponData);
    setIsFormOpen(false);
    setEditingCoupon(null);
  };

  // Helper toggle lists for selection inside Form
  const toggleProductSelection = (prodId: string, listType: "applied" | "excluded") => {
    if (!editingCoupon) return;
    const field = listType === "applied" ? "appliedProducts" : "excludedProducts";
    const currentList = editingCoupon[field] || [];
    const newList = currentList.includes(prodId)
      ? currentList.filter(id => id !== prodId)
      : [...currentList, prodId];
    setEditingCoupon({ ...editingCoupon, [field]: newList });
  };

  const toggleCategorySelection = (category: string) => {
    if (!editingCoupon) return;
    const currentList = editingCoupon.appliedCategories || [];
    const newList = currentList.includes(category)
      ? currentList.filter(c => c !== category)
      : [...currentList, category];
    setEditingCoupon({ ...editingCoupon, appliedCategories: newList });
  };

  const toggleCollectionSelection = (colId: string) => {
    if (!editingCoupon) return;
    const currentList = editingCoupon.appliedCollections || [];
    const newList = currentList.includes(colId)
      ? currentList.filter(id => id !== colId)
      : [...currentList, colId];
    setEditingCoupon({ ...editingCoupon, appliedCollections: newList });
  };

  return (
    <div className="space-y-8 pb-24 bg-[#F8F9FA] min-h-screen px-6 py-8 md:px-8 relative overflow-hidden">
      
      {/* AREA 1: Cabeçalho (Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#E5E5EA] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Marketing & Vendas</span>
            <span className="text-[#8E8E93] text-xs font-medium">|</span>
            <span className="text-slate-500 text-xs font-medium tracking-tight">Gestão de Cupons de Desconto</span>
          </div>
          <h1 className="text-3xl font-medium tracking-tight text-[#1C1C1E] uppercase font-sans">
            Cupons de Desconto
          </h1>
          <p className="text-[#8E8E93] text-sm font-medium tracking-normal mt-1 leading-relaxed max-w-xl">
            Crie, edite, defina regras de produtos e analise a performance financeira e conversão de cada campanha promocional.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-normal transition-all duration-200 border shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
              showFilters 
                ? "bg-black text-white border-black hover:bg-black/90" 
                : "bg-white text-slate-800 border-[#E5E5EA] hover:bg-[#F2F2F7] active:translate-y-px active:shadow-sm"
            }`}
          >
            <Filter size={14} />
            <span>Filtros</span>
            {(searchTerm || selectedStatus !== "all" || selectedType !== "all" || selectedScope !== "all") && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={handleOpenCreateForm}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-xs shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:bg-indigo-700 active:translate-y-px transition-all"
          >
            <Plus size={15} />
            <span>Novo Cupom</span>
          </button>
        </div>
      </div>

      {/* FILTER EXPANSION DRAWER */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="expired">Expirados</option>
                  <option value="archived">Arquivados</option>
                </select>
              </div>

              {/* Tipo de Desconto */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Tipo de Desconto</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="percentage">Percentual (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </div>

              {/* Escopo/Restrição */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Aplicável a</label>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as any)}
                  className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="all">Todo o catálogo</option>
                  <option value="products">Produtos específicos</option>
                  <option value="categories">Categorias específicas</option>
                  <option value="collections">Coleções específicas</option>
                </select>
              </div>

              {/* Quick Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedStatus("all");
                    setSelectedType("all");
                    setSelectedScope("all");
                  }}
                  className="w-full text-center text-xs font-bold text-slate-500 bg-[#F2F2F7] hover:bg-slate-200 transition-colors py-2.5 rounded-xl cursor-pointer"
                >
                  Limpar Todos os Filtros
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AREA 2: KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        
        {/* Total de Cupons */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Total</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <Tag size={13} />
            </div>
          </div>
          <p className="text-xl font-bold text-slate-800 font-sans truncate">{kpis.total}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Total de Cupons</p>
        </div>

        {/* Cupons Ativos */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Ativos</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Check size={13} />
            </div>
          </div>
          <p className="text-xl font-bold text-emerald-600 font-sans truncate">{kpis.active}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Válidos & Ativos</p>
        </div>

        {/* Cupons Expirados */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Expirados</span>
            <div className="p-1.5 rounded-lg bg-red-50 text-red-600">
              <X size={13} />
            </div>
          </div>
          <p className="text-xl font-bold text-red-600 font-sans truncate">{kpis.expired}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Fora de Validade</p>
        </div>

        {/* Cupons Utilizados */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Utilizações</span>
            <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <ShoppingBag size={13} />
            </div>
          </div>
          <p className="text-xl font-bold text-amber-600 font-sans truncate">{kpis.usedCount}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Usos no Checkout</p>
        </div>

        {/* Valor de Descontos Concedidos */}
        <div className="bg-white border border-[#E5E5EA] rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.02)] relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Economia</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <DollarSign size={13} />
            </div>
          </div>
          <p className="text-xl font-bold text-indigo-600 font-sans truncate">{formatCurrency(kpis.totalDiscountGranted)}</p>
          <p className="text-[9px] text-[#8E8E93] mt-1 font-semibold truncate uppercase">Desconto Concedido</p>
        </div>

      </div>

      {/* CORE WORKSPACE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* AREA 3: Lista de Cupons & Busca (Colspan 3/5) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl shadow-[0_4px_16px_rgba(0,0,0,0.02)] overflow-hidden">
            
            {/* Table Header Controls */}
            <div className="p-6 border-b border-[#E5E5EA] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                  <h3 className="font-sans font-semibold text-slate-800 text-sm uppercase tracking-wide">Campanhas de Desconto ({filteredCoupons.length})</h3>
                </div>

                {/* Instant Search Bar */}
                <div className="relative w-full md:w-72">
                  <input
                    type="text"
                    placeholder="Código ou nome do cupom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-[#F2F2F7] border border-transparent rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
                </div>
              </div>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#E5E5EA] text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">
                    <th className="py-4 px-6">Código / Nome</th>
                    <th className="py-4 px-4 text-center">Tipo</th>
                    <th className="py-4 px-4 text-right">Valor</th>
                    <th className="py-4 px-4 text-center">Utilizações</th>
                    <th className="py-4 px-4 text-center">Validade</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                        Carregando cupons...
                      </td>
                    </tr>
                  ) : filteredCoupons.length > 0 ? (
                    filteredCoupons.map((c) => {
                      const isExp = isCouponExpired(c);
                      const stats = couponStats[c.code.toUpperCase()] || { uses: 0, totalDiscount: 0 };
                      
                      const statusColor = c.status === "archived"
                        ? "text-slate-500 bg-slate-100 border-slate-200"
                        : isExp
                          ? "text-red-700 bg-red-50 border-red-100"
                          : c.status === "active"
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-100"
                            : "text-amber-700 bg-amber-50 border border-amber-100";

                      return (
                        <tr
                          key={c.id}
                          onClick={() => setSelectedCoupon(c)}
                          className={`hover:bg-[#F2F2F7]/50 cursor-pointer transition-all duration-150 ${selectedCoupon?.id === c.id ? "bg-indigo-50/20" : ""}`}
                        >
                          <td className="py-4 px-6 text-xs">
                            <p className="font-bold text-indigo-600 font-mono tracking-wide">
                              {c.code}
                            </p>
                            <p className="text-[#8E8E93] font-medium text-[10px] mt-0.5">
                              {c.name}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-center text-xs font-semibold text-slate-700">
                            {c.discountType === "percentage" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                <Percent size={10} />
                                Percentual
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                <DollarSign size={10} />
                                Valor Fixo
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-xs font-bold text-[#1C1C1E] text-right font-sans">
                            {c.discountType === "percentage" ? `${c.discountValue}%` : formatCurrency(c.discountValue)}
                          </td>
                          <td className="py-4 px-4 text-center text-xs font-semibold text-slate-600 font-sans">
                            {stats.uses} {c.maxUses ? `/ ${c.maxUses}` : ""}
                          </td>
                          <td className="py-4 px-4 text-center text-xs text-slate-500 font-medium font-sans">
                            {c.endDate ? format(parseISO(c.endDate), "dd/MM/yyyy") : "Sem expiração"}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusColor}`}>
                              {c.status === "archived" ? "Arquivado" : isExp ? "Expirado" : c.status === "active" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-semibold uppercase tracking-wider text-[#8E8E93]">
                        Nenhum cupom promocional encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* INDICATORS & INSIGHTS (Colspan 2/5) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] space-y-6">
            
            <div className="flex items-center justify-between border-b border-[#E5E5EA] pb-4">
              <h3 className="font-sans font-semibold text-slate-800 text-sm uppercase tracking-wide">Indicadores Operacionais</h3>
              <Sparkles size={16} className="text-indigo-600 animate-pulse" />
            </div>

            {/* Indicator 1: Cupom mais utilizado */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E5E5EA]/80">
              <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Cupom Campeão de Usos</span>
              {indicators.mostUsed ? (
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg text-xs">
                      {indicators.mostUsed.coupon.code}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-700 mt-1.5 truncate max-w-[140px]">
                      {indicators.mostUsed.coupon.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600">{indicators.mostUsed.uses} usos</p>
                    <p className="text-[9px] font-semibold text-slate-400">Conversão real no carrinho</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1 italic">Nenhum cupom utilizado até o momento.</p>
              )}
            </div>

            {/* Indicator 2: Cupom de maior desconto concedido */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-[#E5E5EA]/80">
              <span className="text-[9px] font-bold text-[#8E8E93] uppercase tracking-wider">Maior Desconto Concedido</span>
              {indicators.highestDiscount ? (
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-purple-600 bg-purple-50 border border-purple-100 px-2.5 py-1 rounded-lg text-xs">
                      {indicators.highestDiscount.coupon.code}
                    </span>
                    <p className="text-[11px] font-semibold text-slate-700 mt-1.5 truncate max-w-[140px]">
                      {indicators.highestDiscount.coupon.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-purple-600">{formatCurrency(indicators.highestDiscount.discount)}</p>
                    <p className="text-[9px] font-semibold text-slate-400">Desconto total acumulado</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1 italic">Nenhum cupom gerou desconto real até o momento.</p>
              )}
            </div>

            {/* Indicator 3: Cupons próximos do vencimento */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                <Clock size={12} />
                Próximos do Vencimento (≤ 7 dias)
              </h4>
              <div className="space-y-2">
                {indicators.nearExpiration.length > 0 ? (
                  indicators.nearExpiration.map((c, idx) => {
                    const diffTime = parseISO(c.endDate!).getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return (
                      <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-amber-50/55 rounded-xl border border-amber-100/50">
                        <div>
                          <span className="font-mono font-bold text-slate-800">{c.code}</span>
                          <span className="text-[10px] text-slate-500 block">{c.name}</span>
                        </div>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                          {diffDays === 0 ? "Vence hoje" : `Vence em ${diffDays}d`}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-slate-500 italic">Nenhum cupom ativo vencendo nos próximos dias.</p>
                )}
              </div>
            </div>

            {/* Indicator 4: Cupons expirados */}
            <div className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle size={13} />
                Cupons Expirados no Ateliê
              </span>
              <span className="text-xs font-black text-red-700">{indicators.expiredCount} cupons</span>
            </div>

          </div>
        </div>

      </div>

      {/* AREA 4: PAINEL LATERAL DE DETALHES (Sidebar Drawer) */}
      <AnimatePresence>
        {selectedCoupon && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCoupon(null)}
              className="fixed inset-0 bg-black z-40 cursor-pointer"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-start bg-[#F8F9FA]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded font-mono">#{selectedCoupon.code}</span>
                    <span className="text-[10px] text-[#8E8E93] font-semibold">
                      Criado em: {selectedCoupon.createdAt ? format(selectedCoupon.createdAt.toDate ? selectedCoupon.createdAt.toDate() : new Date(selectedCoupon.createdAt), "dd/MM/yyyy") : "Recente"}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">{selectedCoupon.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCoupon.description || "Sem descrição informada."}</p>
                </div>
                <button
                  onClick={() => setSelectedCoupon(null)}
                  className="p-2 hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content Scroll Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                
                {/* Status Indicator */}
                <div className="flex justify-between items-center bg-[#F2F2F7]/50 p-4 rounded-2xl border border-[#E5E5EA]/60">
                  <span className="text-xs font-semibold text-slate-600">Status da Campanha:</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    isCouponExpired(selectedCoupon)
                      ? "text-red-700 bg-red-50 border-red-100"
                      : selectedCoupon.status === "active"
                        ? "text-emerald-700 bg-emerald-50 border-emerald-100"
                        : "text-amber-700 bg-amber-50 border-amber-100"
                  }`}>
                    {isCouponExpired(selectedCoupon) ? "Expirado" : selectedCoupon.status === "active" ? "Válido / Ativo" : "Pausado / Inativo"}
                  </span>
                </div>

                {/* 1. Resumo Financeiro */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Métricas de Performance</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E5EA]/50 text-center">
                      <span className="text-[9px] text-[#8E8E93] uppercase font-bold block">Usos Realizados</span>
                      <span className="text-lg font-black text-indigo-600 mt-1 block">
                        {couponStats[selectedCoupon.code.toUpperCase()]?.uses || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E5EA]/50 text-center">
                      <span className="text-[9px] text-[#8E8E93] uppercase font-bold block">Clientes Únicos</span>
                      <span className="text-lg font-black text-slate-800 mt-1 block">
                        {couponStats[selectedCoupon.code.toUpperCase()]?.uniqueClients.size || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#E5E5EA]/50 text-center">
                      <span className="text-[9px] text-[#8E8E93] uppercase font-bold block">Total Descontado</span>
                      <span className="text-sm font-black text-emerald-600 mt-2 block">
                        {formatCurrency(couponStats[selectedCoupon.code.toUpperCase()]?.totalDiscount || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Regras de Desconto */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Regras do Cupom</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Valor do Desconto:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.discountType === "percentage" ? `${selectedCoupon.discountValue}%` : formatCurrency(selectedCoupon.discountValue)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Compra Mínima:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.minOrderValue ? formatCurrency(selectedCoupon.minOrderValue) : "Sem valor mínimo"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Data Inicial:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.startDate ? format(parseISO(selectedCoupon.startDate), "dd/MM/yyyy") : "Não definida"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Data Final:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.endDate ? format(parseISO(selectedCoupon.endDate), "dd/MM/yyyy") : "Sem expiração"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Limite Total de Usos:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.maxUses ? `${selectedCoupon.maxUses} vezes` : "Ilimitado"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1.5">
                      <span className="text-slate-500">Limite por Cliente:</span>
                      <span className="font-bold text-[#1C1C1E]">
                        {selectedCoupon.limitPerClient ? `${selectedCoupon.limitPerClient} por cliente` : "Ilimitado"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Escopo de Restrições */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Restrições e Elegibilidade</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#E5E5EA]/40">
                      <span className="text-slate-500">Aplicável a:</span>
                      <span className="font-bold text-slate-800 capitalize">
                        {selectedCoupon.scope === "all" ? "Todos os produtos" : selectedCoupon.scope === "products" ? "Produtos específicos" : selectedCoupon.scope === "categories" ? "Categorias específicas" : "Coleções específicas"}
                      </span>
                    </div>
                    {selectedCoupon.scope === "products" && selectedCoupon.appliedProducts && (
                      <div className="py-1">
                        <span className="text-slate-500 block mb-1">Produtos participantes:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCoupon.appliedProducts.map(id => {
                            const p = products.find(prod => prod.id === id);
                            return (
                              <span key={id} className="text-[10px] font-medium bg-[#F2F2F7] text-slate-800 px-2 py-0.5 rounded-full border border-[#E5E5EA]">
                                {p ? p.product_name : `ID: ${id}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedCoupon.scope === "categories" && selectedCoupon.appliedCategories && (
                      <div className="py-1">
                        <span className="text-slate-500 block mb-1">Categorias participantes:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCoupon.appliedCategories.map(cat => (
                            <span key={cat} className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedCoupon.scope === "collections" && selectedCoupon.appliedCollections && (
                      <div className="py-1">
                        <span className="text-slate-500 block mb-1">Coleções participantes:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCoupon.appliedCollections.map(id => {
                            const col = collections.find(c => c.id === id);
                            return (
                              <span key={id} className="text-[10px] font-medium bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-100">
                                {col ? col.name : `ID: ${id}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {selectedCoupon.excludedProducts && selectedCoupon.excludedProducts.length > 0 && (
                      <div className="py-1 border-t border-[#E5E5EA]/40 mt-1">
                        <span className="text-rose-600 font-bold block mb-1 text-[10px] uppercase">Produtos excluídos:</span>
                        <div className="flex flex-wrap gap-1">
                          {selectedCoupon.excludedProducts.map(id => {
                            const p = products.find(prod => prod.id === id);
                            return (
                              <span key={id} className="text-[10px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-100">
                                {p ? p.product_name : `ID: ${id}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Histórico de Utilização */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93] border-b border-[#E5E5EA] pb-1.5">Histórico de Utilização</h4>
                  {couponStats[selectedCoupon.code.toUpperCase()]?.history.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {couponStats[selectedCoupon.code.toUpperCase()].history.map((h, index) => (
                        <div key={index} className="flex justify-between items-center text-xs p-2.5 bg-slate-50 rounded-xl border border-[#E5E5EA]/70">
                          <div>
                            <span className="font-bold text-slate-800">Pedido #{h.orderCode}</span>
                            <span className="text-[10px] text-[#8E8E93] block">Cliente: {h.clientName}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-rose-600">-{formatCurrency(h.discount)}</span>
                            <span className="text-[9px] text-[#8E8E93] block">{format(h.date, "dd/MM/yyyy")}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">Nenhum uso registrado para este cupom.</p>
                  )}
                </div>

              </div>

              {/* Sidebar Footer Operations */}
              <div className="p-6 border-t border-[#E5E5EA] bg-[#F8F9FA] grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleToggleStatus(selectedCoupon)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E5E5EA] text-slate-800 font-semibold text-xs rounded-xl shadow-sm hover:bg-[#F2F2F7] transition-all cursor-pointer"
                >
                  {selectedCoupon.status === "active" ? "Pausar Cupom" : "Ativar Cupom"}
                </button>
                <button
                  onClick={() => handleOpenEditForm(selectedCoupon)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  <Edit2 size={13} />
                  <span>Editar Configurações</span>
                </button>
                <button
                  onClick={() => handleDuplicate(selectedCoupon)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#E5E5EA] text-slate-800 font-semibold text-xs rounded-xl shadow-sm hover:bg-[#F2F2F7] transition-all cursor-pointer"
                >
                  <Copy size={13} />
                  <span>Duplicar Cupom</span>
                </button>
                {selectedCoupon.status !== "archived" ? (
                  <button
                    onClick={() => handleArchive(selectedCoupon)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-600 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    <Archive size={13} />
                    <span>Arquivar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelete(selectedCoupon.id)}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 text-rose-700 font-semibold text-xs rounded-xl hover:bg-rose-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Excluir Permanentemente</span>
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CREATION & EDIT DRAWER FORM */}
      <AnimatePresence>
        {isFormOpen && editingCoupon && (
          <>
            {/* Form Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFormOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Form Drawer (Slide Over) */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E5E5EA] flex justify-between items-start bg-[#F8F9FA]">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <Tag className="text-indigo-600" size={18} />
                    {editingCoupon.id ? "Editar Cupom" : "Cadastrar Novo Cupom"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Configure as regras de negócio, valores e restrições da campanha promocional.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-2 hover:bg-[#E5E5EA] text-[#8E8E93] hover:text-[#1C1C1E] rounded-full transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Scroll Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                
                {/* 1. Nome Interno & Código */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Nome Interno da Campanha *</label>
                    <input
                      type="text"
                      placeholder="Ex: Black Friday 15% Off"
                      value={editingCoupon.name || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, name: e.target.value })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    {formErrors.name && <p className="text-rose-600 text-[10px] font-bold mt-1">{formErrors.name}</p>}
                  </div>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Código do Cupom *</label>
                    <input
                      type="text"
                      placeholder="Ex: BLACKFRIDAY15"
                      value={editingCoupon.code || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner font-mono uppercase"
                    />
                    {formErrors.code && <p className="text-rose-600 text-[10px] font-bold mt-1">{formErrors.code}</p>}
                  </div>
                </div>

                {/* Descrição */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Descrição (Cliente Visualiza no Checkout)</label>
                  <textarea
                    placeholder="Ex: Ganhe 15% de desconto especial em toda nossa papelaria fina."
                    rows={2}
                    value={editingCoupon.description || ""}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                    className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                  />
                </div>

                {/* 2. Tipo de Desconto & Valor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Tipo de Desconto</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingCoupon({ ...editingCoupon, discountType: "percentage" })}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          editingCoupon.discountType === "percentage"
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-[#F2F2F7] text-slate-700 border-transparent hover:bg-slate-200"
                        }`}
                      >
                        Percentual (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCoupon({ ...editingCoupon, discountType: "fixed" })}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                          editingCoupon.discountType === "fixed"
                            ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                            : "bg-[#F2F2F7] text-slate-700 border-transparent hover:bg-slate-200"
                        }`}
                      >
                        Valor Fixo (R$)
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Valor do Desconto *</label>
                    <input
                      type="number"
                      placeholder={editingCoupon.discountType === "percentage" ? "Ex: 15" : "Ex: 50.00"}
                      value={editingCoupon.discountValue || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    {formErrors.discountValue && <p className="text-rose-600 text-[10px] font-bold mt-1">{formErrors.discountValue}</p>}
                  </div>
                </div>

                {/* 3. Valor Mínimo & Limites */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Compra Mínima (R$)</label>
                    <input
                      type="number"
                      placeholder="Sem valor mínimo"
                      value={editingCoupon.minOrderValue || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, minOrderValue: parseFloat(e.target.value) || undefined })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Máximo de Usos Geral</label>
                    <input
                      type="number"
                      placeholder="Ilimitado"
                      value={editingCoupon.maxUses || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: parseInt(e.target.value) || undefined })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Limite por Cliente</label>
                    <input
                      type="number"
                      placeholder="Ilimitado"
                      value={editingCoupon.limitPerClient || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, limitPerClient: parseInt(e.target.value) || undefined })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* 4. Validade (Datas) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Data de Início</label>
                    <input
                      type="date"
                      value={editingCoupon.startDate || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, startDate: e.target.value })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Data de Término</label>
                    <input
                      type="date"
                      value={editingCoupon.endDate || ""}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, endDate: e.target.value })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
                    />
                    {formErrors.endDate && <p className="text-rose-600 text-[10px] font-bold mt-1">{formErrors.endDate}</p>}
                  </div>
                </div>

                {/* Status Inicial */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Status Inicial do Cupom</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, status: "active" })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                        editingCoupon.status === "active"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-[#F2F2F7] text-slate-700 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      Ativo (Elegível para checkout)
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCoupon({ ...editingCoupon, status: "inactive" })}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                        editingCoupon.status === "inactive"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-[#F2F2F7] text-slate-700 border-transparent hover:bg-slate-200"
                      }`}
                    >
                      Inativo (Pausado)
                    </button>
                  </div>
                </div>

                {/* 5. RESTRIÇÕES / ESCOPO DO CUPOM */}
                <div className="space-y-4 border-t border-[#E5E5EA] pt-6">
                  <h4 className="text-xs font-bold uppercase tracking-wide text-slate-800">Elegibilidade de Catálogo (Restrições)</h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Este cupom se aplica a:</label>
                    <select
                      value={editingCoupon.scope || "all"}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, scope: e.target.value as any })}
                      className="bg-[#F2F2F7] border border-transparent rounded-xl px-3 py-2.5 text-xs font-semibold text-[#1C1C1E] outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="all">Todo o Catálogo (Sem Restrição de Categoria/Coleção)</option>
                      <option value="products">Produtos específicos</option>
                      <option value="categories">Categorias específicas</option>
                      <option value="collections">Coleções específicas</option>
                    </select>
                  </div>

                  {/* Specific Products List selection */}
                  {editingCoupon.scope === "products" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Selecione os produtos participantes:</label>
                      <div className="border border-[#E5E5EA] rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                        {products.map(p => {
                          const isSelected = editingCoupon.appliedProducts?.includes(p.id);
                          return (
                            <button
                              type="button"
                              key={p.id}
                              onClick={() => toggleProductSelection(p.id, "applied")}
                              className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                isSelected ? "bg-indigo-50 border border-indigo-200 text-indigo-700" : "bg-white border border-[#E5E5EA] text-slate-700 hover:bg-[#F2F2F7]"
                              }`}
                            >
                              <span>{p.product_name}</span>
                              {isSelected && <Check size={14} className="text-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specific Categories List selection */}
                  {editingCoupon.scope === "categories" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Selecione as categorias participantes:</label>
                      <div className="border border-[#E5E5EA] rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-2 gap-2">
                        {uniqueCategories.map(cat => {
                          const isSelected = editingCoupon.appliedCategories?.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => toggleCategorySelection(cat)}
                              className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                isSelected ? "bg-indigo-50 border border-indigo-200 text-indigo-700" : "bg-white border border-[#E5E5EA] text-slate-700 hover:bg-[#F2F2F7]"
                              }`}
                            >
                              <span>{cat}</span>
                              {isSelected && <Check size={14} className="text-indigo-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Specific Collections List selection */}
                  {editingCoupon.scope === "collections" && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E93]">Selecione as coleções participantes:</label>
                      <div className="border border-[#E5E5EA] rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                        {collections.map(col => {
                          const isSelected = editingCoupon.appliedCollections?.includes(col.id);
                          return (
                            <button
                              type="button"
                              key={col.id}
                              onClick={() => toggleCollectionSelection(col.id)}
                              className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                                isSelected ? "bg-purple-50 border border-purple-200 text-purple-700" : "bg-white border border-[#E5E5EA] text-slate-700 hover:bg-[#F2F2F7]"
                              }`}
                            >
                              <span>{col.name}</span>
                              {isSelected && <Check size={14} className="text-purple-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Excluding Specific Products */}
                  <div className="space-y-2 border-t border-[#E5E5EA]/50 pt-4">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                      <AlertCircle size={12} />
                      Excluir produtos específicos do cupom (Opcional):
                    </label>
                    <div className="border border-[#E5E5EA] rounded-xl p-3 bg-slate-50 max-h-48 overflow-y-auto grid grid-cols-1 gap-2">
                      {products.map(p => {
                        const isExcluded = editingCoupon.excludedProducts?.includes(p.id);
                        return (
                          <button
                            type="button"
                            key={p.id}
                            onClick={() => toggleProductSelection(p.id, "excluded")}
                            className={`flex items-center justify-between p-2 rounded-lg text-left text-xs font-semibold transition-all ${
                              isExcluded ? "bg-rose-50 border border-rose-200 text-rose-700" : "bg-white border border-[#E5E5EA] text-slate-700 hover:bg-[#F2F2F7]"
                            }`}
                          >
                            <span>{p.product_name}</span>
                            {isExcluded && <X size={14} className="text-rose-600" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>

              {/* Form Footer Buttons */}
              <div className="p-6 border-t border-[#E5E5EA] bg-[#F8F9FA] flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-5 py-2.5 bg-white border border-[#E5E5EA] text-slate-700 font-semibold text-xs rounded-xl hover:bg-[#F2F2F7] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCouponForm}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs rounded-xl shadow-[0_4px_12px_rgba(79,70,229,0.15)] hover:bg-indigo-700 transition-all cursor-pointer"
                >
                  Salvar Cupom
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
