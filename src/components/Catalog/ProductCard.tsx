import React from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

interface ProductCardProps {
  product: Product;
  theme: any;
  onAddToCart: (product: Product) => void;
  onAddToGiftList?: (product: Product) => void;
  onClick: (product: Product) => void;
}

export function ProductCard({ product, theme, onAddToCart, onAddToGiftList, onClick }: ProductCardProps) {
  return (
    <motion.div
      className="group relative flex flex-col p-3 cursor-pointer bg-white rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500"
      style={{ borderColor: theme.accentColor }}
      onClick={() => onClick(product)}
    >
      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-neutral-50 shrink-0">
        <ImageWithFallback
          src={product.image}
          alt={product.product_name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.image_hover && (
          <ImageWithFallback
            src={product.image_hover}
            alt={product.product_name}
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
      </div>

      <div className="p-2 flex flex-col flex-grow">
        <h3 className="text-sm md:text-base font-bold line-clamp-2 h-10 mb-2">
          {product.product_name}
        </h3>

        <div className="mb-4">
          {product.original_price && product.original_price > product.current_price && (
            <p className="text-xs text-neutral-500 line-through">
              de: R$ {product.original_price.toFixed(2)}
            </p>
          )}
          <span className="text-lg font-black text-gray-900">
            R$ {product.current_price.toFixed(2)}
          </span>
          {product.wholesale_price && (
            <p className="text-xs text-emerald-600 font-medium">
              Atacado: R$ {product.wholesale_price.toFixed(2)}
            </p>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
            className={`text-xs font-semibold py-2 rounded-lg transition-colors ${theme.btnPrimary}`}
          >
            Carrinho
          </button>
          {onAddToGiftList && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToGiftList(product); }}
              className={`text-xs font-semibold py-2 rounded-lg border transition-colors ${theme.btnSecondary}`}
            >
              Lista
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
