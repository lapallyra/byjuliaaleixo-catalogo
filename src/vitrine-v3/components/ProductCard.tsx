import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ArrowRight, Sparkles } from 'lucide-react';
import { VitrineV3Product } from '../data/products';

interface ProductCardProps {
  product: VitrineV3Product;
  isCampaignActive?: boolean;
}

export const ProductCardV3: React.FC<ProductCardProps> = ({ product, isCampaignActive }) => {
  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)
    : null;

  return (
    <div className="group bg-white border border-[#E8DCC8]/40 hover:border-[#D4AF37]/50 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-lg flex flex-col justify-between h-full select-none">
      
      {/* Top Image area */}
      <div className="relative aspect-square overflow-hidden bg-[#FAF8F5]">
        
        {/* Absolute badges */}
        <div className="absolute top-3.5 left-3.5 z-10 flex flex-col gap-1.5 items-start">
          {product.badge && (
            <span className="bg-neutral-900 text-white text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded">
              {product.badge}
            </span>
          )}

          {isCampaignActive && (
            <span className="bg-[#D4AF37] text-neutral-950 text-[8px] font-black uppercase tracking-[0.16em] px-2.5 py-1 rounded flex items-center gap-1 shadow-sm">
              <Sparkles size={9} className="fill-current" />
              <span>Campanha Ativa</span>
            </span>
          )}
        </div>

        {/* Rating overlay badge */}
        <div className="absolute bottom-3 right-3 z-10 bg-white/95 backdrop-blur-xs px-2 py-0.8 rounded-md flex items-center gap-1 border border-[#E8DCC8]/25 shadow-xs">
          <Star size={11} className="text-[#D4AF37] fill-[#D4AF37]" />
          <span className="text-[10px] font-bold text-neutral-900 font-mono">{product.rating.toFixed(1)}</span>
        </div>

        {/* Product Image */}
        <img 
          src={product.images[0]} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          referrerPolicy="no-referrer"
        />

        {/* Hover quick action panel */}
        <div className="absolute inset-0 bg-neutral-950/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
          <Link
            to={`/vitrine-v3/produto/${product.id}`}
            className="bg-white hover:bg-[#D4AF37] text-[#111111] hover:text-white text-[9.5px] font-bold uppercase tracking-widest py-2.8 px-5 rounded-xl shadow-md transition-all transform translate-y-3 group-hover:translate-y-0 duration-300 flex items-center gap-1.5"
          >
            <span>Ver Detalhes</span>
            <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Body Metadata area */}
      <div className="p-4.5 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-[#6D5443]">
            <span>{product.category}</span>
            <span className="text-neutral-400 font-normal">{product.reviewsCount} avaliações</span>
          </div>

          <h3 className="font-serif text-sm sm:text-base font-bold text-[#111111] leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-1">
            <Link to={`/vitrine-v3/produto/${product.id}`}>
              {product.name}
            </Link>
          </h3>
          
          <p className="font-sans text-[11px] text-[#6D5443] line-clamp-2 leading-relaxed">
            {product.tagline}
          </p>
        </div>

        {/* Pricing area */}
        <div className="pt-2.5 border-t border-[#E8DCC8]/20 flex items-center justify-between">
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <span className="text-[10px] text-neutral-400 line-through leading-none mb-0.5">
                {formattedOriginalPrice}
              </span>
            )}
            <span className="text-xs sm:text-sm font-black text-[#111111] font-mono leading-none">
              {formattedPrice}
            </span>
          </div>

          <Link
            to={`/vitrine-v3/produto/${product.id}`}
            className="text-[9.5px] font-black uppercase tracking-wider text-[#111111] hover:text-[#D4AF37] transition-colors flex items-center gap-1"
          >
            <span>Personalizar</span>
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>

    </div>
  );
};
