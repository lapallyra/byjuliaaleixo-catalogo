import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC<{ fullScreen?: boolean }> = ({ fullScreen = true }) => {
  return (
    <div className={`${fullScreen ? 'min-h-screen' : 'py-20'} bg-[#FDFCFA] flex flex-col items-center justify-center font-sans`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center"
      >
        <div className="relative mb-8">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-[#3D2E24]/10"
          >
            <Loader2 size={48} strokeWidth={1} />
          </motion.div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-[#3D2E24]/40 rounded-full animate-pulse" />
          </div>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-[#3D2E24] font-mea-culpa text-3xl mb-1 opacity-80">
            by Julia Aleixo
          </span>
          <div className="flex items-center gap-3">
            <div className="w-8 h-[1px] bg-[#3D2E24]/10" />
            <span className="text-[#3D2E24]/40 font-sans text-[9px] uppercase tracking-[0.4em] font-medium">
              Sincronizando Afeto
            </span>
            <div className="w-8 h-[1px] bg-[#3D2E24]/10" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
