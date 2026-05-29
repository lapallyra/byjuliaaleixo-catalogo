import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Package, Search, CheckCircle, Clock, Check } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const TrackingView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setCode(codeParam.trim().toUpperCase());
      doSearch(codeParam.trim().toUpperCase());
    }
  }, []);

  const doSearch = async (searchCode: string) => {
    if (!searchCode) return;
    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const q = query(
        collection(db, 'sales'),
        where('code', '==', searchCode)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError('Pedido não encontrado. Verifique o código e tente novamente.');
      } else {
        setOrder(snapshot.docs[0].data());
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao buscar o pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(code.trim().toUpperCase());
  };

  const getTimelineStage = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'delivered') return 6;
    if (s === 'delivery' || s === 'enviado') return 5;
    if (s === 'ready' || s === 'finalização') return 4;
    if (s === 'assembly' || s === 'personalização') return 3;
    if (s === 'production') return 2;
    if (s === 'approval' || s === 'pagamento aprovado' || s === 'waiting_deposit' || s === 'sinal') return 1;
    return 0; // pending, quote, recebido
  };

  const stages = [
    "Pedido recebido",
    "Pagamento aprovado",
    "Em produção",
    "Personalização",
    "Finalização",
    "Enviado",
    "Entregue"
  ];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center p-8">
       <button onClick={onBack} className="self-start text-[10px] font-bold uppercase tracking-widest text-[#A09898] hover:text-[#D48C8C] mb-10 transition-colors">
         ← Voltar para a loja
       </button>

       <div className="w-full max-w-md bg-white p-8 rounded-[2rem] border border-[#F0E6D2] shadow-xl text-center">
         <div className="w-16 h-16 bg-[#FAF9F6] text-[#D48C8C] rounded-2xl flex items-center justify-center mx-auto mb-6">
           <Package size={28} />
         </div>
         <h1 className="text-xl font-bold text-[#4A4444] mb-2">Acompanhe seu Pedido</h1>
         <p className="text-[10px] text-[#A09898] font-medium uppercase tracking-widest mb-8">Digite o código recebido no momento da compra</p>

         <form onSubmit={handleSearch} className="mb-10">
            <div className="relative">
              <input
                 type="text"
                 value={code}
                 onChange={e => setCode(e.target.value)}
                 placeholder="CÓDIGO DO PEDIDO"
                 className="w-full bg-[#FAF9F6] border border-[#F0E6D2] rounded-xl py-4 pl-6 pr-12 text-sm font-bold uppercase tracking-widest outline-none focus:border-[#D48C8C] transition-colors placeholder:text-[#D1CACA]"
              />
              <button disabled={loading} type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#D48C8C] text-white rounded-lg hover:bg-[#C07B7B] transition-colors disabled:opacity-50">
                <Search size={16} />
              </button>
            </div>
         </form>

         {error && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-500 mb-6">{error}</p>
         )}

         {order && (
            <div className="text-left bg-[#FAF9F6] rounded-2xl p-6 border border-[#F0E6D2]">
               <h3 className="text-sm font-bold text-[#4A4444] mb-1">Pedido {order.code}</h3>
               <p className="text-[10px] font-bold text-[#A09898] uppercase tracking-widest mb-8">Olá, {order.customerName.split(' ')[0]}!</p>

               <div className="space-y-6 relative overflow-hidden pb-4">
                 {stages.map((stage, idx) => {
                   const currStage = getTimelineStage(order.status);
                   const isCompleted = idx < currStage;
                   const isCurrent = idx === currStage;
                   const isPending = idx > currStage;

                   return (
                     <div key={idx} className="flex items-start gap-4 relative">
                        {idx !== stages.length - 1 && (
                          <div className={`absolute left-[11px] top-6 bottom-[-30px] w-[2px] ${isCompleted ? 'bg-[#D48C8C]' : 'bg-[#E5DFD3]'}`} />
                        )}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center z-10 relative flex-shrink-0 ${isCompleted ? 'bg-[#D48C8C] text-white' : isCurrent ? 'bg-white border-2 border-[#D48C8C] text-[#D48C8C]' : 'bg-white border-2 border-[#E5DFD3] text-[#E5DFD3]'}`}>
                          {isCompleted ? <Check size={12} strokeWidth={4} /> : isCurrent ? <Clock size={12} strokeWidth={3} /> : null}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest leading-none pt-1 ${isCompleted || isCurrent ? 'text-[#4A4444]' : 'text-[#A09898]'}`}>
                          {stage}
                        </span>
                     </div>
                   );
                 })}
               </div>
            </div>
         )}
       </div>
    </div>
  );
};
