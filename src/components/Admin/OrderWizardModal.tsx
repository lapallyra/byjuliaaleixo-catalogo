import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X, Calendar, Loader2, Save, User } from "lucide-react";
import { Product, Customer, Order, CompanyId } from "../../types";
import { addCustomer } from "../../services/firebaseService";
import { safeFormatISO } from "../../lib/dateUtils";

import { useAdminOrchestrator } from "../AdminOrchestratorSystem";

interface OrderWizardModalProps {
  products: Product[];
  customers: Customer[];
  companyId: CompanyId;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => Promise<any>;
  initialCustomerId?: string;
}

export const OrderWizardModal: React.FC<OrderWizardModalProps> = ({
  customers,
  companyId,
  onClose,
  onSave,
  initialCustomerId,
}) => {
  const orchestrator = useAdminOrchestrator();
  // --- Form State ---
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialCustomerId || null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [orderDate, setOrderDate] = useState(safeFormatISO(new Date(), "yyyy-MM-dd"));
  const [status, setStatus] = useState<Order["status"]>("pending");
  const [origin, setOrigin] = useState("Vitrine");
  const [customOrigins, setCustomOrigins] = useState<string[]>([]);
  const [isAddingOrigin, setIsAddingOrigin] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");

  const [productionDate, setProductionDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [description, setDescription] = useState("");

  const [isSaving, setIsSaving] = useState(false);

  // --- Quick Customer Add State ---
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", contact: "" });

  const originsList = useMemo(() => {
    return [
      { id: "Vitrine", label: "🟠 Vitrine" },
      { id: "WhatsApp", label: "🟢 WhatsApp" },
      { id: "Instagram", label: "🔵 Instagram" },
      { id: "Facebook", label: "🟣 Facebook" },
      { id: "Shopee", label: "🟡 Shopee" },
      { id: "Mercado Livre", label: "⚫ Mercado Livre" },
      { id: "Loja Física", label: "🟤 Loja Física" },
      { id: "Manual", label: "⚪ Manual" },
      ...customOrigins.map(o => ({ id: o, label: `⚪ ${o}` }))
    ];
  }, [customOrigins]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 5); // Show first 5 if empty
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cpfCnpj && c.cpfCnpj.includes(q)) ||
        (c.contact && c.contact.includes(q))
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;
    setIsRegisteringCustomer(true);
    try {
      const customerId = await addCustomer({
        ...newCustomer,
        companyId,
        status: "Ativo",
        totalSpent: 0,
        ordersCount: 0,
      });
      if (customerId) {
        setSelectedCustomerId(customerId);
        setCustomerSearch(newCustomer.name);
        setIsNewCustomerModalOpen(false);
        setNewCustomer({ name: "", contact: "" });
      }
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao cadastrar cliente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    } finally {
      setIsRegisteringCustomer(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Por favor, selecione ou cadastre um cliente.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Aviso' }
    });
      return;
    }

    setIsSaving(true);
    try {
      const orderData: Partial<Order> = {
        companyId,
        customerName: selectedCustomer?.name || "",
        customerCpfCnpj: selectedCustomer?.cpfCnpj || "",
        contact: selectedCustomer?.contact || "",
        status,
        marketplace: origin,
        deliveryDate: deliveryDate,
        observations: description + (productionDate ? `\n[Previsão Produção]: ${productionDate}` : ""),
        items: [], // Empty for now, as requested in simplified flow
        total: 0,
        createdAt: new Date(orderDate).toISOString(),
        isWholesale: false,
        isEmergency: false,
      };

      await onSave(orderData);
    } catch (err) {
      console.error(err);
      orchestrator.dispatchEvent({
      type: 'FEEDBACK',
      message: "Erro ao salvar o pedido.",
      priority: 'HIGH',
      customerName: '',
      productName: '',
      companyId: ((typeof window !== 'undefined' && (window as any).companyId) || 'company_1') as any,
      data: { success: false, title: 'Erro' }
    });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-[#FAF9F6] w-full max-w-4xl max-h-[95vh] rounded-3xl border border-[#E5E5EA] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white border-b border-[#E5E5EA] p-6 shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1C1E] tracking-tight">
              Novo Pedido
            </h2>
            <p className="text-sm text-[#8E8E93] mt-1">
              Cadastre um novo pedido para iniciar o fluxo de produção.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form id="new-order-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Section: Dados do Pedido */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-6">
              Dados do Pedido
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Cliente <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                    <input
                      type="text"
                      placeholder="Digite para buscar..."
                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setSelectedCustomerId(null);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      required={!selectedCustomerId}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewCustomerModalOpen(true)}
                    className="p-3 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] rounded-xl text-[#1C1C1E] transition-colors"
                    title="Novo Cliente"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {/* Dropdown Smart Search */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-white border border-[#E5E5EA] rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-sm text-[#8E8E93] text-center">
                        Nenhum cliente encontrado.
                      </div>
                    ) : (
                      filteredCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setSelectedCustomerId(c.id!);
                            setCustomerSearch(c.name);
                            setIsDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-[#F5F5F7] cursor-pointer flex justify-between items-center border-b border-[#F2F2F7] last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#E5E5EA] flex items-center justify-center shrink-0">
                              <User size={14} className="text-[#8E8E93]" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1C1C1E]">{c.name}</p>
                              {c.contact && <p className="text-xs text-[#8E8E93]">{c.contact}</p>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
                  Se não existir, clique no +
                </p>
              </div>

              {/* Data do Pedido */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Data do Pedido
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all"
                  />
                </div>
                <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
                  Altere apenas se o pedido for retroativo.
                </p>
              </div>

              {/* Status Inicial */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Status Inicial <span className="text-rose-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order["status"])}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]"
                >
                  <option value="pending">Pendente</option>
                  <option value="waiting_payment">Aguardando Pagamento</option>
                  <option value="paid">Pago</option>
                  <option value="production">Em Produção</option>
                </select>
              </div>

              {/* Origem do Pedido */}
              <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Origem do Pedido <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm font-medium outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]"
                  >
                    {originsList.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  
                  {/* Custom Origin Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddingOrigin(true)}
                    className="p-3 bg-[#F5F5F7] hover:bg-[#E5E5EA] border border-[#E5E5EA] rounded-xl text-[#1C1C1E] transition-colors"
                    title="Adicionar Origem"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {/* Inline form for new origin */}
                {isAddingOrigin && (
                  <div className="flex items-center gap-2 mt-2 animate-in fade-in slide-in-from-top-1">
                    <input 
                      type="text" 
                      placeholder="Nova Origem..." 
                      className="flex-1 bg-white border border-[#E5E5EA] rounded-lg px-3 py-1.5 text-sm outline-none"
                      value={newOrigin}
                      onChange={e => setNewOrigin(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newOrigin.trim()) {
                          setCustomOrigins([...customOrigins, newOrigin.trim()]);
                          setOrigin(newOrigin.trim());
                        }
                        setNewOrigin("");
                        setIsAddingOrigin(false);
                      }}
                      className="px-3 py-1.5 bg-[#1C1C1E] text-white rounded-lg text-xs font-bold"
                    >
                      OK
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingOrigin(false)}
                      className="p-1.5 text-[#8E8E93] hover:bg-[#F2F2F7] rounded-lg"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section: Prazos */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
             <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-6">
              Prazos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Previsão para Produção
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]"
                />
                <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
                  Opcional. Aparece no calendário de produção.
                </p>
              </div>

               <div className="space-y-1">
                <label className="text-sm font-semibold text-[#1C1C1E] block">
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E]"
                />
                <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
                  Opcional. Auxilia no acompanhamento dos prazos.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Descrição */}
          <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 shadow-sm">
            <h3 className="text-xs font-bold text-[#8E8E93] uppercase tracking-wider mb-6">
              Descrição do Pedido
            </h3>
            
            <div className="space-y-1">
               <textarea
                  placeholder="Ex.: Tema, cores, nomes, datas, observações ou qualquer detalhe importante."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-[#1C1C1E] transition-all text-[#1C1C1E] min-h-[120px] resize-y"
                />
                <p className="text-[11px] text-[#8E8E93] mt-1 pl-1">
                  Escreva uma descrição curta para identificar rapidamente este pedido.
                </p>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-white border-t border-[#E5E5EA] p-6 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-[#F5F5F7] text-[#1C1C1E] rounded-xl font-bold text-sm transition-all hover:bg-[#E5E5EA]"
          >
            Cancelar
          </button>
          <button
            form="new-order-form"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-[#1C1C1E] text-white rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Pedido
          </button>
        </div>

      </div>

      {/* Quick Add Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
           <form onSubmit={handleCreateCustomer} className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-[#1C1C1E]">Novo Cliente</h3>
                <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="text-[#8E8E93] hover:text-[#1C1C1E]">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1C1C1E] block">Nome *</label>
                    <input 
                      required
                      type="text"
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-[#1C1C1E]"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-[#1C1C1E] block">Telefone (Opcional)</label>
                    <input 
                      type="text"
                      value={newCustomer.contact}
                      onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})}
                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-[#1C1C1E]"
                    />
                 </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-[#8E8E93] hover:text-[#1C1C1E]">
                   Cancelar
                 </button>
                 <button type="submit" disabled={isRegisteringCustomer} className="px-6 py-2 bg-[#1C1C1E] text-white rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2">
                   {isRegisteringCustomer && <Loader2 size={14} className="animate-spin" />}
                   Salvar
                 </button>
              </div>
           </form>
        </div>
      )}

    </div>
  );
};
