import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Heart } from 'lucide-react';
import { subscribeToAllSettings } from '../services/firebaseService';
import { ContinueExploring } from './ContinueExploring';
import { BotaoVoltar } from './BotaoVoltar';

// Editorial Images
const HERO_IMAGE = "/src/assets/images/ateliers_hero_editorial_1784213492614.jpg";
const PALLYRA_IMAGE = "/src/assets/images/pallyra_editorial_1784213505525.jpg";
const GUENNITA_IMAGE = "/src/assets/images/guennita_editorial_1784213518263.jpg";
const MIMADA_IMAGE = "/src/assets/images/mimada_editorial_1784213531490.jpg";
const TUTTY_IMAGE = "/src/assets/images/tuttymimo_editorial_1784213576844.jpg";

export const AteliersPresentationView: React.FC = () => {
  const navigate = useNavigate();
  const [customSettings, setCustomSettings] = useState<any>({});
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.05]);

  useEffect(() => {
    return subscribeToAllSettings((results) => {
      setCustomSettings(results);
    });
  }, []);

  const ateliers = [
    {
      id: 'pallyra',
      name: 'La Pallyra',
      title: 'Papelaria Artesanal & Blocagem',
      concept: 'A Arte da Escrita e Memória',
      description: 'Organização e rotina transformadas em momentos de poesia. Nossos planners e blocos são tecidos com técnicas de cartonagem secular, abraçando suas ideias em papéis de gramatura nobre.',
      image: PALLYRA_IMAGE,
      route: '/lapallyra',
      color: '#1A1A1A'
    },
    {
      id: 'guennita',
      name: 'com amor, Guennita',
      title: 'Romantismo & Flores de Cetim',
      concept: 'Eternizando Sentimentos',
      description: 'Cada pétala é moldada individualmente em cetim premium. Buquês que desafiam o tempo, conservando a doçura dos dias mais felizes de uma vida.',
      image: GUENNITA_IMAGE,
      route: '/comamorguennita',
      color: '#6D0D0D'
    },
    {
      id: 'mimada',
      name: 'Mimada Sim',
      title: 'Lembranças com Alma',
      concept: 'O Brilho de Celebrar',
      description: 'Onde a festa ganha sofisticação. Transformamos o ato de presentear em uma experiência sensorial, com acabamentos delicados e design exclusivo para momentos inesquecíveis.',
      image: MIMADA_IMAGE,
      route: '/mimadasim',
      color: '#D4AF37'
    },
    {
      id: 'tuttymimo',
      name: 'Tutty Mimo',
      title: 'Maternidade Premium',
      concept: 'O Primeiro Acolhimento',
      description: 'Uma curadoria afetiva para o início da jornada. Estilo minimalista e tecidos naturais que envolvem o bebê em um abraço de cuidado e elegância.',
      image: TUTTY_IMAGE,
      route: '/tuttymimo',
      color: '#CCA062'
    }
  ];

  return (
    <div className="bg-[#FCFAF7] min-h-screen font-sans selection:bg-[#E8DCC8] selection:text-[#3A312D] overflow-x-hidden relative">
      
      {/* Return Button */}
      <BotaoVoltar variant="light" />

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
              Inovação & Identidade
            </span>
            <h1 className="text-white font-mea-culpa text-7xl md:text-9xl mb-8 tracking-tight drop-shadow-sm">
              Nossos Ateliês
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-12">
              Quatro universos criativos dedicados à arte de emocionar. Conheça os espaços onde o trabalho manual se transforma em poesia para seus momentos mais especiais.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                document.getElementById('ateliers-narrative')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-black px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              Explorar Ateliês
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

      {/* 2. ATELIERS NARRATIVE SECTION */}
      <section id="ateliers-narrative" className="py-24 md:py-40 px-6 md:px-12 max-w-[1400px] mx-auto space-y-40 md:space-y-64">
        {ateliers.map((atelier, index) => {
          const isEven = index % 2 === 0;
          return (
            <div 
              key={atelier.id}
              className={`flex flex-col ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24 lg:gap-32`}
            >
              {/* Image Block */}
              <motion.div 
                initial={{ opacity: 0, x: isEven ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="w-full md:w-1/2 aspect-[4/5] relative group"
              >
                <div className="absolute -inset-4 border border-[#E8DCC8]/30 rounded-[2rem] -z-10 group-hover:inset-0 transition-all duration-700" />
                <img 
                  src={atelier.image} 
                  alt={atelier.name}
                  className="w-full h-full object-cover rounded-2xl shadow-2xl transition-transform duration-1000 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5" />
              </motion.div>

              {/* Content Block */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="w-full md:w-1/2 text-center md:text-left"
              >
                <span className="inline-block text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
                  {atelier.concept}
                </span>
                <h2 className="text-[#3D2E24] font-mea-culpa text-5xl md:text-7xl mb-6">
                  {atelier.name}
                </h2>
                <h3 className="text-[#8E8E93] text-sm uppercase tracking-[0.2em] mb-8 font-medium">
                  {atelier.title}
                </h3>
                <p className="text-[#6D5443] text-base md:text-lg font-light leading-relaxed mb-10 max-w-md mx-auto md:mx-0">
                  {atelier.description}
                </p>
                <motion.button
                  whileHover={{ x: 10 }}
                  onClick={() => navigate(atelier.route)}
                  className="inline-flex items-center gap-4 text-[#3D2E24] group"
                >
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] border-b border-[#3D2E24]/20 pb-1 group-hover:border-[#3D2E24] transition-all">
                    Descobrir Coleção
                  </span>
                  <ArrowRight size={16} className="text-[#CCA062]" />
                </motion.button>
              </motion.div>
            </div>
          );
        })}
      </section>

      {/* 3. CONNECTION SECTION */}
      <section className="bg-white py-32 md:py-48 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#FCFAF7] to-transparent" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <Sparkles className="w-12 h-12 text-[#CCA062]/40 mx-auto mb-10" strokeWidth={1} />
            <h2 className="font-mea-culpa text-6xl md:text-8xl text-[#3D2E24] mb-12">
              Um propósito. Diferentes estilos.
            </h2>
            <div className="grid md:grid-cols-3 gap-12 text-center">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCA062]">Essência</h4>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Cada ateliê possui sua própria personalidade, estética e proposta.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCA062]">Excelência</h4>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Diferentes linguagens visuais unidas pelo mesmo rigor técnico e cuidado artesanal.
                </p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#CCA062]">Curadoria</h4>
                <p className="text-sm text-[#8E8E93] leading-relaxed">
                  Produtos que contam histórias e valorizam os pequenos rituais do dia a dia.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Continue Exploring Section */}
      <ContinueExploring currentPath="/atelies" />

      {/* 4. FINAL CTA */}
      <section className="py-32 md:py-48 px-6 bg-[#FCFAF7] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Heart className="w-8 h-8 text-[#6D0D0D]/20 mx-auto mb-8" />
          <h2 className="text-[#3D2E24] font-serif text-3xl md:text-4xl uppercase tracking-[0.2em] mb-6">
            Encontre o ateliê que combina com você
          </h2>
          <p className="text-[#8E8E93] text-sm md:text-base font-light tracking-wide mb-12 uppercase leading-relaxed">
            Navegue por nossas marcas e encontre o presente perfeito ou o item que faltava para sua organização.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/vitrine')}
            className="bg-[#3D2E24] text-white px-12 py-5 rounded-full text-xs uppercase tracking-[0.3em] font-bold shadow-2xl hover:bg-black transition-all"
          >
            Ver produtos
          </motion.button>
        </motion.div>
      </section>

      {/* Decorative Footer Dash */}
      <div className="pb-12 bg-[#FCFAF7] flex justify-center">
        <div className="w-12 h-[1px] bg-[#CCA062]/30" />
      </div>

    </div>
  );
};

