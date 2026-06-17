import React from 'react';
import { Eye, ShoppingBag, Sparkles } from 'lucide-react';
import { Product, CompanyId } from '../types';
import { ImageWithFallback } from './ImageWithFallback';

interface HomeProductCardProps {
  product: Product;
  variant: 'promotion' | 'premium';
  onClick: () => void;
  getCompanyLabelAndColor: (companyId: CompanyId) => { label: string; bg: string; text: string };
}

export const HomeProductCard: React.FC<HomeProductCardProps> = ({
  product,
  variant,
  onClick,
  getCompanyLabelAndColor,
}) => {
  const brand = getCompanyLabelAndColor(product.company);
  
  // Decide unique premium badge labels based on product categories/keys
  const getPremiumTag = () => {
    if (product.isKit) return "Kit Exclusivo";
    if (product.category?.toLowerCase().includes('maternidade')) return "Produção Artesanal";
    if (product.category?.toLowerCase().includes('papelaria')) return "Feito sob encomenda";
    return "Personalização Exclusiva";
  };

  const discountAmount = product.original_price && product.original_price > product.current_price
    ? Math.round(((product.original_price - product.current_price) / product.original_price) * 100)
    : 0;

  if (variant === 'premium') {
    // PREMIUM CARD - FOR KITS & PREMIUM HANDMADE ITEMS
    return (
      <div
        onClick={onClick}
        className="group relative flex flex-col justify-between bg-white border border-[#e8dcc8]/40 rounded-[20px] shadow-[0_4px_16px_rgba(109,84,67,0.03)] hover:shadow-[0_8px_24px_rgba(109,84,67,0.07)] hover:border-[#cca062]/35 transition-all duration-500 ease-out cursor-pointer overflow-hidden p-3.5 sm:p-4.5"
      >
        {/* Editorial-style image with a gentle frame */}
        <div className="w-full aspect-[4/5] sm:aspect-square rounded-2xl overflow-hidden relative bg-[#faf8f5]">
          <ImageWithFallback
            src={product.image}
            alt={product.product_name}
            className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-102"
            isThumbnail={true}
          />
          
          {/* Subtle elegant hover overlay instead of heavy elements */}
          <div className="absolute inset-0 bg-[#3a312d]/3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="bg-white/95 text-[#6d5443] font-poppins font-medium rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.05)] py-2 px-4 flex items-center gap-2 text-[10px] uppercase tracking-wider">
              <Eye size={12} className="text-[#cca062]" /> Detalhes do Ateliê
            </span>
          </div>

          {/* Discreet luxurious ribbon seal: Exclusivo, Personalizado, etc. */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            <span className="text-[7.5px] uppercase tracking-[0.15em] bg-[#3A312D]/90 text-[#e8dcc8] px-2.5 py-1 rounded-full font-semibold shadow-3xs font-poppins backdrop-blur-xs">
              {getPremiumTag()}
            </span>
          </div>
        </div>

        {/* Editorial Text Layer with more whitespace */}
        <div className="pt-4 flex flex-col items-center text-center flex-grow justify-between">
          <div className="w-full">
            <span className="text-[7.5px] uppercase tracking-[0.15em] text-[#cca062] font-semibold mb-1 block font-poppins">
              {brand.label}
            </span>
            <h3 className="font-poppins font-semibold text-[11px] sm:text-xs text-[#3A312D] line-clamp-1 group-hover:text-[#cca062] transition-colors duration-300 px-1">
              {product.product_name}
            </h3>
            
            {/* Elegant luxury subtitle/description instead of a massive price block */}
            <p className="text-[9.5px] text-[#6d5443]/65 font-light leading-relaxed mt-1 mb-2 max-w-[190px] mx-auto truncate font-sans">
              {product.description || "Criado com afeto e materiais premium."}
            </p>
          </div>

          {/* Understated delicate pricing */}
          <div className="pt-2 mt-auto w-full border-t border-[#faf8f5]">
            <span className="text-[10px] sm:text-[11px] tracking-widest text-[#6d5443]/90 font-medium font-poppins block">
              Investimento de R$ {product.current_price?.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD/PROMOTIONAL CARD - FOR REGULAR SHOP ATELIER PRODUCTS
  return (
    <div
      onClick={onClick}
      className="group relative flex flex-col justify-between bg-white border border-[#e8dcc8]/35 rounded-[16px] shadow-[0_2px_10px_rgba(109,84,67,0.01)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(109,84,67,0.05)] hover:border-[#cca062]/40 transition-all duration-300 cursor-pointer overflow-hidden pb-2"
    >
      {/* Dynamic cover section (highly premium landscape aspect ratio to show more gracefully) */}
      <div className="w-full aspect-[4/3] bg-[#faf8f5] overflow-hidden relative">
        <ImageWithFallback
          src={product.image}
          alt={product.product_name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
          isThumbnail={true}
        />
        
        {/* Subtle visual overlay on hover */}
        <div className="absolute inset-0 bg-[#3a312d]/3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-[#6d5443] font-poppins font-medium rounded-full shadow-3xs py-1 px-2.5 flex items-center gap-1 text-[8px] uppercase tracking-wider">
            <Eye size={10} className="text-[#cca062]" /> Detalhes
          </span>
        </div>

        {/* Brand label pill */}
        <div className="absolute top-2 right-2">
          <span className="text-[6.5px] px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-widest bg-white/95 text-[#cca062] border border-[#cca062]/10 font-poppins">
            {brand.label}
          </span>
        </div>

        {/* Elegantly styled discount percentage */}
        {discountAmount > 0 && (
          <div className="absolute top-2 left-2">
            <span className="text-[6.5px] px-1.5 py-0.5 bg-[#c96b71]/10 text-[#c96b71] font-semibold rounded-full font-poppins border border-[#c96b71]/10">
              {discountAmount}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Structured Content Area with very balanced spacing */}
      <div className="p-2 sm:p-2.5 flex flex-col items-center text-center flex-grow justify-between gap-1.5">
        <div className="w-full">
          <span className="text-[7.5px] uppercase tracking-[0.12em] text-[#cca062] font-semibold block mb-0.5 font-poppins">
            {brand.label}
          </span>
          <h3 className="font-poppins font-medium text-[10px] sm:text-[11px] leading-snug text-[#3A312D] line-clamp-1 group-hover:text-[#cca062] transition-colors">
            {product.product_name}
          </h3>
        </div>

        {/* Pricing area */}
        <div className="w-full mt-auto">
          <div className="flex flex-col items-center justify-center">
            {product.original_price && product.original_price > product.current_price ? (
              <div className="flex items-center gap-1 leading-none">
                <span className="text-[8px] line-through text-[#6d5443]/40 tracking-wider">
                  R$ {product.original_price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[10px] sm:text-[11px] text-[#3A312D] font-bold tracking-wide font-poppins">
                  R$ {product.current_price?.toFixed(2).replace('.', ',')}
                </span>
              </div>
            ) : (
              <span className="text-[10px] sm:text-[11px] text-[#3A312D] font-bold tracking-wide font-poppins">
                R$ {product.current_price?.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          
          {/* Extremely compact clean bottom line */}
          <div className="mt-2 pt-1.5 border-t border-[#faf8f5] flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-[0.1em] font-medium text-[#6d5443]/60 group-hover:text-[#cca062] transition-colors font-poppins">
              Ver Opções
            </span>
            <span className="w-5 h-5 rounded-full bg-[#faf8f5] border border-[#e8dcc8]/20 group-hover:bg-[#3A312D] group-hover:text-white transition-all flex items-center justify-center text-[#cca062] shadow-3xs">
              <ShoppingBag size={8} strokeWidth={2.5} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
