import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreditCard, Truck, Calendar, ShieldCheck, ShoppingBag, ArrowLeft, CheckCircle2, Ticket, Gift } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { VitrineHeader } from '../components/VitrineHeader';
import { VitrineFooter } from '../components/VitrineFooter';

export const VitrineCheckoutPage: React.FC = () => {
  const { cart, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingMethod, setShippingMethod] = useState<'PAC' | 'SEDEX'>('PAC');
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX');
  const [showOrderPlaced, setShowOrderPlaced] = useState(false);
  const [simulatedOrderCode, setSimulatedOrderCode] = useState('');

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

  const cartItemsCount = cart.reduce((tot, item) => tot + item.quantity, 0);
  const shippingCost = shippingMethod === 'PAC' ? 20.00 : 45.00;
  const grandTotal = cartTotal + shippingCost;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Simulate generating an order index
    const randomCode = 'VT-' + Math.floor(100000 + Math.random() * 900000);
    setSimulatedOrderCode(randomCode);
    setShowOrderPlaced(true);
  };

  const handleCompleteOrderReturn = () => {
    clearCart();
    setShowOrderPlaced(false);
    navigate('/vitrine-v2');
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeader onOpenCart={() => {}} />

      {/* Back button and title */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-8 select-none">
        <Link 
          to="/vitrine-v2/catalogo"
          className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#6D5443] hover:text-[#111111] transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          <span>Voltar ao Ateliê</span>
        </Link>
        <h1 className="font-serif text-2.5xl sm:text-3xl font-extrabold text-[#111111] uppercase tracking-wide">
          Conclusão do Presente
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
              Você ainda não adicionou nenhum presente especial do nosso catálogo V2 para efetivar a sua conclusão.
            </p>
            <Link
              to="/vitrine-v2/catalogo"
              className="bg-[#111111] text-white text-[10.5px] font-bold uppercase tracking-widest py-3 px-8 rounded-xl hover:bg-[#D4AF37] transition-all inline-block"
            >
              Escolher Presentes
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
            
            {/* Left Block: Client Info & Address */}
            <div className="lg:col-span-7 space-y-8 select-none">
              
              {/* Personal details info section */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  1. Dados do Portador
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
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">E-mail para Notificações</label>
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
                      <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">WhatsApp de Contato</label>
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
                  2. Endereço de Envio do Ateliê
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
                    <label className="text-[9.5px] font-bold uppercase tracking-wider text-[#6D5443] block mb-1">Logradouro / Endereço</label>
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
                  3. Modalidade de Entrega
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
                      checked={shippingMethod === 'PAC'} 
                      onChange={() => setShippingMethod('PAC')} 
                      className="mt-1 accent-[#D4AF37]" 
                    />
                    <div>
                      <span className="font-sans text-xs.1 font-bold text-[#111111] block">Correios PAC (Econômico)</span>
                      <span className="text-[10px] text-[#6D5443] block mt-0.5">Prazo: 5 a 10 dias úteis</span>
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
                      checked={shippingMethod === 'SEDEX'} 
                      onChange={() => setShippingMethod('SEDEX')} 
                      className="mt-1 accent-[#D4AF37]" 
                    />
                    <div>
                      <span className="font-sans text-xs.1 font-bold text-[#111111] block">Correios SEDEX (Expresso)</span>
                      <span className="text-[10px] text-[#6D5443] block mt-0.5">Prazo: 2 a 4 dias úteis</span>
                      <span className="text-xs font-bold text-[#111111] mt-2 block">{formatPrice(45.00)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment selection */}
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-7 rounded-2xl space-y-4 shadow-xs">
                <h3 className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] uppercase tracking-wide mb-1 border-b border-[#E8DCC8]/20 pb-2">
                  4. Método de Entrega Final (Simulado)
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
                      checked={paymentMethod === 'PIX'} 
                      onChange={() => setPaymentMethod('PIX')} 
                      className="accent-[#D4AF37]" 
                    />
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-[#E5FDF1]/60 text-[#00AF54] text-xs font-black">PIX</span>
                      <span className="font-sans text-xs font-bold text-[#111111]">QRCode Pronta Entrega</span>
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
                      checked={paymentMethod === 'CREDIT_CARD'} 
                      onChange={() => setPaymentMethod('CREDIT_CARD')} 
                      className="accent-[#D4AF37]" 
                    />
                    <div className="flex items-center gap-2">
                      <CreditCard size={15} className="text-[#D4AF37]" />
                      <span className="font-sans text-xs font-bold text-[#111111]">Cartão de Crédito Simulador</span>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'PIX' ? (
                  <div className="bg-[#FAF8F5]/80 border border-[#E8DCC8]/30 p-4 rounded-xl text-center space-y-1.5">
                    <span className="text-[12px] font-bold text-[#00AF54] block">💥 Pix Ateliê Express</span>
                    <p className="text-[11.5px] text-[#6D5443] max-w-sm mx-auto leading-relaxed">
                      Ao selecionar Pix, um QRCode de teste do ateliê será exibido e você poderá concluir o fluxo imediatamente.
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

            {/* Right Block: Order Total Summary */}
            <div className="lg:col-span-5 select-none space-y-6">
              <div className="bg-white border border-[#E8DCC8]/35 p-5 sm:p-6 rounded-2xl space-y-4 shadow-sm">
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] uppercase tracking-wide border-b border-[#E8DCC8]/20 pb-2">
                  Resumo das Peças
                </h3>

                {/* Items loop */}
                <div className="divide-y divide-[#E8DCC8]/20 max-h-56 overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3 py-3 items-center">
                      <div className="w-12 h-12 rounded-lg border border-[#E8DCC8]/30 overflow-hidden flex-shrink-0">
                        <img src={item.images[0]} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-serif text-xs font-bold text-[#111111] block truncate">{item.name}</span>
                        <span className="text-[10px] text-[#6D5443]/80 block">Qtd: {item.quantity} • {formatPrice(item.price)}</span>
                      </div>
                      <span className="text-[11.5px] font-bold text-[#111111]">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals math section */}
                <div className="border-t border-[#E8DCC8]/20 pt-4 space-y-2.5 font-sans text-xs">
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Subtotal de itens</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Frete estimado ({shippingMethod})</span>
                    <span>{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#6D5443]">
                    <span>Gravações e Monograma</span>
                    <span className="text-[#00AF54] font-bold">Grátis</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-[#E8DCC8]/30 text-[#111111]">
                    <span className="font-black uppercase tracking-wider text-[10.5px]">Total Geral</span>
                    <span className="text-base font-black">{formatPrice(grandTotal)}</span>
                  </div>
                </div>

                {/* Place Order CTA key */}
                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-[0.16em] h-12.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    id="submit-checkout-btn"
                  >
                    <span>Concluir Pedidos V2</span>
                  </button>
                </div>
              </div>

              {/* Guarantees Box */}
              <div className="bg-white border border-[#E8DCC8]/30 p-4.5 rounded-2xl flex items-start gap-3 select-none">
                <ShieldCheck size={20} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="text-[9.5px] font-bold uppercase tracking-wider text-[#111111]">Autenticidade Julia Aleixo</h4>
                  <p className="text-[10px] text-[#6D5443] leading-relaxed">
                    Você está comprando produtos originais com selos e lacres em cera, garantidos pela procedência e pelo controle estrito de acabamento do ateliê.
                  </p>
                </div>
              </div>
            </div>

          </form>
        )}
      </main>

      {/* Simulated Order placed Success Modal overlay */}
      {showOrderPlaced && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="bg-white border border-[#E8DCC8]/40 max-w-md w-full rounded-2xl overflow-hidden p-6 sm:p-8 text-center space-y-5 animate-scale-up shadow-2xl">
            <div className="w-16 h-16 bg-[#E5FDF1] rounded-full flex items-center justify-center mx-auto text-[#00E575]">
              <CheckCircle2 size={36} className="stroke-current" />
            </div>

            <div className="space-y-1.5">
              <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.25em] block">Ateliê V2</span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#111111] uppercase tracking-wide">
                Pedido Simulado com Sucesso!
              </h2>
              <span className="inline-block bg-[#FAF8F5] border border-[#E8DCC8]/45 px-3 py-1 rounded text-xs font-mono font-bold text-[#111111]">
                {simulatedOrderCode}
              </span>
            </div>

            <p className="font-sans text-xs text-[#6D5443] leading-relaxed">
              Obrigado, <span className="font-bold text-[#111111]">{formData.nome || 'Julia'}</span>! Seu pedido de presente simulado foi recebido no sistema. <br />
              Nas próximas horas, entraremos em contato via WhatsApp (<span className="font-bold">{formData.whatsapp || '(11) 99999-9999'}</span>) para alinhar os detalhes da confecção das suas peças especiais.
            </p>

            <div className="bg-[#FAF8F5] border border-[#E8DCC8]/25 p-4 rounded-xl text-left space-y-2">
              <span className="text-[9px] font-bold uppercase text-[#6D5443] tracking-wider block">Detalhes do Envio Simulado</span>
              <div className="text-[10.5px] text-[#6D5443] space-y-1">
                <div>• <span className="font-semibold text-[#111111]">Destinatário:</span> {formData.nome}</div>
                <div>• <span className="font-semibold text-[#111111]">Endereço:</span> {formData.logradouro}, {formData.numero}</div>
                <div>• <span className="font-semibold text-[#111111]">Modalidade:</span> {shippingMethod} ({formatPrice(shippingCost)})</div>
                <div>• <span className="font-semibold text-[#111111]">Valor Final:</span> {formatPrice(grandTotal)}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleCompleteOrderReturn}
                className="w-full bg-[#111111] hover:bg-[#D4AF37] text-[#FAF8F5] text-xs font-bold uppercase tracking-widest py-3 rounded-xl transition-all cursor-pointer shadow-md"
              >
                Retornar à Vitrine V2
              </button>
            </div>
          </div>
        </div>
      )}

      <VitrineFooter />
    </div>
  );
};
