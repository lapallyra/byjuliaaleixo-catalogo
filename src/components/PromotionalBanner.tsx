import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { PromotionalCampaign } from '../types';
import { promotionalCampaignService } from '../services/promotionalCampaignService';

export function PromotionalBanner() {
  const [activeCampaigns, setActiveCampaigns] = useState<PromotionalCampaign[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = promotionalCampaignService.subscribeActive(setActiveCampaigns);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (activeCampaigns.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeCampaigns.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeCampaigns.length]);

  if (activeCampaigns.length === 0) return null;

  const currentCampaign = activeCampaigns[currentIndex];

  return (
    <div className="relative w-full overflow-hidden bg-[#FAF8F5]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentCampaign.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative w-full h-[250px] md:h-[400px] cursor-pointer group"
          style={{ backgroundColor: currentCampaign.theme_color || '#1F1F1F' }}
          onClick={() => navigate(`/promocao/${currentCampaign.slug}`)}
        >
          {currentCampaign.banner && (
            <div className="absolute inset-0 z-0">
              <picture>
                <source media="(max-width: 768px)" srcSet={currentCampaign.bannerMobile || currentCampaign.banner} />
                <img 
                  src={currentCampaign.banner} 
                  alt={currentCampaign.name} 
                  className="w-full h-full object-cover mix-blend-overlay opacity-80 group-hover:scale-105 transition-transform duration-700"
                />
              </picture>
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20" />
            </div>
          )}
          
          <div className="relative z-10 h-full flex flex-col justify-center px-8 md:px-16 max-w-[1400px] mx-auto">
            <motion.h2 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl md:text-5xl font-serif text-white mb-4 line-clamp-2 max-w-2xl"
            >
              {currentCampaign.name}
            </motion.h2>
            
            {currentCampaign.marketing_phrase && (
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-base md:text-xl font-serif italic text-white/90 mb-8 line-clamp-1 max-w-xl"
              >
                {currentCampaign.marketing_phrase}
              </motion.p>
            )}
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-flex items-center gap-2 text-white font-sans text-xs md:text-sm uppercase tracking-widest group-hover:gap-4 transition-all"
            >
              <span>Ver produtos</span>
              <ChevronRight size={16} />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pagination indicators */}
      {activeCampaigns.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {activeCampaigns.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
