import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

interface FeaturedProductCardProps {
  product: Product;
  theme: any;
  onAddToCart: (product: Product, quantity: number) => void;
  onClick: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  product,
  theme,
  onAddToCart,
  onClick,
  onAddToGiftList,
  onAddToFavorite,
}) => {
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

  const handleAction = (action: () => void, setStatus: (val: boolean) => void) => {
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

  const accentColor = theme.accentColor || '#ffcce0';

  return (
    <motion.div
      className="card-produto group w-full bg-white rounded-2xl p-3 shadow-[0_4px_15px_rgba(0,0,0,0.06)] hover:shadow-[0_10px_25px_rgba(0,0,0,0.1)] transition-all flex flex-col border border-[#f5f0eb] cursor-pointer h-full"
      style={{ '--cor-detalhe': accentColor } as React.CSSProperties}
      onClick={() => onClick(product)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#fdfaf6] mb-3 shrink-0">
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
        
        <div className="absolute top-2 left-2 max-w-[calc(100%-40px)]">
          <div className="bg-white/95 backdrop-blur-sm border border-[var(--cor-detalhe)] text-[var(--cor-detalhe)] px-2 py-0.5 rounded font-extrabold text-[8px] sm:text-[9px] uppercase shadow-sm truncate">
            Atacado Disponível
          </div>
        </div>

        <div className="absolute top-2 right-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToFavorite?.(product), setAddedFavorite); }}
            className={`p-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:text-[var(--cor-detalhe)] transition-colors ${addedFavorite ? 'text-rose-500 scale-110' : 'text-[#4a2c2c]/70'}`}
            title="Favoritos"
          >
            <Heart size={14} fill={addedFavorite ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      
      <div className="flex flex-col flex-grow">
        <h2 className="nome-produto font-playfair text-base sm:text-lg font-black text-[#4a2c2c] tracking-tight line-clamp-2 min-h-[44px] mb-2 leading-tight">
          {product.product_name}
        </h2>
        
        <div className="flex flex-col mt-auto mb-2">
          {product.original_price && product.original_price > product.current_price && (
            <span className="text-[10px] sm:text-[11px] text-[#ccc] line-through leading-none">
              de {formatCurrency(product.original_price)}
            </span>
          )}
          <span className="text-base sm:text-[17px] font-black text-[#4a2c2c] leading-tight mt-0.5">
            por {formatCurrency(product.current_price)}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-[#f0ece8] pt-2 mt-auto">
          <div className="flex gap-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToGiftList?.(product), setAddedGift); }}
              className={`p-1 rounded-full hover:bg-pink-50 transition-colors ${addedGift ? 'text-pink-500 scale-110' : 'text-[#4a2c2c]/50 hover:text-pink-500'}`}
              title="Lista de Presentes"
            >
              <Gift size={16} />
            </button>
            <button 
              onClick={handleShare}
              className={`p-1 rounded-full hover:bg-emerald-50 transition-colors ${copiedLink ? 'text-emerald-500 scale-110' : 'text-[#4a2c2c]/50 hover:text-emerald-500'}`}
              title="Copiar Link"
            >
              {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
            </button>
          </div>

          <button 
            className={`btn-carrinho w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border shrink-0 ml-2 ${
              addedCart 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-white border-[#e8e4e0] text-[#4a2c2c] hover:border-[var(--cor-detalhe)] hover:text-[var(--cor-detalhe)] hover:bg-[#fdfaf6] active:scale-[0.95]'
            }`}
            onClick={(e) => { 
              e.stopPropagation(); 
              handleAction(() => onAddToCart(product, 1), setAddedCart); 
            }}
            title="Adicionar ao Carrinho"
          >
            {addedCart ? (
              <Check size={14} />
            ) : (
              <ShoppingCart size={14} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
