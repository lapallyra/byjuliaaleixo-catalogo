import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGiftList, updateGiftListItemStatusByCode } from '../services/firebaseService';
import { ChevronLeft, Gift, ShoppingBag, Loader2, CheckCircle, Lock, Calendar, Sparkles, X, ChevronRight, Plus, Clock, ShoppingCart } from 'lucide-react';
import { Product, AppConfig, CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo } from 'react';
import { ImageWithFallback } from './ImageWithFallback';

interface GiftListViewProps {
  setCarts: any;
  config: AppConfig;
}

export const GiftListView: React.FC<GiftListViewProps> = ({ setCarts, config }) => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [giftList, setGiftList] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail Modal state
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any | null>(null);

  // Reservation Modal state
  const [selectedItemForReserve, setSelectedItemForReserve] = useState<any | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveName, setReserveName] = useState('');
  const [isSubmittingReserve, setIsSubmittingReserve] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const isListCompleted = useMemo(() => {
    if (!giftList || !giftList.items) return false;
    return giftList.items.length > 0 && giftList.items.every((item: any) => item.status === 'presenteado');
  }, [giftList]);

  const fetchList = async () => {
    if (!code) return;
    setLoading(true);
    const fetchedList = await getGiftList(code.toUpperCase());
    if (fetchedList) {
      setGiftList(fetchedList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchList();
  }, [code]);

  const handleBuyProduct = (product: Product, quantityRequested: number) => {
    if (!giftList) return;
    
    // Protection against duplicate purchasing
    if ((product as any).status && (product as any).status !== 'disponivel') {
      setToast("Este item já foi reservado ou presenteado.");
      return;
    }

    const qty = quantityRequested > 0 ? quantityRequested : 1;
    
    // Attach giftListCode to the CartItem so the order records it
    const itemToAdd: CartItem = {
      ...product,
      quantity: qty,
      giftListCode: giftList.code,
    } as any;

    setCarts((prev: CartItem[]) => {
      return [...prev.filter(item => item.id !== product.id), itemToAdd];
    });

    // Notify user with a nice prompt
    setToast(`${product.product_name} foi adicionado à sua sacola de presentes! Conclua no checkout.`);
    setTimeout(() => {
      navigate(`/checkout/${giftList.code}`);
    }, 2000);
  };

  const handleOpenReserveModal = (item: any) => {
    setSelectedItemForReserve(item);
    setReserveName('');
    setIsReserveModalOpen(true);
  };

  const handleConfirmReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !selectedItemForReserve || !reserveName.trim()) return;

    setIsSubmittingReserve(true);
    const success = await updateGiftListItemStatusByCode(
      code.toUpperCase(),
      selectedItemForReserve.id,
      'reservado',
      reserveName.trim()
    );

    setIsSubmittingReserve(false);
    setIsReserveModalOpen(false);

    if (success) {
      setToast(`O item "${selectedItemForReserve.product_name}" foi reservado por ${reserveName.trim()}!`);
      fetchList(); // reload values
    } else {
      setToast("Erro ao reservar o item. Tente novamente.");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return dateStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] font-sans">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="text-[#3D2E24]/10"
            >
              <Loader2 size={40} strokeWidth={1} />
            </motion.div>
          </div>
          <span className="text-[#3D2E24]/40 font-sans text-[9px] uppercase tracking-[0.4em] font-medium">
            Buscando Mimos
          </span>
        </motion.div>
      </div>
    );
  }

  if (!giftList) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FCFAF7] p-6">
        <Gift className="w-16 h-16 text-[#3D2E24]/10 mb-6" />
        <h2 className="text-2xl font-serif text-[#3D2E24] mb-2">Lista não encontrada</h2>
        <p className="text-[#3D2E24]/40 font-medium text-[10px] uppercase tracking-widest mb-8 text-center max-w-sm leading-relaxed">
          O código da lista pode estar incorreto ou a lista foi removida.
        </p>
        <button 
          onClick={() => navigate('/listadepresentes')}
          className="bg-white border border-[#E8DCC8] text-[#3D2E24] hover:text-[#cca062] px-8 py-4.5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all cursor-pointer shadow-sm"
        >
          Ir para Lista de Presentes
        </button>
      </div>
    );
  }

  // Progress calculations
  const totalItemsCount = giftList.items?.length || 0;
  const giftedItemsCount = giftList.items?.filter((item: any) => item.status === 'presenteado').length || 0;
  const listProgressPercent = totalItemsCount > 0 ? Math.round((giftedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FCFAF7] flex flex-col relative font-sans selection:bg-[#E8DCC8] selection:text-[#3A312D]">
      {/* Toast Notification */}
      <AnimatePresence>
        {copySuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000] bg-slate-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-5 h-5 rounded-full bg-pink-600 flex items-center justify-center text-white">
              <CheckCircle size={12} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Link copiado</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => navigate('/')} 
        className="fixed top-6 left-6 p-3 rounded-full bg-white hover:bg-pink-50/20 text-slate-700 hover:text-pink-600 transition-all z-[200] border border-pink-100 shadow-lg cursor-pointer group"
      >
        <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* HEADER SECTION (ELEGANT DESIGN SYSTEM IN LINE WITH THE COZY BRANDING) */}
      <header className="bg-white/90 backdrop-blur-md border-b border-pink-100/50 sticky top-0 z-[100] shadow-xs">
        <div className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 h-20 sm:h-24 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-pink-100">
               <Gift size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-mea-culpa text-slate-900 leading-tight">{giftList.listName || "Lista de Presentes"}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{giftList.hostName}</span>
                <span className="w-1 h-1 rounded-full bg-pink-200 hidden sm:inline" />
                <span className="text-[9px] font-bold text-pink-600 uppercase tracking-widest bg-pink-50 px-2 py-0.5 rounded border border-pink-100/40">#{giftList.code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleCopyLink}
              className="px-4 py-2.5 sm:px-6 sm:py-3 bg-white border border-pink-100 hover:border-pink-300 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] text-slate-700 hover:text-pink-600 transition-all shadow-xs flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Sparkles size={12} className="text-pink-500 animate-pulse" />
              <span className="hidden sm:inline">Compartilhar</span> Link
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONSULTATION */}
      <main className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12 space-y-12 w-full flex-grow">
        
        {/* EVENT DETAILS & INFOS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* HOST DETAILS AND MESSAGE */}
          <div className="lg:col-span-8 bg-white border border-pink-100/50 rounded-[2.5rem] p-8 md:p-10 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-50/30 rounded-bl-full pointer-events-none" />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-pink-500 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100/30">
                  {giftList.eventType || "Celebração"}
                </span>
                {giftList.eventDate && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <Calendar size={12} className="text-pink-400" />
                    {formatDate(giftList.eventDate)}
                  </span>
                )}
              </div>
              
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Homenageado(a)</span>
                <h2 className="text-3xl sm:text-4xl font-mea-culpa text-slate-900 leading-tight">{giftList.hostName}</h2>
              </div>
            </div>

            {giftList.message && (
              <div className="pt-6 border-t border-pink-50/50 space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 block">Mensagem do Anfitrião</span>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-normal italic">
                  "{giftList.message}"
                </p>
              </div>
            )}
          </div>

          {/* LIST PROGRESS & SUMMARY */}
          <div className="lg:col-span-4 bg-white border border-pink-100/50 rounded-[2.5rem] p-8 md:p-10 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Status da Lista</span>
              <h3 className="font-serif text-xl text-slate-900">Progresso dos Mimos</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-pink-50/30 border border-pink-100/20 p-4 rounded-2xl">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Total de Mimos</span>
                <span className="text-2xl font-bold text-slate-800">{totalItemsCount}</span>
              </div>
              <div className="bg-pink-50/30 border border-pink-100/20 p-4 rounded-2xl">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Presenteados</span>
                <span className="text-2xl font-bold text-pink-600">{giftedItemsCount}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Progresso</span>
                <span className="font-bold text-pink-600">{listProgressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-pink-100/50 rounded-full overflow-hidden border border-pink-100/20">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${listProgressPercent}%` }}
                  className="h-full bg-pink-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* COMPLETED STATE HERO */}
        {isListCompleted && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-pink-50 to-white border border-pink-100/60 rounded-[2.5rem] p-10 text-center shadow-xs relative overflow-hidden"
          >
            <span className="text-4xl mb-4 block">🎉</span>
            <h3 className="text-2xl font-serif text-pink-800 mb-2">Lista Concluída!</h3>
            <p className="text-slate-600 text-xs sm:text-sm font-medium max-w-md mx-auto leading-relaxed">
              Todos os mimos selecionados já foram garantidos pelos convidados. Agradecemos imensamente o seu carinho e presença neste momento feliz.
            </p>
          </motion.div>
        )}

        {/* PRODUCTS GRID TITLE */}
        <div className="space-y-2 border-b border-pink-100/30 pb-4">
          <h3 className="text-2xl font-serif text-slate-900">Selecione o Presente</h3>
          <p className="text-xs text-slate-400 font-medium">Toque em qualquer mimos para visualizar detalhes e presentear.</p>
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {(giftList.items || []).map((item: any, idx: number) => {
            const isGifted = item.status === 'presenteado';
            const isReserved = item.status === 'reservado';
            const isAvailable = !isGifted && !isReserved;

            return (
              <motion.div 
                key={item.id || idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => !isGifted && !isReserved && setSelectedItemForDetails(item)}
                className={`group bg-white rounded-[2rem] overflow-hidden border border-pink-100/30 transition-all duration-300 shadow-xs flex flex-col ${
                  (isGifted || isReserved) ? 'grayscale-[0.5] opacity-70 cursor-default' : 'cursor-pointer hover:shadow-md hover:shadow-pink-100/30 hover:-translate-y-1'
                }`}
              >
                <div className="aspect-square relative overflow-hidden bg-pink-50/20">
                  <ImageWithFallback 
                    src={item.image} 
                    alt={item.product_name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  />
                  
                  {/* BADGES */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {isGifted && (
                      <span className="bg-white/95 backdrop-blur-md text-emerald-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 shadow-xs">
                        <CheckCircle size={10} />
                        Presenteado
                      </span>
                    )}
                    {isReserved && (
                      <span className="bg-white/95 backdrop-blur-md text-amber-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 shadow-xs">
                        <Clock size={10} />
                        Reservado
                      </span>
                    )}
                    {isAvailable && (
                      <span className="bg-pink-600 text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xs">
                        <Sparkles size={10} />
                        Disponível
                      </span>
                    )}
                  </div>

                  {/* PRICE TAG */}
                  <div className="absolute bottom-4 right-4">
                    <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-pink-100/40 shadow-sm">
                      <span className="text-xs sm:text-sm font-bold text-pink-600">R$ {item.retail_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-4 space-y-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 block">
                      {item.isKit ? 'Kit Especial' : 'Mimo Singular'}
                    </span>
                    <h4 className="text-lg font-serif text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-1">{item.product_name}</h4>
                  </div>

                  {isGifted && (
                    <div className="mt-auto pt-4 border-t border-pink-50/50 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100/40">
                        <Gift size={12} />
                      </div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">
                        Comprado por: <span className="text-slate-700">{item.giftedBy || "Convidado"}</span>
                      </p>
                    </div>
                  )}

                  {isReserved && (
                    <div className="mt-auto pt-4 border-t border-pink-50/50 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100/40">
                        <Clock size={12} />
                      </div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">
                        Reservado por: <span className="text-slate-700">{item.reservedBy || "Convidado"}</span>
                      </p>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-pink-50/50">
                      <button className="text-[9px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-pink-600 transition-colors flex items-center gap-1 cursor-pointer">
                        Ver Detalhes <ChevronRight size={12} />
                      </button>
                      <div className="w-8 h-8 rounded-full bg-pink-50/50 flex items-center justify-center text-pink-500 group-hover:bg-pink-600 group-hover:text-white transition-all duration-300 border border-pink-100">
                        <Plus size={16} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!giftList.items || giftList.items.length === 0) && (
          <div className="text-center py-20 bg-white border border-dashed border-pink-200/50 rounded-[2.5rem]">
            <Gift className="w-12 h-12 text-pink-200 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-serif text-slate-900 mb-1">Nenhum mimo adicionado</h3>
            <p className="text-slate-400 text-xs font-medium">Esta lista está sendo preparada pelo anfitrião.</p>
          </div>
        )}
      </main>

      {/* DETAILS DIALOG MODAL */}
      <AnimatePresence>
        {selectedItemForDetails && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl relative border border-pink-100/30"
            >
              <button 
                onClick={() => setSelectedItemForDetails(null)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-pink-50/50 transition-all text-slate-400 hover:text-slate-700 outline-none cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="aspect-square w-full rounded-2xl bg-pink-50/20 mb-6 overflow-hidden border border-pink-100/20">
                <ImageWithFallback src={selectedItemForDetails.image} alt={selectedItemForDetails.product_name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-1 mb-4">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {selectedItemForDetails.isKit ? 'Kit Especial' : 'Mimo Exclusivo'}
                </span>
                <h3 className="text-xl font-serif text-slate-900">{selectedItemForDetails.product_name}</h3>
              </div>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed italic">
                "{selectedItemForDetails.description || "Um mimo especial selecionado para celebrar este momento afetuoso."}"
              </p>
              
              <div className="flex items-center justify-between mb-6 pb-6 border-b border-pink-50">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Valor do Mimo</span>
                <span className="text-xl font-bold text-pink-600">R$ {selectedItemForDetails.retail_price.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    const item = selectedItemForDetails;
                    setSelectedItemForDetails(null);
                    handleBuyProduct(item, item.quantity || 1);
                  }}
                  className="w-full py-4 bg-pink-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-pink-700 transition-all shadow-md shadow-pink-100 cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} />
                  Adquirir Presente
                </button>
                
                <button
                  onClick={() => {
                    const item = selectedItemForDetails;
                    setSelectedItemForDetails(null);
                    handleOpenReserveModal(item);
                  }}
                  className="w-full py-4 bg-white border border-pink-100 text-slate-600 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-pink-50 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Gift size={14} className="text-pink-500" />
                  Apenas Reservar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RESERVATION DIALOG MODAL */}
      <AnimatePresence>
        {isReserveModalOpen && selectedItemForReserve && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-sm w-full shadow-2xl relative border border-pink-100/30"
            >
              <button 
                onClick={() => setIsReserveModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-pink-50/50 transition-all text-slate-400 hover:text-slate-700 outline-none cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 border border-pink-100">
                <Gift size={24} />
              </div>
              
              <h3 className="font-serif text-xl text-slate-900 mb-2">
                Quero Reservar
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Insira seu nome abaixo para reservar <strong className="text-slate-800 font-bold">{selectedItemForReserve.product_name}</strong>. Isso evita duplicidades e ajuda na organização do anfitrião.
              </p>
              
              <form onSubmit={handleConfirmReserve} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 pl-1">Seu Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full bg-slate-50 border border-pink-100/30 focus:border-pink-500 focus:bg-white rounded-2xl px-5 py-4 text-sm font-medium outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingReserve || !reserveName.trim()}
                  className="w-full py-4 bg-pink-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-pink-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all flex items-center justify-center gap-2 shadow-md shadow-pink-100 cursor-pointer active:scale-95"
                >
                  {isSubmittingReserve ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#3A312D] text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg border border-white/10 flex items-center gap-2 min-w-[280px] justify-center text-center"
          >
            <ShoppingCart size={14} className="text-pink-400" />
            <span>{toast}</span>
            <Sparkles size={12} className="text-pink-400 animate-pulse animate-duration-1000" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
