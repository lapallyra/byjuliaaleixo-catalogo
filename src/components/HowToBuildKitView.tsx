import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Package, Palette, CheckCircle, Heart, Sparkles } from 'lucide-react';
import { ContinueExploring } from './ContinueExploring';
import { BotaoVoltar } from './BotaoVoltar';

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
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={HERO_IMAGE} 
            alt="Hero" 
            className="w-full h-full object-cover brightness-[0.75]"
          />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            <span className="inline-block mb-6 text-white/80 uppercase tracking-[0.4em] text-[10px] font-medium bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10">
              Criatividade & Processo
            </span>
            <h1 className="text-white font-mea-culpa text-7xl md:text-9xl mb-8 tracking-tight drop-shadow-sm">
              Monte seu Kit
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-12">
              Transforme um presente em uma experiência inesquecível. Crie composições personalizadas escolhendo cada produto e detalhe com sua essência.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/kit-meukit')}
              className="bg-white text-black px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              Começar agora
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.3em]">Scroll</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* 2. COMO FUNCIONA - JORNADA VISUAL */}
      <section className="py-24 md:py-40 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="text-center mb-32">
          <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-8xl mb-8">
            Uma jornada de criação
          </h2>
          <div className="w-16 h-[1px] bg-[#CCA062] mx-auto" />
        </div>

        <div className="relative">
          {/* Vertical line connector for desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-[#E8DCC8] via-[#CCA062]/30 to-transparent -translate-x-1/2" />

          <div className="space-y-40 md:space-y-64">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={step.number} className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24 relative`}>
                  
                  {/* Step Number Badge */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-24 md:-translate-y-32 z-20">
                    <div className="w-16 h-16 rounded-full bg-white border border-[#E8DCC8] flex items-center justify-center shadow-lg">
                      <span className="text-[#CCA062] font-serif text-lg font-bold tracking-tighter">
                        {step.number}
                      </span>
                    </div>
                  </div>

                  {/* Image Block */}
                  <motion.div 
                    initial={{ opacity: 0, x: isEven ? -40 : 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="w-full md:w-1/2 aspect-square md:aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl"
                  >
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-110"
                    />
                  </motion.div>

                  {/* Text Block */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="w-full md:w-1/2 text-center md:text-left"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FCFAF7] border border-[#E8DCC8] text-[#CCA062] mb-8 shadow-sm">
                      {step.icon}
                    </div>
                    <h3 className="text-[#3D2E24] font-serif text-3xl md:text-4xl uppercase tracking-[0.1em] mb-6">
                      {step.title}
                    </h3>
                    <p className="text-[#6D5443] text-base md:text-lg font-light leading-relaxed mb-10 max-w-sm mx-auto md:mx-0">
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
      <section className="bg-white py-32 md:py-48 px-6">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="space-y-16"
            >
              <div className="space-y-6">
                <span className="text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.5em]">Artesanato com Propósito</span>
                <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-7xl">Cada kit é uma história única</h2>
                <p className="text-[#8E8E93] text-lg font-light leading-relaxed">
                  Não apenas montamos caixas; criamos conexões. Nosso processo artesanal garante que cada elemento escolhido converse entre si, resultando em uma apresentação que transborda carinho e atenção.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3D2E24]">Curadoria de Itens</h4>
                  <p className="text-sm text-[#8E8E93] leading-relaxed">Produtos selecionados de nossos quatro ateliês exclusivos.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3D2E24]">Cores & Texturas</h4>
                  <p className="text-sm text-[#8E8E93] leading-relaxed">Combine paletas que traduzem a emoção do momento.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3D2E24]">Toque Personalizado</h4>
                  <p className="text-sm text-[#8E8E93] leading-relaxed">Adicione nomes, datas e mensagens que tocam o coração.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#3D2E24]">Acabamento Fino</h4>
                  <p className="text-sm text-[#8E8E93] leading-relaxed">Laços de cetim e embalagens premium feitas à mão.</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="relative aspect-square rounded-[3rem] overflow-hidden shadow-2xl"
            >
              <img 
                src={STEP_3_IMAGE} 
                alt="Personalização em detalhes" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Continue Exploring Section */}
      <ContinueExploring currentPath="/comomontar" />

      {/* 4. CTA FINAL */}
      <section className="py-32 md:py-48 px-6 bg-[#FCFAF7] text-center relative overflow-hidden">
        {/* Abstract background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E8DCC8]/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Heart className="w-8 h-8 text-[#6D0D0D]/20 mx-auto mb-8" />
          <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-8xl mb-10">
            Crie algo especial para alguém especial
          </h2>
          <p className="text-[#8E8E93] text-sm md:text-base font-light tracking-[0.2em] mb-12 uppercase leading-relaxed max-w-lg mx-auto">
            Comece agora a jornada de criar um kit que será lembrado para sempre.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/kit-meukit')}
            className="bg-[#3D2E24] text-white px-12 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl hover:bg-black transition-all"
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
