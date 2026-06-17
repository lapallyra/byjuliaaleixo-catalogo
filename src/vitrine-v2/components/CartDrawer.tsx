import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../hooks/useCart';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, updateQty, removeFromCart, cartTotal } = useCart();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckoutRedirect = () => {
    onClose();
    navigate('/vitrine-v2/checkout');
  };

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cartTotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-[#E8DCC8]/40 animate-slide-left">
          
          {/* Header */}
          <div className="px-5 py-6 border-b border-[#E8DCC8]/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={18} className="text-[#D4AF37]" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-[#111111] uppercase tracking-wide">
                Bolsa de Presentes
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 text-[#6D5443] hover:text-[#111111] hover:scale-110 cursor-pointer transition-all"
              id="close-drawer-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <span className="text-3.5xl mb-3 animate-pulse">👜</span>
                <p className="font-serif text-sm font-bold text-[#111111] uppercase tracking-wider">
                  Sua Bolsa está vazia
                </p>
                <p className="font-sans text-[11.5px] text-[#6D5443] max-w-xs mt-1 leading-relaxed">
                  Adicione algumas peças especiais da nossa curadoria de presentes para iniciar a sua personalização.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 bg-[#111111] hover:bg-[#D4AF37] text-[#FAF8F5] text-[10px] font-bold uppercase tracking-widest py-3 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Ver Presentes
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const formattedItemPrice = new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.price * item.quantity);

                return (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-3.5 bg-[#FAF8F5]/80 border border-[#E8DCC8]/25 rounded-xl hover:border-[#D4AF37]/20 transition-all duration-300"
                  >
                    {/* Item Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-lg border border-[#E8DCC8]/30 overflow-hidden flex-shrink-0">
                      <img 
                        src={item.images[0]} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Specs info */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="font-serif text-xs sm:text-xs.1 font-bold text-[#111111] mb-0.5 truncate block">
                        {item.name}
                      </span>
                      <span className="font-sans text-[9.5px] font-light text-[#6D5443] uppercase tracking-wider mb-2">
                        {item.category}
                      </span>

                      {/* Quantity Selector and Price */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-[#E8DCC8]/65 bg-white rounded-lg h-7 select-none">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] transition-colors cursor-pointer"
                            id={`decrease-qty-${item.id}`}
                          >
                            <Minus size={11} />
                          </button>
                          <span className="px-1.5 text-xs font-semibold text-[#111111] min-w-[1.2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] transition-colors cursor-pointer"
                            id={`increase-qty-${item.id}`}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="font-sans text-xs.1 font-bold text-[#111111]">
                            {formattedItemPrice}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#6D5443]/60 hover:text-[#C96B71] transition-colors p-1 cursor-pointer"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Bar */}
          {cart.length > 0 && (
            <div className="border-t border-[#E8DCC8]/40 bg-[#FAF8F5] p-5 pb-7 space-y-4">
              <div className="flex items-center justify-between font-sans">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D5443]">
                  Subtotal estimado
                </span>
                <span className="text-base font-black text-[#111111]">
                  {formattedTotal}
                </span>
              </div>
              <p className="font-sans text-[10px] text-[#6D5443]/70 leading-relaxed">
                * Finalização de personalização artesanal, frete e embalagens de luxo calculadas no próximo passo.
              </p>

              <div className="space-y-2.5 pt-1">
                <button
                  onClick={handleCheckoutRedirect}
                  className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-[11px] font-bold uppercase tracking-[0.15em] h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer shadow-md"
                  id="checkout-btn"
                >
                  <span>Iniciar Conclusão</span>
                  <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
                <button
                  onClick={onClose}
                  className="w-full bg-white border border-[#E8DCC8]/60 hover:border-[#111111] text-[#6D5443] hover:text-[#111111] text-[10.5px] font-bold uppercase tracking-widest h-10.5 rounded-xl transition-all duration-300 cursor-pointer"
                >
                  Continuar Escolhendo
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
