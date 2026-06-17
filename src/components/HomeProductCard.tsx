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
            <p className="text-[9.5px] text-[#6d5443]/65 font-light leading-relaxed mt-1 mb-2 max-w-[190px] mx-auto truncate font-tahoma">
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
      className="group relative flex flex-col justify-between bg-white border border-[#e8dcc8]/40 rounded-[20px] shadow-[0_4px_16px_rgba(109,84,67,0.01)] sm:hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(109,84,67,0.04)] hover:border-[#cca062]/35 transition-all duration-300 cursor-pointer overflow-hidden pb-3"
    >
      {/* Dynamic cover section (60-70% ratio) */}
      <div className="w-full aspect-[4/3] sm:aspect-square bg-[#faf8f5] overflow-hidden relative">
        <ImageWithFallback
          src={product.image}
          alt={product.product_name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-102"
          isThumbnail={true}
        />
        
        {/* Subtle, beautiful visual overlay on hover */}
        <div className="absolute inset-0 bg-[#3a312d]/3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/95 text-[#6d5443] font-poppins font-medium rounded-full shadow-2xs py-1.5 px-3.5 flex items-center gap-1.5 text-[9px] uppercase tracking-wider">
            <Eye size={12} className="text-[#cca062]" /> Visualizar
          </span>
        </div>

        {/* Brand label pill */}
        <div className="absolute top-2.5 right-2.5">
          <span className="text-[7px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-widest shadow-3xs border border-[#cca062]/10 bg-white/95 text-[#cca062] font-poppins backdrop-blur-xs">
            {brand.label}
          </span>
        </div>

        {/* Elegantly styled discount percentage - never looks cheap */}
        {discountAmount > 0 && (
          <div className="absolute top-2.5 left-2.5">
            <span className="text-[7.5px] px-2 py-0.5 bg-[#c96b71]/10 text-[#c96b71] font-semibold rounded-full font-poppins border border-[#c96b71]/10">
              {discountAmount}% OFF
            </span>
          </div>
        )}
      </div>

      {/* Structured Content Area */}
      <div className="p-3 flex flex-col items-center text-center flex-grow justify-between">
        <div className="w-full">
          <span className="text-[7.5px] uppercase tracking-[0.15em] text-[#cca062] font-semibold block mb-0.5 font-poppins">
            {brand.label}
          </span>
          <h3 className="font-poppins font-medium text-[10.5px] sm:text-[11.5px] leading-snug text-[#3A312D] line-clamp-1 group-hover:text-[#cca062] transition-colors mb-2">
            {product.product_name}
          </h3>
        </div>

        {/* Pricing & CTA Button area */}
        <div className="w-full mt-auto">
          <div className="flex flex-col items-center justify-center min-h-[30px]">
            {product.original_price && product.original_price > product.current_price ? (
              <>
                <span className="text-[9px] line-through text-[#6d5443]/40 tracking-wider">
                  R$ {product.original_price.toFixed(2).replace('.', ',')}
                </span>
                <span className="text-[11.5px] sm:text-[12.5px] text-[#3A312D] font-semibold tracking-wide font-poppins">
                  R$ {product.current_price?.toFixed(2).replace('.', ',')}
                </span>
              </>
            ) : (
              <span className="text-[11.5px] sm:text-[12.5px] text-[#3A312D] font-semibold tracking-wide font-poppins">
                R$ {product.current_price?.toFixed(2).replace('.', ',')}
              </span>
            )}
          </div>
          
          {/* Subtle CTA Button - Visível sem dominar */}
          <div className="mt-3 pt-2 w-full border-t border-[#faf8f5] flex items-center justify-between">
            <span className="text-[8.5px] uppercase tracking-[0.12em] font-semibold text-[#6d5443]/60 group-hover:text-[#cca062] transition-colors font-poppins flex items-center gap-1">
              Ver Opções
            </span>
            <button className="w-6.5 h-6.5 rounded-full bg-[#faf8f5] border border-[#e8dcc8]/30 group-hover:bg-[#3A312D] group-hover:text-white transition-all flex items-center justify-center text-[#cca062] shadow-3xs cursor-pointer">
              <ShoppingBag size={10} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
