import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, ChevronRight, UploadCloud, MapPin, Search, ShieldCheck, HeartHandshake, Box, UserCheck, Gift } from 'lucide-react';
import { CartItem, CompanyId } from '../types';
import { themes } from '../lib/theme';
import { logCheckoutEvent } from '../services/firebaseService';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  companyId: CompanyId;
  onAddToCart: (product: any, quantity: number) => void;
  onCheckoutSubmit: (data: any) => void;
  isSubmitting: boolean;
}

export function CheckoutModal({
  isOpen,
  onClose,
  cart,
  companyId,
  onAddToCart,
  onCheckoutSubmit,
  isSubmitting
}: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  const theme = themes[companyId] || themes.pallyra;

  // Step 1: Personalização
  const [persName, setPersName] = useState('');
  const [persAge, setPersAge] = useState('');
  const [persTheme, setPersTheme] = useState('');
  const [persColors, setPersColors] = useState('');
  const [persObs, setPersObs] = useState('');

  // Step 2: Dados e Entrega
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientCpf, setClientCpf] = useState('');
  const [clientEmail, setClientEmail] = useState('');

  const [cep, setCep] = useState('');
  const [rua, setRua] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [ref, setRef] = useState('');

  // Step 3: Pagamento
  const [cupom, setCupom] = useState('');
  const [payFullAmount, setPayFullAmount] = useState(false);

  const subtotal: number = useMemo(() => cart.reduce((sum, item) => sum + ((item.retail_price || 0) * (item.quantity || 1)), 0), [cart]);
  const discount: number = cupom === 'GANHEI10' ? subtotal * 0.1 : 0; // Fake discount implementation, should be from backend
  const delivery: number = 0; // Calculation could go here
  const total: number = subtotal - discount + delivery;

  // Log on start
  useEffect(() => {
    if (isOpen && cart.length > 0) {
      logCheckoutEvent('Início', {
        companyId,
        total,
        itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
        description: cart.map(item => `${item.product_name} (x${item.quantity})`).join(', ')
      });
    }
  }, [isOpen, companyId]);

  const handleNext = () => {
    if (step === 1) {
      logCheckoutEvent('Seleção de Personalização', {
        companyId,
        clientName: clientName || undefined,
        total,
        itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
        description: `Tema: ${persTheme || 'Sem tema'}, Cores: ${persColors || 'Sem cor'}, Nome: ${persName || 'Sem nome'}`
      });
    }
    setStep(s => Math.min(3, s + 1));
  };
  
  const handleFinalize = () => {
    const isFullPayment = total <= 100 || payFullAmount;
    const amountToPay = isFullPayment ? total : total / 2;

    logCheckoutEvent('Pagamento MP', {
      companyId,
      clientName: clientName || 'Anônimo',
      total,
      itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      description: `Método: Mercado Pago, Sinal: ${isFullPayment ? 'Integral' : '50%'}, Valor Pago: R$ ${amountToPay.toFixed(2)}`
    });

    onCheckoutSubmit({
      personalization: { persName, persAge, persTheme, persColors, persObs },
      client: { clientName, clientContact, clientCpf, clientEmail },
      address: { cep, rua, numero, bairro, cidade, estado, ref },
      cupom,
      total,
      isFullPayment,
      amountToPay
    });
  };

  const handleBuscarCep = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (cep.length >= 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, '')}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRua(data.logradouro);
          setBairro(data.bairro);
          setCidade(data.localidade);
          setEstado(data.uf);
        }
      } catch (err) {
        console.error('CEP fetching error', err);
      }
    }
  };

  const addUpsell = (productName: string, price: number) => {
    const fakeProduct = {
      id: crypto.randomUUID(),
      company: companyId,
      product_name: productName,
      retail_price: price,
      image: "https://via.placeholder.com/150?text=Upsell",
      category: "Upsell",
      isVisible: true,
      current_price: price
    };
    onAddToCart(fakeProduct, 1);
  };  // Top Header & Progress Bar
  const renderHeader = () => (
    <header className="w-full bg-white border-b border-gray-100 py-4 px-6 md:px-12 flex flex-col md:flex-row justify-between items-center shadow-[0_4px_24px_-10px_rgba(0,0,0,0.05)] shrink-0 z-10 sticky top-0">
      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-2 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-full transition-colors mr-2">
            <X size={20} />
          </button>
          {theme.logoUrl ? (
            <img src={theme.logoUrl} alt="Logo" className="w-auto h-8 object-contain" />
          ) : (
            <span className="font-bold text-gray-900 tracking-wider">ATELIÊ</span>
          )}
        </div>
        
        <div className="md:hidden flex items-center gap-1 text-xs font-bold" style={{ color: theme.accentColor }}>
          <Lock size={12} /> SEGURO
        </div>
      </div>

      <div className="flex items-center gap-4 mt-6 md:mt-0 overflow-x-auto w-full md:w-1/2 justify-center hide-scrollbar">
         {[
           { id: 1, label: 'Personalização' },
           { id: 2, label: 'Entrega' },
           { id: 3, label: 'Pagamento' }
         ].map(s => (
           <React.Fragment key={s.id}>
             <div className="flex flex-col md:flex-row items-center gap-2">
               <div 
                 className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                   step === s.id ? 'text-white shadow-md' : 
                   step > s.id ? 'text-white' : 'bg-gray-100 text-gray-400'
                 }`}
                 style={{ 
                   backgroundColor: step >= s.id ? theme.accentColor : undefined,
                 }}
               >
                 {step > s.id ? <Check size={14} /> : s.id}
               </div>
               <span className={`text-xs md:text-sm font-medium hidden md:inline-block ${
                 step === s.id ? 'text-gray-900' : 'text-gray-400'
               }`}>
                 {s.label}
               </span>
             </div>
             {s.id < 3 && (
               <div className="w-8 md:w-16 h-px transition-colors duration-300" style={{ backgroundColor: step > s.id ? theme.accentColor : '#E5E7EB' }} />
             )}
           </React.Fragment>
         ))}
      </div>

      <div className="hidden md:flex items-center gap-2 font-bold text-xs uppercase px-4 py-2 rounded-full" style={{ color: theme.accentColor, backgroundColor: theme.accentColor + '15' }}>
         <Lock size={14} /> COMPRA 100% SEGURA
      </div>
    </header>
  );

  const renderOrderSummary = (isInMobileFlow = false, isStep3 = false) => (
    <div className={`w-full ${!isStep3 ? 'lg:w-[350px] xl:w-[400px] lg:border-l border-gray-200' : ''} bg-[#F8F5F2] shrink-0 overflow-y-auto p-6 lg:p-8 hide-scrollbar flex flex-col ${!isStep3 ? 'lg:sticky lg:top-[85px] lg:h-[calc(100vh-85px)]' : ''} shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.05)]`}>
       
       {/* BLOCO 1: RESUMO DO PEDIDO */}
       <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 tracking-wider flex items-center gap-2 mb-6 uppercase text-sm">
            <Box size={18} style={{ color: theme.accentColor }} /> Resumo do Pedido
          </h3>
          
          <div className="space-y-5 mb-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 shadow-sm relative group">
                  <img src={item.image} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold text-gray-800 pr-2 line-clamp-2 leading-tight">{item.product_name}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">{item.category}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">Qtd: {item.quantity}</span>
                    <span className="font-bold text-gray-900">R$ {((item.retail_price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-100 pt-5 space-y-3">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-[#E96A8D]">
                <span>Desconto</span>
                <span className="font-medium">- R$ {discount.toFixed(2).replace('.', ',')}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>Entrega</span>
              <span className="font-medium">{delivery === 0 ? 'A calcular' : `R$ ${delivery.toFixed(2).replace('.', ',')}`}</span>
            </div>
            
            <div className="flex justify-between text-xl font-bold pt-5 border-t border-gray-100 mt-2" style={{ color: theme.accentColor }}>
              <span>Total</span>
              <span>R$ {total.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
       </div>

       {/* BLOCO 2: UPSELL */}
       {!isStep3 && (
         <div className="bg-white rounded-3xl p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 mb-6 bg-gradient-to-br from-white to-gray-50">
            <h3 className="font-bold text-gray-900 tracking-wider mb-2 uppercase text-sm">Complete seu pedido</h3>
            <p className="text-xs font-medium mb-6 flex items-center gap-1 text-gray-500" style={{ color: theme.accentColor }}>
              Aproveite e leve também <span className="text-yellow-400">✨</span>
            </p>
            
            <div className="space-y-3">
              {([
                { name: "Tag Agradecimento Personalizada", price: 10.00, oldPrice: 15.00 },
                { name: "Saquinho de Organza Luxo", price: 10.00, oldPrice: 18.00 }
              ] as Array<{name: string, price: number, oldPrice: number}>).map((upsell, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-2xl hover:border-gray-200 hover:shadow-sm transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center transition-colors">
                    <Gift size={20} className="text-gray-300 group-hover:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold text-gray-800 mb-1 leading-tight">{upsell.name}</p>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] text-gray-400 line-through">R$ {upsell.oldPrice.toFixed(2).replace('.', ',')}</span>
                       <span className="text-xs font-bold" style={{ color: theme.accentColor }}>R$ {upsell.price.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => addUpsell(upsell.name, upsell.price)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-full transition-all flex-shrink-0"
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
         </div>
       )}

       {/* BLOCO 3: TRUST BADGES & AJUDA */}
       {!isStep3 && (
         <>
           <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <HeartHandshake style={{ color: theme.accentColor }} size={24} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 leading-relaxed">Produção<br/>artesanal</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <ShieldCheck style={{ color: theme.accentColor }} size={24} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 leading-relaxed">Aprovação<br/>antes de produzir</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <UserCheck style={{ color: theme.accentColor }} size={24} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 leading-relaxed">Atendimento<br/>humanizado</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center justify-center text-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <Box style={{ color: theme.accentColor }} size={24} strokeWidth={1.5} />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 leading-relaxed">Embalagem<br/>exclusiva</span>
              </div>
           </div>

           <div className="bg-white rounded-3xl p-6 border border-gray-100 text-center shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 opacity-10 blur-2xl rounded-full pointer-events-none" style={{ backgroundColor: theme.accentColor }} />
             <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Precisa de ajuda?</span>
             <span className="block text-sm text-gray-600 mb-5 font-medium">Fale conosco no WhatsApp</span>
             <a href={`https://wa.me/55${theme.whatsapp?.replace(/\D/g, '') || "11999999999"}`} target="_blank" rel="noreferrer" className="w-full py-4 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg" style={{ backgroundColor: theme.accentColor }}>
               Falar com Suporte
             </a>
           </div>
         </>
       )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#F8F5F2] overflow-hidden text-gray-600 font-sans">
      {renderHeader()}

      {/* Two Columns Layout for Steps 1 & 2 */}
      {step < 3 && (
        <div className="flex flex-1 overflow-hidden flex-col lg:flex-row relative">
          
          {/* Left Column (Dynamic Forms) */}
          <div className="flex-1 overflow-y-auto w-full bg-white relative p-6 lg:p-12 xl:p-16 hide-scrollbar rounded-tr-3xl">
             <div className="max-w-2xl mx-auto w-full">
               
               {step === 1 && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-8">
                   <div>
                     <h2 className="text-3xl font-bold text-gray-900 mb-2">Personalização</h2>
                     <p className="text-sm text-gray-500">Preencha com atenção para criarmos algo único para você.</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-5 border border-gray-100 p-6 md:p-8 rounded-3xl bg-white shadow-[0_4px_24px_-10px_rgba(0,0,0,0.03)]">
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nome da Criança / Pessoa</label>
                       <input value={persName} onChange={e => setPersName(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Ex: Maria Alice" />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Idade / Frase</label>
                       <input value={persAge} onChange={e => setPersAge(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Ex: 1 aninho" />
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tema / Estilo</label>
                     <select value={persTheme} onChange={e => setPersTheme(e.target.value)} className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:border-transparent outline-none transition-all text-sm font-medium cursor-pointer" style={{ '--tw-ring-color': theme.accentColor + '50' } as any}>
                       <option value="">Selecione o tema desejado</option>
                       <option value="Sereia">A Pequena Sereia</option>
                       <option value="Safari">Safari Baby</option>
                       <option value="Circo">Circo Rosa</option>
                       <option value="Jardim">Jardim Encantado</option>
                       <option value="Outro">Outro (Especifique abaixo)</option>
                     </select>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cores Predominantes</label>
                     <input value={persColors} onChange={e => setPersColors(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Ex: Rosa Bebê, Branco e Dourado" />
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Envie inspirações (Opcional - Máx 2)</label>
                     <div className="w-full flex-col border-2 border-dashed border-gray-200 rounded-3xl p-8 flex items-center justify-center bg-[#F8F5F2] hover:bg-gray-50 transition-colors cursor-pointer group">
                       <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3 bg-white shadow-sm text-gray-400 group-hover:text-gray-600 transition-colors">
                         <UploadCloud size={24} />
                       </div>
                       <span className="text-sm font-semibold text-gray-700">Adicionar Imagens</span>
                       <span className="text-xs text-gray-400 mt-1">Solte aqui ou clique (JPG, PNG)</span>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Observações adicionais</label>
                     <textarea value={persObs} onChange={e => setPersObs(e.target.value)} rows={3} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800 resize-none" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Algum detalhe especial ou nome adicional?" />
                   </div>

                   <div className="pt-6 pb-20 lg:pb-0">
                     <button onClick={handleNext} className="w-full py-5 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-lg hover:shadow-xl" style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 25px -5px ${theme.accentColor}50` }}>
                       Continuar <ChevronRight size={18} />
                     </button>
                   </div>
                 </motion.div>
               )}

               {step === 2 && (
                 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-10 pb-20 lg:pb-0">
                   <div>
                     <h2 className="text-3xl font-bold text-gray-900 mb-2">Entrega</h2>
                     <p className="text-sm text-gray-500">Para onde enviaremos o seu pedido?</p>
                   </div>
                   
                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Seus Dados</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1 md:col-span-2">
                         <input value={clientName} onChange={e => setClientName(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Nome Completo" />
                       </div>
                       <div className="space-y-1">
                         <input value={clientContact} onChange={e => setClientContact(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="WhatsApp (DDD + Número)" />
                       </div>
                       <div className="space-y-1 relative">
                         <input value={clientCpf} onChange={e => setClientCpf(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="CPF / CNPJ" />
                       </div>
                       <div className="space-y-1 md:col-span-2">
                         <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} type="email" className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="E-mail" />
                       </div>
                     </div>
                   </div>

                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Endereço</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="space-y-1 md:col-span-2 relative">
                         <div className="flex gap-2">
                           <input value={cep} onChange={e => setCep(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="CEP" />
                           <button onClick={handleBuscarCep} className="bg-gray-800 text-white px-5 rounded-2xl hover:bg-gray-900 transition-colors flex items-center justify-center shrink-0">
                             <Search size={18} />
                           </button>
                         </div>
                       </div>
                       <div className="space-y-1 md:col-span-4">
                         <input value={rua} onChange={e => setRua(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Endereço (Rua, Av.)" />
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={numero} onChange={e => setNumero(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Número" />
                       </div>
                       <div className="space-y-1 md:col-span-3">
                         <input value={ref} onChange={e => setRef(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Complemento / Referência" />
                       </div>
                       <div className="space-y-1 md:col-span-2">
                         <input value={bairro} onChange={e => setBairro(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Bairro" />
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={cidade} onChange={e => setCidade(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Cidade" />
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={estado} onChange={e => setEstado(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium uppercase" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="UF" maxLength={2} />
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 pt-4 border-t border-gray-100">
                     <button onClick={() => setStep(1)} className="py-5 px-8 bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase tracking-widest transition-colors">
                       Voltar
                     </button>
                     <button onClick={handleNext} className="flex-1 py-5 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-lg hover:shadow-xl" style={{ backgroundColor: theme.accentColor, boxShadow: `0 10px 25px -5px ${theme.accentColor}50` }}>
                       Ir para Pagamento <ChevronRight size={18} />
                     </button>
                   </div>
                 </motion.div>
               )}
               
             </div>
          </div>

          {renderOrderSummary()}

        </div>
      )}

      {/* Centered Layout for Step 3 */}
      {step === 3 && (
        <div className="flex-1 overflow-y-auto w-full relative p-6 md:p-12 pb-24">
           <div className="max-w-4xl mx-auto w-full">
             
             <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="space-y-10">
               
               <div className="text-center">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2">Finalizar Pedido</h2>
                 <p className="text-sm text-gray-500">Revise seus dados e escolha a forma de pagamento.</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left: Review Data */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <UserCheck size={16} style={{ color: theme.accentColor }} /> Dados e Entrega
                      </h3>
                      <div className="space-y-4 text-sm text-gray-600">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Contato</span>
                          <span className="font-medium text-gray-800">{clientName || "Não informado"}</span>
                          <span className="block text-xs mt-0.5">{clientContact} | {clientEmail}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Endereço</span>
                          {rua ? (
                            <>
                              <span className="font-medium text-gray-800">{rua}, {numero} {ref ? `(${ref})` : ''}</span>
                              <span className="block text-xs mt-0.5">{bairro} - {cidade}/{estado}</span>
                              <span className="block text-xs text-gray-400 mt-0.5">CEP: {cep}</span>
                            </>
                          ) : (
                            <span className="text-gray-500 italic">Retirada ou endereço não informado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Box size={16} style={{ color: theme.accentColor }} /> Resumo Financeiro
                      </h3>
                      
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal ({cart.length} itens)</span>
                          <span className="font-medium text-gray-700">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Entrega</span>
                          <span className="font-medium text-gray-700">{delivery === 0 ? 'A calcular' : `R$ ${delivery.toFixed(2).replace('.', ',')}`}</span>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <input value={cupom} onChange={e => setCupom(e.target.value.toUpperCase())} className="flex-1 p-3 bg-[#F8F5F2] border-0 rounded-xl focus:ring-2 outline-none transition-all text-xs font-bold text-gray-700 uppercase" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="CUPOM" />
                          <button className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-xl text-xs font-bold tracking-wider transition-colors">
                            APLICAR
                          </button>
                        </div>

                        {discount > 0 && (
                          <div className="flex justify-between text-sm text-green-600 font-medium pt-2">
                            <span>Desconto</span>
                            <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center text-xl font-bold pt-4 border-t border-gray-100 mt-4" style={{ color: theme.accentColor }}>
                          <span>Total</span>
                          <span>R$ {total.toFixed(2).replace('.', ',')}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment & Submit */}
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-100 p-6 md:p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                         <Lock size={120} />
                       </div>
                       
                       <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10">
                          Forma de Pagamento
                       </h3>

                       <label className="flex items-start gap-4 p-5 border-2 rounded-2xl cursor-pointer transition-all bg-gray-50 hover:bg-gray-100 relative z-10" style={{ borderColor: theme.accentColor, backgroundColor: theme.accentColor + '08' }}>
                         <div className="mt-1">
                           <input type="radio" checked readOnly className="w-5 h-5" style={{ accentColor: theme.accentColor }} />
                         </div>
                         <div>
                           <span className="block font-bold text-gray-900 mb-2 flex items-center gap-2 text-base">
                             Mercado Pago <span className="bg-blue-100 text-blue-700 text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Oficial</span>
                           </span>
                           <span className="text-xs text-gray-500 leading-relaxed block mb-3">Pague com Pix, Cartão de Crédito ou Boleto. Ambiente 100% seguro do Mercado Pago. Aprovação imediata via Pix.</span>
                           <div className="flex gap-2">
                             <img src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png" alt="Mercado Pago" className="h-6 w-auto object-contain grayscale opacity-60" />
                             <img src="https://logospng.org/download/pix/logo-pix-icone-1024.png" alt="Pix" className="h-6 w-auto object-contain grayscale opacity-60" />
                           </div>
                         </div>
                       </label>

                       {total > 100 && (
                         <div className="mt-6 p-4 rounded-xl bg-[#F8F5F2] border border-gray-100 relative z-10">
                           <div className="flex items-center gap-2 mb-2 text-sm font-bold text-gray-800">
                             <ShieldCheck size={16} style={{ color: theme.accentColor }} />
                             Pagamento de Sinal Obrigatório (50%)
                           </div>
                           <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                             Pedidos acima de R$ 100,00 exigem o pagamento de pelo menos 50% (R$ {(total/2).toFixed(2).replace('.', ',')}) para iniciar a produção.
                           </p>

                           <label className="flex items-center gap-3 cursor-pointer">
                             <input 
                               type="checkbox" 
                               checked={payFullAmount} 
                               onChange={() => setPayFullAmount(!payFullAmount)} 
                               className="w-4 h-4 rounded border-gray-300 focus:ring-2"
                               style={{ accentColor: theme.accentColor }}
                             />
                             <span className="text-sm font-medium text-gray-700">Desejo pagar o valor integral (R$ {total.toFixed(2).replace('.', ',')}) agora</span>
                           </label>
                         </div>
                       )}
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={handleFinalize}
                        disabled={isSubmitting}
                        className="w-full py-6 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100"
                        style={{ backgroundColor: isSubmitting ? '#9CA3AF' : theme.accentColor, boxShadow: isSubmitting ? 'none' : `0 10px 25px -5px ${theme.accentColor}50` }}
                      >
                        <Lock size={18} /> {isSubmitting ? 'Processando...' : `Pagar R$ ${(total > 100 && !payFullAmount ? total/2 : total).toFixed(2).replace('.', ',')}`}
                      </button>
                      
                      <div className="text-center text-xs text-gray-400 mt-6 flex flex-col items-center justify-center gap-2">
                        <div className="flex items-center gap-1 font-medium">
                          <Lock size={12} /> Integração Direta com Mercado Pago
                        </div>
                        <p className="max-w-[250px] leading-relaxed">Você será redirecionado para concluir o pagamento de forma segura.</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-center mt-2">
                      <button onClick={() => setStep(2)} className="py-4 px-6 text-gray-400 hover:text-gray-700 font-bold uppercase tracking-widest transition-colors text-xs flex items-center gap-2">
                        <ChevronRight size={14} className="rotate-180" /> Voltar para Entrega
                      </button>
                    </div>
                  </div>
               </div>

             </motion.div>
             
           </div>
        </div>
      )}
      
    </div>
  );
}
