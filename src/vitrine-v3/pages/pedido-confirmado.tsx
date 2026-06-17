import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ShoppingBag, ArrowLeft, Heart, MessageSquare, ShieldCheck, Gift } from 'lucide-react';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';

interface OrderSummary {
  orderCode: string;
  clientName: string;
  whatsapp: string;
  addressString: string;
  shippingMethod: 'PAC' | 'SEDEX';
  shippingCost: number;
  totalAmount: number;
  paymentSelected: 'PIX' | 'CREDIT_CARD';
  items: Array<{
    name: string;
    qty: number;
    color?: string;
    size?: string;
    text?: string;
    imageUrl: string;
  }>;
}

export const VitrinePedidoConfirmadoPage: React.FC = () => {
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderSummary | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('vt3_latest_simulated_order');
    if (saved) {
      setOrder(JSON.parse(saved));
    }
  }, []);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Build emotional WhatsApp URL with details
  const whatsappUrl = () => {
    if (!order) return '#';
    const textBase = `Olá, Ateliê Julia Aleixo! Acabei de concluir a simulação do meu presente especial V3 no site!\n\n` +
      `Código do Pedido: *${order.orderCode}*\n` +
      `Destinatário: *${order.clientName}*\n` +
      `Total d'Ateliê: *${formatPrice(order.totalAmount)}*\n` +
      `Método: *${order.paymentSelected === 'PIX' ? 'Pix Simulação' : 'Cartão Simulação'}*\n` +
      `Endereço: *${order.addressString}*\n\n` +
      `Peças Solicitadas:\n` +
      order.items.map(it => `• ${it.qty}x ${it.name} ${it.color ? `[Cor: ${it.color}]` : ''} ${it.text ? `[Gravação: "${it.text}"]` : ''}`).join('\n') +
      `\n\nGostaria de verificar os prazos de confecção das minhas iniciais!`;

    return `https://api.whatsapp.com/send?phone=5511999999999&text=${encodeURIComponent(textBase)}`;
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
        <VitrineHeaderV3 onOpenCart={() => {}} />
        <main className="max-w-md mx-auto px-4 py-24 flex-1 text-center select-none space-y-4">
          <span className="text-4xl block">✨</span>
          <h2 className="font-serif text-lg sm:text-xl font-bold uppercase text-neutral-900">Procurando recibo de presentes...</h2>
          <p className="text-xs text-[#6D5443]">Nenhum pedido recente foi encontrado nos registros de cache offline d\'Ateliê V3.</p>
          <Link to="/vitrine-v3" className="bg-[#111111] text-white px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest inline-block">
            Ir para Vitrine V3
          </Link>
        </main>
        <VitrineFooterV3 />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      <VitrineHeaderV3 onOpenCart={() => {}} />

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full flex flex-col items-center">
        
        {/* Card envelope wrapper */}
        <div className="bg-white border border-[#E8DCC8]/40 w-full rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-md select-none">
          
          {/* Animated Green Badge */}
          <div className="w-16 h-16 bg-[#E5FDF1]/90 rounded-full flex items-center justify-center mx-auto text-[#00E575] animate-scale-up border border-[#00AF54]/10 shadow-sm">
            <CheckCircle2 size={38} className="stroke-current" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-[0.25em] block">Ateliê Virtual Julia Aleixo V3</span>
            <h2 className="font-serif text-xl sm:text-2.5xl font-extrabold text-[#111111] uppercase tracking-wide leading-tight">
              Pedido Fechado com Sucesso!
            </h2>
            <div className="inline-flex items-center gap-1 bg-[#FAF8F5] border border-[#E8DCC8]/45 px-3 py-1.2 rounded-lg font-mono text-xs font-black text-[#111111]">
              <span>CÓDIGO:</span>
              <span className="text-[#D4AF37]">{order.orderCode}</span>
            </div>
          </div>

          <p className="font-sans text-xs sm:text-[12.5px] text-[#6D5443] leading-relaxed max-w-lg mx-auto">
            Obrigado por escolher o ateliê, <b className="text-neutral-900">{order.clientName}</b>! Seu pedido simulado foi devidamente computado nos servidores locais de teste da Coleção V3.
          </p>

          {/* WhatsApp Direct Align Banner */}
          <div className="bg-neutral-950 text-white p-5 rounded-2xl border border-[#D4AF37]/30 text-left space-y-4">
            <div className="flex items-start gap-3">
              <MessageSquare size={20} className="text-[#D4AF37] flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-[#D4AF37] text-[9px] font-black uppercase tracking-widest block">Canal de Configuração WhatsApp</span>
                <p className="text-[11.5px] text-neutral-300 leading-relaxed font-light">
                  Como cada peça d\'Ateliê é única, clique no botão abaixo para conversar no WhatsApp simulado com os artífices. O texto pre-formatará as iniciais e detalhes de monogramas gravados sob encomenda para darmos prosseguimento!
                </p>
              </div>
            </div>

            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-[#D4AF37] hover:bg-[#FAF8F5] text-neutral-950 font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] h-11.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:scale-[1.01]"
              id="whatsapp-confirm-v3-btn"
            >
              <MessageSquare size={14} className="fill-current" />
              <span>Enviar Projeto d\'Ateliê ao WhatsApp</span>
            </a>
          </div>

          {/* Order detailed review */}
          <div className="bg-[#FAF8F5] border border-[#E8DCC8]/30 rounded-2xl p-5 text-left space-y-4">
            <span className="text-[10px] font-black uppercase text-[#6D5443] tracking-widest block border-b border-[#E8DCC8]/15 pb-2">
              Demonstrativo de Peças & Endereço
            </span>

            {/* Form details inline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Destinatário:</span>
                <span className="font-semibold text-[#111111]">{order.clientName}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">WhatsApp fornecido:</span>
                <span className="font-semibold text-[#111111]">{order.whatsapp}</span>
              </div>
              <div className="sm:col-span-2 space-y-1">
                <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Local d\'entrega:</span>
                <span className="font-semibold text-[#111111]">{order.addressString}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Despacho escolhido:</span>
                <span className="font-semibold text-[#111111]">{order.shippingMethod} ({formatPrice(order.shippingCost)})</span>
              </div>
              <div className="space-y-1">
                <span className="text-[9.5px] text-neutral-400 uppercase tracking-wider block">Valor Total:</span>
                <span className="font-bold text-[#D4AF37] font-mono">{formatPrice(order.totalAmount)}</span>
              </div>
            </div>

            {/* Detailed list items */}
            <div className="border-t border-[#E8DCC8]/20 pt-4 space-y-3">
              <span className="text-[9.5px] font-black uppercase text-neutral-400 tracking-wider block">Produtos no Pacote d\'Arte:</span>
              <div className="divide-y divide-[#E8DCC8]/10">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex gap-3 py-2.5 items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E8DCC8]/30 flex-shrink-0">
                        <img src={it.imageUrl} alt={it.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-[#111111] block truncate max-w-sm">{it.name}</span>
                        {it.text ? (
                          <span className="text-[9px] italic text-[#6D5443] block">Monograma: "{it.text}"</span>
                        ) : (
                          <span className="text-[9px] text-neutral-400 block">Sem gravação</span>
                        )}
                        <span className="text-[9.5px] text-neutral-400 block">Quantidades: {it.qty} {it.color ? `• Tom: ${it.color}` : ''} {it.size ? `• Medida: ${it.size}` : ''}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/vitrine-v3"
              className="w-full bg-[#111111] hover:bg-[#D4AF37] text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all block text-center"
              onClick={() => localStorage.removeItem('vt3_latest_simulated_order')}
            >
              Retornar à Vitrine V3
            </Link>
          </div>

        </div>

      </main>

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
