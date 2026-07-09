import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface SuccessOverlayProps {
  onContinue: () => void;
  orderCode?: string;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({ onContinue, orderCode }) => {
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
          className="space-y-8 text-center"
        >
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight">Pedido recebido com sucesso</h2>
            {orderCode && (
              <div className="mt-2 inline-block px-4 py-1.5 bg-neutral-100 rounded-full">
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mr-2">Código:</span>
                <span className="text-xs font-bold text-neutral-900 font-mono tracking-wider">{orderCode}</span>
              </div>
            )}
            <p className="text-sm text-neutral-600 leading-relaxed max-w-[340px] mx-auto pt-2">
              Recebemos seu pedido e ele já está em nosso sistema. Nossa equipe realizará a conferência das informações enviadas e entrará em contato pelo canal informado para seguir com os próximos passos.
            </p>
          </div>

          <div className="space-y-3 pt-4 border-t border-neutral-100">
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-700">
              <Check size={14} className="text-emerald-600" /> <span>Pedido registrado</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-700">
              <Check size={14} className="text-emerald-600" /> <span>Dados recebidos com sucesso</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-neutral-700">
              <Check size={14} className="text-emerald-600" /> <span>Atendimento disponível para dúvidas</span>
            </div>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          onClick={onContinue}
          className="mt-12 w-full py-4 px-8 bg-neutral-900 text-white font-bold text-xs rounded-xl uppercase tracking-widest shadow-md hover:bg-neutral-800 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          Continuar comprando
        </motion.button>
      </div>
    </div>
  );
};
