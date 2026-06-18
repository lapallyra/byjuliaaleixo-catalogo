import React from 'react';
import { motion } from 'motion/react';

export const MaintenancePage = () => {
  return (
    <div className="min-h-screen bg-[#0B0B0D] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Decorative Glow */}
      <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px] animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className="relative z-10 text-center max-w-sm"
      >
        <h1 className="text-5xl md:text-6xl font-serif text-[#FFFFFF] mb-4">La Pallyra</h1>
        <div className="w-24 h-px bg-[#D4AF37] mx-auto mb-8" />
        <p className="text-xl text-[#D4AF37] mb-6 font-light tracking-wide">Estamos refinando cada detalhe.</p>
        <p className="text-[#A0A0A0] text-sm mb-12 leading-relaxed font-light">
          Nosso ateliê encontra-se em manutenção para aprimorar sua experiência, tornando-a ainda mais elegante e fluida.
        </p>
        <p className="font-serif italic text-[#D4AF37]/80 text-sm">Voltamos em breve com uma nova experiência.</p>
      </motion.div>
    </div>
  );
};
