import React, { useState } from 'react';
import { Search, User as UserIcon, ShoppingBag } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthProvider';

interface SiteHeaderProps {
  onOpenSearch?: () => void;
  cartCount?: number;
  onCartClick?: () => void;
}

/**
 * SiteHeader:
 * Header superior nobre e clean com escrita cursiva dourada neon "MADRINHA"
 * e barra de navegação oficial da nova arquitetura:
 * - LANDINGPAGE (Início)
 * - LOJA (Catálogo Completo)
 * - MONTE SEU KIT
 * - KIT PRONTO
 * - LISTA DE PRESENTES
 */
export const SiteHeader: React.FC<SiteHeaderProps> = ({ cartCount = 0, onCartClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchCode, setSearchCode] = useState('');

  const currentPath = location.pathname;

  const navLinks = [
    { label: 'Início', path: '/', isExact: true },
    { label: 'Loja', path: '/loja', isExact: false, matchPrefixes: ['/loja', '/vitrine', '/produtos'] },
    { label: 'Monte seu Kit', path: '/monte-seu-kit', isExact: false, matchPrefixes: ['/monte-seu-kit', '/kit-meukit', '/comomontar'] },
    { label: 'Kit Pronto', path: '/kits', isExact: false, matchPrefixes: ['/kits'] },
    { label: 'Lista de Presentes', path: '/listadepresentes', isExact: false, matchPrefixes: ['/listadepresentes', '/consulta'] },
  ];

  const isLinkActive = (link: typeof navLinks[0]) => {
    if (link.isExact) return currentPath === link.path;
    if (link.matchPrefixes) {
      return link.matchPrefixes.some(p => currentPath.startsWith(p));
    }
    return currentPath.startsWith(link.path);
  };

  return (
    <header className="w-full relative z-30 select-none bg-[linear-gradient(180deg,#F2EAE0_0%,#F7F2EA_58%,#FAF8F5_100%)]">
      {/* Glow champanhe ultra sutil unificando todo o cabeçalho */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_80%_at_50%_0%,rgba(212,175,55,0.10)_0%,rgba(250,248,245,0)_75%)] pointer-events-none" />

      {/* HEADER SUPERIOR NOBRE EM TONS PRÓXIMOS AO CORPO */}
      <div className="w-full py-2.5 sm:py-3.5 px-2 sm:px-3 relative">
        <div className="w-full flex items-center justify-between gap-3 relative z-10">
          {/* Busca Rápida no Topo (Esquerda) */}
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
              className="flex items-center gap-2 bg-white/70 border border-[#D4AF37]/30 rounded-full px-3.5 py-1.5 text-xs text-[#1B2537] hover:border-[#D4AF37]/65 focus-within:border-[#D4AF37] focus-within:bg-white/95 transition-all duration-200 w-full max-w-[240px]"
            >
              <Search size={13} strokeWidth={2} className="text-[#B38F4D] shrink-0" />
              <input 
                type="text" 
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Rastrear pedido..." 
                className="bg-transparent focus:outline-none w-full text-[#1B2537] placeholder-[#1B2537]/50 font-medium text-[11px] border-none p-0 tracking-[0.03em]" 
              />
            </form>
          </div>

          {/* Logotipo / Escrita Cursiva Nobre: "MADRINHA" */}
          <div 
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col items-center justify-center cursor-pointer group py-0.5"
            role="button"
            aria-label="Ir para a LandingPage Madrinha"
          >
            <span
              className="font-meaculpa text-4xl sm:text-5xl md:text-6xl text-[#0F2C59] leading-none tracking-wide text-center transition-all duration-300 group-hover:scale-[1.03]"
              style={{
                fontFamily: "'Mea Culpa', cursive",
                textShadow: '0 2px 18px rgba(212, 175, 55, 0.24)'
              }}
            >
              Madrinha
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#9E7B3B] font-sans font-semibold -mt-1 hidden sm:block">
              dos Personalizados
            </span>
          </div>

          {/* Ações Rápidas no Topo (Direita) */}
          <div className="flex items-center gap-2 sm:w-72 justify-end shrink-0">
            {/* Sacola de compras / Carrinho rápido */}
            <button
              onClick={() => {
                if (onCartClick) {
                  onCartClick();
                } else if (currentPath.startsWith('/loja')) {
                  window.dispatchEvent(new CustomEvent('open-cart-drawer'));
                } else {
                  navigate('/loja?openCart=true');
                }
              }}
              className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/75 hover:bg-white text-[#0F2C59] border border-[#D4AF37]/35 hover:border-[#D4AF37] flex items-center justify-center transition-all duration-200 group cursor-pointer"
              title="Sacola de Compras"
              aria-label="Sacola de Compras"
            >
              <ShoppingBag size={16} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#0F2C59] text-[#FAF8F5] border border-[#D4AF37]/70 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {/* Área do Cliente */}
            <button
              onClick={() => navigate('/minha-experiencia')}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/75 hover:bg-white text-[#0F2C59] border border-[#D4AF37]/35 hover:border-[#D4AF37] flex items-center justify-center transition-all duration-200 group cursor-pointer"
              title={user ? (user.displayName || 'Minha Conta') : 'Área do Cliente'}
              aria-label="Área do Cliente"
            >
              <UserIcon size={16} strokeWidth={1.8} className="transition-transform group-hover:scale-110" />
            </button>
          </div>
        </div>
      </div>

      {/* BARRA DE NAVEGAÇÃO INTEGRADA AO CORPO DO SITE */}
      <nav className={`w-full ${currentPath === '/' ? 'border-b-0' : 'border-b border-[#E8E2D5]/70'} px-2 sm:px-3 pt-0.5 pb-2.5 overflow-x-auto scrollbar-none relative z-10`}>
        <div className="w-full flex items-center justify-center gap-1 sm:gap-3 md:gap-5 whitespace-nowrap min-w-max">
          {navLinks.map((link) => {
            const active = isLinkActive(link);
            return (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-medium tracking-[0.14em] uppercase transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  active 
                    ? 'bg-[#D4AF37]/16 text-[#0F2C59] border border-[#D4AF37]/55 font-semibold' 
                    : 'text-[#1B2537]/70 hover:text-[#0F2C59] hover:bg-[#D4AF37]/10 border border-transparent'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${active ? 'bg-[#D4AF37]' : 'bg-transparent'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
