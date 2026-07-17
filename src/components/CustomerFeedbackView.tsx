import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Quote, Heart, Sparkles } from 'lucide-react';
import { subscribeToApprovedFeedbacks } from '../services/firebaseService';
import { ContinueExploring } from './ContinueExploring';
import { BotaoVoltar } from './BotaoVoltar';

const FEEDBACK_HERO_IMAGE = "/src/assets/images/customer_feedback_editorial_1784216601476.jpg";

export const CustomerFeedbackView: React.FC = () => {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  useEffect(() => {
    const unsub = subscribeToApprovedFeedbacks((results) => {
      setFeedbacks(results);
    });
    return () => unsub();
  }, []);

  const defaultFeedbacks = [
    {
      author: "Juliana Silva",
      text: "Simplesmente encantada com o cuidado em cada detalhe. O kit chegou impecável e a personalização ficou exatamente como eu imaginei. Uma experiência de presente verdadeiramente única.",
      date: "Maio 2024"
    },
    {
      author: "Ricardo Mendes",
      text: "A papelaria artesanal é de uma qualidade absurda. O acabamento em cartonagem é resistente e elegantíssimo. Meus clientes ficaram impressionados com os brindes corporativos.",
      date: "Abril 2024"
    },
    {
      author: "Mariana Costa",
      text: "Minha lista de presentes foi um sucesso. Os convidados elogiaram muito a facilidade de escolha e a beleza dos produtos. Receber cada item foi como ganhar um abraço.",
      date: "Março 2024"
    }
  ];

  const displayFeedbacks = feedbacks.length > 0 ? feedbacks : defaultFeedbacks;

  return (
    <div className="bg-[#FCFAF7] min-h-screen font-sans selection:bg-[#E8DCC8] selection:text-[#3A312D] overflow-x-hidden relative">
      
      {/* Return Button */}
      <BotaoVoltar variant="light" />

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <motion.div 
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="absolute inset-0 z-0"
        >
          <img 
            src={FEEDBACK_HERO_IMAGE} 
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
              Confiança & Experiência
            </span>
            <h1 className="text-white font-mea-culpa text-7xl md:text-9xl mb-8 tracking-tight drop-shadow-sm">
              Feedback que Amamos
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-12">
              Histórias de carinho e conexões reais transformadas em mimos artesanais. Veja o que nossos clientes sentem ao receber um pedacinho dos nossos ateliês.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const el = document.getElementById('feedback-feed');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white text-black px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              Ver Depoimentos
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

      {/* Feedback Feed */}
      <section id="feedback-feed" className="py-24 md:py-40 px-6 max-w-4xl mx-auto space-y-32">
        {displayFeedbacks.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <Quote className="w-12 h-12 text-[#CCA062]/20 mx-auto" strokeWidth={1} />
            <p className="text-[#3D2E24] font-serif text-2xl md:text-4xl italic leading-relaxed font-light">
              "{item.text}"
            </p>
            <div className="flex flex-col items-center gap-2">
              <span className="text-[#3D2E24] text-[11px] font-bold uppercase tracking-[0.3em]">
                {item.author}
              </span>
              {item.date && (
                <span className="text-[#8E8E93] text-[9px] uppercase tracking-widest">
                  {item.date}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </section>

      {/* Middle Section: Visual Narrative */}
      <section className="bg-white py-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <Sparkles className="w-8 h-8 text-[#CCA062]/30 mx-auto mb-8" />
          <h2 className="text-[#3D2E24] font-mea-culpa text-5xl md:text-7xl mb-8">O afeto está nos detalhes</h2>
          <p className="text-[#8E8E93] text-sm md:text-base font-light tracking-wide max-w-xl mx-auto leading-relaxed uppercase">
            Cada depoimento é uma confirmação de que o trabalho manual carrega uma energia única, capaz de emocionar e criar memórias eternas.
          </p>
        </div>
      </section>

      {/* Continue Exploring Section */}
      <ContinueExploring currentPath="/feedclientes" />

      {/* Final CTA */}
      <section className="py-32 md:py-48 px-6 bg-[#FCFAF7] text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Heart className="w-8 h-8 text-[#6D0D0D]/20 mx-auto mb-8" />
          <h2 className="text-[#3D2E24] font-serif text-3xl md:text-4xl uppercase tracking-[0.2em] mb-6">
            Queremos ouvir sua história
          </h2>
          <p className="text-[#8E8E93] text-sm md:text-base font-light tracking-wide mb-12 uppercase leading-relaxed">
            Recebeu um mimo ou criou uma lista conosco? Conte-nos como foi sua experiência.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/contato')}
            className="bg-[#3D2E24] text-white px-12 py-5 rounded-full text-xs uppercase tracking-[0.3em] font-bold shadow-2xl hover:bg-black transition-all"
          >
            Enviar feedback
          </motion.button>
        </motion.div>
      </section>

      {/* Decorative Footer */}
      <div className="pb-16 bg-[#FCFAF7] flex justify-center">
        <div className="w-12 h-[1px] bg-[#CCA062]/30" />
      </div>

    </div>
  );
};
