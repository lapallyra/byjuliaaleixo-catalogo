import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Palette, CheckCircle, Heart, Sparkles } from 'lucide-react';
import { ContinueExploring } from './ContinueExploring';

// Editorial Images
const HERO_IMAGE = "/src/assets/images/how_to_build_hero_1784214684670.jpg";
const STEP_1_IMAGE = "/src/assets/images/step_1_selection_editorial_1784214695043.jpg";
const STEP_3_IMAGE = "/src/assets/images/step_3_personalization_detail_1784214705831.jpg";
const FINAL_IMAGE = "/src/assets/images/final_kit_celebration_1784214717534.jpg";

export const HowToBuildKitView: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  const steps = [
    {
      number: '01',
      title: 'Escolha o tipo de kit',
      description: 'Comece definindo o propósito. Seja para um presente corporativo, uma lembrança de maternidade ou um mimo pessoal, temos a base ideal para sua criação.',
      icon: <Package className="w-6 h-6" />,
      image: STEP_1_IMAGE
    },
    {
      number: '02',
      title: 'Selecione os produtos',
      description: 'Navegue por nossa curadoria de itens artesanais. Papelaria fina, velas aromáticas, acessórios em cetim e muito mais para compor sua caixa.',
      icon: <Sparkles className="w-6 h-6" />,
      image: HERO_IMAGE // Reusing for variety in layout
    },
    {
      number: '03',
      title: 'Personalize os detalhes',
      description: 'A magia acontece nos detalhes. Escolha as cores das fitas, o tipo de acabamento e adicione mensagens personalizadas que tornam o kit verdadeiramente único.',
      icon: <Palette className="w-6 h-6" />,
      image: STEP_3_IMAGE
    },
    {
      number: '04',
      title: 'Finalize seu pedido',
      description: 'Revisamos cada detalhe com cuidado artesanal antes de preparar o envio. Seu kit chegará impecável, pronto para emocionar quem o receber.',
      icon: <CheckCircle className="w-6 h-6" />,
      image: FINAL_IMAGE
    }
  ];

  return (
    <div className="bg-[#FDFCFA] min-h-screen font-sans selection:bg-[#E8DCC8] selection:text-[#3A312D] overflow-x-hidden relative">
      
      {/* 1. HERO SECTION */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-[#F8F5F0] border-b border-[#E8DCC8]/40 flex items-center justify-center">
        <div className="relative z-10 text-center px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-[#3D2E24] font-mea-culpa text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-4 tracking-tight py-1">
              Monte seu Kit
            </h1>
            <p className="text-[#6D5443] text-sm sm:text-base md:text-lg font-light tracking-wide max-w-xl mx-auto leading-relaxed mb-8">
              Transforme um presente em uma experiência inesquecível. Crie composições personalizadas escolhendo cada produto e detalhe com sua essência.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/kit-meukit')}
              className="bg-[#6D5443] hover:bg-[#5B4535] text-white px-8 sm:px-10 py-3 sm:py-3.5 rounded-full text-xs uppercase tracking-[0.2em] font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Começar agora
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* 2. COMO FUNCIONA - JORNADA VISUAL */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-8 max-w-[1850px] mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#CCA062] mb-2 block">Passo a Passo</span>
          <h2 className="text-[#3D2E24] font-mea-culpa text-3xl sm:text-4xl md:text-5xl mb-4">
            Uma jornada de criação
          </h2>
          <div className="w-12 h-[1px] bg-[#CCA062] mx-auto" />
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Vertical line connector for desktop */}
          <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-[1px] bg-gradient-to-b from-[#E8DCC8] via-[#CCA062]/30 to-transparent -translate-x-1/2" />

          <div className="space-y-12 sm:space-y-16 md:space-y-20">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={step.number} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-6 sm:gap-8 md:gap-12 relative bg-white/50 md:bg-transparent p-5 sm:p-6 md:p-0 rounded-2xl border border-[#E8DCC8]/30 md:border-0`}>
                  
                  {/* Image Block */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="w-full sm:w-4/5 md:w-5/12 max-w-[360px] sm:max-w-[400px] aspect-[4/3] sm:aspect-square md:aspect-[4/5] max-h-[300px] sm:max-h-[340px] md:max-h-[380px] overflow-hidden rounded-2xl shadow-md border border-[#E8DCC8]/40 relative shrink-0"
                  >
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs border border-[#E8DCC8] flex items-center justify-center shadow-xs">
                      <span className="text-[#CCA062] font-serif text-xs font-bold">
                        {step.number}
                      </span>
                    </div>
                  </motion.div>

                  {/* Text Block */}
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="w-full md:w-7/12 text-center md:text-left flex flex-col justify-center"
                  >
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[#FCFAF7] border border-[#E8DCC8] text-[#CCA062] mb-4 shadow-2xs mx-auto md:mx-0">
                      {step.icon}
                    </div>
                    <h3 className="text-[#3D2E24] font-serif text-xl sm:text-2xl md:text-3xl font-medium tracking-tight mb-3">
                      {step.title}
                    </h3>
                    <p className="text-[#6D5443] text-sm sm:text-base font-light leading-relaxed max-w-md mx-auto md:mx-0">
                      {step.description}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. EXPERIÊNCIA DE PERSONALIZAÇÃO */}
      <section className="bg-white py-14 sm:py-18 md:py-24 px-4 sm:px-6 md:px-8 border-y border-[#E8DCC8]/30">
        <div className="max-w-[1850px] mx-auto">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-7 space-y-8"
            >
              <div className="space-y-3">
                <span className="text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.3em]">Artesanato com Propósito</span>
                <h2 className="text-[#3D2E24] font-mea-culpa text-3xl sm:text-4xl md:text-5xl font-normal">Cada kit é uma história única</h2>
                <p className="text-[#735A4A] text-sm sm:text-base font-light leading-relaxed">
                  Não apenas montamos caixas; criamos conexões. Nosso processo artesanal garante que cada elemento escolhido converse entre si, resultando em uma apresentação que transborda carinho e atenção.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 pt-2">
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8]/40 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2E24]">Curadoria de Itens</h4>
                  <p className="text-xs text-[#735A4A] font-light leading-relaxed">Produtos selecionados de nossos quatro ateliês exclusivos.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8]/40 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2E24]">Cores & Texturas</h4>
                  <p className="text-xs text-[#735A4A] font-light leading-relaxed">Combine paletas que traduzem a emoção do momento.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8]/40 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2E24]">Toque Personalizado</h4>
                  <p className="text-xs text-[#735A4A] font-light leading-relaxed">Adicione nomes, datas e mensagens que tocam o coração.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8DFC8]/40 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#3D2E24]">Acabamento Fino</h4>
                  <p className="text-xs text-[#735A4A] font-light leading-relaxed">Laços de cetim e embalagens premium feitas à mão.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-5 relative w-full max-w-[360px] sm:max-w-[400px] mx-auto aspect-square max-h-[360px] sm:max-h-[380px] rounded-2xl overflow-hidden shadow-md border border-[#E8DCC8]/50"
            >
              <img 
                src={STEP_3_IMAGE} 
                alt="Personalização em detalhes" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Continue Exploring Section */}
      <ContinueExploring currentPath="/comomontar" />

      {/* 4. CTA FINAL */}
      <section className="py-16 sm:py-20 md:py-24 px-6 bg-[#FCFAF7] text-center relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#E8DCC8]/20 rounded-full blur-[100px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto"
        >
          <Heart className="w-6 h-6 text-[#CCA062] mx-auto mb-4" />
          <h2 className="text-[#3D2E24] font-mea-culpa text-3xl sm:text-4xl md:text-5xl mb-4 font-normal">
            Crie algo especial para alguém especial
          </h2>
          <p className="text-[#735A4A] text-xs sm:text-sm font-light tracking-wider mb-8 uppercase leading-relaxed max-w-md mx-auto">
            Comece agora a jornada de criar um kit que será lembrado para sempre.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/kit-meukit')}
            className="bg-[#2C1810] hover:bg-[#3D261C] text-white px-10 py-3.5 rounded-full text-xs uppercase tracking-[0.25em] font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer"
          >
            Montar meu kit
          </motion.button>
        </motion.div>
      </section>

      {/* Decorative Footer */}
      <div className="pb-16 bg-[#FCFAF7] flex flex-col items-center gap-8">
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#CCA062]/40 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#CCA062]/60 font-bold italic">
          Feito com mãos e coração
        </span>
      </div>

    </div>
  );
};
