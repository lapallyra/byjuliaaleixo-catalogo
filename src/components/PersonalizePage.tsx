import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Heart, 
  CheckCircle2, 
  ArrowRight, 
  SlidersHorizontal,
  ShieldCheck,
  Award,
  Wand2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import plainWhiteMug from '../assets/images/mug_before_plain_1788055335130.jpg';
import personalizedFloralMug from '../assets/images/mug_after_personalized_1788055350285.jpg';
import monogramMug from '../assets/images/mug_after_monogram_1788055362695.jpg';
import photoMug from '../assets/images/mug_after_photo_1788055375307.jpg';

interface BeforeAfterItem {
  id: string;
  category: string;
  atelier: string;
  atelierColor: string;
  title: string;
  subtitle: string;
  beforeImage: string;
  afterImage: string;
  beforeDesc: string;
  afterDesc: string;
  details: string[];
}

const BEFORE_AFTER_ITEMS: BeforeAfterItem[] = [
  {
    id: 'caneca-florais',
    category: 'Caneca de Porcelana Personalizada',
    atelier: 'Tutty Mimo',
    atelierColor: '#8C6D37',
    title: 'Caneca com Caligrafia & Florais',
    subtitle: 'De uma simples caneca branca lisa a um mimo cheio de afeto e elegância',
    beforeImage: plainWhiteMug,
    afterImage: personalizedFloralMug,
    beforeDesc: 'Caneca de porcelana branca lisa e neutra, sem gravação ou elementos sentimentais.',
    afterDesc: 'Caneca em porcelana nobre com ilustração botânica feita sob medida, seu nome em caligrafia artística e detalhe em ouro.',
    details: [
      'Porcelana de alta alvura e brilho espelhado',
      'Ilustração artesanal botânica em alta definição',
      'Seu nome em caligrafia artística elegante',
      'Embalada em caixa presenteável com laço e aroma'
    ]
  },
  {
    id: 'caneca-monograma',
    category: 'Caneca de Porcelana Executiva',
    atelier: 'La Pallyra',
    atelierColor: '#6D5443',
    title: 'Caneca com Monograma Dourado',
    subtitle: 'Sofisticação e requinte para acompanhar seu café todos os dias',
    beforeImage: plainWhiteMug,
    afterImage: monogramMug,
    beforeDesc: 'Caneca branca genérica sem identificação.',
    afterDesc: 'Caneca de porcelana com monograma metalizado dourado, friso fino e acabamento de ateliê.',
    details: [
      'Monograma personalizado com suas iniciais',
      'Estampa metálica resistente e reluzente',
      'Design clássico minimalista e atemporal',
      'Caixinha cartonada rígida inclusa'
    ]
  },
  {
    id: 'caneca-foto-frase',
    category: 'Caneca Afetiva com Foto & Mensagem',
    atelier: 'com amor, Guennita',
    atelierColor: '#B38F4D',
    title: 'Caneca com Foto & Frase Afetiva',
    subtitle: 'Eternize momentos inesquecíveis e frases que aquecem o coração',
    beforeImage: plainWhiteMug,
    afterImage: photoMug,
    beforeDesc: 'Caneca de porcelana simples de prateleira.',
    afterDesc: 'Caneca com foto marcante tratada com carinho e frase especial em tipografia delicada.',
    details: [
      'Impressão de foto em altíssima resolução',
      'Tratamento de imagem e diagramação afetiva',
      'Resistente a lava-louças e micro-ondas',
      'Cheirinho exclusivo do ateliê na entrega'
    ]
  }
];

