import React, { useState } from 'react';
import { Search, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

interface SiteHeaderProps {
  onOpenSearch?: () => void;
}

/**
 * SiteHeader:
 * Header superior nobre e clean com escrita cursiva dourada neon "MADRINHA".
 * A Faixa Link foi removida do topo e transformada em faixas editoriais explicativas na Home.
 */
export const SiteHeader: React.FC<SiteHeaderProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState('');

  return (
    <header className="w-full relative z-30 select-none">
      {/* HEADER SUPERIOR NOBRE EM AZUL PROFUNDO */}
      <div className="w-full bg-[#081220] border-b border-[#1A3150] py-2.5 sm:py-3.5 px-2 sm:px-3 md:px-4 relative overflow-hidden">
        {/* Glow de fundo sutil */}
        <div className="absolute inset-0 bg-radial from-[#D4AF37]/15 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-[1850px] mx-auto flex items-center justify-between gap-3 relative z-10">
          {/* Busca Rápida no Topo (Esquerda no Desktop / Compacta) */}
          <div className="flex items-center sm:w-72 shrink-0">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (searchCode.trim()) {
                  navigate(`/document?code=${searchCode.trim().toUpperCase()}`);
                } else {
                  navigate('/document');
                }
              }}
              className="flex items-center gap-2 bg-[#0F2038] border border-[#23456F] rounded-full px-3.5 py-1.5 text-xs text-[#E5C388] shadow-inner hover:border-[#D4AF37]/60 transition-all duration-200 w-full max-w-[240px]"
            >
              <Search size={13} strokeWidth={2} className="text-[#D4AF37] shrink-0" />
              <input 
                type="text" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Rastrear pedido..." 
                className="bg-transparent focus:outline-none w-full text-[#FAF8F5] placeholder-[#8EA4C7]/80 font-medium text-[11px] border-none p-0 tracking-[0.03em]" 
              />
            </form>
          </div>

          {/* Logotipo / Escrita Dourada Neon Cursiva: "MADRINHA" */}
          <div 
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer group py-0.5"
            role="button"
            aria-label="Ir para a página inicial Madrinha"
          >
            <span
              className="font-meaculpa text-4xl sm:text-5xl md:text-6xl text-[#FBF3D5] leading-none tracking-wide text-center transition-all duration-300 group-hover:scale-105"
              style={{
                fontFamily: "'Mea Culpa', cursive",
                color: '#FFF6D6',
                textShadow: `
                  0 0 7px rgba(255, 235, 170, 0.95),
                  0 0 15px rgba(245, 206, 110, 0.85),
                  0 0 28px rgba(212, 175, 55, 0.75),
                  0 0 45px rgba(184, 134, 11, 0.6),
                  0 0 70px rgba(160, 115, 10, 0.35)
                `,
                filter: 'drop-shadow(0 2px 8px rgba(212, 175, 55, 0.4))'
              }}
            >
              Madrinha
            </span>
          </div>

          {/* Ações Rápidas no Topo (Direita) */}
          <div className="flex items-center gap-2 sm:w-72 justify-end shrink-0">
            <button
              onClick={() => navigate('/minha-experiencia')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0F2038] hover:bg-[#162F52] text-[#E5C388] border border-[#23456F] flex items-center justify-center transition-all duration-200 shadow-2xs group cursor-pointer"
              title={user ? (user.displayName || 'Minha Conta') : 'Área do Cliente'}
              aria-label="Área do Cliente"
            >
              <UserIcon size={16} strokeWidth={2} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
