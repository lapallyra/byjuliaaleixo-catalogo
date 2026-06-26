import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';
import { FeaturedProductCard } from './FeaturedProductCard';

interface FeaturedProductsCarouselProps {
  products: Product[];
  theme: any;
  companyId: string;
  onSelectProduct: (product: Product) => void;
}


export const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({ products, theme, companyId, onSelectProduct }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!products || products.length === 0) return;
    
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        
        // Dynamic item width calculation (including gap)
        const itemWidth = window.innerWidth >= 768 ? 160 + 24 : 128 + 24; 
        
        if (scrollLeft >= maxScroll - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: itemWidth, behavior: 'smooth' });
        }
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [products]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 mt-20 relative group">
      <h2 className="text-[10px] font-black mb-10 flex items-center gap-2 uppercase tracking-[0.3em] opacity-40 justify-center">
        Novidades
      </h2>
      
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto gap-6 pb-10 scrollbar-none scroll-smooth snap-x"
      >
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
      </div>
    </div>
  );
};

