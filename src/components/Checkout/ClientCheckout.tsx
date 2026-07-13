import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Order } from "../../types";
import { Loader2, CheckCircle2 } from "lucide-react";

export const ClientCheckout: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    cpfCnpj: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const q = query(collection(db, "orders"), where("code", "==", code?.toUpperCase()));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          const fetchedOrder = { id: docData.id, ...docData.data() } as Order;
          setOrder(fetchedOrder);
          setFormData(prev => ({
            ...prev,
            nome: fetchedOrder.customerName || "",
            email: fetchedOrder.customerEmail || "",
            cpfCnpj: fetchedOrder.customerCpfCnpj || "",
            endereco: fetchedOrder.address || fetchedOrder.customerAddress || "",
          }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [code]);

  const validateForm = () => {
    if (!formData.nome.trim()) {
      return "O nome completo é obrigatório.";
    }
    if (!formData.email.trim()) {
      return "O e-mail é obrigatório.";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      return "Por favor, insira um e-mail válido.";
    }
    if (!formData.cpfCnpj.trim()) {
      return "O CPF ou CNPJ é obrigatório.";
    }
    if (!formData.cep.trim()) {
      return "O CEP é obrigatório.";
    }
    if (!formData.endereco.trim()) {
      return "O endereço de entrega é obrigatório.";
    }
    return null;
  };

  const handleNextFromStep2 = () => {
    const error = validateForm();
    if (error) {
      setErrorMsg(error);
      return;
    }
    setErrorMsg(null);
    setStep(3);
  };

  useEffect(() => {
    if (step === 3 && order) {
      const processCheckout = async () => {
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
          // 1. POST to /api/checkout/create-order
          const orderPayload = {
            companyId: order.companyId,
            customerName: formData.nome,
            customerCpfCnpj: formData.cpfCnpj,
            contact: order.contact || "Contato do Cliente",
            customerEmail: formData.email,
            items: order.items,
            total: order.total,
            deliveryType: order.deliveryType || "delivery",
            shippingCost: order.shippingCost || 0,
            address: `${formData.endereco} - CEP: ${formData.cep}`,
            isEmergency: order.isEmergency || false,
            isWholesale: order.isWholesale || false,
            observations: order.observations || "",
          };

          const orderResponse = await fetch("/api/checkout/create-order", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderPayload),
          });

          if (!orderResponse.ok) {
            const errData = await orderResponse.json().catch(() => ({}));
            throw new Error(errData.error || "Não foi possível registrar o pedido no servidor.");
          }

          const orderResult = await orderResponse.json();
          const newOrderId = orderResult.orderId || orderResult.code;

          if (!newOrderId) {
            throw new Error("O código do pedido não foi retornado pelo servidor.");
          }

          // 2. POST to /api/payment/create-preference
          const prefResponse = await fetch("/api/payment/create-preference", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ orderId: newOrderId }),
          });

          if (!prefResponse.ok) {
            const errData = await prefResponse.json().catch(() => ({}));
            throw new Error(errData.error || "Não foi possível gerar a preferência de pagamento no Mercado Pago.");
          }

          const prefResult = await prefResponse.json();
          const initPoint = prefResult.initPoint;

          if (!initPoint) {
            throw new Error("O link de pagamento (initPoint) do Mercado Pago está ausente.");
          }

          // Redirect the user automatically
          window.location.href = initPoint;
        } catch (err: any) {
          console.error("[ClientCheckout] error processing checkout:", err);
          setErrorMsg(err.message || "Ocorreu um erro inesperado ao gerar seu pagamento. Por favor, tente novamente.");
        } finally {
          setIsSubmitting(false);
        }
      };

      processCheckout();
    }
  }, [step, order, formData]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (!order) return <div className="p-20 text-center">Pedido não encontrado.</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-6">
       <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-black">Checkout - Pedido {order.code}</h1>
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(s => <div key={s} className={`w-8 h-2 rounded-full ${step >= s ? 'bg-black' : 'bg-gray-300'}`} />)}
            </div>
        </header>

        {step === 1 && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Resumo do Pedido</h2>
            <div className="space-y-4">
                {order.items?.map(item => (
                    <div key={item.id} className="flex justify-between border-b pb-2">
                        <span>{item.product_name} x {item.quantity}</span>
                        <span>R$ {(item.current_price * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <p className="text-xl font-bold mt-6">Total: R$ {order.total?.toFixed(2)}</p>
            <button onClick={() => setStep(2)} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">Continuar para Entrega</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Dados de Entrega</h2>
            {errorMsg && (
              <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium">
                ⚠️ {errorMsg}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <input aria-label="Nome completo" placeholder="Nome" className="p-3 border rounded-xl" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <input aria-label="E-mail" placeholder="E-mail" className="p-3 border rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input aria-label="CPF ou CNPJ" placeholder="CPF/CNPJ" className="p-3 border rounded-xl col-span-2" value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} />
                <input aria-label="CEP" placeholder="CEP" className="p-3 border rounded-xl" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} />
                <input aria-label="Endereço" placeholder="Endereço" className="p-3 border rounded-xl" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>
            <button onClick={handleNextFromStep2} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">Continuar para Pagamento</button>
          </div>
        )}
        
        {step === 3 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                <h2 className="text-xl font-bold mb-6">Pagamento</h2>
                {isSubmitting ? (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-black w-12 h-12" />
                        <p className="text-gray-600 font-medium">Processando seu pedido e gerando o link de pagamento seguro...</p>
                        <p className="text-xs text-gray-400">Você será redirecionado para o Mercado Pago em instantes.</p>
                    </div>
                ) : errorMsg ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 font-medium">
                            {errorMsg}
                        </div>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setStep(2)} className="bg-gray-100 text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                                Voltar para Entrega
                            </button>
                            <button onClick={() => setStep(3)} className="bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition">
                                Tentar Novamente
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="animate-spin text-black w-12 h-12" />
                        <p className="text-gray-600 font-medium">Redirecionando para o Mercado Pago...</p>
                    </div>
                )}
            </div>
        )}

        {step === 4 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                <CheckCircle2 className="mx-auto text-emerald-500 w-16 h-16 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Pedido Concluído!</h2>
                <p>Obrigado pela sua compra.</p>
                {order.total && order.total >= 300 && (
                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 font-bold">🎁 Você ganhou um brinde especial!</div>
                )}
                <button onClick={() => navigate('/')} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800 transition">Voltar à Home</button>
            </div>
        )}
       </div>
    </div>
  );
};
