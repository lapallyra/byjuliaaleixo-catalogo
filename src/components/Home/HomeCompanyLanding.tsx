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
 * Landing page limpa, direta e ultra elegante para a aba "HOME".
 * Sem mini títulos em caixa alta e sem legendas dispensáveis: design limpo e refinado.
 */
export const HomeCompanyLanding: React.FC<HomeCompanyLandingProps> = () => {
  const navigate = useNavigate();

  const ateliers = [
    {
      id: 'pallyra',
      name: 'La Pallyra',
      route: '/lapallyra',
      image: PALLYRA_IMAGE,
      description: 'Encadernação manual, álbuns de linho, agendas com gravação em hot stamping e cadernos afetivos criados para registrar histórias memoráveis.',
      highlights: ['Hot Stamping & Monogramas', 'Papéis de Alta Gramatura', 'Costura Manual Exclusiva']
    },
    {
      id: 'mimada',
      name: 'Mimada Sim',
      route: '/mimadasim',
      image: MIMADA_IMAGE,
      description: 'Lembrancinhas refinadas e presentes para casamentos, batizados, aniversários e eventos corporativos de alto padrão.',
      highlights: ['Aromas Exclusivos', 'Tags Personalizadas', 'Embalagens Presenteáveis']
    },
    {
      id: 'guennita',
      name: 'com amor, Guennita',
      route: '/comamorguennita',
      image: GUENNITA_IMAGE,
      description: 'Caixas rígidas forradas em tecidos nobres, arranjos de flores preservadas e composições de luxo para eternizar momentos especiais.',
      highlights: ['Caixas Rígidas Revestidas', 'Flores Preservadas', 'Fechamentos em Fita de Seda']
    },
    {
      id: 'tuttymimo',
      name: 'Tutty Mimo',
      route: '/tuttymimo',
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
      quote: "O álbum e as lembrancinhas de maternidade do Tutty Mimo superaram todas as expectativas. É arte pura feita com amor.",
      rating: 5
    }
  ];

  return (
    <div className="w-full text-[#2C1810] space-y-12 sm:space-y-16 py-6 sm:py-8 select-none overflow-x-hidden">
      
      {/* 
        ========================================================================
        FAIXA 1: OS 4 ATELIÊS / UNIVERSOS DE CRIAÇÃO
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight">
            Os Quatro Ateliês
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {ateliers.map((atelier) => (
            <div
              key={atelier.id}
              onClick={() => navigate(atelier.route)}
              className="group flex flex-col justify-between rounded-3xl bg-[#FAF7F2] border border-[#E8DFC8] hover:border-[#D4AF37] p-5 sm:p-6 shadow-[0_4px_20px_rgba(179,143,77,0.06)] hover:shadow-[0_12px_36px_rgba(179,143,77,0.12)] transition-all duration-300 cursor-pointer"
            >
              <div className="space-y-3.5">
                {/* Frame com foto editorial */}
                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-[#F0EBE1] relative">
                  <img
                    src={atelier.image}
                    alt={atelier.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="space-y-1 text-left">
                  <h3 className="text-2xl sm:text-3xl font-mea-culpa text-[#2C1810] group-hover:text-[#8C6D37] transition-colors">
                    {atelier.name}
                  </h3>
                  <p className="text-xs text-[#593E32] font-light leading-relaxed pt-1">
                    {atelier.description}
                  </p>
                </div>

                {/* Destaques */}
                <div className="pt-2 border-t border-[#E8DFC8]/60 space-y-1 text-left">
                  {atelier.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#4A332A]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B38F4D] shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#E8DFC8]/60 flex items-center justify-between text-[#8C6D37] group-hover:text-[#2C1810] font-semibold text-xs">
                <span>Conhecer Catálogo</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 2: MONTE SEU KIT (EXPERIÊNCIA INTERATIVA & CURADORIA - CLEAN & ELEGANTE)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="rounded-3xl bg-[#FAF7F2] border border-[#E8DFC8] text-[#2C1810] p-6 sm:p-10 md:p-12 lg:p-14 relative overflow-hidden shadow-[0_4px_24px_rgba(179,143,77,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-4 text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight leading-snug">
                Monte Seu Kit Exclusivo
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#593E32] font-light leading-relaxed max-w-2xl">
                Você escolhe a caixa cartonada de luxo, combina itens de papelaria fina, lembranças perfumadas e mimos delicados de qualquer um dos quatro ateliês. Nossa equipe cuida de toda a harmonização visual, laços e personalização.
              </p>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/comomontar')}
                  className="px-8 py-3.5 rounded-full bg-[#FAF7F2] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#D4AF37] font-semibold text-xs uppercase tracking-wider transition-all duration-200 shadow-xs hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <span>Iniciar Montagem Interativa</span>
                  <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate('/kits')}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#593E32] hover:text-[#2C1810] border border-[#E8DFC8] text-xs font-medium tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Ver Kits Prontos
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-square rounded-3xl border border-[#D4AF37]/40 bg-white p-2.5 shadow-[0_8px_30px_rgba(179,143,77,0.1)] relative group">
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
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="rounded-3xl bg-[#FAF7F2] border border-[#D4AF37]/35 p-6 sm:p-10 md:p-12 lg:p-14 shadow-[0_4px_24px_rgba(179,143,77,0.06)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-5 order-2 lg:order-1 flex justify-center">
              <div className="w-full max-w-[340px] aspect-[4/5] rounded-3xl border border-[#D4AF37]/40 bg-white p-2.5 shadow-[0_8px_30px_rgba(179,143,77,0.1)] relative">
                <img
                  src="/src/assets/images/mug_after_personalized_1788055350285.jpg"
                  alt="Personalização Nobre"
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>

            <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight leading-snug">
                Personalização de Alto Padrão
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#593E32] font-light leading-relaxed max-w-2xl">
                Nenhum produto sai do ateliê sem antes ser aprovado por você. Elaboramos a prova digital da arte com caligrafia artística, monogramas, florais e mensagens para garantir que tudo fique exatamente como sonhado.
              </p>

              <div className="space-y-2 pt-2 text-xs sm:text-sm text-[#3D261C]">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-[#B38F4D] shrink-0" />
                  <span>Gravação a laser permanente em madeira, couro e inox</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-[#B38F4D] shrink-0" />
                  <span>Hot Stamping dourado e prateado em papéis de alta gramatura</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 size={15} className="text-[#B38F4D] shrink-0" />
                  <span>Envio de layout digital pelo WhatsApp antes da confecção</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => navigate('/personalize')}
                  className="px-8 py-3.5 rounded-full bg-[#FAF7F2] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#D4AF37] text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-xs hover:shadow-sm cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Ver Galeria de Personalizações</span>
                  <ArrowRight size={13} className="text-[#8C6D37]" />
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
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="rounded-3xl bg-[#F9F7F2] border border-[#E8DFC8]/70 p-6 sm:p-10 md:p-12 lg:p-14 relative shadow-[0_4px_30px_rgba(179,143,77,0.04)]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center">
            
            <div className="md:col-span-5 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/5] rounded-3xl overflow-hidden border border-[#D4AF37]/45 bg-white p-2 shadow-xl group">
                <img
                  src={JULIA_PHOTO}
                  alt="Júlia Aleixo"
                  className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <div className="md:col-span-7 space-y-4 text-center md:text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight leading-snug">
                Por Trás da Madrinha
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#4A332A] font-light leading-relaxed">
                "A Madrinha nasceu do desejo de desacelerar o mundo através de peças feitas à mão, com calma, intenção e perfeição estética. Cada laço, cada fragrância e cada costura têm um único propósito: fazer quem recebe se sentir profundamente amado."
              </p>

              <div className="pt-1 flex flex-col items-center md:items-start space-y-1">
                <span className="font-meaculpa text-4xl sm:text-5xl text-[#8C6D37]" style={{ fontFamily: "'Mea Culpa', cursive" }}>
                  Júlia Aleixo
                </span>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => navigate('/sobrenos')}
                  className="px-8 py-3.5 rounded-full bg-white hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#D4AF37]/50 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer inline-flex items-center gap-2 shadow-2xs"
                >
                  <span>Conhecer Nossa História</span>
                  <ArrowRight size={13} />
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
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="text-center max-w-3xl mx-auto mb-8 sm:mb-10">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight">
            Amor em Forma de Depoimentos
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {feedbackTestimonials.map((fb, idx) => (
            <div
              key={idx}
              className="bg-[#FFFFFF] border border-[#E8DFC8] rounded-3xl p-6 sm:p-8 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(fb.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="#D4AF37" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#4A332A] font-light italic leading-relaxed">
                  "{fb.quote}"
                </p>
              </div>

              <div className="pt-4 border-t border-[#F0EBE1] flex flex-col">
                <span className="text-xs font-bold text-[#2C1810]">{fb.name}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex justify-center">
          <button
            onClick={() => navigate('/feedclientes')}
            className="px-7 py-3 rounded-full bg-[#FAF7F2] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#D4AF37]/50 text-xs font-semibold tracking-wider uppercase transition-all duration-200 cursor-pointer inline-flex items-center gap-2"
          >
            <span>Ver Todos os Depoimentos</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* 
        ========================================================================
        FAIXA 6: LISTA DE PRESENTES (CONSULTORIA & EVENTOS)
        ========================================================================
      */}
      <section className="w-full max-w-[1850px] mx-auto px-2 sm:px-3 md:px-4">
        <div className="rounded-3xl bg-[#FAF7F2] border border-[#D4AF37]/35 p-6 sm:p-10 md:p-12 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
            
            <div className="lg:col-span-7 space-y-4 text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight leading-snug">
                Lista de Presentes Afetiva
              </h2>

              <p className="text-xs sm:text-sm md:text-base text-[#593E32] font-light leading-relaxed max-w-2xl">
                Crie uma lista de presentes personalizada com itens artesanais dos quatro ateliês. Seus convidados escolhem e compram online com facilidade, e você recebe tudo embalado com elegância no conforto da sua casa.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs text-[#3D261C]">
                  <CheckCircle2 size={14} className="text-[#B38F4D] shrink-0" />
                  <span>100% gratuita para criar e compartilhar</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#3D261C]">
                  <CheckCircle2 size={14} className="text-[#B38F4D] shrink-0" />
                  <span>Painel de controle com mensagens dos convidados</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#3D261C]">
                  <CheckCircle2 size={14} className="text-[#B38F4D] shrink-0" />
                  <span>Entrega unificada com seguro em todo o Brasil</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#3D261C]">
                  <CheckCircle2 size={14} className="text-[#B38F4D] shrink-0" />
                  <span>Validade estendida para até 60 dias pós-evento</span>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/listadepresentes')}
                  className="px-8 py-3.5 rounded-full bg-[#FAF7F2] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#D4AF37] text-xs font-semibold uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Criar ou Consultar Lista</span>
                  <ArrowRight size={13} className="text-[#8C6D37]" />
                </button>
                <button
                  onClick={() => navigate('/comofunciona-lp')}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FAF7F2] text-[#2C1810] border border-[#E8DFC8] text-xs font-semibold tracking-wider uppercase transition-colors cursor-pointer"
                >
                  Como Funciona a Lista
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-[340px] aspect-square rounded-3xl border border-[#D4AF37]/40 bg-white p-2.5 shadow-[0_8px_30px_rgba(179,143,77,0.1)]">
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
