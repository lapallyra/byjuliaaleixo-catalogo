import React from 'react';
import { useLocation } from 'react-router-dom';

export const TopAnnouncementBar: React.FC = () => {
  const location = useLocation();
  
  // Hide on admin routes to prevent overlapping with panel elements
  const isAdminPath = location.pathname.startsWith('/admin');
  
  if (isAdminPath) return null;

  return (
    <div 
      className="bg-[#4A3525] text-[#F8F8F6] text-center py-1 px-4 text-[9px] font-semibold uppercase tracking-widest select-none relative z-50 border-b border-[#FAF9F6]/5 flex justify-center items-center font-sans"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1.5 flex-wrap leading-relaxed">
        <span>Compras acima de</span>
        <span className="text-[#E2C08A] font-extrabold text-[11px] sm:text-[13px] tracking-wide px-1.5 py-0.5 rounded-md bg-[#FAF9F6]/5 bg-opacity-10 border border-[#E2C08A]/10 shadow-xs">
          R$ 300,00
        </span>
        <span className="text-[#E2C08A] font-black text-[11px] sm:text-[13px] tracking-normal px-1 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 animate-pulse">
          GANHA
        </span>
        <span>o direito de rodar a roleta com brindes exclusivos.</span>
      </div>
    </div>
  );
};
