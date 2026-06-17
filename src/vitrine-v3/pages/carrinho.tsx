import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus, ShieldCheck, Gift } from 'lucide-react';
import { useCartV3 } from '../core/cart/useCart';
import { CartDrawerV3 } from '../components/CartDrawer';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';

export const VitrineCarrinhoPage: React.FC = () => {
  const { cart, updateQty, removeFromCart, clearCart, cartTotal } = useCartV3();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cartTotal);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeaderV3 onOpenCart={() => setIsDrawerOpen(true)} />

      {/* Header section */}
      <section className="bg-white border-b border-[#E8DCC8]/30 py-10 px-4 sm:px-6 lg:px-8 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.25em] block">
            Escolhas d\'Ateliê • Vitrine V3
          </span>
          <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide">
            Minha Bolsa de Presentes
          </h1>
          <p className="font-sans text-xs text-[#6D5443] leading-relaxed max-w-lg mx-auto">
            Por favor, confira abaixo os detalhes e personalizações de suas peças artesanais selecionadas antes de seguirmos com o envio.
          </p>
        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        {cart.length === 0 ? (
          <div className="bg-white border border-[#E8DCC8]/40 p-12 text-center rounded-2xl max-w-md mx-auto select-none shadow-sm">
            <span className="text-4xl mb-4 block animate-bounce-short">👜</span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#111111] uppercase tracking-wide">
              Sua Bolsa está vazia
            </h3>
            <p className="font-sans text-xs text-[#6D5443] mt-2 mb-6 leading-relaxed">
              Explore nossa galeria de presentes refinados V3 e selecione as iniciais ideais de seus nobres homenageados.
            </p>
            <Link
              to="/vitrine-v3/catalogo"
              className="bg-[#111111] hover:bg-[#D4AF37] text-white text-[10.5px] font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all inline-block"
            >
              Explorar Ateliê
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Block: Table List of items */}
            <div className="lg:col-span-8 space-y-4 select-none">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]/25">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D5443]">Item Escolhido</span>
                <button
                  onClick={clearCart}
                  className="text-[10.5px] font-bold uppercase tracking-wider text-[#C96B71] hover:underline cursor-pointer"
                >
                  Esvaziar Bolsa V3
                </button>
              </div>

              <div className="space-y-4 bg-white p-2 rounded-xl">
                {cart.map((item) => {
                  const lineTotal = item.product.price * item.quantity;
                  return (
                    <div 
                      key={item.uniqueId}
                      className="border-b border-[#E8DCC8]/15 last:border-0 pb-4 last:pb-0 flex flex-col sm:flex-row items-center gap-5 pt-4 first:pt-0"
                    >
                      {/* Image */}
                      <div className="w-18 h-18 bg-[#FAF8F5] border border-[#E8DCC8]/30 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info and specifications */}
                      <div className="flex-1 min-w-0 text-center sm:text-left space-y-1">
                        <div>
                          <span className="font-serif text-[13.5px] sm:text-base font-bold text-[#111111] block leading-snug truncate">
                            {item.product.name}
                          </span>
                          <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider block">
                            {item.product.category}
                          </span>
                        </div>

                        {/* Variants tag inside carrinho.tsx */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[9.5px]">
                          {item.selectedColor && (
                            <span className="bg-[#FAF8F5] border border-[#E8DCC8]/30 px-2 py-0.5 rounded text-[#6D5443]">
                              Cor: <b>{item.selectedColor}</b>
                            </span>
                          )}
                          {item.selectedSize && (
                            <span className="bg-[#FAF8F5] border border-[#E8DCC8]/30 px-2 py-0.5 rounded text-[#6D5443]">
                              Opção: <b>{item.selectedSize}</b>
                            </span>
                          )}
                        </div>

                        {/* Custom text tag */}
                        {item.customizationText ? (
                          <div className="bg-[#FAF8F5] border-l-2 border-[#D4AF37] px-2.5 py-1 rounded text-[10px] text-[#6D5443] italic max-w-xs truncate">
                            Gravação: <b className="text-neutral-950 font-bold not-italic font-mono">{item.customizationText}</b>
                          </div>
                        ) : (
                          <span className="text-[9.5px] text-[#00AF54] font-medium block">✓ Iniciais sem monograma clássico</span>
                        )}
                      </div>

                      {/* Stepper controls */}
                      <div className="flex items-center border border-[#E8DCC8]/65 bg-white rounded-xl h-8.5">
                        <button
                          onClick={() => updateQty(item.uniqueId, item.quantity - 1)}
                          className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-1.5 text-xs font-bold text-[#111111] min-w-[1rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.uniqueId, item.quantity + 1)}
                          className="px-2.5 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      {/* Line Unit & Total Cost */}
                      <div className="text-center sm:text-right min-w-[6.5rem]">
                        <span className="text-[9.5px] text-[#6D5443]/45 block leading-none mb-1">Total est.</span>
                        <span className="font-mono text-sm sm:text-base font-black text-[#111111]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lineTotal)}
                        </span>
                      </div>

                      {/* Trash key */}
                      <button
                        onClick={() => removeFromCart(item.uniqueId)}
                        className="p-2 text-[#6D5443]/60 hover:text-[#C96B71] transition-colors rounded-lg cursor-pointer"
                        title="Remover item da bolsa"
                      >
                        <Trash2 size={15} />
                      </button>

                    </div>
                  );
                })}
              </div>

              <div className="pt-4">
                <Link
                  to="/vitrine-v3/catalogo"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#D4AF37] transition-colors"
                >
                  <ArrowLeft size={13} />
                  <span>Adicionar Mais Finos do Ateliê</span>
                </Link>
              </div>

            </div>

            {/* Right Block: Summary box */}
            <div className="lg:col-span-4 select-none space-y-6">
              
              <div className="bg-white border border-[#E8DCC8]/35 p-6 rounded-2xl space-y-4.5 shadow-sm">
                <h3 className="font-serif text-base font-bold text-[#111111] uppercase tracking-wide border-b border-[#E8DCC8]/20 pb-2">
                  Resumo Geral V3
                </h3>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Subtotal estimado</span>
                    <span className="font-mono font-medium">{formattedTotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Monogramas e Selos</span>
                    <span className="text-[#00AF54] font-bold">Grátis</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Embalagem de Luxo</span>
                    <span className="text-[#00AF54] font-bold">Inclusa</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Frete d\'Ateliê</span>
                    <span className="italic">Calculado no checkout</span>
                  </div>
                  
                  <div className="pt-4 border-t border-[#E8DCC8]/30 flex items-center justify-between text-[#111111]">
                    <span className="font-black uppercase tracking-wider text-[9.5px]">Total Geral Estimado</span>
                    <span className="text-base font-black font-mono">{formattedTotal}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => navigate('/vitrine-v3/checkout')}
                    className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-[0.16em] h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="cart-page-v3-checkout-btn"
                  >
                    <span>Seguir para Faturamento</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Secure Shield badge */}
              <div className="bg-white border border-[#E8DCC8]/30 p-4.5 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-[#111111]">Embalagem Perfumada Premiada</h4>
                  <p className="text-[10px] text-[#6D5443] leading-relaxed">
                    Nossas caixas recebem revestimento duplo acolchoado e perfume floral exclusivo para propiciar sensações doces ao desembalar seus presentes.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      {/* Drawer */}
      <CartDrawerV3 isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
