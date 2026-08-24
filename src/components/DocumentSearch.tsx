import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, AlertCircle, Gift, ArrowRight } from 'lucide-react';
import { getOrderByCode, getGiftListWithStatus } from '../services/firebaseService';
import { Order } from '../types';
import { OrderReceiptModal } from './Admin/OrderReceiptModal';
import { motion, AnimatePresence } from 'motion/react';
import { themes } from '../lib/theme';
import { ImageWithFallback } from './ImageWithFallback';
import { useSearchParams, useNavigate } from 'react-router-dom';

interface DocumentSearchProps {
  onGoBack: () => void;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({ onGoBack }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [giftList, setGiftList] = useState<any | null>(null);

  const triggerDirectSearch = async (searchVal: string) => {
    if (!searchVal) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setGiftList(null);

    // Try Order first
    const fetchedOrder = await getOrderByCode(searchVal);
    if (fetchedOrder) {
      setLoading(false);
      navigate(`/rastreamento?code=${fetchedOrder.code}`);
      return;
    }

    // Try Gift List
    const { data: fetchedList, status } = await getGiftListWithStatus(searchVal);
    if (status === 'found' && fetchedList) {
      setLoading(false);
      navigate(`/consulta/${fetchedList.code}`);
      return;
    } else if (status === 'expired') {
      setError('Esta lista de presentes expirou (mais de 60 dias).');
      setLoading(false);
      return;
    }

    setLoading(false);
    setError('Documento ou Lista não encontrados. Verifique o código e tente novamente.');
  };

  // Auto trigger search if code exists in URL search params
  useEffect(() => {
    const urlCode = searchParams.get('code');
    if (urlCode) {
      const sanitized = urlCode.trim().toUpperCase();
      setCode(sanitized);
      triggerDirectSearch(sanitized);
    }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    triggerDirectSearch(code.trim().toUpperCase());
  };

  return (
    <div className="min-h-[100dvh] bg-[#F8F6F2] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative background Elements */}

      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 relative z-10">
        <div className="text-center mb-10 space-y-4">
          <div className="w-20 h-20 bg-white text-[#D4AF37] rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl border border-[#D4AF37]/20 relative overflow-hidden">
             <div className="absolute inset-0 bg-[#D4AF37]/5 animate-pulse" />
             <Search size={32} className="relative z-10" />
          </div>
          <h1 className="text-3xl font-fancy text-[#D4AF37] drop-shadow-sm">Busca no Catálogo</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            Localize seu pedido ou lista de presentes
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-6 bg-white/80 backdrop-blur-3xl p-8 rounded-[2.5rem] shadow-2xl border border-[#D4AF37]/10">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 pl-2">Código (Pedido ou Lista)</label>
            <input 
              type="text" 
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: X12345 ou L98765P" 
              className="w-full text-center bg-white border border-gray-100 rounded-2xl px-6 py-5 text-xl font-mono font-black outline-none focus:border-[#D4AF37] focus:ring-4 focus:ring-[#D4AF37]/10 transition-all uppercase placeholder:opacity-30"
              autoFocus
            />
          </div>

          {error && (
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-red-50 text-red-500 text-xs font-bold text-center border border-red-100">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || !code.trim()}
            className="w-full py-5 bg-[#D4AF37] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:bg-gray-400"
          >
            {loading ? 'Buscando...' : 'Pesquisar Agora'}
          </button>
        </form>
      </div>

      {order && (
        <OrderReceiptModal 
          order={order} 
          onClose={() => setOrder(null)} 
        />
      )}
    </div>
  );
};
