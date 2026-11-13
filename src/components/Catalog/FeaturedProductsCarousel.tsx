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
    <div className="w-full px-2 sm:px-3 mt-10 relative">
      <h2 className="whitespace-nowrap text-[10px] font-black mb-8 flex items-center gap-2 uppercase tracking-[0.3em] opacity-40 justify-center">
        Novidades
      </h2>
      
      <HorizontalScroll className="flex gap-2.5 sm:gap-3.5 lg:gap-4 pb-10 snap-x" itemWidth={280}>
        {products.map((product, idx) => (
          <div key={`featured-${product.id}-${idx}`} className="flex-shrink-0 w-[calc((100%-10px)/2)] md:w-[calc((100%-28px)/3)] lg:w-[calc((100%-64px)/5)] snap-start">
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

