import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingCart, Trash2, Plus, Minus, Tag, ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { SafeImage } from './ui/SafeImage';
import { CartItem, CompanyId } from '../types';
import { formatCurrency } from '../lib/currencyUtils';
import { ImageWithFallback } from './ImageWithFallback';
import { themes } from '../lib/theme';

interface CartSidebarProps {
  cart: CartItem[];
  onClose: () => void;
  onRemove: (id: string) => void;
  onUpdateQty: (id: string, delta: number) => void;
  onSetQty: (id: string, quantity: number) => void;
  onCheckout: () => void;
  companyId: CompanyId;
}

const QtyInput: React.FC<{ value: number; onChange: (val: number) => void; theme: any }> = ({ value, onChange, theme }) => {
  const [localValue, setLocalValue] = useState(value.toString());

  // Update local value when prop changes (external updates)
  React.useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

  return (
    <input 
      type="number"
      min="1"
      value={localValue}
      onChange={(e) => {
        setLocalValue(e.target.value);
        const val = parseInt(e.target.value);
        if (!isNaN(val)) {
          onChange(val);
        }
      }}
      onBlur={() => {
        // If empty or invalid on blur, reset to current quantity
        if (localValue === '' || isNaN(parseInt(localValue))) {
          setLocalValue(value.toString());
        }
      }}
      className={`text-xs font-number font-medium w-8 text-center bg-transparent border-none outline-none ${theme.textPrimary} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
    />
  );
};

export const CartSidebar: React.FC<CartSidebarProps> = ({
  cart,
  onClose,
  onRemove,
  onUpdateQty,
  onSetQty,
  onCheckout,
  companyId
}) => {
  const theme = themes[companyId] || themes.pallyra;
  const isMimada = companyId === 'mimada';

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
  const total = subtotal * (1 - discount);
  const needsDeposit = total >= 100;

  const validCoupons: Record<string, number> = {
    'ARTESANAL10': 0.10,
    'DESCONTO15': 0.15,
    'PROMO20': 0.20
  };

  const applyCoupon = () => {
    const code = coupon.trim().toUpperCase();
    if (validCoupons[code]) {
      setDiscount(validCoupons[code]);
    } else {
      setDiscount(0);
      alert('Cupom inválido');
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1900]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ 
          x: 0,
          width: isCollapsed ? '70px' : (window.innerWidth < 640 ? '100%' : '380px')
        }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`fixed right-0 top-0 h-full ${theme.bg} ${theme.textPrimary} backdrop-blur-2xl border-l ${theme.borderLine} z-[2000] shadow-[0_0_80px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden`}
      >
        <div className={`p-6 border-b ${theme.borderLine} flex items-center ${theme.cardBg} ${isCollapsed ? 'flex-col justify-center gap-6 px-2' : 'justify-between'}`}>
          {!isCollapsed ? (
            <>
              <h2 className={`text-xl font-serif tracking-[0.2em] uppercase ${theme.textPrimary}`}>
                Carrinho
              </h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCollapsed(true)} 
                  className={`p-2 rounded-full transition-all ${theme.btnSecondary}`}
                  title="Recuar"
                >
                  <ChevronRight size={20} />
                </button>
                <button onClick={onClose} className={`p-2 rounded-full transition-all ${theme.btnSecondary}`}>
                  <X size={20} />
                </button>
              </div>
            </>
          ) : (
            <>
              <button onClick={onClose} className={`p-2 rounded-full transition-all ${theme.btnSecondary}`}>
                <X size={20} />
              </button>
              <button 
                onClick={() => setIsCollapsed(false)} 
                className={`p-2 rounded-full transition-all ${theme.btnSecondary}`}
                title="Expandir"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="relative">
                <ShoppingCart size={24} className={theme.textPrimary} />
                {cart.length > 0 && (
                  <span className={`absolute -top-2 -right-2 bg-rose-500 text-white text-[9px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 ${theme.bg === 'bg-[#FFFFFF]' ? 'border-white' : 'border-slate-900'}`}>
                    {cart.reduce((sum, i) => sum + i.quantity, 0)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`flex-1 overflow-y-auto overscroll-none p-4 md:p-6 space-y-4 scrollbar-hide ${isCollapsed ? 'items-center' : ''}`}>
          {cart.length > 0 ? (
            cart.map((item, index) => (
              <motion.div 
                key={`${item.id}-${index}`}
                layout
                className={`flex items-start gap-4 p-4 ${theme.cardBg} border ${theme.borderLine} rounded-xl hover:shadow-sm transition-all`}
              >
                  <div className={`w-20 h-20 ${theme.searchBg} rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative`}>
                        <ImageWithFallback src={item.image || ''} alt={item.product_name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col gap-2">
                       <div className="flex justify-between items-start">
                         <h3 className={`font-tahoma ${theme.textPrimary} text-sm uppercase tracking-tight line-clamp-1`}>{item.product_name}</h3>
                         <button onClick={() => onRemove(item.id)} className={`${theme.textMuted} hover:text-rose-500 transition-colors`}>
                           <Trash2 size={16} />
                         </button>
                       </div>
                       
                       <div className="flex justify-between items-center mt-auto">
                         <div className={`flex items-center gap-3 ${theme.searchBg} p-1 rounded-lg border ${theme.borderLine} ${theme.textPrimary}`}>
                           <button onClick={() => onUpdateQty(item.id, -1)} className={`p-1 ${theme.textSecondary}`}><Minus size={12} /></button>
                           <QtyInput value={item.quantity} onChange={(val) => onSetQty(item.id, val)} theme={theme} />
                           <button onClick={() => onUpdateQty(item.id, 1)} className={`p-1 ${theme.textSecondary}`}><Plus size={12} /></button>
                         </div>
                         <span className={`text-sm ${theme.textPrimary} font-number font-medium`}>{formatCurrency(item.retail_price * item.quantity)}</span>
                       </div>
                  </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 gap-4">
              <ShoppingCart size={isCollapsed ? 30 : 60} className="opacity-10" />
              {!isCollapsed && <p className="text-sm">Seu carrinho está vazio</p>}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className={`p-6 border-t ${theme.borderLine} ${theme.cardBg} flex flex-col items-center ${isCollapsed ? 'gap-4' : 'space-y-6'}`}>
            {!isCollapsed ? (
              <>
                {needsDeposit && (
                  <div className={`w-full rounded-xl p-3 text-[9px] text-center uppercase tracking-widest leading-relaxed border shadow-sm ${theme.specialBg} ${theme.specialBorder} ${theme.textPrimary}`}>
                    <span className="font-black" style={{ color: companyId === 'pallyra' ? '#C6A664' : undefined }}>ATENÇÃO:</span> Sinal obrigatório para início de produção (compras acima de R$ 100).
                  </div>
                )}

                {cart.some(item => item.isWholesaleEnabled && item.wholesale_price > 0 && item.quantity >= (item.wholesale_min_qty || 5)) && (
                   <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-[9px] text-amber-900 text-center uppercase tracking-widest leading-relaxed">
                     <span className="font-black text-amber-600">⚠️ ATACADO ATIVADO:</span> Itens com quantidades mínimas atingidas estão com preço diferenciado.
                   </div>
                )}

                <div className="flex gap-2 w-full">
                  <div className="relative flex-1">
                    <Tag className={`absolute left-4 top-1/2 -translate-y-1/2 ${theme.textMuted}`} size={14} />
                    <input 
                      type="text" 
                      placeholder="CUPOM"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      className={`w-full pl-10 pr-4 py-3 bg-transparent border ${theme.borderLine} ${theme.textPrimary} rounded-xl text-xs ${theme.inputPlaceholder} outline-none transition-colors uppercase tracking-widest`}
                    />
                  </div>
                  <button 
                    onClick={applyCoupon}
                    className={`px-6 border rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all ${theme.btnSecondary}`}
                  >
                    Aplicar
                  </button>
                </div>

                {discount > 0 && (
                  <div className={`w-full ${theme.specialBg} ${theme.specialBorder} ${theme.specialText} border text-[9px] font-black py-3 rounded-xl text-center uppercase tracking-widest flex items-center justify-center gap-2`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-current animate-pulse`} /> {Math.round(discount * 100)}% OFF APLICADO
                  </div>
                )}

                <div className={`flex justify-between items-end w-full pt-2 ${theme.textPrimary}`}>
                  <span className="text-[10px] uppercase tracking-[0.2em] font-bold mb-1">Total Calculado</span>
                  <span className="font-number font-black text-2xl md:text-3xl">
                    {formatCurrency(total)}
                  </span>
                </div>

                <button 
                  onClick={onCheckout}
                  className={`w-full py-5 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] transition-all duration-700 active:scale-95 ${theme.btnPrimary}`}
                >
                  Finalizar Pedido
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className={`text-[10px] font-bold ${theme.textPrimary} opacity-60 uppercase vertical-text`}>TOTAL</div>
                <div className={`${theme.textPrimary} font-mono font-bold text-xs`}>
                  R$ {total >= 1000 ? (total/1000).toFixed(1)+'k' : total.toLocaleString('pt-BR')}
                </div>
                <button 
                  onClick={onCheckout}
                  className={`w-12 h-12 ${theme.btnPrimary} rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all`}
                  title="Finalizar"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.aside>
    </>
  );
};
