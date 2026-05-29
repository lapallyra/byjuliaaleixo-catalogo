import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface SuccessOverlayProps {
  onContinue: () => void;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-[#FAF9F6]/95 backdrop-blur-sm flex items-center justify-center z-[9999] overflow-hidden">
      <div className="relative flex flex-col items-center justify-center text-center px-6 max-w-md w-full">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', delay: 0.2, duration: 0.8 }}
          className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-8 shadow-sm"
        >
          <Check size={40} className="text-emerald-500" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-6 text-center"
        >
          <p className="text-base font-semibold text-slate-800 leading-relaxed tracking-wide whitespace-pre-line max-w-[340px] mx-auto font-sans">
            {"Agradeço por permitir que nosso ateliê\nfaça parte desse momento tão especial.\nSerá uma honra receber você novamente\nsempre que quiser um presente personalizado,\nvolte 🤍"}
          </p>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          onClick={onContinue}
          className="mt-12 w-full py-4 px-8 bg-slate-900 text-white font-sans font-bold text-[10px] rounded-2xl uppercase tracking-widest shadow-lg hover:shadow-xl hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Retornar ao Catálogo
        </motion.button>
      </div>
    </div>
  );
};
