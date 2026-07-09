import React from 'react';
import { motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Campaign } from '../../types';

const BubbleHearts = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 opacity-30">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute text-[#F1948A]"
        initial={{
          bottom: '-10%',
          left: `${Math.random() * 100}%`,
          opacity: 0,
          scale: Math.random() * 0.5 + 0.5,
        }}
        animate={{
          bottom: '110%',
          opacity: [0, 1, 1, 0],
          scale: [0.5, 1.2, 0.8],
          x: [0, Math.random() * 40 - 20, 0]
        }}
        transition={{
          duration: Math.random() * 5 + 7,
          delay: Math.random() * 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Heart size={Math.random() * 15 + 15} fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

interface SeasonalBannerProps {
  campaign: Campaign;
  theme?: 'default' | 'special';
}

export const SeasonalBanner: React.FC<SeasonalBannerProps> = ({ campaign, theme = 'default' }) => {
  const navigate = useNavigate();

  const handleBannerClick = () => {
    if (campaign.linkUrl) {
      if (campaign.linkUrl.startsWith('http://') || campaign.linkUrl.startsWith('https://')) {
        window.open(campaign.linkUrl, '_blank');
      } else {
        navigate(campaign.linkUrl);
      }
    }
  };

  return (
    <div 
      onClick={handleBannerClick}
      className={`relative w-full overflow-hidden flex flex-col md:flex-row items-center justify-between min-h-[200px] md:min-h-[300px] p-6 md:p-12 transition-all duration-500 cursor-pointer group ${campaign.linkUrl ? 'hover:shadow-md' : ''}`}
      style={{ backgroundColor: campaign.colorTheme || '#FAF9F6' }}
    >
      {theme === 'default' && <BubbleHearts />}
      <div className="absolute inset-0 bg-radial-gradient from-white/10 to-transparent pointer-events-none" />
      
      <div className="relative z-10 max-w-xl space-y-3 md:space-y-4 flex-1 text-left">
        <span className="text-[10px] font-sans font-black tracking-[0.3em] uppercase text-[#cca062]">
          {campaign.subtitle || "Campanha Especial"}
        </span>
        <h2 className="text-2xl md:text-4xl font-serif text-[#3A312D] tracking-tight leading-tight group-hover:text-black transition-colors duration-300">
          {campaign.title}
        </h2>
        {campaign.description && (
          <p className="text-xs text-neutral-500 font-sans tracking-wide leading-relaxed">
            {campaign.description}
          </p>
        )}
        {campaign.linkUrl && (
          <div className="pt-1">
            <span className="inline-flex items-center gap-2 text-[9px] font-sans font-black uppercase tracking-[0.2em] text-[#3A312D] border-b-2 border-[#cca062] pb-1 group-hover:border-[#3A312D] transition-colors duration-300">
              Explorar Coleção →
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full md:w-1/2 aspect-video md:aspect-[16/10] overflow-hidden rounded-2xl border border-neutral-100/50 bg-[#FAF9F6] shadow-xs mt-6 md:mt-0 md:ml-12">
        {campaign.imageUrl ? (
          <picture>
            {campaign.mobileImageUrl && <source media="(max-width: 640px)" srcSet={campaign.mobileImageUrl} />}
            <img 
              src={campaign.imageUrl} 
              alt={campaign.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </picture>
        ) : (
          <div className="w-full h-full bg-neutral-200" />
        )}
      </div>
    </div>
  );
};
