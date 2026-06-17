import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, Calendar, ShieldCheck, ShoppingBag, ArrowLeft, Ticket, Gift } from 'lucide-react';
import { useCartV3 } from '../core/cart/useCart';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';
import { CartDrawerV3 } from '../components/CartDrawer';

export const VitrineCheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCartV3();
  const navigate = useNavigate();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<'PAC' | 'SEDEX'>('PAC');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');

  // Form states
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    whatsapp: '',
    cep: '',
    logradouro: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: 'SP',
    cardNum: '',
    cardName: '',
    cardVal: '',
    cardCvv: ''
  });

  const shippingCost = shippingMethod === 'PAC' ? 20.00 : 45.00;
  const grandTotal = cartTotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Simulate order generation code
    const randomCode = 'VT3-' + Math.floor(100000 + Math.random() * 900000);

    // Prepare state data to feed in the confirmed page cleanly
    const orderSummary = {
      orderCode: randomCode,
      clientName: formData.nome || 'Julia Maria',
      whatsapp: formData.whatsapp || '(11) 99999-9999',
      addressString: `${formData.logradouro || 'Avenida Paulista'}, ${formData.numero || '1000'} - ${formData.cidade || 'São Paulo'}/${formData.estado || 'SP'}`,
      shippingMethod,
      shippingCost,
      totalAmount: grandTotal,
      paymentSelected: paymentMethod,
      items: cart.map(c => ({
        name: c.product.name,
        qty: c.quantity,
        color: c.selectedColor,
        size: c.selectedSize,
        text: c.customizationText,
        imageUrl: c.product.images[0]
      }))
    };

    // Store state or pass via navigate to page
    localStorage.setItem('vt3_latest_simulated_order', JSON.stringify(orderSummary));
    
    // Clear cart and route
    clearCart();
    navigate('/vitrine-v3/pedido-confirmado');
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeaderV3 onOpenCart={() => setIsCartOpen(true)} />

      {/* Back button and title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 select-none">
        <Link 
          to="/vitrine-v3/carrinho"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6D5443] hover:text-[#111111] transition-all mb-4"
        >
          <ArrowLeft size={14} />
          <span>Voltar à Bolsa V3</span>
        </Link>
        <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide">
          Fechamento de Entrega
        </h1>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {cart.length === 0 ? (
          <div className="bg-white border border-[#E8DCC8]/40 p-12 text-center rounded-2xl max-w-md mx-auto select-none shadow-sm">
            <span className="text-4xl mb-4 block animate-bounce-short">🛍️</span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-[#111111] uppercase tracking-wide">
              Bolsa de Checkout Vazia
            </h3>
            <p className="font-sans text-xs text-[#6D5443] mt-2 mb-6 leading-relaxed">
              Você ainda não adicionou nenhum presente especial do nosso catálogo V3 para efetivar o seu fechamento.
            </p>
            <Link
              to="/vitrine-v3/catalogo"
              className="bg-[#111111] text-white text-[10.5px] font-bold uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-[#D4AF37] transition-all inline-block"
            >
              Escolher Criações
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrderSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left Block: Client Info & Address */}
            <div className="lg:col-span-7 space-y-8 select-none">
              
              {/* Personal details info section */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  1. Dados do Homenageado / Destinatário
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Nome Completo</label>
                    <input 
                      required 
                      type="text" 
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Julia Maria Aleixo" 
                      className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">E-mail para Notificação</label>
                      <input 
                        required 
                        type="email" 
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="exemplo@gmail.com" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">WhatsApp para Detalhes d\'Arte</label>
                      <input 
                        required 
                        type="tel" 
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="(11) 99999-9999" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery info section */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  2. Endereço de Entrega Segura
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">CEP</label>
                      <input 
                        required 
                        type="text" 
                        name="cep"
                        maxLength={9}
                        value={formData.cep}
                        onChange={handleInputChange}
                        placeholder="01001-000" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Cidade</label>
                      <input 
                        required 
                        type="text" 
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleInputChange}
                        placeholder="São Paulo" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Logradouro / Avenida / Rua</label>
                    <input 
                      required 
                      type="text" 
                      name="logradouro"
                      value={formData.logradouro}
                      onChange={handleInputChange}
                      placeholder="Ex: Avenida Paulista" 
                      className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Número</label>
                      <input 
                        required 
                        type="text" 
                        name="numero"
                        value={formData.numero}
                        onChange={handleInputChange}
                        placeholder="1000" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Bairro</label>
                      <input 
                        required 
                        type="text" 
                        name="bairro"
                        value={formData.bairro}
                        onChange={handleInputChange}
                        placeholder="Bela Vista" 
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4.5 py-2.5 rounded-lg outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Estado (UF)</label>
                      <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        className="w-full bg-[#FAF8F5]/50 border border-[#E8DCC8]/60 focus:border-[#D4AF37] text-xs px-4 py-2.8 rounded-lg outline-none transition-colors"
                      >
                        <option value="SP">São Paulo (SP)</option>
                        <option value="RJ">Rio de Janeiro (RJ)</option>
                        <option value="MG">Minas Gerais (MG)</option>
                        <option value="PR">Paraná (PR)</option>
                        <option value="SC">Santa Catarina (SC)</option>
                        <option value="RS">Rio Grande do Sul (RS)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery method selection */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  3. Modalidade de Despacho d\'Ateliê V3
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div 
                    onClick={() => setShippingMethod('PAC')}
                    className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                      shippingMethod === 'PAC' 
                        ? 'border-[#D4AF37] bg-[#FAF8F5]' 
                        : 'border-[#E8DCC8]/40 hover:border-[#D4AF37]/45 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="shipping"
                      checked={shippingMethod === 'PAC'} 
                      onChange={() => setShippingMethod('PAC')} 
                      className="mt-1 accent-[#D4AF37]" 
                    />
                    <div>
                      <span className="font-sans text-xs.1 font-bold text-[#111111] block">Correio PAC (Econômico Perfumado)</span>
                      <span className="text-[10px] text-[#6D5443] block mt-0.5">Prazo: 5 a 9 dias úteis</span>
                      <span className="text-xs font-bold text-[#111111] mt-2 block">{formatPrice(20.00)}</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setShippingMethod('SEDEX')}
                    className={`p-4 border rounded-xl flex items-start gap-3 cursor-pointer transition-all ${
                      shippingMethod === 'SEDEX' 
                        ? 'border-[#D4AF37] bg-[#FAF8F5]' 
                        : 'border-[#E8DCC8]/40 hover:border-[#D4AF37]/45 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="shipping"
                      checked={shippingMethod === 'SEDEX'} 
                      onChange={() => setShippingMethod('SEDEX')} 
                      className="mt-1 accent-[#D4AF37]" 
                    />
                    <div>
                      <span className="font-sans text-xs.1 font-bold text-[#111111] block">Correio SEDEX (Expresso d\'Ateliê)</span>
                      <span className="text-[10px] text-[#6D5443] block mt-0.5">Prazo: 2 a 3 dias úteis</span>
                      <span className="text-xs font-bold text-[#111111] mt-2 block">{formatPrice(45.00)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment selection */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  4. Detalhes de Pagamento Simulador
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div 
                    onClick={() => setPaymentMethod('PIX')}
                    className={`p-4 border rounded-xl flex items-center gap-3.5 cursor-pointer transition-all ${
                      paymentMethod === 'PIX' 
                        ? 'border-[#D4AF37] bg-[#FAF8F5]' 
                        : 'border-[#E8DCC8]/40 hover:border-[#D4AF37]/45 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'PIX'} 
                      onChange={() => setPaymentMethod('PIX')} 
                      className="accent-[#D4AF37]" 
                    />
                    <div className="flex items-center gap-2">
                      <span className="p-1 px-2.5 rounded bg-[#E5FDF1] text-[#00AF54] text-[10px] font-black">PIX</span>
                      <span className="font-sans text-xs font-bold text-[#111111]">Simulador Ateliê</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setPaymentMethod('CREDIT_CARD')}
                    className={`p-4 border rounded-xl flex items-center gap-3.5 cursor-pointer transition-all ${
                      paymentMethod === 'CREDIT_CARD' 
                        ? 'border-[#D4AF37] bg-[#FAF8F5]' 
                        : 'border-[#E8DCC8]/40 hover:border-[#D4AF37]/45 bg-white'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="payment"
                      checked={paymentMethod === 'CREDIT_CARD'} 
                      onChange={() => setPaymentMethod('CREDIT_CARD')} 
                      className="accent-[#D4AF37]" 
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-[#D4AF37]" />
                      <span className="font-sans text-xs font-bold text-[#111111]">Cartão Simulador</span>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'PIX' ? (
                  <div className="bg-[#FAF8F5]/80 border border-[#E8DCC8]/30 p-4.5 rounded-xl text-center space-y-1.5">
                    <span className="text-[12px] font-bold text-[#00AF54] block">💥 Pix V3 Ateliê Express</span>
                    <p className="text-[11px] text-[#6D5443] max-w-sm mx-auto leading-relaxed">
                      Ao finalizar por Pix de simulação, o código do pedido será emitido na página final de recibos com um botão direto para falarmos sobre as iniciais.
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#FAF8F5]/50 border border-[#E8DCC8]/35 p-5 rounded-2xl grid grid-cols-1 gap-3.5">
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Número do Cartão de Teste</label>
                      <input 
                        required 
                        type="text" 
                        name="cardNum"
                        value={formData.cardNum}
                        onChange={handleInputChange}
                        placeholder="4444 4444 4444 4444" 
                        className="w-full bg-white border border-[#E8DCC8]/55 focus:border-[#D4AF37] text-xs px-4 py-2.2 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Nome Impresso Titular</label>
                      <input 
                        required 
                        type="text" 
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleInputChange}
                        placeholder="Ex: JULIA M ALEIXO" 
                        className="w-full bg-white border border-[#E8DCC8]/55 focus:border-[#D4AF37] text-xs px-4 py-2.2 rounded-lg outline-none uppercase"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Validade (MM/AA)</label>
                        <input 
                          required 
                          type="text" 
                          name="cardVal"
                          maxLength={5}
                          value={formData.cardVal}
                          onChange={handleInputChange}
                          placeholder="12/29" 
                          className="w-full bg-white border border-[#E8DCC8]/55 focus:border-[#D4AF37] text-xs px-4 py-2.2 rounded-lg outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Código CVV</label>
                        <input 
                          required 
                          type="text" 
                          name="cardCvv"
                          maxLength={3}
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                          placeholder="123" 
                          className="w-full bg-white border border-[#E8DCC8]/55 focus:border-[#D4AF37] text-xs px-4 py-2.2 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right block: order overview */}
            <div className="lg:col-span-5 select-none space-y-6">
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] uppercase tracking-wide border-b border-[#E8DCC8]/20 pb-2">
                  Peças Solicitadas
                </h3>

                {/* Items loop */}
                <div className="divide-y divide-[#E8DCC8]/15 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.uniqueId} className="flex gap-3 py-3 items-center">
                      <div className="w-12 h-12 rounded-lg border border-[#E8DCC8]/30 overflow-hidden flex-shrink-0">
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-serif text-xs font-bold text-[#111111] block truncate">{item.product.name}</span>
                        {item.customizationText ? (
                          <span className="text-[8.5px] italic text-[#D4AF37] block truncate">"Gravação: {item.customizationText}"</span>
                        ) : (
                          <span className="text-[8.50px] text-neutral-400 block truncate">Gravuras: Clássica Padrão</span>
                        )}
                        <span className="text-[10px] text-[#6D5443]/80 block">Qtd: {item.quantity} • {formatPrice(item.product.price)}</span>
                      </div>
                      <span className="text-[11.5px] font-bold text-[#111111] font-mono">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals math section */}
                <div className="border-t border-[#E8DCC8]/20 pt-4 space-y-2.5 font-sans text-xs">
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Subtotal de itens</span>
                    <span className="font-mono">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Frete de envio V3 ({shippingMethod})</span>
                    <span className="font-mono">{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Personalizações em Ouro</span>
                    <span className="text-[#00AF54] font-bold">Grátis</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E8DCC8]/30 text-[#111111]">
                    <span className="font-black uppercase tracking-wider text-[10.5px]">Total d\'Ateliê</span>
                    <span className="text-base font-black font-mono">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Place Order CTA key */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-[0.16em] h-12.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="submit-checkout-v3-btn"
                  >
                    <span>Concluir Recebimento V3</span>
                  </button>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="bg-white border border-[#E8DCC8]/30 p-4.5 rounded-2xl flex items-start gap-3 select-none">
                <ShieldCheck size={20} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-[#111111]">Autenticidade Garantida</h4>
                  <p className="text-[10px] text-[#6D5443] leading-relaxed">
                    Você está comprando produtos originais com selos e lacres em cera de soja e metal polido, garantidos pala procedência do ateliê virtual Julia Aleixo.
                  </p>
                </div>
              </div>
            </div>

          </form>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawerV3 isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
