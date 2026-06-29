import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Order } from "../../types";
import { Loader2, CheckCircle2, CreditCard, MapPin, Package, ArrowRight } from "lucide-react";

export const ClientCheckout: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const q = query(collection(db, "sales"), where("code", "==", code?.toUpperCase()));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const docData = snapshot.docs[0];
          setOrder({ id: docData.id, ...docData.data() } as Order);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [code]);

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-gray-400" /></div>;
  if (!order) return <div className="p-20 text-center">Pedido não encontrado.</div>;

  const [formData, setFormData] = useState({
    nome: order.customerName || "",
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

  const handleNext = () => setStep(step + 1);

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
            <button onClick={handleNext} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800">Continuar para Entrega</button>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold mb-6">Dados de Entrega</h2>
            <div className="grid grid-cols-2 gap-4">
                <input placeholder="Nome" className="p-3 border rounded-xl" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
                <input placeholder="E-mail" className="p-3 border rounded-xl" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <input placeholder="CPF/CNPJ" className="p-3 border rounded-xl col-span-2" value={formData.cpfCnpj} onChange={e => setFormData({...formData, cpfCnpj: e.target.value})} />
                <input placeholder="CEP" className="p-3 border rounded-xl" value={formData.cep} onChange={e => setFormData({...formData, cep: e.target.value})} />
                <input placeholder="Endereço" className="p-3 border rounded-xl" value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </div>
            <button onClick={handleNext} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800">Continuar para Pagamento</button>
          </div>
        )}
        
        {step === 3 && (
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
                <h2 className="text-xl font-bold mb-6">Pagamento</h2>
                <p>Processando via Mercado Pago...</p>
                <button onClick={handleNext} className="mt-8 w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700">Simular Pagamento Aprovado</button>
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
                <button onClick={() => navigate('/')} className="mt-8 w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-gray-800">Voltar à Home</button>
            </div>
        )}
       </div>
    </div>
  );
};
