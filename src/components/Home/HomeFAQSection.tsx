import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const HomeFAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      question: 'Como funciona o processo de personalização e aprovação da arte?',
      answer:
        'Após a confirmação do seu pedido, nossa equipe de design elabora a prévia digital da personalização (nomes, paleta de cores, datas e monogramas). Você recebe um link exclusivo de aprovação para conferir cada detalhe antes do início da confecção artesanal.',
    },
    {
      question: 'Qual o prazo de confecção e entrega dos pedidos?',
      answer:
        'Como cada produto é feito sob medida e com acabamentos manuais, o prazo médio de confecção varia de 5 a 12 dias úteis, somado ao prazo de transporte dos Correios ou transportadora para sua região. Você pode simular o frete e prazo diretamente no checkout inserindo seu CEP.',
    },
    {
      question: 'Vocês atendem pedidos com urgência para datas próximas?',
      answer:
        'Sim! Para ocasiões em que você precisa do presente antes do prazo padrão, disponibilizamos a taxa de Atendimento de Urgência no checkout, que coloca seu pedido na fila prioritária de confecção do ateliê.',
    },
    {
      question: 'Posso combinar produtos de ateliês diferentes no mesmo pedido?',
      answer:
        'Com certeza! Nosso carrinho é 100% unificado. Você pode escolher caixas da La Pallyra, mimos de maternidade da Guennita, joias da Mimada Sim e lembranças da Tutty Mimo e finalizar tudo em uma única compra.',
    },
    {
      question: 'Quais são as formas de pagamento aceitas?',
      answer:
        'Aceitamos Pix com desconto e aprovação imediata, cartão de crédito em até 12x via Mercado Pago e também a opção de Sinal de 50% para início da produção com quitação do saldo antes do envio.',
    },
    {
      question: 'É possível enviar diretamente para a pessoa presenteada com dedicatória?',
      answer:
        'Sim! Ao preencher o endereço no checkout, você pode informar os dados da pessoa presenteada e adicionar uma mensagem personalizada. Seu pedido será enviado em embalagem impecável, perfumada e sem valores impressos na caixa.',
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full px-2 sm:px-3 py-12 sm:py-14">
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75 mb-3">
          <span className="w-5 h-px bg-[#D4AF37]" />
          <span>Dúvidas Frequentes</span>
          <span className="w-5 h-px bg-[#D4AF37]" />
        </div>
        <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.85rem,4vw,3rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
          Perguntas &amp; Respostas
        </h2>
      </div>

      {/* Accordion List */}
      <div className="w-full space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#D4AF37]/60 bg-white shadow-[0_2px_14px_rgba(15,44,89,0.03)]'
                  : 'border-[#E8E2D5]/80 bg-white/60 hover:bg-white hover:border-[#D4AF37]/45'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer gap-4 select-none"
              >
                <span className="text-sm sm:text-base font-medium text-[#1B2537] leading-snug">
                  {faq.question}
                </span>
                <span
                  className={`p-1.5 rounded-full border border-[#D4AF37]/35 text-[#0F2C59] shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-[#FAF8F5]' : 'bg-white'
                  }`}
                >
                  <ChevronDown size={14} strokeWidth={1.6} />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-2 text-xs sm:text-sm text-[#1B2537]/75 font-light leading-relaxed border-t border-[#E8E2D5]/50">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
};
