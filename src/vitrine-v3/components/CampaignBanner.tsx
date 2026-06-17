import React from 'react';
import { Gift, Award, Sparkles, ChevronRight } from 'lucide-react';
import { WeeklyCampaign } from '../campaigns/campaign-data';
import { CountdownTimerV3 } from './CountdownTimer';
import { Link } from 'react-router-dom';

interface CampaignBannerProps {
  campaign: WeeklyCampaign;
  highlightProductImage?: string;
  highlightProductId?: string;
}

export const CampaignBannerV3: React.FC<CampaignBannerProps> = ({ 
  campaign, 
  highlightProductImage,
  highlightProductId
}) => {
  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${campaign.backgroundGradient} text-white border border-[#D4AF37]/30 shadow-xl select-none mb-10`}>
      {/* Decorative subtle ambient lights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-neutral-100/5 rounded-full filter blur-[85px] pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 md:p-12">
        {/* Left Column: Emotion and dynamic urgency */}
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            <Sparkles size={11} className="text-[#D4AF37]" />
            <span>Campanha Especial de {campaign.name}</span>
          </div>

          <div className="space-y-3">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-3.5xl font-extrabold text-white tracking-wide leading-tight">
              {campaign.emocionalTitle}
            </h2>
            <p className="font-sans text-xs text-neutral-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
              {campaign.description}
            </p>
          </div>

          {/* Premium benefits list */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 justify-center lg:justify-start text-[10px] text-neutral-300 font-medium">
            <div className="flex items-center gap-1.5">
              <Award size={13} className="text-[#D4AF37]" />
              <span>Monograma em Ouro Inclusor</span>
            </div>
            <div className="w-1 h-1 bg-neutral-600 rounded-full hidden sm:block" />
            <div className="flex items-center gap-1.5">
              <Gift size={13} className="text-[#D4AF37]" />
              <span>Embalagem Lacre de Cera Real</span>
            </div>
          </div>

          {/* Buttons/Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
            <Link
              to={`/vitrine-v3/produto/${campaign.highlightProductId}`}
              className="w-full sm:w-auto bg-[#D4AF37] hover:bg-[#FAF8F5] text-neutral-950 font-bold uppercase text-[9.5px] tracking-widest px-7 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span>Garantir Peça Destaque</span>
              <ChevronRight size={13} />
            </Link>
          </div>

        </div>

        {/* Right Column: Highlight Product Visual & Real-time Live Countdown Clock */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-6 bg-neutral-900/40 border border-white/5 p-6 sm:p-8 rounded-2xl md:min-h-[260px]">
          
          <div className="text-center space-y-1">
            <span className="text-neutral-400 text-[9px] uppercase tracking-widest font-black block">Oferta Expira Em:</span>
            <span className="text-[#D4AF37] text-xs font-serif italic block">Edições limitadas à disponibilidade de gema do ateliê</span>
          </div>

          {/* The countdown */}
          <CountdownTimerV3 campaignId={campaign.id} daysDefault={campaign.daysRemainingDefault} />

          {/* Quick highlight snippet */}
          {highlightProductImage && (
            <div className="relative flex items-center gap-3.5 bg-neutral-950/70 border border-[#D4AF37]/20 p-2.5 rounded-xl w-full max-w-xs transition-transform hover:scale-[1.02] duration-300">
              <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 border border-neutral-800">
                <img src={highlightProductImage} alt="Highlight" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <span className="text-[#D4AF37] text-[8px] font-black uppercase tracking-wider block">O Coração da Semana</span>
                <span className="text-white font-serif text-[10.5px] font-bold block truncate">Peça d\'Arte no Ouro</span>
                <Link to={`/vitrine-v3/produto/${highlightProductId}`} className="text-[9.5px] text-neutral-300 underline hover:text-[#D4AF37]">
                  Explorar agora
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
