import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
      <div className="w-full max-w-[480px] flex flex-col rounded-3xl overflow-hidden bg-white mx-auto animate-pulse border border-[#E8E2D5] shadow-xs">
        <div className="flex flex-row h-[200px] sm:h-[220px]">
          <div className="w-[50%] bg-[#FAF8F5] shrink-0 border-r border-[#E8E2D5]/50"></div>
          <div className="flex-1 p-5 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-4 bg-neutral-100 rounded mb-2"></div>
            <div className="w-24 h-8 bg-neutral-100 rounded"></div>
            <div className="w-[85%] h-8 bg-neutral-100 rounded-full mt-2"></div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="w-6 h-6 bg-neutral-100 rounded-full"></div>
              <div className="w-6 h-6 bg-neutral-100 rounded-full"></div>
              <div className="w-6 h-6 bg-neutral-100 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="w-full py-3.5 px-4 bg-[#FAF8F5] border-t border-[#E8E2D5] flex justify-center">
          <div className="w-32 h-3 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="group w-full max-w-[480px] flex flex-col cursor-pointer transition-all duration-300 hover:shadow-[0_12px_36px_rgba(15,44,89,0.08)] hover:-translate-y-1 rounded-3xl overflow-hidden bg-white border border-[#E8E2D5] hover:border-[#D4AF37]/65 relative mx-auto"
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick(product);
          } else {
            setIsDrawerOpen(true);
          }
        }}
      >
        <div className={`flex flex-row ${isFeatured ? 'h-[170px] sm:h-[190px]' : 'h-[200px] sm:h-[220px]'}`}>
          {/* LADO ESQUERDO: Foto em Destaque */}
          <div className="w-[50%] relative overflow-hidden bg-[#FAF8F5] shrink-0">
            <ImageWithFallback
              src={product.image || ''}
              alt={product.product_name}
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
            />
            {/* Sutil degrade divider */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white pointer-events-none" />
            
            {/* Efeito Hover Individual: Ver Detalhes */}
            <div className="absolute inset-0 bg-[#0F2N59]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <span className="px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-white bg-[#0F2C59] border border-white/20 rounded-full shadow-md transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                Ver Detalhes
              </span>
            </div>
          </div>
                  
          {/* LADO DIREITO: Preço e Ações */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-5 gap-3">
            <div className="flex flex-col items-center gap-1 text-center">
              {product.original_price > product.current_price && (
                <span className="text-[10px] text-neutral-400 line-through font-bold">
                  {formatCurrency(product.original_price)}
                </span>
              )}
              <span className="text-2xl sm:text-2.5xl font-black text-[#D4AF37] tracking-tight">
                {formatCurrency(product.current_price)}
              </span>
            </div>

            <div className="flex flex-col w-full gap-2 items-center">
              <div className="flex items-center justify-center gap-5 mt-1">
                {onAddToCart && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToCart(product, 1), setAddedCart)}
                    className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#0F2C59] text-[#1B2537] hover:text-white border border-[#E8E2D5] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer"
                    title="Adicionar ao carrinho"
                  >
                    {addedCart ? <Check size={16} className="text-emerald-600" /> : <ShoppingCart size={16} strokeWidth={1.75} />}
                  </button>
                )}
                {onAddToGiftList && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToGiftList(product), setAddedGift)}
                    className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-[#0F2C59] text-[#1B2537] hover:text-white border border-[#E8E2D5] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer"
                    title="Adicionar à lista de presentes"
                  >
                    {addedGift ? <Check size={16} className="text-emerald-600" /> : <Gift size={16} strokeWidth={1.75} />}
                  </button>
                )}
                {onAddToFavorite && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToFavorite(product), setAddedFavorite)}
                    className="w-9 h-9 rounded-full bg-[#FAF8F5] hover:bg-rose-50 text-[#1B2537] hover:text-rose-500 border border-[#E8E2D5] flex items-center justify-center transition-all duration-200 active:scale-90 shadow-2xs cursor-pointer"
                    title="Favoritar"
                  >
                    {addedFavorite ? <Heart size={16} className="text-rose-500 fill-rose-500" /> : <Heart size={16} strokeWidth={1.75} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TAG INFERIOR UNIFORME E ELEGANTE */}
        {!isFeatured && (
          <div className="w-full py-3 px-4 bg-[#FAF8F5] border-t border-[#E8E2D5] transition-all duration-300 group-hover:bg-[#0F2C59] group-hover:border-[#0F2C59]">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1B2537] truncate text-center transition-colors duration-300 group-hover:text-white">
              {product.product_name}
            </h3>
          </div>
        )}
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
