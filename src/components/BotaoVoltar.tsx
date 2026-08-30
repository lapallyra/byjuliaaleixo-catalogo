import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface BotaoVoltarProps {
  variant?: 'light' | 'dark';
  onClick?: () => void;
}

export const BotaoVoltar: React.FC<BotaoVoltarProps> = ({ variant = 'light', onClick }) => {
  const navigate = useNavigate();
  const isLight = variant === 'light';
  
  const handleBack = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(-1);
    }
  };
  
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: -5 }}
      onClick={handleBack}
      className={`flex items-center gap-2 sm:gap-2.5 transition-colors group fixed top-24 sm:top-28 md:top-32 left-2 sm:left-3 md:left-4 z-40 cursor-pointer ${
        isLight ? 'text-white/80 hover:text-white' : 'text-[#3D2E24]/70 hover:text-[#3D2E24]'
      }`}
    >
      <div className={`w-10 h-10 rounded-full border flex items-center justify-center backdrop-blur-md transition-all ${
        isLight 
          ? 'border-white/20 bg-black/10 group-hover:border-white/40' 
          : 'border-[#E8DCC8] bg-white/50 group-hover:border-[#3D2E24]/20'
      }`}>
        <ArrowLeft size={18} />
      </div>
      <span className="text-[10px] uppercase tracking-[0.2em] font-bold">Voltar</span>
    </motion.button>
  );
};
