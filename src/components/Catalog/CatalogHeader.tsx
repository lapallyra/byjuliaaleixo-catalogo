import React, { useState, useEffect } from 'react';
import { ShoppingCart, Search, Gift } from 'lucide-react';
import { BotaoVoltar } from '../BotaoVoltar';
import { CompanyId } from '../../types';
import { CatalogInfoBar } from './CatalogInfoBar';
import { FestiveBanner } from './FestiveBanner';
import { motion } from 'motion/react';
import { ImageWithFallback } from '../ImageWithFallback';

export const CatalogHeader: React.FC<{
  companyName: string;
  logoUrl: string | null;
  theme: any;
  onCartClick: () => void;
  cartCount: number;
  onGiftListClick: () => void;
  giftListCount: number;
  onSearch: (s: string) => void;
  onGoBack: () => void;
  onLogoClick?: () => void;
  companyId?: CompanyId;
}> = ({ companyName, logoUrl, theme, onSearch, onGoBack, companyId, onGiftListClick, giftListCount, onLogoClick }) => {
  const isMimada = companyId === 'mimada' || companyName.toLowerCase().includes('mimada');
  const isPallyra = companyId === 'pallyra';

  return (
    <header className="relative z-50 w-full" style={{ backgroundColor: theme.primaryColor || '#FAF9F6' }}>
      <BotaoVoltar onClick={onGoBack} />
      
      {/* Editorial Luxury Header */}
      <div className={`w-full flex-col items-center justify-center pt-4 pb-4 px-6 transition-all duration-700 relative overflow-hidden`}
           style={{ 
             backgroundColor: theme.primaryColor || (isMimada ? '#FF007F' : (isPallyra ? '#FAF9F6' : '#ffffff')),
           }}>
        
        {/* Subtle Background Elements - Now for all brands with brand accent color */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center opacity-[0.04]">
           <div className="w-[100vw] h-[100vw] rounded-full border-[1px] absolute scale-150 animate-[spin_120s_linear_infinite]" style={{ borderColor: theme.accentColor }} />
           <div className="w-[80vw] h-[80vw] rounded-full border-[1px] absolute scale-125 animate-[spin_90s_linear_infinite_reverse]" style={{ borderColor: theme.accentColor }} />
        </div>

        <div className="w-full flex items-center justify-between px-6 py-6 relative z-10">
            {/* LEFT SIDE: Logo & Name */}
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div 
                 initial={{ opacity: 0, scale: 0.8 }}
                 animate={{ opacity: 1, scale: 1 }}
                 whileHover={{ scale: 1.05, y: -4 }}
                 whileTap={{ scale: 0.97, y: 0 }}
                 transition={{ duration: 0.8, ease: "easeOut" }}
                 onClick={onLogoClick}
                 className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer backdrop-blur-xl group`}
                 style={{ 
                   background: isMimada && theme.primaryColor !== '#FFFFFF' ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                   borderTop: `1px solid rgba(255,255,255,0.3)`,
                   borderLeft: `1px solid rgba(255,255,255,0.1)`,
                   borderRight: `1px solid rgba(0,0,0,0.05)`,
                   borderBottom: `1px solid rgba(0,0,0,0.1)`,
                   boxShadow: `
                     inset 0 6px 16px rgba(255,255,255,0.2),
                     inset 0 -6px 16px rgba(0,0,0,0.05),
                     0 10px 30px -10px ${theme.accentColor}30,
                     0 0 25px -5px ${theme.accentColor}15
                   `
                 }}
              >
                {logoUrl ? (
                  <ImageWithFallback
                    src={logoUrl}
                    alt={companyName}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    loading="eager"
                  />
                ) : (
                  <div className="text-xl font-black text-gray-400 font-serif lowercase italic">
                    {companyName.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-20 group-hover:opacity-40 transition-opacity duration-500" style={{ backgroundColor: theme.accentColor }} />
              </motion.div>
              
              <motion.h1 
                   initial={{ opacity: 0, x: -20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                   className={`text-2xl md:text-3xl lg:text-4xl leading-[0.8] tracking-tight font-beauty`}
                   style={{ 
                     color: theme.accentColor,
                     textShadow: `0px 10px 40px ${theme.accentColor}33`,
                     letterSpacing: '-1px'
                   }}>
                {companyName}
              </motion.h1>
            </div>
            
            {/* RIGHT SIDE: Minimalist Search & Access */}
            <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4, duration: 0.8 }}
               className="flex items-center gap-6 group"
            >
               <div className="flex items-center gap-3 px-4 py-2 w-48 md:w-64 bg-black/[0.03] backdrop-blur-sm rounded-xl border border-black/[0.04] transition-all duration-300 group-focus-within:bg-white group-focus-within:border-black/10 group-focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.03)]" >
                 <Search size={14} className={`opacity-40 transition-opacity group-focus-within:opacity-80 ${theme.textPrimary}`}  />
                 <input 
                   type="text" 
                   placeholder="Buscar presentes..." 
                   className={`bg-transparent text-xs font-sans tracking-wide outline-none w-full placeholder:text-neutral-400 text-neutral-800 transition-all`}
                   onChange={(e) => onSearch(e.target.value)}
                 />
               </div>
               
               <button 
                 onClick={onGiftListClick}
                 className="flex flex-col items-center gap-1 opacity-60 hover:opacity-100 transition-all duration-300 relative group/btn hover:scale-110"
                 title="Ver Lista de Presentes"
               >
                 <Gift size={20} strokeWidth={2} />
                 <span className="text-[8px] font-medium uppercase tracking-wider">Listas</span>
                 {giftListCount > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-[8px] shadow-lg animate-pulse ${theme.cartBadge}`}>
                      {giftListCount}
                    </span>
                 )}
               </button>
            </motion.div>
        </div>
        
        {/* Festive Banner - Keep full width */}
        <CatalogInfoBar theme={theme} />
        <div className="px-6 pb-4">
            <FestiveBanner 
              companyId={companyId || 'pallyra'} 
              primaryColor={theme.accentColor} 
            />
        </div>
      </div>
    </header>
  );
};
