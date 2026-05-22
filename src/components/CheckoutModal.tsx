import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Truck, CreditCard, Edit3, Receipt, CheckCircle, Loader2, Zap } from 'lucide-react';
import { CartItem, AppConfig, CheckoutData, CompanyId, SiteSettings } from '../types';
import { formatCurrency } from '../lib/currencyUtils';
import { sendNotifications } from '../services/notificationService';
import { createRealNotification } from '../services/saleNotificationService';
import { saveSale, updateOrder } from '../services/firebaseService';
import { functions } from '../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { PrizeRouletteModal } from './PrizeRouletteModal';
import { ImageWithFallback } from './ImageWithFallback';
import { themes } from '../lib/theme';

interface CheckoutModalProps {
  cart: CartItem[];
  config: AppConfig;
  onClose: () => void;
  onSubmit: () => void;
  companyName: string;
  companyId: CompanyId;
  siteSettings: SiteSettings | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  config,
  onClose,
  onSubmit,
  companyName,
  companyId,
  siteSettings
}) => {
  const accentColor = siteSettings?.theme_accent_color || {
    pallyra: '#d4af37',
    guennita: '#d4af37',
    mimada: '#FF007F'
  }[companyId] || '#d4af37';

  const primaryColor = siteSettings?.theme_primary_color || {
    pallyra: '#000000',
    guennita: '#450a0a',
    mimada: '#FFFFFF'
  }[companyId] || '#000000';

  // Dynamic Theme Injection for Checkout
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--checkout-accent', accentColor);
    root.style.setProperty('--checkout-primary', primaryColor);
  }, [accentColor, primaryColor]);

  

  // Override with dynamic colors if present
  const theme = themes[companyId as keyof typeof themes] || themes.pallyra;

  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CheckoutData>({
    name: "",
    birthDate: "",
    cpfCnpj: "",
    contact: "",
    deliveryType: "pickup",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    paymentMethod: "mercadopago",
    installments: 1,
    needsChange: "NÃO",
    changeAmount: "",
    observations: "",
    isEmergency: false
  });
  const [step, setStep] = useState(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderCode, setOrderCode] = useState('');
  const [showRoulette, setShowRoulette] = useState(false);
  const [wonPrize, setWonPrize] = useState('');

  const subtotal = cart.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
  const total = subtotal;
  
  const needsDeposit = subtotal >= 100;
  const depositAmount = needsDeposit ? subtotal * 0.5 : 0;

  const maskCpfCnpj = (value: string) => {
    const raw = value.replace(/\D/g, '').slice(0, 14); // Limit to 14
    if (raw.length <= 11) {
      if (raw.length <= 3) return raw;
      if (raw.length <= 6) return raw.replace(/(\d{3})(\d+)/, "$1.$2");
      if (raw.length <= 9) return raw.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
      return raw.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
    }
    return raw.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
  };

  const maskPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return `(${numbers}`;
    if (numbers.length <= 3) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 3)} ${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const maskDate = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .replace(/(\d{2})(\d)/, '$1/$2')
      .slice(0, 10);
  };

  const openWhatsApp = async (code: string) => {
    try {
      const waUrl = await sendNotifications(config, cart, { ...formData, wonPrize: wonPrize || undefined }, total, companyName);
      if (waUrl) {
        window.open(waUrl, '_blank');
      }
    } catch (error) {
      console.error("Erro ao abrir WhatsApp:", error);
      alert("Erro ao gerar link do WhatsApp.");
    }
  };

  const onPrizeWon = async (prize: string) => {
    setWonPrize(prize);
    if (orderCode) {
      try {
        await updateOrder(orderCode, { giftInfo: prize });
        console.log("�� Order updated with prize:", prize);
      } catch (err) {
        console.error("Error updating order with prize:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (step === 1) {
      if (!formData.name || !formData.birthDate || !formData.contact || !formData.cpfCnpj) {
        alert("Por favor, preencha todos os dados do cliente (incluindo CPF/CNPJ)");
        return;
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      if (formData.deliveryType !== 'pickup' && (!formData.address || !formData.city || !formData.state)) {
        alert("Por favor, preencha os dados de entrega");
        return;
      }
      setStep(3);
      return;
    }

    if (formData.paymentMethod === 'cash' && formData.needsChange === 'SIM' && !formData.changeAmount) {
      alert("Por favor, informe para quanto precisa de troco");
      return;
    }

    setIsLoading(true);
    console.log("�� Starting checkout process...", { companyId, total });
    try {
      // Save to Firebase
      const docId = await saveSale({
        customerName: formData.name,
        customerCpfCnpj: formData.cpfCnpj,
        contact: formData.contact,
        total,
        companyId,
        items: cart.map(item => ({
          ...item,
          productId: item.id || '',
          product_name: item.product_name || '',
          quantity: item.quantity || 1,
          retail_price: item.retail_price || 0,
          insumos: item.insumos || []
        })),
        isWholesale: cart.some(item => item.isWholesaleEnabled && item.wholesale_price > 0 && item.quantity >= (item.wholesale_min_qty || 5)),
        deliveryType: formData.deliveryType,
        deliveryDate: "Agendar",
        isEmergency: formData.isEmergency,
        paymentMethod: formData.paymentMethod,
        source: 'catalog',
        observations: formData.observations + (formData.paymentMethod === 'cash' && formData.needsChange === 'SIM' ? ` | Troco para: ${formData.changeAmount}` : '')
      });

      console.log("✅ Sale saved to Firebase");

      const savedOrderCode = docId || '';
      setOrderCode(savedOrderCode);
      
      const requiresOnlinePayment = formData.paymentMethod !== 'cash';
      
      if (requiresOnlinePayment) {
        console.log('Calling createPreference');
        const createPreference = httpsCallable(functions, 'createPreference');
        
        const mpItems = cart.map(item => ({
          title: String(item.product_name || "Item"),
          quantity: Number(item.quantity) || 1,
          unit_price: Number(item.retail_price) || 0,
          currency_id: 'BRL'
        }));

        const preferencePayload = {
          orderId: savedOrderCode,
          companyId: companyId,
          items: mpItems,
          payer: {
            name: formData.name,
            email: "cliente@loja.com" 
          },
          back_urls: {
            success: `${window.location.origin}${window.location.pathname}?payment_status=approved&order_id=${savedOrderCode}`,
            failure: `${window.location.origin}${window.location.pathname}?payment_status=failed&order_id=${savedOrderCode}`,
            pending: `${window.location.origin}${window.location.pathname}?payment_status=pending&order_id=${savedOrderCode}`
          },
          auto_return: "approved"
        };

        let data: any;
        let initPoint: string | null = null;
        let preferenceId: string | null = null;

        try {
          const result = await createPreference(preferencePayload);
          data = result.data;
          console.log('Preference created');
          
          const responseData = data as any;
          initPoint = responseData?.init_point || 
                            responseData?.url || 
                            responseData?.body?.init_point || 
                            responseData?.response?.init_point ||
                            (typeof responseData === 'string' && responseData.startsWith('http') ? responseData : null);
          preferenceId = responseData?.id || null;
          
          if (!initPoint && preferenceId) {
             initPoint = `https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=${preferenceId}`;
          }

          if (initPoint) {
             console.log('Redirecting to Mercado Pago');
             console.log(initPoint);
             
             // Setup return handling logic
             localStorage.setItem('mp_pending_order', JSON.stringify({
                orderId: savedOrderCode,
                formData,
                cart,
                total,
                companyName,
                config: siteSettings
             }));
             
             if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('clear-cart'));
             }
             
             window.location.href = initPoint;
             return; 
          } else {
             throw new Error("init_point não foi retornado pelo Mercado Pago.");
          }
        } catch (callError: any) {
          console.error("Erro ao chamar o Mercado Pago:", callError);
          // NO fallback to local success!
          alert(`Falha no pagamento: ${callError.message || callError}`);
          return; // Stop execution here instead of throwing which triggers the generic catch handler.
        }
      }

      // Trigger notification if not done yet
      if (!requiresOnlinePayment) {
        const realNotif = {
          id: typeof docId !== 'undefined' ? docId : crypto.randomUUID(),
          customerName: formData.name,
          productName: cart[0]?.product_name || 'um item exclusivo',
          timeAgo: 'Agora mesmo',
          companyId: companyId
        };
        window.dispatchEvent(new CustomEvent('new-sale-notification', { detail: realNotif }));

        // Clear cart locally
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('clear-cart'));
        }
      }

      // Success!
      setIsSuccess(true);
      
      // Auto redirect to WhatsApp
      const waUrlAuto = await sendNotifications(config, cart, formData, total, companyName);
      if (waUrlAuto) {
        setTimeout(() => {
          window.open(waUrlAuto, '_blank');
        }, 1500);
      }
      
      // Check for roulette requirement (Total >= 300)
      if (total >= 300) {
        setShowRoulette(true);
      }
    } catch (error) {
      console.error("Erro no checkout:", error);
      let errorMessage = "Houve um erro ao processar seu pedido. Por favor, tente novamente.";
      if (error instanceof Error) {
        try {
          const errInfo = JSON.parse(error.message);
          if (errInfo.error) errorMessage = errInfo.error;
        } catch(e) {}
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[3000] p-4 overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={`${theme.bg} border-2 ${theme.borderLine} rounded-[2rem] w-full max-w-xl max-h-[90vh] overflow-hidden relative shadow-[0_40px_120px_rgba(0,0,0,0.8)] z-10 flex flex-col`}
      >
        <button onClick={onClose} className={`absolute top-6 right-6 ${theme.textPrimary} hover:scale-110 transition-transform z-20`}>
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto overscroll-none p-6 md:p-10 scrollbar-hide">
          {isSuccess ? (
            <div className={`text-center py-10 space-y-6 animate-in zoom-in-95 duration-300 ${theme.textPrimary}`}>
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 scale-110 shadow-lg">
                <CheckCircle size={40} />
              </div>
              <h2 className={`text-3xl font-fancy ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} leading-tight`}>Pedido Realizado!</h2>
              <p className={`text-sm ${theme.textSecondary} px-4 leading-relaxed`}>
                Obrigado por sua preferência. Clique no botão abaixo para enviar o resumo para o nosso WhatsApp e registrar seu pedido.
              </p>
              
              <div className="pt-6 space-y-3">
                <button 
                  onClick={() => openWhatsApp(orderCode)}
                  className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                >
                  Confirmar no WhatsApp
                </button>
                <button 
                  onClick={onSubmit}
                  className={`w-full py-4 ${theme.cardBg} border ${theme.borderLine} ${theme.textSecondary} rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-black/5 transition-all`}
                >
                  Finalizar e Sair
                </button>
              </div>

              
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
            <h2 className={`text-xl md:text-3xl font-fancy ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} mb-1 leading-tight`}>Finalizar Pedido</h2>
            <div className="flex justify-center items-center gap-2 mt-2">
              {[1, 2, 3].map(s => (
                <div 
                  key={s} 
                  className={`h-1 rounded-full transition-all duration-500 ${step >= s ? `w-10 ${theme.textPrimary.replace('text-', 'bg-')}` : 'w-3 bg-gray-700/30'}`}
                />
              ))}
            </div>
          </div>

          <div className={`${theme.cardBg} border ${theme.borderLine} rounded-2xl p-5 mb-6 shadow-inner space-y-2`}>
            <div className="flex justify-between items-center text-[11px]">
              <span className={theme.specialText}>Valor:</span>
              <span className={`font-number font-black ${theme.textPrimary}`}>{formatCurrency(subtotal)}</span>
            </div>
            
            {needsDeposit && (
              <div className="flex justify-between items-center text-[10px] text-rose-500 font-black uppercase tracking-widest bg-rose-50 p-2 rounded-lg border border-rose-100">
                <span>Sinal obrigatório para produção:</span>
                <span>{formatCurrency(depositAmount)}</span>
              </div>
            )}

            {cart.some(item => item.isWholesaleEnabled && item.wholesale_price > 0 && item.quantity >= (item.wholesale_min_qty || 5)) && (
              <div className="flex justify-between items-center text-[10px] text-amber-600 font-black uppercase tracking-[0.2em] bg-amber-50 p-2 rounded-lg border border-amber-200">
                <span>⚠️ ATACADO ATIVADO</span>
              </div>
            )}

            <div className={`h-px ${theme.borderLine} my-2 opacity-50`} />
            
            <div className="flex justify-between items-center">
              <span className={`text-[10px] uppercase font-black tracking-widest ${theme.textPrimary}`}>Valor total:</span>
              <span className={`text-xl font-number font-black ${theme.textPrimary}`}>{formatCurrency(total)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10 pb-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.section 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${theme.cardBg} border ${theme.borderLine}`}>
                      <User size={18} className={theme.textPrimary} />
                    </div>
                    <h3 className={`font-sans font-black text-sm uppercase tracking-[0.2em] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText}`}>Dados do Cliente</h3>
                  </div>
                  
                    <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Nome Completo *</label>
                      <input 
                        type="text" 
                        required
                        className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border rounded-lg px-4 py-2.5 text-[10px] ${theme.textPrimary} outline-none transition-all placeholder:text-gray-400 font-sans`}
                        value={formData.name}
                        placeholder="Ex: Maria Fernandes"
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className={`text-[8px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>CPF/CNPJ *</label>
                      <input 
                        type="text" 
                        required
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                        className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border rounded-lg px-4 py-2 text-[9px] ${theme.textPrimary} outline-none transition-all placeholder:text-gray-400 font-sans`}
                        value={formData.cpfCnpj}
                        onChange={e => setFormData({...formData, cpfCnpj: maskCpfCnpj(e.target.value)})}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={`text-[8px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Nascimento *</label>
                        <input 
                          type="text"
                          required
                          placeholder="DD/MM/AAAA"
                          className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border rounded-lg px-4 py-2 text-[9px] ${theme.textPrimary} outline-none transition-all placeholder:text-gray-400 font-sans`}
                          value={formData.birthDate}
                          onChange={e => setFormData({...formData, birthDate: maskDate(e.target.value)})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={`text-[8px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Contato *</label>
                        <input 
                          type="text"
                          required
                          placeholder="(44) 9 9999-9999"
                          className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border rounded-lg px-4 py-2 text-[9px] ${theme.textPrimary} outline-none transition-all placeholder:text-gray-400 font-sans`}
                          value={formData.contact}
                          onChange={e => setFormData({...formData, contact: maskPhone(e.target.value)})}
                        />
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {step === 2 && (
                <motion.section 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${theme.cardBg} border ${theme.borderLine}`}>
                      <Truck size={18} className={theme.textPrimary} />
                    </div>
                    <h3 className={`font-sans font-black text-sm uppercase tracking-[0.2em] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText}`}>Entrega</h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'pickup', label: 'Retirada', icon: '��' },
                      { id: 'delivery', label: 'Delivery', icon: '��' },
                      { id: 'shipping', label: 'Envio', icon: '��' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFormData({...formData, deliveryType: type.id as any})}
                        className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${formData.deliveryType === type.id ? `${theme.textPrimary} ${theme.borderLine} ${theme.cardBg}` : 'border-transparent text-gray-500 hover:bg-white/5'}`}
                      >
                        <span className="text-lg">{type.icon}</span>
                        <span className="text-[9px] font-black uppercase">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  {formData.deliveryType === 'pickup' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-center"
                    >
                      <span className="text-xl">⚠️</span>
                      <p className="text-[10px] text-amber-900 font-medium leading-relaxed">
                        Será agendado data e horário para a retirada diretamente com a empresa via WhatsApp.
                      </p>
                    </motion.div>
                  )}
                  
                  {formData.deliveryType !== 'pickup' && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Endereço Completo *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Rua, número, bairro..."
                          className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border-2 rounded-2xl px-5 py-4 ${theme.textPrimary} outline-none transition-all placeholder:text-gray-400`}
                          value={formData.address}
                          onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2 space-y-1.5">
                          <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Cidade *</label>
                          <input 
                            required
                            className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border-2 rounded-2xl px-5 py-4 ${theme.textPrimary} outline-none transition-all`} 
                            value={formData.city} 
                            onChange={e => setFormData({...formData, city: e.target.value})}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>UF *</label>
                          <input 
                            required
                            maxLength={2}
                            placeholder="SP"
                            className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border-2 rounded-2xl px-5 py-4 ${theme.textPrimary} outline-none transition-all`} 
                            value={formData.state} 
                            onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </motion.section>
              )}

              {step === 3 && (
                <motion.section 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2 rounded-lg ${theme.cardBg} border ${theme.borderLine}`}>
                        <CreditCard size={18} className={theme.textPrimary} />
                      </div>
                      <h3 className={`font-sans font-black text-sm uppercase tracking-[0.2em] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText}`}>Metódos de Pagamento</h3>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-2 gap-2">
                      {[
                        { id: 'mercadopago', label: 'Cartão / Pix / Boleto' },
                        { id: 'cash', label: 'Dinheiro' }
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setFormData({...formData, paymentMethod: method.id as any, installments: 1})}
                          className={`py-3 rounded-xl border-2 text-[9px] uppercase font-black tracking-widest transition-all ${formData.paymentMethod === method.id ? `${theme.textPrimary} ${theme.borderLine} ${theme.cardBg}` : 'border-transparent text-gray-500 hover:bg-white/5'}`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>

                    {formData.paymentMethod === 'mercadopago' && (
                      <div className={`${theme.cardBg} border ${theme.borderLine} rounded-[2rem] p-8 flex flex-col items-center gap-4`}>
                        <div className="text-center">
                          <p className={`text-sm ${theme.textPrimary} mb-2 uppercase font-bold tracking-widest font-sans`}>Pagamento Seguro</p>
                          <p className={`text-xs ${theme.textSecondary} max-w-[250px] leading-relaxed mx-auto mb-4`}>
                            Você será redirecionado para o ambiente seguro do Mercado Pago para efetuar o pagamento via Pix, Cartão de Crédito ou Boleto.
                          </p>
                        </div>
                      </div>
                    )}

                    {formData.paymentMethod === 'cash' && (
                      <div className="space-y-4">
                        <div className="space-y-3">
                          <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Precisa de Troco?</label>
                          <div className="flex gap-4">
                            {['SIM', 'NÃO'].map(opt => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setFormData({...formData, needsChange: opt as any, changeAmount: opt === 'NÃO' ? '' : formData.changeAmount})}
                                className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${formData.needsChange === opt ? `${theme.textPrimary} ${theme.borderLine} ${theme.cardBg}` : 'border-transparent text-gray-500'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>
                        {formData.needsChange === 'SIM' && (
                          <div className="space-y-1.5">
                            <label className={`text-[9px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Troco para quanto? *</label>
                            <input 
                              type="number"
                              required
                              placeholder="Ex: 100.00"
                              className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 rounded-2xl px-5 py-4 ${theme.textPrimary} outline-none`}
                              value={formData.changeAmount}
                              onChange={e => setFormData({...formData, changeAmount: e.target.value})}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${theme.cardBg} border ${theme.borderLine}`}>
                        <Edit3 size={18} className={theme.textPrimary} />
                      </div>
                      <h3 className={`font-sans font-black text-sm uppercase tracking-[0.2em] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText}`}>Personalização</h3>
                    </div>

                    <div className="space-y-1">
                      <label className={`text-[8px] ${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-bold uppercase tracking-widest pl-1`}>Informações Adicionais</label>
                      <textarea 
                        placeholder="Nomes para gravar, cores, detalhes da peça..."
                        className={`w-full ${theme.cardBg} border ${theme.borderLine} focus:border-[#C6A664] focus:ring-1 border rounded-xl px-4 py-2.5 ${theme.textPrimary} min-h-[60px] outline-none transition-all text-[10px] placeholder:text-gray-400 font-sans`}
                        value={formData.observations}
                        onChange={e => setFormData({...formData, observations: e.target.value})}
                      />
                    </div>

                    <div className="space-y-4 pt-2 pb-2">
                      <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer select-none" onClick={() => setFormData({...formData, isEmergency: !formData.isEmergency})}>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.isEmergency ? 'bg-amber-500 border-amber-600 shadow-sm' : 'border-amber-300'}`}>
                          {formData.isEmergency && <CheckCircle size={12} className={theme.textPrimary} />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                             <span className="text-base">��</span> 
                             <span className="font-black text-amber-900 text-[10px] uppercase tracking-wider">Pedido em Emergência?</span>
                          </div>
                          {formData.isEmergency && (
                            <p className="mt-1 text-[10px] text-amber-800 leading-tight">
                              Pedidos com urgência terão uma taxa adicional de {formatCurrency(25)}, pois exigem prioridade na produção e ajuste na agenda. ��
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>

            <div className="flex flex-col gap-4 pt-6">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-3.5 ${theme.btnPrimary} font-sans font-black text-[11px] uppercase tracking-[0.2em] rounded-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      {step < 3 ? 'Próximo Passo' : 'Finalizar Pedido'}
                      <CheckCircle size={18} />
                    </>
                  )}
                </button>
              
              <div className="flex justify-between items-center px-2 pb-6">
                {step > 1 ? (
                  <button 
                    type="button" 
                    onClick={() => setStep(step - 1)}
                    className={`${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} text-[9px] font-black uppercase tracking-widest hover:${theme.textPrimary} transition-colors font-sans`}
                  >
                    ← Voltar
                  </button>
                ) : (
                  <div />
                )}
                <button 
                  type="button" 
                  onClick={() => {
                    onClose();
                  }}
                  className={`${companyId === "mimada" ? "font-bold text-[#FF007F]" : theme.specialText} font-sans text-[9px] font-black uppercase tracking-widest hover:text-rose-400 transition-colors`}
                >
                  Cancelar Pedido
                </button>
              </div>
            </div>
          </form>
          </>
          )}
          {showRoulette && (
            <PrizeRouletteModal 
              isOpen={showRoulette}
              onClose={() => setShowRoulette(false)}
              onResult={onPrizeWon}
              prizes={siteSettings?.roulette_prizes || []}
              theme={{ accentColor: theme.accentColor }}
            />
          )}
        </div>
      </motion.div>
    </div>
  );
};