export const PersonalizePage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0 to 100

  const currentItem = BEFORE_AFTER_ITEMS[selectedItemIndex];

  return (
    <div className="min-h-screen bg-[#FDFCFA] text-[#2C1810] font-sans pb-20">
      
      {/* HERO BANNER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF6F0] via-[#FDFCFA] to-[#FDFCFA] pt-10 pb-12 px-4 sm:px-6 lg:px-8 border-b border-[#E8DFC8]/40">
        <div className="max-w-4xl mx-auto text-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF0E6] border border-[#E8DFC8] text-[#8C6D37] text-xs font-bold uppercase tracking-[0.2em] mb-4 shadow-xs"
          >
            <Sparkles size={14} className="text-[#B38F4D]" />
            <span>Transforme o Comum em Inesquecível</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-mea-culpa text-5xl sm:text-6xl md:text-7xl text-[#2C1810] leading-tight mb-4"
          >
            A Magia da Personalização
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-sm sm:text-base md:text-lg text-[#593E32] font-light max-w-2xl mx-auto leading-relaxed mb-6"
          >
            Nenhum presente fala tão alto ao coração quanto aquele pensado exclusivamente para quem você ama. 
            Veja como uma simples <span className="font-semibold text-[#8C6D37]">caneca de porcelana branca</span> ganha vida e se transforma em uma peça única e inesquecível.
          </motion.p>

          {/* Key Value Badges */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-[#6D5443]"
          >
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#E8DFC8] shadow-xs">
              <CheckCircle2 size={15} className="text-[#B38F4D]" />
              <span>Aprovação Prévia da Arte</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#E8DFC8] shadow-xs">
              <CheckCircle2 size={15} className="text-[#B38F4D]" />
              <span>Porcelana Nobre de Alta Alvura</span>
            </div>
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-full border border-[#E8DFC8] shadow-xs">
              <CheckCircle2 size={15} className="text-[#B38F4D]" />
              <span>Embalagem Perfumada Pronta</span>
            </div>
          </motion.div>

        </div>
      </section>

      {/* DEMONSTRATION SECTION: BEFORE & AFTER SLIDER ONLY */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        
        {/* Section Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-[#CCA062] font-bold text-xs uppercase tracking-[0.25em] mb-2">
            <Wand2 size={14} />
            <span>Barra Interativa Antes & Depois</span>
          </div>
          <h2 className="font-mea-culpa text-4xl sm:text-5xl text-[#2C1810]">
            Arraste para Ver a Transformação
          </h2>
          <p className="text-xs sm:text-sm text-[#593E32] font-light max-w-md mx-auto mt-1">
            Mova o marcador central para comparar a caneca branca lisa com o modelo personalizado do ateliê.
          </p>
        </div>

        {/* Option Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {BEFORE_AFTER_ITEMS.map((item, idx) => {
            const isSelected = idx === selectedItemIndex;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setSelectedItemIndex(idx);
                  setSliderPosition(50);
                }}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#2C1810] text-white shadow-md scale-105'
                    : 'bg-white text-[#593E32] border border-[#E8DFC8] hover:border-[#B38F4D] hover:bg-[#FAF6F0]'
                }`}
              >
                <Sparkles size={13} className={isSelected ? 'text-[#CCA062]' : 'text-[#8C6D37]'} />
                <span>{item.title}</span>
              </button>
            );
          })}
        </div>

        {/* Item Info Header */}
        <div className="flex items-center justify-between mb-3 bg-white px-4 py-2.5 rounded-xl border border-[#E8DFC8] max-w-2xl mx-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-[#6D5443]">
            <span className="px-2 py-0.5 rounded-md bg-[#FAF0E6] text-[#8C6D37] text-[11px]">
              Ateliê {currentItem.atelier}
            </span>
            <span>•</span>
            <span className="text-xs text-[#593E32] font-normal">{currentItem.subtitle}</span>
          </div>
        </div>

        {/* COMPACT INTERACTIVE COMPARISON CONTAINER */}
        <div className="relative max-w-2xl mx-auto w-full h-[280px] sm:h-[340px] md:h-[370px] rounded-2xl overflow-hidden shadow-xl border border-[#E8DFC8] bg-black select-none">
          
          {/* AFTER Image (Background Base - Personalized Mug) */}
          <img
            src={currentItem.afterImage}
            alt="Caneca personalizada"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* AFTER Label */}
          <div className="absolute top-3 right-3 z-20 bg-[#2C1810]/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-[#CCA062]/50 shadow-md flex items-center gap-1.5 text-[11px] font-bold">
            <Sparkles size={12} className="text-[#CCA062]" />
            <span>DEPOIS: Caneca Personalizada</span>
          </div>

          {/* BEFORE Image (Clipped overlay based on sliderPosition - White Plain Mug) */}
          <div
            className="absolute inset-0 z-10 overflow-hidden"
            style={{ width: `${sliderPosition}%` }}
          >
            <img
              src={currentItem.beforeImage}
              alt="Caneca branca lisa"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ width: '100%', maxWidth: 'none' }}
            />
            {/* BEFORE Label */}
            <div className="absolute top-3 left-3 z-20 bg-black/75 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-white/20 shadow-md flex items-center gap-1 text-[11px] font-bold whitespace-nowrap">
              <span>ANTES: Caneca Branca Lisa</span>
            </div>
          </div>

          {/* SLIDER HANDLE / DIVIDER LINE */}
          <div
            className="absolute top-0 bottom-0 z-30 w-1 bg-white cursor-ew-resize shadow-[0_0_12px_rgba(0,0,0,0.6)]"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white text-[#2C1810] shadow-xl flex items-center justify-center border-2 border-[#8C6D37] cursor-ew-resize active:scale-110 transition-transform">
              <SlidersHorizontal size={16} className="text-[#8C6D37]" />
            </div>
          </div>

          {/* Range Input Overlay for Dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 z-40 w-full h-full opacity-0 cursor-ew-resize"
            aria-label="Controle de comparação antes e depois"
          />

          {/* Bottom Floating Hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md text-white/90 text-[10px] sm:text-[11px] font-medium px-3.5 py-1 rounded-full border border-white/20 pointer-events-none flex items-center gap-1.5">
            <span>◄ Arraste a barra para comparar ►</span>
          </div>
        </div>

        {/* DETAILS OF PERSONALIZATION FOR THIS ITEM */}
        <div className="mt-6 max-w-2xl mx-auto bg-white rounded-2xl p-5 sm:p-6 border border-[#E8DFC8] shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-[#E8DFC8]">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8C6D37]">
                {currentItem.category}
              </span>
              <h3 className="font-mea-culpa text-2xl sm:text-3xl text-[#2C1810] mt-0.5">
                {currentItem.title}
              </h3>
            </div>
            
            <button
              onClick={() => navigate('/comomontar')}
              className="px-5 py-2.5 rounded-full bg-[#2C1810] hover:bg-[#8C6D37] text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Personalizar Minha Caneca</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <h4 className="text-[11px] font-bold text-[#6D5443] uppercase tracking-wider mb-3">
            O que torna essa caneca especial:
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentItem.details.map((detail, dIdx) => (
              <div 
                key={dIdx} 
                className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF6F0] border border-[#E8DFC8]/70"
              >
                <div className="w-5 h-5 rounded-full bg-[#8C6D37] text-white flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold shadow-xs">
                  ✓
                </div>
                <span className="text-xs text-[#3A312D] font-medium leading-snug">
                  {detail}
                </span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* WHY PERSONALIZE SECTION (INCENTIVES) */}
      <section className="bg-[#FAF6F0] py-12 border-y border-[#E8DFC8]/60 mt-6">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          <div className="text-center mb-10">
            <span className="text-[#8C6D37] text-xs font-bold uppercase tracking-[0.2em]">
              Por Que Escolher a Personalização?
            </span>
            <h2 className="font-mea-culpa text-4xl sm:text-5xl text-[#2C1810] mt-1">
              Motivos para Adoçar & Surpreender
            </h2>
            <p className="text-xs sm:text-sm text-[#593E32] font-light max-w-xl mx-auto mt-1">
              Transformar uma caneca ou um mimo comum em um objeto personalizado mostra cuidado e afeto em cada detalhe.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8DFC8] shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] text-[#8C6D37] flex items-center justify-center mb-4 shadow-xs border border-[#E8DFC8]">
                <Heart size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-[#2C1810] mb-2 font-semibold">
                Memórias Inesquecíveis
              </h3>
              <p className="text-xs text-[#593E32] font-light leading-relaxed">
                Um item genérico é guardado na gaveta. Uma caneca personalizada com nome ou mensagem vira um momento especial a cada gole de café.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8DFC8] shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] text-[#8C6D37] flex items-center justify-center mb-4 shadow-xs border border-[#E8DFC8]">
                <Award size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-[#2C1810] mb-2 font-semibold">
                Acabamento Premium
              </h3>
              <p className="text-xs text-[#593E32] font-light leading-relaxed">
                Porcelana fina com estampas de alta fixação que não descascam e preservam a nitidez das cores e do brilho por anos.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-6 border border-[#E8DFC8] shadow-xs flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#FAF0E6] text-[#8C6D37] flex items-center justify-center mb-4 shadow-xs border border-[#E8DFC8]">
                <ShieldCheck size={22} strokeWidth={1.5} />
              </div>
              <h3 className="font-serif text-lg text-[#2C1810] mb-2 font-semibold">
                Aprovação da Arte Sem Susto
              </h3>
              <p className="text-xs text-[#593E32] font-light leading-relaxed">
                Sua produção só inicia após o envio da prévia digital no WhatsApp e sua aprovação total da tipografia e do layout.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* HOW IT WORKS: STEP BY STEP */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="text-center mb-8">
          <span className="text-[#8C6D37] text-xs font-bold uppercase tracking-[0.2em]">
            Passo a Passo Simples
          </span>
          <h2 className="font-mea-culpa text-4xl sm:text-5xl text-[#2C1810] mt-1">
            Como Encomendar Seu Mimo Único
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: '01',
              title: 'Escolha o Produto',
              desc: 'Selecione a caneca ou mimo desejado no catálogo ou monte um kit completo.'
            },
            {
              step: '02',
              title: 'Envie as Infos',
              desc: 'Indique os nomes, iniciais, frases ou fotos no pedido.'
            },
            {
              step: '03',
              title: 'Aprove a Arte',
              desc: 'Receba a prévia digital para validar todos os detalhes antes da gravação.'
            },
            {
              step: '04',
              title: 'Receba Encantado',
              desc: 'Receba seu produto embalado para presente, com aroma e muito carinho.'
            }
          ].map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-5 border border-[#E8DFC8] shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="text-2xl font-mea-culpa text-[#8C6D37] block mb-1">
                  Passo {item.step}
                </span>
                <h3 className="font-serif text-sm font-bold text-[#2C1810] mb-1">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[#593E32] font-light leading-relaxed">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 mt-4">
        <div className="bg-gradient-to-r from-[#2C1810] via-[#3A2A20] to-[#2C1810] rounded-2xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-[#8C6D37]/40 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          
          <div className="max-w-lg z-10">
            <span className="text-[#CCA062] font-bold text-xs uppercase tracking-[0.2em] block mb-1">
              Pronto para encantar?
            </span>
            <h2 className="font-mea-culpa text-4xl sm:text-5xl text-white leading-tight mb-2">
              Crie Sua Caneca Personalizada
            </h2>
            <p className="text-xs text-amber-100/80 font-light leading-relaxed">
              Explore nossa vitrine de mimos artesanais ou monte um presente exclusivo hoje mesmo.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 z-10 w-full sm:w-auto">
            <button
              onClick={() => navigate('/vitrine')}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#CCA062] hover:bg-[#b58c4f] text-[#2C1810] text-[11px] font-bold uppercase tracking-widest transition-all shadow-md cursor-pointer"
            >
              Ver Produtos
            </button>
            <button
              onClick={() => navigate('/comomontar')}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold uppercase tracking-widest border border-white/20 transition-all cursor-pointer"
            >
              Montar Kit
            </button>
          </div>

        </div>
      </section>

    </div>
  );
};
