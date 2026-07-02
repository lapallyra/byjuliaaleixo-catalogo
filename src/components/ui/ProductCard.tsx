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
      className="group w-full max-w-[400px] p-3 flex flex-col gap-3 cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
      onClick={() => onClick?.(product)}
      style={{ '--cor-detalhe': activeColor } as React.CSSProperties}
    >
      <div className="flex gap-3">
        {/* Product Image */}
        <div className="relative w-[120px] h-[120px] rounded-xl overflow-hidden shrink-0 bg-gray-50">
          <ImageWithFallback
            src={product.image || ''}
            alt={product.product_name}
            className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          {product.image_hover && (
            <ImageWithFallback
              src={product.image_hover}
              alt={product.product_name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />
          )}
          
          {/* Quick Actions overlay */}
          <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            {onAddToFavorite && (
              <button 
                onClick={(e) => handleAction(e, () => onAddToFavorite(product), setAddedFavorite)}
                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-rose-500 shadow-sm transition-colors"
                aria-label="Adicionar aos favoritos"
              >
                {addedFavorite ? <Heart size={14} className="text-rose-500 fill-rose-500" /> : <Heart size={14} />}
              </button>
            )}
            <button 
              onClick={handleShare}
              className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-indigo-500 shadow-sm transition-colors"
              aria-label="Compartilhar"
            >
              {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Share2 size={14} />}
            </button>
          </div>
        </div>
                
        {/* Product Info */}
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          {product.category && (
            <Badge variant="brand" themeColor={activeColor} className="w-fit text-[9px] mb-1">
              {product.category}
            </Badge>
          )}
          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
            {product.product_name}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
            {product.description}
          </p>
          
          <div className="mt-auto pt-2 flex items-end justify-between gap-2">
            <div className="flex flex-col">
              {product.original_price > product.current_price && (
                <span className="text-[10px] text-gray-400 line-through">
                  {formatCurrency(product.original_price)}
                </span>
              )}
              <span className="text-sm font-bold" style={{ color: activeColor }}>
                {formatCurrency(product.current_price)}
              </span>
            </div>
            
            <div className="flex items-center gap-1.5">
              {onAddToGiftList && (
                <button
                  onClick={(e) => handleAction(e, () => onAddToGiftList(product), setAddedGift)}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Adicionar à lista de presentes"
                >
                  {addedGift ? <Check size={14} className="text-emerald-500" /> : <Gift size={14} />}
                </button>
              )}
              {onAddToCart && (
                <button
                  onClick={(e) => handleAction(e, () => onAddToCart(product, 1), setAddedCart)}
                  className="h-8 px-3 rounded-full flex items-center gap-1.5 text-white transition-all hover:opacity-90 active:scale-95 text-xs font-medium shadow-sm"
                  style={{ backgroundColor: activeColor }}
                  aria-label="Adicionar ao carrinho"
                >
                  {addedCart ? (
                    <><Check size={14} /> Adicionado</>
                  ) : (
                    <><ShoppingCart size={14} /> Add</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
