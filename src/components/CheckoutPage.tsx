import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  Plus, 
  Trash2, 
  Search, 
  Package, 
  UserPlus, 
  Users, 
  ArrowRight,
  Link as LinkIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  CreditCard,
  FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getOrderByCode, 
  getSiteSettings, 
  subscribeToCustomers, 
  getProducts, 
  saveSale,
  updateOrder,
  addCustomer,
  syncCustomerFromCheckout
} from "../services/firebaseService";
import { 
  Order, 
  Customer, 
  Product, 
  CartItem, 
  CompanyId, 
  AppConfig 
} from "../types";
import { useAuth } from "./AuthProvider";

interface CheckoutPageProps {
  config: AppConfig;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ config }) => {
  const { id: urlId, code: urlCode } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [order, setOrder] = useState<Partial<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: "", contact: "" });
  
  const [customerForm, setCustomerForm] = useState({
    nome: "",
    contato: "",
    cpfCnpj: "",
    email: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    cidade: "",
    estado: "",
    observacoes: "",
    entrega: ""
  });

  const [brandTheme, setBrandTheme] = useState({
    primary: "#D48C8C",
    secondary: "#F0E6D2",
    logo: ""
  });

  // Step 1 Form Data
  const [items, setItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [freight, setFreight] = useState(0);
  const [observations, setObservations] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const products = await getProducts();
        setAllProducts(products);

        const unsubCustomers = subscribeToCustomers((customers) => {
          setAllCustomers(customers);
        });

        let currentOrder: Partial<Order> | null = null;

        if (urlId === "new") {
          currentOrder = {
            id: "",
            code: "",
            status: "pending",
            items: [],
            total: 0,
            companyId: "pallyra",
            isEmergency: false,
            observations: ""
          };
          setStep(1);
        } else {
          const code = (urlCode || urlId)?.toUpperCase();
          if (code) {
            const fetched = await getOrderByCode(code);
            if (fetched) {
              currentOrder = fetched;
              setItems(fetched.items || []);
              setFreight(fetched.shippingCost || 0);
              setObservations(fetched.observations || "");
              setDeliveryDate(fetched.deliveryDate || "");
              
              // Map to customerForm
              setCustomerForm(prev => ({
                ...prev,
                nome: fetched.customerName || "",
                contato: fetched.contact || "",
                cpfCnpj: fetched.customerCpfCnpj || "",
                endereco: fetched.address || ""
              }));

              // Permission Logic
              if (!isAdmin) {
                // Clients start at Step 2
                setStep(2);
              } else {
                // Admin can jump steps based on status
                if (fetched.status === "waiting_payment" || fetched.status === "paid") setStep(3);
                else setStep(1);
              }
            } else {
              // Not found
              navigate("/");
            }
          }
        }

        if (currentOrder) {
          setOrder(currentOrder);
          if (currentOrder.companyId) {
            const settings = await getSiteSettings(currentOrder.companyId);
            if (settings) {
              setBrandTheme({
                primary: settings.theme_primary_color || brandTheme.primary,
                secondary: settings.theme_accent_color || brandTheme.secondary,
                logo: settings.store_logo || ""
              });
            }
          }
        }
        
        return () => unsubCustomers();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [urlId, urlCode, isAdmin]);

  const subtotal = items.reduce((acc, item) => acc + (item.current_price * item.quantity), 0);
  const total = subtotal - discount + freight;

  const handleAddItem = (product: Product) => {
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product as CartItem, quantity: 1, productId: product.id }];
    });
  };

  const handleUpdateQty = (id: string, qty: number) => {
    setItems(prev => prev.map(i => (i.id === id || i.productId === id) ? { ...i, quantity: Math.max(1, qty) } : i));
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(i => (i.id !== id && i.productId !== id)));
  };

  const handleSaveStep1 = async (generateLink = false) => {
    if (!isAdmin) return;
    if (!selectedCustomerId && !isCreatingCustomer) {
      alert("Selecione ou crie um cliente!");
      return;
    }

    setSaving(true);
    try {
      let customerId = selectedCustomerId;
      let customer = allCustomers.find(c => c.id === customerId);

      if (isCreatingCustomer) {
        const newId = await addCustomer({
          name: newCustomerData.name,
          contact: newCustomerData.contact,
          companyId: order?.companyId || "pallyra",
          cpfCnpj: "",
          birthDate: "",
          address: "",
          number: "",
          neighborhood: "",
          city: "",
          state: "",
          zipCode: "",
          totalSpent: 0,
          ordersCount: 0
        });
        if (newId) customerId = newId;
      }

      const orderData: Partial<Order> = {
        ...order,
        items,
        total,
        shippingCost: freight,
        observations,
        deliveryDate,
        customerName: customer?.name || newCustomerData.name,
        contact: customer?.contact || newCustomerData.contact,
        customerCpfCnpj: customer?.cpfCnpj || "",
        status: generateLink ? "waiting_payment" : "quote",
        source: "admin",
      };

      if (order?.id) {
        await updateOrder(order.id, orderData);
        setOrder({ ...order, ...orderData });
      } else {
        const orderId = await saveSale(orderData);
        if (orderId) {
          navigate(`/checkout/${orderId}`);
        }
      }

      if (generateLink) {
        setStep(2);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStep2 = async () => {
    setSaving(true);
    try {
      if (order?.id) {
        const updatedData: Partial<Order> = {
          customerName: customerForm.nome,
          contact: customerForm.contato,
          customerCpfCnpj: customerForm.cpfCnpj,
          address: `${customerForm.endereco}, ${customerForm.numero} ${customerForm.complemento} - ${customerForm.cidade}/${customerForm.estado}`,
          observations: `${observations}\nOBS CLIENTE: ${customerForm.observacoes}`,
          status: "waiting_payment"
        };
        await updateOrder(order.id, updatedData);
        
        // Auto-update or create customer record
        await syncCustomerFromCheckout(order.companyId || "pallyra", {
          name: customerForm.nome,
          contact: customerForm.contato,
          cpfCnpj: customerForm.cpfCnpj,
          email: customerForm.email,
          address: customerForm.endereco,
          city: customerForm.cidade,
          state: customerForm.estado,
          zipCode: customerForm.cep,
          number: customerForm.numero,
          neighborhood: customerForm.complemento // Using complemento as neighborhood fallback if needed or just skip
        });

        setOrder(prev => ({ ...prev, ...updatedData }));
        setStep(3);
      }
    } catch (error) {
      console.error("Save step 2 error:", error);
    } finally {
      setSaving(false);
    }
  };

  const renderProductList = (readonly = false) => (
    <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
        <Package size={16} className="text-lilac" /> Produtos do Pedido
      </h2>

      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-4 px-6 text-[9px] font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-2">Produto</div>
          <div className="text-center">Quantidade</div>
          <div className="text-right">Valor Unit.</div>
        </div>

        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div 
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={item.id} 
              className="group flex flex-col md:grid md:grid-cols-4 items-center gap-4 p-4 bg-slate-50/50 rounded-[1.5rem] border border-lilac/5 hover:border-lilac/20 transition-all"
            >
              <div className="col-span-2 flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-xl bg-white border border-lilac/10 overflow-hidden shrink-0">
                  <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 uppercase tracking-tight line-clamp-1">{item.product_name}</p>
                  <p className="text-[10px] font-bold text-lilac">#{item.code}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 w-full md:w-auto">
                {!readonly && (
                  <button 
                    onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-lilac/10 flex items-center justify-center text-slate-400 hover:text-lilac transition-colors"
                  >-</button>
                )}
                <span className="text-sm font-black w-8 text-center">{item.quantity}</span>
                {!readonly && (
                  <button 
                    onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-white border border-lilac/10 flex items-center justify-center text-slate-400 hover:text-lilac transition-colors"
                  >+</button>
                )}
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
                <p className="text-sm font-black text-slate-900">R$ {item.current_price.toFixed(2).replace('.', ',')}</p>
                {!readonly && (
                  <button 
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-rose-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {items.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-lilac/10 rounded-[2rem] bg-slate-50/50">
            <div className="p-4 rounded-full bg-white shadow-sm">
              <AlertCircle className="text-lilac/40" size={32} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Nenhum produto adicionado</p>
          </div>
        )}
      </div>

      {!readonly && (
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-hover:text-lilac transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Adicionar produto por nome ou código..."
            className="w-full pl-16 pr-6 py-5 bg-[#FAF9F6] border border-lilac/10 rounded-2xl text-sm font-bold focus:border-lilac outline-none transition-all"
          />
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {allProducts.slice(0, 6).map(p => (
              <button
                key={p.id}
                onClick={() => handleAddItem(p)}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-transparent hover:border-lilac/20 hover:bg-white transition-all text-left"
              >
                <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-900 truncate">{p.product_name}</p>
                  <p className="text-[9px] font-bold text-lilac">R$ {p.current_price.toFixed(2).replace('.', ',')}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );

  const renderFinancialSummary = (readonly = false) => (
    <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm sticky top-28">
      <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
        <FileText size={16} className="text-lilac" /> Resumo do Pedido
      </h2>

      <div className="space-y-6">
        {!readonly ? (
          <div className="space-y-4 pb-8 border-b border-gray-50">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Desconto (R$)</label>
              <input 
                type="number" 
                value={discount === 0 ? "" : discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-lilac outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Frete (R$)</label>
              <input 
                type="number" 
                value={freight === 0 ? "" : freight}
                onChange={(e) => setFreight(Number(e.target.value))}
                className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-lilac outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Previsão de Entrega</label>
              <input 
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-lilac outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-6 border-b border-gray-50">
             <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Status</span>
              <span className="text-lilac uppercase">{order?.status}</span>
            </div>
            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <span>Entrega Prevista</span>
              <span className="text-slate-700">{deliveryDate || "N/A"}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2).replace('.', ',')}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[10px] font-black text-rose-400 uppercase tracking-widest">
              <span>Desconto</span>
              <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          {freight > 0 && (
            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Frete</span>
              <span>+ R$ {freight.toFixed(2).replace('.', ',')}</span>
            </div>
          )}
          <div className="flex justify-between pt-4 border-t border-lilac/10">
            <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">Total Geral</span>
            <span className="text-xl font-black text-slate-900">R$ {total.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {step === 1 && isAdmin && (
          <div className="flex flex-col gap-3 pt-6">
            <button 
              onClick={() => handleSaveStep1(false)}
              disabled={saving}
              className="w-full py-5 rounded-2xl bg-white border border-lilac/20 text-slate-900 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <Save size={16} /> {saving ? "Salvando..." : "Salvar Rascunho"}
            </button>
            <button 
              onClick={() => handleSaveStep1(true)}
              disabled={saving}
              className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              <LinkIcon size={16} /> {saving ? "Processando..." : "Gerar Link de Pagamento"}
            </button>
          </div>
        )}
      </div>
    </section>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-lilac border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-20">
      <header className="bg-white border-b border-lilac/5 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex items-center gap-3">
              {brandTheme.logo ? (
                <img src={brandTheme.logo} alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-lilac/10 flex items-center justify-center text-lilac font-black">
                  <Package size={20} />
                </div>
              )}
              <h1 className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                Checkout {order?.code ? `#${order.code}` : "Novo Pedido"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                  step === s 
                    ? "bg-slate-900 text-white border-slate-900" 
                    : step > s 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-white text-slate-400 border-slate-100 opacity-50"
                }`}
              >
                <span className="text-[10px] font-black">{s}</span>
                <span className="text-[9px] font-black uppercase tracking-widest hidden md:inline">
                  {s === 1 ? "Pedido" : s === 2 ? "Cadastro" : "Pagamento"}
                </span>
                {step > s && <CheckCircle2 size={12} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 mt-4">
        {step === 1 && isAdmin && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                    <Users size={16} className="text-lilac" /> 1. Cliente
                  </h2>
                  <button 
                    onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
                    className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                      isCreatingCustomer ? "bg-rose-50 text-rose-500" : "bg-lilac/5 text-lilac hover:bg-lilac/10"
                    }`}
                  >
                    {isCreatingCustomer ? "Cancelar" : "+ Novo Cliente"}
                  </button>
                </div>

                {isCreatingCustomer ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text" 
                        placeholder="Nome do cliente"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-lilac outline-none transition-all"
                        value={newCustomerData.name}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                      <input 
                        type="text" 
                        placeholder="(00) 0 0000-0000"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold focus:border-lilac outline-none transition-all"
                        value={newCustomerData.contact}
                        onChange={(e) => setNewCustomerData({ ...newCustomerData, contact: e.target.value })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      className="w-full pl-16 pr-6 py-5 bg-[#FAF9F6] border border-lilac/10 rounded-[1.5rem] text-sm font-bold appearance-none focus:border-lilac outline-none transition-all cursor-pointer"
                      value={selectedCustomerId}
                      onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                      <option value="">Buscar cliente na lista...</option>
                      {allCustomers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} - {c.contact}</option>
                      ))}
                    </select>
                  </div>
                )}
              </section>
              {renderProductList(false)}
            </div>
            <div className="space-y-8">
              {renderFinancialSummary(false)}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-lilac/10 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-8 flex items-center gap-4">
                   <UserPlus className="text-lilac" size={24} /> Meus Dados Cadastrais
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                      <input 
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.nome}
                        onChange={(e) => setCustomerForm({...customerForm, nome: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label>
                      <input 
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.contato}
                        onChange={(e) => setCustomerForm({...customerForm, contato: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF / CNPJ</label>
                      <input 
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.cpfCnpj}
                        onChange={(e) => setCustomerForm({...customerForm, cpfCnpj: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</label>
                      <input 
                        type="email"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.email}
                        onChange={(e) => setCustomerForm({...customerForm, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label>
                        <input 
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                          value={customerForm.cep}
                          onChange={(e) => setCustomerForm({...customerForm, cep: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado</label>
                        <input 
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                          value={customerForm.estado}
                          onChange={(e) => setCustomerForm({...customerForm, estado: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Endereço</label>
                      <input 
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.endereco}
                        onChange={(e) => setCustomerForm({...customerForm, endereco: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label>
                        <input 
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                          value={customerForm.numero}
                          onChange={(e) => setCustomerForm({...customerForm, numero: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label>
                        <input 
                          type="text"
                          className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                          value={customerForm.cidade}
                          onChange={(e) => setCustomerForm({...customerForm, cidade: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Complemento</label>
                      <input 
                        type="text"
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac"
                        value={customerForm.complemento}
                        onChange={(e) => setCustomerForm({...customerForm, complemento: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações do Pedido</label>
                      <textarea 
                        rows={3}
                        className="w-full bg-[#FAF9F6] border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac resize-none"
                        value={customerForm.observacoes}
                        onChange={(e) => setCustomerForm({...customerForm, observacoes: e.target.value})}
                        placeholder="Ex: Cor da fita, detalhes extras..."
                      />
                    </div>
                </div>

                <div className="mt-12 flex justify-end">
                  <button 
                    onClick={handleSaveStep2}
                    disabled={saving}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center gap-3 shadow-xl"
                  >
                    {saving ? "Salvando..." : "Continuar para Pagamento"} <ArrowRight size={16} />
                  </button>
                </div>
              </section>
            </div>
            <div className="space-y-8">
              {renderFinancialSummary(true)}
              {renderProductList(true)}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <section className="bg-white rounded-[2.5rem] p-10 border border-lilac/10 shadow-sm text-center flex flex-col items-center justify-center">
               <div className="inline-flex p-6 rounded-full bg-emerald-50 text-emerald-500 mb-8">
                 <CheckCircle2 size={48} />
               </div>
               <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic mb-4">Pedido Cadastrado!</h2>
               <p className="text-slate-500 font-sans text-[11px] uppercase tracking-[0.2em] leading-relaxed mb-10">
                 Seus dados foram salvos com sucesso. Agora escolha a melhor forma de pagamento abaixo.
               </p>

               <div className="w-full space-y-4">
                  <button className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:scale-[1.02] transition-all">
                    <Truck size={18} /> Pagar com PIX (5% OFF)
                  </button>
                  <button className="w-full py-5 rounded-2xl bg-white border border-lilac/20 text-slate-900 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                    <CreditCard size={18} /> Cartão de Crédito
                  </button>
               </div>
            </section>

             <div className="space-y-8">
              {renderFinancialSummary(true)}
              <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">Confirmar Endereço</h3>
                <div className="space-y-2 opacity-60">
                  <p className="text-xs font-bold text-slate-700">{customerForm.nome}</p>
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">
                    {customerForm.endereco}, {customerForm.numero}<br/>
                    {customerForm.cidade} - {customerForm.estado}<br/>
                    CEP: {customerForm.cep}
                  </p>
                </div>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
