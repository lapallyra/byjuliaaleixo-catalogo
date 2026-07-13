import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Plus,
  Filter,
  Package,
  AlertTriangle,
  Clock,
  MoreVertical,
  X,
  Edit,
  History,
  TrendingDown,
  TrendingUp,
  Save,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  Archive,
  Eye,
  Trash2,
  Calendar,
  Layers,
  ShoppingBag,
  Info,
  DollarSign,
  MapPin,
  CheckCircle,
  AlertCircle,
  Power,
  RotateCcw
} from "lucide-react";
import { Componente, Product, ComponenteMovement, CompanyId } from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
import { InsumoFormModal } from "./InsumoFormModal";
import { db } from "../../lib/firebase";
import { 

  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  setDoc,
  deleteDoc
} from "firebase/firestore";

interface ComponentsTabProps {
  companyId: CompanyId;
  products: Product[];
  componentes: Componente[];
  onSaveComponente: (componente: Partial<Componente>) => Promise<void>;
  onDeleteComponente: (id: string) => Promise<void>;
}

export const ComponentsTab: React.FC<ComponentsTabProps> = React.memo(({
  companyId,
  products,
  componentes,
  onSaveComponente,
  onDeleteComponente,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingComponente, setEditingComponente] = useState<Partial<Componente> | null>(null);
  
  // Quick Filters
  // "all" | "insumo" | "componente" | "critico" | "baixo_minimo" | "sem_movimentacao"
  const [filterType, setFilterType] = useState<"all" | "insumo" | "componente" | "critico" | "baixo_minimo" | "sem_movimentacao">("all");

  // Selected item for Summary view (Resumo do Item)
  const [selectedItem, setSelectedItem] = useState<Componente | null>(null);
  const [itemMovements, setItemMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  // Quick Action Modal state (Entrada / Saída rápida)
  const [quickAction, setQuickAction] = useState<{
    type: "entrada" | "saida" | null;
    item: Componente | null;
  }>({ type: null, item: null });

  // Quick action form state
  const [quickQty, setQuickQty] = useState<string>("0");
  const [quickReason, setQuickReason] = useState<string>("");
  const [quickOrigin, setQuickOrigin] = useState<string>("");
  const [quickCost, setQuickCost] = useState<string>("0");

  // Load all products to detect which ones use this inventory item
  // Fetch movements for the selected item dynamically
  useEffect(() => {
    if (!selectedItem) {
      setItemMovements([]);
      return;
    }
    setLoadingMovements(true);
    const q = query(
      collection(db, "componente_movements"),
      where("componenteId", "==", selectedItem.id)
    );
    const unsub = onSnapshot(q, (snap) => {
      const moves = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      // Sort desc by date
      moves.sort((a, b) => {
        const timeA = a.date?.seconds || 0;
        const timeB = b.date?.seconds || 0;
        return timeB - timeA;
      });
      setItemMovements(moves);
      setLoadingMovements(false);
    }, (err) => {
      console.error("Error loading movements: ", err);
      setLoadingMovements(false);
    });

    return unsub;
  }, [selectedItem]);

  // KPIs
  const totalInsumosCount = componentes.length;
  const activeInsumos = componentes.filter(c => c.isActive !== false);
  const lowStockCount = activeInsumos.filter((c) => c.quantity <= c.minQuantity && c.quantity > 0).length;
  const criticalStockCount = activeInsumos.filter((c) => c.quantity === 0).length;
  const totalStockValue = activeInsumos.reduce((acc, c) => acc + (c.quantity * (c.unitCost || 0)), 0);

  // Filter components
  const filtered = useMemo(() => {
    return componentes.filter((c) => {
      // Search
      const matchesSearch =
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.category || "").toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filter quick types
      const isItemActive = c.isActive !== false;
      const isComponent = c.classification === "componente";
      const isInsumo = c.classification === "insumo" || !c.classification; // default to insumo

      switch (filterType) {
        case "insumo":
          return isInsumo && isItemActive;
        case "componente":
          return isComponent && isItemActive;
        case "critico":
          return c.quantity === 0 && isItemActive;
        case "baixo_minimo":
          return c.quantity <= c.minQuantity && c.quantity > 0 && isItemActive;
        case "sem_movimentacao":
          // Mock or actual condition, we can filter items without movements or let's say item.updatedAt is very old
          return isItemActive; // handled gracefully as list filter
        default:
          return true; // show all (including inactive)
      }
    });
  }, [componentes, searchTerm, filterType]);

  // Handle Quick Entry or Exit
  const handleQuickActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = quickAction.item;
    const type = quickAction.type;
    const qty = parseFloat(quickQty) || 0;

    if (!item || !type || qty <= 0) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Por favor, preencha os dados corretamente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      return;
    }

    try {
      const currentQty = item.quantity || 0;
      let newQty = currentQty;

      if (type === "entrada") {
        newQty = currentQty + qty;
      } else {
        newQty = currentQty - qty;
        if (newQty < 0) {
          orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro: O estoque não pode ficar negativo!",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
          return;
        }
      }

      // 1. Log the movement
      const movementPayload = {
        componenteId: item.id,
        componenteName: item.name,
        date: serverTimestamp(),
        type,
        quantity: qty,
        reason: quickReason || (type === "entrada" ? "Entrada Manual" : "Saída Manual"),
        origin: quickOrigin || "Ateliê Principal",
        cost: parseFloat(quickCost) || item.unitCost || 0,
        user: "Ateliê Admin",
      };

      await addDoc(collection(db, "componente_movements"), movementPayload);

      // 2. Update stock item
      const updatePayload: Partial<Componente> = {
        quantity: newQty,
        updatedAt: serverTimestamp(),
      };

      if (type === "entrada" && parseFloat(quickCost) > 0) {
        updatePayload.unitCost = parseFloat(quickCost);
      }

      await updateDoc(doc(db, "componentes", item.id), updatePayload);
      await updateDoc(doc(db, "insumos", item.id), updatePayload);

      // Reset
      setQuickAction({ type: null, item: null });
      setQuickQty("0");
      setQuickReason("");
      setQuickOrigin("");
      setQuickCost("0");
      
      // If selectedItem is active, update details view immediately
      if (selectedItem?.id === item.id) {
        setSelectedItem({ ...selectedItem, ...updatePayload });
      }

    } catch (err) {
      console.error("Error executing quick stock action: ", err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar a movimentação.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  // Toggle active status (Soft delete / inactivate)
  const handleToggleActive = async (item: Componente) => {
    try {
      const nextActive = item.isActive === false ? true : false;
      const confirmMsg = nextActive 
        ? `Deseja reativar o item "${item.name}"?` 
        : `Deseja inativar o item "${item.name}"? Ele continuará no histórico de forma segura.`;

      if (confirm(confirmMsg)) {
        const payload = { isActive: nextActive, updatedAt: serverTimestamp() };
        await updateDoc(doc(db, "componentes", item.id), payload);
        await updateDoc(doc(db, "insumos", item.id), payload);
        
        if (selectedItem?.id === item.id) {
          setSelectedItem({ ...selectedItem, ...payload });
        }
      }
    } catch (err) {
      console.error("Error toggling active status: ", err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao alterar status do item.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    }
  };

  // Get status color & label
  const getStatus = (item: Componente) => {
    if (item.isActive === false) {
      return { label: "Inativo", color: "bg-slate-100 text-slate-500 border-slate-200", led: "bg-slate-400" };
    }
    if (item.quantity === 0) {
      return { label: "Crítico", color: "bg-rose-50 text-rose-700 border-rose-200/60", led: "bg-rose-500 animate-pulse" };
    }
    if (item.quantity <= item.minQuantity) {
      return { label: "Atenção", color: "bg-amber-50 text-amber-700 border-amber-200/60", led: "bg-amber-500 animate-pulse" };
    }
    return { label: "Normal", color: "bg-emerald-50 text-emerald-700 border-emerald-200/60", led: "bg-emerald-500" };
  };

  // Filtered list of products using the selected item
  const productsUsingSelectedItem = useMemo(() => {
    if (!selectedItem) return [];
    return products.filter(
      (p) =>
        p.insumos?.some((i) => i.insumoId === selectedItem.id) ||
        p.kitItems?.some((k) => k.id === selectedItem.id)
    );
  }, [selectedItem, products]);

  // Average consumption calculated from recent exit/consumption movements
  const averageConsumption = useMemo(() => {
    if (itemMovements.length === 0) return 0;
    const exitMovements = itemMovements.filter(m => m.type === "saida");
    if (exitMovements.length === 0) return 0;
    const totalQty = exitMovements.reduce((sum, m) => sum + (m.quantity || 0), 0);
    return (totalQty / exitMovements.length).toFixed(1);
  }, [itemMovements]);

  // Recent purchases calculated from entries with reason related to "Compra" or just entries
  const lastPurchases = useMemo(() => {
    return itemMovements.filter(m => m.type === "entrada");
  }, [itemMovements]);

  return (
    <div className="space-y-6">
      
      {/* KPIs Grid - Clean 3D Premium design */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { 
            label: "Total de Insumos", 
            value: totalInsumosCount, 
            subtitle: "Itens catalogados",
            color: "text-slate-900",
            bg: "from-blue-50/50 to-indigo-50/20 border-blue-100",
            icon: <Layers size={20} className="text-blue-600" />
          },
          { 
            label: "Estoque Baixo", 
            value: lowStockCount, 
            subtitle: "Abaixo do ponto de reposição",
            color: "text-amber-700",
            bg: "from-amber-50/60 to-orange-50/20 border-amber-100",
            icon: <AlertTriangle size={20} className="text-amber-500 animate-pulse" />
          },
          { 
            label: "Sem Estoque (Crítico)", 
            value: criticalStockCount, 
            subtitle: "Exige reposição imediata",
            color: "text-rose-700",
            bg: "from-rose-50/60 to-red-50/20 border-rose-100",
            icon: <AlertCircle size={20} className="text-rose-500" />
          },
          { 
            label: "Investimento em Estoque", 
            value: formatCurrency(totalStockValue), 
            subtitle: "Valor patrimonial ativo",
            color: "text-emerald-700",
            bg: "from-emerald-50/60 to-teal-50/20 border-emerald-100",
            icon: <DollarSign size={20} className="text-emerald-600" />
          },
        ].map((ind, idx) => (
          <div 
            key={idx} 
            className={`bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 transition-all hover:translate-y-[-2px] hover:shadow-[0_8px_30px_rgba(142,91,245,0.06)] bg-gradient-to-br ${ind.bg}`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">{ind.label}</span>
              <div className="p-2 rounded-xl bg-white shadow-xs border border-slate-100">
                {ind.icon}
              </div>
            </div>
            <span className={`text-2xl font-black ${ind.color} tracking-tight block`}>{ind.value}</span>
            <span className="text-[10px] text-slate-400 font-bold block mt-1">{ind.subtitle}</span>
          </div>
        ))}
      </div>

      {/* SEARCH, ADD & QUICK FILTERS */}
      <div className="bg-white/75 backdrop-blur-md p-6 rounded-[22px] border border-white/80 shadow-sm flex flex-col gap-5">
        
        {/* Top bar with search input and Novo Item button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por nome, código interno ou categoria..."
              className="w-full pl-12 pr-4 py-3.5 bg-pink-50/10 border border-pink-100/20 rounded-2xl text-xs font-semibold focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-300/10 outline-none transition-all text-[#1C1C1E]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => { setEditingComponente({}); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-6 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all active:scale-[0.98] shadow-md shadow-pink-500/10 shrink-0"
          >
            <Plus size={16} /> Novo Item de Estoque
          </button>
        </div>

        {/* Horizontal quick filter badges */}
        <div className="border-t border-pink-50 pt-4">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todos os Itens", count: totalInsumosCount },
              { id: "insumo", label: "Insumos (Consumíveis)", count: activeInsumos.filter(c => c.classification === "insumo" || !c.classification).length },
              { id: "componente", label: "Componentes (Físicos)", count: activeInsumos.filter(c => c.classification === "componente").length },
              { id: "baixo_minimo", label: "Abaixo do Mínimo", count: lowStockCount, badge: "bg-amber-100 text-amber-700 font-bold" },
              { id: "critico", label: "Estoque Crítico (Zerado)", count: criticalStockCount, badge: "bg-rose-100 text-rose-700 font-bold" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-2 border ${
                  filterType === f.id
                    ? "bg-pink-500 text-white border-transparent shadow-[0_4px_12px_rgba(236,72,153,0.15)] scale-[1.02]"
                    : "bg-pink-50/10 text-gray-500 border-pink-100/20 hover:bg-pink-50/20"
                }`}
              >
                {f.label}
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                  filterType === f.id ? "bg-white/25 text-white" : f.badge || "bg-pink-50 text-pink-700"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ACTIVE CRITICAL ALERTS BANNER (LEDs only when adding value) */}
      {(lowStockCount > 0 || criticalStockCount > 0) && (
        <div className="bg-amber-50 border border-amber-200/70 p-5 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl shrink-0">
              <AlertTriangle size={22} className="animate-bounce" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-900">Atenção ao Ponto de Reposição</h4>
              <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                Há <strong className="font-extrabold text-amber-900">{criticalStockCount} itens zerados</strong> e <strong className="font-extrabold text-amber-900">{lowStockCount} itens abaixo do estoque mínimo</strong>. Complete compras ou registre entradas para manter o fluxo de produção estável.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilterType("baixo_minimo")}
            className="px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm transition-all text-center shrink-0 self-start md:self-center"
          >
            Ver Itens Críticos
          </button>
        </div>
      )}

      {/* RESPONSIVE TABLE LISTING */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Item / SKU</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Tipo</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Categoria</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Unidade</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qtd Atual</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Qtd Mínima</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                <th className="p-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-10 text-center text-slate-400">
                    <Package size={40} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-wider">Nenhum item encontrado</p>
                    <p className="text-[11px] text-slate-400 mt-1">Experimente mudar o filtro ou cadastrar novos insumos.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const statusInfo = getStatus(item);
                  const isItemActive = item.isActive !== false;
                  
                  return (
                    <tr 
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`hover:bg-[#F5F5F7]/40 cursor-pointer transition-all ${!isItemActive ? "opacity-60 bg-slate-50/40" : ""}`}
                    >
                      {/* Name / SKU */}
                      <td className="p-5">
                        <div>
                          <span className="font-extrabold text-xs text-slate-800 hover:text-pink-500 transition-colors">{item.name}</span>
                          {item.code && (
                            <span className="block font-mono text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{item.code}</span>
                          )}
                        </div>
                      </td>

                      {/* Tipo badge */}
                      <td className="p-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                          item.classification === "componente" 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100" 
                            : "bg-teal-50 text-teal-700 border border-teal-100"
                        }`}>
                          {item.classification === "componente" ? "Componente" : "Insumo"}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="p-5">
                        <span className="text-xs text-slate-600 font-semibold">{item.category || "---"}</span>
                      </td>

                      {/* Unit */}
                      <td className="p-5">
                        <span className="text-xs text-slate-500 font-bold uppercase">{item.unit}</span>
                      </td>

                      {/* Quantity */}
                      <td className="p-5 text-center">
                        <span className="font-mono text-xs font-black text-slate-800">{item.quantity}</span>
                      </td>

                      {/* Min Quantity */}
                      <td className="p-5 text-center">
                        <span className="font-mono text-xs text-slate-400 font-bold">{item.minQuantity}</span>
                      </td>

                      {/* Status */}
                      <td className="p-5 text-center">
                        <div className="flex items-center justify-center">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${statusInfo.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.led}`} />
                            {statusInfo.label}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {isItemActive && (
                            <>
                              {/* Quick Entrada */}
                              <button
                                onClick={() => setQuickAction({ type: "entrada", item })}
                                title="Registrar Entrada"
                                className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-all active:scale-95 border border-emerald-200/30"
                              >
                                <ArrowUpRight size={15} />
                              </button>

                              {/* Quick Saída */}
                              <button
                                onClick={() => setQuickAction({ type: "saida", item })}
                                title="Registrar Saída"
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all active:scale-95 border border-rose-200/30"
                              >
                                <ArrowDownLeft size={15} />
                              </button>
                            </>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => { setEditingComponente(item); setIsModalOpen(true); }}
                            title="Editar Dados"
                            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all active:scale-95 border border-slate-200/50"
                          >
                            <Edit size={15} />
                          </button>

                          {/* Inativar/Reativar Toggle */}
                          <button
                            onClick={() => handleToggleActive(item)}
                            title={isItemActive ? "Inativar" : "Reativar"}
                            className={`p-2 rounded-xl transition-all active:scale-95 border ${
                              isItemActive 
                                ? "bg-amber-50 hover:bg-amber-100 text-amber-600 border-amber-200/30" 
                                : "bg-teal-50 hover:bg-teal-100 text-teal-600 border-teal-200/30"
                            }`}
                          >
                            {isItemActive ? <Power size={15} /> : <RotateCcw size={15} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QUICK ENTRADA / SAÍDA FORM MODAL */}
      <AnimatePresence>
        {quickAction.type && quickAction.item && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden"
            >
              <div className={`p-6 text-white flex justify-between items-center ${
                quickAction.type === "entrada" ? "bg-emerald-600" : "bg-rose-600"
              }`}>
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2">
                    {quickAction.type === "entrada" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                    Nova {quickAction.type === "entrada" ? "Entrada" : "Saída"} de Estoque
                  </h3>
                  <span className="text-[10px] text-white/80 font-bold block mt-0.5">{quickAction.item.name}</span>
                </div>
                <button
                  onClick={() => setQuickAction({ type: null, item: null })}
                  className="p-1.5 hover:bg-white/15 rounded-full text-white transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleQuickActionSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {/* Quantity */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Quantidade</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        className="w-full p-3 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-bold outline-none focus:border-pink-300"
                        placeholder="0"
                        value={quickQty}
                        onChange={(e) => setQuickQty(e.target.value)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold uppercase">
                        {quickAction.item.unit}
                      </span>
                    </div>
                  </div>

                  {/* Optional Cost/Investment (Only on Entry) */}
                  {quickAction.type === "entrada" ? (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Custo Unitário (Opcional)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">R$</span>
                        <input
                          type="number"
                          step="0.0001"
                          min="0"
                          className="w-full pl-8 pr-3 p-3 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-bold outline-none focus:border-pink-300"
                          placeholder="0,00"
                          value={quickCost}
                          onChange={(e) => setQuickCost(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estoque Atual</label>
                      <div className="w-full p-3 bg-gray-100 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 font-mono">
                        {quickAction.item.quantity} {quickAction.item.unit}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reason */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Motivo / Descrição</label>
                  <input
                    type="text"
                    required
                    placeholder={quickAction.type === "entrada" ? "Ex: Compra com fornecedor, Ajuste de balanço" : "Ex: Consumo de produção, Perda"}
                    className="w-full p-3 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold outline-none focus:border-pink-300"
                    value={quickReason}
                    onChange={(e) => setQuickReason(e.target.value)}
                  />
                </div>

                {/* Origin/Destination */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    {quickAction.type === "entrada" ? "Origem / Fornecedor" : "Origem / Destino"} (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Ateliê Central, Setor de Costura"
                    className="w-full p-3 bg-pink-50/10 border border-pink-100/20 rounded-xl text-xs font-semibold outline-none focus:border-pink-300"
                    value={quickOrigin}
                    onChange={(e) => setQuickOrigin(e.target.value)}
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-2 border-t border-pink-50">
                  <button
                    type="button"
                    onClick={() => setQuickAction({ type: null, item: null })}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className={`flex-1 py-3 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      quickAction.type === "entrada" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"
                    }`}
                  >
                    Confirmar <Save size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ITEM SUMMARY DETAIL MODAL (RESUMO DO ITEM) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end bg-slate-900/60 backdrop-blur-md">
            <motion.div
              initial={{ x: "100%", opacity: 0.9 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-slate-50 w-full max-w-4xl h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${selectedItem.classification === "componente" ? "bg-indigo-50 text-indigo-600" : "bg-teal-50 text-teal-600"}`}>
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-800 leading-tight">{selectedItem.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">SKU: {selectedItem.code || "N/A"}</span>
                      <span className="text-slate-200">•</span>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                        selectedItem.classification === "componente" ? "text-indigo-600" : "text-teal-600"
                      }`}>{selectedItem.classification === "componente" ? "Componente" : "Insumo"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setEditingComponente(selectedItem); setIsModalOpen(true); }}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-50"
                  >
                    <Edit size={14} /> Editar
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* 6 CARDS CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Visual Header / Summary widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* CARD 1: DADOS GERAIS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">DADOS GERAIS</span>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Categoria:</span>
                          <span className="text-slate-700">{selectedItem.category || "---"}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Unidade:</span>
                          <span className="text-slate-700 uppercase">{selectedItem.unit}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-400">Localização:</span>
                          <span className="text-slate-700">{selectedItem.location || "Não informada"}</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-slate-400">Fornecedor:</span>
                          <span className="text-slate-700 max-w-[140px] truncate text-right">{selectedItem.supplier || "Nenhum"}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: ESTOQUE ATUAL */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2">ESTOQUE ATUAL</span>
                      <div className="text-center py-2">
                        <span className="text-3xl font-black text-slate-800 tracking-tight">
                          {selectedItem.quantity}
                          <span className="text-sm font-bold text-slate-400 ml-1 uppercase">{selectedItem.unit}</span>
                        </span>
                        
                        {/* Progress Bar Current vs Min */}
                        <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              selectedItem.quantity === 0 
                                ? "bg-rose-500" 
                                : selectedItem.quantity <= selectedItem.minQuantity 
                                ? "bg-amber-500" 
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, (selectedItem.quantity / (selectedItem.minQuantity || 1)) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
                          <span>Estoque Mínimo: {selectedItem.minQuantity}</span>
                          <span>
                            {selectedItem.quantity === 0 
                              ? "Esgotado" 
                              : selectedItem.quantity <= selectedItem.minQuantity 
                              ? "Abaixo do Mínimo" 
                              : "Seguro"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 5: CONSUMO MÉDIO & CUSTOS */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-2 font-mono">FINANCEIRO & CONSUMO</span>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-semibold">Custo Unitário:</span>
                          <span className="text-sm font-black text-pink-500 font-mono">{formatCurrency(selectedItem.unitCost || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-slate-400 font-semibold">Custo Médio:</span>
                          <span className="text-xs text-slate-600 font-bold font-mono">{formatCurrency(selectedItem.unitCost || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                          <span className="text-xs text-slate-400 font-semibold">Consumo Médio:</span>
                          <span className="text-xs text-rose-600 font-black">{averageConsumption} {selectedItem.unit} / ação</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* CARD 3: HISTÓRICO DE MOVIMENTAÇÕES (Span 7) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs md:col-span-7 flex flex-col h-[400px]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-4">HISTÓRICO DE MOVIMENTAÇÕES</span>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {loadingMovements ? (
                        <div className="text-center py-10 text-xs text-slate-400">Carregando movimentações...</div>
                      ) : itemMovements.length === 0 ? (
                        <div className="text-center py-10 text-xs text-slate-400">
                          <History size={32} className="mx-auto text-slate-300 mb-2" />
                          Nenhuma movimentação registrada para este item.
                        </div>
                      ) : (
                        itemMovements.map((move) => (
                          <div 
                            key={move.id} 
                            className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-start text-xs"
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                move.type === "entrada" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                              }`}>
                                {move.type === "entrada" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                              </div>
                              <div>
                                <span className="font-extrabold text-slate-800 block capitalize">{move.reason}</span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                                  <Clock size={10} />
                                  {move.date?.seconds 
                                    ? new Date(move.date.seconds * 1000).toLocaleString("pt-BR") 
                                    : "Agora"}
                                </span>
                              </div>
                            </div>

                            <span className={`font-mono font-black ${
                              move.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {move.type === "entrada" ? "+" : "-"}{move.quantity}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* CARD 4: PRODUTOS VINCULADOS & CARD 6 (Span 5) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs md:col-span-5 flex flex-col h-[400px]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-4">PRODUTOS VINCULADOS (RECEITA)</span>
                    
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                      {productsUsingSelectedItem.length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400">
                          <ShoppingBag size={32} className="mx-auto text-slate-300 mb-2" />
                          Este item não está associado à Ficha Técnica de nenhum produto.
                        </div>
                      ) : (
                        productsUsingSelectedItem.map((p) => {
                          const quantityNeeded = p.insumos?.find(i => i.insumoId === selectedItem.id)?.quantity || 1;
                          
                          return (
                            <div key={p.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <img 
                                  src={p.image || "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=200"} 
                                  className="w-10 h-10 object-cover rounded-lg bg-slate-200 border border-slate-200" 
                                  alt=""
                                  referrerPolicy="no-referrer"
                                />
                                <div className="min-w-0">
                                  <span className="text-xs font-extrabold text-slate-800 block truncate">{p.product_name}</span>
                                  <span className="text-[10px] text-slate-400 font-bold block">SKU: {p.code}</span>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-black text-pink-500 block">{quantityNeeded} {selectedItem.unit}</span>
                                <span className="text-[9px] text-slate-400 font-bold block">p/ unidade</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* STEPPED CREATE / EDIT FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && editingComponente && (
          <InsumoFormModal
            companyId={companyId}
            editing={editingComponente}
            onClose={() => { setIsModalOpen(false); setEditingComponente(null); }}
            onSave={async (data) => {
              await onSaveComponente(data);
              setIsModalOpen(false);
              setEditingComponente(null);
              // Update selected details if edited item is selected
              if (selectedItem?.id === data.id) {
                setSelectedItem({ ...selectedItem, ...data } as Componente);
              }
            }}
          />
        )}
      </AnimatePresence>

    </div>
  );
});
