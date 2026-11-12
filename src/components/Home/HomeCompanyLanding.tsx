import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Layers, 
  PenTool, 
  Gift, 
  Heart, 
  MessageSquareHeart, 
  ShieldCheck, 
  Star, 
  CheckCircle2
} from 'lucide-react';
import { SiteSettings } from '../../types';

// Imagens editoriais refinadas
const PALLYRA_IMAGE = "/src/assets/images/pallyra_editorial_1784213505525.jpg";
const MIMADA_IMAGE = "/src/assets/images/mimada_editorial_1784213531490.jpg";
const TUTTY_IMAGE = "/src/assets/images/tuttymimo_editorial_1784213576844.jpg";
const GUENNITA_IMAGE = "/src/assets/images/guennita_editorial_1784213518263.jpg";
const JULIA_PHOTO = "/src/assets/images/julia_profile_1782445376350.jpg";
const GIFT_LIST_IMAGE = "/src/assets/images/gift_list_experience_editorial_1784215302735.jpg";

interface HomeCompanyLandingProps {
  customSettings?: Record<string, SiteSettings | null>;
}

/**
 * Componente: HomeCompanyLanding
 * Landing page comercial contínua, limpa e editorial para a aba "HOME".
 */
export const HomeCompanyLanding: React.FC<HomeCompanyLandingProps> = () => {
  const navigate = useNavigate();

  const linesOfCreation = [
    {
      id: 'papelaria',
      name: 'Papelaria Nobre & Encadernação',
      route: '/loja?category=Papelaria',
      image: PALLYRA_IMAGE,
      description: 'Encadernação manual, álbuns de linho, agendas com gravação em hot stamping e cadernos afetivos criados para registrar histórias memoráveis.',
      highlights: ['Hot Stamping & Monogramas', 'Papéis de Alta Gramatura', 'Costura Manual Exclusiva']
    },
    {
      id: 'lembrancas',
      name: 'Lembranças & Aromas Afetivos',
      route: '/loja',
      image: MIMADA_IMAGE,
      description: 'Lembrancinhas refinadas e presentes aromáticos para casamentos, batizados, aniversários e celebrações inesquecíveis.',
      highlights: ['Aromas Exclusivos', 'Tags Personalizadas', 'Embalagens Presenteáveis']
    },
    {
      id: 'caixas',
      name: 'Caixas Cartonadas de Luxo',
      route: '/loja',
      image: GUENNITA_IMAGE,
      description: 'Caixas rígidas forradas em tecidos nobres, arranjos de flores preservadas e composições de luxo para eternizar momentos especiais.',
      highlights: ['Caixas Rígidas Revestidas', 'Flores Preservadas', 'Fechamentos em Fita de Seda']
    },
    {
      id: 'maternidade',
      name: 'Maternidade & Primeira Infância',
      route: '/loja',
      image: TUTTY_IMAGE,
      description: 'Peças delicadas para acolher a chegada de uma nova vida. Enxovais personalizados, lembranças de nascimento e álbuns do bebê.',
      highlights: ['Tons Pastéis & Bordados', 'Itens Delicados para Bebês', 'Memórias do Primeiro Ano']
    }
  ];

  const feedbackTestimonials = [
    {
      name: "Dra. Beatriz Albuquerque",
      city: "São Paulo, SP",
      occasion: "Presente de Casamento",
      quote: "Receber a encomenda da Madrinha foi uma experiência sensorial. A caixa perfumada, a caligrafia com os nomes e o cuidado com cada milímetro... Indescritível.",
      rating: 5
    },
    {
      name: "Mariana & Thiago",
      city: "Curitiba, PR",
      occasion: "Lista de Presentes & Padrinhos",
      quote: "Nossa lista de presentes e as caixas dos padrinhos foram o ponto alto do casamento. Todos os convidados elogiaram a qualidade e a sofisticação das peças.",
      rating: 5
    },
    {
      name: "Fernanda Castilho",
      city: "Belo Horizonte, MG",
      occasion: "Kit Maternidade Sob Medida",
      quote: "O álbum e as lembrancinhas de maternidade da Madrinha superaram todas as expectativas. É arte pura feita com amor.",
      rating: 5
    }
  ];

  return (
    <div className="w-full text-[#1B2537] space-y-16 sm:space-y-24 py-8 sm:py-12 select-none overflow-x-hidden">
      
      {/* 
        ========================================================================
        FAIXA 1: LINHAS DE CRIAÇÃO DA MADRINHA DOS PERSONALIZADOS
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block mb-3 border border-[#0F2C59]/10">
            Especialidades Artesanais
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight">
            Nossas Linhas de Criação
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5568] mt-2 font-light">
            Especialidades artesanais criadas para emocionar em cada detalhe
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {linesOfCreation.map((line) => (
            <div
              key={line.id}
              onClick={() => navigate(line.route)}
              className="group flex flex-col justify-between rounded-3xl bg-white border border-[#E8E2D5] hover:border-[#D4AF37] p-6 sm:p-7 shadow-[0_4px_24px_rgba(15,44,89,0.03)] hover:shadow-[0_12px_36px_rgba(15,44,89,0.08)] transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-4">
                {/* Frame com foto editorial */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E8E2D5] relative">
                  <img
                    src={line.image}
                    alt={line.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <h3 className="text-2xl sm:text-3xl font-mea-culpa text-[#0F2C59] group-hover:text-[#D4AF37] transition-colors">
                    {line.name}
                  </h3>
                  <p className="text-xs text-[#4A5568] font-light leading-relaxed">
                    {line.description}
                  </p>
                </div>

                {/* Destaques */}
                <div className="pt-3 border-t border-[#E8E2D5]/60 space-y-1.5 text-left">
                  {line.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-[#2C3E50]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-[#E8E2D5]/60 flex items-center justify-between text-[#0F2C59] group-hover:text-[#D4AF37] font-bold text-xs uppercase tracking-wider">
                <span>Ver na Loja</span>
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 2: MONTE SEU KIT (EXPERIÊNCIA INTERATIVA & CURADORIA)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-white via-[#FAF8F5] to-white border border-[#E8E2D5] text-[#1B2537] p-8 sm:p-12 md:p-16 relative overflow-hidden shadow-[0_4px_30px_rgba(15,44,89,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block border border-[#0F2C59]/10">
                Curadoria Sob Medida
              </span>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight leading-snug">
                Monte Seu Kit Exclusivo
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#4A5568] font-light leading-relaxed max-w-2xl">
                Você escolhe a caixa cartonada de luxo, combina itens de papelaria fina, lembranças perfumadas e mimos delicados da Madrinha dos Personalizados. Nossa equipe cuida de toda a harmonização visual, laços e personalização.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/monte-seu-kit')}
                  className="px-8 py-4 rounded-full bg-[#0F2C59] hover:bg-[#081220] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:scale-105 cursor-pointer flex items-center gap-2.5"
                >
                  <span>Iniciar Montagem Interativa</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
                <button
                  onClick={() => navigate('/kits')}
                  className="px-7 py-4 rounded-full bg-white hover:bg-[#FAF8F5] text-[#1B2537] border border-[#E8E2D5] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Ver Kits Prontos
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-square rounded-3xl border border-[#D4AF37]/40 bg-white p-3 shadow-[0_8px_30px_rgba(15,44,89,0.06)] relative group">
                <img
                  src="/src/assets/images/final_kit_celebration_1784214717534.jpg"
                  alt="Kit Personalizado Celebrativo"
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 3: PERSONALIZE (ARTE, GRAVAÇÃO & APROVAÇÃO PRÉVIA)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="rounded-3xl bg-white border border-[#E8E2D5] p-8 sm:p-12 md:p-16 shadow-[0_4px_30px_rgba(15,44,89,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[4/5] rounded-3xl border border-[#D4AF37]/40 bg-[#FAF8F5] p-3 shadow-[0_8px_30px_rgba(15,44,89,0.06)] relative">
                <img
                  src="/src/assets/images/mug_after_personalized_1788055350285.jpg"
                  alt="Personalização Nobre"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block border border-[#0F2C59]/10">
                Garantia de Perfeição
              </span>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight leading-snug">
                Personalização de Alto Padrão
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#4A5568] font-light leading-relaxed max-w-2xl">
                Nenhum produto sai do ateliê sem antes ser aprovado por você. Elaboramos a prova digital da arte com caligrafia artística, monogramas, florais e mensagens para garantir que tudo fique exatamente como sonhado.
              </p>

              <div className="space-y-3 pt-2 text-xs sm:text-sm text-[#1B2537]">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Gravação a laser permanente em madeira, couro e inox</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Hot Stamping dourado e prateado em papéis de alta gramatura</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Envio de layout digital pelo WhatsApp antes da confecção</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate('/personalize')}
                  className="px-8 py-4 rounded-full bg-[#FAF8F5] hover:bg-[#0F2C59] text-[#0F2C59] hover:text-white border border-[#D4AF37] text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-xs cursor-pointer inline-flex items-center gap-2.5"
                >
                  <span>Ver Galeria de Personalizações</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 4: SOBRE NÓS (ESSÊNCIA ARTESANAL & HISTÓRIA)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="rounded-3xl bg-gradient-to-b from-[#FAF8F5] to-white border border-[#E8E2D5] p-8 sm:p-12 md:p-16 relative shadow-[0_4px_30px_rgba(15,44,89,0.03)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
            
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#D4AF37]/50 bg-white p-2.5 shadow-xl group">
                <img
                  src={JULIA_PHOTO}
                  alt="Júlia Aleixo"
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <div className="md:col-span-7 space-y-5 text-center md:text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block border border-[#0F2C59]/10">
                Nossa Essência
              </span>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight leading-snug">
                Por Trás da Madrinha
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#4A5568] font-light leading-relaxed italic">
                "A Madrinha nasceu do desejo de desacelerar o mundo através de peças feitas à mão, com calma, intenção e perfeição estética. Cada laço, cada fragrância e cada costura têm um único propósito: fazer quem recebe se sentir profundamente amado."
              </p>

              <div className="pt-2 flex flex-col items-center md:items-start space-y-1">
                <span className="font-meaculpa text-4xl sm:text-5xl text-[#D4AF37]" style={{ fontFamily: "'Mea Culpa', cursive" }}>
                  Júlia Aleixo
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#4A5568] font-semibold">Fundadora & Designer Criativa</span>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate('/sobrenos')}
                  className="px-8 py-4 rounded-full bg-white hover:bg-[#0F2C59] text-[#1B2537] hover:text-white border border-[#D4AF37]/60 text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5 shadow-xs"
                >
                  <span>Conhecer Nossa História</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 5: FEEDBACK / DEPOIMENTOS (PROVA SOCIAL)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block mb-3 border border-[#0F2C59]/10">
            Experiências Reais
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight">
            Amor em Forma de Depoimentos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedbackTestimonials.map((fb, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E8E2D5] rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_4px_20px_rgba(15,44,89,0.02)] flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(fb.rating)].map((_, i) => (
                    <Star key={i} size={15} fill="#D4AF37" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#4A5568] font-light italic leading-relaxed">
                  "{fb.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#F5EFEE] flex flex-col">
                <span className="text-xs font-bold text-[#1B2537]">{fb.name}</span>
                <span className="text-[10px] text-[#4A5568] uppercase tracking-wider">{fb.occasion} • {fb.city}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => navigate('/feedclientes')}
            className="px-8 py-4 rounded-full bg-white hover:bg-[#0F2C59] text-[#1B2537] hover:text-white border border-[#D4AF37]/60 text-xs font-bold tracking-widest uppercase transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5 shadow-xs"
          >
            <span>Ver Todos os Depoimentos</span>
            <ArrowRight size={14} className="text-[#D4AF37]" />
          </button>
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 6: LISTA DE PRESENTES (CONSULTORIA & EVENTOS)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6">
        <div className="rounded-3xl bg-white border border-[#E8E2D5] p-8 sm:p-12 md:p-16 shadow-[0_4px_30px_rgba(15,44,89,0.03)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-5 text-left">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-3.5 py-1 rounded-full inline-block border border-[#0F2C59]/10">
                Eventos & Celebrações
              </span>

              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#0F2C59] tracking-tight leading-snug">
                Lista de Presentes Afetiva
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#4A5568] font-light leading-relaxed max-w-2xl">
                Crie uma lista de presentes personalizada com itens artesanais da Madrinha dos Personalizados. Seus convidados escolhem e compram online com facilidade, e você recebe tudo embalado com elegância no conforto da sua casa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="flex items-center gap-3 text-xs text-[#1B2537]">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>100% gratuita para criar e compartilhar</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#1B2537]">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Painel de controle com mensagens dos convidados</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#1B2537]">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Entrega unificada com seguro em todo o Brasil</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#1B2537]">
                  <CheckCircle2 size={16} className="text-[#D4AF37] shrink-0" />
                  <span>Validade estendida para até 60 dias pós-evento</span>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/listadepresentes')}
                  className="px-8 py-4 rounded-full bg-[#0F2C59] hover:bg-[#081220] text-white font-bold text-xs uppercase tracking-widest transition-all duration-300 shadow-md hover:scale-105 cursor-pointer flex items-center gap-2.5"
                >
                  <span>Criar ou Consultar Lista</span>
                  <ArrowRight size={14} className="text-[#D4AF37]" />
                </button>
                <button
                  onClick={() => navigate('/comofunciona-lp')}
                  className="px-7 py-4 rounded-full bg-white hover:bg-[#FAF8F5] text-[#1B2537] border border-[#E8E2D5] text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Como Funciona a Lista
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-square rounded-3xl border border-[#D4AF37]/40 bg-[#FAF8F5] p-3 shadow-[0_8px_30px_rgba(15,44,89,0.06)]">
                <img
                  src={GIFT_LIST_IMAGE}
                  alt="Lista de Presentes Afetiva"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
};
