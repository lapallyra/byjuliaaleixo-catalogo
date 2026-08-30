import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Eye } from 'lucide-react';
import { Product, CompanyId } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { formatCurrency } from '../../lib/currencyUtils';

interface HomeCuratedProductsProps {
  allProducts: Product[];
}

export const HomeCuratedProducts: React.FC<HomeCuratedProductsProps> = ({ allProducts = [] }) => {
  const navigate = useNavigate();

  // Curate products to show a diverse, refined selection from the ateliers
  const visibleProducts = allProducts
    .filter((p) => p.isVisible !== false && (p.image || p.images?.[0] || p.main_image))
    .slice(0, 8);

  const getCompanyName = (companyId?: CompanyId | string) => {
    switch (companyId) {
      case 'pallyra':
        return 'La Pallyra';
      case 'guennita':
        return 'com amor, Guennita';
      case 'mimada':
        return 'Mimada Sim';
      case 'tuttymimo':
        return 'Tutty Mimo';
      default:
        return 'Ateliê Exclusivo';
    }
  };

  const getCompanyRoute = (companyId?: CompanyId | string) => {
    switch (companyId) {
      case 'pallyra':
        return '/lapallyra';
      case 'guennita':
        return '/comamorguennita';
      case 'mimada':
        return '/mimadasim';
      case 'tuttymimo':
        return '/tuttymimo';
      default:
        return '/vitrine';
    }
  };

  return (
    <section className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Section Title */}
      <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#8C6D37] font-medium">
          <Sparkles size={12} strokeWidth={1.5} />
          <span>Curadoria de Peças Especiais</span>
        </div>
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-mea-culpa text-[#2C1810] tracking-tight">
          Criações em Destaque
        </h2>
        <p className="text-xs sm:text-sm text-[#593E32] font-light">
          Uma seleção exclusiva de lembranças, mimos e presentes que tocam o coração.
        </p>
      </div>

      {/* Products Grid */}
      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {visibleProducts.map((product) => {
            const imageUrl = product.image || product.images?.[0] || product.main_image || '';
            const price = Number(product.current_price || product.retail_price || product.price) || 0;
            const productName = product.product_name || (product as any).name || 'Produto Exclusivo';
            const companyName = getCompanyName(product.company);
            const targetRoute = getCompanyRoute(product.company);

            return (
              <div
                key={product.id}
                onClick={() => navigate(targetRoute)}
                className="group flex flex-col rounded-2xl bg-[#FFFFFF] border border-[#E8DFC8] hover:border-[#B38F4D]/60 p-3 sm:p-4 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(179,143,77,0.08)] transition-all duration-300 cursor-pointer"
              >
                {/* Product Image Frame */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#FAF7F2] relative border border-[#F0EBE1]">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.isKit && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-[#2C1810]/90 text-[#FAF8F5] text-[10px] font-medium tracking-wider uppercase border border-[#D4AF37]/30">
                      Kit
                    </span>
                  )}
                  {/* Subtle View Hint on Hover */}
                  <div className="absolute inset-0 bg-[#2C1810]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-[#FFFFFF]/95 text-[#2C1810] text-xs font-medium flex items-center gap-1.5 shadow-sm">
                      <Eye size={12} strokeWidth={1.5} /> Ver no Ateliê
                    </span>
                  </div>
                </div>

                {/* Product Info */}
                <div className="mt-3.5 space-y-1 text-left flex-grow flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-[#8C6D37] tracking-widest block">
                      {companyName}
                    </span>
                    <h3 className="text-xs sm:text-sm font-medium text-[#2C1810] line-clamp-2 mt-0.5 leading-snug">
                      {productName}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between mt-2">
                    <span className="text-xs sm:text-sm font-sans font-semibold text-[#2C1810] tracking-tight tabular-nums font-poppins">
                      {price > 0 ? formatCurrency(price) : 'Sob Consulta'}
                    </span>
                    <span className="text-[11px] text-[#8C6D37] font-medium group-hover:text-[#2C1810] transition-colors flex items-center gap-1">
                      Personalizar <ArrowRight size={11} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 text-[#8C6D37]">
          <p className="text-sm">Carregando catálogo exclusivo de produtos...</p>
        </div>
      )}

      {/* Bottom Center CTA [ VER LOJA ] */}
      <div className="mt-12 flex justify-center">
        <button
          onClick={() => navigate('/vitrine')}
          className="group flex items-center gap-3 px-9 py-4 rounded-full bg-[#FAF8F5] hover:bg-[#2C1810] text-[#2C1810] hover:text-[#FAF8F5] border border-[#B38F4D]/50 hover:border-[#D4AF37] shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
        >
          <span className="text-xs sm:text-sm uppercase tracking-[0.2em] font-medium text-[#3D261C] group-hover:text-[#E5C388] transition-colors">
            Ver Loja Completa
          </span>
          <ArrowRight size={14} strokeWidth={1.5} className="text-[#8C6D37] group-hover:text-[#E5C388] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

    </section>
  );
};

