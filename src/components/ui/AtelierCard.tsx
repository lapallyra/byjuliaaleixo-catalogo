import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ImageWithFallback } from '../ImageWithFallback';
import { Button } from './Button';

export interface AtelierCardProps {
  atelier: {
    id: string;
    name: string;
    title: string;
    description: string;
    details: string;
    tagline: string;
    logo?: string;
    accentColor: string;
  };
  onClick?: () => void;
  index?: number;
}

export const AtelierCard: React.FC<AtelierCardProps> = ({ atelier, onClick, index = 0 }) => {
  const isImageLogo = atelier.logo && (atelier.logo.startsWith('http') || atelier.logo.startsWith('data:') || atelier.logo.includes('/'));

  const getAtelierTheme = (id: string) => {
    switch (id) {
      case 'pallyra':
        return {
          cardBg: 'bg-white hover:bg-[#121212] border-neutral-200 hover:border-[#cca062]/50 text-neutral-800',
          titleColor: 'text-neutral-800 group-hover:text-[#cca062]',
          subtitleClass: 'text-neutral-500 group-hover:text-neutral-300 font-medium tracking-widest',
          descClass: 'text-neutral-600 group-hover:text-neutral-200 leading-relaxed font-light',
          detailsBg: 'bg-neutral-50 group-hover:bg-[#1a1a1a] border-neutral-200 group-hover:border-[#cca062]/20',
          detailsLabelColor: 'text-neutral-700 group-hover:text-[#cca062]',
          detailsTextClass: 'text-neutral-600 group-hover:text-neutral-300',
          isotipoContainer: 'bg-neutral-50 group-hover:bg-[#1a1a1a] border-neutral-200 group-hover:border-[#cca062]/20',
          isotipoInner: 'bg-white group-hover:bg-[#121212] border-neutral-100 group-hover:border-neutral-800',
          taglineColor: 'text-neutral-500 group-hover:text-[#cca062]',
          buttonClass: 'bg-neutral-800 text-white hover:bg-neutral-900 group-hover:bg-[#cca062] group-hover:hover:bg-white group-hover:text-neutral-950 group-hover:hover:text-black border border-transparent',
          logoFilter: 'group-hover:brightness-110 group-hover:contrast-110',
          overlayClass: 'bg-[#121212]/90 text-white border border-[#cca062]/40',
          overlayTitle: 'text-[#cca062]',
          overlayDesc: 'text-neutral-300',
          overlayTagline: 'text-[#cca062]',
        };
      case 'guennita':
        return {
          cardBg: 'bg-white hover:bg-[#4a1213] border-neutral-200 hover:border-[#cca062]/50 text-neutral-800',
          titleColor: 'text-neutral-800 group-hover:text-[#cca062]',
          subtitleClass: 'text-neutral-500 group-hover:text-neutral-300 font-medium tracking-widest',
          descClass: 'text-neutral-600 group-hover:text-neutral-200 leading-relaxed font-light',
          detailsBg: 'bg-neutral-50 group-hover:bg-[#3b0d0e] border-neutral-200 group-hover:border-[#cca062]/20',
          detailsLabelColor: 'text-neutral-700 group-hover:text-[#cca062]',
          detailsTextClass: 'text-neutral-600 group-hover:text-neutral-200',
          isotipoContainer: 'bg-neutral-50 group-hover:bg-[#3b0d0e] border-neutral-200 group-hover:border-[#cca062]/20',
          isotipoInner: 'bg-white group-hover:bg-[#4a1213] border-neutral-100 group-hover:border-[#cca062]/20',
          taglineColor: 'text-neutral-500 group-hover:text-[#cca062]',
          buttonClass: 'bg-neutral-800 text-white hover:bg-neutral-900 group-hover:bg-[#cca062] group-hover:hover:bg-white group-hover:text-neutral-950 group-hover:hover:text-[#4a1213] border border-transparent',
          logoFilter: 'group-hover:brightness-110 group-hover:contrast-110',
          overlayClass: 'bg-[#4a1213]/90 text-white border border-[#cca062]/40',
          overlayTitle: 'text-[#cca062]',
          overlayDesc: 'text-neutral-200',
          overlayTagline: 'text-[#cca062]',
        };
      case 'mimada':
        return {
          cardBg: 'bg-white hover:bg-[#FFF0F5] border-neutral-200 hover:border-[#ebd5f0]/80 text-neutral-800',
          titleColor: 'text-neutral-800 group-hover:text-[#c96b71]',
          subtitleClass: 'text-neutral-500 group-hover:text-[#c96b71] font-semibold tracking-wider',
          descClass: 'text-neutral-600 group-hover:text-neutral-700 leading-relaxed font-normal',
          detailsBg: 'bg-neutral-50 group-hover:bg-[#FDF4F5]/40 border-neutral-200 group-hover:border-pink-100',
          detailsLabelColor: 'text-neutral-700 group-hover:text-[#c96b71]',
          detailsTextClass: 'text-neutral-600 group-hover:text-neutral-600',
          isotipoContainer: 'bg-neutral-50 group-hover:bg-[#FDF4F5]/60 border-neutral-200 group-hover:border-pink-100/40',
          isotipoInner: 'bg-white group-hover:bg-white border-neutral-100 group-hover:border-pink-50',
          taglineColor: 'text-neutral-500 group-hover:text-[#c96b71]',
          buttonClass: 'bg-neutral-800 text-white hover:bg-neutral-900 group-hover:bg-[#c96b71] group-hover:hover:bg-[#b05359] group-hover:text-white group-hover:border-transparent',
          logoFilter: '',
          overlayClass: 'bg-[#c96b71]/90 text-white border border-[#c96b71]/40',
          overlayTitle: 'text-white',
          overlayDesc: 'text-white/90',
          overlayTagline: 'text-white/80',
        };
      case 'tuttymimo':
      default:
        return {
          cardBg: 'bg-white hover:bg-gradient-to-b hover:from-[#FAF9F6] hover:to-white border-neutral-200 hover:border-[#e8dcc8]/60 text-neutral-800',
          titleColor: 'text-neutral-800 group-hover:text-[#cca062]',
          subtitleClass: 'text-neutral-500 group-hover:text-[#d4bda1] font-medium tracking-wider',
          descClass: 'text-neutral-600 group-hover:text-[#6d5443]/80 leading-relaxed font-normal',
          detailsBg: 'bg-neutral-50 group-hover:bg-[#fffcf7] border-neutral-200 group-hover:border-[#e8dcc8]/40',
          detailsLabelColor: 'text-neutral-700 group-hover:text-[#cca062]',
          detailsTextClass: 'text-neutral-600 group-hover:text-[#6d5443]/80',
          isotipoContainer: 'bg-neutral-50 group-hover:bg-[#FCFAF7] border-neutral-200 group-hover:border-[#e8dcc8]/40',
          isotipoInner: 'bg-white group-hover:bg-white border-neutral-100 group-hover:border-[#ebd9cb]/40',
          taglineColor: 'text-neutral-500 group-hover:text-[#cca062]',
          buttonClass: 'bg-neutral-800 text-white hover:bg-neutral-900 group-hover:bg-[#6d5443] group-hover:hover:bg-[#5b4535] group-hover:text-white',
          logoFilter: '',
          overlayClass: 'bg-[#FAF9F6]/95 text-[#6d5443] border border-[#e8dcc8]/60',
          overlayTitle: 'text-[#cca062]',
          overlayDesc: 'text-[#6d5443]/80',
          overlayTagline: 'text-[#cca062]',
        };
    }
  };

  const theme = getAtelierTheme(atelier.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className={`border rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center lg:items-stretch new-atelier-card group outline-none focus-visible:ring-2 focus-visible:ring-offset-4 transition-all duration-300 ${theme.cardBg}`}
      style={{ '--glow-color': atelier.accentColor } as React.CSSProperties}
    >
      {/* Glass Overlay (Hover State) */}
      <div className={`new-glass-overlay ${theme.overlayClass}`}>
        <h3 className={`text-xl font-serif font-bold mb-2 ${theme.overlayTitle}`}>{atelier.name}</h3>
        <p className={`text-sm line-clamp-4 max-w-sm ${theme.overlayDesc}`}>{atelier.description}</p>
        {atelier.tagline && <p className={`text-xs mt-2 font-cursive ${theme.overlayTagline}`}>&ldquo;{atelier.tagline}&rdquo;</p>}
      </div>

      <div className="absolute top-0 right-0 w-48 h-48 bg-[#cca062]/5 rounded-bl-full blur-xl pointer-events-none" />
      
      {/* Visual Logo / Design Image */}
      <div className={`flex flex-col justify-center items-center rounded-3xl border w-full lg:w-64 h-64 shrink-0 shadow-inner new-isotipo-container overflow-hidden transition-all duration-300 ${theme.isotipoContainer}`}>
        {isImageLogo ? (
          <div className={`w-full h-full rounded-2xl flex items-center justify-center overflow-hidden shadow-sm transition-all duration-300 ${theme.isotipoInner}`}>
            <ImageWithFallback src={atelier.logo!} alt={atelier.name} className={`w-full h-full object-cover rounded-2xl transition-all duration-300 ${theme.logoFilter}`} />
          </div>
        ) : (
          <div className={`w-full h-full rounded-2xl border flex items-center justify-center text-4xl shadow-sm transition-all duration-300 ${theme.isotipoInner}`}>
            {atelier.logo}
          </div>
        )}
      </div>

      {/* Text Info */}
      <div className="flex flex-col justify-between flex-1 text-center lg:text-left z-0">
        <div>
          <h2 className={`font-beauty text-2xl sm:text-3xl font-normal leading-tight mb-1 transition-colors duration-300 ${theme.titleColor}`}>
            {atelier.name}
          </h2>
          <h3 className={`text-xs sm:text-sm uppercase mb-6 transition-colors duration-300 ${theme.subtitleClass}`}>
            {atelier.title}
          </h3>
          <p className={`text-sm mb-6 transition-colors duration-300 ${theme.descClass}`}>
            {atelier.description}
          </p>
          
          <div className={`border rounded-xl p-4 mb-8 text-xs max-w-2xl text-left transition-all duration-300 ${theme.detailsBg}`}>
            <span className={`font-bold block mb-1 uppercase tracking-wider transition-colors duration-300 ${theme.detailsLabelColor}`}>Acabamentos e Diferenciais:</span>
            <span className={`leading-relaxed transition-colors duration-300 ${theme.detailsTextClass}`}>{atelier.details}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <p className={`font-cursive text-2xl leading-none transition-colors duration-300 ${theme.taglineColor}`}>
            &ldquo;{atelier.tagline}&rdquo;
          </p>
          
          <Button
            onClick={onClick}
            className={`px-8 py-3.5 tracking-widest uppercase text-xs rounded-full transition-all duration-300 ${theme.buttonClass}`}
          >
            Ver Catálogo
            <ArrowRight size={14} className="ml-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
