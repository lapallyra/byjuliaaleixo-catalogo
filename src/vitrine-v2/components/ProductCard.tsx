import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Eye, Star } from 'lucide-react';
import { VitrineProduct } from '../data/products';
import { useCart } from '../hooks/useCart';

interface ProductCardProps {
  product: VitrineProduct;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isHovered, setIsHovered] = React.useState(false);

  const formattedPrice = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(product.price);

  const formattedOriginalPrice = product.originalPrice 
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.originalPrice)
    : null;

  const discountVal = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div 
      className="group relative bg-[#ffffff] border border-[#E8DCC8]/40 hover:border-[#D4AF37]/40 rounded-2xl overflow-hidden transition-all duration-300 shadow-[0_2px_12px_-5px_rgba(109,84,67,0.1)] hover:shadow-[0_8px_24px_rgba(109,84,67,0.12)] flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id={`product-card-${product.id}`}
    >
      {/* Upper Thumbnail Stage */}
      <div className="relative aspect-square overflow-hidden bg-[#FAF8F5] select-none">
        
        {/* Discount Badge */}
        {discountVal && (
          <span className="absolute top-3 left-3 z-10 bg-[#C96B71] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-sm">
            {discountVal}% Off
          </span>
        )}

        <Link to={`/vitrine-v2/produto/${product.id}`} className="absolute inset-0 block">
          <img
            src={isHovered && product.images[1] ? product.images[1] : product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />
        </Link>

        {/* Hover Fast Actions Bar */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
          <Link 
            to={`/vitrine-v2/produto/${product.id}`} 
            className="p-2.5 bg-white/90 text-[#111111] hover:bg-white rounded-xl transition-all duration-200 shadow-sm"
            title="Ver Detalhes"
          >
            <Eye size={16} />
          </Link>
          <button
            onClick={() => addToCart(product, 1)}
            className="p-2.5 bg-[#D4AF37]/90 hover:bg-[#D4AF37] text-white rounded-xl transition-all duration-200 cursor-pointer shadow-sm flex items-center gap-1 text-xs font-semibold px-4"
            title="Adicionar à Bolsa"
          >
            <ShoppingBag size={15} />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Info Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow select-none">
        <div className="flex items-center justify-between text-[10px] text-[#6D5443]/70 font-sans uppercase tracking-[0.14em] mb-1.5 font-bold">
          <span>{product.category}</span>
          <span className="flex items-center gap-1 text-[#D4AF37]">
            <Star size={11} className="fill-current" />
            <span className="text-[#111111] font-bold">{product.rating.toFixed(1)}</span>
          </span>
        </div>

        <Link 
          to={`/vitrine-v2/produto/${product.id}`}
          className="font-serif text-sm sm:text-[15.5px] font-bold text-[#111111] hover:text-[#D4AF37] tracking-normal leading-snug mb-1 transition-colors block"
        >
          {product.name}
        </Link>

        <p className="font-sans text-[11.5px] text-[#6D5443]/85 line-clamp-2 leading-relaxed mb-4">
          {product.tagline}
        </p>

        {/* Price & Cart row for mobile (always visible) or immediate visual footer */}
        <div className="mt-auto flex items-end justify-between pt-3 border-t border-[#E8DCC8]/25">
          <div className="flex flex-col">
            {formattedOriginalPrice && (
              <span className="text-[10px] sm:text-xs text-[#6D5443]/50 line-through font-sans leading-none mb-0.5">
                {formattedOriginalPrice}
              </span>
            )}
            <span className="font-sans text-[13.5px] sm:text-[15.5px] font-bold text-[#111111] leading-none">
              {formattedPrice}
            </span>
          </div>

          {/* Quick-buy icon button displayed cleanly */}
          <button
            onClick={() => addToCart(product, 1)}
            className="md:hidden p-2 bg-[#D4AF37] hover:bg-[#C5A028] text-white rounded-lg transition-all duration-300 shadow-sm active:scale-95 flex items-center justify-center cursor-pointer"
            id={`fast-buy-${product.id}`}
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
