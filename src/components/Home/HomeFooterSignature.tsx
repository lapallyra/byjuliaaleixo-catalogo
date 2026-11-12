import React from 'react';
import { Heart } from 'lucide-react';

export const HomeFooterSignature: React.FC = () => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[#E8E2D5] text-center select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4A5568]">
        
        {/* Left: Brand motto */}
        <div className="flex items-center gap-2">
          <Heart size={12} strokeWidth={1.5} className="text-[#D4AF37]" />
          <span className="font-light text-[#4A5568]">Feito à mão com afeto e dedicação aos detalhes.</span>
        </div>

        {/* Center: Signature mark */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#1B2537] font-medium">
          <span className="text-[#D4AF37]">◇</span>
          <span className="font-meaculpa text-2xl text-[#0F2C59] tracking-normal font-normal capitalize">
            by Júlia Aleixo
          </span>
          <span className="text-[#D4AF37]">◇</span>
        </div>

        {/* Right: Empty spacer for symmetry */}
        <div className="hidden sm:block w-24" />

      </div>
    </div>
  );
};
