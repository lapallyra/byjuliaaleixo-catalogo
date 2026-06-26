import React, { useState } from 'react';
import { ShoppingCart, Heart, Share2, Check, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

interface CatalogProductCardProps {
  product: Product;
  theme: any;
  onAddToCart: (product: Product, quantity: number) => void;
  onClick: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
}

export const CatalogProductCard: React.FC<CatalogProductCardProps> = ({
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

  const accentColor = theme.accentColor || '#ffcce0'; // Default pinkish if not defined

  return (
    <motion.div
      className="card-produto group w-full max-w-[400px] bg-white rounded-[20px] p-3 shadow-[0_4px_15px_rgba(0,0,0,0.06)] font-sans flex flex-col gap-[10px] border border-[#f5f0eb] cursor-pointer"
      style={{ '--cor-detalhe': accentColor } as React.CSSProperties}
      onClick={() => onClick(product)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
      transition={{ duration: 0.3 }}
    >
      <div className="main-content flex gap-3">
        <div className="foto-col relative w-[120px] h-[120px] rounded-xl overflow-hidden shrink-0 bg-[#fdfaf6]">
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
        </div>
        
        <div className="info-col grow flex flex-col gap-1">
          <div className="tag-card bg-[#fdfaf6] border border-[var(--cor-detalhe)] text-[var(--cor-detalhe)] px-1.5 py-0.5 rounded font-extrabold text-[8px] uppercase w-fit">
            Atacado Disponível
          </div>
          
          <div className="container-precos flex flex-col mt-1">
            {product.original_price && product.original_price > product.current_price && (
              <span className="de-preco text-[10px] text-[#ccc] line-through">
                de {formatCurrency(product.original_price)}
              </span>
            )}
            <span className="por-preco text-base font-black text-[#4a2c2c]">
              por {formatCurrency(product.current_price)}
            </span>
          </div>

          <button 
            className={`btn-carrinho mt-1 py-1.5 px-3 rounded-full text-[10px] font-bold transition-all uppercase flex items-center justify-center gap-2 border ${
              addedCart 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'bg-transparent border-[#e8e4e0]/40 text-[#4a2c2c]/70 hover:border-[var(--cor-detalhe)] hover:text-[var(--cor-detalhe)] hover:bg-[#fdfaf6]/30 active:scale-[0.98]'
            }`}
            onClick={(e) => { 
              e.stopPropagation(); 
              handleAction(() => onAddToCart(product, 1), setAddedCart); 
            }}
          >
            {addedCart ? (
              <>
                <Check size={12} className="shrink-0" />
                Adicionado
              </>
            ) : (
              <>
                <ShoppingCart size={12} className="shrink-0" />
                Adicionar
              </>
            )}
          </button>

          <div className="icones flex gap-3 opacity-60 mt-auto pt-2">
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToGiftList?.(product), setAddedGift); }}
              className={`hover:text-[var(--cor-detalhe)] transition-colors ${addedGift ? 'text-pink-500 scale-110' : ''}`}
              title="Lista de Presentes"
            >
              <Gift size={18} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleAction(() => onAddToFavorite?.(product), setAddedFavorite); }}
              className={`hover:text-[var(--cor-detalhe)] transition-colors ${addedFavorite ? 'text-rose-500 scale-110' : ''}`}
              title="Favoritos"
            >
              <Heart size={18} fill={addedFavorite ? "currentColor" : "none"} />
            </button>
            <button 
              onClick={handleShare}
              className={`hover:text-[var(--cor-detalhe)] transition-colors ${copiedLink ? 'text-emerald-500 scale-110' : ''}`}
              title="Copiar Link"
            >
              {copiedLink ? <Check size={18} /> : <Share2 size={18} />}
            </button>
          </div>
        </div>
      </div>
      
      <h2 className="nome-produto font-playfair text-lg font-black text-[#4a2c2c] border-t border-[#f0ece8] pt-2 mt-0 tracking-tight line-clamp-2">
        {product.product_name}
      </h2>
    </motion.div>
  );
};
