import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SiteHeaderProps {
  onOpenSearch?: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const [searchCode, setSearchCode] = useState('');

  return (
    <div className="w-full border-b border-[#E8DFC8]/40 bg-[#FDFCFA]/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-[1850px] mx-auto px-4 md:px-8 py-3 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Centered navigation links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 text-[#1F1F1F] tracking-[0.1em] font-medium text-[11px] sm:text-[12px] select-none font-poppins">
          <button 
            onClick={() => navigate('/')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em] cursor-pointer"
          >
            Início
          </button>
          
          <button 
            onClick={() => navigate('/atelies')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em] cursor-pointer"
          >
            Ateliês
          </button>
          
          <button 
            onClick={() => navigate('/comomontar')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none font-semibold tracking-[0.12em] text-[11px] sm:text-[12px]"
          >
            Monte seu kit
          </button>
          
          <button 
            onClick={() => navigate('/sobrenos')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em] cursor-pointer"
          >
            Sobre nós
          </button>
          
          <button 
            onClick={() => navigate('/feedclientes')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium tracking-[0.12em] cursor-pointer"
          >
            Feedback
          </button>
          
          <button 
            onClick={() => navigate('/listadepresentes')} 
            className="px-3 py-1.5 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none font-semibold tracking-[0.12em] text-[11px] sm:text-[12px]"
          >
            Lista de presentes
          </button>
        </nav>

        {/* Search/Tracking capsule */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (searchCode.trim()) {
              navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
            } else {
              navigate('/document');
            }
          }}
          className="flex items-center gap-2.5 bg-white border border-[#EAE4DC] rounded-full px-5 py-2.5 text-xs text-[#555555] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#C2B7A8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 w-full sm:w-72 md:w-80"
        >
          <Search size={14} strokeWidth={2} className="text-[#8C7864]/80 shrink-0" />
          <input 
            type="text" 
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Encontre seu pedido aqui..." 
            className="bg-transparent focus:outline-none w-full text-[#1F1F1F] placeholder-[#8C7864]/60 font-medium text-[13px] border-none p-0 tracking-[0.03em]" 
          />
        </form>
      </div>
    </div>
  );
};
