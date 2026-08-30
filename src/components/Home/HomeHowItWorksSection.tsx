import React from 'react';
import { Compass, PenTool, Sparkles, Gift } from 'lucide-react';

export const HomeHowItWorksSection: React.FC = () => {
  const steps = [
    {
      stepNumber: '01',
      title: 'Escolha',
      description: 'Navegue pelo catalogo e escolha um presente único para a pessoa que você deseja presentear.',
      icon: Compass,
    },
    {
      stepNumber: '02',
      title: 'Definição da Arte',
      description: 'Personalize nomes, paleta de cores, fotos e temas. Nossa equipe elabora o layout com todo carinho.',
      icon: PenTool,
    },
    {
      stepNumber: '03',
      title: 'Confecção Artesanal',
      description: 'Cada peça é confeccionada manualmente com papéis nobres, aplicações finas e acabamentos premium delicados.',
      icon: Sparkles,
    },
    {
      stepNumber: '04',
      title: 'Embalagem & Envio',
      description: 'Seu pedido é perfumado, embalado e enviado com segurança para qualquer lugar do país.',
      icon: Gift,
    },
  ];

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C6D37] font-medium">
          <span>◇</span>
          <span>Da Inspiração à Entrega</span>
          <span>◇</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight">
          Como Funciona
        </h2>
        <p className="text-xs sm:text-sm text-[#593E32] font-light">
          Um processo transparente, afetivo e focado na perfeição de cada detalhe.
        </p>
      </div>

      {/* 4 Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {steps.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.stepNumber}
              className="relative flex flex-col items-center text-center p-6 rounded-2xl bg-[#FFFFFF]/80 border border-[#E8DFC8] hover:border-[#B38F4D]/50 shadow-[0_2px_12px_rgba(0,0,0,0.02)] transition-all duration-300"
            >
              {/* Diamond Marker Top */}
              <div className="flex items-center justify-center gap-1.5 text-[#B38F4D] text-xs font-mono font-semibold tracking-widest mb-4">
                <span className="text-[#8C6D37]">◇</span>
                <span>PASSO {item.stepNumber}</span>
              </div>

              {/* Linear Icon Frame */}
              <div className="w-14 h-14 rounded-full border border-[#D4AF37]/35 bg-[#FAF7F2] flex items-center justify-center mb-4 text-[#8C6D37]">
                <Icon size={20} strokeWidth={1.25} />
              </div>

              <h3 className="text-base sm:text-lg font-serif text-[#2C1810] font-normal mb-2">
                {item.title}
              </h3>

              <p className="text-xs text-[#593E32] font-light leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

    </section>
  );
};
