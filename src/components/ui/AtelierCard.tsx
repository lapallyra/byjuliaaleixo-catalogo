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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
      className="bg-white border border-[#e8dcc8]/60 rounded-3xl p-8 md:p-12 shadow-sm relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center lg:items-stretch new-atelier-card outline-none focus-visible:ring-2 focus-visible:ring-offset-4"
      style={{ '--glow-color': atelier.accentColor } as React.CSSProperties}
    >
      {/* Glass Overlay (Hover State) */}
      <div className="new-glass-overlay">
        <h3 className="text-xl font-serif font-bold text-gray-900 mb-2">{atelier.name}</h3>
        <p className="text-sm text-gray-800 line-clamp-4 max-w-sm">{atelier.description}</p>
        {atelier.tagline && <p className="text-xs text-gray-600 mt-2 font-cursive">&ldquo;{atelier.tagline}&rdquo;</p>}
      </div>

      <div className="absolute top-0 right-0 w-48 h-48 bg-[#cca062]/5 rounded-bl-full blur-xl pointer-events-none" />
      
      {/* Visual Logo / Design Image */}
      <div className="flex flex-col justify-center items-center p-6 bg-gradient-to-br from-white to-[#faf8f5] rounded-3xl border border-[#e8dcc8]/40 w-48 h-48 shrink-0 shadow-inner new-isotipo-container">
        {isImageLogo ? (
          <div className="w-28 h-28 rounded-full border border-[#e8dcc8]/40 bg-white flex items-center justify-center overflow-hidden p-1 shadow-xs">
            <ImageWithFallback src={atelier.logo!} alt={atelier.name} className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-28 h-28 rounded-full border border-[#e8dcc8]/40 bg-white flex items-center justify-center text-4xl shadow-xs">
            {atelier.logo}
          </div>
        )}
        <span className="font-serif text-[10px] font-black uppercase tracking-widest mt-3 text-[#cca062]/80">
          {atelier.id === 'guennita' ? 'Guennita' : atelier.id === 'pallyra' ? 'La Pallyra' : atelier.id === 'mimada' ? 'Mimada Sim' : 'Tutty Mimo'}
        </span>
      </div>

      {/* Text Info */}
      <div className="flex flex-col justify-between flex-1 text-center lg:text-left z-0">
        <div>
          <h2 className="font-beauty text-2xl sm:text-3xl font-normal leading-tight mb-1" style={{ color: atelier.accentColor }}>
            {atelier.name}
          </h2>
          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 mb-6">
            {atelier.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mb-6">
            {atelier.description}
          </p>
          
          <div className="bg-[#faf8f5] border border-[#e8dcc8]/40 rounded-xl p-4 mb-8 text-xs max-w-2xl text-left">
            <span className="font-bold text-[#cca062] block mb-1 uppercase tracking-wider">Acabamentos e Diferenciais:</span>
            <span className="text-[#6d5443]/80 leading-relaxed">{atelier.details}</span>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
          <p className="font-cursive text-2xl leading-none" style={{ color: atelier.accentColor }}>
            &ldquo;{atelier.tagline}&rdquo;
          </p>
          
          <Button
            onClick={onClick}
            themeColor={atelier.accentColor}
            className="px-8 py-3.5 tracking-widest uppercase text-xs rounded-full"
            style={{ boxShadow: `0 4px 14px ${atelier.accentColor}25` }}
          >
            Ver Catálogo
            <ArrowRight size={14} className="ml-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
