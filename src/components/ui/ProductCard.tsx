import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { Card } from './Card';
import { Badge } from './Badge';
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
  themeColor,
  theme,
  onAddToCart,
  onClick,
  onAddToGiftList,
  onAddToFavorite,
  isLoading = false,
  isFeatured = false,
}) => {
  const activeColor = themeColor || theme?.accentColor || '#cca062';
  const [addedCart, setAddedCart] = useState(false);
  const [addedGift, setAddedGift] = useState(false);
  const [addedFavorite, setAddedFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleAction = (e: React.MouseEvent, action: () => void, setStatus: (val: boolean) => void) => {
    e.stopPropagation();
    action();
    setStatus(true);
    setTimeout(() => setStatus(false), 2000);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}?product=${product.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[480px] flex flex-col border border-neutral-100/50 rounded-none overflow-hidden bg-white mx-auto animate-pulse">
        <div className="flex flex-row h-[200px] sm:h-[220px]">
          <div className="w-[50%] bg-neutral-100 shrink-0 border-r border-neutral-100/50"></div>
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
        <div className="w-full py-3.5 px-4 bg-[#3A312D]/5 border-t border-neutral-100/50 flex justify-center">
          <div className="w-32 h-3 bg-neutral-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="group w-full max-w-[480px] flex flex-col cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-neutral-200/40 hover:-translate-y-0.5 border border-neutral-100 rounded-none overflow-hidden bg-white relative mx-auto"
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
          {/* LADO ESQUERDO: Foto */}
          <div className="w-[50%] relative overflow-hidden bg-neutral-50 shrink-0">
            <ImageWithFallback
              src={product.image || ''}
              alt={product.product_name}
              className="w-full h-full object-cover transition-all duration-300 group-hover:blur-[2px] group-hover:scale-105"
            />
            {/* Sutil degrade divider */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white pointer-events-none" />
            
            {/* Efeito Hover Individual: Desfoque sutil + Ver Detalhes */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-10 backdrop-blur-[1px]">
              <span className="px-3 py-1.5 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-white bg-[#3A312D]/90 border border-white/20 rounded-full shadow-md transform translate-y-1 group-hover:translate-y-0 transition-all duration-300">
                Ver Detalhes
              </span>
            </div>
          </div>
                  
          {/* LADO DIREITO: Preço e Ações (Espaçamento reduzido) */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-4 gap-2">
            <div className="flex flex-col items-center gap-0.5 text-center mb-1">
              {product.original_price > product.current_price && (
                <span className="text-[10px] text-neutral-400 line-through font-bold">
                  {formatCurrency(product.original_price)}
                </span>
              )}
              <span className="text-2xl font-black text-[#D4AF37] tracking-tight drop-shadow-[0_1px_3px_rgba(212,175,55,0.3)]">
                {formatCurrency(product.current_price)}
              </span>
            </div>

            <div className="flex flex-col w-full gap-2 items-center">
              <div className="flex items-center justify-center gap-4 mt-1">
                {onAddToCart && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToCart(product, 1), setAddedCart)}
                    className="text-[#3A312D]/50 hover:text-[#3A312D] transition-all active:scale-90"
                    title="Adicionar ao carrinho"
                  >
                    {addedCart ? <Check size={18} className="text-green-500" /> : <ShoppingCart size={18} strokeWidth={1.5} />}
                  </button>
                )}
                {onAddToGiftList && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToGiftList(product), setAddedGift)}
                    className="text-[#3A312D]/50 hover:text-[#3A312D] transition-all active:scale-90"
                    title="Adicionar à lista de presentes"
                  >
                    {addedGift ? <Check size={18} className="text-green-500" /> : <Gift size={18} strokeWidth={1.5} />}
                  </button>
                )}
                {onAddToFavorite && (
                  <button
                    onClick={(e) => handleAction(e, () => onAddToFavorite(product), setAddedFavorite)}
                    className="text-[#3A312D]/50 hover:text-rose-400 transition-all active:scale-90"
                    title="Favoritar"
                  >
                    {addedFavorite ? <Heart size={18} className="text-rose-400 fill-rose-400" /> : <Heart size={18} strokeWidth={1.5} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TAG INFERIOR (MAIS ELEGANTE E COM REFINAMENTO DE COR NO HOVER) */}
        {!isFeatured && (
          <div className="w-full py-2.5 px-4 bg-white border-t border-[#ebdfcf] transition-all duration-300 group-hover:bg-[#FAF6F0] group-hover:border-[#D4AF37]/30">
            <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#3A312D] truncate text-center transition-colors duration-300 group-hover:text-[#D4AF37]">
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
