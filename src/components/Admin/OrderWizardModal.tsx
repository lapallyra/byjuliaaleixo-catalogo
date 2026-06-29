import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  User,
  Plus,
  Trash2,
  Calendar,
  Truck,
  CreditCard,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Sparkles,
  Upload,
  X,
  Loader2,
  Save,
  FileText,
  XCircle,
  Check,
  Percent,
  FileCheck,
  AlertTriangle,
  Copy
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Product, Customer, Order, CompanyId, CartItem } from "../../types";
import { addCustomer } from "../../services/firebaseService";
import { formatCurrency } from "../../lib/currencyUtils";
import { formatPhone, formatCPFOrCNPJ } from "../../utils/masks";
import { ImageUpload } from "./ImageUpload";

interface OrderWizardModalProps {
  products: Product[];
  customers: Customer[];
  companyId: CompanyId;
  onClose: () => void;
  onSave: (orderData: Partial<Order>) => Promise<any>;
}

export const OrderWizardModal: React.FC<OrderWizardModalProps> = ({
  products,
  customers,
  companyId,
  onClose,
  onSave,
}) => {
  // Wizard state persisted in localstorage
  const STORAGE_KEY = `vitrine_order_wizard_draft_${companyId}`;

  const [step, setStep] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  // Quick Customer Registration State
  const [isNewCustomerFormOpen, setIsNewCustomerFormOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    contact: "",
    email: "",
    cpfCnpj: "",
    birthDate: "",
    address: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    notes: "",
  });

  // Selected Products & Personalizations State
  // item key is a unique string to allow customizing duplicates of the same product
  const [selectedItems, setSelectedItems] = useState<{
    keyId: string;
    product: Product;
    quantity: number;
    personalization: Record<string, any>;
    observations: string;
  }[]>([]);

  // Search terms
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  // Step 4: Observações Gerais
  const [internalObservations, setInternalObservations] = useState("");
  const [productionInstructions, setProductionInstructions] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isWholesale, setIsWholesale] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);

  // Success Link Data
  const [generatedLinkData, setGeneratedLinkData] = useState<{ code: string; url: string; orderStatus: string } | null>(null);

  // Saving / API loaders
  const [isSaving, setIsSaving] = useState(false);
  const [isRegisteringCustomer, setIsRegisteringCustomer] = useState(false);

  // Initialize from draft
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const d = JSON.parse(saved);
        if (d.step) setStep(d.step);
        if (d.selectedCustomerId) setSelectedCustomerId(d.selectedCustomerId);
        if (d.selectedItems) setSelectedItems(d.selectedItems);
        if (d.isWholesale !== undefined) setIsWholesale(d.isWholesale);
        if (d.isEmergency !== undefined) setIsEmergency(d.isEmergency);
        if (d.internalObservations) setInternalObservations(d.internalObservations);
        if (d.productionInstructions) setProductionInstructions(d.productionInstructions);
        if (d.additionalInfo) setAdditionalInfo(d.additionalInfo);
      } catch (e) {
        console.error("Erro ao carregar rascunho do Wizard:", e);
      }
    }
  }, [STORAGE_KEY]);

  // Save progress automatically
  useEffect(() => {
    if (generatedLinkData) return; // Don't save draft if successfully completed
    const draft = {
      step,
      selectedCustomerId,
      selectedItems,
      isWholesale,
      isEmergency,
      internalObservations,
      productionInstructions,
      additionalInfo,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [
    step,
    selectedCustomerId,
    selectedItems,
    isWholesale,
    isEmergency,
    internalObservations,
    productionInstructions,
    additionalInfo,
    generatedLinkData,
    STORAGE_KEY,
  ]);

  // Clean storage helper
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    // Reset local state to default
    setStep(1);
    setSelectedCustomerId(null);
    setSelectedItems([]);
    setCustomerSearch("");
    setProductSearch("");
    setIsWholesale(false);
    setIsEmergency(false);
    setInternalObservations("");
    setProductionInstructions("");
    setAdditionalInfo("");
    setGeneratedLinkData(null);
  };

  // Memoized lists filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch || customerSearch.trim().length < 3) return [];
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.cpfCnpj && c.cpfCnpj.includes(q)) ||
        (c.contact && c.contact.includes(q)) ||
        (c.code && c.code.includes(q))
    );
  }, [customers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  const filteredProducts = useMemo(() => {
    // Only show products matching selected atelier (companyId)
    const companyProducts = products.filter((p) => p.company === companyId);
    if (!productSearch) return companyProducts;
    const q = productSearch.toLowerCase();
    return companyProducts.filter(
      (p) =>
        p.product_name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.code && p.code.toLowerCase().includes(q))
    );
  }, [products, productSearch, companyId]);

  // Financial computations
  const subtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const price = isWholesale ? (item.product.wholesale_price || item.product.retail_price) : item.product.retail_price;
      return sum + price * item.quantity;
    }, 0);
  }, [selectedItems, isWholesale]);

  const finalTotal = subtotal;

  // Navigation validation helper
  const canGoNext = () => {
    if (step === 1) return selectedCustomerId !== null;
    if (step === 2) return selectedItems.length > 0;
    if (step === 3) {
      // Optionally validate that required personalization fields are filled
      for (const item of selectedItems) {
        const requiredFields = item.product.personalizationSettings?.filter(f => f.isRequired) || [];
        for (const req of requiredFields) {
          if (!item.personalization[req.id]) {
            return false;
          }
        }
      }
      return true;
    }
    if (step === 4) {
      return true;
    }
    return true;
  };

  // Step 1: Handle fast customer registration
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name || !newCustomer.contact) {
      alert("Por favor preencha os campos obrigatórios (Nome e Contato).");
      return;
    }
    setIsRegisteringCustomer(true);
    try {
      const customerId = await addCustomer({
        ...newCustomer,
        companyId,
        status: "Cadastro Incompleto",
        totalSpent: 0,
        ordersCount: 0,
      });

      if (customerId) {
        setSelectedCustomerId(customerId);
        setIsNewCustomerFormOpen(false);
        setNewCustomer({
          name: "",
          contact: "",
          email: "",
          cpfCnpj: "",
          birthDate: "",
          address: "",
          number: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          notes: "",
        });
        alert("Cliente pré-cadastrado e selecionado com sucesso!");
        // Após salvar, continuar automaticamente para o Passo 02
        setStep(2);
      }
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao cadastrar o cliente.");
    } finally {
      setIsRegisteringCustomer(false);
    }
  };

  // Step 2: Product selection
  const handleAddProduct = (prod: Product) => {
    const keyId = Math.random().toString(36).substr(2, 9);
    
    // Auto-populate default personalizations if any exist in personalizationSettings
    const defaultPersonalization: Record<string, any> = {};
    prod.personalizationSettings?.forEach((setting) => {
      if (setting.type === 'select' && setting.options && setting.options.length > 0) {
        defaultPersonalization[setting.id] = setting.options[0];
      } else {
        defaultPersonalization[setting.id] = "";
      }
    });

    setSelectedItems([
      ...selectedItems,
      {
        keyId,
        product: prod,
        quantity: 1,
        personalization: defaultPersonalization,
        observations: "",
      },
    ]);
  };

  const handleUpdateItemQty = (keyId: string, delta: number) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.keyId === keyId) {
          const newQty = item.quantity + delta;
          return { ...item, quantity: newQty < 1 ? 1 : newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (keyId: string) => {
    setSelectedItems(selectedItems.filter((item) => item.keyId !== keyId));
  };

  // Step 3: Set personalization values
  const handleUpdatePersonalization = (keyId: string, fieldId: string, value: any) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.keyId === keyId) {
          return {
            ...item,
            personalization: {
              ...item.personalization,
              [fieldId]: value,
            },
          };
        }
        return item;
      })
    );
  };

  const handleUpdateItemObservation = (keyId: string, val: string) => {
    setSelectedItems(
      selectedItems.map((item) => {
        if (item.keyId === keyId) {
          return { ...item, observations: val };
        }
        return item;
      })
    );
  };

  // Save Order Helper
  const handleSaveOrderFinal = async (orderStatus: Order["status"]) => {
    if (!selectedCustomer) {
      alert("Nenhum cliente selecionado!");
      return;
    }
    if (selectedItems.length === 0) {
      alert("Adicione pelo menos um produto ao pedido!");
      return;
    }

    setIsSaving(true);

    try {
      // Map customized wizard items to standard order CartItems
      const finalItems: CartItem[] = selectedItems.map((item) => {
        // Build a beautiful formatted string summarizing the personalizations for backwards compatibility
        const pLines: string[] = [];
        
        // 1. Process custom settings
        if (item.product.personalizationSettings && item.product.personalizationSettings.length > 0) {
          item.product.personalizationSettings.forEach((f) => {
            const val = item.personalization[f.id];
            if (val) {
              pLines.push(`${f.label}: ${val}`);
            }
          });
        } else {
          // Fallback fields standard summary
          const fallbacks = [
            { key: "nome", label: "Nome" },
            { key: "frase", label: "Frase" },
            { key: "cor", label: "Cor" },
            { key: "fonte", label: "Fonte" },
            { key: "anexo", label: "Anexo" },
          ];
          fallbacks.forEach((f) => {
            const val = item.personalization[f.key];
            if (val) {
              pLines.push(`${f.label}: ${val}`);
            }
          });
        }

        if (item.observations) {
          pLines.push(`Obs: ${item.observations}`);
        }

        const formattedObs = pLines.join(" | ");

        return {
          ...item.product,
          productId: item.product.id,
          quantity: item.quantity,
          observations: formattedObs,
          // Store custom structured personalizations as an optional property
          personalizationData: item.personalization,
          personalizationText: formattedObs,
        } as unknown as CartItem;
      });

      // Format observations to combine all three textareas
      const combinedObs = [
        internalObservations.trim() ? `[OBSERVAÇÕES INTERNAS]\n${internalObservations.trim()}` : "",
        productionInstructions.trim() ? `[INSTRUÇÕES DE PRODUÇÃO]\n${productionInstructions.trim()}` : "",
        additionalInfo.trim() ? `[INFORMAÇÕES ADICIONAIS]\n${additionalInfo.trim()}` : ""
      ].filter(Boolean).join("\n\n");

      const orderData: Partial<Order> = {
        customerName: selectedCustomer.name,
        customerCpfCnpj: "", // Exclusive client flow
        contact: selectedCustomer.contact,
        address: "A definir pelo cliente no checkout", // Exclusive client flow
        total: finalTotal,
        status: orderStatus,
        deliveryDate: "", // Exclusive client flow
        deliveryType: undefined, // Exclusive client flow
        shippingCost: 0, // Exclusive client flow
        discountAmount: 0, // Exclusive client flow
        hasSignal: false, // Exclusive client flow
        signalValue: 0, // Exclusive client flow
        items: finalItems,
        isWholesale: isWholesale,
        isEmergency: isEmergency,
        observations: combinedObs,
        companyId: companyId,
        paymentStatus: "pending",
      };

      // Call onSave which returns the generated order code
      const result = await onSave(orderData);
      
      const code = result || orderData.code || "PEDIDO";
      const approvalUrl = `${window.location.origin}/checkout/${code}`;
      
      setGeneratedLinkData({
        code: code,
        url: approvalUrl,
        orderStatus: orderStatus,
      });

      // Clean draft localStorage since it was successfully saved
      localStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.error(err);
      alert("Houve um erro ao salvar o pedido.");
    } finally {
      setIsSaving(false);
    }
  };

  // Steps labels & icons
  const stepsConfig = [
    { num: 1, title: "Cliente", icon: User },
    { num: 2, title: "Produtos", icon: Sparkles },
    { num: 3, title: "Personalização", icon: FileText },
    { num: 4, title: "Observações", icon: FileCheck },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#F5F5F7] w-full max-w-5xl h-[90vh] rounded-3xl border border-[#E5E5EA] shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Wizard Header */}
        <div className="bg-white border-b border-[#E5E5EA] p-6 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#F5F5F7] border border-[#E5E5EA] text-[#1C1C1E] shadow-sm">
              <Sparkles size={18} className="text-[#cca062]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#1C1C1E] tracking-tight">
                Assistente de Pedidos (Wizard)
              </h2>
              <p className="text-[10px] text-[#8E8E93] font-bold uppercase tracking-wider mt-0.5">
                Criação rápida e guiada para o Ateliê {companyId.toUpperCase()}
              </p>
            </div>
          </div>

          {/* Stepper progress bar */}
          <div className="flex items-center gap-1.5 md:gap-3">
            {stepsConfig.map((s, idx) => {
              const StepIcon = s.icon;
              const isActive = s.num === step;
              const isCompleted = s.num < step;

              return (
                <React.Fragment key={s.num}>
                  {idx > 0 && (
                    <div 
                      className={`h-[1px] w-4 sm:w-8 md:w-12 transition-all duration-300 ${
                        isCompleted ? "bg-[#10B981]" : "bg-[#E5E5EA]"
                      }`} 
                    />
                  )}
                  <div
                    onClick={() => {
                      if (isCompleted || s.num <= step) {
                        setStep(s.num);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                      isActive
                        ? "bg-[#ECFDF5] text-[#065F46] border-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5),0_0_15px_rgba(16,185,129,0.3)] scale-105"
                        : isCompleted
                        ? "bg-white text-[#10B981] border-[#A7F3D0]"
                        : "bg-white text-[#8E8E93] border-[#E5E5EA] hover:border-[#D1D1D6]"
                    }`}
                  >
                    {isCompleted ? (
                      <Check size={12} className="text-[#10B981] stroke-[3]" />
                    ) : (
                      <StepIcon size={12} />
                    )}
                    <span className="hidden sm:inline">{s.title}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full hover:bg-[#F5F5F7] text-[#8E8E93] transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Wizard Main Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: CLIENT SELECTION */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {!isNewCustomerFormOpen ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                        <input
                          type="text"
                          placeholder="BUSCAR CLIENTE POR NOME, CPF, TELEFONE..."
                          className="w-full bg-white border border-[#E5E5EA] rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all shadow-sm"
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                        />
                      </div>
                      
                      <button
                        onClick={() => setIsNewCustomerFormOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#1C1C1E] border border-[#E5E5EA] border-b-[4px] border-b-[#D1D1D6] rounded-xl font-bold text-xs uppercase tracking-wider hover:-translate-y-[1px] active:translate-y-[2px] active:border-b-[1px] transition-all shadow-sm cursor-pointer"
                      >
                        <Plus size={16} /> Cadastrar Novo Cliente
                      </button>
                    </div>

                    {/* Customers listing */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[45vh] overflow-y-auto pr-2 scrollbar-hide">
                      {customerSearch.trim().length < 3 ? (
                        <div className="col-span-full py-12 text-center text-xs font-bold text-[#8E8E93] uppercase tracking-wider flex flex-col items-center justify-center space-y-2 bg-white/50 rounded-2xl border border-dashed border-[#E5E5EA]">
                          <Search size={24} className="text-[#D1D1D6] mb-1" />
                          <span>Digite pelo menos 3 caracteres para buscar um cliente</span>
                        </div>
                      ) : filteredCustomers.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-xs font-bold text-[#8E8E93] uppercase tracking-wider flex flex-col items-center justify-center space-y-2 bg-white/50 rounded-2xl border border-dashed border-[#E5E5EA]">
                          <X size={24} className="text-rose-400 mb-1" />
                          <span>Nenhum cliente encontrado com "{customerSearch}"</span>
                        </div>
                      ) : (
                        filteredCustomers.map((cust) => {
                          const isSelected = selectedCustomerId === cust.id;
                          return (
                            <div
                              key={cust.id}
                              onClick={() => setSelectedCustomerId(cust.id)}
                              className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between h-40 ${
                                isSelected
                                  ? "bg-white border-[#1C1C1E] shadow-md scale-[1.02]"
                                  : "bg-white border-[#E5E5EA] hover:border-[#D1D1D6]"
                              }`}
                            >
                              <div>
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-[#cca062] uppercase tracking-wider">
                                    #{cust.code || "---"}
                                  </span>
                                  {isSelected && (
                                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-1 rounded-full">
                                      <Check size={12} />
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-bold text-[#1C1C1E] uppercase line-clamp-1">
                                  {cust.name}
                                </h4>
                                <p className="text-xs font-medium text-[#8E8E93] mt-1 font-mono">
                                  {formatPhone(cust.contact)}
                                </p>
                              </div>

                              <div className="flex justify-between items-center pt-3 border-t border-[#F2F2F7]">
                                <span className="text-[9px] font-bold text-[#8E8E93] uppercase">
                                  {cust.city || "Sem cidade"}
                                </span>
                                <span className="text-xs font-extrabold text-emerald-600">
                                  {formatCurrency(cust.totalSpent || 0)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Selected Customer Card Preview */}
                    {selectedCustomer && (
                      <div className="p-6 rounded-3xl bg-white border border-[#E5E5EA] space-y-4 shadow-sm animate-in fade-in zoom-in-95">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#8E8E93]">
                          Cliente Selecionado
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="text-[9px] text-[#8E8E93] font-bold uppercase block">Nome</span>
                            <span className="text-xs font-bold text-[#1C1C1E] uppercase">{selectedCustomer.name}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#8E8E93] font-bold uppercase block">Contato</span>
                            <span className="text-xs font-medium text-[#1C1C1E] font-mono">{formatPhone(selectedCustomer.contact)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#8E8E93] font-bold uppercase block">CPF / CNPJ</span>
                            <span className="text-xs font-medium text-[#1C1C1E] font-mono">{selectedCustomer.cpfCnpj ? formatCPFOrCNPJ(selectedCustomer.cpfCnpj) : "Não cadastrado"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#8E8E93] font-bold uppercase block">Gasto Acumulado</span>
                            <span className="text-xs font-extrabold text-emerald-600">{formatCurrency(selectedCustomer.totalSpent || 0)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Quick Customer Registration Form
                  <form onSubmit={handleCreateCustomer} className="bg-white border border-[#E5E5EA] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between border-b border-[#F2F2F7] pb-4">
                      <h3 className="text-sm font-bold text-[#1C1C1E] uppercase tracking-wider">
                        Cadastro Rápido de Cliente
                      </h3>
                      <button
                        type="button"
                        onClick={() => setIsNewCustomerFormOpen(false)}
                        className="text-[#8E8E93] hover:text-[#1C1C1E]"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider pl-2 block">
                          Nome Completo *
                        </label>
                        <input
                          required
                          type="text"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider pl-2 block">
                          Contato (WhatsApp) *
                        </label>
                        <input
                          required
                          type="text"
                          placeholder="(44) 99999-9999"
                          value={newCustomer.contact}
                          onChange={(e) => setNewCustomer({ ...newCustomer, contact: formatPhone(e.target.value) })}
                          className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E] font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-[#F2F2F7]">
                      <button
                        type="button"
                        onClick={() => setIsNewCustomerFormOpen(false)}
                        className="px-6 py-3 bg-[#F5F5F7] text-[#1C1C1E] border border-transparent border-b-[4px] border-b-[#E5E5EA] rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={isRegisteringCustomer}
                        className="flex items-center gap-2 px-6 py-3 bg-[#1C1C1E] text-white border border-black border-b-[4px] border-b-black rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isRegisteringCustomer ? (
                          <>
                            <Loader2 size={14} className="animate-spin" /> Salvando...
                          </>
                        ) : (
                          <>
                            <Save size={14} /> Confirmar Cadastro
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}

            {/* STEP 2: PRODUCTS SELECTION */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left Column: Product Catalog Selector */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8E8E93]" size={16} />
                    <input
                      type="text"
                      placeholder="BUSCAR PRODUTOS POR NOME, CATEGORIA..."
                      className="w-full bg-white border border-[#E5E5EA] rounded-2xl pl-12 pr-4 py-3.5 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#1C1C1E] transition-all shadow-sm"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[50vh] overflow-y-auto pr-2 scrollbar-hide">
                    {filteredProducts.length === 0 ? (
                      <div className="col-span-full py-12 text-center text-xs font-bold text-[#8E8E93] uppercase tracking-wider">
                        Nenhum produto encontrado neste ateliê.
                      </div>
                    ) : (
                      filteredProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="bg-white rounded-2xl border border-[#E5E5EA] p-4 flex gap-4 hover:shadow-sm hover:border-[#D1D1D6] transition-all group"
                        >
                          <div className="w-16 h-16 rounded-xl border border-[#E5E5EA] overflow-hidden bg-[#F5F5F7] flex items-center justify-center shrink-0">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.product_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Sparkles size={20} className="text-[#D1D1D6]" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-xs font-bold text-[#1C1C1E] line-clamp-1 uppercase">
                                {prod.product_name}
                              </h4>
                              <p className="text-[10px] font-bold text-[#8E8E93] uppercase mt-0.5">
                                {prod.category || "N/A"}
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-1 border-t border-[#F2F2F7]">
                              <span className="text-xs font-extrabold text-[#1C1C1E] font-mono">
                                {formatCurrency(prod.retail_price)}
                              </span>
                              <button
                                onClick={() => handleAddProduct(prod)}
                                className="px-2.5 py-1.5 bg-[#F5F5F7] border border-[#E5E5EA] border-b-[2px] border-b-[#D1D1D6] text-[10px] font-bold uppercase rounded-lg hover:-translate-y-[0.5px] active:translate-y-[1px] active:border-b-0 transition-all cursor-pointer"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Column: Cart items selected */}
                <div className="lg:col-span-5 bg-white border border-[#E5E5EA] rounded-3xl p-6 flex flex-col justify-between h-[58vh]">
                  <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex justify-between items-center border-b border-[#F2F2F7] pb-4 mb-4">
                      <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider">
                        Produtos Selecionados ({selectedItems.reduce((s, i) => s + i.quantity, 0)})
                      </h3>
                      <button
                        onClick={() => setSelectedItems([])}
                        className="text-[9px] font-bold uppercase tracking-widest text-rose-500 hover:text-rose-700 bg-rose-50 border border-rose-100 rounded-lg px-2.5 py-1"
                      >
                        Limpar Tudo
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-hide">
                      {selectedItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-[#8E8E93] py-12">
                          <Sparkles size={36} className="text-[#D1D1D6] mb-2 animate-pulse" />
                          <p className="text-xs font-bold uppercase tracking-wider">O pedido está vazio</p>
                          <p className="text-[10px] text-[#A09898] mt-1 max-w-[200px]">Adicione produtos do catálogo ao lado</p>
                        </div>
                      ) : (
                        selectedItems.map((item) => (
                          <div
                            key={item.keyId}
                            className="bg-[#F5F5F7] border border-[#E5E5EA] p-3 rounded-2xl flex items-center gap-3"
                          >
                            <div className="w-10 h-10 rounded-lg border border-[#E5E5EA] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                              {item.product.image ? (
                                <img src={item.product.image} alt={item.product.product_name} className="w-full h-full object-cover" />
                              ) : (
                                <Sparkles size={16} className="text-[#D1D1D6]" />
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[11px] font-bold text-[#1C1C1E] truncate uppercase">
                                {item.product.product_name}
                              </h5>
                              <p className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5">
                                {formatCurrency(item.product.retail_price)}
                              </p>
                            </div>

                            <div className="flex items-center bg-white border border-[#E5E5EA] rounded-xl shrink-0 overflow-hidden shadow-xs">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.keyId, -1)}
                                className="px-2 py-1 text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] active:bg-[#F5F5F7]"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 text-xs font-bold text-[#1C1C1E] min-w-[24px] text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.keyId, 1)}
                                className="px-2 py-1 text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] active:bg-[#F5F5F7]"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.keyId)}
                              className="p-1.5 bg-white border border-[#E5E5EA] hover:border-rose-100 hover:text-rose-500 rounded-xl text-[#8E8E93] transition-colors shadow-xs"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border-t border-[#F2F2F7] pt-4 mt-4 bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#8E8E93] uppercase">Valor Atacado?</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isWholesale"
                          checked={isWholesale}
                          onChange={(e) => setIsWholesale(e.target.checked)}
                          className="rounded text-[#1C1C1E] focus:ring-[#cca062]"
                        />
                        <label htmlFor="isWholesale" className="text-xs font-bold text-[#1C1C1E] cursor-pointer">Ativar Preço de Atacado</label>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-[#F5F5F7] p-4 rounded-2xl">
                      <span className="text-xs font-bold text-[#1C1C1E] uppercase">Subtotal</span>
                      <span className="text-lg font-bold text-[#1C1C1E] font-mono">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PERSONALIZATION AREAS */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-[58vh] overflow-y-auto pr-2 scrollbar-hide"
              >
                <div className="bg-white p-4 rounded-2xl border border-[#E5E5EA] text-center text-xs font-semibold text-[#8E8E93] uppercase tracking-wider">
                  Configure os detalhes de personalização de cada item do pedido abaixo.
                </div>

                <div className="space-y-6">
                  {selectedItems.map((item, index) => {
                    const settings = item.product.personalizationSettings || [];
                    const hasCustomSettings = settings.length > 0;

                    return (
                      <div
                        key={item.keyId}
                        className="bg-white border border-[#E5E5EA] rounded-3xl p-6 md:p-8 space-y-6 shadow-sm relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#cca062]" />
                        
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl border border-[#E5E5EA] bg-[#F5F5F7] overflow-hidden flex items-center justify-center shrink-0 shadow-xs">
                            {item.product.image ? (
                              <img src={item.product.image} alt={item.product.product_name} className="w-full h-full object-cover" />
                            ) : (
                              <Sparkles size={18} className="text-[#D1D1D6]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-white bg-[#1C1C1E] px-2 py-0.5 rounded-md uppercase tracking-wider">
                                Item #{index + 1}
                              </span>
                              <h4 className="text-sm font-extrabold text-[#1C1C1E] uppercase">
                                {item.product.product_name}
                              </h4>
                            </div>
                            <p className="text-[10px] text-[#8E8E93] font-medium mt-1">
                              Quantidade: {item.quantity} un | Preço Unitário: {formatCurrency(isWholesale ? (item.product.wholesale_price || item.product.retail_price) : item.product.retail_price)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#F2F2F7]">
                          {/* DYNAMIC FIELDS RENDERED */}
                          {hasCustomSettings ? (
                            settings.map((field) => (
                              <div key={field.id} className="space-y-1">
                                <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                                  {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                </label>
                                
                                {field.type === 'text' && (
                                  <input
                                    type="text"
                                    placeholder={field.placeholder || "Digite aqui..."}
                                    maxLength={field.charLimit}
                                    value={item.personalization[field.id] || ""}
                                    onChange={(e) => handleUpdatePersonalization(item.keyId, field.id, e.target.value)}
                                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                  />
                                )}

                                {field.type === 'select' && (
                                  <select
                                    value={item.personalization[field.id] || ""}
                                    onChange={(e) => handleUpdatePersonalization(item.keyId, field.id, e.target.value)}
                                    className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                  >
                                    <option value="">Selecione uma opção...</option>
                                    {field.options?.map((opt, oIdx) => (
                                      <option key={oIdx} value={opt}>
                                        {opt.toUpperCase()}
                                      </option>
                                    ))}
                                  </select>
                                )}

                                {field.type === 'image' && (
                                  <ImageUpload
                                    path={`sales_personalization/${item.keyId}`}
                                    currentUrl={item.personalization[field.id]}
                                    onUploadComplete={(url) => handleUpdatePersonalization(item.keyId, field.id, url)}
                                    onRemove={() => handleUpdatePersonalization(item.keyId, field.id, "")}
                                    label="Anexar Arte / Imagem"
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            // STANDARD FALLBACK PERSONALIZATION OPTIONS
                            <>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                                      Nome (Personalização)
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Julia, Maria..."
                                      value={item.personalization["nome"] || ""}
                                      onChange={(e) => handleUpdatePersonalization(item.keyId, "nome", e.target.value)}
                                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                                      Frase / Mensagem
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Com Amor"
                                      value={item.personalization["frase"] || ""}
                                      onChange={(e) => handleUpdatePersonalization(item.keyId, "frase", e.target.value)}
                                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                                      Cor Predileta
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Rosa Pastel"
                                      value={item.personalization["cor"] || ""}
                                      onChange={(e) => handleUpdatePersonalization(item.keyId, "cor", e.target.value)}
                                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                                      Fonte Tipográfica
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Cursiva, Moderna"
                                      value={item.personalization["fonte"] || ""}
                                      onChange={(e) => handleUpdatePersonalization(item.keyId, "fonte", e.target.value)}
                                      className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <ImageUpload
                                  path={`sales_personalization/${item.keyId}`}
                                  currentUrl={item.personalization["anexo"]}
                                  onUploadComplete={(url) => handleUpdatePersonalization(item.keyId, "anexo", url)}
                                  onRemove={() => handleUpdatePersonalization(item.keyId, "anexo", "")}
                                  label="Anexar Logo ou Referência"
                                />
                              </div>
                            </>
                          )}

                          {/* GENERAL ITEM OBSERVATION FIELD */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] uppercase font-bold text-[#8E8E93] tracking-wider pl-1 block">
                              Observações / Detalhes de Montagem do Item
                            </label>
                            <textarea
                              rows={2}
                              placeholder="Insira detalhes específicos de fabricação ou observações adicionais..."
                              value={item.observations}
                              onChange={(e) => handleUpdateItemObservation(item.keyId, e.target.value)}
                              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:bg-white focus:border-[#1C1C1E]"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 4: ORDER SUMMARY & OBSERVATIONS */}
            {step === 4 && !generatedLinkData && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in zoom-in-95"
              >
                {/* Left Column: Editable final observations */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E5E5EA] p-6 space-y-6 max-h-[58vh] overflow-y-auto pr-2 scrollbar-hide shadow-xs">
                  <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider border-b border-[#F2F2F7] pb-4">
                    Observações Gerais e Instruções
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider pl-2 block">
                        Observações Internas do Pedido
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Adicione observações internas sobre este pedido (visíveis apenas para o admin)..."
                        value={internalObservations}
                        onChange={(e) => setInternalObservations(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:border-[#1C1C1E] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider pl-2 block">
                        Instruções de Produção
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Insira detalhes de produção para a equipe (ex: embalagem especial, prioridade na fila, etc.)..."
                        value={productionInstructions}
                        onChange={(e) => setProductionInstructions(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:border-[#1C1C1E] focus:bg-white transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-wider pl-2 block">
                        Informações Adicionais Importantes
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Qualquer outra informação relevante para este pedido..."
                        value={additionalInfo}
                        onChange={(e) => setAdditionalInfo(e.target.value)}
                        className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-xl px-4 py-2.5 text-xs font-bold outline-none text-[#1C1C1E] focus:border-[#1C1C1E] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#F2F2F7] grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 pl-2">
                      <input
                        type="checkbox"
                        id="isEmergency"
                        checked={isEmergency}
                        onChange={(e) => setIsEmergency(e.target.checked)}
                        className="rounded text-[#1C1C1E] focus:ring-[#cca062] h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="isEmergency" className="text-xs font-bold text-rose-600 uppercase tracking-wide cursor-pointer flex items-center gap-1 select-none">
                        <AlertTriangle size={12} /> Pedido Emergencial
                      </label>
                    </div>

                    <div className="flex items-center gap-2 pl-2">
                      <input
                        type="checkbox"
                        id="isWholesale"
                        checked={isWholesale}
                        onChange={(e) => setIsWholesale(e.target.checked)}
                        className="rounded text-[#1C1C1E] focus:ring-[#cca062] h-4 w-4 cursor-pointer"
                      />
                      <label htmlFor="isWholesale" className="text-xs font-bold text-[#cca062] uppercase tracking-wide cursor-pointer flex items-center gap-1 select-none">
                        <Percent size={12} /> Preço de Atacado
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right Column: Order Summary Review */}
                <div className="lg:col-span-5 bg-white border border-[#E5E5EA] rounded-3xl p-6 flex flex-col justify-between h-[58vh] shadow-xs">
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                    <h3 className="text-xs font-bold text-[#1C1C1E] uppercase tracking-wider border-b border-[#F2F2F7] pb-3">
                      Resumo do Pedido
                    </h3>

                    {/* Customer overview */}
                    {selectedCustomer && (
                      <div className="bg-[#F5F5F7]/75 p-4 rounded-2xl space-y-1.5">
                        <span className="text-[9px] uppercase font-black text-[#A09898] tracking-widest block">Cliente</span>
                        <p className="text-xs font-extrabold text-[#1C1C1E] uppercase leading-none">{selectedCustomer.name}</p>
                        <p className="text-[10px] font-bold text-[#8E8E93] font-mono leading-none">{formatPhone(selectedCustomer.contact)}</p>
                      </div>
                    )}

                    {/* Selected items list review */}
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-black text-[#A09898] tracking-widest block">Produtos e Quantidades</span>
                      <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                        {selectedItems.map((item) => {
                          const itemPrice = isWholesale ? (item.product.wholesale_price || item.product.retail_price) : item.product.retail_price;
                          return (
                            <div key={item.keyId} className="flex justify-between items-start text-xs border-b border-[#F2F2F7] pb-2">
                              <div className="min-w-0 pr-2">
                                <p className="font-bold text-[#1C1C1E] uppercase truncate">{item.product.product_name}</p>
                                <p className="text-[9px] text-[#8E8E93] font-medium leading-relaxed">
                                  {item.quantity} un x {formatCurrency(itemPrice)}
                                </p>
                              </div>
                              <span className="font-mono font-bold text-[#1C1C1E]">
                                {formatCurrency(itemPrice * item.quantity)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#F2F2F7] pt-4 mt-4 bg-white">
                    <div className="flex justify-between items-center bg-[#1C1C1E] text-white p-4 rounded-2xl shadow-sm">
                      <span className="text-xs font-bold uppercase tracking-wider">Subtotal Geral</span>
                      <span className="text-xl font-bold font-mono tracking-tight">
                        {formatCurrency(subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SUCCESS LINK VIEW */}
            {generatedLinkData && (
              <motion.div
                key="success-screen"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto py-8 text-center space-y-8 animate-in fade-in zoom-in-95"
              >
                <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 size={40} className="stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-[#1C1C1E] tracking-tight">
                    {generatedLinkData.orderStatus === "quote" ? "Orçamento Gerado!" : "Pedido Gerado com Sucesso!"}
                  </h3>
                  <p className="text-xs font-semibold text-[#8E8E93] uppercase tracking-wider max-w-md mx-auto">
                    O link de aprovação foi gerado e está pronto para ser enviado ao cliente.
                  </p>
                </div>

                {/* Details Card */}
                <div className="bg-white border border-[#E5E5EA] rounded-3xl p-6 text-left space-y-4 shadow-sm max-w-lg mx-auto">
                  <div className="flex justify-between items-center border-b border-[#F2F2F7] pb-3">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Cliente</span>
                    <span className="text-xs font-extrabold text-[#1C1C1E] uppercase">{selectedCustomer?.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#F2F2F7] pb-3">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Contato</span>
                    <span className="text-xs font-bold text-[#1C1C1E] font-mono">{selectedCustomer ? formatPhone(selectedCustomer.contact) : ""}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-[#F2F2F7] pb-3">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Código</span>
                    <span className="text-xs font-black text-[#cca062] font-mono">#{generatedLinkData.code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-[#8E8E93] uppercase tracking-wider">Subtotal</span>
                    <span className="text-sm font-black text-emerald-600 font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                </div>

                {/* URL Link Box */}
                <div className="space-y-2 max-w-lg mx-auto">
                  <label className="text-[9px] uppercase font-bold text-[#8E8E93] tracking-widest block text-left pl-4">
                    Link Único de Aprovação
                  </label>
                  <div className="flex gap-2 bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl p-2 pl-4 items-center justify-between shadow-inner">
                    <span className="text-xs font-mono text-[#1C1C1E] truncate select-all font-semibold max-w-[280px]">
                      {generatedLinkData.url}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLinkData.url);
                        alert("Link copiado para a área de transferência!");
                      }}
                      className="flex items-center gap-1.5 px-4 py-2.5 bg-white text-[#1C1C1E] border border-[#E5E5EA] border-b-[3px] border-b-[#D1D1D6] rounded-xl font-bold text-xs uppercase tracking-wider hover:-translate-y-[0.5px] active:translate-y-[1px] active:border-b-0 transition-all cursor-pointer shadow-xs"
                    >
                      <Copy size={12} /> Copiar
                    </button>
                  </div>
                </div>

                {/* Main Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-lg mx-auto pt-4">
                  <button
                    onClick={() => {
                      const clientName = selectedCustomer?.name || "Cliente";
                      const storeName = companyId.toUpperCase();
                      const msg = generatedLinkData.orderStatus === "quote"
                        ? `Olá, *${clientName}*! O orçamento do seu pedido no Ateliê *${storeName}* foi gerado com sucesso. Acesse o link abaixo para visualizar os detalhes, aprovar e finalizar o seu cadastro:\n\n${generatedLinkData.url}`
                        : `Olá, *${clientName}*! Seu pedido no Ateliê *${storeName}* foi gerado com sucesso. Acesse o link abaixo para visualizar, confirmar os detalhes de personalização e realizar o pagamento:\n\n${generatedLinkData.url}`;
                      
                      const phoneDigits = (selectedCustomer?.contact || "").replace(/\D/g, '');
                      const fullPhone = phoneDigits.startsWith('55') ? phoneDigits : `55${phoneDigits}`;
                      window.open(`https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-emerald-600 text-white border border-emerald-700 border-b-[4px] border-b-emerald-800 rounded-2xl font-bold text-xs uppercase tracking-wider hover:-translate-y-[1px] active:translate-y-[2px] active:border-b-[1px] transition-all shadow-md cursor-pointer"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.963C16.528 2.017 14.077.99 11.478.99c-5.448 0-9.886 4.374-9.89 9.802-.001 1.761.47 3.48 1.362 5.02L1.875 21.8l6.113-1.597c1.512.875 3.125 1.332 4.659 1.332z" />
                    </svg>
                    Enviar via WhatsApp
                  </button>

                  <button
                    onClick={() => {
                      clearDraft();
                      onClose();
                    }}
                    className="flex-1 px-6 py-4 bg-[#1C1C1E] text-white border border-black border-b-[4px] border-b-black rounded-2xl font-bold text-xs uppercase tracking-wider hover:-translate-y-[1px] active:translate-y-[2px] active:border-b-[1px] transition-all shadow-md cursor-pointer"
                  >
                    Concluir e Voltar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Wizard Footer Controls */}
        {!generatedLinkData && (
          <div className="bg-white border-t border-[#E5E5EA] p-6 shrink-0 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 bg-white text-[#1C1C1E] border border-[#E5E5EA] border-b-[4px] border-b-[#D1D1D6] rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all cursor-pointer"
                >
                  <ArrowLeft size={14} /> Voltar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-3 bg-[#F5F5F7] text-rose-500 border border-transparent border-b-[4px] border-b-[#E5E5EA] rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              )}

              <button
                type="button"
                onClick={clearDraft}
                className="text-[10px] font-bold text-[#8E8E93] hover:text-[#1C1C1E] ml-2"
                title="Apagar dados e recomeçar"
              >
                Reiniciar
              </button>
            </div>

            <div className="flex gap-3">
              {step < 4 ? (
                <button
                  type="button"
                  disabled={!canGoNext()}
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-2 px-6 py-3 bg-[#1C1C1E] text-white border border-black border-b-[4px] border-b-black rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-[4px]"
                >
                  Avançar <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSaving || !canGoNext()}
                    onClick={() => handleSaveOrderFinal("quote")}
                    className="px-6 py-3 bg-white text-[#1C1C1E] border border-[#E5E5EA] border-b-[4px] border-b-[#D1D1D6] rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      "Salvar como Orçamento"
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving || !canGoNext()}
                    onClick={() => handleSaveOrderFinal("novo pedido")}
                    className="flex items-center gap-2 px-6 py-3 bg-[#1C1C1E] text-white border border-black border-b-[4px] border-b-black rounded-xl font-bold text-xs uppercase tracking-wider active:translate-y-[2px] active:border-b-[1px] transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Gerando Pedido...
                      </>
                    ) : (
                      <>
                        <FileCheck size={14} /> Salvar Pedido
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
