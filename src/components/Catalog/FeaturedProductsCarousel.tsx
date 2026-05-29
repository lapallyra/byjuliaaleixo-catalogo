import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Product } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

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
          <motion.div
            key={`featured-${product.id}-${idx}`}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            onClick={() => onSelectProduct(product)}
            className="flex-shrink-0 w-32 md:w-40 cursor-pointer group flex flex-col gap-3 snap-start"
          >
            {/* Imagem em formato miniatura */}
            <div className="aspect-square rounded-2xl bg-white border border-neutral-100 flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:shadow-lg group-hover:-translate-y-1">
                <ImageWithFallback 
                  src={product.image || ''}
                  alt={product.product_name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" 
                  style={{
                    transform: product.imageSettings ? `scale(${product.imageSettings.scale ?? 1}) translate(${product.imageSettings.translateX ?? 0}px, ${product.imageSettings.translateY ?? 0}px) rotate(${product.imageSettings.rotate ?? 0}deg)` : undefined
                  }}
                />
            </div>
            {/* Informações mínimas */}
            <div className="px-1 text-center">
              <h3 className={`font-bold text-[9px] uppercase tracking-widest line-clamp-1 ${theme.textSecondary}`}>{product.product_name}</h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
