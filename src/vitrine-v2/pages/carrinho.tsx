import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Plus, Minus, ShieldCheck, Gift } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { VitrineHeader } from '../components/VitrineHeader';
import { VitrineFooter } from '../components/VitrineFooter';

export const VitrineCarrinhoPage: React.FC = () => {
  const { cart, updateQty, removeFromCart, clearCart, cartTotal } = useCart();
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formattedTotal = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(cartTotal);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeader onOpenCart={() => setIsDrawerOpen(true)} />

      {/* Title Header */}
      <section className="bg-white border-b border-[#E8DCC8]/30 py-10 px-4 sm:px-6 lg:px-8 text-center select-none">
        <div className="max-w-2xl mx-auto space-y-2">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.25em] block">
            Acervo Especial Ateliê
          </span>
          <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide">
            Minha Bolsa
          </h1>
          <p className="font-sans text-xs text-[#6D5443] leading-relaxed max-w-lg mx-auto">
            Adicione e gerencie os detalhes de personalização de suas peças antes de seguir com a entrega.
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
              Explore o nosso acervo de mimos finos do Ateliê e escolha itens para carinho ou recordação.
            </p>
            <Link
              to="/vitrine-v2/catalogo"
              className="bg-[#111111] hover:bg-[#D4AF37] text-white text-[10.5px] font-bold uppercase tracking-widest py-3.5 px-8 rounded-xl transition-all"
            >
              Explorar Catálogo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            
            {/* Left Block: Table List */}
            <div className="lg:col-span-8 space-y-4 select-none">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#E8DCC8]/25">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6D5443]">Item Selecionado</span>
                <button
                  onClick={clearCart}
                  className="text-[10.5px] font-bold uppercase tracking-wider text-[#C96B71] hover:underline cursor-pointer"
                >
                  Esvaziar Bolsa
                </button>
              </div>

              <div className="space-y-4">
                {cart.map((item) => {
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div 
                      key={item.id}
                      className="bg-white border border-[#E8DCC8]/30 hover:border-[#D4AF37]/30 p-4 rounded-2xl shadow-xs transition-all duration-300 flex flex-col sm:flex-row items-center gap-5"
                    >
                      {/* Image */}
                      <div className="w-20 h-20 bg-[#FAF8F5] border border-[#E8DCC8]/30 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>

                      {/* Info and specifications */}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <span className="font-serif text-sm sm:text-base font-bold text-[#111111] block mb-0.5 truncate">
                          {item.name}
                        </span>
                        <span className="text-[9.5px] font-bold text-[#D4AF37] uppercase tracking-wider block mb-2">
                          {item.category}
                        </span>
                        <span className="text-[10.5px] text-[#6D5443] font-light italic">
                          Dimensões: {item.dimensions}
                        </span>
                      </div>

                      {/* Stepper controls */}
                      <div className="flex items-center border border-[#E8DCC8]/65 bg-white rounded-xl h-9">
                        <button
                          onClick={() => updateQty(item.id, item.quantity - 1)}
                          className="px-3 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="px-2 text-xs font-semibold text-[#111111] min-w-[1.2rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.quantity + 1)}
                          className="px-3 h-full flex items-center justify-center text-[#6D5443] hover:text-[#111111] cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                      </div>

                      {/* Line Unit & Total Cost */}
                      <div className="text-center sm:text-right min-w-[5.5rem]">
                        <span className="text-[10px] text-[#6D5443]/45 block leading-none mb-1">Total da peça</span>
                        <span className="font-sans text-sm sm:text-[15.5px] font-black text-[#111111]">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lineTotal)}
                        </span>
                      </div>

                      {/* Trash key */}
                      <button
                        onClick={() => removeFromCart(item.id)}
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
                  to="/vitrine-v2/catalogo"
                  className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#111111] hover:text-[#D4AF37] transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>Adicionar Mais Presentes</span>
                </Link>
              </div>

            </div>

            {/* Right Block: Summary box */}
            <div className="lg:col-span-4 select-none space-y-6">
              
              <div className="bg-white border border-[#E8DCC8]/35 p-6 rounded-2xl space-y-4.5 shadow-sm">
                <h3 className="font-serif text-base font-bold text-[#111111] uppercase tracking-wide border-b border-[#E8DCC8]/20 pb-2">
                  Resumo dos Itens
                </h3>

                <div className="space-y-3 font-sans text-xs">
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Subtotal estimado</span>
                    <span>{formattedTotal}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Personalizações</span>
                    <span className="text-[#00AF54] font-bold">Inclusas</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Frete de Envio</span>
                    <span className="italic">Calculado no checkout</span>
                  </div>
                  
                  <div className="pt-4 border-t border-[#E8DCC8]/30 flex items-center justify-between text-[#111111]">
                    <span className="font-black uppercase tracking-wider text-[10px]">Total Geral Estimado</span>
                    <span className="text-base font-extrabold">{formattedTotal}</span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={() => navigate('/vitrine-v2/checkout')}
                    className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-[0.16em] h-12 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="bag-page-checkout-btn"
                  >
                    <span>Iniciar Conclusão</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>

              {/* Secure Shield badge */}
              <div className="bg-white border border-[#E8DCC8]/30 p-4 rounded-2xl flex items-start gap-3">
                <ShieldCheck size={18} className="text-[#D4AF37] mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-[#111111]">Entrega Segura Garantida</h4>
                  <p className="text-[10px] text-[#6D5443] leading-relaxed">
                    Nossas caixas recebem revestimento duplo acolchoado e perfume floral exclusivo para propiciar sensações doces.
                  </p>
                </div>
              </div>

            </div>

          </div>
        )}
      </main>

      <VitrineFooter />
    </div>
  );
};
