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

  // Reservation Modal state
  const [selectedItemForDetails, setSelectedItemForDetails] = useState<any | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

    // Notify user with a nice prompt first
    setToast(`${product.product_name} foi adicionado à sua sacola como presente! Conclua a compra no checkout para oficializar.`);
    setTimeout(() => {
      navigate('/');
    }, 2500);
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
      setToast(`O item "${selectedItemForReserve.product_name}" foi reservado com sucesso por ${reserveName.trim()}!`);
      fetchList(); // reload values
    } else {
      setToast("Houve um problema ao reservar o item. Por favor, tente novamente.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6F2]">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mb-4" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Carregando Lista...</p>
      </div>
    );
  }

  if (!giftList) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F6F2]">
        <Gift className="w-16 h-16 text-gray-300 mb-6" />
        <h2 className="text-2xl font-fancy text-[#D4AF37] mb-2">Lista não encontrada</h2>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-8 text-center max-w-sm">
          A lista que você está procurando pode ter sido removida ou o código está incorreto.
        </p>
        <button 
          onClick={() => navigate('/document')}
          className="bg-white px-8 py-4 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-sm"
        >
          Voltar para Pesquisa
        </button>
      </div>
    );
  }

  // Progress calculations
  const totalItemsCount = giftList.items?.length || 0;
  const giftedItemsCount = giftList.items?.filter((item: any) => item.status === 'presenteado').length || 0;
  const listProgressPercent = totalItemsCount > 0 ? Math.round((giftedItemsCount / totalItemsCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col relative font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {copySuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000] bg-neutral-900 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
              <CheckCircle size={14} />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Link copiado.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button 
        onClick={() => navigate('/')} 
        className="fixed top-8 left-8 p-3.5 rounded-full bg-white hover:bg-neutral-50 transition-all z-[200] text-neutral-900 border border-neutral-100 shadow-xl shadow-neutral-200/50 group"
      >
        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* HEADER SECTION */}
      <header className="bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-[100]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-neutral-900 rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-neutral-200">
               <Gift size={28} />
            </div>
            <div>
              <h1 className="text-xl font-serif italic text-neutral-900">{giftList.listName || "Lista de Presentes"}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{giftList.hostName}</span>
                <span className="w-1 h-1 rounded-full bg-neutral-200" />
                <span className="text-[10px] font-bold text-neutral-900 uppercase tracking-widest bg-neutral-50 px-2 py-0.5 rounded-md border border-neutral-100">#{giftList.code}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleCopyLink}
              className="px-6 py-3 bg-white border border-neutral-100 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-600 hover:text-neutral-900 hover:border-neutral-300 transition-all shadow-sm active:scale-95 flex items-center gap-2"
            >
              <Sparkles size={14} className="text-amber-500" />
              Copiar Link
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12 w-full">
        {/* COMPLETED STATE HERO */}
        {isListCompleted && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-[3rem] p-12 text-center shadow-sm relative overflow-hidden"
          >
            <div className="relative z-10">
              <span className="text-5xl mb-6 block">🎉</span>
              <h2 className="text-3xl font-serif italic text-amber-900 mb-4">Todos os presentes desta lista foram entregues.</h2>
              <p className="text-neutral-600 font-medium max-w-lg mx-auto leading-relaxed">
                Muito obrigado por fazer parte deste momento. Sua presença e carinho tornaram tudo mais especial.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Gift size={200} className="text-amber-900" />
            </div>
          </motion.div>
        )}

        {/* HOST MESSAGE CARD */}
        {giftList.message && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-start gap-8">
              <div className="w-16 h-16 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-300 shrink-0 border border-neutral-100 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-500">
                <Sparkles size={24} />
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">Mensagem do Anfitrião</h3>
                <p className="text-lg font-serif italic text-neutral-700 leading-relaxed">
                  "{giftList.message}"
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* LIST STATS & TITLE */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-serif italic text-neutral-900 mb-2">Selecione um Presente</h2>
            <p className="text-neutral-400 text-sm font-medium">Toque em um item para ver detalhes ou reservar.</p>
          </div>
          
          <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Total de Itens</span>
              <span className="text-xl font-bold text-neutral-900">{totalItemsCount}</span>
            </div>
            <div className="w-px h-8 bg-neutral-200" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Presenteados</span>
              <span className="text-xl font-bold text-green-600">{giftedItemsCount}</span>
            </div>
            <div className="w-px h-8 bg-neutral-200" />
            <div className="flex flex-col pr-4">
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Progresso</span>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-neutral-900">{listProgressPercent}%</span>
                <div className="w-24 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${listProgressPercent}%` }}
                    className="h-full bg-neutral-900"
                  />
                </div>
              </div>
            </div>
          </div>
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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => !isGifted && !isReserved && setSelectedItemForDetails(item)}
                className={`group bg-white rounded-[2.5rem] overflow-hidden border border-neutral-100 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-neutral-200/50 flex flex-col ${
                  (isGifted || isReserved) ? 'grayscale-[0.8] opacity-80 cursor-default' : 'cursor-pointer hover:-translate-y-1'
                }`}
              >
                <div className="aspect-square relative overflow-hidden bg-neutral-50">
                  <ImageWithFallback 
                    src={item.image} 
                    alt={item.product_name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  
                  {/* BADGES PREMIUM */}
                  <div className="absolute top-6 left-6 flex flex-col gap-2">
                    {isGifted && (
                      <span className="bg-white/90 backdrop-blur-md text-green-600 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-green-100 shadow-lg flex items-center gap-2">
                        <CheckCircle size={12} />
                        Presenteado
                      </span>
                    )}
                    {isReserved && (
                      <span className="bg-white/90 backdrop-blur-md text-amber-600 px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest border border-amber-100 shadow-lg flex items-center gap-2">
                        <Clock size={12} />
                        Reservado
                      </span>
                    )}
                    {isAvailable && (
                      <span className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest shadow-lg flex items-center gap-2">
                        <Sparkles size={12} />
                        Disponível
                      </span>
                    )}
                  </div>

                  {/* PRICE TAG OVERLAY */}
                  <div className="absolute bottom-6 right-6">
                    <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 shadow-xl">
                      <span className="text-sm font-bold text-neutral-900">R$ {item.retail_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex flex-col flex-1">
                  <div className="mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-2 block">
                      {item.isKit ? 'Kit' : 'Produto'}
                    </span>
                    <h3 className="text-xl font-serif italic text-neutral-900 line-clamp-1">{item.product_name}</h3>
                  </div>

                  {isGifted && (
                    <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <Gift size={14} />
                      </div>
                      <p className="text-[10px] font-medium text-neutral-500">
                        Comprado por: <span className="font-bold text-neutral-800">{item.giftedBy || "Convidado"}</span>
                      </p>
                    </div>
                  )}

                  {isReserved && (
                    <div className="mt-auto pt-4 border-t border-neutral-50 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                        <Clock size={14} />
                      </div>
                      <p className="text-[10px] font-medium text-neutral-500">
                        Reservado por: <span className="font-bold text-neutral-800">{item.reservedBy || "Convidado"}</span>
                      </p>
                    </div>
                  )}

                  {isAvailable && (
                    <div className="mt-auto pt-4 flex items-center justify-between">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900 transition-colors flex items-center gap-2">
                        Ver Detalhes <ChevronRight size={14} />
                      </button>
                      <div className="w-10 h-10 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Plus size={18} />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!giftList.items || giftList.items.length === 0) && (
          <div className="text-center py-24 bg-white border border-dashed border-neutral-200 rounded-[3rem]">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center text-neutral-300 mx-auto mb-6">
              <Gift size={40} />
            </div>
            <h3 className="text-xl font-serif italic text-neutral-900 mb-2">Nenhum item na lista ainda</h3>
            <p className="text-neutral-400 text-sm font-medium">Esta lista está sendo preparada pelo anfitrião.</p>
          </div>
        )}
      </main>

      {/* Details Modal */}
      <AnimatePresence>
        {isDetailsModalOpen && selectedItemForDetails && (
          <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-10 max-w-sm w-full shadow-2xl relative border border-neutral-100"
            >
              <button 
                onClick={() => setIsDetailsModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-50 transition-all text-neutral-400 hover:text-neutral-900 z-20"
              >
                <X size={20} />
              </button>
              
              <div className="aspect-square w-full rounded-[2rem] bg-neutral-50 mb-8 overflow-hidden border border-neutral-100">
                <ImageWithFallback src={selectedItemForDetails.image} alt={selectedItemForDetails.product_name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-2 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
                  {selectedItemForDetails.isKit ? 'Kit Especial' : 'Produto Premium'}
                </span>
                <h3 className="text-2xl font-serif italic text-neutral-900">{selectedItemForDetails.product_name}</h3>
              </div>

              <p className="text-sm text-neutral-500 mb-8 leading-relaxed italic">
                "{selectedItemForDetails.description || "Um presente especial selecionado com carinho pelo anfitrião."}"
              </p>
              
              <div className="flex items-center justify-between mb-8 pb-8 border-b border-neutral-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Valor do Presente</span>
                <span className="text-2xl font-bold text-neutral-900">R$ {selectedItemForDetails.retail_price.toFixed(2)}</span>
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleBuyProduct(selectedItemForDetails, selectedItemForDetails.quantity || 1);
                  }}
                  className="w-full py-5 bg-neutral-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 transition-all shadow-xl shadow-neutral-200 active:scale-95 flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} />
                  Comprar Presente
                </button>
                
                <button
                  onClick={() => {
                    setIsDetailsModalOpen(false);
                    handleOpenReserveModal(selectedItemForDetails);
                  }}
                  className="w-full py-5 bg-white border border-neutral-100 text-neutral-600 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Gift size={14} />
                  Apenas Reservar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reservation Name Dialog Modal */}
      <AnimatePresence>
        {isReserveModalOpen && selectedItemForReserve && (
          <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] p-8 md:p-10 max-w-sm w-full shadow-2xl relative border border-neutral-100"
            >
              <button 
                onClick={() => setIsReserveModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-neutral-50 transition-all text-neutral-400 hover:text-neutral-900 z-20"
              >
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 rounded-[1.25rem] bg-neutral-50 text-neutral-900 flex items-center justify-center mb-8 border border-neutral-100 shadow-sm">
                <Gift size={28} />
              </div>
              
              <h3 className="text-2xl font-serif italic text-neutral-900 mb-4">
                Quero Presentear
              </h3>
              <p className="text-sm text-neutral-500 leading-relaxed mb-8">
                Insira seu nome abaixo para reservar <strong className="text-neutral-900">{selectedItemForReserve.product_name}</strong>. Isso evita duplicidades e ajuda na organização.
              </p>
              
              <form onSubmit={handleConfirmReserve} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 pl-1">Seu Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full bg-neutral-50 border border-neutral-100 focus:border-neutral-900 focus:bg-white rounded-2xl px-6 py-5 text-sm font-medium outline-none transition-all placeholder:text-neutral-300 shadow-inner"
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingReserve || !reserveName.trim()}
                  className="w-full py-5 bg-neutral-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-neutral-800 disabled:bg-neutral-100 disabled:text-neutral-300 transition-all flex items-center justify-center gap-3 shadow-xl shadow-neutral-200 active:scale-95"
                >
                  {isSubmittingReserve ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Confirmar Reserva
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[5000] px-6 py-4 bg-[#3A312D] text-white text-xs font-medium uppercase tracking-widest rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.15)] border border-white/10 flex items-center gap-3 min-w-[280px] justify-center text-center font-poppins"
          >
            <ShoppingCart size={14} className="text-[#cca062]" />
            <span>{toast}</span>
            <Sparkles size={12} className="text-[#cca062] animate-pulse" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
