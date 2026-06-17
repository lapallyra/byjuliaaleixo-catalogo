import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Sparkles, MapPin, Gift, PhoneCall } from 'lucide-react';
import { useCartV3 } from '../core/cart/useCart';

interface VitrineHeaderProps {
  onOpenCart: () => void;
}

export const VitrineHeaderV3: React.FC<VitrineHeaderProps> = ({ onOpenCart }) => {
  const { cartItemsCount } = useCartV3();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E8DCC8]/30 transition-all select-none">
      
      {/* Top microbar */}
      <div className="bg-[#111111] text-white py-1.8 px-4 text-center text-[7.5px] sm:text-[9.5px] font-bold uppercase tracking-[0.22em] flex items-center justify-center gap-1.5 sm:gap-3">
        <Sparkles size={11} className="text-[#D4AF37] animate-pulse" />
        <span>Campanha Ativa: Monogramas Clássicos em Ouro Real • Frete Reduzido d\'Ateliê</span>
        <div className="hidden md:flex items-center gap-1.5 text-neutral-400">
          <span>•</span>
          <Gift size={11} className="text-[#D4AF37]" />
          <span>Fitas e Embalagens Inclusas</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Slogan Column */}
          <div className="flex items-center gap-2">
            <Link to="/vitrine-v3" className="flex flex-col items-start leading-none group">
              <span className="font-serif text-base sm:text-lg font-black uppercase text-[#111111] tracking-[0.16em] group-hover:text-[#D4AF37] transition-colors">
                Julia Aleixo
              </span>
              <span className="text-[8px] sm:text-[9px] font-medium uppercase tracking-[0.3em] text-[#6D5443] mt-0.5">
                Ateliê • Vitrine V3
              </span>
            </Link>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-[11px] font-bold uppercase tracking-widest text-[#1c1c1c]">
            <Link 
              to="/vitrine-v3" 
              className={`hover:text-[#D4AF37] transition-all relative py-1 ${
                isActive('/vitrine-v3') ? 'text-[#D4AF37] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D4AF37]' : 'text-neutral-700'
              }`}
            >
              Início
            </Link>
            <Link 
              to="/vitrine-v3/catalogo" 
              className={`hover:text-[#D4AF37] transition-all relative py-1 ${
                isActive('/vitrine-v3/catalogo') ? 'text-[#D4AF37] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D4AF37]' : 'text-neutral-700'
              }`}
            >
              Catálogo Coletivo
            </Link>
            <Link 
              to="/vitrine-v3/carrinho" 
              className={`hover:text-[#D4AF37] transition-all relative py-1 ${
                isActive('/vitrine-v3/carrinho') ? 'text-[#D4AF37] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#D4AF37]' : 'text-neutral-700'
              }`}
            >
              Minha Bolsa
            </Link>
          </nav>

          {/* Right Action Trigger Buttons */}
          <div className="flex items-center gap-3.5">
            
            {/* Quick Catalog link for tablet/mobile */}
            <Link 
              to="/vitrine-v3/catalogo"
              className="md:hidden text-[10px] font-bold uppercase tracking-widest text-[#6D5443] hover:text-[#111111]"
            >
              Catálogo
            </Link>

            <span className="h-4 w-px bg-[#E8DCC8]/50 hidden sm:block" />

            {/* Simulated Live User location marker */}
            <div className="hidden lg:flex items-center gap-1 text-[11px] text-[#6D5443] font-light">
              <MapPin size={13} className="text-[#D4AF37]" />
              <span>São Paulo, SP</span>
            </div>

            {/* Shopping Bag Icon with badges count */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-neutral-800 hover:text-[#D4AF37] transition-colors rounded-xl bg-[#FAF8F5] border border-[#E8DCC8]/30 cursor-pointer flex items-center gap-2 px-3 sm:px-4"
              id="header-v3-cart-bag-btn"
            >
              <ShoppingBag size={15} />
              <span className="text-[10px] sm:text-[11px] font-black font-mono leading-none">
                {cartItemsCount}
              </span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
