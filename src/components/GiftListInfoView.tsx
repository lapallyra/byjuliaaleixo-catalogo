import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Gift, Search, PlusCircle, CheckCircle, Clock, Heart, 
  Share2, Sparkles, HelpCircle, ShieldCheck, X, ChevronDown, Smile,
  ChevronRight, Calendar, MessageSquare, Award
} from 'lucide-react';
import { getGiftList } from '../services/firebaseService';

export const GiftListInfoView: React.FC = () => {
  const navigate = useNavigate();
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [listCodeInput, setListCodeInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSearchCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = listCodeInput.trim().toUpperCase();
    if (!code) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      const fetchedList = await getGiftList(code);
      if (fetchedList) {
        setIsSearchModalOpen(false);
        setListCodeInput('');
        navigate(`/consulta/${fetchedList.code}`);
      } else {
        setSearchError('Lista não encontrada. Verifique o código e tente novamente.');
      }
    } catch (err) {
      console.error(err);
      setSearchError('Erro ao buscar a lista. Verifique sua conexão.');
    } finally {
      setIsSearching(false);
    }
  };

  const faqData = [
    {
      question: 'Como os convidados compram os presentes?',
      answer: 'Eles acessam a nossa página de consulta por meio do código ou link que você compartilha. Lá, selecionam o presente desejado, colocam na sacola e finalizam a compra online normalmente.'
    },
    {
      question: 'A criação de lista de presentes possui algum custo?',
      answer: 'Nenhum! Criar, personalizar e divulgar sua lista de presentes é um serviço 100% gratuito que oferecemos para tornar seus momentos ainda mais inesquecíveis.'
    },
    {
      question: 'Qual o prazo de validade de uma lista?',
      answer: 'As listas de presentes permanecem ativas em nossa plataforma por até 60 dias após a data do evento cadastrada.'
    },
    {
      question: 'Como sei quem comprou cada presente?',
      answer: 'Você terá acesso total a um painel de controle administrativo onde poderá ver em tempo real quais itens foram presenteados, quem comprou e ler as mensagens especiais enviadas para você.'
    },
    {
      question: 'Posso adicionar mimos de ateliês diferentes?',
      answer: 'Sim! Esse é o nosso maior diferencial. Você pode navegar pelos quatro catálogos exclusivos (La Pallyra, Guennita, Mimada Sim e Tutty Mimo) e adicionar mimos de todos eles na mesma lista unificada.'
    }
  ];

  return (
    <div className="bg-[#FDFCFA] min-h-screen text-slate-800 font-sans selection:bg-[#E8DFC8] selection:text-[#2C1810] overflow-x-hidden">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#FAF6F0]/60 via-[#FDFCFA] to-transparent pointer-events-none -z-10" />
      
      <div className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 py-8 sm:py-12">
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center mx-auto mb-6 border border-pink-200/50 shadow-sm"
          >
            <Gift size={28} strokeWidth={1.5} className="animate-pulse" />
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="font-mea-culpa text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 tracking-tight leading-tight mb-6"
          >
            Sua Lista de Presentes <br />
            <span className="text-pink-600 font-mea-culpa">com afeto e sofisticação</span>
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto mb-10"
          >
            Reúna mimos apaixonantes de nossos quatro ateliês exclusivos em uma única página personalizada. Facilite a escolha de quem ama você com um sistema seguro e elegante.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-widest px-8 py-4.5 rounded-full shadow-lg shadow-pink-100 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              Criar Minha Lista
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full sm:w-auto bg-white border border-pink-200 hover:border-pink-400 text-pink-600 hover:text-pink-700 font-bold text-xs uppercase tracking-widest px-8 py-4.5 rounded-full transition-all hover:bg-pink-50/30 cursor-pointer"
            >
              Consultar Lista
            </button>
          </motion.div>
        </div>

        {/* CONCEPT EXPLANATION */}
        <section className="mb-24 py-16 border-t border-b border-pink-100/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-pink-50/20 to-transparent rounded-bl-full pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100/30 inline-block">
                O que é?
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-slate-900 leading-tight">
                Um espaço único para guiar quem deseja lhe presentear
              </h2>
              <p className="text-slate-600 leading-relaxed text-sm">
                A nossa Lista de Presentes unifica o melhor do artesanato e mimos refinados. Você navega livremente pelos catálogos das marcas parceiras, seleciona os itens que completam seu sonho e compartilha com seus convidados.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm font-medium">
                Tudo de forma simples, sem repetições de presentes e com total controle sobre o que você irá receber.
              </p>
            </div>
 
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white border border-pink-100/40 p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 shadow-xs">
                  <Award size={20} />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Curadoria Premium</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Acesso aos catálogos de marcas seletas: La Pallyra, Guennita, Mimada Sim e Tutty Mimo.
                </p>
              </div>
 
              <div className="bg-white border border-pink-100/40 p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 shadow-xs">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Segurança Total</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Garantia de que nenhum presente será comprado in duplicidade graças ao nosso sistema de reservas.
                </p>
              </div>
 
              <div className="bg-white border border-pink-100/40 p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 shadow-xs">
                  <MessageSquare size={20} />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Mensagens Especiais</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Seus convidados podem enviar votos e recados repletos de carinho anexados ao presente.
                </p>
              </div>
 
              <div className="bg-white border border-pink-100/40 p-6 rounded-3xl space-y-3 shadow-xs">
                <div className="w-10 h-10 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-600 border border-pink-100 shadow-xs">
                  <Calendar size={20} />
                </div>
                <h4 className="font-bold text-sm text-slate-900">Gestão Descomplicada</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Acompanhe e administre o status de cada item da sua lista em tempo real a partir de qualquer dispositivo.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STEP BY STEP (ILLUSTRATED) */}
        <section className="mb-28 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100/30 inline-block mb-4">
            Simplicidade
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-16">
            Como funciona passo a passo
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Steps connectors for desktop */}
            <div className="hidden md:block absolute top-16 left-[22%] right-[22%] h-[1px] border-t border-dashed border-pink-200 -z-10" />

            <div className="bg-white border border-pink-100/40 p-8 rounded-3xl space-y-5 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center text-sm font-bold mx-auto shadow-md">
                01
              </div>
              <h3 className="font-bold text-base text-slate-900">Escolha os Mimos</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Navegue pelas lojas, clique no botão de presente nos itens ou kits desejados para adicioná-los à sua Lista de Presentes.
              </p>
            </div>

            <div className="bg-white border border-pink-100/40 p-8 rounded-3xl space-y-5 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center text-sm font-bold mx-auto shadow-md">
                02
              </div>
              <h3 className="font-bold text-base text-slate-900">Preencha os Dados</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                No painel da sua lista, digite o nome do homenageado, tipo de evento, data e uma bela mensagem de agradecimento.
              </p>
            </div>

            <div className="bg-white border border-pink-100/40 p-8 rounded-3xl space-y-5 shadow-sm transition-transform hover:-translate-y-1">
              <div className="w-12 h-12 rounded-full bg-pink-600 text-white flex items-center justify-center text-sm font-bold mx-auto shadow-md">
                03
              </div>
              <h3 className="font-bold text-base text-slate-900">Compartilhe o Código</h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
                Gere a sua lista e envie o link direto ou código unificado aos convidados. Eles compram de forma prática e 100% online.
              </p>
            </div>
          </div>
        </section>

        {/* DETAILED ADVANTAGES (SIDE-BY-SIDE) */}
        <section className="mb-28 grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* ADVANTAGES FOR CREATORS */}
          <div className="bg-gradient-to-b from-white to-[#FFFDFE] border border-pink-100/50 rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-pink-600">Para os Anfitriões</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-slate-900">Vantagens ao criar sua lista</h3>
            </div>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Sem presentes repetidos</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Nosso sistema atualiza instantaneamente as compras e reservas, de modo que os convidados visualizam apenas os mimos ainda disponíveis.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Flexibilidade para trocar</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Você pode optar por receber os mimos físicos ou convertê-los em créditos para utilizar como preferir nos ateliês parceiros.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Visualização centralizada</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Não fique na dúvida: acompanhe em uma única tela quem enviou cada presente e acesse todas as mensagens de carinho enviadas.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* ADVANTAGES FOR GIFTERS */}
          <div className="bg-gradient-to-b from-white to-[#FFFDFE] border border-pink-100/50 rounded-[2.5rem] p-8 sm:p-12 shadow-sm space-y-8">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-pink-600">Para os Convidados</span>
              <h3 className="font-serif text-2xl sm:text-3xl text-slate-900">Facilidade de presentear</h3>
            </div>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Acerto garantido</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Seus amigos e familiares presenteiam sabendo exatamente o que você deseja e de que precisa para a sua celebração.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Praticidade de pagamento</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Checkout premium integrado com Pix e cartão de crédito, permitindo comprar e enviar o presente em menos de um minuto.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle size={14} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Entrega direta e elegante</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    Cuidamos de tudo! Embrulho especial de presente e entrega direta no endereço cadastrado pelos anfitriões, sem preocupações.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* OCCASIONS EXAMPLES */}
        <section className="mb-28 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100/30 inline-block mb-4">
            Inspiração
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-slate-900 mb-14">
            Perfeito para todos os seus momentos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="bg-white border border-pink-100/30 p-8 rounded-3xl space-y-4">
              <span className="text-3xl">💍</span>
              <h3 className="font-bold text-sm text-slate-900">Casamentos & Noivados</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Celebre o início de uma bela jornada a dois escolhendo mimos eternos para o seu novo ciclo.
              </p>
            </div>

            <div className="bg-white border border-pink-100/30 p-8 rounded-3xl space-y-4">
              <span className="text-3xl">🏡</span>
              <h3 className="font-bold text-sm text-slate-900">Chá de Casa Nova</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Vesta o seu novo lar com afeto, elegância e detalhes artesanais cheios de charme.
              </p>
            </div>

            <div className="bg-white border border-pink-100/30 p-8 rounded-3xl space-y-4">
              <span className="text-3xl">👶</span>
              <h3 className="font-bold text-sm text-slate-900">Maternidade & Chás</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Acolha a chegada de uma nova vida com mimos delicados e confortáveis feitos sob medida.
              </p>
            </div>

            <div className="bg-white border border-pink-100/30 p-8 rounded-3xl space-y-4">
              <Sparkles className="w-8 h-8 text-[#8C6D37]" />
              <h3 className="font-bold text-sm text-slate-900">Aniversários & Ciclos</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Marque datas especiais e conquistas marcantes recebendo mimos que traduzem o seu estilo.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ SECTION */}
        <section className="mb-28 max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-pink-500 bg-pink-50 px-3.5 py-1.5 rounded-full border border-pink-100/30 inline-block mb-4">
              Dúvidas
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-slate-900">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqData.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-white border border-pink-100/40 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 outline-none cursor-pointer"
                >
                  <span className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wider">{faq.question}</span>
                  <ChevronDown 
                    size={18} 
                    className={`text-pink-500 shrink-0 transition-transform duration-300 ${activeFaq === idx ? 'rotate-180' : ''}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-6 pt-1 text-xs text-slate-500 leading-relaxed border-t border-pink-50/50">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CALL TO ACTION */}
        <section className="text-center pt-12 border-t border-pink-100/50">
          <div className="flex items-center justify-center w-full max-w-xs mx-auto mb-6 gap-3">
            <div className="h-[1px] flex-1 border-t border-dashed border-pink-300/40" />
            <Heart size={14} fill="currentColor" className="text-pink-600" />
            <div className="h-[1px] flex-1 border-t border-dashed border-pink-300/40" />
          </div>
          <p className="font-serif italic text-2xl text-slate-800 mb-6">
            Eternize seus momentos felizes com mimos selecionados.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full shadow-md shadow-pink-100 transition-all cursor-pointer"
            >
              Criar minha lista agora
            </button>
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full sm:w-auto bg-white border border-pink-100 hover:border-pink-300 text-slate-600 font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all cursor-pointer"
            >
              Consultar uma lista
            </button>
          </div>
        </section>
      </div>

      {/* CONSULT / SEARCH DIALOG MODAL */}
      <AnimatePresence>
        {isSearchModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative border border-pink-100/30 text-center"
            >
              <button 
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setListCodeInput('');
                  setSearchError(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-pink-50/50 transition-all text-slate-400 hover:text-slate-700 outline-none cursor-pointer"
              >
                <X size={20} />
              </button>
              
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6 mx-auto border border-pink-100 shadow-sm">
                <Search size={24} />
              </div>
              
              <h3 className="font-serif text-2xl text-slate-900 mb-2">
                Consultar Lista de Presentes
              </h3>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-8 max-w-sm mx-auto">
                Insira o código exclusivo enviado pelo anfitrião para acessar a seleção especial de presentes e mimos.
              </p>
              
              <form onSubmit={handleSearchCode} className="space-y-4 text-left">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 pl-1">Código da Lista</label>
                  <input 
                    type="text"
                    required
                    value={listCodeInput}
                    onChange={(e) => {
                      setListCodeInput(e.target.value);
                      if (searchError) setSearchError(null);
                    }}
                    placeholder="Ex: GL1234..."
                    className="w-full bg-slate-50 border border-slate-100 focus:border-pink-500 focus:bg-white rounded-2xl px-5 py-4 text-sm font-bold uppercase tracking-widest outline-none transition-all placeholder:text-slate-300 shadow-inner"
                    autoFocus
                  />
                </div>

                {searchError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-semibold leading-relaxed border border-red-100/50 text-center"
                  >
                    {searchError}
                  </motion.div>
                )}
                
                <button
                  type="submit"
                  disabled={isSearching || !listCodeInput.trim()}
                  className="w-full py-4.5 bg-pink-600 text-white rounded-2xl text-xs font-bold uppercase tracking-[0.15em] hover:bg-pink-700 disabled:bg-slate-100 disabled:text-slate-300 transition-all flex items-center justify-center gap-3 shadow-md shadow-pink-100 cursor-pointer active:scale-[0.98]"
                >
                  {isSearching ? (
                    <Clock size={16} className="animate-spin" />
                  ) : (
                    <>
                      <Search size={16} />
                      Buscar Lista
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
