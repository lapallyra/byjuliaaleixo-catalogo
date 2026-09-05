import React, { useState, useMemo, useEffect } from "react";
import { 
  ShoppingBag, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  Search, 
  Filter, 
  ArrowRight, 
  TrendingDown, 
  TrendingUp,
  Truck,
  Trash2,
  X,
  History,
  FileText,
  MoreVertical,
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
  Package
} from "lucide-react";
import { 
  CompanyId, 
  Componente, 
  PurchaseOrder, 
  Supplier, 
  Product, 
  Order,
  ComponenteMovement
} from "../../types";
import { formatCurrency } from "../../lib/currencyUtils";
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
  increment,
  deleteDoc,
  setDoc
} from "firebase/firestore";
import { SupplierForm } from "./SupplierForm";
import { PurchaseOrderForm } from "./PurchaseOrderForm";
import { addInsumo, updateInsumo, deleteInsumo } from "../../services/firebaseService";
import { InsumoFormModal } from "./InsumoFormModal";
import { ComponentsTab } from "./ComponentsTab";
import { matchesAtelierScope } from "../../services/atelierScopePolicy";
import { AtelierBadge } from "./AtelierBadge";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface PurchasesTabProps {
  orders: Order[];
  companyId?: CompanyId;
  onNavigateNewInsumo?: () => void;
  onNavigateNewPurchase?: () => void;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = React.memo(({
  companyId,
  orders,
  onNavigateNewInsumo,
  onNavigateNewPurchase,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [activeTab, setActiveTab] = useState<'items' | 'suggestions' | 'manual' | 'history' | 'suppliers'>('items');
  const [insumos, setInsumos] = useState<Componente[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isInsumoModalOpen, setIsInsumoModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const activePurchase = useMemo(() => purchaseOrders.find(p => p.id === selectedPurchase?.id) || selectedPurchase, [purchaseOrders, selectedPurchase]);

  useEffect(() => {
    const qInsumos = query(collection(db, "componentes"));
    const unsubInsumos = onSnapshot(qInsumos, (snap) => {
      setInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Componente)));
    });

    const qProducts = companyId && companyId !== ('all' as any)
      ? query(collection(db, "products"), where("company", "==", companyId))
      : query(collection(db, "products"));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });

    const qPurchases = query(collection(db, "purchase_orders"));
    const unsubPurchases = onSnapshot(qPurchases, (snap) => {
      const allPurchases = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PurchaseOrder));
      if (companyId && companyId !== ('all' as any)) {
        setPurchaseOrders(allPurchases.filter(p => matchesAtelierScope(p, companyId, 'compras')));
      } else {
        setPurchaseOrders(allPurchases);
      }
    });

    const qSuppliers = query(collection(db, "suppliers"));
    const unsubSuppliers = onSnapshot(qSuppliers, (snap) => {
      setSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
    });

    setLoading(false);
    return () => {
      unsubInsumos();
      unsubProducts();
      unsubPurchases();
      unsubSuppliers();
    };
  }, [companyId]);

  // Calculate suggested items
  const suggestedItems = useMemo(() => {
    return insumos.map(insumo => {
      const current = insumo.quantity || 0;
      const min = insumo.minQuantity || 0;
      
      const status = current <= (min * 0.5) ? 'Crítico' : 
                     current < min ? 'Baixo' : 
                     'Normal';
      
      const priority = status === 'Crítico' ? 1 : status === 'Baixo' ? 2 : 3;
      const suggestedQty = Math.max(0, (min * 1.5) - current);

      return {
        ...insumo,
        status,
        priority,
        suggestedQty,
        consumption30d: 0 // In a real production system this would be calculated from production logs
      };
    })
    .filter(item => item.status !== 'Normal' || item.suggestedQty > 0)
    .sort((a, b) => a.priority - b.priority);
  }, [insumos]);

  const handleUpdateStatus = async (purchaseId: string, newStatus: PurchaseOrder['status']) => {
    try {
      const purchaseRef = doc(db, "purchase_orders", purchaseId);
      const purchase = purchaseOrders.find(p => p.id === purchaseId);
      
      if (!purchase) return;

      if (newStatus === 'recebido' && purchase.status !== 'recebido') {
        // Update physical stock for each item
        for (const item of purchase.items) {
          await fetch('/api/inventory/movement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              componenteId: item.insumoId,
              type: 'entrada',
              quantity: item.quantity,
              reason: `Recebimento de mercadoria do fornecedor ${purchase.supplierName}`,
              origin: `Compra ${purchase.code}`,
              cost: item.unitPrice || 0,
              user: "Sistema"
            })
          });
        }
      }

      await updateDoc(purchaseRef, { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      setSelectedPurchase(null);
    } catch (error) {
      console.error("Error updating purchase status:", error);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm("Deseja realmente excluir este fornecedor?")) {
      await deleteDoc(doc(db, "suppliers", id));
    }
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'Crítico': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Baixo': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Normal': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityIcon = (status: string) => {
    switch (status) {
      case 'Crítico': return <AlertTriangle size={14} className="text-rose-500" />;
      case 'Baixo': return <Clock size={14} className="text-orange-500" />;
      case 'Normal': return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Insumos & Reposição</h1>
          <p className="text-slate-500 text-sm">Gestão de insumos, materiais e reposições</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (onNavigateNewInsumo) onNavigateNewInsumo();
              else setIsInsumoModalOpen(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-sm shadow-md"
          >
            <Plus size={18} /> + (NOVO) Insumo
          </button>
          <button 
            onClick={() => {
              if (onNavigateNewPurchase) onNavigateNewPurchase();
              else setIsPurchaseModalOpen(true);
            }}
            className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all text-sm"
          >
            <Plus size={18} /> Novo Pedido de Compra
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-pink-100/30">
        <button 
          onClick={() => setActiveTab('items')}
          className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'items' ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Package size={18} />
            Estoque de Insumos
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'suggestions' ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <TrendingDown size={18} />
            Reposição Sugerida
            {suggestedItems.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {suggestedItems.length}
              </span>
            )}
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'history' ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <History size={18} />
            Histórico de Compras
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-3 text-sm font-bold transition-all border-b-2 ${activeTab === 'suppliers' ? 'border-pink-500 text-pink-500' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <div className="flex items-center gap-2">
            <Truck size={18} />
            Fornecedores
          </div>
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'items' && (
          <ComponentsTab
            companyId={companyId}
            products={products}
            componentes={insumos}
            onSaveComponente={async (data) => {
              try {
                if (data.id) {
                  await updateInsumo(data.id, data);
                } else {
                  await addInsumo(data as any);
                }
              } catch (err) {
                console.error("Error saving insumo: ", err);
                orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar insumo. Tente novamente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
              }
            }}
            onDeleteComponente={async (id) => {
              try {
                if (confirm("Tem certeza que deseja excluir este insumo?")) {
                  await deleteInsumo(id);
                }
              } catch (err) {
                console.error("Error deleting insumo: ", err);
                orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao excluir insumo.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
              }
            }}
          />
        )}

        {activeTab === 'suggestions' && (
          <div className="grid grid-cols-1 gap-4">
            {/* Quick Alerts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-rose-600 uppercase">Itens Críticos</p>
                    <p className="text-2xl font-bold text-rose-900">{suggestedItems.filter(i => i.status === 'Crítico').length}</p>
                  </div>
               </div>
               <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-600 uppercase">Abaixo do Mínimo</p>
                    <p className="text-2xl font-bold text-orange-900">{suggestedItems.filter(i => i.status === 'Baixo').length}</p>
                  </div>
               </div>
               <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-600 uppercase">Tendência de Alta</p>
                    <p className="text-2xl font-bold text-slate-900">0</p>
                  </div>
               </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-bold text-slate-900">Lista de Reposição Sugerida</h3>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar insumo..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Estoque Atual</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Mínimo</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sugestão</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Prioridade</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {suggestedItems.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                              <Box size={16} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-500">{item.category}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${item.quantity < item.minQuantity ? 'text-rose-600' : 'text-slate-700'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{item.minQuantity} {item.unit}</td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-emerald-600">+{item.suggestedQty} {item.unit}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold w-fit mx-auto ${getPriorityColor(item.status)}`}>
                            {getPriorityIcon(item.status)}
                            {item.status.toUpperCase()}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-slate-400 hover:text-slate-900 transition-colors">
                            <Plus size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Histórico de Pedidos de Compra</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500">
                  <Filter size={16} />
                </button>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Buscar pedido..." 
                    className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-slate-400"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Pedido</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Destino</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Fornecedor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Valor</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {purchaseOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-900">{order.code}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {order.companyId ? (
                          <AtelierBadge companyId={order.companyId} size="xs" />
                        ) : (
                          <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md whitespace-nowrap">
                            Geral Empresa
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-700">{order.supplierName}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(order.totalValue)}</td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold w-fit mx-auto ${
                          order.status === 'recebido' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          order.status === 'comprado' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          order.status === 'cancelado' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          'bg-orange-100 text-orange-700 border-orange-200'
                        }`}>
                          {order.status.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedPurchase(order)}
                            className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                          >
                            Ver Detalhes
                          </button>
                          {order.status === 'comprado' && (
                            <button 
                              onClick={() => handleUpdateStatus(order.id, 'recebido')}
                              className="text-xs bg-emerald-600 text-white px-2 py-1 rounded-lg font-bold hover:bg-emerald-700 transition-colors"
                            >
                              Receber
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {purchaseOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">
                        Nenhum pedido de compra encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-all">
                    <Truck size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => {
                        setEditingSupplier(supplier);
                        setIsSupplierModalOpen(true);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Plus size={16} className="rotate-45" /> {/* Using Plus rotated as Edit placeholder or just generic icon */}
                    </button>
                    <button 
                      onClick={() => handleDeleteSupplier(supplier.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-slate-900">{supplier.name}</h4>
                <p className="text-xs text-slate-500 mb-4">{supplier.cnpj || 'CNPJ não informado'}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    <span>Última compra: Nunca</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <DollarSign size={14} className="text-slate-400" />
                    <span>Preço médio: R$ 0,00</span>
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-all">
                  Ver detalhes <ArrowRight size={14} />
                </button>
              </div>
            ))}
            <button className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all">
               <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                  <Plus size={24} />
               </div>
               <span className="text-sm font-bold">Novo Fornecedor</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {isSupplierModalOpen && (
        <SupplierForm 
          companyId={companyId}
          editingSupplier={editingSupplier}
          onClose={() => {
            setIsSupplierModalOpen(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {isPurchaseModalOpen && (
        <PurchaseOrderForm 
          companyId={companyId}
          suppliers={suppliers}
          insumos={insumos}
          onClose={() => setIsPurchaseModalOpen(false)}
        />
      )}

      {isInsumoModalOpen && (
        <InsumoFormModal
          companyId={companyId}
          editing={null}
          onClose={() => setIsInsumoModalOpen(false)}
          onSave={async (data) => {
            try {
              await addInsumo(data);
              setIsInsumoModalOpen(false);
            } catch (err) {
              console.error("Error adding insumo: ", err);
              orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao cadastrar insumo. Tente novamente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: companyId,
      data: { success: false, title: 'Erro' }
    });
            }
          }}
        />
      )}

      {activePurchase && (
        <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
                    <FileText size={20} />
                  </div>
                  <div>
                     <h2 className="text-lg font-bold text-slate-900 leading-none">Pedido {activePurchase.code}</h2>
                     <p className="text-xs text-slate-500 mt-1">{activePurchase.supplierName}</p>
                  </div>
               </div>
               <button onClick={() => setSelectedPurchase(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                 <X size={20} />
               </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                     <p className="text-sm font-bold text-slate-900 uppercase">{activePurchase.status}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data do Pedido</p>
                     <p className="text-sm font-bold text-slate-900">
                       {activePurchase.orderDate?.toDate ? activePurchase.orderDate.toDate().toLocaleDateString() : 'N/A'}
                     </p>
                  </div>
               </div>

               <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Itens Comprados</h3>
                  <div className="space-y-2">
                     {activePurchase.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                           <div>
                              <p className="text-sm font-bold text-slate-900">{item.name}</p>
                              <p className="text-[10px] text-slate-500">{item.quantity} {item.unit} x {formatCurrency(item.unitPrice)}</p>
                           </div>
                           <p className="text-sm font-bold text-slate-900">{formatCurrency(item.totalPrice)}</p>
                        </div>
                     ))}
                  </div>
               </div>

               {activePurchase.notes && (
                 <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Observações</h3>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 italic">
                       "{activePurchase.notes}"
                    </p>
                 </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
               <div className="flex flex-col">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total do Pedido</span>
                  <span className="text-2xl font-black text-slate-900">{formatCurrency(activePurchase.totalValue)}</span>
               </div>
               <div className="flex gap-2">
                  {activePurchase.status === 'pendente' && (
                    <button 
                      onClick={() => handleUpdateStatus(activePurchase.id, 'comprado')}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                      Marcar como Comprado
                    </button>
                  )}
                  {activePurchase.status === 'comprado' && (
                    <button 
                      onClick={() => handleUpdateStatus(activePurchase.id, 'recebido')}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                    >
                      Receber Mercadoria
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

const Box = ({ size, className }: { size: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
