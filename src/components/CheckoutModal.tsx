import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Check, ChevronRight, UploadCloud, MapPin, Search, ShieldCheck, HeartHandshake, Box, UserCheck, Gift, Truck, Clock, Calendar } from 'lucide-react';
import { CartItem, CompanyId } from '../types';
import { themes, getTheme } from '../lib/theme';
import { logCheckoutEvent, getSiteSettings, getGlobalSettings, getCustomerByCpf, getCoupons } from '../services/firebaseService';
import { SiteSettings } from '../types';
import { useAuth } from './AuthProvider';
import { ImageWithFallback } from './ImageWithFallback';
import { formatPhone, formatCPFOrCNPJ } from '../utils/masks';
import { formatMoney } from '../lib/formatUtils';


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
  const theme = getTheme(companyId);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings> | null>(null);
  const [globalSettings, setGlobalSettings] = useState<any>(null);
  const { isAdmin } = useAuth();

  const isTestModeActive = !!(globalSettings?.test_mode || siteSettings?.test_mode);
  const showSimulatedButton = isTestModeActive && isAdmin;

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getSiteSettings(companyId);
      if (settings) {
        setSiteSettings(settings);
      }
      const global = await getGlobalSettings();
      if (global) {
        setGlobalSettings(global);
      }
    };
    loadSettings();
  }, [companyId]);

  // Step 1: Personalização
  const [persName, setPersName] = useState('');
  const [persAge, setPersAge] = useState('');
  const [persTheme, setPersTheme] = useState('');
  const [persColors, setPersColors] = useState('');
  const [persObs, setPersObs] = useState('');

  // Serviços Adicionais
  const [additionalServices, setAdditionalServices] = useState<Array<{ id: string; name: string; price: number; description: string }>>([
    {
      id: 'desenvolvimento_exclusivo',
      name: 'Desenvolvimento Exclusivo de Arte',
      price: 15,
      description: 'Será desenvolvido uma arte do 0 exclusiva e baseada nas informações fornecidas por você. A arte será vendida para uso Exclusivo seu.'
    },
    {
      id: 'atendimento_urgencia',
      name: 'Atendimento de Urgência',
      price: 25,
      description: 'Seu pedido será tratado com prioridade máxima de produção e envio rápido.'
    }
  ]);

  // Sincronizar o Atendimento de Urgência com as configurações do Firestore
  useEffect(() => {
    const loadedUrgencyPrice = siteSettings?.urgency_price !== undefined ? siteSettings.urgency_price : globalSettings?.urgency_price;
    const loadedUrgencyDesc = siteSettings?.urgency_description !== undefined ? siteSettings.urgency_description : globalSettings?.urgency_description;

    setAdditionalServices(prev => prev.map(service => {
      if (service.id === 'atendimento_urgencia') {
        return {
          ...service,
          price: loadedUrgencyPrice !== undefined && loadedUrgencyPrice !== null ? loadedUrgencyPrice : service.price,
          description: loadedUrgencyDesc || service.description
        };
      }
      return service;
    }));
  }, [siteSettings, globalSettings]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceDescription, setNewServiceDescription] = useState('');

  const servicesTotal = useMemo(() => {
    return additionalServices
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);
  }, [additionalServices, selectedServices]);

  const handleCreateService = () => {
    if (!newServiceName.trim()) {
      alert("Por favor, preencha o nome do serviço.");
      return;
    }
    const price = parseFloat(newServicePrice) || 0;
    const newService = {
      id: `service_${Date.now()}`,
      name: newServiceName,
      price,
      description: newServiceDescription
    };
    setAdditionalServices([...additionalServices, newService]);
    setSelectedServices([...selectedServices, newService.id]);
    
    // Clear inputs
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceDescription('');
    setIsCreatingService(false);
  };

  const toggleService = (id: string) => {
    if (selectedServices.includes(id)) {
      setSelectedServices(selectedServices.filter(s => s !== id));
    } else {
      setSelectedServices([...selectedServices, id]);
    }
  };

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

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'shipping' | 'retirada'>('delivery');
  const [retiradaDate, setRetiradaDate] = useState('');
  const [retiradaTime, setRetiradaTime] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // Step 3: Pagamento
  const [cupom, setCupom] = useState('');
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [payFullAmount, setPayFullAmount] = useState(false);
  const [couponFeedback, setCouponFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleValidateCoupon = () => {
    const code = cupom.trim().toUpperCase();
    if (!code) {
      setCouponFeedback(null);
      return;
    }

    const realCoupon = couponsList.find(c => c.code?.toUpperCase() === code);
    if (!realCoupon) {
      setCouponFeedback({
        type: 'error',
        message: 'Cupom inválido ou não encontrado.'
      });
      return;
    }

    if (realCoupon.status !== "active") {
      setCouponFeedback({
        type: 'error',
        message: 'Este cupom não está ativo.'
      });
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (realCoupon.startDate && realCoupon.startDate > today) {
      setCouponFeedback({
        type: 'error',
        message: 'Este cupom ainda não é válido.'
      });
      return;
    }
    if (realCoupon.endDate && realCoupon.endDate < today) {
      setCouponFeedback({
        type: 'error',
        message: 'Este cupom já expirou.'
      });
      return;
    }

    if (realCoupon.maxUses && realCoupon.usesCount >= realCoupon.maxUses) {
      setCouponFeedback({
        type: 'error',
        message: 'Este cupom atingiu o limite máximo de usos.'
      });
      return;
    }

    if (realCoupon.minOrderValue && subtotal < realCoupon.minOrderValue) {
      setCouponFeedback({
        type: 'error',
        message: `Valor mínimo de compra para este cupom é R$ ${realCoupon.minOrderValue.toFixed(2)}.`
      });
      return;
    }

    if (realCoupon.scope === "products" && realCoupon.appliedProducts?.length > 0) {
      const hasMatchingProduct = cart.some(item => realCoupon.appliedProducts.includes(item.id));
      if (!hasMatchingProduct) {
        setCouponFeedback({
          type: 'error',
          message: 'Este cupom não se aplica aos itens do carrinho.'
        });
        return;
      }
    }

    if (realCoupon.scope === "categories" && realCoupon.appliedCategories?.length > 0) {
      const hasMatchingCategory = cart.some(item => realCoupon.appliedCategories?.includes(item.category || ""));
      if (!hasMatchingCategory) {
        setCouponFeedback({
          type: 'error',
          message: 'Este cupom não se aplica às categorias dos itens no carrinho.'
        });
        return;
      }
    }

    const valueStr = realCoupon.discountType === "percentage" 
      ? `${realCoupon.discountValue}%` 
      : `R$ ${realCoupon.discountValue.toFixed(2)}`;

    setCouponFeedback({
      type: 'success',
      message: `Cupom ${code} aplicado com sucesso! Desconto de ${valueStr}.`
    });
  };

  useEffect(() => {
    if (isOpen) {
      const loadCoupons = async () => {
        try {
          const list = await getCoupons(companyId);
          setCouponsList(list);
        } catch (e) {
          console.error("Erro ao carregar cupons para checkout:", e);
        }
      };
      loadCoupons();
    }
  }, [isOpen, companyId]);
  
  const [selectedMainOption, setSelectedMainOption] = useState<'full' | 'planned' | ''>('');
  const [plannedMethod, setPlannedMethod] = useState<'credit_card' | 'digital_booklet' | ''>('');
  const [installments, setInstallments] = useState<number>(1);
  const [digitalBookletPayDay, setDigitalBookletPayDay] = useState<string>('01');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pendingBalance, setPendingBalance] = useState<number>(0);

  const fetchCustomerBalance = useCallback(async () => {
    if (!clientCpf) return;
    const cleanCpf = clientCpf.replace(/\D/g, '');
    if (cleanCpf.length === 11 || cleanCpf.length === 14) {
      const customer = await getCustomerByCpf(cleanCpf, companyId);
      if (customer && customer.pendingBalance) {
        setPendingBalance(customer.pendingBalance);
      } else {
        setPendingBalance(0);
      }
    }
  }, [clientCpf, companyId]);

  useEffect(() => {
    if (clientCpf.replace(/\D/g, '').length >= 11) {
       fetchCustomerBalance();
    }
  }, [clientCpf, fetchCustomerBalance]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchBookings = async () => {
      try {
        const res = await fetch('/api/data/pickup-slots');
        const data = await res.json();
        if (data.success) {
          setBookedSlots(data.slots);
        }
      } catch (error) {
        console.error("Erro ao buscar agendamentos de retirada:", error);
      }
    };
    fetchBookings();
  }, [isOpen]);

  const generateTimeSlots = (dateStr: string) => {
    if (!dateStr) return [];
    
    const d = new Date(dateStr + 'T12:00:00');
    const day = d.getDay();
    const isWeekend = day === 0 || day === 6;

    const slots: string[] = [];

    if (!isWeekend) {
      // Mon-Fri: 11:40 to 12:40, 18:00 to 21:00
      let h = 11, m = 40;
      while (h < 12 || (h === 12 && m <= 40)) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        m += 20;
        if (m >= 60) {
          h += 1;
          m = 0;
        }
      }
      h = 18; m = 0;
      while (h < 21 || (h === 21 && m <= 0)) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        m += 20;
        if (m >= 60) {
          h += 1;
          m = 0;
        }
      }
    } else {
      // Sat-Sun: 09:00 to 14:00
      let h = 9, m = 0;
      while (h < 14 || (h === 14 && m <= 0)) {
        slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        m += 20;
        if (m >= 60) {
          h += 1;
          m = 0;
        }
      }
    }
    return slots;
  };

  const subtotal: number = useMemo(() => cart.reduce((sum, item) => sum + ((item.retail_price || 0) * (item.quantity || 1)), 0), [cart]);
  
  const discount: number = useMemo(() => {
    const code = cupom.trim().toUpperCase();
    if (!code) return 0;

    // Now check real database coupons
    const realCoupon = couponsList.find(c => c.code?.toUpperCase() === code);
    if (!realCoupon) return 0;

    // Validate status
    if (realCoupon.status !== "active") return 0;

    // Validate dates
    const today = new Date().toISOString().split('T')[0];
    if (realCoupon.startDate && realCoupon.startDate > today) return 0;
    if (realCoupon.endDate && realCoupon.endDate < today) return 0;

    // Validate uses count
    if (realCoupon.maxUses && realCoupon.usesCount >= realCoupon.maxUses) return 0;

    // Validate minOrderValue
    if (realCoupon.minOrderValue && subtotal < realCoupon.minOrderValue) return 0;

    // Check restrictions/scope
    if (realCoupon.scope === "products" && realCoupon.appliedProducts?.length > 0) {
      const hasMatchingProduct = cart.some(item => realCoupon.appliedProducts.includes(item.id));
      if (!hasMatchingProduct) return 0;
    }
    if (realCoupon.scope === "categories" && realCoupon.appliedCategories?.length > 0) {
      const hasMatchingCategory = cart.some(item => realCoupon.appliedCategories?.includes(item.category || ""));
      if (!hasMatchingCategory) return 0;
    }

    // Calculate discount amount
    const nonExcludedSubtotal = cart.reduce((sum, item) => {
      const isExcluded = realCoupon.excludedProducts?.includes(item.id);
      return sum + (isExcluded ? 0 : ((item.retail_price || 0) * (item.quantity || 1)));
    }, 0);

    if (realCoupon.discountType === "percentage") {
      return nonExcludedSubtotal * (realCoupon.discountValue / 100);
    } else {
      return Math.min(realCoupon.discountValue, nonExcludedSubtotal);
    }
  }, [cupom, subtotal, couponsList, cart]);
  
  const delivery: number = useMemo(() => {
    if (deliveryType === 'retirada') return 0;
    if (deliveryType === 'delivery') return 2;
    
    // shipping
    const rules = globalSettings?.shipping_rules || siteSettings?.shipping_rules;
    if (!cep || !rules) return 0;
    
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length < 8) return 0;

    const numericCep = parseInt(cleanCep, 10);
    
    const rule = rules.find((r: any) => 
      r.active && 
      numericCep >= parseInt(r.cep_start, 10) && 
      numericCep <= parseInt(r.cep_end, 10)
    );

    return rule ? rule.price : 0;
  }, [deliveryType, cep, siteSettings, globalSettings]);

  const total: number = subtotal - discount + delivery + pendingBalance + servicesTotal;

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

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!clientName) newErrors.clientName = 'Nome é obrigatório.';
    if (!clientContact) newErrors.clientContact = 'Contato é obrigatório.';
    if (!clientCpf) newErrors.clientCpf = 'CPF é obrigatório.';
    
    if (deliveryType !== 'retirada') {
      if (!cep) newErrors.cep = 'CEP é obrigatório.';
      if (!rua) newErrors.rua = 'Rua é obrigatória.';
      if (!numero) newErrors.numero = 'Número é obrigatório.';
      if (!bairro) newErrors.bairro = 'Bairro é obrigatório.';
      if (!cidade) newErrors.cidade = 'Cidade é obrigatória.';
      if (!estado) newErrors.estado = 'Estado é obrigatório.';
    } else {
      if (!retiradaDate) newErrors.retiradaDate = 'Selecione a data para a retirada.';
      if (!retiradaTime) newErrors.retiradaTime = 'Selecione o horário para a retirada.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      logCheckoutEvent('Dados e Entrega', {
        companyId,
        clientName: clientName || undefined,
        total,
        itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      });
    }
    setStep(s => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleFinalize = () => {
    if (total > 100) {
       if (!selectedMainOption) {
         setErrors({ payment: 'Selecione uma forma de pagamento' });
         return;
       }
       if (selectedMainOption === 'planned' && !plannedMethod) {
         setErrors({ payment: 'Selecione um método de pagamento planejado' });
         return;
       }
    }

    const isFullPayment = total <= 100 || selectedMainOption === 'full';
    const amountToPay = isFullPayment ? total : total / 2;

    const remainingAmount = isFullPayment ? 0 : total / 2;
    let remainingFee = 0;
    if (selectedMainOption === 'planned') {
      if (plannedMethod === 'credit_card') {
         remainingFee = remainingAmount * 0.05; // mp fee mock
      } else if (plannedMethod === 'digital_booklet') {
         const feeMap: Record<number, number> = {1:0, 2:0.0609, 3:0.0701, 4:0.0791, 5:0.0880, 6:0.1000};
         remainingFee = remainingAmount * (feeMap[installments] || 0);
      }
    }
    const remainingInstallmentValue = (remainingAmount + remainingFee) / installments;

    logCheckoutEvent('Pagamento MP', {
      companyId,
      clientName: clientName || 'Anônimo',
      total,
      itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      description: `Método: Mercado Pago, Sinal: ${isFullPayment ? 'Integral' : '50%'}, Valor Pago: R$ ${amountToPay.toFixed(2)}`
    });

    const selectedServicesDetails = additionalServices
      .filter(s => selectedServices.includes(s.id))
      .map(s => `${s.name} (R$ ${s.price.toFixed(2).replace('.', ',')})`)
      .join(', ');

    const formattedPersObs = selectedServicesDetails
      ? `${persObs ? persObs + '\n\n' : ''}Serviços Adicionais Selecionados: ${selectedServicesDetails}`
      : persObs;

    onCheckoutSubmit({
      personalization: { persName, persAge, persTheme, persColors, persObs: formattedPersObs },
      client: { clientName, clientContact, clientCpf, clientEmail, pendingBalance },
      address: deliveryType !== 'retirada' ? { cep, rua, numero, bairro, cidade, estado, ref } : undefined,
      cupom,
      shippingCost: deliveryType === 'retirada' ? 0 : delivery,
      total,
      isFullPayment,
      amountToPay,
      paymentMode: total <= 100 ? 'full' : selectedMainOption,
      plannedMethod: selectedMainOption === 'planned' ? plannedMethod : undefined,
      remainingInstallments: selectedMainOption === 'planned' ? installments : undefined,
      remainingAmount,
      remainingFee,
      remainingInstallmentValue,
      bookletPayDay: selectedMainOption === 'planned' && plannedMethod === 'digital_booklet' ? digitalBookletPayDay : undefined,
      deliveryType,
      retiradaDate: deliveryType === 'retirada' ? retiradaDate : undefined,
      retiradaTime: deliveryType === 'retirada' ? retiradaTime : undefined
    });
  };

  const handleSimulatedCheckout = () => {
    if (total > 100) {
       if (!selectedMainOption) {
         setErrors({ payment: 'Selecione uma forma de pagamento' });
         return;
       }
       if (selectedMainOption === 'planned' && !plannedMethod) {
         setErrors({ payment: 'Selecione um método de pagamento planejado' });
         return;
       }
    }

    const isFullPayment = total <= 100 || selectedMainOption === 'full';
    const amountToPay = isFullPayment ? total : total / 2;

    const remainingAmount = isFullPayment ? 0 : total / 2;
    let remainingFee = 0;
    if (selectedMainOption === 'planned') {
      if (plannedMethod === 'credit_card') {
         remainingFee = remainingAmount * 0.05;
      } else if (plannedMethod === 'digital_booklet') {
         const feeMap: Record<number, number> = {1:0, 2:0.0609, 3:0.0701, 4:0.0791, 5:0.0880, 6:0.1000};
         remainingFee = remainingAmount * (feeMap[installments] || 0);
      }
    }
    const remainingInstallmentValue = (remainingAmount + remainingFee) / installments;

    logCheckoutEvent('Pagamento MP Simulado', {
      companyId,
      clientName: clientName || 'Anônimo',
      total,
      itemsCount: cart.reduce((sum, item) => sum + (item.quantity || 1), 0),
      description: `Método: Teste Simulado, Sinal: ${isFullPayment ? 'Integral' : '50%'}, Valor: R$ ${amountToPay.toFixed(2)}`
    });

    const selectedServicesDetails = additionalServices
      .filter(s => selectedServices.includes(s.id))
      .map(s => `${s.name} (R$ ${s.price.toFixed(2).replace('.', ',')})`)
      .join(', ');

    const formattedPersObs = selectedServicesDetails
      ? `${persObs ? persObs + '\n\n' : ''}Serviços Adicionais Selecionados: ${selectedServicesDetails}`
      : persObs;

    onCheckoutSubmit({
      personalization: { persName, persAge, persTheme, persColors, persObs: formattedPersObs },
      client: { clientName, clientContact, clientCpf, clientEmail, pendingBalance },
      address: deliveryType !== 'retirada' ? { cep, rua, numero, bairro, cidade, estado, ref } : undefined,
      cupom,
      shippingCost: deliveryType === 'retirada' ? 0 : delivery,
      total,
      isFullPayment,
      amountToPay,
      paymentMode: total <= 100 ? 'full' : selectedMainOption,
      plannedMethod: selectedMainOption === 'planned' ? plannedMethod : undefined,
      remainingInstallments: selectedMainOption === 'planned' ? installments : undefined,
      remainingAmount,
      remainingFee,
      remainingInstallmentValue,
      bookletPayDay: selectedMainOption === 'planned' && plannedMethod === 'digital_booklet' ? digitalBookletPayDay : undefined,
      isSimulated: true,
      deliveryType,
      retiradaDate: deliveryType === 'retirada' ? retiradaDate : undefined,
      retiradaTime: deliveryType === 'retirada' ? retiradaTime : undefined
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
           { id: 1, label: 'Entrega' },
           { id: 2, label: 'Pagamento' }
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
    <div className={`w-full ${!isStep3 ? 'lg:w-[325px] xl:w-[350px]' : ''} bg-white rounded-3xl border border-gray-100/80 p-6 lg:p-8 flex flex-col ${!isStep3 ? 'lg:sticky lg:top-[115px]' : ''} shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]`}>
       
       {pendingBalance > 0 && (
         <div className="bg-[#FAF9F6] border border-[#F0E6D2] rounded-3xl p-6 mb-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-2">Aviso Importante</h4>
            <p className="text-[11px] text-gray-600 leading-relaxed font-medium">
              Seu cadastro possui um saldo pendente de <span className="font-bold text-amber-800">R$ {pendingBalance.toFixed(2).replace('.', ',')}</span> referente a um pedido anterior.<br/>
              Esse valor será integrado automaticamente ao total do novo pedido.
            </p>
         </div>
       )}

       {/* BLOCO 1: RESUMO DO PEDIDO */}
       <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-bold text-gray-900 tracking-wider flex items-center gap-2 mb-6 uppercase text-sm">
            <Box size={18} style={{ color: theme.accentColor }} /> Resumo do Pedido
          </h3>
          
          <div className="space-y-5 mb-6">
            {cart.map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-50 overflow-hidden shrink-0 border border-gray-100 shadow-sm relative group">
                  <ImageWithFallback src={item.image} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h4 className="text-sm font-semibold text-gray-800 pr-2 line-clamp-2 leading-tight">{item.product_name}</h4>
                  <p className="text-[11px] text-gray-500 mt-1 uppercase tracking-wider">{item.category}</p>
                  
                  {/* Render Selections */}
                  {(item.selectedVariation || (item.selectedAddons && item.selectedAddons.length > 0) || item.personalizationValues) && (
                    <div className="text-[10px] text-gray-500 mt-1 space-y-0.5 leading-tight">
                      {item.selectedVariation && <p className="truncate">{item.selectedVariation}</p>}
                      {item.selectedAddons && item.selectedAddons.length > 0 && <p className="truncate">+{item.selectedAddons.length} Serv. Adicional(is)</p>}
                      {item.personalizationValues && Object.keys(item.personalizationValues).length > 0 && <p className="truncate">Personalizado</p>}
                    </div>
                  )}

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
                <span className="font-medium">- R$ {formatMoney(discount)}</span>
              </div>
            )}
            {additionalServices.filter(s => selectedServices.includes(s.id)).map(s => (
              <div key={s.id} className="flex justify-between text-sm text-gray-500">
                <span>{s.name}</span>
                <span className="font-medium">R$ {s.price.toFixed(2).replace('.', ',')}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Truck size={14} className="opacity-40" /> Entrega
              </span>
              <span className="font-medium">
                {cep.replace(/\D/g, '').length < 8 ? 'Informe o CEP' : 
                 delivery === 0 && (globalSettings?.shipping_rules?.some((r: any) => r.active) || siteSettings?.shipping_rules?.some(r => r.active)) ? 'Sob Consulta' : 
                 `R$ ${formatMoney(delivery)}`}
              </span>
            </div>
            
            <div className="flex justify-between text-xl font-bold pt-5 border-t border-gray-100 mt-2" style={{ color: theme.accentColor }}>
              <span>Total</span>
              <span>R$ {formatMoney(total)}</span>
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
                       <span className="text-[10px] text-gray-400 line-through">R$ {formatMoney(upsell.oldPrice)}</span>
                       <span className="text-xs font-bold" style={{ color: theme.accentColor }}>R$ {formatMoney(upsell.price)}</span>
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
    <div className="fixed inset-0 z-[2000] flex flex-col bg-[#F8F5F2] overflow-y-auto text-gray-600 font-sans pb-16">
      {renderHeader()}

      {/* Two Columns Layout for Steps 1 & 2 */}
      {step < 3 && (
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 md:py-12 flex flex-col lg:flex-row gap-10 items-start relative lg:pb-32">
          
          {/* Left Column (Dynamic Forms) */}
          <div className="flex-grow w-full bg-white p-6 md:p-8 lg:p-12 rounded-3xl border border-gray-100/80 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
             <div className="w-full">
               
               {step === 1 && (
                 <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }} className="space-y-10 pb-20 lg:pb-0">
                   <div>
                     <h2 className="text-3xl font-bold text-[#4E3F30] mb-2">Forma de Entrega</h2>
                      <p className="text-sm text-gray-500">Escolha como deseja receber ou retirar o seu pedido.</p>
                    </div>

                    {/* Opções de Entrega */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                          { id: 'retirada', label: 'Retirada no Ateliê', description: 'Cliente retira pessoalmente', icon: Clock },
                          { id: 'delivery', label: 'Delivery Local', description: 'Entrega via motoboy (R$ 2,00)', icon: MapPin },
                          { id: 'shipping', label: 'Correios/Transportadora', description: 'Envio com frete calculado', icon: Truck }
                        ].map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = deliveryType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setDeliveryType(opt.id as any);
                                setErrors(p => ({ ...p, cep: '', rua: '', numero: '', bairro: '', cidade: '', estado: '', retiradaDate: '', retiradaTime: '' }));
                              }}
                              className={`flex flex-col items-start p-5 rounded-2xl border text-left transition-all ${
                                isSelected
                                  ? 'bg-rose-50/50 border-rose-350 ring-2'
                                  : 'bg-white border-gray-100 hover:border-gray-300'
                              }`}
                              style={isSelected ? { borderColor: theme.accentColor, '--tw-ring-color': theme.accentColor + '20' } as any : {}}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Icon size={18} className={isSelected ? 'text-[theme.accentColor]' : 'text-gray-400'} style={isSelected ? { color: theme.accentColor } : {}} />
                                <span className={`text-xs font-bold ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {opt.label}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 leading-snug">
                                {opt.description}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    
                   
                   <div className="space-y-4">
                     <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Seus Dados</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-1 md:col-span-2">
                         <input value={clientName} onChange={e => { setClientName(e.target.value); setErrors(p => ({...p, clientName: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.clientName ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Nome Completo" />
                         {errors.clientName && <p className="text-red-500 text-xs px-2">{errors.clientName}</p>}
                       </div>
                       <div className="space-y-1">
                         <input value={clientContact} onChange={e => { setClientContact(formatPhone(e.target.value)); setErrors(p => ({...p, clientContact: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.clientContact ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="WhatsApp (DDD + Número)" />
                         {errors.clientContact && <p className="text-red-500 text-xs px-2">{errors.clientContact}</p>}
                       </div>
                       <div className="space-y-1 relative">
                         <input value={clientCpf} onChange={e => { setClientCpf(formatCPFOrCNPJ(e.target.value)); setErrors(p => ({...p, clientCpf: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.clientCpf ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="CPF / CNPJ" />
                         {errors.clientCpf && <p className="text-red-500 text-xs px-2">{errors.clientCpf}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-2">
                         <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} type="email" className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="E-mail" />
                       </div>
                     </div>
                   </div>

                   {deliveryType !== 'retirada' && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-2">Endereço</h3>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <div className="space-y-1 md:col-span-2 relative">
                         <div className="flex gap-2">
                           <input value={cep} onChange={e => { setCep(e.target.value); setErrors(p => ({...p, cep: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.cep ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="CEP" />
                           <button onClick={handleBuscarCep} className="bg-gray-800 text-white px-5 rounded-2xl hover:bg-gray-900 transition-colors flex items-center justify-center shrink-0">
                             <Search size={18} />
                           </button>
                         </div>
                         {errors.cep && <p className="text-red-500 text-xs px-2">{errors.cep}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-4">
                         <input value={rua} onChange={e => { setRua(e.target.value); setErrors(p => ({...p, rua: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.rua ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Endereço (Rua, Av.)" />
                         {errors.rua && <p className="text-red-500 text-xs px-2">{errors.rua}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={numero} onChange={e => { setNumero(e.target.value); setErrors(p => ({...p, numero: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.numero ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Número" />
                         {errors.numero && <p className="text-red-500 text-xs px-2">{errors.numero}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-3">
                         <input value={ref} onChange={e => setRef(e.target.value)} className="w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium" style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Complemento / Referência" />
                       </div>
                       <div className="space-y-1 md:col-span-2">
                         <input value={bairro} onChange={e => { setBairro(e.target.value); setErrors(p => ({...p, bairro: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.bairro ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Bairro" />
                         {errors.bairro && <p className="text-red-500 text-xs px-2">{errors.bairro}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={cidade} onChange={e => { setCidade(e.target.value); setErrors(p => ({...p, cidade: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium ${errors.cidade ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="Cidade" />
                         {errors.cidade && <p className="text-red-500 text-xs px-2">{errors.cidade}</p>}
                       </div>
                       <div className="space-y-1 md:col-span-1">
                         <input value={estado} onChange={e => { setEstado(e.target.value); setErrors(p => ({...p, estado: ''})) }} className={`w-full p-4 bg-[#F8F5F2] border-0 rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium uppercase ${errors.estado ? 'ring-2 ring-red-400' : ''}`} style={{ '--tw-ring-color': theme.accentColor + '50' } as any} placeholder="UF" maxLength={2} />
                         {errors.estado && <p className="text-red-500 text-xs px-2">{errors.estado}</p>}
                       </div>
                     </div>
                    </div>
                    )}

                    {deliveryType === 'retirada' && (
                      <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="space-y-2">
                          <h3 className="text-xs font-bold text-gray-901 uppercase tracking-widest border-b border-gray-100 pb-2">Agendamento de Retirada</h3>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-loose">Selecione uma data e um horário disponível abaixo.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Data da Retirada</label>
                            <input
                              type="date"
                              min={new Date().toISOString().split('T')[0]}
                              value={retiradaDate}
                              onChange={(e) => {
                                setRetiradaDate(e.target.value);
                                setRetiradaTime('');
                                setErrors(p => ({ ...p, retiradaDate: '', retiradaTime: '' }));
                              }}
                              className={`w-full p-4 bg-[#F8F5F2] border ${errors.retiradaDate ? 'border-red-300' : 'border-transparent'} rounded-2xl focus:ring-2 outline-none transition-all text-sm font-medium text-gray-800`}
                              style={{ '--tw-ring-color': theme.accentColor + '50' } as any}
                            />
                            {errors.retiradaDate && <p className="text-red-500 text-xs px-2 mt-1">{errors.retiradaDate}</p>}
                          </div>

                          {retiradaDate && (
                            <div className="space-y-2 md:col-span-2 mt-2">
                              <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Horários de Retirada Disponíveis (De 20 em 20 min)</label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 pt-2">
                                {generateTimeSlots(retiradaDate).map((time) => {
                                  const isBooked = bookedSlots.includes(`${retiradaDate}_${time}`);
                                  const isSelected = retiradaTime === time;

                                  return (
                                    <button
                                      key={time}
                                      type="button"
                                      disabled={isBooked}
                                      onClick={() => {
                                        setRetiradaTime(time);
                                        setErrors(p => ({ ...p, retiradaTime: '' }));
                                      }}
                                      className={`p-3 rounded-xl text-center border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                                        isBooked
                                          ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed opacity-50'
                                          : isSelected
                                          ? 'bg-rose-50 border-rose-300 shadow-sm'
                                          : 'bg-white text-gray-700 border-gray-100 hover:border-rose-200'
                                      }`}
                                      style={isSelected && !isBooked ? { color: theme.accentColor, borderColor: theme.accentColor, backgroundColor: theme.accentColor + '10' } : {}}
                                    >
                                      <span>{time}</span>
                                      {isBooked ? (
                                        <span className="text-[7px] uppercase tracking-widest text-[#B45309] font-black">Ocupado</span>
                                      ) : (
                                        <span className={`text-[7px] uppercase tracking-widest font-bold ${isSelected ? 'text-gray-900' : 'text-emerald-500'}`} style={isSelected ? { color: theme.accentColor } : {}}>Livre</span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                              {errors.retiradaTime && <p className="text-red-500 text-xs px-2 mt-1">{errors.retiradaTime}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

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
      {step === 2 && (
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
                          <span className="block text-xs mt-0.5">{formatPhone(clientContact)} | {clientEmail}</span>
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
                          <span className="font-medium text-gray-700">R$ {formatMoney(subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Truck size={14} className="opacity-40" /> Entrega
                          </span>
                          <span className="font-medium text-gray-700">
                            {cep.replace(/\D/g, '').length < 8 ? 'Informe o CEP' : 
                             delivery === 0 && (globalSettings?.shipping_rules?.some((r: any) => r.active) || siteSettings?.shipping_rules?.some(r => r.active)) ? 'Sob Consulta' : 
                             `R$ ${delivery.toFixed(2).replace('.', ',')}`}
                          </span>
                        </div>
                        
                        <div className="flex gap-2 pt-2">
                          <input 
                            value={cupom} 
                            onChange={e => {
                              setCupom(e.target.value.toUpperCase());
                              setCouponFeedback(null);
                            }} 
                            className="flex-1 p-3 bg-[#F8F5F2] border-0 rounded-xl focus:ring-2 outline-none transition-all text-xs font-bold text-gray-700 uppercase" 
                            style={{ '--tw-ring-color': theme.accentColor + '50' } as any} 
                            placeholder="CUPOM" 
                          />
                          <button 
                            type="button"
                            onClick={handleValidateCoupon}
                            className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-xl text-xs font-bold tracking-wider transition-colors"
                          >
                            APLICAR
                          </button>
                        </div>

                        {couponFeedback && (
                          <div className={`text-[10px] font-bold px-1 ${couponFeedback.type === 'success' ? 'text-green-600' : 'text-red-500'} transition-all`}>
                            {couponFeedback.message}
                          </div>
                        )}

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
                       <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider relative z-10">
                          Escolha como deseja finalizar seu pedido
                       </h3>

                       {total <= 100 ? (
                         <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 relative z-10 text-orange-800">
                           <p className="text-sm font-medium">Pagamento integral obrigatório para pedidos até R$100.</p>
                           <p className="text-xs mt-1">Métodos aceitos: PIX e Cartão de Crédito via Mercado Pago.</p>
                         </div>
                       ) : (
                         <div className="space-y-4">
                           <div className="p-4 rounded-xl bg-[#F8F5F2] border border-gray-100 text-sm font-medium text-gray-700">
                             Para iniciar a produção do seu pedido, trabalhamos com uma entrada inicial de 50% (<span className="font-bold text-gray-950">R$ {(total / 2).toFixed(2).replace('.', ',')}</span>). Escolha abaixo como deseja finalizar o valor restante.
                             
                           </div>

                           {/* Card 1: Pagamento Total */}
                           <label className={`flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedMainOption === 'full' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`} style={{ borderColor: selectedMainOption === 'full' ? theme.accentColor : '#F3F4F6' }}>
                             <div className="flex items-start gap-4">
                               <div className="mt-1">
                                 <input type="radio" name="paymentOption" checked={selectedMainOption === 'full'} onChange={() => { setSelectedMainOption('full'); setErrors(p => ({...p, payment: ''})) }} className="w-5 h-5 cursor-pointer" style={{ accentColor: theme.accentColor }} />
                               </div>
                               <div>
                                 <span className="block font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
                                   ⚡ Pagamento total
                                 </span>
                                 <span className="text-xs text-gray-500 leading-relaxed block">
                                   Finalize agora o restante do pedido com aprovação imediata.
                                 </span>
                               </div>
                             </div>
                           </label>

                           {/* Card 2: Pagamento Planejado */}
                           <label className={`flex flex-col p-5 border-2 rounded-2xl cursor-pointer transition-all ${selectedMainOption === 'planned' ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`} style={{ borderColor: selectedMainOption === 'planned' ? theme.accentColor : '#F3F4F6' }}>
                             <div className="flex items-start gap-4">
                               <div className="mt-1">
                                 <input type="radio" name="paymentOption" checked={selectedMainOption === 'planned'} onChange={() => { setSelectedMainOption('planned'); setErrors(p => ({...p, payment: ''})) }} className="w-5 h-5 cursor-pointer" style={{ accentColor: theme.accentColor }} />
                               </div>
                               <div className="w-full">
                                 <span className="block font-bold text-gray-900 mb-1 flex items-center gap-2 text-base">
                                   📅 Pagamento planejado
                                 </span>
                                 <span className="text-xs text-gray-500 leading-relaxed block">
                                   Parcele o valor restante com cobrança automática e acompanhamento personalizado.
                                 </span>

                                 {/* Planned options */}
                                 {selectedMainOption === 'planned' && (
                                   <div className="mt-4 space-y-4 pt-4 border-t border-gray-200" onClick={e => e.stopPropagation()}>
                                     <div className="flex flex-col gap-2">
                                       <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                         <input type="radio" name="plannedMethod" checked={plannedMethod === 'credit_card'} onChange={() => { setPlannedMethod('credit_card'); setInstallments(1); }} className="w-4 h-4" />
                                         Cartão de crédito
                                       </label>
                                       <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                                         <input type="radio" name="plannedMethod" checked={plannedMethod === 'digital_booklet'} onChange={() => { setPlannedMethod('digital_booklet'); setInstallments(1); }} className="w-4 h-4" />
                                         Carnê digital
                                       </label>
                                     </div>

                                     {plannedMethod && (
                                       <div className="mt-3">
                                         {plannedMethod === 'digital_booklet' ? (
                                           <div className="space-y-4 pt-4 border-t border-gray-200">
                                             <div>
                                               <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Melhor dia para pagamento:</span>
                                               <select value={digitalBookletPayDay} onChange={e => setDigitalBookletPayDay(e.target.value)} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2" style={{ '--tw-ring-color': theme.accentColor + '50' } as any}>
                                                 {['01', '05', '15', '20'].map(day => <option key={day} value={day}>Dia {day}</option>)}
                                               </select>
                                             </div>
                                             
                                             <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-md">Após o vencimento será aplicada multa de 5% e juros de 0,50%.</p>

                                             <div>
                                               <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Parcelas:</span>
                                               <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))} className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2" style={{ '--tw-ring-color': theme.accentColor + '50' } as any}>
                                                 {[1, 2, 3, 4, 5, 6].map(num => {
                                                   const fees: Record<number, number> = { 1: 0, 2: 0.0609, 3: 0.0701, 4: 0.0791, 5: 0.0880, 6: 0.1000 };
                                                   const fee = fees[num] || 0;
                                                   const baseParaPlanejar = total / 2;
                                                   const finalTotal = baseParaPlanejar * (1 + fee);
                                                   const instValue = finalTotal / num;
                                                   return <option key={num} value={num}>{num}x {num===1 ? 'sem acréscimo' : `de R$ ${instValue.toFixed(2).replace('.', ',')}`}</option>
                                                 })}
                                               </select>
                                             </div>

                                             <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                                               <div className="flex justify-between"><span>Valor original:</span><span className="font-bold">R$ {(total / 2).toFixed(2).replace('.', ',')}</span></div>
                                               <div className="flex justify-between"><span>Taxa aplicada:</span><span className="font-bold">{( ({1:0, 2:0.0609, 3:0.0701, 4:0.0791, 5:0.0880, 6:0.1000}[installments] || 0) * 100).toFixed(2).replace('.', ',')}%</span></div>
                                               <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 mt-1 pt-1"><span>Valor final:</span><span>R$ {((total / 2) * (1 + ({1:0, 2:0.0609, 3:0.0701, 4:0.0791, 5:0.0880, 6:0.1000}[installments] || 0))).toFixed(2).replace('.', ',')}</span></div>
                                               <div className="flex justify-between"><span>Parcelamento:</span><span className="font-bold">{installments}x de R$ {( ((total / 2) * (1 + ({1:0, 2:0.0609, 3:0.0701, 4:0.0791, 5:0.0880, 6:0.1000}[installments] || 0))) / installments ).toFixed(2).replace('.', ',')}</span></div>
                                             </div>
                                           </div>
                                         ) : (
                                           <>
                                            <span className="text-xs font-bold text-gray-500 uppercase block mb-1">Parcelas:</span>
                                            <select value={installments} onChange={e => setInstallments(parseInt(e.target.value))} className="mt-1 w-full p-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2" style={{ '--tw-ring-color': theme.accentColor + '50' } as any}>
                                               {[1, 2, 3, 4].map(num => {
                                                 const remainingBase = total / 2;
                                                 const feeAmount = remainingBase * 0.05;
                                                 const instValue = (remainingBase + feeAmount) / num;
                                                 return (
                                                   <option key={num} value={num}>{num}x de R$ {instValue.toFixed(2).replace('.', ',')} (com taxa)</option>
                                                 )
                                               })}
                                            </select>
                                           </>
                                         )}
                                       </div>
                                     )}
                                   </div>
                                 )}
                               </div>
                             </div>
                           </label>
                         </div>
                       )}
                       {errors.payment && <p className="text-red-500 text-xs mt-3 px-2 text-center font-medium">{errors.payment}</p>}
                    </div>

                     <div className="pt-2">
                       <button 
                         onClick={handleFinalize}
                         disabled={isSubmitting}
                         className="w-full py-6 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-lg hover:shadow-xl disabled:opacity-70 disabled:hover:scale-100 mb-3"
                         style={{ backgroundColor: isSubmitting ? '#9CA3AF' : theme.accentColor, boxShadow: isSubmitting ? 'none' : `0 10px 25px -5px ${theme.accentColor}50` }}
                       >
                         <Lock size={18} /> {isSubmitting ? 'Processando...' : `Pagar R$ ${(total > 100 && !payFullAmount ? total/2 : total).toFixed(2).replace('.', ',')}`}
                       </button>
                       
                       {showSimulatedButton && (
                         <button 
                           onClick={handleSimulatedCheckout}
                           disabled={isSubmitting}
                           className="w-full py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-transform hover:scale-[1.01] active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-70 disabled:hover:scale-100 border border-amber-400 mb-6"
                         >
                           <Check size={18} /> Simular pagamento aprovado [MODO TESTE]
                         </button>
                       )}
                       
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
