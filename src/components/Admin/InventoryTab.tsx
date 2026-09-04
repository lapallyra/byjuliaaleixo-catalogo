import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Package,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  MoreVertical,
  Zap,
  AlertCircle,
  ArrowRight,
  Activity,
  ShoppingBag,
  User,
  MapPin,
  Check,
  Edit,
  X,
  FileText,
  Save,
  Trash2,
  Eye,
  Settings,
  Flame,
  UserCheck,
  Building,
  ArrowUpRight,
  ArrowDownLeft,
  Briefcase,
  AlertOctagon,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { Order, Product, Insumo, ProductionBatch, Componente, CompanyId } from "../../types";
import { matchesAtelierScope } from "../../services/atelierScopePolicy";
import { calculateOrderPriority, getPriorityStyles, PriorityResult } from "../../utils/priorityUtils";
import { createProductionBatch, updateProductionBatch, subscribeToProductionBatches } from "../../services/firebaseService";
import { suggestBatches, consolidateBatchInsumos } from "../../utils/batchUtils";
import { startProductionAPI, cancelProductionAPI } from "../../services/productionService";
import { formatCurrency } from "../../lib/currencyUtils";
import { db } from "../../lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";
import { useAuth } from "../AuthProvider";

interface InventoryTabProps {
  companyId: CompanyId;
  orders: Order[];
  products: Product[];
  insumos: Insumo[];
  onUpdateOrder: (id: string, data: Partial<Order>) => Promise<void>;
}

type KanbanStage = "waiting_production" | "production" | "conferencing" | "ready";

const STAGES: { id: KanbanStage; label: string; color: string; border: string; bg: string; led: string; text: string }[] = [
  {
    id: "waiting_production",
    label: "Aguardando Produção",
    color: "text-orange-600 bg-orange-50 border-orange-200/60",
    border: "border-orange-200/30",
    bg: "bg-orange-50/50",
    led: "bg-orange-500",
    text: "text-orange-700"
  },
  {
    id: "production",
    label: "Em Produção",
    color: "text-blue-600 bg-blue-50 border-blue-200/60",
    border: "border-blue-200/30",
    bg: "bg-blue-50/50",
    led: "bg-blue-500",
    text: "text-blue-700"
  },
  {
    id: "conferencing",
    label: "Controle de Qualidade",
    color: "text-purple-600 bg-purple-50 border-purple-200/60",
    border: "border-purple-200/30",
    bg: "bg-purple-50/50",
    led: "bg-purple-500",
    text: "text-purple-700"
  },
  {
    id: "ready",
    label: "Pronto para Entrega",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200/60",
    border: "border-emerald-200/30",
    bg: "bg-emerald-50/50",
    led: "bg-emerald-500",
    text: "text-emerald-700"
  },
];

