import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useCartV3 } from '../core/cart/useCart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawerV3: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateQty, removeFromCart, cartTotal, cartItemsCount } = useCartV3();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleCheckoutClick = () => {
    onClose();
    navigate('/vitrine-v3/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end select-none">
      {/* Dark overlay backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
      />

      {/* Drawer box */}
      <div className="relative w-full max-w-md bg-white h-full flex flex-col justify-between shadow-2xl border-l border-[#E8DCC8]/30">
        
        {/* Header segment */}
        <div className="p-4 sm:p-5 border-b border-[#E8DCC8]/20 flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-[#D4AF37]" />
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] uppercase tracking-wide">
              Bolsa Ateliê V3
            </h3>
            <span className="bg-[#D4AF37]/15 text-[#D4AF37] px-2 py-0.5 rounded-full text-[9px] font-bold font-mono">
              {cartItemsCount}
            </span>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 text-[#6D5443] hover:text-[#111111] transition-colors rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content list block */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <span className="text-4xl block animate-bounce-short">👜</span>
              <h4 className="font-serif text-xs sm:text-sm font-bold text-[#111111] uppercase tracking-wider">
                Sua bolsa está vazia
              </h4>
              <p className="text-[11px] text-[#6D5443] max-w-xs mx-auto leading-relaxed">
                Adicione presentes personalizados, velas aromáticas ou enxoval refinado do ateliê para completar sua sacola.
              </p>
              <button
                onClick={onClose}
                className="bg-[#111111] hover:bg-[#D4AF37] text-white text-[9.5px] font-bold uppercase tracking-widest py-2.5 px-6 rounded-xl transition-all"
              >
                Continuar Comprando
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#E8DCC8]/25 space-y-4 bg-white">
              {cart.map((item) => (
                <div key={item.uniqueId} className="flex gap-4 pt-4 first:pt-0">
                  {/* Thumb image */}
                  <div className="w-16 h-16 bg-[#FAF8F5] border border-[#E8DCC8]/30 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  </div>

                  {/* Body product content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-serif text-[12.5px] font-bold text-[#111111] truncate max-w-[140px] sm:max-w-[180px]">
                          {item.product.name}
                        </h4>
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#D4AF37]">
                          {item.product.category}
                        </span>
                      </div>
                      
                      <span className="font-mono text-xs font-bold text-[#111111]">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>

                    {/* Variations selection tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                      {item.selectedColor && (
                        <span className="bg-[#FAF8F5] border border-[#E8DCC8]/40 px-2 py-0.5 rounded text-neutral-600">
                          Cor: <b>{item.selectedColor}</b>
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="bg-[#FAF8F5] border border-[#E8DCC8]/40 px-2 py-0.5 rounded text-neutral-600">
                          Medida: <b>{item.selectedSize}</b>
                        </span>
                      )}
                    </div>

                    {/* Custom engraving box */}
                    {item.customizationText ? (
                      <div className="bg-[#FAF8F5] border-l-2 border-[#D4AF37] px-2 py-1.2 rounded-r-md text-[9.5px] text-[#6D5443] italic max-w-xs truncate">
                        Monograma: <b className="text-neutral-900 not-italic font-bold">{item.customizationText}</b>
                      </div>
                    ) : (
                      <span className="text-[8.5px] text-[#00AF54] font-medium block">✓ Iniciais sem monograma (clássico)</span>
                    )}

                    {/* Control segment */}
                    <div className="flex items-center justify-between pt-1">
                      {/* Plus minus counter */}
                      <div className="flex items-center border border-[#E8DCC8]/75 bg-white rounded-lg h-7 scale-95">
                        <button
                          onClick={() => updateQty(item.uniqueId, item.quantity - 1)}
                          className="px-2 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111]"
                        >
                          <Minus size={9} />
                        </button>
                        <span className="px-1 text-[10.5px] font-bold text-[#111111] min-w-[0.8rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.uniqueId, item.quantity + 1)}
                          className="px-2 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111]"
                        >
                          <Plus size={9} />
                        </button>
                      </div>

                      {/* Remove item */}
                      <button
                        onClick={() => removeFromCart(item.uniqueId)}
                        className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Remover"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Summary area */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-[#E8DCC8]/25 bg-[#FAF8F5] space-y-4">
            
            <div className="space-y-1.5 font-sans text-xs">
              <div className="flex items-center justify-between text-neutral-500">
                <span>Subtotal das peças</span>
                <span className="font-mono">{formatPrice(cartTotal)}</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Instalação premium & Gravações</span>
                <span className="text-[#00AF54] font-bold">Grátis</span>
              </div>
              
              <div className="pt-2 border-t border-[#E8DCC8]/20 flex items-center justify-between text-[#111111]">
                <span className="font-bold uppercase tracking-wider text-[10px]">Total Estimado</span>
                <span className="text-sm sm:text-base font-black font-mono">{formatPrice(cartTotal)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCheckoutClick}
                className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-[0.16em] h-11.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                id="drawer-checkout-btn"
              >
                <span>Concluir Presente V3</span>
                <ArrowRight size={13} />
              </button>

              <button
                onClick={onClose}
                className="w-full text-center text-[10px] font-bold uppercase tracking-widest text-[#6D5443] hover:text-[#111111] py-1 transition-colors block"
              >
                Continuar no Ateliê
              </button>
            </div>

            <div className="pt-1 border-t border-[#E8DCC8]/15 flex items-center gap-2 justify-center text-[8.5px] text-[#6D5443]">
              <ShieldCheck size={11} className="text-[#D4AF37]" />
              <span>Garantia de luxo e revestimento aromatizado</span>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
