import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, ArrowLeft, Menu, X } from 'lucide-react';
import { useCart } from '../hooks/useCart';

interface VitrineHeaderProps {
  onOpenCart: () => void;
}

export const VitrineHeader: React.FC<VitrineHeaderProps> = ({ onOpenCart }) => {
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-[#D4AF37] font-medium' : 'text-[#6D5443] hover:text-[#111111]';
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DCC8]/40 shadow-sm transition-all duration-300">
      {/* Top Banner Announcement */}
      <div className="w-full bg-[#111111] text-[#FAF8F5] text-[10px] md:text-xs py-2 px-4 text-center font-sans tracking-[0.16em] uppercase select-none">
        ✨ Ateliê V2 • Peças Exclusivas Artesanais & Personalização de Luxo
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Back to Home Button (discrete and helpful) */}
          <div className="hidden lg:flex items-center gap-2">
            <Link 
              to="/" 
              className="group flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest text-[#6D5443]/70 hover:text-[#111111] transition-all"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Voltar à Home</span>
            </Link>
          </div>

          {/* Left Action for Mobile Menu */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[#6D5443] hover:text-[#111111] hover:scale-105 active:scale-95 transition-all p-1"
              id="mobile-menu-btn"
            >
              {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>

          {/* Central Logo */}
          <div className="text-center absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center select-none">
            <Link to="/vitrine-v2" className="flex flex-col items-center">
              <span className="font-serif text-xl sm:text-2xl font-semibold tracking-[0.15em] text-[#111111] uppercase">
                Vitrine <span className="text-[#D4AF37] font-serif italic font-normal tracking-wide">Ateliê</span>
              </span>
              <span className="text-[7.5px] font-bold uppercase tracking-[0.3em] text-[#6D5443]/60 font-sans mt-0.5">
                V2 • LUXO COLECIONÁVEL
              </span>
            </Link>
          </div>

          {/* Right Navigation Controls */}
          <div className="flex items-center gap-4.5 sm:gap-6">
            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-8 text-[11px] font-bold uppercase tracking-[0.18em]">
              <Link to="/vitrine-v2" className={`${isActive('/vitrine-v2')} transition-all`}>
                Novidades
              </Link>
              <Link to="/vitrine-v2/catalogo" className={`${isActive('/vitrine-v2/catalogo')} transition-all`}>
                Catálogo
              </Link>
              <span className="text-[#E8DCC8] select-none">|</span>
              <span className="text-[#6D5443]/40 cursor-default select-none group relative">
                Premium
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-[#111111] text-white text-[8px] tracking-normal py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                  Breve
                </span>
              </span>
            </nav>

            {/* Shopping Bag trigger */}
            <button
              onClick={onOpenCart}
              className="relative p-2.5 bg-[#FAF8F5] border border-[#E8DCC8]/65 hover:border-[#D4AF37]/50 text-[#111111] rounded-full hover:scale-105 active:scale-95 cursor-pointer transition-all duration-300 flex items-center justify-center"
              id="header-cart-btn"
            >
              <ShoppingBag size={18} className="text-[#111111]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#111111] text-[#FAF8F5] text-[9px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-white animate-bounce-short">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Slide */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[calc(100%)] left-0 w-full bg-white border-b border-[#E8DCC8]/60 shadow-lg p-5 z-50 animate-fade-in">
          <div className="flex flex-col gap-4 font-sans text-xs uppercase tracking-[0.18em] font-bold py-2">
            <Link 
              to="/vitrine-v2" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2 border-b border-[#FAF8F5] ${isActive('/vitrine-v2')}`}
            >
              Início / Novidades
            </Link>
            <Link 
              to="/vitrine-v2/catalogo" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`py-2 border-b border-[#FAF8F5] ${isActive('/vitrine-v2/catalogo')}`}
            >
              Catálogo de Presentes
            </Link>
            <Link 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="py-2 text-[#C96B71]"
            >
              Página Principal (Home)
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
