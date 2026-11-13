import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '../../types';

// Imagens editoriais refinadas
const JULIA_PHOTO = "/src/assets/images/julia_profile_1782445376350.jpg";
const GIFT_LIST_IMAGE = "/src/assets/images/gift_list_experience_editorial_1784215302735.jpg";

interface HomeCompanyLandingProps {
  customSettings?: Record<string, SiteSettings | null>;
}

/**
 * Componente: HomeCompanyLanding
 * Landing page comercial editorial, leve e contínua para a Home (`/`).
 */
export const HomeCompanyLanding: React.FC<HomeCompanyLandingProps> = () => {
  const navigate = useNavigate();

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
    <div className="w-full text-[#1B2537] select-none overflow-x-hidden">
      
      {/* 4A. SEÇÃO EDITORIAL 1 (TEXTO + IMAGEM): MONTE SEU KIT */}
      <section className="w-full bg-[linear-gradient(180deg,#FAF8F5_0%,rgba(244,237,225,0.48)_50%,#FAF8F5_100%)] px-4 sm:px-8 md:px-[2.5cm] py-12 sm:py-16">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div className="w-full lg:flex-1 space-y-5 text-left">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75">
              <span className="w-5 h-px bg-[#D4AF37]" />
              <span>Curadoria Sob Medida</span>
            </div>

            <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.65rem,3vw,2.8rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
              Monte Seu Kit Exclusivo
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#1B2537]/75 font-light leading-[1.85]">
              Você escolhe a caixa cartonada de luxo, combina itens de papelaria fina, lembranças perfumadas e mimos delicados da Madrinha dos Personalizados. Nossa equipe cuida de toda a harmonização visual, laços e personalização.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigate('/monte-seu-kit')}
                className="group px-6 py-3 rounded-full bg-[#D4AF37]/14 hover:bg-[#0F2C59] text-[#0F2C59] hover:text-[#FAF8F5] border border-[#D4AF37] font-semibold text-[10.5px] uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5"
              >
                <span>Iniciar Montagem Interativa</span>
                <ArrowRight size={13} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/kits')}
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#0F2C59] hover:text-[#D4AF37] underline underline-offset-4 decoration-[#D4AF37]/50 transition-colors cursor-pointer"
              >
                Ver Kits Prontos
              </button>
            </div>
          </div>

          <div className="shrink-0 flex justify-center">
            <div className="w-[260px] sm:w-[280px] p-[1.5px] rounded-3xl bg-[linear-gradient(145deg,rgba(212,175,55,0.42)_0%,rgba(250,248,245,0.65)_50%,rgba(212,175,55,0.30)_100%)] shadow-[0_6px_22px_rgba(15,44,89,0.03)] group">
              <div className="aspect-square w-full rounded-[22px] overflow-hidden bg-[#FAF8F5] relative">
                <img
                  src="/src/assets/images/final_kit_celebration_1784214717534.jpg"
                  alt="Kit Personalizado Celebrativo"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_24px_8px_rgba(250,248,245,0.75)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4B. SEÇÃO EDITORIAL 2 (IMAGEM + TEXTO): PERSONALIZAÇÃO DE ALTO PADRÃO */}
      <section className="w-full bg-[#FAF8F5] px-4 sm:px-8 md:px-[2.5cm] py-12 sm:py-16">
        <div className="w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div className="shrink-0 flex justify-center">
            <div className="w-[245px] sm:w-[265px] p-[1.5px] rounded-3xl bg-[linear-gradient(145deg,rgba(212,175,55,0.42)_0%,rgba(250,248,245,0.65)_50%,rgba(212,175,55,0.30)_100%)] shadow-[0_6px_22px_rgba(15,44,89,0.03)] group">
              <div className="aspect-[4/5] w-full rounded-[22px] overflow-hidden bg-[#FAF8F5] relative">
                <img
                  src="/src/assets/images/mug_after_personalized_1788055350285.jpg"
                  alt="Personalização Nobre"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_24px_8px_rgba(250,248,245,0.75)]"
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:flex-1 space-y-5 text-left">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75">
              <span className="w-5 h-px bg-[#D4AF37]" />
              <span>Garantia de Perfeição</span>
            </div>

            <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.5rem,2.7vw,2.55rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
              Personalização de Alto Padrão
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#1B2537]/75 font-light leading-[1.85]">
              Nenhum produto sai do ateliê sem antes ser aprovado por você. Elaboramos a prova digital da arte com caligrafia artística, monogramas, florais e mensagens para garantir que tudo fique exatamente como sonhado.
            </p>

            <div className="space-y-2.5 pt-1 text-xs sm:text-sm text-[#1B2537]/85">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Gravação a laser permanente em madeira, couro e inox</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Hot Stamping dourado e prateado em papéis de alta gramatura</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Envio de layout digital pelo WhatsApp antes da confecção</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/personalize')}
                className="group px-6 py-3 rounded-full bg-transparent hover:bg-[#D4AF37]/12 text-[#0F2C59] border border-[#D4AF37]/60 hover:border-[#D4AF37] text-[10.5px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5"
              >
                <span>Ver Galeria de Personalizações</span>
                <ArrowRight size={13} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4C. SEÇÃO EDITORIAL 3 (TEXTO + IMAGEM): POR TRÁS DA MADRINHA */}
      <section className="w-full bg-[linear-gradient(180deg,#FAF8F5_0%,rgba(244,237,225,0.48)_50%,#FAF8F5_100%)] px-4 sm:px-8 md:px-[2.5cm] py-12 sm:py-16">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div className="w-full lg:flex-1 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75">
              <span className="w-5 h-px bg-[#D4AF37]" />
              <span>Nossa Essência</span>
            </div>

            <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.7rem,3vw,2.8rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
              Por Trás da Madrinha
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#1B2537]/75 font-light leading-[1.85] italic mx-auto lg:mx-0">
              "A Madrinha nasceu do desejo de desacelerar o mundo através de peças feitas à mão, com calma, intenção e perfeição estética. Cada laço, cada fragrância e cada costura têm um único propósito: fazer quem recebe se sentir profundamente amado."
            </p>

            <div className="pt-1 flex flex-col items-center lg:items-start space-y-0.5 overflow-visible">
              <span className="font-meaculpa text-4xl text-[#D4AF37] leading-[1.42] py-1 px-1.5 overflow-visible" style={{ fontFamily: "'Mea Culpa', cursive" }}>
                Júlia Aleixo
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#1B2537]/65 font-semibold">
                Fundadora &amp; Designer Criativa
              </span>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/sobrenos')}
                className="group px-6 py-3 rounded-full bg-transparent hover:bg-[#D4AF37]/12 text-[#0F2C59] border border-[#D4AF37]/60 hover:border-[#D4AF37] text-[10.5px] font-semibold tracking-[0.22em] uppercase transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5"
              >
                <span>Conhecer Nossa História</span>
                <ArrowRight size={13} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="shrink-0 flex justify-center">
            <div className="w-[215px] sm:w-[225px] p-[1.5px] rounded-3xl bg-[linear-gradient(145deg,rgba(212,175,55,0.45)_0%,rgba(250,248,245,0.65)_50%,rgba(212,175,55,0.32)_100%)] shadow-[0_8px_24px_rgba(15,44,89,0.04)] group">
              <div className="aspect-[4/5] w-full rounded-[22px] overflow-hidden bg-[#FAF8F5] relative">
                <img
                  src={JULIA_PHOTO}
                  alt="Júlia Aleixo"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_22px_7px_rgba(250,248,245,0.75)]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4D. PROVA SOCIAL EDITORIAL: DEPOIMENTOS */}
      <section className="w-full bg-[#FAF8F5] px-2 sm:px-3 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75 mb-3">
            <span className="w-5 h-px bg-[#D4AF37]" />
            <span>Experiências Reais</span>
            <span className="w-5 h-px bg-[#D4AF37]" />
          </div>
          <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.6rem,3.6vw,2.95rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
            Amor em Forma de Depoimentos
          </h2>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {feedbackTestimonials.map((fb, idx) => (
            <div
              key={idx}
              className="bg-white/75 border border-[#E8E2D5]/75 rounded-2xl p-6 space-y-4 flex flex-col justify-between text-left"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-[#D4AF37]">
                  {[...Array(fb.rating)].map((_, i) => (
                    <Star key={i} size={14} fill="#D4AF37" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#1B2537]/80 font-light italic leading-relaxed">
                  "{fb.quote}"
                </p>
              </div>

              <div className="pt-3.5 border-t border-[#E8E2D5]/60 flex flex-col">
                <span className="text-xs font-bold text-[#0F2C59]">{fb.name}</span>
                <span className="text-[10px] text-[#1B2537]/60 uppercase tracking-wider">{fb.occasion} • {fb.city}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/feedclientes')}
            className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#0F2C59] hover:text-[#D4AF37] underline underline-offset-4 decoration-[#D4AF37]/50 transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <span>Ver Todos os Depoimentos</span>
            <ArrowRight size={13} className="text-[#D4AF37]" />
          </button>
        </div>
      </section>

      {/* 4E. SEÇÃO EDITORIAL 4 (IMAGEM + TEXTO): LISTA DE PRESENTES AFETIVA */}
      <section className="w-full bg-[linear-gradient(180deg,#FAF8F5_0%,rgba(244,237,225,0.48)_50%,#FAF8F5_100%)] px-4 sm:px-8 md:px-[2.5cm] py-12 sm:py-16">
        <div className="w-full flex flex-col-reverse lg:flex-row items-center justify-between gap-6 lg:gap-8">
          <div className="shrink-0 flex justify-center">
            <div className="w-[245px] sm:w-[265px] p-[1.5px] rounded-3xl bg-[linear-gradient(145deg,rgba(212,175,55,0.42)_0%,rgba(250,248,245,0.65)_50%,rgba(212,175,55,0.30)_100%)] shadow-[0_6px_22px_rgba(15,44,89,0.03)] group">
              <div className="aspect-square w-full rounded-[22px] overflow-hidden bg-[#FAF8F5] relative">
                <img
                  src={GIFT_LIST_IMAGE}
                  alt="Lista de Presentes Afetiva"
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                />
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[inset_0_0_24px_8px_rgba(250,248,245,0.75)]"
                />
              </div>
            </div>
          </div>

          <div className="w-full lg:flex-1 space-y-5 text-left">
            <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75">
              <span className="w-5 h-px bg-[#D4AF37]" />
              <span>Eventos &amp; Celebrações</span>
            </div>

            <h2 className="whitespace-nowrap overflow-visible text-[clamp(1.6rem,2.9vw,2.65rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.42] py-1 px-1.5">
              Lista de Presentes Afetiva
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#1B2537]/75 font-light leading-[1.85]">
              Crie uma lista de presentes personalizada com itens artesanais da Madrinha dos Personalizados. Seus convidados escolhem e compram online com facilidade, e você recebe tudo embalado com elegância no conforto da sua casa.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 text-xs text-[#1B2537]/85">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>100% gratuita para criar e compartilhar</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#1B2537]/85">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Painel de controle com mensagens</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#1B2537]/85">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Entrega unificada com seguro</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-[#1B2537]/85">
                <CheckCircle2 size={15} className="text-[#D4AF37] shrink-0" />
                <span>Validade de até 60 dias pós-evento</span>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-5">
              <button
                onClick={() => navigate('/listadepresentes')}
                className="group px-6 py-3 rounded-full bg-[#D4AF37]/14 hover:bg-[#0F2C59] text-[#0F2C59] hover:text-[#FAF8F5] border border-[#D4AF37] font-semibold text-[10.5px] uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer inline-flex items-center gap-2.5"
              >
                <span>Criar ou Consultar Lista</span>
                <ArrowRight size={13} className="text-[#D4AF37] group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/comofunciona-lp')}
                className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-[#0F2C59] hover:text-[#D4AF37] underline underline-offset-4 decoration-[#D4AF37]/50 transition-colors cursor-pointer"
              >
                Como Funciona a Lista
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
