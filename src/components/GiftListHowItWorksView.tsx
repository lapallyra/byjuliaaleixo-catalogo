import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, PlusCircle, ShoppingBag, Share2, Eye, ChevronDown, Heart, Sparkles } from 'lucide-react';
import { ContinueExploring } from './ContinueExploring';
import { BotaoVoltar } from './BotaoVoltar';

// Editorial Images
const HERO_IMAGE = "/src/assets/images/gift_list_hero_editorial_1784215289939.jpg";
const EXPERIENCE_IMAGE = "/src/assets/images/gift_list_experience_editorial_1784215302735.jpg";
const CELEBRATION_IMAGE = "/src/assets/images/celebration_gift_editorial_1784215316657.jpg";

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="border-b border-[#E8DCC8]/40">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-8 flex items-center justify-between text-left group"
      >
        <span className="text-[#3D2E24] font-serif text-lg md:text-xl uppercase tracking-wide transition-colors group-hover:text-[#CCA062]">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-[#CCA062]"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-[#8E8E93] text-base font-light leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const GiftListHowItWorksView: React.FC = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.1]);

  const steps = [
    {
      number: '01',
      title: 'Crie sua lista',
      description: 'Dê um nome ao seu momento e defina as informações básicas. Em poucos cliques, você terá um espaço exclusivo para organizar seus desejos.',
      icon: <PlusCircle className="w-6 h-6" />
    },
    {
      number: '02',
      title: 'Escolha seus produtos favoritos',
      description: 'Navegue por nossos ateliês e adicione os mimos que mais combinam com você. De papelaria fina a itens de maternidade, a escolha é sua.',
      icon: <ShoppingBag className="w-6 h-6" />
    },
    {
      number: '03',
      title: 'Compartilhe com seus convidados',
      description: 'Envie o link personalizado da sua lista para amigos e familiares. Uma experiência de compra fluida e elegante para quem quer te presentear.',
      icon: <Share2 className="w-6 h-6" />
    },
    {
      number: '04',
      title: 'Acompanhe seus presentes',
      description: 'Receba notificações em tempo real e gerencie tudo o que foi escolhido. Praticidade total para você focar no que realmente importa: sua celebração.',
      icon: <Eye className="w-6 h-6" />
    }
  ];

  const faqs = [
    {
      question: "O que é a Lista de Presentes?",
      answer: "É uma ferramenta exclusiva que permite selecionar produtos de nossos ateliês e reuni-los em uma página personalizada para que seus convidados possam te presentear de forma organizada e segura."
    },
    {
      question: "Como meus convidados acessam minha lista?",
      answer: "Você compartilha um link único gerado pelo sistema. Ao clicar, eles entram em uma vitrine dedicada com os itens que você selecionou, podendo realizar a compra diretamente por lá."
    },
    {
      question: "Posso escolher qualquer produto?",
      answer: "Sim! Todos os produtos disponíveis em nossos ateliês e na vitrine geral podem ser adicionados à sua lista de desejos."
    },
    {
      question: "Posso alterar minha lista depois de criada?",
      answer: "Com certeza. Você tem total liberdade para adicionar novos itens ou remover produtos da sua lista a qualquer momento antes da finalização."
    },
    {
      question: "Preciso comprar todos os produtos escolhidos?",
      answer: "Não. A lista funciona como uma sugestão de desejos para seus convidados. Os itens que não forem presenteados permanecem como registros do seu interesse."
    },
    {
      question: "Como acompanho os presentes recebidos?",
      answer: "Você terá um painel de controle onde poderá ver quais itens já foram adquiridos e por quem, facilitando os agradecimentos futuros."
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
              Emoção & Celebração
            </span>
            <h1 className="text-white font-mea-culpa text-7xl md:text-9xl mb-8 tracking-tight drop-shadow-sm">
              Lista de Presentes
            </h1>
            <p className="text-white/90 text-lg md:text-xl font-light tracking-wide max-w-2xl mx-auto leading-relaxed mb-12">
              Crie sua lista personalizada, selecione seus produtos favoritos e compartilhe a alegria de presentear com quem você ama.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/listapresentes')}
              className="bg-white text-black px-10 py-4 rounded-full text-xs uppercase tracking-[0.2em] font-bold shadow-xl hover:shadow-2xl transition-all"
            >
              Criar minha lista
            </motion.button>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] uppercase tracking-[0.3em]">Como funciona</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-white/50 to-transparent" />
        </motion.div>
      </section>

      {/* 2. COMO FUNCIONA - JORNADA VISUAL */}
      <section className="py-24 md:py-40 px-6 md:px-12 max-w-[1200px] mx-auto">
        <div className="text-center mb-32">
          <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-8xl mb-8">
            Sua lista em quatro atos
          </h2>
          <div className="w-16 h-[1px] bg-[#CCA062] mx-auto" />
        </div>

        <div className="relative">
          {/* Horizontal line connector for desktop */}
          <div className="hidden lg:block absolute left-0 right-0 top-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#CCA062]/30 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 relative">
            {steps.map((step, index) => (
              <motion.div 
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="flex flex-col items-center text-center group"
              >
                <div className="relative mb-10">
                  <div className="w-20 h-20 rounded-full bg-white border border-[#E8DCC8] flex items-center justify-center shadow-lg group-hover:border-[#CCA062] group-hover:shadow-[#CCA062]/10 transition-all duration-500">
                    <span className="text-[#CCA062] font-serif text-xl font-bold italic">
                      {step.number}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-[#FCFAF7] border border-[#E8DCC8] flex items-center justify-center text-[#CCA062] shadow-sm">
                    {step.icon}
                  </div>
                </div>
                <h3 className="text-[#3D2E24] font-serif text-xl uppercase tracking-widest mb-6 px-4">
                  {step.title}
                </h3>
                <p className="text-[#8E8E93] text-sm font-light leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. EXPERIÊNCIA DA LISTA */}
      <section className="bg-white py-32 md:py-48 px-6 overflow-hidden">
        <div className="max-w-[1400px] mx-auto space-y-32 md:space-y-64">
          
          {/* Block 1 */}
          <div className="flex flex-col md:flex-row items-center gap-16 md:gap-32">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-full md:w-1/2 aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <img src={EXPERIENCE_IMAGE} alt="Organização da lista" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full md:w-1/2 space-y-8"
            >
              <span className="text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.5em]">Curadoria Digital</span>
              <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-8xl leading-none">Organize seus desejos com elegância</h2>
              <p className="text-[#8E8E93] text-lg font-light leading-relaxed max-w-lg">
                Nossa interface foi pensada para ser tão bela quanto os produtos que você escolhe. Visualize sua lista, organize por prioridade e veja o carinho dos seus convidados se transformar em mimos reais.
              </p>
            </motion.div>
          </div>

          {/* Block 2 */}
          <div className="flex flex-col md:flex-row-reverse items-center gap-16 md:gap-32">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="w-full md:w-1/2 aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl"
            >
              <img src={CELEBRATION_IMAGE} alt="Compartilhamento e celebração" className="w-full h-full object-cover" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="w-full md:w-1/2 space-y-8 text-center md:text-left"
            >
              <span className="text-[#CCA062] text-[10px] font-bold uppercase tracking-[0.5em]">Conexão Real</span>
              <h2 className="text-[#3D2E24] font-mea-culpa text-6xl md:text-8xl leading-none">Compartilhe a alegria de presentear</h2>
              <p className="text-[#8E8E93] text-lg font-light leading-relaxed max-w-lg mx-auto md:mx-0">
                Facilite a escolha de quem te ama. Seus convidados acessam uma página exclusiva, escolhem os produtos e podem até deixar mensagens personalizadas. Uma ponte de afeto em cada presente.
              </p>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 4. PERGUNTAS FREQUENTES (FAQ) */}
      <section className="py-32 md:py-48 px-6 bg-[#FCFAF7]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-24">
            <Sparkles className="w-10 h-10 text-[#CCA062]/30 mx-auto mb-8" />
            <h2 className="text-[#3D2E24] font-serif text-3xl md:text-4xl uppercase tracking-[0.2em]">
              Dúvidas Frequentes
            </h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* Continue Exploring Section */}
      <ContinueExploring currentPath="/comofunciona-lp" />

      {/* 5. CTA FINAL */}
      <section className="py-32 md:py-48 px-6 bg-white text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E8DCC8]/20 rounded-full blur-[120px] -z-10" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <Heart className="w-8 h-8 text-[#6D0D0D]/20 mx-auto mb-8" />
          <h2 className="text-[#3D2E24] font-mea-culpa text-7xl md:text-9xl mb-10">
            Crie sua lista e compartilhe momentos especiais
          </h2>
          <p className="text-[#8E8E93] text-sm md:text-base font-light tracking-[0.2em] mb-12 uppercase leading-relaxed max-w-lg mx-auto">
            Comece agora a organizar seu evento e proporcione uma experiência única para seus convidados.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/listapresentes')}
            className="bg-[#3D2E24] text-white px-12 py-5 rounded-full text-[10px] uppercase tracking-[0.4em] font-bold shadow-2xl hover:bg-black transition-all"
          >
            Criar minha lista
          </motion.button>
        </motion.div>
      </section>

      {/* Decorative Footer */}
      <div className="pb-16 bg-white flex flex-col items-center gap-8">
        <div className="w-[1px] h-16 bg-gradient-to-b from-[#CCA062]/40 to-transparent" />
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#CCA062]/60 font-bold italic">
          Feito com mãos e coração
        </span>
      </div>

    </div>
  );
};
