import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGiftList, updateGiftListItemStatusByCode } from '../services/firebaseService';
import { ChevronLeft, Gift, ShoppingBag, Loader2, CheckCircle, Lock, Calendar, Sparkles, X } from 'lucide-react';
import { Product, AppConfig, CartItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
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
  const [selectedItemForReserve, setSelectedItemForReserve] = useState<any | null>(null);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);
  const [reserveName, setReserveName] = useState('');
  const [isSubmittingReserve, setIsSubmittingReserve] = useState(false);

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
      alert("Este item já foi reservado ou presenteado.");
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
    alert(`${product.product_name} foi adicionado à sua sacola como presente! Conclua a compra no checkout para oficializar.`);
    navigate('/');
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
      alert(`O item "${selectedItemForReserve.product_name}" foi reservado com sucesso por ${reserveName.trim()}!`);
      fetchList(); // reload values
    } else {
      alert("Houve um problema ao reservar o item. Por favor, tente novamente.");
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
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center p-4 md:p-6 relative">
      <button 
        onClick={() => navigate('/document')} 
        className="fixed top-6 left-6 p-4 rounded-full bg-white hover:bg-gray-50 transition-all z-50 text-black border border-[#D4AF37]/20 shadow-sm"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-full max-w-3xl mt-16 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-xl border border-[#D4AF37]/10 mb-8">
          
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-pink-50 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-[#D4AF37]/20 relative overflow-hidden">
               <Gift size={32} className="relative z-10" />
            </div>
            <h1 className="text-4xl font-fancy text-[#D4AF37] drop-shadow-sm mb-4">
              Lista de Presentes
            </h1>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full border border-gray-100">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Código:</span>
              <span className="text-xs font-bold text-gray-800 tracking-wider">{giftList.code}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-[#FAF9F6] border border-[#D4AF37]/20 p-5 md:p-6 rounded-2xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-[#6d5443]">Progresso da Lista</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1">Conclusão baseada nos itens comprados.</p>
            </div>
            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[11px] font-mono font-black text-[#D4AF37]">{listProgressPercent}% Concluída</span>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{giftedItemsCount} de {totalItemsCount} presenteados</span>
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden relative border border-gray-200/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${listProgressPercent}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#C5A030] rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {(giftList.items || []).map((item: any, idx: number) => {
              const quantityRequested = item.quantity || 1;
              const status = item.status || 'disponivel';

              return (
                <motion.div 
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`group flex flex-col md:flex-row gap-6 items-center p-6 bg-white border rounded-3xl transition-all relative overflow-hidden ${
                    status !== 'disponivel' 
                      ? 'bg-neutral-50/50 border-gray-100 opacity-90' 
                      : 'border-gray-100 hover:shadow-xl hover:border-[#D4AF37]/30'
                  }`}
                >
                  <div className="w-32 h-32 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 relative">
                    {item.image ? (
                      <ImageWithFallback 
                        src={item.image} 
                        alt={item.product_name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                        referrerPolicy="no-referrer" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Gift size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2 justify-center md:justify-start">
                      <h3 className="text-xl font-black text-black leading-tight group-hover:text-[#D4AF37] transition-colors">
                        {item.product_name}
                      </h3>
                      
                      {/* Luxury Status Badges */}
                      {status === 'disponivel' && (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider self-center border border-emerald-100">
                          Disponível
                        </span>
                      )}
                      {status === 'reservado' && (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-wider self-center border border-amber-100 flex items-center gap-1">
                          <Lock size={10} /> Reservado
                        </span>
                      )}
                      {status === 'presenteado' && (
                        <span className="inline-block px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[9px] font-black uppercase tracking-wider self-center border border-neutral-200 flex items-center gap-1">
                          <CheckCircle size={10} /> Presenteado
                        </span>
                      )}
                    </div>

                    <p className="text-lg text-[#D4AF37] font-bold mb-4">R$ {item.retail_price.toFixed(2)}</p>
                    
                    <div className="inline-flex bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                       <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                         Quantidade desejada: <span className="text-black ml-1 scale-110 inline-block">{quantityRequested}</span>
                       </span>
                    </div>

                    {/* Meta Status Text */}
                    {status === 'reservado' && (
                      <p className="text-xs text-amber-500 font-bold mt-3 uppercase tracking-wider">
                        Reservado por: <span className="text-gray-800 font-black">{item.reservedBy || "Convidado"}</span>
                      </p>
                    )}
                    {status === 'presenteado' && (
                      <p className="text-xs text-neutral-500 font-bold mt-3 uppercase tracking-wider">
                        Comprado por: <span className="text-gray-800 font-black">{item.giftedBy || item.reservedBy || "Convidado"}</span>
                      </p>
                    )}
                  </div>
                  
                  {/* Actions (Duplicate Protection Included) */}
                  <div className="w-full md:w-auto mt-4 md:mt-0 flex flex-col sm:flex-row md:flex-col gap-2.5">
                    {status === 'disponivel' ? (
                      <>
                        <button 
                          onClick={() => handleOpenReserveModal(item)}
                          className="w-full md:w-44 px-4 py-3 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/5 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Gift size={13} />
                          Quero Presentear
                        </button>
                        <button 
                          onClick={() => handleBuyProduct(item, quantityRequested)}
                          className="w-full md:w-44 px-4 py-3 bg-[#D4AF37] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg hover:bg-[#C5A030] transition-colors"
                        >
                          <ShoppingBag size={13} />
                          Comprar Presente
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-2 px-4 bg-gray-50 border border-gray-100 rounded-xl text-neutral-400 text-[9px] font-black uppercase tracking-widest">
                        Item indisponível
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
          
          {(!giftList.items || giftList.items.length === 0) && (
            <div className="py-12 text-center text-gray-400">
              <Gift size={40} className="mx-auto mb-4 opacity-50" />
              <p className="text-xs font-black uppercase tracking-widest">A lista está vazia</p>
            </div>
          )}

        </div>

        <div className="text-center mt-12 pb-12">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Presentes Personalizados By Julia Aleixo
            </p>
        </div>
      </div>

      {/* Reservation Name Dialog Modal */}
      <AnimatePresence>
        {isReserveModalOpen && selectedItemForReserve && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl relative border border-[#D4AF37]/20"
            >
              <button 
                onClick={() => setIsReserveModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-all text-gray-400 hover:text-black"
              >
                <X size={18} />
              </button>
              
              <div className="w-12 h-12 rounded-full bg-amber-50 text-[#D4AF37] flex items-center justify-center mb-4 border border-[#D4AF37]/10">
                <Gift size={24} />
              </div>
              
              <h3 className="text-lg font-black uppercase tracking-wider text-gray-800 mb-2">
                Quero Presentear
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
                Insira seu nome abaixo para reservar <strong>{selectedItemForReserve.product_name}</strong>. Isso evita que outras pessoas deem o mesmo presente.
              </p>
              
              <form onSubmit={handleConfirmReserve} className="space-y-4">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1.5 pl-1">Seu Nome Completo</label>
                  <input 
                    type="text"
                    required
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                    placeholder="Ex: Maria Souza"
                    className="w-full bg-[#FAF9F6] border border-gray-200 focus:border-[#D4AF37] rounded-xl px-4 py-3.5 text-xs font-bold outline-none transition-all placeholder:text-gray-300"
                    autoFocus
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmittingReserve || !reserveName.trim()}
                  className="w-full py-3.5 bg-[#D4AF37] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.15em] hover:bg-[#C5A030] disabled:bg-gray-200 disabled:text-gray-400 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/10"
                >
                  {isSubmittingReserve ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : 'Confirmar Reserva'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
