import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ProductCard } from '../ui/ProductCard';
import { HorizontalScroll } from '../shared/HorizontalScroll';

interface FeaturedProductsCarouselProps {
  products: Product[];
  theme: any;
  companyId: string;
  onSelectProduct: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onAddToGiftList?: (product: Product) => void;
  onAddToFavorite?: (product: Product) => void;
}


export const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({ 
  products, 
  theme, 
  companyId, 
  onSelectProduct,
  onAddToCart,
  onAddToGiftList,
  onAddToFavorite
}) => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 mt-20 relative">
      <h2 className="text-[10px] font-black mb-10 flex items-center gap-2 uppercase tracking-[0.3em] opacity-40 justify-center">
        Novidades
      </h2>
      
      <HorizontalScroll className="flex gap-6 pb-10 snap-x" itemWidth={360}>
        {products.map((product, idx) => (
          <div key={`featured-${product.id}-${idx}`} className="flex-shrink-0 w-[300px] sm:w-[340px] snap-start">
            <ProductCard 
              product={product}
              theme={theme}
              isFeatured={true}
              onAddToCart={onAddToCart}
              onAddToGiftList={onAddToGiftList}
              onAddToFavorite={onAddToFavorite}
              onClick={() => onSelectProduct(product)}
            />
          </div>
        ))}
      </HorizontalScroll>
    </div>
  );
};

