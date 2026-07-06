import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { Card } from './Card';
import { Badge } from './Badge';

interface ProductCardProps {
  product: Product;
  themeColor?: string;
  theme?: any; // For backwards compatibility
  onAddToCart?: (product: Product, quantity: number) => void;
  onClick?: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  themeColor,
  theme,
  onAddToCart,
  onClick,
  onAddToGiftList,
  onAddToFavorite,
}) => {
  const activeColor = themeColor || theme?.accentColor || '#cca062';
  const [addedCart, setAddedCart] = useState(false);
  const [addedGift, setAddedGift] = useState(false);
  const [addedFavorite, setAddedFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

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

  return (
    <Card 
      className="group w-full max-w-[480px] flex flex-col cursor-pointer transition-all duration-500 hover:shadow-2xl hover:shadow-neutral-200/50 hover:-translate-y-1 border border-neutral-100 rounded-3xl overflow-hidden bg-white relative mx-auto"
      onClick={() => onClick?.(product)}
    >
      <div className="flex flex-row h-[200px] sm:h-[220px]">
        {/* LADO ESQUERDO: Foto */}
        <div className="w-[50%] relative overflow-hidden bg-neutral-50 shrink-0 border-r border-neutral-100/50">
          <ImageWithFallback
            src={product.image || ''}
            alt={product.product_name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </div>
                
        {/* LADO DIREITO: Preço e Ações */}
        <div className="flex-1 p-5 flex flex-col items-center justify-center gap-4">
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

          <div className="flex items-center justify-center gap-2">
            {onAddToCart && (
              <button
                onClick={(e) => handleAction(e, () => onAddToCart(product, 1), setAddedCart)}
                className="p-2 text-[#3A312D]/60 hover:text-[#3A312D] transition-all active:scale-90"
                title="Adicionar ao carrinho"
              >
                {addedCart ? <Check size={22} className="text-green-500" /> : <ShoppingCart size={22} strokeWidth={1.2} />}
              </button>
            )}
            {onAddToGiftList && (
              <button
                onClick={(e) => handleAction(e, () => onAddToGiftList(product), setAddedGift)}
                className="p-2 text-[#3A312D]/60 hover:text-[#3A312D] transition-all active:scale-90"
                title="Adicionar à lista de presentes"
              >
                {addedGift ? <Check size={22} className="text-green-500" /> : <Gift size={22} strokeWidth={1.2} />}
              </button>
            )}
            {onAddToFavorite && (
              <button
                onClick={(e) => handleAction(e, () => onAddToFavorite(product), setAddedFavorite)}
                className="p-2 text-[#3A312D]/60 hover:text-rose-400 transition-all active:scale-90"
                title="Favoritar"
              >
                {addedFavorite ? <Heart size={22} className="text-rose-400 fill-rose-400" /> : <Heart size={22} strokeWidth={1.2} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAG INFERIOR (ABAIXO DO CONTEÚDO) */}
      <div className="w-full py-3.5 px-4 bg-[#3A312D] border-t border-[#D4AF37]/20">
        <h3 className="text-[11px] font-black uppercase tracking-[0.25em] text-[#D4AF37] truncate text-center drop-shadow-[0_0_2px_rgba(212,175,55,0.4)]">
          {product.product_name}
        </h3>
      </div>
    </Card>
  );
};
