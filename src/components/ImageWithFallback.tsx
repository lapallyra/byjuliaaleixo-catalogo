import React, { useState } from 'react';
import { ImageOff, Heart } from 'lucide-react';

export interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  containerClassName?: string;
  isThumbnail?: boolean;
}

export const getOptimizedWebpUrl = (srcStr: string | undefined | null, isThumbnail?: boolean, className: string = ""): string => {
  if (!srcStr) return '';
  const src = srcStr.trim();
  if (src === '' || src.length < 5) return src;

  // Optimize Unsplash images to WebP with responsive sizes
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('fm', 'webp'); // Force WebP format

      const isSmallElement = 
        className.includes('w-10') || 
        className.includes('w-12') || 
        className.includes('w-16') || 
        className.includes('w-20') || 
        className.includes('w-24') || 
        className.includes('w-32') || 
        className.includes('h-10') || 
        className.includes('h-12') || 
        className.includes('h-16') || 
        className.includes('h-20') || 
        className.includes('h-24') || 
        className.includes('h-32');

      if (isThumbnail) {
        url.searchParams.set('w', '400'); // Compact, optimized size for catalog thumbnails
        url.searchParams.set('q', '70');  // Fast loading compression
      } else if (isSmallElement) {
        url.searchParams.set('w', '200'); // Very compact for small avatars / icons
        url.searchParams.set('q', '70');
      } else {
        url.searchParams.set('w', '1000'); // Optimized HD size for product details page
        url.searchParams.set('q', '80');
      }
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch (e) {
      // Fallback if URL constructor fails
      let optimized = src;
      if (optimized.includes('auto=format')) {
        optimized = optimized.replace('auto=format', 'fm=webp');
      } else if (!optimized.includes('fm=')) {
        optimized += optimized.includes('?') ? '&fm=webp' : '?fm=webp';
      }
      if (isThumbnail) {
        if (optimized.includes('w=800')) {
          optimized = optimized.replace('w=800', 'w=400');
        } else if (!optimized.includes('w=')) {
          optimized += '&w=400';
        }
      }
      return optimized;
    }
  }

  return src;
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = "Imagem",
  className = "",
  fallbackSrc = '/logo_placeholder.png', // this should be a valid fallback image
  containerClassName = "",
  isThumbnail = false,
  ...props
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    if (fallbackSrc && img.src !== new URL(fallbackSrc, window.location.href).href) {
      img.src = fallbackSrc;
    } else if (!error) {
       setError(true);
       setLoading(false);
    }
    
    if (loading) setLoading(false);
  };

  const handleLoad = () => {
    setLoading(false);
  };

  const hasSrc = Boolean(src && src.trim() !== '');
  const isObjectFitProvided = className.includes('object-');

  const optimizedSrc = getOptimizedWebpUrl(src, isThumbnail, className);

  if (!hasSrc || error) {
    const initials = alt
      .split(' ')
      .map(word => word[0])
      .join('')
      .slice(0, 3)
      .toUpperCase();

    const isLogo = className.includes('rounded-full') || className.includes('logo') || alt.toLowerCase().includes('ateliê') || alt.toLowerCase().includes('pallyra') || alt.toLowerCase().includes('guennita') || alt.toLowerCase().includes('mimada');

    if (isLogo) {
      return (
        <div 
          className={`flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#faf6f0] to-[#f3ebd9] border border-[#e8dcc8]/60 ${className} ${containerClassName}`} 
          style={{ ...props.style, minWidth: '40px', minHeight: '40px' }}
        >
          <span className="font-serif font-black text-[#cca062] tracking-wider text-sm select-none">{initials || 'AT'}</span>
        </div>
      );
    }

    return (
      <div 
        className={`flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF9F6] to-[#E8DCC8]/20 border border-[#e8dcc8]/30 ${className} ${containerClassName}`} 
        style={props.style}
      >
        <div className="flex flex-col items-center justify-center p-4 text-center select-none pointer-events-none">
          <Heart className="w-5 h-5 mb-1 text-[#c36266]/40 animate-pulse" strokeWidth={1.5} />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#6d5443]/60 mb-0.5 leading-none">{alt || 'Item'}</span>
          <span className="text-[8px] uppercase tracking-widest text-[#6d5443]/30 font-medium">Exclusivo</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden flex-shrink-0 flex items-center justify-center bg-transparent ${className} ${containerClassName}`} style={props.style}>
      {loading && (
        <div className="absolute inset-0 bg-gray-200/50 animate-pulse z-10" />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'} ${isObjectFitProvided ? '' : 'object-cover'} ${className}`}
        onError={handleError}
        onLoad={handleLoad}
        referrerPolicy="no-referrer"
        loading="lazy"
        {...props}
      />
    </div>
  );
};
