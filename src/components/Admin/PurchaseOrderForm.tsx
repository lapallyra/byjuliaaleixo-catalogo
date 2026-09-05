import React, { useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Search, ShoppingBag, ArrowLeft } from "lucide-react";
import { CompanyId, Supplier, Componente, PurchaseItem } from "../../types";
import { db } from "../../lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { formatCurrency } from "../../lib/currencyUtils";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface PurchaseOrderFormProps {
  companyId?: CompanyId;
  suppliers?: Supplier[];
  insumos?: Componente[];
  onClose: () => void;
  onSave?: (data: any) => Promise<any>;
  isPage?: boolean;
}

export const PurchaseOrderForm: React.FC<PurchaseOrderFormProps> = ({ 
  companyId, 
  suppliers = [], 
  insumos = [],
  onClose,
  onSave,
  isPage = false,
}) => {
  const orchestrator = useAdminOrchestrator();
  const [selectedAtelier, setSelectedAtelier] = useState<string>(companyId || "");
  const [internalSuppliers, setInternalSuppliers] = useState<Supplier[]>(suppliers);
  const [internalInsumos, setInternalInsumos] = useState<Componente[]>(insumos);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!suppliers || suppliers.length === 0) {
      const qSuppliers = query(collection(db, "suppliers"));
      getDocs(qSuppliers).then(snap => {
        setInternalSuppliers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Supplier)));
      }).catch(console.error);
    } else {
      setInternalSuppliers(suppliers);
    }
  }, [suppliers]);

  useEffect(() => {
    if (!insumos || insumos.length === 0) {
      const qInsumos = query(collection(db, "componentes"));
      getDocs(qInsumos).then(snap => {
        setInternalInsumos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Componente)));
      }).catch(console.error);
    } else {
      setInternalInsumos(insumos);
    }
  }, [insumos]);

  const addItem = (insumo: Componente) => {
    const existing = items.find(i => i.insumoId === insumo.id);
    if (existing) {
      setItems(items.map(i => i.insumoId === insumo.id ? { 
        ...i, 
        quantity: i.quantity + 1,
        totalPrice: (i.quantity + 1) * i.unitPrice
      } : i));
    } else {
      setItems([...items, {
        insumoId: insumo.id,
        name: insumo.name,
        quantity: 1,
        unitPrice: insumo.unitCost || 0,
        totalPrice: insumo.unitCost || 0,
        unit: insumo.unit
      }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.insumoId !== id));
  };

  const updateItemQty = (id: string, qty: number) => {
    setItems(items.map(i => i.insumoId === id ? { 
      ...i, 
      quantity: qty,
      totalPrice: qty * i.unitPrice
    } : i));
  };

  const updateItemPrice = (id: string, price: number) => {
    setItems(items.map(i => i.insumoId === id ? { 
      ...i, 
      unitPrice: price,
      totalPrice: i.quantity * price
    } : i));
  };

  const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Selecione um fornecedor!",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Aviso' }
    });
      return;
    }
    if (items.length === 0) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Adicione pelo menos um item!",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: true, title: 'Sucesso' }
    });
      return;
    }

    setLoading(true);
    try {
      const supplier = internalSuppliers.find(s => s.id === selectedSupplierId);
      
      const purchaseData: any = {
        code: `COMP-${Math.floor(1000 + Math.random() * 9000)}`,
        ...(selectedAtelier ? { companyId: selectedAtelier } : {}),
        supplierId: selectedSupplierId,
        supplierName: supplier?.name || "Desconhecido",
        items,
        totalValue,
        status: 'pendente',
        notes,
        orderDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "purchase_orders"), purchaseData);
      onClose();
    } catch (error) {
      console.error("Error saving purchase order:", error);
      orchestrator.dispatchEvent({
        type: 'FEEDBACK',
        message: "Erro ao salvar pedido de compra.",
        priority: 'HIGH',
        customerName: '',
        productName: '',
        companyId: (selectedAtelier || undefined) as any,
        data: { success: false, title: 'Erro' }
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredInsumos = internalInsumos.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = items.reduce((acc, i) => acc + i.totalPrice, 0);

  if (isPage) {
    return (
      <div className="w-full max-w-[1500px] mx-auto pb-12 animate-in fade-in duration-200 px-2 sm:px-3">
        <div className="bg-white rounded-2xl w-full shadow-sm overflow-hidden flex flex-col border border-slate-200">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all border border-slate-200 flex items-center gap-1.5 text-xs font-bold"
                title="Voltar para Compras"
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  <span>Compras</span>
                  <span>/</span>
                  <span>Novo Pedido de Compra</span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <ShoppingBag size={22} className="text-indigo-600" />
                  Novo Pedido de Compra
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Gerencie a reposição de insumos do estoque</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 flex flex-col md:flex-row min-h-[500px]">
            {/* Items Selection */}
            <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/50 p-4 md:p-6">
              <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar insumos para repor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 max-h-[500px] pr-1">
                {filteredInsumos.map((insumo) => (
                  <div key={insumo.id} className="p-3 bg-white border border-slate-200/80 rounded-xl flex items-center justify-between hover:border-indigo-200 transition-all shadow-2xs">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{insumo.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">Estoque atual: <strong>{insumo.quantity} {insumo.unit}</strong></span>
                        <span className="text-[10px] text-slate-500">• Custo ref: <strong>{formatCurrency(insumo.unitCost || 0)}</strong></span>
                      </div>
                    </div>
                    <button
                      onClick={() => addItem(insumo)}
                      className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-all"
                      title="Adicionar ao pedido"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="w-full md:w-[420px] flex flex-col bg-white p-4 md:p-6">
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Ateliê de Destino <span className="text-slate-400 font-normal lowercase">(opcional - padrão: compartilhado)</span>
                  </label>
                  <select
                    value={selectedAtelier}
                    onChange={(e) => setSelectedAtelier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">Compra Geral / Compartilhada (Empresa)</option>
                    <option value="pallyra">La Pallyra</option>
                    <option value="guennita">Guennita</option>
                    <option value="mimada">Mimada</option>
                    <option value="tuttymimo">Tuttymimo</option>
                    <option value="madrinha">Madrinha</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Fornecedor *</label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                  >
                    <option value="">Selecione um fornecedor...</option>
                    {internalSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Itens Selecionados ({items.length})</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQty = Math.max(1, Number(e.target.value));
                                setItems(items.map(i => i.insumoId === item.insumoId ? { ...i, quantity: newQty, totalPrice: newQty * i.unitPrice } : i));
                              }}
                              className="w-16 p-1 bg-white border border-slate-200 rounded-lg text-center text-xs font-bold"
                            />
                            <span className="text-[10px] text-slate-400">x {formatCurrency(item.unitPrice)}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{formatCurrency(item.totalPrice)}</p>
                          <button
                            onClick={() => setItems(items.filter(i => i.insumoId !== item.insumoId))}
                            className="text-rose-500 hover:text-rose-700 p-1 text-[10px] font-bold"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Observações</label>
                  <textarea
                    rows={2}
                    placeholder="Instruções de entrega, prazos combinados..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase">Total Estimado</span>
                  <span className="text-lg font-black text-slate-900">{formatCurrency(totalAmount)}</span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={loading || items.length === 0 || !selectedSupplierId}
                    onClick={handleSubmit}
                    className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
                  >
                    <Save size={16} /> Confirmar Pedido
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-900">
               <ShoppingBag size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-slate-900 leading-none">Novo Pedido de Compra</h2>
                <p className="text-xs text-slate-500 mt-1">Gerencie a reposição de insumos do estoque</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Items Selection */}
          <div className="flex-1 flex flex-col border-r border-slate-100 bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Buscar insumo no estoque..." 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:border-slate-400 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredInsumos.map(insumo => (
                <div key={insumo.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-slate-400 transition-all group">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                        <BoxIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{insumo.name}</p>
                        <p className="text-[10px] text-slate-500">{insumo.category} • {insumo.quantity} em estoque</p>
                      </div>
                   </div>
                   <button 
                     onClick={() => addItem(insumo)}
                     className="p-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                   >
                     <Plus size={16} />
                   </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart & Order Details */}
          <div className="w-full md:w-[400px] flex flex-col bg-white">
            <form onSubmit={handleSubmit} className="flex flex-col h-full">
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">
                    Ateliê de Destino <span className="text-slate-400 font-normal lowercase">(opcional - padrão: compartilhado)</span>
                  </label>
                  <select 
                    value={selectedAtelier}
                    onChange={e => setSelectedAtelier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm outline-none focus:border-slate-400 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Compra Geral / Compartilhada (Empresa)</option>
                    <option value="pallyra">La Pallyra</option>
                    <option value="guennita">Guennita</option>
                    <option value="mimada">Mimada</option>
                    <option value="tuttymimo">Tuttymimo</option>
                    <option value="madrinha">Madrinha</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Fornecedor *</label>
                  <select 
                    required
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-sm outline-none focus:border-slate-400 transition-all appearance-none"
                  >
                    <option value="">Selecione um fornecedor</option>
                    {internalSuppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itens do Pedido ({items.length})</label>
                  </div>
                  
                  {items.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                        <ShoppingBag size={24} />
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Nenhum item adicionado</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {items.map(item => (
                        <div key={item.insumoId} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group">
                          <button 
                            type="button"
                            onClick={() => removeItem(item.insumoId)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                          >
                            <X size={12} />
                          </button>
                          <p className="text-xs font-bold text-slate-900 mb-2">{item.name}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Qtd ({item.unit})</label>
                              <input 
                                type="number" 
                                value={item.quantity}
                                onChange={e => updateItemQty(item.insumoId, Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-slate-400"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-[10px] text-slate-400 uppercase font-bold mb-1">Preço Un.</label>
                              <input 
                                type="number" 
                                step="0.01"
                                value={item.unitPrice}
                                onChange={e => updateItemPrice(item.insumoId, Number(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-slate-400"
                              />
                            </div>
                          </div>
                          <div className="mt-2 text-right">
                            <p className="text-[10px] font-bold text-slate-900">Subtotal: {formatCurrency(item.totalPrice)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-wider">Observações</label>
                  <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-slate-400 min-h-[100px]"
                    placeholder="Adicione informações adicionais..."
                  />
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/30 space-y-4 shrink-0">
                <div className="flex items-center justify-between px-2">
                  <span className="text-sm font-bold text-slate-500">Valor Total</span>
                  <span className="text-xl font-black text-slate-900">{formatCurrency(totalValue)}</span>
                </div>
                <button 
                  disabled={loading}
                  type="submit" 
                  className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-200"
                >
                  {loading ? "Processando..." : <><Save size={18} /> Confirmar Pedido</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const BoxIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);
