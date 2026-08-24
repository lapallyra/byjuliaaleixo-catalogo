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
  FileText,
  Copy,
  Clock,
  Lock,
  Upload,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { 
  getOrderByCode, 
  getSiteSettings, 
  getGlobalSettings,
  subscribeToCustomers, 
  getProducts,
  addCustomer,
  syncCustomerFromCheckout
} from "../services/firebaseService";
import { playSuccessSound } from "../utils/audio";
import { 
  Order, 
  Customer, 
  Product, 
  CartItem, 
  CompanyId, 
  AppConfig 
} from "../types";
import { useAuth } from "./AuthProvider";
import { LoadingScreen } from "./LoadingScreen";
import { getPublicAtelierImage } from "../utils/atelierImage";
import { validateCPF, validateCNPJ } from "../utils/validation";


interface CheckoutPageProps {
  config: AppConfig;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ config }) => {
  const { id: urlId, code: urlCode } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustmentComment, setAdjustmentComment] = useState("");
  const [order, setOrder] = useState<Partial<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Payment states and objects
  const [paymentSelected, setPaymentSelected] = useState<"PIX" | "CREDIT_CARD" | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(600); // 10 minutes countdown
  const [isPaying, setIsPaying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paymentRedirectStatus, setPaymentRedirectStatus] = useState<"success" | "pending" | "failure" | null>(null);
  const [payingError, setPayingError] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<any>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const products = await getProducts();
        setAllProducts(products);

        let unsubCustomers;
        if (isAdmin) {
          unsubCustomers = subscribeToCustomers((customers) => {
            setAllCustomers(customers);
          });
        }

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

              // Handle redirect from Mercado Pago approval in client's browser
              const params = new URLSearchParams(window.location.search);
              const paymentStatusFromUrl = params.get('payment_status') || params.get('status') || params.get('collection_status');
              let fetchedStatus = fetched.status || "pending";

              if (paymentStatusFromUrl === 'approved' || paymentStatusFromUrl === 'success') {
                fetchedStatus = 'paid';
                setIsPaid(true);
                setPaymentRedirectStatus('success');
                playSuccessSound();
                try {
                  const purchaseInfo = {
                    id: fetched.id || crypto.randomUUID(),
                    customerName: fetched.customerName || 'Cliente',
                    productName: fetched.items?.[0]?.product_name || 'um produto especial',
                    timeAgo: 'agora mesmo em São Paulo - SP',
                    companyId: fetched.companyId || 'pallyra'
                  };
                  localStorage.setItem('pending_own_purchase_notification', JSON.stringify(purchaseInfo));
                } catch (e) {
                  console.error(e);
                }
                await fetch('/api/checkout/update-order', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ orderId: fetched.id, updateData: { status: 'paid' } })
                });
                // Strip the redirection search parameters
                navigate(window.location.pathname, { replace: true });
              } else if (paymentStatusFromUrl === 'pending' || paymentStatusFromUrl === 'in_process') {
                setPaymentRedirectStatus('pending');
                navigate(window.location.pathname, { replace: true });
              } else if (paymentStatusFromUrl === 'rejected' || paymentStatusFromUrl === 'cancelled' || paymentStatusFromUrl === 'failed' || paymentStatusFromUrl === 'failure') {
                setPaymentRedirectStatus('failure');
                navigate(window.location.pathname, { replace: true });
              } else if (fetchedStatus === 'paid' || fetched.paymentStatus === 'paid') {
                setIsPaid(true);
                setPaymentRedirectStatus('success');
              }

              // Permission Logic
              // Sequences always progress: 1 Personalização → 2 Dados e Endereço → 3 Revisão → 4 Pagamento
              if (fetchedStatus === "paid" || fetched.paymentStatus === "paid" || paymentStatusFromUrl === "approved" || paymentStatusFromUrl === "success") {
                setStep(4);
              } else {
                setStep(1);
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
              setSiteSettings(settings);
              setBrandTheme({
                primary: settings.theme_primary_color || brandTheme.primary,
                secondary: settings.theme_accent_color || brandTheme.secondary,
                logo: getPublicAtelierImage(settings) || ""
              });
            }
            const gSettings = await getGlobalSettings();
            if (gSettings) {
              setGlobalSettings(gSettings);
            }
          }
        }
        
        return () => unsubCustomers && unsubCustomers();
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [urlId, urlCode, isAdmin]);

  // Pix auto-countdown effect
  useEffect(() => {
    if (paymentSelected !== 'PIX' || isPaid) return;
    const interval = setInterval(() => {
      setPixTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paymentSelected, isPaid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProcessedPayment = async (type: 'PIX' | 'CREDIT_CARD') => {
    if (!order?.id || isPaying) return;
    setIsPaying(true);
    setPayingError(null);
    try {
      const token = globalSettings?.mercadopago_token || siteSettings?.mercadopago_token;
      
      if (token) {
        // Real Mercado Pago preference creation
        const finalMpItems = items.map(item => ({
          title: item.product_name,
          quantity: item.quantity,
          unit_price: item.current_price,
          currency_id: 'BRL'
        }));

        const preferencePayload = {
          orderId: order.code || order.id,
          companyId: order.companyId || "pallyra",
          items: finalMpItems,
          payer: {
            name: customerForm.nome || "Cliente",
            email: customerForm.email || "cliente@loja.com" 
          },
          back_urls: {
            success: `${window.location.origin}/checkout/${order.id}?payment_status=approved&order_id=${order.id}`,
            failure: `${window.location.origin}/checkout/${order.id}?payment_status=failed&order_id=${order.id}`,
            pending: `${window.location.origin}/checkout/${order.id}?payment_status=pending&order_id=${order.id}`
          },
          accessToken: token,
          auto_return: "approved"
        };

        const response = await fetch('/api/payment/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order?.id })
        });

        if (!response.ok) {
          throw new Error("Falha ao gerar link Mercado Pago.");
        }

        const data = await response.json();
        const initPoint = data?.init_point;
        if (initPoint) {
          window.location.href = initPoint;
          return;
        }
      }
      
      throw new Error("Configuração de pagamento indisponível.");
    } catch (err: any) {
      console.error(err);
      setPayingError(err.message || "Erro desconhecido no processamento.");
      setIsPaying(false);
    }
  };

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
        customerId: customerId || undefined,
        status: generateLink ? "waiting_payment" : "quote",
        source: "admin",
      };

      let orderId = order?.id;
      if (order?.id) {
        const response = await fetch('/api/checkout/update-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, updateData: orderData })
        });
        const result = await response.json();
        if (result.success) {
          setOrder({ ...order, ...orderData });
        }
      } else {
        const response = await fetch('/api/checkout/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        const result = await response.json();
        if (result.success) {
          orderId = result.orderId;
          setOrder({ ...orderData, id: orderId });
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
    const doc = customerForm.cpfCnpj.replace(/[^\d]/g, '');
    if (doc.length > 0) {
      if (doc.length === 11 && !validateCPF(doc)) {
          alert("CPF inválido!");
          return;
      }
      if (doc.length === 14 && !validateCNPJ(doc)) {
          alert("CNPJ inválido!");
          return;
      }
      if (doc.length !== 11 && doc.length !== 14) {
          alert("CPF ou CNPJ com tamanho inválido!");
          return;
      }
    } else {
        alert("CPF ou CNPJ é obrigatório!");
        return;
    }

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
        await fetch('/api/checkout/update-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order.id, updateData: updatedData })
        });
        
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

        <div className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Subtotal</label>
              <div className="text-[14px] font-black text-slate-900">
                R$ {subtotal.toFixed(2).replace('.', ',')}
              </div>
            </div>
            {discount > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest leading-none">Desconto</label>
                <div className="text-[14px] font-black text-rose-500">
                  - R$ {discount.toFixed(2).replace('.', ',')}
                </div>
              </div>
            )}
            {freight > 0 && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Frete</label>
                <div className="text-[14px] font-black text-slate-900">
                  + R$ {freight.toFixed(2).replace('.', ',')}
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-6 border-t border-lilac/10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Geral Liquido</label>
            <div className="text-3xl font-black text-slate-900 tracking-tighter mt-1">
              R$ {total.toFixed(2).replace('.', ',')}
            </div>
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
    return <LoadingScreen />;
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
            {[1, 2, 3, 4].map((s) => (
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
                  {s === 1 ? "Personalização" : s === 2 ? "Dados e Endereço" : s === 3 ? "Revisão" : "Pagamento"}
                </span>
                {step > s && <CheckCircle2 size={12} />}
              </div>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 mt-4">
        {step === 1 && (
          urlId === "new" && isAdmin ? (
            // Original Admin new order creation panel
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
          ) : (
            // Existing order: Client/Admin Personalization & Approvals flow
            (() => {
              const orderHasPersonalization = items.some(item => {
                const p = allProducts.find(prod => prod.id === item.productId || prod.id === item.id);
                return p?.personalizationSettings && p.personalizationSettings.length > 0;
              });

              if (!orderHasPersonalization) {
                // Requirement 2: Keep step 1 visible, fields disabled, friendly message
                return (
                  <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-lilac/10 p-8 sm:p-12 text-center space-y-8 shadow-sm">
                    <div className="w-20 h-20 bg-lilac/5 rounded-full flex items-center justify-center text-lilac mx-auto">
                      <Package size={36} />
                    </div>
                    <div className="space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-lilac bg-lilac/5 px-5 py-2 rounded-full inline-block">
                        Etapa 01: Personalização
                      </span>
                      <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                        Personalização Não Necessária
                      </h2>
                      <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed font-medium">
                        Este produto ou os itens selecionados não necessitam de personalização ou customizações de arte adicionais. Você pode avançar diretamente para o preenchimento de seus dados de entrega.
                      </p>
                    </div>
                    <div className="pt-4 flex justify-center">
                      <button
                        onClick={() => setStep(2)}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest py-5 px-10 rounded-2xl transition-all shadow-md flex items-center gap-2"
                      >
                        <span>Avançar para Dados e Endereço</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              }

              // Requirement 3: Admin created order has "Approved / Adjustments" flow
              if (order?.source === "admin" || (order?.source as any) === "quote" || (order?.source as any) === "internal") {
                return (
                  <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-lilac/10 p-8 sm:p-12 space-y-8 shadow-sm">
                    <div className="flex items-center justify-between border-b border-lilac/15 pb-6">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-lilac bg-lilac/5 px-4 py-1.5 rounded-full inline-block mb-2">
                          Etapa 01: Personalização
                        </span>
                        <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                          Aprovação de Arte e Personalização
                        </h2>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        order?.approvalStatus === 'approved' 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : order?.approvalStatus === 'adjustments_requested'
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-blue-50 text-blue-600'
                      }`}>
                        {order?.approvalStatus === 'approved' 
                          ? 'Aprovada' 
                          : order?.approvalStatus === 'adjustments_requested'
                            ? 'Ajustes Solicitados'
                            : 'Pendente de Aprovação'}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Resumo dos Itens Personalizados:</h3>
                      <div className="space-y-4">
                        {items.map((item, idx) => (
                          <div key={item.id || idx} className="p-5 bg-[#FAF9F6] border border-lilac/10 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <img src={item.image} className="w-12 h-12 rounded-xl object-cover border border-lilac/10" />
                              <div>
                                <p className="text-sm font-black text-slate-900 uppercase">{item.product_name}</p>
                                <p className="text-[10px] font-bold text-lilac">Qtd: {item.quantity}</p>
                              </div>
                            </div>
                            <div className="space-y-1">
                              {item.personalizationValues && Object.keys(item.personalizationValues).length > 0 ? (
                                Object.entries(item.personalizationValues).map(([key, val]) => {
                                  const prod = allProducts.find(p => p.id === item.productId || p.id === item.id);
                                  const field = (prod?.personalizationSettings || item.personalizationSettings)?.find(s => s.id === key);
                                  const label = field?.label || key;
                                  
                                  if (field?.type === 'image') {
                                    const imgUrls = val.split(',').filter(Boolean);
                                    if (imgUrls.length === 0) return null;
                                    return (
                                      <div key={key} className="text-xs text-slate-700 font-medium flex items-center gap-1.5 mt-1">
                                        <span className="font-bold uppercase text-[9px] text-slate-400 mr-1">{label}:</span>
                                        <div className="flex gap-1">
                                          {imgUrls.map((url, uIdx) => (
                                            <a 
                                              key={uIdx} 
                                              href={url} 
                                              target="_blank" 
                                              referrerPolicy="no-referrer"
                                              rel="noreferrer" 
                                              className="w-6 h-6 rounded border border-black/10 overflow-hidden block hover:scale-105 transition-transform"
                                            >
                                              <img src={url} alt="Ref" className="w-full h-full object-cover" />
                                            </a>
                                          ))}
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <p key={key} className="text-xs text-slate-700 font-medium">
                                      <span className="font-bold uppercase text-[9px] text-slate-400 mr-1">{label}:</span> {val}
                                    </p>
                                  );
                                })
                              ) : (
                                <p className="text-xs italic text-slate-400">Personalização descrita em observações gerais.</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order?.observations && (
                      <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Instruções de Arte Adicionais:</h4>
                        <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap">{order.observations}</p>
                      </div>
                    )}

                    <div className="pt-6 border-t border-lilac/10 space-y-4">
                      {order?.approvalStatus !== 'approved' ? (
                        <>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <button
                              onClick={async () => {
                                if (order?.id) {
                                  await fetch('/api/checkout/update-order', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: order.id, updateData: { approvalStatus: 'approved' } })
                                  });
                                  setOrder(prev => prev ? { ...prev, approvalStatus: 'approved' } : null);
                                }
                              }}
                              className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md"
                            >
                              <CheckCircle2 size={16} /> Aprovar Arte e Continuar
                            </button>
                            <button
                              onClick={() => setIsAdjusting(true)}
                              className="flex-1 py-5 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-sm"
                            >
                              <AlertCircle size={16} /> Solicitar Ajustes de Arte
                            </button>
                          </div>

                          {isAdjusting && (
                            <div className="bg-[#FFF8F8] border border-rose-100 p-6 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300">
                              <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Descreva os Ajustes Desejados:</label>
                              <textarea
                                value={adjustmentComment}
                                onChange={(e) => setAdjustmentComment(e.target.value)}
                                rows={4}
                                className="w-full bg-white border border-rose-100 rounded-2xl p-4 text-xs font-semibold outline-none focus:border-rose-350"
                                placeholder="Por favor, detalhe o que deseja mudar na arte..."
                              />
                              <div className="flex gap-4">
                                <button
                                  onClick={async () => {
                                    if (!order?.id || !adjustmentComment.trim()) return;
                                    try {
                                      const nextVersion = (order.currentVersion || 1) + 1;
                                      await fetch(`/api/orders/${order.id}/version`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          versionData: {
                                            orderId: order.id,
                                            version: nextVersion,
                                            data: order,
                                            comment: adjustmentComment,
                                            author: 'customer'
                                          }
                                        })
                                      });
                                      await fetch('/api/checkout/update-order', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ orderId: order.id, updateData: { 
                                          approvalStatus: 'adjustments_requested',
                                          currentVersion: nextVersion 
                                        } })
                                      });
                                      setOrder(prev => prev ? { ...prev, approvalStatus: 'adjustments_requested', currentVersion: nextVersion } : null);
                                      setIsAdjusting(false);
                                      setAdjustmentComment('');
                                    } catch (e) {
                                      console.error(e);
                                    }
                                  }}
                                  className="px-6 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition-colors"
                                >
                                  Enviar Solicitação
                                </button>
                                <button
                                  onClick={() => setIsAdjusting(false)}
                                  className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-2xl flex items-center gap-3 text-xs font-semibold">
                            <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                            <span>Arte aprovada com sucesso! Você pode avançar com o preenchimento dos dados.</span>
                          </div>
                          <div className="flex justify-end">
                            <button
                              onClick={() => setStep(2)}
                              className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center gap-2 transition-all shadow-md"
                            >
                              <span>Avançar para Cadastro</span> <ArrowRight size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // Standard catalog order with personalization: editable fields
              return (
                <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] border border-lilac/10 p-8 sm:p-12 space-y-8 shadow-sm">
                  <div className="border-b border-lilac/15 pb-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-lilac bg-lilac/5 px-4 py-1.5 rounded-full inline-block mb-2">
                      Etapa 01: Personalização
                    </span>
                    <h2 className="text-2xl font-black uppercase text-slate-900 tracking-tight">
                      Personalização do seu Pedido
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 font-medium">Insira abaixo os dados de personalização para cada item:</p>
                  </div>

                  <div className="space-y-8">
                    {items.map((item, idx) => {
                      const p = allProducts.find(prod => prod.id === item.productId || prod.id === item.id);
                      const hasFields = p?.personalizationSettings && p.personalizationSettings.length > 0;
                      
                      return (
                        <div key={item.id || idx} className="p-6 bg-slate-50/50 border border-lilac/5 rounded-3xl space-y-6">
                          <div className="flex items-center gap-4">
                            <img src={item.image} className="w-12 h-12 rounded-xl object-cover border border-lilac/10" />
                            <div>
                              <h4 className="text-sm font-black text-slate-900 uppercase">{item.product_name}</h4>
                              <p className="text-[10px] font-bold text-lilac">Código: #{item.code || item.id}</p>
                            </div>
                          </div>

                          {hasFields ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {p.personalizationSettings.map(field => (
                                <div key={field.id} className="space-y-2">
                                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    {field.label} {field.isRequired && <span className="text-rose-500">*</span>}
                                  </label>
                                  {field.type === 'select' ? (
                                    <select
                                      className="w-full bg-white border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac transition-all"
                                      value={item.personalizationValues?.[field.id] || ""}
                                      onChange={(e) => {
                                        const updatedItems = [...items];
                                        updatedItems[idx] = {
                                          ...item,
                                          personalizationValues: {
                                            ...(item.personalizationValues || {}),
                                            [field.id]: e.target.value
                                          }
                                        };
                                        setItems(updatedItems);
                                      }}
                                    >
                                      <option value="">Selecione uma opção...</option>
                                      {field.options?.map((opt, oIdx) => (
                                        <option key={oIdx} value={opt}>{opt}</option>
                                      ))}
                                    </select>
                                  ) : field.type === 'image' ? (
                                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 text-left">
                                      <div className="flex flex-wrap gap-2">
                                        {(item.personalizationValues?.[field.id] || "").split(",").filter(Boolean).map((imgUrl, imgIdx) => (
                                          <div key={imgIdx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 group bg-white shadow-xs">
                                            <img src={imgUrl.trim()} alt="Ref" className="w-full h-full object-cover" />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const currentUrls = (item.personalizationValues?.[field.id] || "").split(",").filter(Boolean);
                                                const updatedUrls = currentUrls.filter((_, i) => i !== imgIdx);
                                                const updatedItems = [...items];
                                                updatedItems[idx] = {
                                                  ...item,
                                                  personalizationValues: {
                                                    ...(item.personalizationValues || {}),
                                                    [field.id]: updatedUrls.join(",")
                                                  }
                                                };
                                                setItems(updatedItems);
                                              }}
                                              className="absolute top-1 right-1 p-1 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-sm flex items-center justify-center transition-colors"
                                            >
                                              <X size={10} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {((item.personalizationValues?.[field.id] || "").split(",").filter(Boolean)).length < 2 && (
                                        <div className="relative">
                                          <input
                                            type="file"
                                            accept="image/*"
                                            id={`checkout-upload-${item.id}-${field.id}`}
                                            className="hidden"
                                            onChange={async (e) => {
                                              const file = e.target.files?.[0];
                                              if (!file) return;
                                              const allowedTypes = ["image/png", "image/jpeg", "image/webp"];
                                              if (!allowedTypes.includes(file.type)) {
                                                alert("Formato não suportado. PNG, JPG ou WEBP.");
                                                return;
                                              }
                                              try {
                                                const { compressImage, uploadImage } = await import("../services/firebaseStorageService");
                                                const compressedFile = await compressImage(file);
                                                const path = `sales_personalization/ref_${Date.now()}`;
                                                const { promise } = uploadImage(compressedFile, path);
                                                const url = await promise;
                                                const currentUrls = (item.personalizationValues?.[field.id] || "").split(",").filter(Boolean);
                                                const updatedUrls = [...currentUrls, url];
                                                const updatedItems = [...items];
                                                updatedItems[idx] = {
                                                  ...item,
                                                  personalizationValues: {
                                                    ...(item.personalizationValues || {}),
                                                    [field.id]: updatedUrls.join(",")
                                                  }
                                                };
                                                setItems(updatedItems);
                                              } catch (err) {
                                                console.error(err);
                                                alert("Erro ao enviar a imagem de referência.");
                                              }
                                            }}
                                          />
                                          <label
                                            htmlFor={`checkout-upload-${item.id}-${field.id}`}
                                            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer transition-colors"
                                          >
                                            <Upload size={12} />
                                            <span>Adicionar Imagem</span>
                                          </label>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <input
                                      type="text"
                                      className="w-full bg-white border border-lilac/10 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-lilac transition-all"
                                      placeholder={field.placeholder || `Digite ${field.label.toLowerCase()}...`}
                                      value={item.personalizationValues?.[field.id] || ""}
                                      onChange={(e) => {
                                        const updatedItems = [...items];
                                        updatedItems[idx] = {
                                          ...item,
                                          personalizationValues: {
                                            ...(item.personalizationValues || {}),
                                            [field.id]: e.target.value
                                          }
                                        };
                                        setItems(updatedItems);
                                      }}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 font-semibold italic">Este item específico não possui campos de personalização adicionais.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-lilac/10 flex justify-end">
                    <button
                      onClick={() => {
                        let isValid = true;
                        for (const item of items) {
                          const p = allProducts.find(prod => prod.id === item.productId || prod.id === item.id);
                          if (p?.personalizationSettings) {
                            for (const field of p.personalizationSettings) {
                              if (field.isRequired && !item.personalizationValues?.[field.id]?.trim()) {
                                alert(`O campo "${field.label}" é obrigatório para o produto "${item.product_name}".`);
                                isValid = false;
                                return;
                              }
                            }
                          }
                        }
                        if (isValid) {
                          setStep(2);
                        }
                      }}
                      className="px-10 py-5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
                    >
                      <span>Salvar e Avançar</span> <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })()
          )
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

        {step === 4 && (paymentRedirectStatus === 'success' || (isPaid && !paymentRedirectStatus)) ? (
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-emerald-100 p-8 sm:p-12 text-center space-y-8 shadow-md animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto">
              <CheckCircle2 size={48} className="animate-pulse" />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00AF54] bg-[#E5FDF1] px-5 py-2 rounded-full inline-block">
                Pagamento Recebido
              </span>
              <h2 className="text-2.5xl font-extrabold uppercase text-[#111111] font-sans tracking-tight">
                Recebimento Efetuado! 🎉
              </h2>
              <p className="text-xs text-[#6D5443] max-w-md mx-auto leading-relaxed font-medium">
                Seu pagamento foi recebido com sucesso no valor de <strong>R$ {total.toFixed(2).replace('.', ',')}</strong> para o pedido <strong>#{order?.code || ''}</strong>. 
                A confirmação definitiva e a atualização de status ocorrerão automaticamente via webhook em alguns instantes.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl text-left divide-y divide-slate-150 space-y-3">
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Pedido</span>
                <span className="font-extrabold text-slate-800">#{order?.code || 'PALLYRA'}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Valor Pago</span>
                <span className="font-mono text-slate-900 font-extrabold">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Titular</span>
                <span className="font-extrabold text-slate-800 uppercase">{customerForm.nome || order?.customerName || 'Cliente'}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Contato</span>
                <span className="font-extrabold text-slate-800">{customerForm.contato || order?.contact || '-'}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              {order?.code && (
                <button
                  onClick={() => navigate(`/rastreamento?code=${order.code}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Acompanhar Pedido</span>
                </button>
              )}
              <a
                href={`https://wa.me/55${(customerForm.contato || order?.contact || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá! Acabei de finalizar o pagamento do pedido #${order?.code || ''} no valor de R$ ${total.toFixed(2).replace('.', ',')} no Ateliê.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Falar via WhatsApp</span>
              </a>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        ) : step === 4 && paymentRedirectStatus === 'pending' ? (
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-amber-100 p-8 sm:p-12 text-center space-y-8 shadow-md animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mx-auto">
              <Clock size={48} className="animate-pulse text-amber-500" />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 px-5 py-2 rounded-full inline-block">
                Pagamento em Análise
              </span>
              <h2 className="text-2.5xl font-extrabold uppercase text-[#111111] font-sans tracking-tight">
                Transação em Análise ⏳
              </h2>
              <p className="text-xs text-[#6D5443] max-w-md mx-auto leading-relaxed font-medium">
                Seu pagamento para o pedido <strong>#{order?.code || ''}</strong> está em análise pelo Mercado Pago. 
                Assim que a instituição financeira liberar, o pedido será atualizado automaticamente pelo nosso sistema.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl text-left divide-y divide-slate-150 space-y-3">
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Pedido</span>
                <span className="font-extrabold text-slate-800">#{order?.code || 'PALLYRA'}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Valor</span>
                <span className="font-mono text-slate-900 font-extrabold">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Titular</span>
                <span className="font-extrabold text-slate-800 uppercase">{customerForm.nome || order?.customerName || 'Cliente'}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              {order?.code && (
                <button
                  onClick={() => navigate(`/rastreamento?code=${order.code}`)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Acompanhar Pedido</span>
                </button>
              )}
              <a
                href={`https://wa.me/55${(customerForm.contato || order?.contact || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                  `Olá! Meu pagamento do pedido #${order?.code || ''} no valor de R$ ${total.toFixed(2).replace('.', ',')} está em análise no Mercado Pago.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Falar via WhatsApp</span>
              </a>
              <button
                onClick={() => navigate('/')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all"
              >
                Voltar ao Catálogo
              </button>
            </div>
          </div>
        ) : step === 4 && paymentRedirectStatus === 'failure' ? (
          <div className="max-w-2xl mx-auto bg-white rounded-[2.5rem] border border-red-100 p-8 sm:p-12 text-center space-y-8 shadow-md animate-in fade-in duration-300">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600 bg-red-50 px-5 py-2 rounded-full inline-block">
                Pagamento Não Aprovado
              </span>
              <h2 className="text-2.5xl font-extrabold uppercase text-[#111111] font-sans tracking-tight">
                Ops! Pagamento Recusado ❌
              </h2>
              <p className="text-xs text-[#6D5443] max-w-md mx-auto leading-relaxed font-medium">
                Infelizmente, a transação para o pedido <strong>#{order?.code || ''}</strong> não pôde ser autorizada pelo Mercado Pago. 
                Você pode tentar realizar o pagamento novamente utilizando o mesmo pedido e escolhendo outra forma ou cartão.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100/80 p-5 rounded-2xl text-left divide-y divide-slate-150 space-y-3">
              <div className="flex justify-between text-xs pt-1">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Pedido</span>
                <span className="font-extrabold text-slate-800">#{order?.code || 'PALLYRA'}</span>
              </div>
              <div className="flex justify-between text-xs pt-3">
                <span className="text-slate-400 uppercase font-black tracking-wider text-[9px]">Valor Total</span>
                <span className="font-mono text-slate-900 font-extrabold">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => {
                  setPaymentRedirectStatus(null);
                  setIsPaid(false);
                  setStep(4);
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tentar Novamente</span>
              </button>
              {order?.code && (
                <button
                  onClick={() => navigate(`/rastreamento?code=${order.code}`)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Acompanhar Pedido</span>
                </button>
              )}
              <button
                onClick={() => navigate('/')}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs uppercase tracking-wider py-4 px-8 rounded-xl transition-all"
              >
                Ir para o Início
              </button>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="xl:col-span-2 space-y-8">
              {/* Back Button */}
              <div className="flex justify-start w-full">
                <button 
                  onClick={() => setStep(2)}
                  className="text-[9.5px] font-black uppercase tracking-widest text-[#6D5443] hover:text-[#111111] flex items-center gap-1 transition-all"
                >
                  <ChevronLeft size={12} /> Voltar para Dados e Endereço
                </button>
              </div>

              {/* Bento Section for Reviewing all Data */}
              <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm text-left space-y-8">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] pb-4 border-b border-slate-100 flex items-center gap-3">
                  <FileText size={16} className="text-lilac" /> Revisão dos Seus Dados
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Informações Pessoais</h3>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase">Nome Completo</p>
                      <p className="text-sm font-bold text-slate-800">{customerForm.nome || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase">WhatsApp / Contato</p>
                      <p className="text-sm font-bold text-slate-800">{customerForm.contato || 'Não informado'}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase">CPF / CNPJ</p>
                      <p className="text-sm font-bold text-slate-800">{customerForm.cpfCnpj || 'Não informado'}</p>
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Endereço de Entrega</h3>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase">Rua, Número e Complemento</p>
                      <p className="text-sm font-bold text-slate-800 uppercase">{customerForm.endereco || 'Retirada em loja / Ateliê'}, {customerForm.numero} {customerForm.complemento}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 font-semibold uppercase">Cidade / Estado</p>
                      <p className="text-sm font-bold text-slate-800 uppercase">{customerForm.cidade} {customerForm.estado ? `/ ${customerForm.estado}` : ''}</p>
                    </div>
                    {customerForm.cep && (
                      <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-semibold uppercase">CEP</p>
                        <p className="text-sm font-bold font-mono text-lilac">{customerForm.cep}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Personalization Summary */}
                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personalizações Escolhidas</h3>
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={item.id || idx} className="p-4 bg-[#FAF9F6] border border-lilac/5 rounded-2xl flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 uppercase">{item.product_name}</span>
                        <div className="text-right text-xs">
                          {item.personalizationValues && Object.keys(item.personalizationValues).length > 0 ? (
                            Object.entries(item.personalizationValues).map(([key, val]) => {
                              const prod = allProducts.find(p => p.id === item.productId || p.id === item.id);
                              const field = (prod?.personalizationSettings || item.personalizationSettings)?.find(s => s.id === key);
                              const label = field?.label || key;
                              
                              if (field?.type === 'image') {
                                const imgUrls = val.split(',').filter(Boolean);
                                if (imgUrls.length === 0) return null;
                                return (
                                  <div key={key} className="flex items-center justify-end gap-1 mt-0.5">
                                    <span className="font-bold uppercase text-[9px] text-slate-400 mr-1">{label}:</span>
                                    <div className="flex gap-0.5">
                                      {imgUrls.map((url, uIdx) => (
                                        <a 
                                          key={uIdx} 
                                          href={url} 
                                          target="_blank" 
                                          referrerPolicy="no-referrer"
                                          rel="noreferrer" 
                                          className="w-5 h-5 rounded border border-black/10 overflow-hidden block hover:scale-105 transition-transform"
                                        >
                                          <img src={url} alt="Ref" className="w-full h-full object-cover" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <p key={key} className="text-slate-600 font-medium">
                                  <span className="font-bold uppercase text-[9px] text-slate-400 mr-1">{label}:</span> {val}
                                </p>
                              );
                            })
                          ) : (
                            <span className="text-slate-400 italic">Sem campos adicionais</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {renderProductList(true)}
            </div>

            <div className="space-y-8">
              {renderFinancialSummary(true)}

              <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm text-center space-y-4">
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Ao avançar, seu pedido será reservado e você será direcionado para escolher o método de pagamento seguro (Pix ou Cartão de Crédito).
                </p>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-5 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <span>Confirmar e Escolher Pagamento</span> <ArrowRight size={14} />
                </button>
              </section>
            </div>
          </div>
        ) : step === 4 ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="xl:col-span-2">
              <section className="bg-white rounded-[2.5rem] p-8 sm:p-10 border border-lilac/10 shadow-sm text-center flex flex-col justify-start">
                {/* Back to Step 3 */}
                <div className="flex justify-start w-full mb-3">
                  <button 
                    onClick={() => setStep(3)}
                    className="text-[9.5px] font-black uppercase tracking-widest text-[#6D5443] hover:text-[#111111] flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft size={12} /> Voltar para Revisão
                  </button>
                </div>

               <div className="inline-flex p-5 rounded-full bg-[#FAF8F5] text-[#D4AF37] mb-6 mx-auto">
                 <Clock size={36} />
               </div>
               <h2 className="text-2xl sm:text-2.5xl font-black text-slate-900 uppercase tracking-tight italic mb-2">Selecione o Meio de Pagamento</h2>
               <p className="text-slate-500 font-sans text-xs leading-relaxed mb-6 font-medium">
                 Deseja pagar via Pix com 5% de Desconto Rápido ou Cartão de Crédito?
               </p>

               {payingError && (
                 <div className="p-3 bg-red-50 text-red-600 border border-red-150 rounded-xl text-center text-xs mb-4">
                   {payingError}
                 </div>
               )}

               {paymentSelected === "PIX" ? (
                 <div className="space-y-4 border border-[#E8DCC8]/35 p-5 sm:p-6 rounded-3xl bg-[#FAF8F5]/50 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-[#E8DCC8]/20">
                      <span className="text-[10px] font-black uppercase text-[#6D5443]">Opção Selecionada: PIX ⚡</span>
                      <button 
                        onClick={() => setPaymentSelected(null)}
                        className="text-[9.5px] font-bold text-rose-500 uppercase cursor-pointer"
                      >
                        Alterar
                      </button>
                    </div>

                    <div className="flex flex-col items-center space-y-3.5 pt-2">
                       {/* Pix countdown */}
                       <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                         <Clock size={12} />
                         <span>Expira em: {formatTime(pixTimeLeft)}</span>
                       </div>

                       {/* Simulated elegant vector code container */}
                       <div className="w-36 h-36 border border-neutral-200/50 rounded-xl p-2 bg-white flex items-center justify-center shadow-xs">
                          <svg className="w-full h-full text-neutral-800" viewBox="0 0 100 100">
                             <rect x="10" y="10" width="20" height="20" fill="currentColor"/>
                             <rect x="15" y="15" width="10" height="10" fill="white"/>
                             <rect x="70" y="10" width="20" height="20" fill="currentColor"/>
                             <rect x="75" y="15" width="10" height="10" fill="white"/>
                             <rect x="10" y="70" width="20" height="20" fill="currentColor"/>
                             <rect x="15" y="75" width="10" height="10" fill="white"/>
                             <rect x="35" y="35" width="30" height="30" fill="currentColor"/>
                             <rect x="42" y="42" width="16" height="16" fill="white"/>
                             <rect x="47" y="47" width="6" height="6" fill="currentColor"/>
                             <rect x="35" y="75" width="15" height="15" fill="currentColor"/>
                             <rect x="75" y="35" width="15" height="15" fill="currentColor"/>
                          </svg>
                       </div>

                       <div className="w-full">
                         <label className="text-[9px] font-bold uppercase text-[#6D5443] block mb-1 text-left">Chave Copia e Cola:</label>
                         <div className="flex border border-neutral-200 rounded-xl overflow-hidden bg-white">
                           <input 
                             readOnly
                             type="text"
                             value="00020126360014br.gov.bcb.pix0114juualleixo@gmail.com"
                             className="flex-1 bg-transparent px-3 py-2 text-[10.5px] outline-none text-[#111111] font-mono select-all"
                           />
                           <button 
                             type="button"
                             onClick={() => {
                               navigator.clipboard.writeText("00020126360014br.gov.bcb.pix0114juualleixo@gmail.com");
                               setPixCopied(true);
                               setTimeout(() => setPixCopied(false), 2000);
                             }}
                             className="bg-slate-900 text-white px-4 hover:bg-[#D4AF37] transition-all flex items-center justify-center cursor-pointer font-bold text-xs"
                           >
                             {pixCopied ? "Copiado!" : <Copy size={14} />}
                           </button>
                         </div>
                       </div>

                       <button
                         onClick={() => handleProcessedPayment('PIX')}
                         disabled={isPaying}
                         className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                       >
                         {isPaying ? "Processando..." : "Confirmar Pagamento via Pix"}
                       </button>
                    </div>
                 </div>
               ) : paymentSelected === "CREDIT_CARD" ? (
                 <div className="space-y-4 border border-[#E8DCC8]/35 p-5 sm:p-6 rounded-3xl bg-[#FAF8F5]/50 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center pb-2 border-b border-[#E8DCC8]/20">
                      <span className="text-[10px] font-black uppercase text-[#6D5443]">Cartão de Crédito 💳</span>
                      <button 
                        onClick={() => setPaymentSelected(null)}
                        className="text-[9.5px] font-bold text-rose-500 uppercase cursor-pointer"
                      >
                        Alterar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 text-left pt-2">
                       <button
                         onClick={() => handleProcessedPayment('CREDIT_CARD')}
                         disabled={isPaying}
                         className="w-full h-12 mt-2 bg-slate-900 hover:bg-[#D4AF37] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                       >
                         {isPaying ? "Processando..." : "Ir para Pagamento Seguro MP"}
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="w-full space-y-4">
                    <button 
                      onClick={() => setPaymentSelected("PIX")}
                      className="w-full py-5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      <CheckCircle2 size={18} /> Pagar com PIX (5% OFF)
                    </button>
                    <button 
                      onClick={() => setPaymentSelected("CREDIT_CARD")}
                      className="w-full py-5 rounded-2xl bg-white border border-neutral-200 text-slate-800 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
                    >
                      <CreditCard size={18} /> Cartão de Crédito
                    </button>
                 </div>
               )}
            </section>
            </div>

             <div className="space-y-8">
              {renderFinancialSummary(true)}
              <section className="bg-white rounded-[2.5rem] p-8 border border-lilac/10 shadow-sm text-left">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-6">
                  Endereço de Entrega
                </h3>
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">Destinatário</label>
                    <div className="text-sm font-bold text-slate-900 uppercase">
                      {customerForm.nome || 'Não informado'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">Logradouro / Número</label>
                    <div className="text-sm font-bold text-slate-700 uppercase">
                      {customerForm.endereco || 'Retirada em loja / Ateliê'}, {customerForm.numero}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none block">Cidade / Estado / CEP</label>
                    <div className="text-sm font-bold text-slate-700 uppercase">
                      {customerForm.cidade} {customerForm.estado ? `- ${customerForm.estado}` : ''} <br/>
                      {customerForm.cep && <span className="font-mono text-lilac block mt-1">CEP: {customerForm.cep}</span>}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
