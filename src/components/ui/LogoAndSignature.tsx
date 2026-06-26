import React from 'react';

export const LogoAndSignature = ({ small = false }: { small?: boolean }) => (
  <div className={`flex items-center gap-3 sm:gap-6 select-none ${small ? 'scale-75 origin-left' : ''}`}>
    <div className="relative flex flex-col items-center justify-center">
      {/* Layer 1: PRESENTES (Large, Beige, 45% Opacity, -1 tracking, Bowlby One SC) */}
      <span 
        className={`font-bowlby text-[#e8dcc8] opacity-45 uppercase leading-none tracking-[-0.08em] ${
          small ? 'text-4xl' : 'text-5xl sm:text-7xl'
        }`}
      >
        PRESENTES
      </span>
      
      {/* Layer 2: personalizados (Brown, Smaller, Overlapping bottom, Monsieur La Doulaise) */}
      <span 
        className={`absolute bottom-[10%] font-monsieur text-[#3A312D] opacity-100 whitespace-nowrap z-10 ${
          small ? 'text-lg' : 'text-2xl sm:text-4xl'
        }`}
      >
        personalizados
      </span>
    </div>

    {/* Signature: by Julia Aleixo (Next to the block, Centered, Black, Mea Culpa Font) */}
    <div className="flex items-center h-full pt-2">
      <span className="font-mea-culpa text-black whitespace-nowrap leading-none text-[12px]">
        by Julia Aleixo
      </span>
    </div>
  </div>
);
