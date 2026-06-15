import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Heart, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { CompanyId } from '../../types';
import { getUpcomingDates } from '../../services/calendarService';
import { startOfDay } from 'date-fns';
import { themes } from '../../lib/theme';

interface FestiveBannerProps {
  companyId: CompanyId;
  primaryColor?: string;
  onSearch?: (val: string) => void;
}

export const FestiveBanner: React.FC<FestiveBannerProps> = ({ companyId, primaryColor, onSearch }) => {
  const isPallyra = companyId === 'pallyra';
  const theme = themes[companyId as keyof typeof themes] || themes.pallyra;
  const displayColor = primaryColor || theme.accentColor || '#C6A664';

  const upcomingDate = useMemo(() => {
    const dates = getUpcomingDates(60); // Check 2 months ahead for better priority
    if (dates.length === 0) return null;
    
    // High-priority dates that are strong for gifts
    const priorityNames = [
      'DIA DAS MÃES', 
      'DIA DOS NAMORADOS', 
      'DIA DOS PAIS', 
      'BLACK FRIDAY', 
      'NATAL', 
      'PÁSCOA', 
      'DIA INTERNACIONAL DA MULHER',
      'DIA DO AMIGO'
    ];
    
    const priorityDate = dates.find(d => priorityNames.includes(d.name.toUpperCase()));
    return priorityDate || dates[0];
  }, []);

  const daysRemaining = useMemo(() => {
    if (!upcomingDate) return null;
    const today = startOfDay(new Date());
    const diff = Math.ceil((upcomingDate.date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [upcomingDate]);

  // Emotional, curated copy tailored for key dates
  const getEmotionalContent = (dateName: string) => {
    const name = dateName.toLowerCase();
    if (name.includes('mãe')) {
      return {
        label: 'Curadoria de Afeto',
        title: 'Especial Dia das Mães',
        subtitle: 'Presentes tecidos com afeto, cuidado e gratidão para emocionar quem sempre nos cuidou.',
        cta: 'Explorar curadoria especial'
      };
    }
    if (name.includes('namorado') || name.includes('amor')) {
      return {
        label: 'Curadoria Romântica',
        title: 'Especial Dia dos Namorados',
        subtitle: 'Lembranças únicas criadas à mão para celebrar as conexões mais raras e verdadeiras.',
        cta: 'Ver presentes especiais'
      };
    }
    if (name.includes('pai')) {
      return {
        label: 'Homenagem Especial',
        title: 'Especial Dia dos Pais',
        subtitle: 'Uma homenagem marcante à presença, força e amor que guiam nossos passos todos os dias.',
        cta: 'Explorar lembranças'
      };
    }
    if (name.includes('natal')) {
      return {
        label: 'Magia de Fim de Ano',
        title: 'Especial de Natal',
        subtitle: 'Mimos e mementos repletos de luz, afeto e delicadeza para celebrar a união de quem amamos.',
        cta: 'Ver coleção de Natal'
      };
    }
    if (name.includes('páscoa')) {
      return {
        label: 'Doce Celebração',
        title: 'Especial de Páscoa',
        subtitle: 'Celebre o recomeço com mimos doces e cheios de ternura em cada pequeno detalhe.',
        cta: 'Descobrir mimos'
      };
    }
    if (name.includes('mulher')) {
      return {
        label: 'Edição de Homenagem',
        title: 'Dia da Mulher',
        subtitle: 'Delicadeza e força reunidas em mimos de agradecimento que tocam o coração.',
        cta: 'Ver mimos afetivos'
      };
    }
    if (name.includes('amigo')) {
      return {
        label: 'Laço de Amizade',
        title: 'Dia do Amigo',
        subtitle: 'Lembranças singulares feitas para celebrar quem torna todos os momentos mais leves.',
        cta: 'Explorar presentes'
      };
    }
    return {
      label: 'Curadoria de Presentes',
      title: `Especial ${dateName}`,
      subtitle: 'Uma seleção afetiva, criada artesanalmente com todo o cuidado para tocar corações.',
      cta: 'Ver sugestões de mimos'
    };
  };

  const content = upcomingDate 
    ? getEmotionalContent(upcomingDate.name) 
    : {
        label: 'Curadoria de Presentes',
        title: 'Presentes com Alma',
        subtitle: 'Mimos autorais e joias afetivas criados artesanalmente com todo o cuidado para tocar corações.',
        cta: 'Ver sugestões de mimos'
      };

  const handleAction = () => {
    if (onSearch) {
      onSearch(upcomingDate ? upcomingDate.name : '');
      const catalogGrid = document.getElementById('catalog-grid');
      if (catalogGrid) {
        catalogGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const isDarkBackground = companyId === 'guennita';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className={`relative w-full overflow-hidden p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
        isDarkBackground 
          ? 'bg-[#621318] border-[#D4AF37]/20 shadow-[0_8px_30px_rgb(0,0,0,0.15)]' 
          : 'bg-[#FCFAF7] border-neutral-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]'
      }`}
    >
      {/* Subtle Inset Elegant Border Line */}
      <div className={`absolute inset-2 pointer-events-none rounded-xl border border-dashed ${
        isDarkBackground ? 'border-[#D4AF37]/10' : 'border-neutral-200/50'
      }`} />

      {/* Gentle Floating Sparkles & Organic Motion Confetti */}
      <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`sparkle-${companyId}-${i}`}
            initial={{ opacity: 0.1, y: 40, x: i * 80 + 30 }}
            animate={{ 
              opacity: [0.1, 0.5, 0.1], 
              y: [20, -50], 
              x: i * 80 + 30 + (Math.sin(i) * 20)
            }}
            transition={{ 
              duration: 8 + i * 2, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: i * 0.5
            }}
            className="absolute top-2/3"
            style={{ color: displayColor }}
          >
            {i % 2 === 0 ? (
              <Sparkles size={12 + i} className="opacity-40" />
            ) : (
              <Heart size={8 + i} fill="currentColor" strokeWidth={0} className="opacity-30" />
            )}
          </motion.div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-12">
        {/* Main textual selection */}
        <div className="flex-1 text-center md:text-left space-y-1.5 max-w-2xl">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span 
              className="font-sans text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] inline-block"
              style={{ color: displayColor }}
            >
              {content.label}
            </span>
            <span className={`w-1 h-1 rounded-full ${isDarkBackground ? 'bg-[#D4AF37]/50' : 'bg-neutral-300'}`} />
            
            {/* Elegant, Soft Countdown */}
            {daysRemaining !== null && (
              <span className={`text-[9px] md:text-[10px] font-medium ${isDarkBackground ? 'text-white/60' : 'text-neutral-500'} tracking-wider`}>
                {daysRemaining === 0 ? 'Encomendas abertas hoje' : 
                 daysRemaining === 1 ? 'Último dia para encomenda' : 
                 `Faltam ${daysRemaining} dias para encomendar`}
              </span>
            )}
          </div>

          <h2 className={`font-serif text-xl md:text-2xl font-black tracking-tight leading-tight ${
            isDarkBackground ? 'text-white' : 'text-neutral-900'
          }`}>
            {content.title}
          </h2>

          <p className={`font-sans text-xs md:text-sm font-light leading-relaxed max-w-xl ${
            isDarkBackground ? 'text-white/85' : 'text-neutral-600'
          }`}>
            {content.subtitle}
          </p>
        </div>

        {/* Action button representing highly refined curation */}
        <div className="shrink-0">
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAction}
            className={`apple-btn px-6 py-3 rounded-xl font-semibold text-xs transition-all duration-300 flex items-center gap-2 group shadow-sm`}
            style={{ 
              backgroundColor: displayColor, 
              color: isDarkBackground ? '#4C0D11' : '#FFFFFF',
              borderRadius: '12px'
            }}
          >
            <span>{content.cta}</span>
            <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
