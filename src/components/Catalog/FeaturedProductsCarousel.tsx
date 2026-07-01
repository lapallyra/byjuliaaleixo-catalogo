import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { FeaturedProductCard } from './FeaturedProductCard';
import { HorizontalScroll } from '../shared/HorizontalScroll';

interface FeaturedProductsCarouselProps {
  products: Product[];
  theme: any;
  companyId: string;
  onSelectProduct: (product: Product) => void;
}


export const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({ products, theme, companyId, onSelectProduct }) => {
  return (
    <div className="max-w-[1600px] mx-auto px-4 mt-20 relative group">
      <h2 className="text-[10px] font-black mb-10 flex items-center gap-2 uppercase tracking-[0.3em] opacity-40 justify-center">
        Novidades
      </h2>
      
      <HorizontalScroll className="gap-6 pb-10 snap-x" itemWidth={304}>
        {products.map((product, idx) => (
          <div key={`featured-${product.id}-${idx}`} className="flex-shrink-0 w-[280px] snap-start">
            <FeaturedProductCard 
              product={product}
              theme={theme}
              onAddToCart={(prod) => onSelectProduct(prod)}
              onClick={() => onSelectProduct(product)}
            />
          </div>
        ))}
      </HorizontalScroll>
    </div>
  );
};

