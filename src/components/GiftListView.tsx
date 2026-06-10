import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getGiftList } from '../services/firebaseService';
import { ChevronLeft, Gift, ShoppingBag, Loader2 } from 'lucide-react';
import { Product, AppConfig, CartItem } from '../types';
import { motion } from 'motion/react';
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

  useEffect(() => {
    const fetchList = async () => {
      if (!code) return;
      setLoading(true);
      const fetchedList = await getGiftList(code.toUpperCase());
      if (fetchedList) {
        setGiftList(fetchedList);
      }
      setLoading(false);
    };
    fetchList();
  }, [code]);

  const handleBuyProduct = (product: Product, quantityRequested: number) => {
    if (!giftList) return;
    
    const qty = quantityRequested > 0 ? quantityRequested : 1;
    
    setCarts((prev: CartItem[]) => {
      return [...prev.filter(item => item.id !== product.id), { ...product, quantity: qty }];
    });

    // Navigate to home, cart is available via floating button
    navigate('/');
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

  return (
    <div className="min-h-screen bg-[#F8F6F2] flex flex-col items-center p-6 relative">
      <button 
        onClick={() => navigate('/document')} 
        className="absolute top-6 left-6 p-4 rounded-full bg-white hover:bg-gray-50 transition-all z-50 text-black border border-[#D4AF37]/20 shadow-sm"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="w-full max-w-3xl mt-16 z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-[#D4AF37]/10 mb-8">
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

          <div className="space-y-6">
            {(giftList.items || []).map((item: any, idx: number) => {
              // Assume default quantity wanted is 1 if not specified
              const quantityRequested = item.quantity || 1;

              return (
                <motion.div 
                  key={`${item.id}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => handleBuyProduct(item, quantityRequested)}
                  className="group flex flex-col md:flex-row gap-6 items-center p-6 bg-white border border-gray-100 rounded-3xl hover:shadow-xl hover:border-[#D4AF37]/30 transition-all cursor-pointer relative overflow-hidden"
                >
                  <div className="w-32 h-32 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <ImageWithFallback src={item.image} alt={item.product_name} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-200">
                        <Gift size={32} />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-black text-black leading-tight mb-2 group-hover:text-[#D4AF37] transition-colors">{item.product_name}</h3>
                    <p className="text-lg text-[#D4AF37] font-bold mb-4">R$ {item.retail_price.toFixed(2)}</p>
                    
                    <div className="inline-flex bg-gray-50 border border-gray-100 rounded-xl px-4 py-2">
                       <span className="text-[10px] uppercase font-black tracking-widest text-gray-500">
                         Quantidade desejada: <span className="text-black ml-1 scale-110 inline-block">{quantityRequested}</span>
                       </span>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto mt-4 md:mt-0">
                    <button className="w-full md:w-auto px-8 py-4 bg-[#D4AF37] text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg group-hover:bg-[#C5A030] transition-colors">
                      <ShoppingBag size={16} />
                      Presentear
                    </button>
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
    </div>
  );
};