export const InventoryTab: React.FC<InventoryTabProps> = React.memo(({
  companyId,
  orders,
  products,
  insumos,
  onUpdateOrder,
}) => {
  const orchestrator = useAdminOrchestrator();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "hoje" | "amanha" | "atrasados" | "alta_prioridade" | "meu_setor">("all");
  const [filterAtelier, setFilterAtelier] = useState<string>("all");
  const [filterResponsavel, setFilterResponsavel] = useState<string>("all");

  const [viewMode, setViewMode] = useState<'pedidos' | 'lotes'>('pedidos');
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [newBatchName, setNewBatchName] = useState("");

  // Detailed selected views (Resumo da Produção)
  const [selectedItem, setSelectedItem] = useState<Order | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<ProductionBatch | null>(null);
  const [tempObservations, setTempObservations] = useState("");
  const [isSavingObservations, setIsSavingObservations] = useState(false);

  // Drag and drop states
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);
  const [qcAlertOrder, setQcAlertOrder] = useState<Order | null>(null);
  const [errorAlert, setErrorAlert] = useState<{ title: string; message: string; warnings?: string[] } | null>(null);

  // Subscribe to production batches
  useEffect(() => {
    return subscribeToProductionBatches(companyId, (data) => {
      setBatches(data);
    });
  }, [companyId]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split('T')[0];
  }, []);

  // Sync tempObservations when selectedItem changes
  useEffect(() => {
    if (selectedItem) {
      setTempObservations(selectedItem.observations || "");
    }
  }, [selectedItem]);

  // Priority and score calculation on all orders (scoped by atelier)
  const ordersWithCalculatedPriority = useMemo(() => {
    return orders
      .filter((o) => matchesAtelierScope(o, companyId, 'pedidos'))
      .map((o) => {
        const priorityInfo = calculateOrderPriority(o);
        // Ensure compatible structure for assembly/conferencing stage mapping
        let status: Order['status'] = o.status;
        if (o.status === 'assembly') {
          status = 'conferencing';
        }
        return { ...o, status, priorityInfo };
      }) as (Order & { priorityInfo: PriorityResult })[];
  }, [orders, companyId]);

  // Get list of components/insumos consumed by a given order
  const getOrderComponents = (order: Order) => {
    const componentsMap: Record<string, { insumo: Componente; quantityNeeded: number }> = {};
    
    order.items?.forEach(item => {
      const product = products.find(p => p.id === item.productId || p.id === item.id);
      if (product?.insumos) {
        product.insumos.forEach(spec => {
          const insumo = insumos.find(i => i.id === spec.insumoId);
          if (insumo) {
            if (!componentsMap[spec.insumoId]) {
              componentsMap[spec.insumoId] = { insumo, quantityNeeded: 0 };
            }
            componentsMap[spec.insumoId].quantityNeeded += spec.quantity * item.quantity;
          }
        });
      }
    });

    return Object.values(componentsMap);
  };

  // Get active alerts for an order
  const getOrderAlerts = (order: Order) => {
    const alerts: { type: 'danger' | 'warning'; text: string; id: string }[] = [];

    // 1. Pedido atrasado
    const priorityInfo = calculateOrderPriority(order);
    if (priorityInfo?.isDelayed && order.status !== 'ready') {
      alerts.push({ type: 'danger', text: 'Pedido Atrasado!', id: 'delayed' });
    }

    // 2. Componentes / Estoque
    const orderComponents = getOrderComponents(order);
    let hasInsufficientStock = false;
    let hasMissingComponents = false;

    orderComponents.forEach(({ insumo, quantityNeeded }) => {
      if (insumo.quantity === 0) {
        hasMissingComponents = true;
      } else if (insumo.quantity < quantityNeeded) {
        hasInsufficientStock = true;
      }
    });

    if (hasMissingComponents) {
      alerts.push({ type: 'danger', text: 'Insumos Zerados', id: 'missing_components' });
    } else if (hasInsufficientStock) {
      alerts.push({ type: 'warning', text: 'Estoque Insuficiente', id: 'insufficient_stock' });
    }

    // 3. Produção parada há muitos dias
    if (order.status === 'production') {
      const lastHistory = order.history && order.history.length > 0 ? order.history[order.history.length - 1] : null;
      if (lastHistory?.timestamp) {
        const lastUpdate = lastHistory.timestamp.toDate ? lastHistory.timestamp.toDate() : new Date(lastHistory.timestamp);
        const diffDays = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays >= 3) {
          alerts.push({ type: 'danger', text: `Parada há ${Math.floor(diffDays)} dias`, id: 'stalled_production' });
        }
      }
    }

    return alerts;
  };

  // Check if QC checklist is completely checked
  const isQCComplete = (order: Order) => {
    const qc = order.deliveryChecklist;
    if (!qc) return false;
    return qc.productsChecked && qc.personalizationChecked && qc.packagingApplied && qc.quantityCorrect;
  };

  // Filter and Sort orders
  const filteredOrders = useMemo(() => {
    return ordersWithCalculatedPriority.filter((o) => {
      // Must belong to one of our Kanban stages
      const isKanbanStage = STAGES.some((s) => s.id === o.status);
      if (!isKanbanStage) return false;

      // Search match
      const term = searchTerm.toLowerCase();
      const matchSearch =
        o.code?.toLowerCase().includes(term) ||
        o.customerName?.toLowerCase().includes(term) ||
        o.items.some((i) => i.product_name.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Atelier & Assignee selects
      if (filterAtelier !== "all" && o.atelier !== filterAtelier) return false;
      if (filterResponsavel !== "all" && (o.responsible || o.assignee) !== filterResponsavel) return false;

      // Quick Filters
      switch (activeFilter) {
        case "hoje":
          return o.deliveryDate === todayStr && o.status !== "ready";
        case "amanha":
          return o.deliveryDate === tomorrowStr && o.status !== "ready";
        case "atrasados":
          return o.priorityInfo.isDelayed && o.status !== "ready";
        case "alta_prioridade":
          return ["ALTA", "URGENTE"].includes(o.priorityInfo.priority);
        case "meu_setor":
          return o.atelier && o.atelier !== "";
        default:
          return true;
      }
    });
  }, [ordersWithCalculatedPriority, searchTerm, activeFilter, filterAtelier, filterResponsavel, todayStr, tomorrowStr]);

  // Sorted list according to the requested automatic order:
  // 1. Atrasados
  // 2. Urgentes
  // 3. Data de entrega mais próxima
  // 4. Demais pedidos
  const sortedFilteredOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      // 1. Atrasados
      const aDelayed = a.priorityInfo?.isDelayed || false;
      const bDelayed = b.priorityInfo?.isDelayed || false;
      if (aDelayed !== bDelayed) return aDelayed ? -1 : 1;

      // 2. Urgentes
      const aUrgent = a.priorityInfo?.priority === "URGENTE";
      const bUrgent = b.priorityInfo?.priority === "URGENTE";
      if (aUrgent !== bUrgent) return aUrgent ? -1 : 1;

      // 3. Data de entrega mais próxima
      if (a.deliveryDate && b.deliveryDate) {
        return a.deliveryDate.localeCompare(b.deliveryDate);
      }
      if (a.deliveryDate) return -1;
      if (b.deliveryDate) return 1;

      // 4. Demais pedidos (by priority score)
      return b.priorityInfo.score - a.priorityInfo.score;
    });
  }, [filteredOrders]);

  // Automatic KPI Calculations
  const waitingCount = useMemo(() => ordersWithCalculatedPriority.filter(o => o.status === "waiting_production").length, [ordersWithCalculatedPriority]);
  const productionCount = useMemo(() => ordersWithCalculatedPriority.filter(o => o.status === "production").length, [ordersWithCalculatedPriority]);
  const conferencingCount = useMemo(() => ordersWithCalculatedPriority.filter(o => o.status === "conferencing").length, [ordersWithCalculatedPriority]);
  const readyCount = useMemo(() => ordersWithCalculatedPriority.filter(o => o.status === "ready").length, [ordersWithCalculatedPriority]);
  const delayedCount = useMemo(() => ordersWithCalculatedPriority.filter(o => o.priorityInfo.isDelayed && o.status !== "ready").length, [ordersWithCalculatedPriority]);

  const batchSuggestions = useMemo(() => {
    return suggestBatches(orders, products);
  }, [orders, products]);

  // Format Dates Helper
  const formatFriendlyDate = (dateValue: any) => {
    if (!dateValue) return "Não def.";
    const d = dateValue.toDate ? dateValue.toDate() : new Date(dateValue);
    return d.toLocaleDateString("pt-BR");
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, orderId: string) => {
    e.dataTransfer.setData("orderId", orderId);
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    setDraggedOverColumn(stageId);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStage: KanbanStage) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const orderId = e.dataTransfer.getData("orderId");
    if (!orderId) return;

    const order = ordersWithCalculatedPriority.find(o => o.id === orderId);
    if (!order || order.status === targetStage) return;

    // Enforce QC complete check when moving to "Pronto para Entrega"
    if (targetStage === "ready" && !isQCComplete(order)) {
      setQcAlertOrder(order);
      return;
    }

    await updateOrderStatus(order, targetStage);
  };

  const updateOrderStatus = async (order: Order, newStatus: string) => {
    // If transitioning to production, call startProductionAPI to do validations & deduct stock!
    if (newStatus === 'production' && !order.insumosDeducted) {
      try {
        await startProductionAPI({
          orderId: order.id,
          userId: user?.uid || 'system'
        });
        
        // After successful API call, the backend transaction will have updated the order in Firestore.
        if (selectedItem?.id === order.id) {
          setSelectedItem({
            ...order,
            status: 'production',
            insumosDeducted: true,
            updatedAt: new Date()
          });
        }
        return;
      } catch (error: any) {
        console.error("Error starting production for order:", error);
        setErrorAlert({
          title: "Erro de Estoque",
          message: error.message || "Não foi possível iniciar a produção devido a estoque insuficiente de insumos.",
          warnings: error.warnings || (error.message ? [error.message] : [])
        });
        return; // Stop the state transition!
      }
    }

    // If transitioning FROM production back to waiting_production, call cancelProductionAPI to restore stock!
    if (order.status === 'production' && newStatus === 'waiting_production' && order.insumosDeducted) {
      try {
        await cancelProductionAPI({
          orderId: order.id,
          userId: user?.uid || 'system'
        });
        
        if (selectedItem?.id === order.id) {
          setSelectedItem({
            ...order,
            status: 'waiting_production',
            insumosDeducted: false,
            updatedAt: new Date()
          });
        }
        return;
      } catch (error: any) {
        console.error("Error cancelling production for order:", error);
        setErrorAlert({
          title: "Erro ao Cancelar Produção",
          message: error.message || "Não foi possível cancelar a produção e estornar o estoque.",
        });
        return;
      }
    }

    const newHistory = [
      ...(order.history || []),
      {
        status: newStatus as any,
        timestamp: new Date(),
        notes: `Movido para ${STAGES.find((s) => s.id === newStatus)?.label || newStatus}`,
      },
    ];

    await onUpdateOrder(order.id, {
      status: newStatus as any,
      history: newHistory,
    });

    // If the selected details pane is showing this order, update it in state too
    if (selectedItem?.id === order.id) {
      setSelectedItem({ ...order, status: newStatus as any, history: newHistory });
    }
  };

  // Toggle Checkbox for Quality Control
  const handleQCToggle = async (order: Order, field: keyof NonNullable<Order['deliveryChecklist']>) => {
    const currentList = order.deliveryChecklist || {
      productsChecked: false,
      quantityCorrect: false,
      packagingApplied: false,
      personalizationChecked: false,
      internalNoteValidated: false
    };

    const updatedChecklist = {
      ...currentList,
      [field]: !currentList[field]
    };

    await onUpdateOrder(order.id, {
      deliveryChecklist: updatedChecklist
    });

    // Mirror to local selected state
    const nextOrder = { ...order, deliveryChecklist: updatedChecklist };
    setSelectedItem(nextOrder);
    
    // If the alert modal is open for this order, refresh its state
    if (qcAlertOrder?.id === order.id) {
      setQcAlertOrder(nextOrder);
    }
  };

  // Save custom order observations
  const handleSaveObservations = async () => {
    if (!selectedItem) return;
    setIsSavingObservations(true);
    try {
      await onUpdateOrder(selectedItem.id, { observations: tempObservations });
      setSelectedItem({ ...selectedItem, observations: tempObservations });
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Observações salvas com sucesso!",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: companyId,
      data: { success: true, title: 'Sucesso' }
    });
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar observações.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: companyId,
      data: { success: false, title: 'Erro' }
    });
    } finally {
      setIsSavingObservations(false);
    }
  };

  // Create batch manually
  const handleCreateBatch = async (batchData: Partial<ProductionBatch>) => {
    const code = batchData.code || `LOTE-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderIds = batchData.orderIds || selectedOrders;
    
    if (orderIds.length === 0) return;

    const batchOrders = orders.filter(o => orderIds.includes(o.id));
    const consolidated = consolidateBatchInsumos(batchOrders, products, insumos);
    
    const pNames = Array.from(new Set(batchOrders.flatMap(o => o.items.map(i => i.product_name))));
    const pIds = Array.from(new Set(batchOrders.flatMap(o => o.items.map(i => i.productId || i.id))));
    const totalQty = batchOrders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0);

    const newBatch: Omit<ProductionBatch, 'id'> = {
      code,
      companyId: batchOrders[0]?.companyId || companyId,
      orderIds,
      productIds: pIds,
      productNames: pNames,
      totalQuantity: totalQty,
      status: 'aberto',
      createdAt: new Date(),
      updatedAt: new Date(),
      consolidatedInsumos: consolidated,
      history: [{
        status: 'aberto',
        timestamp: new Date(),
        notes: 'Lote criado manualmente.'
      }]
    };

    await createProductionBatch(newBatch);
    setSelectedOrders([]);
    setShowBatchModal(false);
    setViewMode('lotes');
  };

  const handleUpdateBatchStatus = async (batchId: string, newStatus: ProductionBatch['status']) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return;

    // Transitioning to 'em_producao' (Start Production) -> call startProductionAPI!
    if (newStatus === 'em_producao') {
      try {
        await startProductionAPI({
          batchId: batchId,
          userId: user?.uid || 'system'
        });

        if (selectedBatch?.id === batchId) {
          setSelectedBatch({
            ...batch,
            status: 'em_producao',
            startedAt: new Date(),
            updatedAt: new Date()
          });
        }
        return;
      } catch (error: any) {
        console.error("Error starting batch production:", error);
        setErrorAlert({
          title: "Estoque do Lote Insuficiente",
          message: error.message || "Não foi possível iniciar a produção do lote porque um ou mais insumos não possuem estoque suficiente.",
          warnings: error.warnings || (error.message ? [error.message] : [])
        });
        return;
      }
    }

    // Transitioning back to 'aberto' -> call cancelProductionAPI!
    if (batch.status === 'em_producao' && newStatus === 'aberto') {
      try {
        await cancelProductionAPI({
          batchId: batchId,
          userId: user?.uid || 'system'
        });

        if (selectedBatch?.id === batchId) {
          setSelectedBatch({
            ...batch,
            status: 'aberto',
            updatedAt: new Date()
          });
        }
        return;
      } catch (error: any) {
        console.error("Error cancelling batch production:", error);
        setErrorAlert({
          title: "Erro ao Cancelar Produção do Lote",
          message: error.message || "Ocorreu um erro ao cancelar a produção do lote e estornar o estoque.",
        });
        return;
      }
    }

    // Default manual update for other status changes (e.g., concluido, em_separacao)
    const updatedData: Partial<ProductionBatch> = {
      status: newStatus,
      updatedAt: new Date(),
      history: [...(batch.history || []), {
        status: newStatus,
        timestamp: new Date(),
        notes: `Status do lote alterado para ${newStatus}.`
      }]
    };

    if (newStatus === 'concluido') updatedData.finishedAt = new Date();

    await updateProductionBatch(batchId, updatedData);

    // Update all order statuses inside this batch
    const orderStatusMap: Record<string, Order['status']> = {
      'aberto': 'waiting_production',
      'em_separacao': 'waiting_production',
      'em_producao': 'production',
      'concluido': 'conferencing'
    };

    const newOrderStatus = orderStatusMap[newStatus];
    if (newOrderStatus) {
      for (const orderId of batch.orderIds) {
        await onUpdateOrder(orderId, { status: newOrderStatus });
      }
    }

    if (selectedBatch?.id === batchId) {
      setSelectedBatch({ ...batch, ...updatedData });
    }
  };

  // Group columns for Kanban
  const columns = STAGES.map((stage) => ({
    ...stage,
    items: sortedFilteredOrders.filter((o) => o.status === stage.id),
  }));

  const ateliers = Array.from(new Set(orders.map((o) => o.atelier).filter(Boolean)));
  const assignees = Array.from(new Set(orders.map((o) => o.responsible || o.assignee).filter(Boolean)));

  // Custom priority mapping styles
  const getPriorityLabelAndDot = (priority: string) => {
    switch (priority) {
      case "BAIXA":
        return { label: "Baixa", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" };
      case "NORMAL":
        return { label: "Média", dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" };
      case "ALTA":
        return { label: "Alta", dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" };
      case "URGENTE":
        return { label: "Urgente", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" };
      default:
        return { label: "Média", dot: "bg-yellow-500", text: "text-yellow-700", bg: "bg-yellow-50" };
    }
  };

  return (
    <div className="space-y-6">

      {/* TOP INDICATORS GRID (Calculated Automatically with Premium Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { 
            label: "Aguardando Produção", 
            value: waitingCount, 
            color: "text-orange-700 border-orange-100/50 bg-gradient-to-br from-orange-50/40 to-orange-100/10", 
            led: "bg-orange-500",
            icon: <Clock size={16} className="text-orange-500" />
          },
          { 
            label: "Em Produção", 
            value: productionCount, 
            color: "text-blue-700 border-blue-100/50 bg-gradient-to-br from-blue-50/40 to-blue-100/10", 
            led: "bg-blue-500",
            icon: <Activity size={16} className="text-blue-500" />
          },
          { 
            label: "Controle de Qualidade", 
            value: conferencingCount, 
            color: "text-purple-700 border-purple-100/50 bg-gradient-to-br from-purple-50/40 to-purple-100/10", 
            led: "bg-purple-500",
            icon: <CheckCircle2 size={16} className="text-purple-500" />
          },
          { 
            label: "Prontos para Entrega", 
            value: readyCount, 
            color: "text-emerald-700 border-emerald-100/50 bg-gradient-to-br from-emerald-50/40 to-emerald-100/10", 
            led: "bg-emerald-500",
            icon: <ShoppingBag size={16} className="text-emerald-500" />
          },
          { 
            label: "Pedidos Atrasados", 
            value: delayedCount, 
            color: `text-red-700 border-red-100/50 bg-gradient-to-br from-red-50/40 to-red-100/10 ${delayedCount > 0 ? "animate-pulse" : ""}`, 
            led: "bg-red-500",
            icon: <AlertTriangle size={16} className="text-red-500" />
          },
        ].map((ind, idx) => (
          <div 
            key={idx} 
            className={`bg-white/75 backdrop-blur-md border border-white/80 p-5 shadow-sm rounded-[22px] transition-all hover:translate-y-[-1px] ${ind.color}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 block">{ind.label}</span>
              <div className="p-1.5 rounded-lg bg-white/80 border border-pink-100/50 shadow-sm">
                {ind.icon}
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black tracking-tight">{ind.value}</span>
              <span className={`w-1.5 h-1.5 rounded-full ${ind.led}`} />
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH, ADD-ON ACTIONS, QUICK FILTERS AND DROPDOWNS */}
      <div className="bg-white/75 backdrop-blur-md border border-white/80 p-6 shadow-sm rounded-[22px] flex flex-col gap-5">
        
        {/* Switch mode and Batch creator CTA */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-pink-100/50 pb-4">
          <div className="flex p-1 bg-pink-50/50 border border-pink-100/20 rounded-2xl w-fit">
            <button
              onClick={() => setViewMode('pedidos')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'pedidos' ? 'bg-white text-gray-800 shadow-sm scale-102 border border-pink-100/20' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Pedidos Individuais
            </button>
            <button
              onClick={() => setViewMode('lotes')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'lotes' ? 'bg-white text-gray-800 shadow-sm scale-102 border border-pink-100/20' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              Lotes de Produção
            </button>
          </div>
          
          {viewMode === 'pedidos' && selectedOrders.length > 0 && (
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-wider transition-all active:scale-98 shadow-sm"
            >
              <Zap size={14} /> Criar Lote de Produção ({selectedOrders.length})
            </button>
          )}
        </div>

        {/* Filters and search layout */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Pesquisar por Código do Pedido, Cliente ou Produto..."
              className="w-full pl-12 pr-4 py-3 bg-white/50 border border-pink-100/60 rounded-2xl text-xs font-semibold text-gray-700 outline-none focus:border-pink-300 focus:bg-white focus:ring-4 focus:ring-pink-100/50 transition-all placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              className="bg-white/50 border border-pink-100/60 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 outline-none focus:border-pink-300 transition-all cursor-pointer"
              value={filterAtelier}
              onChange={(e) => setFilterAtelier(e.target.value)}
            >
              <option value="all">Setor: Todos</option>
              {ateliers.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            <select
              className="bg-white/50 border border-pink-100/60 rounded-xl px-3 py-2.5 text-xs font-bold text-gray-600 outline-none focus:border-pink-300 transition-all cursor-pointer"
              value={filterResponsavel}
              onChange={(e) => setFilterResponsavel(e.target.value)}
            >
              <option value="all">Funcionário: Todos</option>
              {assignees.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Filter Pill Buttons */}
        <div className="border-t border-pink-50 pb-1 pt-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: "Todos os Pedidos" },
              { id: "hoje", label: "Para Hoje" },
              { id: "amanha", label: "Para Amanhã" },
              { id: "atrasados", label: "Atrasados" },
              { id: "alta_prioridade", label: "Alta Prioridade" },
              { id: "meu_setor", label: "Meu Setor" },
            ].map((pill) => (
              <button
                key={pill.id}
                onClick={() => setActiveFilter(pill.id as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeFilter === pill.id
                    ? "bg-gradient-to-b from-pink-400 to-pink-500 text-white shadow-sm scale-102"
                    : "bg-pink-50/20 text-gray-500 border border-pink-100/30 hover:bg-pink-100/20"
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* KANBAN BOARD OR BATCHES VIEW */}
      {viewMode === 'pedidos' ? (
        <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto pb-6 select-none">
          {columns.map((col) => {
            const isTargetColDraggedOver = draggedOverColumn === col.id;
            
            return (
              <div
                key={col.id}
                className="flex-1 min-w-[300px] flex flex-col gap-4 shrink-0 transition-all"
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                {/* Column Title Header */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.led}`} />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {col.label}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold ${col.color}`}>
                    {col.items.length}
                  </span>
                </div>

                {/* Column Cards Drop Area */}
                <div 
                  className={`flex flex-col gap-3 min-h-[500px] p-3 rounded-[24px] border transition-all ${
                    isTargetColDraggedOver 
                      ? "bg-pink-100/30 border-dashed border-pink-400 ring-4 ring-pink-100/20" 
                      : "bg-white/40 border-pink-100/30"
                  }`}
                >
                  {col.items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-dashed border-pink-200/50 rounded-2xl text-gray-400 text-[10px] font-bold uppercase tracking-widest gap-2 bg-white/40">
                      <Package size={24} className="text-pink-300" />
                      Arrastar pedidos aqui
                    </div>
                  ) : (
                    <AnimatePresence>
                      {col.items.map((order) => {
                        const isOverdue = order.priorityInfo?.isDelayed && order.status !== 'ready';
                        const itemsCount = order.items?.reduce((acc, i) => acc + i.quantity, 0) || 0;
                        const isSelected = selectedOrders.includes(order.id);
                        const priorityStyle = getPriorityLabelAndDot(order.priorityInfo?.priority || 'NORMAL');
                        const alerts = getOrderAlerts(order);

                        return (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={order.id}
                            draggable
                            onDragStart={(e: any) => handleDragStart(e, order.id)}
                            onClick={() => setSelectedItem(order)}
                            className={`bg-white/80 p-4 rounded-[20px] shadow-sm border relative pl-6 transition-all cursor-grab active:cursor-grabbing hover:translate-y-[-2px] hover:shadow-md ${
                              isSelected 
                                ? "border-pink-400 ring-2 ring-pink-100" 
                                : "border-pink-100/40 hover:border-pink-200"
                            }`}
                          >
                            {/* Color-coded vertical LED strip on left margin */}
                            <div className={`w-1.5 rounded-l-2xl absolute left-0 top-0 bottom-0 ${col.led}`} />

                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-start gap-2.5">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setSelectedOrders(prev => 
                                      prev.includes(order.id) 
                                        ? prev.filter(id => id !== order.id)
                                        : [...prev, order.id]
                                    );
                                  }}
                                  className="mt-0.5 w-4 h-4 rounded border-pink-200 text-pink-500 focus:ring-pink-400 cursor-pointer"
                                />
                                <div>
                                  <span className="font-mono text-[9px] font-bold text-pink-500 uppercase tracking-widest block">
                                    #{order.code}
                                  </span>
                                  <span className="text-xs font-bold text-gray-800 block leading-tight mt-0.5">
                                    {order.customerName}
                                  </span>
                                </div>
                              </div>

                              <div className="relative" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={order.status}
                                  onChange={(e) => updateOrderStatus(order, e.target.value)}
                                  className="appearance-none text-[0px] w-6 h-6 bg-transparent cursor-pointer focus:outline-none"
                                  title="Mover de etapa"
                                >
                                  {STAGES.map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.label}
                                    </option>
                                  ))}
                                </select>
                                <MoreVertical
                                  size={14}
                                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none hover:text-gray-600"
                                />
                              </div>
                            </div>

                            {/* Products and quantity - No images */}
                            <div className="text-[10px] text-gray-500 font-semibold line-clamp-2 h-7 leading-tight mb-3">
                              {order.items?.map((i) => `${i.quantity}x ${i.product_name}`).join(", ") || "Sem produtos"}
                            </div>

                            {/* Active Alerts List inside the card */}
                            {alerts.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-3">
                                  {alerts.map((al, idx) => (
                                    <span 
                                      key={idx} 
                                      className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                                        al.type === 'danger' 
                                          ? "bg-rose-50 text-rose-600 border-rose-100" 
                                          : "bg-amber-50 text-amber-600 border-amber-100"
                                      }`}
                                    >
                                      <AlertCircle size={9} />
                                      {al.text}
                                    </span>
                                  ))}
                                </div>
                              )}

                            {/* Date of delivery & Priority metrics */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-pink-50 mt-2">
                              <div className="flex items-center gap-1.5 text-gray-400 font-semibold text-[10px]">
                                <Calendar size={11} className={isOverdue ? "text-rose-500" : "text-gray-400"} />
                                <span className={isOverdue ? "text-rose-600 font-bold" : ""}>
                                  {formatFriendlyDate(order.deliveryDate)}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Priority indicator dot */}
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border flex items-center gap-1 ${priorityStyle.bg} ${priorityStyle.text} border-pink-100/50`}>
                                  <span className={`w-1 h-1 rounded-full ${priorityStyle.dot}`} />
                                  {priorityStyle.label}
                                </span>
                              </div>
                            </div>

                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LOTES DE PRODUÇÃO VIEW */
        <div className="space-y-6">
          {batchSuggestions.length > 0 && (
            <div className="bg-amber-50/10 backdrop-blur-md border border-amber-200/30 rounded-[22px] p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-amber-500/85 text-white rounded-xl shadow-sm">
                  <Zap size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-amber-900 uppercase tracking-widest">Sugestões de Agrupamento de Lote</h3>
                  <p className="text-[10px] text-amber-600/80 font-semibold mt-0.5">Otimização de setup automático baseada em itens pendentes idênticos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {batchSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="bg-white/80 p-5 rounded-[20px] border border-amber-100/30 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[8px] font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded uppercase tracking-widest">Otimização</span>
                        <span className="text-[10px] font-bold text-gray-400">{suggestion.orderIds?.length} Pedidos</span>
                      </div>
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1 mb-1">{suggestion.productNames?.[0]}</h4>
                      <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest mb-4">Aproveitamento Máximo</p>
                    </div>
                    <button 
                      onClick={() => handleCreateBatch(suggestion)}
                      className="w-full py-2.5 bg-amber-500/90 hover:bg-amber-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      Criar Lote Sugerido
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Batches list */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {batches.length === 0 ? (
              <div className="col-span-full py-24 text-center text-gray-400 bg-white/75 backdrop-blur-md rounded-[22px] border border-white/80 p-10 shadow-sm">
                <Package size={48} className="mx-auto text-pink-300 mb-3" />
                <p className="text-xs font-bold uppercase tracking-wider text-gray-700">Nenhum lote de produção aberto</p>
                <p className="text-[11px] text-gray-400 mt-1 mb-4">Selecione pedidos e agrupe-os ou clique para iniciar.</p>
                <button 
                  onClick={() => setViewMode('pedidos')}
                  className="px-6 py-2.5 bg-pink-50/30 border border-pink-100/40 hover:bg-pink-100/20 text-pink-600 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Voltar para Pedidos
                </button>
              </div>
            ) : (
              batches.map(batch => (
                <div 
                  key={batch.id} 
                  onClick={() => setSelectedBatch(batch)}
                  className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] overflow-hidden shadow-sm hover:shadow-md hover:border-pink-300/50 transition-all cursor-pointer p-6 space-y-4"
                >
                  <div className="flex justify-between items-start border-b border-pink-50 pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">LOTE #{batch.code}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                          batch.status === 'concluido' ? 'bg-emerald-50 text-emerald-600' :
                          batch.status === 'em_producao' ? 'bg-amber-50 text-amber-600' :
                          'bg-gray-100 text-gray-500'
                        }`}>
                          {batch.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{batch.productNames.join(', ')}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black text-gray-800">{batch.totalQuantity}</div>
                      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest block">Unidades</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-wider mb-2">Pedidos Vinculados</span>
                    <div className="flex flex-wrap gap-1.5">
                      {batch.orderIds.map(orderId => {
                        const order = orders.find(o => o.id === orderId);
                        return (
                          <span key={orderId} className="px-2 py-1 bg-pink-50/20 border border-pink-100/20 rounded-lg text-[10px] font-bold text-gray-600">
                            #{order?.code || '???'}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
                    {batch.status === 'aberto' && (
                      <button 
                        onClick={() => handleUpdateBatchStatus(batch.id, 'em_producao')}
                        className="flex-1 py-3 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                      >
                        Iniciar Produção
                      </button>
                    )}
                    {batch.status === 'em_producao' && (
                      <button 
                        onClick={() => handleUpdateBatchStatus(batch.id, 'concluido')}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                      >
                        Concluir Lote
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DETAILED PRODUCTION DRAWER (RESUMO DA PRODUÇÃO) */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-[#FDF8F5] w-full max-w-4xl h-full shadow-2xl border-l border-pink-100/40 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-white/85 backdrop-blur-md border-b border-pink-100/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 border border-pink-100/30 rounded-2xl text-pink-500">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-gray-800 leading-tight">Resumo da Produção</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">PEDIDO #{selectedItem.code}</span>
                      <span className="text-pink-200">•</span>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase">{selectedItem.customerName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="p-2 hover:bg-pink-50/50 rounded-full text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body containing 7 detailed CARDS */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* CARD 7 — TIMELINE STATUS FLOW TRACKER */}
                <div className="bg-white/75 backdrop-blur-md p-6 rounded-[22px] border border-white/80 shadow-sm">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block mb-4">TIMELINE DE EXECUÇÃO</span>
                  <div className="grid grid-cols-4 gap-2 relative">
                    {STAGES.map((st, sIdx) => {
                      const isActive = selectedItem.status === st.id;
                      const isPast = STAGES.findIndex(s => s.id === selectedItem.status) >= sIdx;
                      
                      return (
                        <div key={st.id} className="text-center flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isActive ? `${st.led} text-white ring-4 ring-offset-2 ring-pink-400/20` : isPast ? `${st.led} text-white` : "bg-gray-100 text-gray-400"
                          }`}>
                            {isPast && !isActive ? <Check size={14} /> : <span className="text-xs font-bold">{sIdx + 1}</span>}
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 block ${isActive ? st.text : "text-gray-400"}`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Layout of the remaining 6 Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* LEFT SECTION (Span 6) */}
                  <div className="md:col-span-6 space-y-6">
                    
                    {/* CARD 1 — INFORMAÇÕES DO PEDIDO */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Informações do Pedido</span>
                      <div className="space-y-2.5 text-xs font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Cliente:</span>
                          <span className="text-gray-800">{selectedItem.customerName}</span>
                        </div>
                        {selectedItem.contact && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Contato:</span>
                            <span className="text-gray-800">{selectedItem.contact}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Data Prevista:</span>
                          <span className="text-gray-800 font-mono">{formatFriendlyDate(selectedItem.deliveryDate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Prioridade:</span>
                          {(() => {
                            const pResult = calculateOrderPriority(selectedItem);
                            const pStyle = getPriorityLabelAndDot(pResult.priority);
                            return (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${pStyle.bg} ${pStyle.text}`}>
                                {pStyle.label}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Setor/Ateliê:</span>
                          <span className="text-gray-800">{selectedItem.atelier || "Não definido"}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Funcionário/Responsável:</span>
                          <span className="text-gray-800">{selectedItem.responsible || selectedItem.assignee || "Livre"}</span>
                        </div>
                      </div>
                    </div>

                    {/* CARD 5 — HISTÓRICO DA PRODUÇÃO */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Histórico de Produção</span>
                      <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 text-xs">
                        {(!selectedItem.history || selectedItem.history.length === 0) ? (
                          <div className="text-gray-400 italic text-center py-4">Nenhum log de histórico.</div>
                        ) : (
                          selectedItem.history.map((log, lIdx) => (
                            <div key={lIdx} className="border-l-2 border-pink-100/50 pl-3 relative space-y-0.5 pb-2">
                              <span className="w-2 h-2 rounded-full bg-pink-300 absolute -left-1.25 top-1.5" />
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700 capitalize text-[11px]">{log.status.replace('_', ' ')}</span>
                                <span className="text-[9px] font-semibold text-gray-400">
                                  {formatFriendlyDate(log.timestamp)}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-400 font-medium">{log.notes || "Movimentação registrada"}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* CARD 6 — OBSERVAÇÕES */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Observações da Produção</span>
                      <textarea
                        value={tempObservations}
                        onChange={(e) => setTempObservations(e.target.value)}
                        placeholder="Insira notas de fabricação, especificações adicionais de material ou atrasos..."
                        className="w-full p-3 bg-pink-50/20 border border-pink-100/30 rounded-2xl text-xs font-semibold text-gray-700 h-24 outline-none focus:border-pink-300 resize-none"
                      />
                      <button
                        onClick={handleSaveObservations}
                        disabled={isSavingObservations}
                        className="w-full py-2.5 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <Save size={13} />
                        {isSavingObservations ? "Salvando..." : "Salvar Observações"}
                      </button>
                    </div>

                  </div>

                  {/* RIGHT SECTION (Span 6) */}
                  <div className="md:col-span-6 space-y-6">

                    {/* CONTROLE DE QUALIDADE CHECKLIST (Always visible on details drawer for best operations) */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-pink-200/25 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-pink-50 pb-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-pink-500 block">Controle de Qualidade</span>
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest ${
                          isQCComplete(selectedItem) ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                        }`}>
                          {isQCComplete(selectedItem) ? "Conferido & Liberado" : "Pendente"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { field: "productsChecked" as const, label: "Produto conferido" },
                          { field: "personalizationChecked" as const, label: "Personalização conferida" },
                          { field: "packagingApplied" as const, label: "Embalagem conferida" },
                          { field: "quantityCorrect" as const, label: "Pedido liberado" },
                        ].map((qcItem) => {
                          const isChecked = selectedItem.deliveryChecklist?.[qcItem.field] || false;
                          
                          return (
                            <button
                              key={qcItem.field}
                              onClick={() => handleQCToggle(selectedItem, qcItem.field)}
                              className="w-full flex items-center justify-between p-3 bg-pink-50/10 border border-pink-100/20 hover:bg-pink-100/15 rounded-2xl transition-all text-left"
                            >
                              <span className="text-xs font-semibold text-gray-700">{qcItem.label}</span>
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                isChecked ? "bg-emerald-500 border-transparent text-white" : "bg-white border-pink-200 text-transparent"
                              }`}>
                                <Check size={14} className="stroke-[3]" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* CARD 2 — PRODUTOS */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Produtos no Lote</span>
                      <div className="space-y-2">
                        {selectedItem.items?.map((item, idx) => (
                          <div key={idx} className="p-3 bg-pink-50/10 border border-pink-100/20 rounded-[18px] flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-gray-800 block">{item.product_name}</span>
                              {item.code && <span className="text-[9px] font-mono font-bold text-gray-400">SKU: {item.code}</span>}
                            </div>
                            <span className="font-mono font-bold text-pink-500 bg-pink-50 border border-pink-100/50 px-2 py-1 rounded-lg">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CARD 3 — COMPONENTES CONSUMIDOS & CARD 4 — CONSUMO DE ESTOQUE */}
                    <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-4">
                      <div className="flex justify-between items-center border-b border-pink-50 pb-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block">Ficha Técnica & Consumo de Estoque</span>
                        <span className="text-[8px] font-bold text-gray-300 tracking-wider">Demanda Operacional</span>
                      </div>

                      <div className="space-y-3">
                        {getOrderComponents(selectedItem).length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-4">Nenhum componente cadastrado na receita destes produtos.</div>
                        ) : (
                          getOrderComponents(selectedItem).map(({ insumo, quantityNeeded }) => {
                            const isInsufficient = insumo.quantity < quantityNeeded;
                            const isMissing = insumo.quantity === 0;
                            
                            return (
                              <div key={insumo.id} className="p-3 bg-pink-50/10 border border-pink-100/20 rounded-[18px] space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-bold text-gray-700 block">{insumo.name}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase">{insumo.category}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono font-bold text-xs text-gray-800 block">
                                      {quantityNeeded} {insumo.unit}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 block">
                                      Estoque: {insumo.quantity} {insumo.unit}
                                    </span>
                                  </div>
                                </div>

                                {/* Stock warning alerts on individual insumo bar */}
                                {isMissing ? (
                                  <div className="text-[9px] font-bold text-rose-600 flex items-center gap-1">
                                    <AlertOctagon size={11} /> Componente em Falta (Estoque Zerado!)
                                  </div>
                                ) : isInsufficient ? (
                                  <div className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                                    <AlertTriangle size={11} /> Estoque Insuficiente para Demanda
                                  </div>
                                ) : (
                                  <div className="w-full bg-pink-100/30 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${Math.min(100, (insumo.quantity / quantityNeeded) * 100)}%` }}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DETAILED BATCH SUMMARY DRAWER */}
      <AnimatePresence>
        {selectedBatch && (
          <div className="fixed inset-0 z-[150] flex items-center justify-end bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ x: "100%", opacity: 0.95 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="bg-[#FDF8F5] w-full max-w-2xl h-full shadow-2xl border-l border-pink-100/40 flex flex-col overflow-hidden"
            >
              <div className="p-6 bg-white/85 backdrop-blur-md border-b border-pink-100/40 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-pink-50 border border-pink-100/30 text-pink-500 rounded-2xl">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-gray-800 leading-tight">Resumo do Lote</h3>
                    <span className="text-[10px] font-bold text-pink-500 block">LOTE #{selectedBatch.code}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatch(null)}
                  className="p-2 hover:bg-pink-50/50 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* CARD — INFORMAÇÕES DO LOTE */}
                <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Informações do Lote</span>
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                    <div>
                      <span className="text-gray-400 block">Total de Peças:</span>
                      <span className="text-gray-800 font-bold text-sm">{selectedBatch.totalQuantity} unidades</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Status Operacional:</span>
                      <span className="text-gray-800 font-bold capitalize">{selectedBatch.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>

                {/* CARD — PRODUTOS NO LOTE */}
                <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Mix de Produtos</span>
                  <div className="space-y-2">
                    {selectedBatch.productNames.map((name, index) => (
                      <div key={index} className="p-2.5 bg-pink-50/10 border border-pink-100/20 rounded-xl font-bold text-xs text-gray-700">
                        {name}
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD — COMPONENTES & ESTOQUE */}
                <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-4">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Ficha Técnica Consolidada</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedBatch.consolidatedInsumos?.map((insumo, idx) => (
                      <div key={idx} className="p-3 bg-pink-50/10 border border-pink-100/20 rounded-[18px] flex justify-between items-center text-xs">
                        <span className="font-bold text-gray-700">{insumo.name}</span>
                        <span className="font-mono font-bold text-gray-950">{insumo.quantity} {insumo.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CARD — PEDIDOS VINCULADOS */}
                <div className="bg-white/75 backdrop-blur-md p-5 rounded-[22px] border border-white/80 shadow-sm space-y-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400 block border-b border-pink-50 pb-2">Pedidos Vinculados</span>
                  <div className="space-y-2">
                    {selectedBatch.orderIds.map(orderId => {
                      const order = orders.find(o => o.id === orderId);
                      return (
                        <div 
                          key={orderId}
                          onClick={() => {
                            if (order) {
                              setSelectedBatch(null);
                              setSelectedItem(order);
                            }
                          }}
                          className="p-3 bg-pink-50/10 border border-pink-100/20 hover:bg-pink-100/15 rounded-[18px] flex justify-between items-center cursor-pointer transition-all text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-pink-500 block">#{order?.code}</span>
                            <span className="font-bold text-gray-700 block">{order?.customerName}</span>
                          </div>
                          <ChevronRight size={16} className="text-pink-400" />
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QC BLOCKING WARNING ALERT MODAL */}
      <AnimatePresence>
        {qcAlertOrder && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-[22px] w-full max-w-md shadow-2xl border border-white/80 overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white flex items-center gap-3">
                <AlertOctagon size={24} className="animate-bounce" />
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider">Controle de Qualidade Pendente</h3>
                  <span className="text-[10px] text-white/80 font-semibold block">Pedido #{qcAlertOrder.code} - {qcAlertOrder.customerName}</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                  Para avançar o pedido para <strong className="text-gray-800">"Pronto para Entrega"</strong>, você deve conferir e liberar todos os itens do Controle de Qualidade primeiro!
                </p>

                {/* Checklist controls directly embedded in warning for lightning fast operation */}
                <div className="space-y-2.5 p-4 bg-pink-50/10 border border-pink-100/20 rounded-2xl">
                  {[
                    { field: "productsChecked" as const, label: "Produto conferido" },
                    { field: "personalizationChecked" as const, label: "Personalização conferida" },
                    { field: "packagingApplied" as const, label: "Embalagem conferida" },
                    { field: "quantityCorrect" as const, label: "Pedido liberado" },
                  ].map((qcItem) => {
                    const isChecked = qcAlertOrder.deliveryChecklist?.[qcItem.field] || false;
                    
                    return (
                      <button
                        key={qcItem.field}
                        onClick={() => handleQCToggle(qcAlertOrder, qcItem.field)}
                        className="w-full flex items-center justify-between p-2.5 bg-white/60 hover:bg-pink-50/20 rounded-xl border border-pink-100/20 transition-all text-left"
                      >
                        <span className="text-xs font-bold text-gray-700">{qcItem.label}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                          isChecked ? "bg-emerald-500 border-transparent text-white" : "bg-white border-pink-200 text-transparent"
                        }`}>
                          <Check size={11} className="stroke-[3]" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2 border-t border-pink-50">
                  <button
                    type="button"
                    onClick={() => setQcAlertOrder(null)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedItem(qcAlertOrder);
                      setQcAlertOrder(null);
                    }}
                    className="flex-1 py-3 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center shadow-md shadow-pink-500/10"
                  >
                    Abrir Resumo Completo
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE CRIAÇÃO DE LOTE */}
      <AnimatePresence>
        {showBatchModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white/85 backdrop-blur-md rounded-[24px] w-full max-w-lg overflow-hidden shadow-2xl border border-white/80"
            >
              <div className="p-6 border-b border-pink-100/20 flex items-center justify-between bg-pink-50/10">
                <div>
                  <h3 className="text-base font-bold text-gray-800">Novo Lote de Produção</h3>
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-wider mt-0.5">Agrupamento de {selectedOrders.length} pedidos selecionados</p>
                </div>
                <button 
                  onClick={() => setShowBatchModal(false)} 
                  className="w-10 h-10 rounded-xl bg-white border border-pink-100/30 flex items-center justify-center text-gray-400 hover:text-gray-600"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5 block">Identificação do Lote</label>
                  <input 
                    type="text" 
                    placeholder="Ex: LOTE-COSTURA-JULHO"
                    className="w-full px-4 py-3 bg-pink-50/20 border border-pink-100/30 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-pink-300 focus:bg-white transition-all placeholder:text-gray-300"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                  />
                </div>

                <div className="p-5 bg-pink-50/30 rounded-2xl border border-pink-100/20 text-xs">
                  <p className="font-bold text-pink-950 leading-relaxed mb-1">
                    Agrupamento Inteligente
                  </p>
                  <p className="font-semibold text-pink-700 leading-relaxed">
                    O sistema gerará uma ficha técnica única consolidando todas as matérias-primas necessárias para os {selectedOrders.length} pedidos selecionados.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                   <button 
                     onClick={() => setShowBatchModal(false)}
                     className="flex-1 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-all text-center"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={() => handleCreateBatch({ code: newBatchName })}
                     className="flex-[2] py-3 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all text-center shadow-lg"
                   >
                     Confirmar e Criar Lote
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TRANSACTION STOCK ERROR WARNING MODAL */}
      <AnimatePresence>
        {errorAlert && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white/90 backdrop-blur-md rounded-[22px] w-full max-w-md shadow-2xl border border-white/80 overflow-hidden"
            >
              <div className="p-6 bg-gradient-to-r from-amber-500 to-rose-500 text-white flex items-center gap-3">
                <AlertTriangle size={24} className="animate-pulse" />
                <div>
                  <h3 className="text-base font-bold uppercase tracking-wider">{errorAlert.title}</h3>
                  <span className="text-[10px] text-white/80 font-semibold block">Ação bloqueada pelo controle de estoque</span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-gray-600 leading-relaxed">
                  {errorAlert.message}
                </p>

                {errorAlert.warnings && errorAlert.warnings.length > 0 && (
                  <div className="space-y-2 p-4 bg-amber-50/20 border border-amber-100/30 rounded-2xl max-h-48 overflow-y-auto">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600 block mb-1">Itens com Estoque Insuficiente:</span>
                    {errorAlert.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs font-bold text-gray-700">
                        <span className="text-rose-500 mt-0.5">•</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setErrorAlert(null)}
                    className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-center"
                  >
                    Entendido, Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
});
