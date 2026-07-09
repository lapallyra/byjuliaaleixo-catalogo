import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { ProductDetailModal } from '../ProductDetailModal';

interface FeaturedProductCardProps {
  product: Product;
  theme: any;
  onAddToCart: (product: Product, quantity: number) => void;
  onClick: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
  isLoading?: boolean;
}

export const FeaturedProductCard: React.FC<FeaturedProductCardProps> = ({
  product,
  theme,
  onAddToCart,
  onClick,
  onAddToGiftList,
  onAddToFavorite,
  isLoading = false,
}) => {
  const [addedCart, setAddedCart] = useState(false);
  const [addedGift, setAddedGift] = useState(false);
  const [addedFavorite, setAddedFavorite] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

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

  if (isLoading) {
    return (
      <div className="card-produto w-full bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 h-full flex flex-col animate-pulse">
        <div className="w-full aspect-square bg-neutral-100 rounded-xl mb-4"></div>
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="w-3/4 h-4 bg-neutral-100 rounded"></div>
            <div className="w-6 h-6 bg-neutral-100 rounded-full shrink-0"></div>
          </div>
          <div className="w-1/2 h-3 bg-neutral-100 rounded mb-4"></div>
          <div className="mt-auto pt-4 flex flex-col items-center gap-4">
            <div className="w-24 h-6 bg-neutral-100 rounded"></div>
            <div className="w-full h-8 bg-neutral-100 rounded-full"></div>
            <div className="flex items-center justify-center gap-6 mt-1">
              <div className="w-6 h-6 bg-neutral-100 rounded-full"></div>
              <div className="w-6 h-6 bg-neutral-100 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="card-produto group w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl hover:shadow-neutral-200/40 transition-all duration-200 flex flex-col border border-neutral-100 cursor-pointer h-full"
        style={{ '--cor-detalhe': accentColor } as React.CSSProperties}
        onClick={(e) => {
          e.stopPropagation();
          if (onClick) {
            onClick(product);
          } else {
            setIsDrawerOpen(true);
          }
        }}
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        whileHover={{ y: -2 }}
        transition={{ duration: 0.25 }}
      >
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#fdfaf6] mb-4 shrink-0 border border-neutral-100/50">
          <ImageWithFallback
            src={product.image || ''}
            alt={product.product_name}
            className="w-full h-full object-cover transition-all duration-150 group-hover:scale-105"
          />
          {product.image_hover && (
            <ImageWithFallback
              src={product.image_hover}
              alt={product.product_name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:scale-105"
            />
          )}
          
          <div className="absolute top-3 left-3 max-w-[calc(100%-40px)]">
            <div className="bg-white/95 backdrop-blur-sm border border-[var(--cor-detalhe)] text-[var(--cor-detalhe)] px-2.5 py-1 rounded-lg font-black text-[8px] uppercase tracking-wider shadow-sm truncate">
              Atacado
            </div>
          </div>

          <div className="absolute top-3 right-3">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToFavorite?.(product), setAddedFavorite); }}
              className={`p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:text-[var(--cor-detalhe)] transition-all duration-150 hover:scale-105 active:scale-95 ${addedFavorite ? 'text-rose-500' : 'text-[#3A312D]/60'}`}
              title="Favoritos"
            >
              <Heart size={14} fill={addedFavorite ? "currentColor" : "none"} />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col flex-grow">
          <h2 className="nome-produto font-sans text-xs font-black text-[#3A312D] uppercase tracking-[0.15em] line-clamp-2 min-h-[36px] mb-3 leading-relaxed">
            {product.product_name}
          </h2>
          
          <div className="flex flex-col mt-auto mb-3">
            {product.original_price && product.original_price > product.current_price && (
              <span className="text-[10px] text-neutral-400 line-through leading-none font-bold">
                {formatCurrency(product.original_price)}
              </span>
            )}
            <span className="text-sm font-bold text-[#cca062] mt-0.5 tracking-wider">
              {formatCurrency(product.current_price)}
            </span>
          </div>

          <div className="flex flex-col gap-3 border-t border-neutral-100 pt-3 mt-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onClick) {
                  onClick(product);
                } else {
                  setIsDrawerOpen(true);
                }
              }}
              className="w-full py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3A312D] border border-[#3A312D]/20 rounded-full hover:bg-[#3A312D] hover:text-white transition-all duration-150 active:scale-95 shadow-sm"
            >
              Ver Detalhes
            </button>
            
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToGiftList?.(product), setAddedGift); }}
                  className={`p-1.5 rounded-full hover:bg-neutral-50 transition-colors ${addedGift ? 'text-pink-500' : 'text-[#3A312D]/50 hover:text-pink-500'}`}
                  title="Lista de Presentes"
                >
                  <Gift size={16} />
                </button>
                <button 
                  onClick={handleShare}
                  className={`p-1.5 rounded-full hover:bg-neutral-50 transition-colors ${copiedLink ? 'text-emerald-500' : 'text-[#3A312D]/50 hover:text-emerald-500'}`}
                  title="Copiar Link"
                >
                  {copiedLink ? <Check size={16} /> : <Share2 size={16} />}
                </button>
              </div>

              <button 
                className={`p-1.5 rounded-full transition-colors ${addedCart ? 'text-emerald-500' : 'text-[#3A312D]/50 hover:text-[#3A312D]'}`}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  handleAction(() => onAddToCart(product, 1), setAddedCart); 
                }}
                title="Adicionar ao Carrinho"
              >
                {addedCart ? <Check size={16} /> : <ShoppingCart size={16} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

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
