import React, { useState, useEffect, useMemo, useRef } from "react";
import { Search, Plus, X, Calendar, Loader2, Save, User, Minus, Trash2, ShoppingCart, Truck } from "lucide-react";
import { Product, Customer, Order, CompanyId, CartItem, OrderOperationType, OrderPayment } from "../../types";
import { addCustomer } from "../../services/firebaseService";
import { safeFormatISO, addBusinessDays } from "../../lib/dateUtils";

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
  products,
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
  const [operationType, setOperationType] = useState<OrderOperationType>("sale");
  const [investmentPurpose, setInvestmentPurpose] = useState("");
  const [status, setStatus] = useState<Order["status"]>("quote");
  const [origin, setOrigin] = useState("Vitrine");
  const [customOrigins, setCustomOrigins] = useState<string[]>([]);
  const [isAddingOrigin, setIsAddingOrigin] = useState(false);
  const [newOrigin, setNewOrigin] = useState("");

  const [productionDate, setProductionDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => addBusinessDays(new Date(), 10));

  const [description, setDescription] = useState("");
  const [responsible, setResponsible] = useState("");
  const [priority, setPriority] = useState<Order["priority"]>("normal");

  const [customizationName, setCustomizationName] = useState("");
  const [customizationTheme, setCustomizationTheme] = useState("");
  const [customizationColors, setCustomizationColors] = useState("");
  const [customizationArtText, setCustomizationArtText] = useState("");
  const [customizationEventDate, setCustomizationEventDate] = useState("");
  const [customizationNotes, setCustomizationNotes] = useState("");

  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingCost, setShippingCost] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [payments, setPayments] = useState<OrderPayment[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState("Pix");
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState<number | "">("");
  const [currentBarterDescription, setCurrentBarterDescription] = useState("");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);

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

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 5);
    const q = productSearch.toLowerCase();
    return products.filter((p) => p.product_name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))).slice(0, 10);
  }, [products, productSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddProduct = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1, productId: product.id }];
    });
    setProductSearch("");
    setIsProductDropdownOpen(false);
  };

  const handleUpdateItemQuantity = (id: string, delta: number) => {
    setItems(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQ };
      }
      return i;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

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

  const subtotalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.quantity * (item.current_price || item.retail_price || 0)), 0);
  }, [items]);

  const finalOrderTotal = useMemo(() => {
    return Math.max(0, subtotalItems - discount + shippingCost);
  }, [subtotalItems, discount, shippingCost]);

  const totalPaidSum = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const barterPaidSum = useMemo(() => {
    return payments.filter(p => p.method === 'barter' || p.method?.toLowerCase() === 'permuta').reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [payments]);

  const cashPaidSum = useMemo(() => {
    return Math.max(0, totalPaidSum - barterPaidSum);
  }, [totalPaidSum, barterPaidSum]);

  const remainingOrderBalance = useMemo(() => {
    return Math.max(0, finalOrderTotal - totalPaidSum);
  }, [finalOrderTotal, totalPaidSum]);

  const handleAddPayment = () => {
    setPaymentError(null);
    const amountNum = typeof currentPaymentAmount === 'number' ? currentPaymentAmount : parseFloat(currentPaymentAmount || "0");
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      setPaymentError("Informe um valor de pagamento válido maior que zero.");
      return;
    }
    if (currentPaymentMethod === 'barter' && !currentBarterDescription.trim()) {
      setPaymentError("A descrição do que foi recebido é obrigatória para pagamentos em Permuta.");
      return;
    }

    const newPay: OrderPayment = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      method: currentPaymentMethod,
      description: currentPaymentMethod === 'barter' ? currentBarterDescription.trim() : undefined,
      notes: ""
    };

    setPayments(prev => [...prev, newPay]);
    setCurrentPaymentAmount("");
    setCurrentBarterDescription("");
  };

  const handleRemovePayment = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
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
      const subtotal = items.reduce((acc, item) => acc + (item.quantity * (item.current_price || item.retail_price || 0)), 0);
      const total = Math.max(0, subtotal - discount + shippingCost);

      let finalPayments = [...payments];
      const pendingAmount = typeof currentPaymentAmount === 'number' ? currentPaymentAmount : parseFloat(currentPaymentAmount || "0");
      if (pendingAmount && pendingAmount > 0) {
        if (currentPaymentMethod === 'barter' && !currentBarterDescription.trim()) {
          setPaymentError("A descrição do que foi recebido é obrigatória para o pagamento em Permuta.");
          setIsSaving(false);
          return;
        }
        finalPayments.push({
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          amount: pendingAmount,
          method: currentPaymentMethod,
          description: currentPaymentMethod === 'barter' ? currentBarterDescription.trim() : undefined,
          notes: ""
        });
      }

      const calculatedTotalPaid = finalPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
      const isInvestment = operationType === 'investment';
      const primaryMethod = isInvestment && finalPayments.length === 0
        ? 'Investimento'
        : (finalPayments.length === 1 
            ? (finalPayments[0].method === 'barter' ? 'Permuta' : finalPayments[0].method)
            : (finalPayments.length > 1 ? 'Múltiplos' : 'Não informado'));

      const calculatedPaymentStatus = isInvestment && finalPayments.length === 0
        ? 'paid'
        : (calculatedTotalPaid >= total - 0.01 ? 'paid' : (calculatedTotalPaid > 0 ? 'partial' : 'pending'));

      const orderData: Partial<Order> = {
        companyId,
        operationType,
        investmentPurpose: isInvestment ? (investmentPurpose.trim() || "Divulgação / Parceria") : undefined,
        customerName: selectedCustomer?.name || "",
        customerCpfCnpj: selectedCustomer?.cpfCnpj || "",
        contact: selectedCustomer?.contact || "",
        status,
        marketplace: origin,
        deliveryDate: deliveryDate,
        observations: description + (productionDate ? `\n[Previsão Produção]: ${productionDate}` : ""),
        items: items,
        shippingCost: shippingCost,
        discount: discount,
        payments: finalPayments,
        hasSignal: calculatedTotalPaid > 0,
        signalValue: calculatedTotalPaid,
        paymentMethod: primaryMethod,
        paymentStatus: calculatedPaymentStatus,
        total: total,
        createdAt: new Date(orderDate).toISOString(),
        isWholesale: false,
        isEmergency: false,
        responsible: responsible || "",
        priority: priority || "normal",
        customizationName: customizationName || "",
        customizationTheme: customizationTheme || "",
        customizationColors: customizationColors || "",
        customizationArtText: customizationArtText || "",
        customizationEventDate: customizationEventDate || "",
        customizationNotes: customizationNotes || "",
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm">
      <div className="bg-[#FDF8F5]/90 backdrop-blur-xl w-full max-w-4xl max-h-[95vh] rounded-[28px] border border-white shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-white/50 border-b border-white p-6 shrink-0 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight">
              Novo Pedido
            </h2>
            <p className="text-xs font-medium text-gray-400 mt-1">
              Cadastre um novo pedido para iniciar o fluxo de produção.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-pink-50 text-gray-400 hover:text-pink-600 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form id="new-order-form" onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Section: Dados do Pedido */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2 mb-6">
              Dados do Pedido
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cliente */}
              <div className="space-y-1 relative" ref={dropdownRef}>
                <label className="text-[11px] font-bold text-gray-400 block">
                  Cliente <span className="text-pink-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Digite para buscar..."
                      className="w-full bg-white/60 border border-pink-100/85 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
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
                    className="p-3 bg-white/80 border border-white/90 hover:bg-pink-50 rounded-xl text-gray-700 transition-all"
                    title="Novo Cliente"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                {/* Dropdown Smart Search */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-12 mt-1 bg-white/95 backdrop-blur-md border border-pink-100/50 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <div className="p-4 text-sm text-gray-400 text-center">
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
                          className="px-4 py-3 hover:bg-pink-50/50 cursor-pointer flex justify-between items-center border-b border-pink-50/30 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-pink-100/50 flex items-center justify-center shrink-0">
                              <User size={14} className="text-pink-600" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{c.name}</p>
                              {c.contact && <p className="text-xs text-gray-400">{c.contact}</p>}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Se não existir, clique no +
                </p>
              </div>

              {/* Data do Pedido */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Data do Pedido
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-white/60 border border-pink-100/85 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                  />
                </div>
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Altere apenas se o pedido for retroativo.
                </p>
              </div>

              {/* Status Inicial */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Status Inicial <span className="text-pink-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Order["status"])}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                >
                  <option value="quote">Orçamento</option>
                  <option value="pending">Pendente / Novo</option>
                  <option value="waiting_payment">Aguardando Pagamento</option>
                  <option value="paid">Pago</option>
                  <option value="production">Em Produção</option>
                </select>
              </div>

              {/* Origem do Pedido */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Origem do Pedido <span className="text-pink-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                  >
                    {originsList.map(o => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  
                  {/* Custom Origin Button */}
                  <button
                    type="button"
                    onClick={() => setIsAddingOrigin(true)}
                    className="p-3 bg-white/80 border border-white/90 hover:bg-pink-50 rounded-xl text-gray-700 transition-all"
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
                      className="flex-1 bg-white/60 border border-pink-100/80 rounded-xl px-3 py-1.5 text-sm outline-none"
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
                      className="px-4 py-2 bg-gradient-to-b from-pink-400 to-pink-500 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      OK
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingOrigin(false)}
                      className="p-2 text-gray-400 hover:bg-pink-50 rounded-xl"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Tipo de Operação */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Tipo de operação <span className="text-pink-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setOperationType("sale")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      operationType === "sale"
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white/60 border-pink-100/85 text-gray-700 hover:bg-white"
                    }`}
                  >
                    <span>Venda</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationType("investment")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      operationType === "investment"
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white/60 border-pink-100/85 text-gray-700 hover:bg-white"
                    }`}
                  >
                    <span>🎁 Investimento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOperationType("barter")}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      operationType === "barter"
                        ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                        : "bg-white/60 border-pink-100/85 text-gray-700 hover:bg-white"
                    }`}
                  >
                    <span>Permuta</span>
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 pl-1">
                  {operationType === "sale" && "Operação comercial normal de venda."}
                  {operationType === "investment" && "Investimento em divulgação, presentes estratégicos, parcerias ou ações promocionais (sem receita em caixa)."}
                  {operationType === "barter" && "Troca de produtos ou serviços por outro produto ou serviço."}
                </p>
              </div>

              {/* Bloco Dedicado de Investimento */}
              {operationType === "investment" && (
                <div className="md:col-span-2 bg-purple-50/70 border border-purple-200/90 rounded-2xl p-4 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 flex items-center gap-1.5">
                      🎁 Operação de Investimento
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2.5 py-0.5 rounded-full border border-purple-200">
                      Não gera receita financeira
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-800 leading-relaxed">
                    Produtos ou materiais utilizados estrategicamente para divulgação, presentes para influenciadores, parcerias ou ações promocionais. O estoque segue a baixa normal, registrando o valor comercial como referência.
                  </p>
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-bold text-purple-950 block">
                      Finalidade do investimento <span className="text-pink-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={investmentPurpose}
                      onChange={(e) => setInvestmentPurpose(e.target.value)}
                      placeholder="Ex: Divulgação com influenciadora, Presente estratégico, Campanha promocional..."
                      className="w-full bg-white border border-purple-300 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-purple-500 shadow-xs"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-purple-700 font-medium">Exemplos:</span>
                      {[
                        "Divulgação com influenciadora",
                        "Presente estratégico",
                        "Campanha promocional",
                        "Parceria comercial",
                        "Material de demonstração"
                      ].map((example) => (
                        <button
                          key={example}
                          type="button"
                          onClick={() => setInvestmentPurpose(example)}
                          className="text-[10px] bg-white hover:bg-purple-100 text-purple-800 font-medium px-2 py-0.5 rounded-md border border-purple-200 transition-colors"
                        >
                          + {example}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Responsável */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Responsável
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Nome do responsável..."
                    className="w-full bg-white/60 border border-pink-100/85 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                    value={responsible}
                    onChange={(e) => setResponsible(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Personalização */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2 mb-6">
              Personalização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome para Personalização */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Nome para Personalização
                </label>
                <input
                  type="text"
                  placeholder="Nome do aniversariante, casal, etc."
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium"
                  value={customizationName}
                  onChange={(e) => setCustomizationName(e.target.value)}
                />
              </div>

              {/* Tema */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Tema
                </label>
                <input
                  type="text"
                  placeholder="Tema da festa ou evento..."
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium"
                  value={customizationTheme}
                  onChange={(e) => setCustomizationTheme(e.target.value)}
                />
              </div>

              {/* Cores */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Cores
                </label>
                <input
                  type="text"
                  placeholder="Ex: Rosa e Dourado, Tons pastéis..."
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium"
                  value={customizationColors}
                  onChange={(e) => setCustomizationColors(e.target.value)}
                />
              </div>

              {/* Texto da Arte */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Texto da Arte
                </label>
                <input
                  type="text"
                  placeholder="Frase ou texto que irá na arte..."
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium"
                  value={customizationArtText}
                  onChange={(e) => setCustomizationArtText(e.target.value)}
                />
              </div>

              {/* Data do Evento */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Data do Evento
                </label>
                <input
                  type="date"
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium"
                  value={customizationEventDate}
                  onChange={(e) => setCustomizationEventDate(e.target.value)}
                />
              </div>

              {/* Observações da Personalização */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Observações da Personalização
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais sobre a personalização (fita, embalagem, etc.)"
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 font-medium resize-none"
                  value={customizationNotes}
                  onChange={(e) => setCustomizationNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section: Itens e Frete */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2 mb-6">
              Itens e Frete
            </h3>
            
            <div className="space-y-6">
              {/* Product Search */}
              <div className="space-y-1 relative" ref={productDropdownRef}>
                <label className="text-[11px] font-bold text-gray-400 block">
                  Buscar Produto
                </label>
                <div className="relative">
                  <ShoppingCart className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Digite o nome ou código do produto..."
                    className="w-full bg-white/60 border border-pink-100/85 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                  />
                </div>
                {/* Dropdown Product Search */}
                {isProductDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border border-pink-100/50 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-sm text-gray-400 text-center">
                        Nenhum produto encontrado.
                      </div>
                    ) : (
                      filteredProducts.map(p => (
                        <div
                          key={p.id}
                          onClick={() => handleAddProduct(p)}
                          className="px-4 py-3 hover:bg-pink-50/50 cursor-pointer flex justify-between items-center border-b border-pink-50/30 last:border-0"
                        >
                          <div className="flex items-center gap-3">
                            {p.image ? (
                              <img src={p.image} alt={p.product_name} className="w-8 h-8 rounded object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                                <ShoppingCart size={14} className="text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-700">{p.product_name}</p>
                              <p className="text-[10px] text-gray-400">{p.code}</p>
                            </div>
                          </div>
                          <div className="text-sm font-bold text-gray-700">
                            R$ {(p.current_price || p.retail_price || 0).toFixed(2).replace(".", ",")}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-white/60 border border-pink-50 rounded-xl">
                      <div className="flex items-center gap-3 flex-1">
                        {item.image ? (
                           <img src={item.image} alt={item.product_name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                           <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                             <ShoppingCart size={16} className="text-gray-400" />
                           </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                          <p className="text-xs text-gray-500">R$ {(item.current_price || item.retail_price || 0).toFixed(2).replace(".", ",")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                          <button type="button" onClick={() => handleUpdateItemQuantity(item.id, -1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Minus size={14} /></button>
                          <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                          <button type="button" onClick={() => handleUpdateItemQuantity(item.id, 1)} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><Plus size={14} /></button>
                        </div>
                        <div className="text-sm font-bold text-gray-800 min-w-[70px] text-right">
                          R$ {((item.quantity * (item.current_price || item.retail_price || 0))).toFixed(2).replace(".", ",")}
                        </div>
                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Frete, Desconto, Sinal e Forma de Pagamento */}
              <div className="pt-6 border-t border-pink-50/50 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Valor do Frete */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 block">
                      Valor do Frete
                    </label>
                    <div className="relative">
                      <Truck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={shippingCost || ""}
                        onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white/60 border border-pink-100/85 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Valor do Desconto */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 block">
                      Desconto (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={discount || ""}
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Seção de Registro de Pagamentos & Quitação */}
                  <div className="col-span-1 md:col-span-2 space-y-3 pt-3 border-t border-pink-100/70">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Registrar Pagamentos / Quitação
                      </h4>
                      <span className="text-[11px] text-gray-400">
                        Permite pagamentos múltiplos (ex: PIX + Permuta)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/60 border border-pink-100/80 rounded-2xl p-4">
                      {/* Forma de Pagamento */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 block">
                          Forma de Pagamento
                        </label>
                        <select
                          value={currentPaymentMethod}
                          onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                          className="w-full bg-white border border-pink-100/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-pink-300 transition-all text-gray-700"
                        >
                          <option value="Pix">Pix</option>
                          <option value="Dinheiro">Dinheiro</option>
                          <option value="Cartão de Débito">Cartão de Débito</option>
                          <option value="Cartão de Crédito">Cartão de Crédito</option>
                          <option value="Boleto">Boleto</option>
                          <option value="Transferência">Transferência</option>
                          <option value="barter">Permuta</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>

                      {/* Valor ou Valor da Permuta */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[11px] font-bold text-gray-500 block">
                          {currentPaymentMethod === 'barter' ? "Valor da Permuta (R$)" : "Valor Pago (R$)"}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={currentPaymentAmount}
                          onChange={(e) => {
                            setCurrentPaymentAmount(e.target.value === "" ? "" : parseFloat(e.target.value) || 0);
                            setPaymentError(null);
                          }}
                          className="w-full bg-white border border-pink-100/90 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none focus:border-pink-300 transition-all text-gray-700"
                          placeholder="0,00"
                        />
                      </div>

                      {/* Botão Adicionar */}
                      <div className="sm:col-span-3 flex items-end">
                        <button
                          type="button"
                          onClick={handleAddPayment}
                          className="w-full py-2.5 px-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                        >
                          <Plus size={14} /> Adicionar
                        </button>
                      </div>

                      {/* Campo condicional para Permuta */}
                      {currentPaymentMethod === 'barter' && (
                        <div className="sm:col-span-12 space-y-1 bg-amber-50/80 border border-amber-200/90 rounded-xl p-3">
                          <label className="text-[11px] font-bold text-amber-900 block">
                            Descrição do que foi recebido <span className="text-pink-600">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Divulgação no Instagram, Ensaio fotográfico, Produto em troca..."
                            value={currentBarterDescription}
                            onChange={(e) => {
                              setCurrentBarterDescription(e.target.value);
                              setPaymentError(null);
                            }}
                            className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-medium text-gray-800 outline-none focus:border-amber-500"
                            required
                          />
                          <p className="text-[10px] text-amber-700/90">
                            Obrigatório: especifique o serviço ou produto recebido em contrapartida.
                          </p>
                        </div>
                      )}

                      {paymentError && (
                        <div className="sm:col-span-12 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
                          {paymentError}
                        </div>
                      )}
                    </div>

                    {/* Lista de Pagamentos Registrados */}
                    {payments.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Pagamentos Adicionados ({payments.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {payments.map((p) => {
                            const isBarter = p.method === 'barter' || p.method?.toLowerCase() === 'permuta';
                            return (
                              <div
                                key={p.id}
                                className={`flex items-start justify-between p-2.5 rounded-xl border ${
                                  isBarter
                                    ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                                    : 'bg-white border-pink-100 text-gray-700'
                                } shadow-sm`}
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                        isBarter
                                          ? 'bg-amber-200 text-amber-900 border border-amber-300'
                                          : 'bg-pink-100 text-pink-700'
                                      }`}
                                    >
                                      {isBarter ? 'Permuta' : p.method}
                                    </span>
                                    <span className="font-bold text-xs">
                                      R$ {p.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                  </div>
                                  {p.description && (
                                    <p className="text-[11px] font-medium text-amber-900 pl-1 leading-snug">
                                      {p.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePayment(p.id)}
                                  className="text-gray-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                  title="Remover pagamento"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resumo Financeiro Claro e Real-Time */}
                {operationType === "investment" && (
                  <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-purple-950">🎁 Operação de Investimento</span>
                        {investmentPurpose && (
                          <span className="bg-purple-200/80 text-purple-900 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {investmentPurpose}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-800">
                        O valor dos produtos é considerado <strong>Valor Comercial de Referência</strong>. Não há geração de receita financeira no fluxo de caixa.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-purple-100 border border-purple-300 text-purple-800 px-3 py-1.5 rounded-xl shrink-0 text-center">
                      Sem receita em caixa
                    </span>
                  </div>
                )}

                <div className="bg-pink-50/30 border border-pink-100/40 rounded-2xl p-5 grid grid-cols-2 md:grid-cols-3 gap-6 text-xs text-gray-700">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Subtotal</p>
                    <p className="text-sm font-bold mt-0.5">
                      R$ {subtotalItems.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Desconto (-)</p>
                    <p className="text-sm font-bold text-rose-600 mt-0.5">
                      - R$ {discount.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Frete (+)</p>
                    <p className="text-sm font-bold mt-0.5">
                      R$ {shippingCost.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Quitado (-)</p>
                    <p className="text-sm font-bold text-emerald-600 mt-0.5">
                      - R$ {totalPaidSum.toFixed(2).replace(".", ",")}
                    </p>
                    {barterPaidSum > 0 && (
                      <span className="text-[10px] text-amber-700 block font-semibold mt-0.5 leading-tight">
                        (Em caixa: R$ {cashPaidSum.toFixed(2).replace(".", ",")} | Permuta: R$ {barterPaidSum.toFixed(2).replace(".", ",")})
                      </span>
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {operationType === "investment" ? "Saldo de Referência" : "Saldo Restante"}
                    </p>
                    <p className="text-sm font-bold mt-0.5">
                      R$ {remainingOrderBalance.toFixed(2).replace(".", ",")}
                    </p>
                  </div>

                  <div className={`text-white rounded-xl p-3 text-center flex flex-col justify-center items-center col-span-2 md:col-span-1 shadow-sm ${
                    operationType === "investment"
                      ? "bg-gradient-to-b from-purple-600 to-purple-700"
                      : "bg-gradient-to-b from-pink-400 to-pink-500"
                  }`}>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-white/90">
                      {operationType === "investment" ? "Valor Comercial Ref." : "Total Final"}
                    </p>
                    <p className="text-base font-black mt-0.5">
                      R$ {finalOrderTotal.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Prazos */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2 mb-6">
              Prazos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Previsão para Produção
                </label>
                <input
                  type="date"
                  value={productionDate}
                  onChange={(e) => setProductionDate(e.target.value)}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                />
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Opcional. Aparece no calendário de produção.
                </p>
              </div>

               <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-400 block">
                  Previsão de Entrega
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                />
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Opcional. Auxilia no acompanhamento dos prazos.
                </p>
              </div>
            </div>
          </div>

          {/* Section: Descrição */}
          <div className="bg-white/75 backdrop-blur-md border border-white/80 rounded-[22px] p-6 shadow-sm">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest block border-b border-white pb-2 mb-6">
              Descrição do Pedido
            </h3>
            
            <div className="space-y-1">
               <textarea
                  placeholder="Ex.: Tema, cores, nomes, datas, observações ou qualquer detalhe importante."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/60 border border-pink-100/85 rounded-xl px-4 py-3 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700 min-h-[120px] resize-y"
                />
                <p className="text-[11px] text-gray-400 mt-1 pl-1">
                  Escreva uma descrição curta para identificar rapidamente este pedido.
                </p>
            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-white/50 border-t border-white p-6 shrink-0 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border border-white/90 text-gray-600 hover:bg-pink-50 rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            Cancelar
          </button>
          <button
            form="new-order-form"
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl font-bold text-sm shadow-md transition-all disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Salvar Pedido
          </button>
        </div>

      </div>

      {/* Quick Add Customer Modal */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm animate-in fade-in duration-150">
           <form onSubmit={handleCreateCustomer} className="bg-[#FDF8F5]/95 backdrop-blur-lg border border-white/80 w-full max-w-md rounded-[24px] p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center mb-6 border-b border-pink-100 pb-2">
                <h3 className="text-lg font-extrabold text-gray-800">Novo Cliente</h3>
                <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="text-gray-400 hover:text-pink-600">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 block">Nome *</label>
                    <input 
                      required
                      type="text"
                      value={newCustomer.name}
                      onChange={e => setNewCustomer({...newCustomer, name: e.target.value})}
                      className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-400 block">Telefone (Opcional)</label>
                    <input 
                      type="text"
                      value={newCustomer.contact}
                      onChange={e => setNewCustomer({...newCustomer, contact: e.target.value})}
                      className="w-full bg-white/60 border border-pink-100/80 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-pink-300 transition-all text-gray-700"
                    />
                 </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                 <button type="button" onClick={() => setIsNewCustomerModalOpen(false)} className="px-4 py-2 text-sm font-bold text-gray-400 hover:text-pink-600 transition-colors">
                   Cancelar
                 </button>
                 <button type="submit" disabled={isRegisteringCustomer} className="px-6 py-2 bg-gradient-to-b from-pink-400 to-pink-500 hover:from-pink-500 hover:to-pink-600 text-white rounded-xl text-sm font-bold shadow-md transition-all disabled:opacity-50 flex items-center gap-2">
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
