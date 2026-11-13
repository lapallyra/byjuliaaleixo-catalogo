import React, { useState } from 'react';
import { ShoppingCart, Heart, Check, Gift } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { ProductDetailModal } from '../ProductDetailModal';
import { formatCurrency } from '../../lib/currencyUtils';

interface ProductCardProps {
  product: Product;
  themeColor?: string;
  theme?: any; // For backwards compatibility
  onAddToCart?: (product: Product, quantity: number) => void;
  onClick?: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
  isLoading?: boolean;
  isFeatured?: boolean;
}

const CornerBotanicalLeaf: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 90 90"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    className={`pointer-events-none select-none text-[#C3AB82] opacity-55 ${className}`}
  >
    <path
      d="M4 4C18 14 34 32 42 54"
      stroke="currentColor"
      strokeWidth="0.95"
      strokeLinecap="round"
    />
    <path
      d="M16 14C26 9 36 12 40 20C30 23 21 21 16 14Z"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    <path
      d="M13 18C6 26 7 37 14 43C20 35 19 25 13 18Z"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    <path
      d="M27 29C39 24 51 27 56 36C44 40 33 37 27 29Z"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    <path
      d="M25 33C19 44 21 55 29 61C34 51 32 40 25 33Z"
      stroke="currentColor"
      strokeWidth="0.9"
    />
    <path
      d="M39 48C50 45 60 50 63 59C52 61 43 56 39 48Z"
      stroke="currentColor"
      strokeWidth="0.85"
    />
    <path
      d="M42 54C46 65 44 76 37 83C33 73 35 62 42 54Z"
      stroke="currentColor"
      strokeWidth="0.85"
    />
  </svg>
);

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onClick,
  onAddToGiftList,
  onAddToFavorite,
  isLoading = false,
  isFeatured = false,
}) => {
  const [addedCart, setAddedCart] = useState(false);
  const [addedGift, setAddedGift] = useState(false);
  const [addedFavorite, setAddedFavorite] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAction = (e: React.MouseEvent, action: () => void, setStatus: (val: boolean) => void) => {
    e.stopPropagation();
    action();
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[500px] flex flex-col rounded-[22px] overflow-hidden bg-[#FDFBF7] mx-auto animate-pulse border border-[#DFD5C5]">
        <div className="flex flex-row h-[215px] sm:h-[235px]">
          <div className="w-[48%] bg-[#FAF8F5] shrink-0 border-r border-[#E8E2D5]/50"></div>
          <div className="flex-1 p-5 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-2.5 bg-[#E8E2D5]/60 rounded"></div>
            <div className="w-28 h-7 bg-[#E8E2D5]/70 rounded"></div>
            <div className="w-24 h-3 bg-[#E8E2D5]/50 rounded"></div>
            <div className="w-36 h-8 bg-[#E8E2D5]/60 rounded-full mt-1"></div>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div className="w-16 h-6 bg-[#E8E2D5]/50 rounded-full"></div>
              <div className="w-16 h-6 bg-[#E8E2D5]/50 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="w-full py-3 px-4 bg-[#EFE9DC] border-t border-[#E1D8C7] flex justify-center">
          <div className="w-36 h-3 bg-[#DFD5C5] rounded"></div>
        </div>
      </div>
    );
  }

  const displayPrice = Number(product.retail_price || product.current_price || 0);
  const installmentValue = displayPrice / 10;

  return (
    <>
      <div 
        className="group w-full max-w-[500px] flex flex-col cursor-pointer transition-all duration-300 shadow-[0_6px_22px_rgba(15,44,89,0.04)] hover:shadow-[0_14px_34px_rgba(15,44,89,0.09)] hover:-translate-y-0.5 rounded-[22px] overflow-hidden bg-[#FDFBF7] border border-[#DDD3C3] hover:border-[#C5A467] relative mx-auto"
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick(product);
          } else {
            setIsDrawerOpen(true);
          }
        }}
      >
        <div className={`flex flex-row ${isFeatured ? 'h-[205px] sm:h-[225px]' : 'h-[215px] sm:h-[238px]'}`}>
          {/* LADO ESQUERDO: Foto Full-Bleed */}
          <div className="w-[48%] sm:w-[50%] relative overflow-hidden bg-[#FAF8F5] shrink-0">
            <ImageWithFallback
              src={product.image || product.main_image || ''}
              alt={product.product_name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            
            {/* Efeito Hover: Ver Detalhes */}
            <div className="absolute inset-0 bg-[#0F2C59]/12 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <span className="px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-[#0F2C59] border border-[#D4AF37]/40 rounded-full shadow-md transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                Ver Detalhes
              </span>
            </div>
          </div>
                  
          {/* LADO DIREITO: Fundo Botânico Champanhe, Preço Serifado e Botões */}
          <div className="flex-1 relative bg-[#FCF9F3] flex flex-col items-center justify-center px-3 py-3.5 sm:px-4 sm:py-4 overflow-hidden border-l border-[#ECE4D6]/80">
            {/* Ramos Botânicos Sutis nos 4 Cantos */}
            <CornerBotanicalLeaf className="absolute -top-1 -left-1 w-14 h-14 sm:w-16 sm:h-16" />
            <CornerBotanicalLeaf className="absolute -top-1 -right-1 w-14 h-14 sm:w-16 sm:h-16 -scale-x-100" />
            <CornerBotanicalLeaf className="absolute -bottom-1 -left-1 w-14 h-14 sm:w-16 sm:h-16 -scale-y-100" />
            <CornerBotanicalLeaf className="absolute -bottom-1 -right-1 w-14 h-14 sm:w-16 sm:h-16 scale-[-1]" />

            <div className="relative z-10 flex flex-col items-center text-center w-full">
              <span className="text-[9px] sm:text-[9.5px] font-semibold uppercase tracking-[0.22em] text-[#4E3F2E]/90 leading-none mb-1">
                Por apenas
              </span>

              {product.original_price > displayPrice && (
                <span className="text-[10px] text-[#8C7D6B] line-through font-medium leading-none mb-0.5 tabular-nums">
                  {formatCurrency(product.original_price)}
                </span>
              )}

              <span className="font-serif font-bold text-2xl sm:text-[27px] md:text-[29px] text-[#A88334] tracking-tight leading-none tabular-nums">
                {formatCurrency(displayPrice)}
              </span>

              {displayPrice > 0 && (
                <span className="text-[10.5px] sm:text-[11px] font-medium text-[#1B2537]/85 mt-1 mb-2.5 tabular-nums">
                  ou 10x de {formatCurrency(installmentValue)}
                </span>
              )}

              {/* CTA Principal Delineado: COMPRAR */}
              <button
                type="button"
                onClick={(e) => {
                  if (onAddToCart) {
                    handleAction(e, () => onAddToCart(product, 1), setAddedCart);
                  } else if (onClick) {
                    e.stopPropagation();
                    onClick(product);
                  } else {
                    e.stopPropagation();
                    setIsDrawerOpen(true);
                  }
                }}
                className={`w-full max-w-[168px] py-1.5 sm:py-2 px-4 rounded-full border-[1.5px] text-[10.5px] sm:text-[11px] font-bold uppercase tracking-[0.16em] inline-flex items-center justify-center gap-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
                  addedCart
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'bg-white/95 hover:bg-[#0F2C59] text-[#111D33] hover:text-[#FAF8F5] border-[#111D33] hover:border-[#0F2C59]'
                }`}
              >
                {addedCart ? (
                  <>
                    <Check size={13} strokeWidth={2.2} />
                    <span>No Carrinho</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart size={13} strokeWidth={1.75} />
                    <span>Comprar</span>
                  </>
                )}
              </button>

              {/* Ações Secundárias: Favorito e Presente */}
              <div className="flex items-center justify-center gap-1.5 mt-2 w-full">
                <button
                  type="button"
                  onClick={(e) => {
                    if (onAddToFavorite) {
                      handleAction(e, () => onAddToFavorite(product), setAddedFavorite);
                    } else if (onClick) {
                      e.stopPropagation();
                      setAddedFavorite(true);
                      setTimeout(() => setAddedFavorite(false), 1800);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-rose-50/70 text-[#1B2537] border border-[#D8CEBE] hover:border-[#C5A467] inline-flex items-center gap-1 text-[10px] font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Favoritar"
                >
                  <Heart size={11} strokeWidth={1.75} className={addedFavorite ? 'text-rose-500 fill-rose-500' : 'text-[#1B2537]'} />
                  <span>Favorito</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    if (onAddToGiftList) {
                      handleAction(e, () => onAddToGiftList(product), setAddedGift);
                    } else if (onClick) {
                      e.stopPropagation();
                      onClick(product);
                    } else {
                      e.stopPropagation();
                      setIsDrawerOpen(true);
                    }
                  }}
                  className="px-2.5 py-1 rounded-full bg-white/90 hover:bg-[#FAF0DC]/70 text-[#1B2537] border border-[#D8CEBE] hover:border-[#C5A467] inline-flex items-center gap-1 text-[10px] font-medium transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  title="Adicionar à lista de presentes"
                >
                  {addedGift ? (
                    <Check size={11} className="text-emerald-600" />
                  ) : (
                    <Gift size={11} strokeWidth={1.75} className="text-[#1B2537]" />
                  )}
                  <span>Presente</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FAIXA INFERIOR: Nome do Produto em Caixa Alta */}
        <div className="w-full py-2.5 sm:py-3 px-4 bg-[#EFE9DC] border-t border-[#E1D8C7] transition-colors duration-300 group-hover:bg-[#0F2C59] group-hover:border-[#0F2C59]">
          <h3 className="text-[10.5px] sm:text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#111D33] truncate text-center transition-colors duration-300 group-hover:text-[#FAF8F5]">
            {product.product_name}
          </h3>
        </div>
      </div>

      <AnimatePresence>
        {isDrawerOpen && (
          <ProductDetailModal
            product={product}
            onClose={() => setIsDrawerOpen(false)}
            onAddToCart={(prod, qty) => {
              onAddToCart?.(prod, qty);
              setIsDrawerOpen(false);
            }}
            onAddToGiftList={onAddToGiftList}
            companyId={product.company}
          />
        )}
      </AnimatePresence>
    </>
  );
};
