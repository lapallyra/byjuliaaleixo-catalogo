import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

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
    <section className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
      
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C6D37] font-medium">
          <HelpCircle size={12} strokeWidth={1.5} />
          <span>Dúvidas Frequentes</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#2C1810] font-normal tracking-tight">
          Perguntas & Respostas
        </h2>
        <p className="text-xs sm:text-sm text-[#593E32] font-light">
          Tudo o que você precisa saber sobre prazos, personalização e pedidos.
        </p>
      </div>

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;

          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-[#B38F4D]/60 bg-[#FFFFFF] shadow-[0_4px_16px_rgba(179,143,77,0.06)]'
                  : 'border-[#E8DFC8] bg-[#FAF7F2]/60 hover:bg-[#FFFFFF] hover:border-[#D4AF37]/40'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleAccordion(idx)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer gap-4 select-none"
              >
                <span className="text-sm sm:text-base font-medium text-[#2C1810] leading-snug">
                  {faq.question}
                </span>
                <span
                  className={`p-1.5 rounded-full border border-[#D4AF37]/30 text-[#8C6D37] shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180 bg-[#FAF7F2]' : 'bg-[#FFFFFF]'
                  }`}
                >
                  <ChevronDown size={14} strokeWidth={1.5} />
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#593E32] font-light leading-relaxed border-t border-[#F0EBE1]">
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
