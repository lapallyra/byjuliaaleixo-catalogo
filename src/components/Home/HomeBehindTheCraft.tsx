import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Heart, Award } from 'lucide-react';
import { SiteSettings } from '../../types';

// Default Julia Profile Photo Asset
const JULIA_DEFAULT_PHOTO = "/src/assets/images/julia_profile_1782445376350.jpg";

interface HomeBehindTheCraftProps {
  customSettings?: Record<string, SiteSettings | null>;
}

export const HomeBehindTheCraft: React.FC<HomeBehindTheCraftProps> = ({ customSettings }) => {
  const navigate = useNavigate();

  // Find if there's any custom photo in site settings
  const pallyraSettings = customSettings?.pallyra || customSettings?.guennita || customSettings?.mimada || customSettings?.tuttymimo;
  const photoSrc = pallyraSettings?.about_me_photo || JULIA_DEFAULT_PHOTO;

  return (
    <section id="home-behind-the-craft" className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 select-none">
      
      <div className="rounded-3xl bg-[#F9F7F2] border border-[#E8DFC8]/70 p-6 sm:p-10 md:p-14 lg:p-16 shadow-[0_4px_30px_rgba(179,143,77,0.04)] relative overflow-hidden">
        
        {/* Subtle Decorative Golden Border Frame */}
        <div className="absolute inset-3 sm:inset-5 border border-[#B38F4D]/15 rounded-2xl pointer-events-none" />

        {/* 2-Column Responsive Layout: Photo on the Left, Text on the Right */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
          
          {/* LEFT: PHOTO OF JÚLIA ALEIXO */}
          <div className="md:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[4/5] rounded-2xl overflow-hidden border border-[#D4AF37]/45 bg-white p-2 shadow-[0_8px_30px_rgba(179,143,77,0.12)] group">
              
              {/* Inner Photo Frame */}
              <div className="w-full h-full rounded-xl overflow-hidden relative bg-[#FAF7F2]">
                <img
                  src={photoSrc}
                  alt="Júlia Aleixo - Fundadora & Diretora Criativa"
                  className="w-full h-full object-cover object-center filter brightness-[0.98] contrast-[1.02] group-hover:scale-105 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    if (e.currentTarget.src !== JULIA_DEFAULT_PHOTO) {
                      e.currentTarget.src = JULIA_DEFAULT_PHOTO;
                    }
                  }}
                />
                
                {/* Gentle Golden Sheen Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2C1810]/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>

              {/* Decorative Corner Accents */}
              <div className="absolute top-3.5 left-3.5 w-3 h-3 border-t border-l border-[#B38F4D] pointer-events-none" />
              <div className="absolute top-3.5 right-3.5 w-3 h-3 border-t border-r border-[#B38F4D] pointer-events-none" />
              <div className="absolute bottom-3.5 left-3.5 w-3 h-3 border-b border-l border-[#B38F4D] pointer-events-none" />
              <div className="absolute bottom-3.5 right-3.5 w-3 h-3 border-b border-r border-[#B38F4D] pointer-events-none" />
            </div>

            {/* Small Sub-Badge below photo */}
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFFFF]/80 border border-[#D4AF37]/30 text-[10px] uppercase font-bold tracking-widest text-[#8C6D37] shadow-2xs">
              <Award size={11} className="text-[#B38F4D]" />
              <span>Artesã & Idealizadora</span>
            </div>
          </div>

          {/* RIGHT: NARRATIVE & QUOTE */}
          <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left space-y-5">
            
            <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C6D37] font-medium">
              <Heart size={12} strokeWidth={1.5} className="text-[#B38F4D]" />
              <span>Nossa Filosofia & Essência</span>
            </div>

            <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight leading-snug">
              Por Trás de Cada Detalhe
            </h2>

            <p className="text-xs sm:text-sm md:text-base text-[#4A332A] font-light leading-relaxed max-w-2xl">
              "Acreditamos que o verdadeiro luxo mora naquilo que é feito com calma, intenção e afeto genuíno. Nos nossos quatro ateliês, cada fita, cada gravação e cada caixa carrega a missão de transformar momentos especiais em memórias eternas."
            </p>

            {/* Signature Block */}
            <div className="pt-2 flex flex-col items-center md:items-start space-y-1">
              <span 
                className="font-meaculpa text-4xl sm:text-5xl text-[#8C6D37] tracking-normal font-normal leading-none"
                style={{ fontFamily: "'Mea Culpa', cursive" }}
              >
                Júlia Aleixo
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#593E32] font-medium pt-1">
                Fundadora & Diretora Criativa
              </span>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={() => navigate('/sobrenos')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#2C1810] hover:bg-[#3D261C] text-[#FAF8F5] border border-[#D4AF37]/40 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer text-xs uppercase tracking-wider font-medium group/btn"
              >
                <span>Conhecer Nossa História Completa</span>
                <ArrowRight size={13} strokeWidth={1.5} className="text-[#E5C388] group-hover/btn:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>

        </div>

      </div>

    </section>
  );
};
