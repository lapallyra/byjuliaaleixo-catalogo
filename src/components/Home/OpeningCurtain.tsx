import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronUp } from 'lucide-react';

interface OpeningCurtainProps {
  onEnter?: () => void;
  siteName?: string;
}

export const OpeningCurtain: React.FC<OpeningCurtainProps> = ({ onEnter }) => {
  const [hasSeen] = useState(() => {
    try {
      return sessionStorage.getItem('seen_opening_curtain_v1') === 'true';
    } catch {
      return false;
    }
  });

  const [isOpen, setIsOpen] = useState(hasSeen);
  const [shouldRender, setShouldRender] = useState(!hasSeen);

  const handleOpen = () => {
    if (isOpen) return;
    setIsOpen(true);
    try {
      sessionStorage.setItem('seen_opening_curtain_v1', 'true');
    } catch {
      // ignore
    }
    if (onEnter) onEnter();
    
    // Unmount from DOM after transition completes
    setTimeout(() => {
      setShouldRender(false);
    }, 1100);
  };

  if (!shouldRender) return null;

  return (
    <div
      id="opening-curtain"
      onClick={handleOpen}
      className={`fixed inset-0 z-[9999] bg-[#0A0A0A] text-[#FAF8F5] flex flex-col items-center justify-between px-6 py-12 select-none cursor-pointer transition-transform duration-1000 ease-[cubic-bezier(0.77,0,0.175,1)] ${
        isOpen ? '-translate-y-full pointer-events-none' : 'translate-y-0'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #151310 0%, #0A0A0A 85%)',
      }}
    >
      {/* Top spacing */}
      <div className="w-full flex justify-center items-center pt-4 opacity-0 pointer-events-none">
        <span className="text-[10px]">by Julia Aleixo</span>
      </div>

      {/* Main Center Branding: ONLY "by Julia Aleixo" in Mea Culpa typography with Ethereal Golden Glow */}
      <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto my-auto px-4">
        <h1 
          className="font-meaculpa text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-[#F5DEAB] tracking-normal font-normal leading-none select-none hover:scale-105 transition-transform duration-700 animate-curtain-glow"
          style={{ 
            fontFamily: "'Mea Culpa', cursive",
            textShadow: '0 0 20px rgba(245, 222, 168, 0.75), 0 0 45px rgba(229, 195, 136, 0.55), 0 0 80px rgba(212, 175, 55, 0.35)'
          }}
        >
          by Julia Aleixo
        </h1>
      </div>

      {/* Bottom Cue: "click e descubra um universo exclusivo." */}
      <div className="flex flex-col items-center space-y-2 pb-6">
        <div className="flex items-center gap-2 text-[#C5A880]/90 hover:text-[#E5C388] transition-colors">
          <span className="font-poppins text-xs sm:text-sm tracking-[0.25em] lowercase font-light">
            click e descubra um universo exclusivo.
          </span>
          <Sparkles size={13} strokeWidth={1.5} className="text-[#E5C388] animate-pulse shrink-0" />
        </div>

        <div className="text-[#8C6D37]/50 pt-1">
          <ChevronUp size={14} className="animate-bounce" />
        </div>
      </div>
    </div>
  );
};
