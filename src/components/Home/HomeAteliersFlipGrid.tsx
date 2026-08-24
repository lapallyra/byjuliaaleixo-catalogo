import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { SiteSettings } from '../../types';

// Default Editorial Isotype Images
const PALLYRA_IMAGE = "/src/assets/images/pallyra_editorial_1784213505525.jpg";
const MIMADA_IMAGE = "/src/assets/images/mimada_editorial_1784213531490.jpg";
const TUTTY_IMAGE = "/src/assets/images/tuttymimo_editorial_1784213576844.jpg";
const GUENNITA_IMAGE = "/src/assets/images/guennita_editorial_1784213518263.jpg";

interface HomeAteliersFlipGridProps {
  customSettings?: Record<string, SiteSettings | null>;
}

interface AtelierData {
  id: string;
  tag: string;
  name: string;
  route: string;
  highlights: string[];
  description: string;
  bgTone: string;
  monogram: string;
  defaultImage: string;
}

export const HomeAteliersFlipGrid: React.FC<HomeAteliersFlipGridProps> = ({ customSettings = {} }) => {
  const navigate = useNavigate();
  // Support touch tap flip for mobile devices alongside desktop hover flip
  const [touchFlipped, setTouchFlipped] = useState<Record<string, boolean>>({});

  const ateliers: AtelierData[] = [
    {
      id: 'pallyra',
      tag: '01',
      name: 'La Pallyra',
      route: '/lapallyra',
      monogram: 'LP',
      bgTone: '#FAF7F2',
      defaultImage: PALLYRA_IMAGE,
      highlights: ['Encadernação Manual Nobre', 'Álbuns & Cadernos Personalizados', 'Agendas & Planners Exclusivos'],
      description:
        'Papelaria premium e exclusiva para o dia a dia. Encadernação, álbuns, agendas e afins.',
    },
    {
      id: 'mimada',
      tag: '02',
      name: 'Mimada Sim',
      route: '/mimadasim',
      monogram: 'MS',
      bgTone: '#FAF6F0',
      defaultImage: MIMADA_IMAGE,
      highlights: ['Lembranças para Casamento & Batizado', 'Brindes Empresariais & Eventos', 'Mimos Afetivos para Aniversário'],
      description:
        'Brindes e lembrancinhas para todo o tipo de evento. Casamento, empresarial, batizado, aniversário, afins.',
    },
    {
      id: 'tuttymimo',
      tag: '03',
      name: 'Tutty Mimo',
      route: '/tuttymimo',
      monogram: 'TM',
      bgTone: '#F9F5EE',
      defaultImage: TUTTY_IMAGE,
      highlights: ['Enxovais & Peças de Maternidade', 'Presentes Delicados & Essenciais', 'Lembrancinhas Afetivas de Nascimento'],
      description:
        'Dedicado a acolher a chegada de uma nova vida através de presentes delicados, únicos e essenciais com acabamentos cheios de ternura.',
    },
    {
      id: 'guennita',
      tag: '04',
      name: 'com amor, Guennita',
      route: '/comamorguennita',
      monogram: 'CG',
      bgTone: '#FBF8F4',
      defaultImage: GUENNITA_IMAGE,
      highlights: ['Caixas Cartonadas de Luxo', 'Flores de Cetim Moldadas à Mão', 'Presentes Luxuosos para Momentos Eternos'],
      description:
        'Caixas cartonadas de luxo, flores de cetim, presentes luxuosos para momentos eternos e únicos.',
    },
  ];

  const handleTouchToggle = (id: string) => {
    setTouchFlipped((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const getIsotypeImage = (atelier: AtelierData): string => {
    const setting = customSettings?.[atelier.id];
    return setting?.store_isotipo || setting?.store_logo || setting?.logoUrl || atelier.defaultImage;
  };

  const getAtelierDescription = (atelier: AtelierData): string => {
    const setting = customSettings?.[atelier.id];
    return setting?.store_description || setting?.about_us || atelier.description;
  };

  return (
    <section id="home-ateliers-section" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 select-none">
      
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14 space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C6D37] font-medium">
          <Sparkles size={12} strokeWidth={1.5} />
          <span>Quatro Universos de Criação</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif text-[#2C1810] font-normal tracking-tight">
          Nossos Ateliês
        </h2>
        <p className="text-xs sm:text-sm text-[#593E32] font-light">
          Passe o cursor sobre o card para ver os detalhes ou clique para entrar no ateliê.
        </p>
      </div>

      {/* Grid of 4 Vertical Rectangular Cards with 3D Flip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
        {ateliers.map((atelier) => {
          const isTouchActive = !!touchFlipped[atelier.id];
          const isotypeSrc = getIsotypeImage(atelier);
          const currentDescription = getAtelierDescription(atelier);

          return (
            <div
              key={atelier.id}
              className="flex flex-col items-center group/card cursor-pointer"
              onClick={() => handleTouchToggle(atelier.id)}
            >
              
              {/* VERTICAL RECTANGULAR CARD WITH 3D FLIP */}
              <div className="w-full aspect-[3/4] max-w-[340px] perspective-1000">
                <div
                  className={`w-full h-full relative transition-transform duration-700 preserve-3d rounded-2xl ${
                    isTouchActive ? 'rotate-y-180' : 'group-hover/card:rotate-y-180'
                  }`}
                >
                  
                  {/* FRONT OF CARD: CLEAN VERTICAL RECTANGULAR ISOTYPE WITHOUT EXTRA FRAMING PADDING */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden border border-[#D4AF37]/35 shadow-[0_4px_20px_rgba(179,143,77,0.08)] group-hover/card:border-[#B38F4D] transition-colors"
                    style={{ backgroundColor: atelier.bgTone }}
                  >
                    {isotypeSrc ? (
                      <img
                        src={isotypeSrc}
                        alt={atelier.name}
                        className="w-full h-full object-cover rounded-2xl transition-transform duration-700 group-hover/card:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          if (e.currentTarget.src !== atelier.defaultImage) {
                            e.currentTarget.src = atelier.defaultImage;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6">
                        <span 
                          className="font-meaculpa text-7xl sm:text-8xl text-[#8C6D37] leading-none select-none drop-shadow-[0_2px_8px_rgba(212,175,55,0.15)]"
                          style={{ fontFamily: "'Mea Culpa', cursive" }}
                        >
                          {atelier.monogram}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* BACK OF CARD: DETAILS */}
                  <div
                    className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-2xl p-6 sm:p-7 flex flex-col justify-between items-start text-left bg-[#FAF6F0] border border-[#B38F4D]/60 shadow-[0_8px_30px_rgba(179,143,77,0.12)] overflow-hidden"
                  >
                    {/* Back Top: Clean title */}
                    <div className="w-full border-b border-[#D4AF37]/25 pb-2.5">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-[#8C6D37]">
                        Confecção Artesanal
                      </span>
                    </div>

                    {/* Back Body: Description & Highlights */}
                    <div className="space-y-4 my-auto w-full">
                      <p className="text-xs sm:text-[13px] text-[#4A332A] font-light leading-relaxed">
                        {currentDescription}
                      </p>

                      <div className="space-y-2 pt-2 border-t border-[#D4AF37]/20">
                        <span className="text-[9px] uppercase font-semibold text-[#8C6D37] tracking-widest block">
                          Destaques:
                        </span>
                        <ul className="space-y-1.5 text-[11px] sm:text-xs text-[#2C1810]">
                          {atelier.highlights.map((item, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B38F4D] shrink-0"></span>
                              <span className="font-light">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Subtle bottom note */}
                    <div className="w-full pt-2 border-t border-[#D4AF37]/15 text-center">
                      <span className="text-[10px] text-[#8C6D37] font-light italic">
                        Clique para acessar o catálogo
                      </span>
                    </div>

                  </div>

                </div>
              </div>

              {/* ATELIER NAME OUTSIDE THE CARD (BELOW THE CARD) - FONT 'MEA CULPA' */}
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(atelier.route);
                }}
                className="mt-4 text-center space-y-1 cursor-pointer group/title"
              >
                <h3 
                  className="font-meaculpa text-3xl sm:text-4xl text-[#2C1810] font-normal tracking-wide group-hover/title:text-[#8C6D37] transition-colors leading-tight"
                  style={{ fontFamily: "'Mea Culpa', cursive" }}
                >
                  {atelier.name}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#593E32] font-light pt-0.5 group-hover/title:text-[#2C1810] transition-colors">
                  Acessar catálogo <ArrowRight size={11} className="text-[#B38F4D]" />
                </span>
              </div>

            </div>
          );
        })}
      </div>

    </section>
  );
};
