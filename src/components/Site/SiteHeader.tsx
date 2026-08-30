import React, { useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

interface SiteHeaderProps {
  onOpenSearch?: () => void;
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({ onOpenSearch }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState('');

  return (
    <div className="w-full border-b border-[#E8DFC8]/40 bg-[#FDFCFA]/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="w-full mx-auto px-2 sm:px-3 md:px-4 py-2.5 flex flex-col lg:flex-row justify-between items-center gap-3 md:gap-4">
        
        {/* Centered navigation links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 gap-y-1.5 text-[#1F1F1F] tracking-[0.08em] font-medium text-[11px] sm:text-[12px] select-none font-poppins">
          <button 
            onClick={() => navigate('/')} 
            className="px-2.5 py-1 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium cursor-pointer"
          >
            Início
          </button>
          
          {/* Ateliers Dropdown */}
          <div className="relative group">
            <button 
              onClick={() => navigate('/atelies')} 
              className="px-2.5 py-1 rounded-full text-[#666666] group-hover:text-[#1F1F1F] group-hover:bg-[#F2ECE1]/50 transition-all duration-150 ease-in-out font-medium cursor-pointer flex items-center gap-1"
            >
              <span>Ateliês</span>
              <span className="text-[9px] opacity-60">▼</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-52 bg-[#FAF7F2] border border-[#E8DFC8] rounded-xl shadow-lg py-2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 z-50">
              <button
                onClick={() => navigate('/lapallyra')}
                className="w-full px-4 py-2 text-left text-xs text-[#3A312D] hover:bg-[#EFE8DC] transition-colors flex items-center justify-between"
              >
                <span className="font-medium">La Pallyra</span>
                <span className="text-[10px] text-[#8C6D37]">Papelaria</span>
              </button>
              <button
                onClick={() => navigate('/mimadasim')}
                className="w-full px-4 py-2 text-left text-xs text-[#3A312D] hover:bg-[#EFE8DC] transition-colors flex items-center justify-between"
              >
                <span className="font-medium">Mimada Sim</span>
                <span className="text-[10px] text-[#8C6D37]">Lembranças</span>
              </button>
              <button
                onClick={() => navigate('/tuttymimo')}
                className="w-full px-4 py-2 text-left text-xs text-[#3A312D] hover:bg-[#EFE8DC] transition-colors flex items-center justify-between"
              >
                <span className="font-medium">Tutty Mimo</span>
                <span className="text-[10px] text-[#8C6D37]">Maternidade</span>
              </button>
              <button
                onClick={() => navigate('/comamorguennita')}
                className="w-full px-4 py-2 text-left text-xs text-[#3A312D] hover:bg-[#EFE8DC] transition-colors flex items-center justify-between"
              >
                <span className="font-medium">com amor, Guennita</span>
                <span className="text-[10px] text-[#8C6D37]">Cartonagem</span>
              </button>
              <div className="border-t border-[#E8DFC8]/60 mt-1 pt-1">
                <button
                  onClick={() => navigate('/atelies')}
                  className="w-full px-4 py-1.5 text-left text-[11px] text-[#8C6D37] hover:bg-[#EFE8DC] transition-colors font-semibold"
                >
                  Conhecer todos os Ateliês →
                </button>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate('/comomontar')} 
            className="px-2.5 py-1 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none font-semibold text-[11px] sm:text-[12px]"
          >
            Monte seu kit
          </button>

          <button 
            onClick={() => navigate('/personalize')} 
            className="px-2.5 py-1 rounded-full text-[#8C6D37] hover:text-[#2C1810] font-semibold hover:bg-[#FAF0E6] transition-all duration-150 ease-in-out cursor-pointer outline-none text-[11px] sm:text-[12px]"
          >
            Personalize
          </button>
          
          <button 
            onClick={() => navigate('/sobrenos')} 
            className="px-2.5 py-1 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium cursor-pointer"
          >
            Sobre nós
          </button>
          
          <button 
            onClick={() => navigate('/feedclientes')} 
            className="px-2.5 py-1 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out font-medium cursor-pointer"
          >
            Feedback
          </button>
          
          <button 
            onClick={() => navigate('/listadepresentes')} 
            className="px-2.5 py-1 rounded-full text-[#666666] hover:text-[#1F1F1F] transition-all duration-150 ease-in-out cursor-pointer outline-none font-semibold text-[11px] sm:text-[12px]"
          >
            Lista de presentes
          </button>
        </nav>

        {/* Right Action: Busto (Profile Icon) + Order Search Capsule */}
        <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
          {/* Busto (Ícone de Perfil/Login sem texto escrito) */}
          <button
            onClick={() => navigate('/minha-experiencia')}
            className="w-9 h-9 rounded-full bg-[#FAF6F0] hover:bg-[#2C1810] text-[#8C6D37] hover:text-white border border-[#E8DFC8] flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs group cursor-pointer"
            title={user ? (user.displayName || 'Minha Conta') : 'Área do Cliente'}
            aria-label="Área do Cliente"
          >
            <UserIcon size={17} strokeWidth={2} className="transition-transform group-hover:scale-110" />
          </button>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (searchCode.trim()) {
                navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
              } else {
                navigate('/document');
              }
            }}
            className="flex items-center gap-2.5 bg-white border border-[#EAE4DC] rounded-full px-4 py-2 text-xs text-[#555555] shadow-[0_2px_6px_rgba(0,0,0,0.02)] hover:border-[#C2B7A8] hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 w-full sm:w-64 md:w-72"
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
    </div>
  );
};
