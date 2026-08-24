import React from 'react';
import { Sparkles, Heart, Eye } from 'lucide-react';

interface HomeFooterSignatureProps {
  onReopenCurtain?: () => void;
}

export const HomeFooterSignature: React.FC<HomeFooterSignatureProps> = ({ onReopenCurtain }) => {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-[#D4AF37]/25 text-center select-none">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8C6D37]">
        
        {/* Left: Brand motto */}
        <div className="flex items-center gap-2">
          <Heart size={12} strokeWidth={1.5} className="text-[#B38F4D]" />
          <span className="font-light text-[#593E32]">Feito à mão com afeto e dedicação aos detalhes.</span>
        </div>

        {/* Center: Signature mark */}
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-[#2C1810] font-medium">
          <span className="text-[#8C6D37]">◇</span>
          <span className="font-meaculpa text-2xl text-[#8C6D37] tracking-normal font-normal capitalize">
            by Júlia Aleixo
          </span>
          <span className="text-[#8C6D37]">◇</span>
        </div>

        {/* Right: Action to replay opening curtain */}
        {onReopenCurtain && (
          <button
            type="button"
            onClick={onReopenCurtain}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#D4AF37]/30 hover:border-[#B38F4D] text-[#8C6D37] hover:text-[#2C1810] transition-colors text-[11px] cursor-pointer"
          >
            <Eye size={12} strokeWidth={1.5} />
            <span>Rever Abertura</span>
          </button>
        )}

      </div>
    </div>
  );
};
