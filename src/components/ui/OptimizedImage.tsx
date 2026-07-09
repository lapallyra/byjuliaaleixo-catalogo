import React, { useState, useEffect, useRef } from 'react';
import { ImageOff, Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'placeholder'> {
  src?: string | null;
  fallbackSrc?: string;
  containerClassName?: string;
  isThumbnail?: boolean;
  isCritical?: boolean; // When true, bypasses lazy loading and preloads immediately (e.g. above-the-fold, logos, avatars)
  aspectRatio?: string; // e.g. "aspect-square", "aspect-video", "aspect-[4/3]"
  fetchPriority?: 'high' | 'low' | 'auto';
}

// Global in-memory cache of fully fetched/loaded image URLs to prevent rendering flashes or duplicate network downloads
const loadedImageCache = new Set<string>();

/**
 * Optimizes Unsplash and external resource URLs to query and load WebP formatted images
 * at responsive, lightweight dimensions to drastically reduce render times and payload sizes.
 */
export const getOptimizedImageUrl = (srcStr: string | undefined | null, isThumbnail?: boolean, className: string = "", altText: string = ""): string => {
  if (!srcStr) return '';
  const src = srcStr.trim();
  if (src === '' || src.length < 5) return src;

  const altLower = altText.toLowerCase();
  const clsLower = className.toLowerCase();

  const isAvatar = clsLower.includes('avatar') || altLower.includes('avatar');
  const isLogo = clsLower.includes('logo') || altLower.includes('logo') || altLower.includes('ateliê') || altLower.includes('pallyra');

  // Define target sizing strictly following physical guidelines
  let targetWidth = 1024;
  if (isAvatar) {
    targetWidth = 256;
  } else if (isLogo) {
    targetWidth = 512;
  } else if (isThumbnail) {
    targetWidth = 360;
  }

  // Support intelligent URL formatting with browser caching parameter safety (?v=)
  try {
    const url = new URL(src);

    // Apply WebP/AVIF force formats on Unsplash or similar CDN formats
    if (url.hostname.includes('images.unsplash.com')) {
      url.searchParams.set('fm', 'webp');
      url.searchParams.set('q', '80');
      url.searchParams.set('w', targetWidth.toString());
      url.searchParams.set('fit', 'crop');
    } else {
      // For general services, append size parameters if supported or append dynamic query cache indicators safely
      if (!url.searchParams.has('w') && !url.searchParams.has('width')) {
        url.searchParams.set('w', targetWidth.toString());
      }
    }

    // Attach automatic, persistent cache version tag if not already existing, ensuring efficient browser/CDN cache control
    if (!url.searchParams.has('v')) {
      url.searchParams.set('v', '1.0.4');
    }

    return url.toString();
  } catch (e) {
    // Return sanitized URL with query safe caching tag if custom constructor fails
    let optimized = src;
    if (optimized.includes('images.unsplash.com')) {
      if (optimized.includes('auto=format')) {
        optimized = optimized.replace('auto=format', 'fm=webp');
      } else if (!optimized.includes('fm=')) {
        optimized += optimized.includes('?') ? '&fm=webp' : '?fm=webp';
      }
      if (!optimized.includes('w=')) {
        optimized += `&w=${targetWidth}`;
      }
    }
    const versionQuery = optimized.includes('?') ? `&v=1.0.4` : `?v=1.0.4`;
    if (!optimized.includes('v=')) {
      optimized += versionQuery;
    }
    return optimized;
  }
};

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = "Imagem",
  className = "",
  containerClassName = "",
  fallbackSrc,
  isThumbnail = false,
  isCritical = false,
  aspectRatio = "aspect-square",
  fetchPriority,
  ...props
}) => {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if image is highly critical (logos, avatars, above-the-fold, etc.)
  const isImageCritical = isCritical || 
    className.includes('logo') || 
    className.includes('avatar') || 
    alt.toLowerCase().includes('logo') || 
    alt.toLowerCase().includes('avatar') ||
    alt.toLowerCase().includes('ateliê') || 
    alt.toLowerCase().includes('pallyra');

  // 1. Lazy loading controller utilizing highly optimized browser IntersectionObserver
  useEffect(() => {
    if (isImageCritical) {
      setIsInView(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '150px', // Preloads slightly before enter viewpoint to guarantee zero stutter
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isImageCritical]);

  // 2. State synchronization, pre-fetching trigger, and immediate memory-cache lookup
  useEffect(() => {
    if (!src || src.trim() === '') {
      setStatus('error');
      setCurrentSrc(null);
      return;
    }

    const optimized = getOptimizedImageUrl(src, isThumbnail, className, alt);
    setCurrentSrc(optimized);

    // If already resides in in-memory cache, skip loading state completely to prevent Layout Shift
    if (loadedImageCache.has(optimized)) {
      setStatus('loaded');
    } else {
      setStatus('loading');
    }

    // Dynamic browser link preloader effect for critical elements
    if (isImageCritical && !loadedImageCache.has(optimized)) {
      const imgPreload = new Image();
      imgPreload.src = optimized;
    }
  }, [src, isThumbnail, className, isImageCritical, alt]);

  const handleLoad = () => {
    if (currentSrc) {
      loadedImageCache.add(currentSrc);
    }
    setStatus('loaded');
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
    } else {
      setStatus('error');
    }
  };

  const isObjectFitProvided = className.includes('object-');

  // Extract all rounded- classes (e.g., rounded-full, rounded-2xl, etc.) from props to ensure perfect masking/clipping on all states
  const combinedClasses = `${className} ${containerClassName}`;
  const roundedClasses = combinedClasses
    .split(/\s+/)
    .filter(c => c.startsWith('rounded-') || c === 'rounded')
    .filter((v, i, a) => a.indexOf(v) === i) // Unique values
    .join(' ');

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden w-full h-full bg-stone-50 select-none ${aspectRatio} ${containerClassName} ${roundedClasses}`}
      style={props.style}
    >
      <AnimatePresence mode="popLayout">
        {/* State 1: Shimmering skeleton viewport shown only if NOT in memory-cache yet */}
        {status === 'loading' && (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-br from-[#faf9f6] via-[#faf6ef] to-[#f4ebe0]/50 ${roundedClasses}`}
          >
            {/* Seamless metallic sliding shine animation */}
            <div className={`absolute inset-0 bg-[linear-gradient(110deg,#ece5d8,30%,#faf9f6,45%,#ece5d8,60%)] bg-[length:200%_100%] animate-shimmer ${roundedClasses}`} 
              style={{
                animation: 'shimmer 1.6s infinite linear'
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-1.5 opacity-40">
              <Sparkles className="w-5 h-5 text-[#cca062] animate-pulse" strokeWidth={1.5} />
            </div>
          </motion.div>
        )}

        {/* State 2: No-text high-fidelity custom brand fallback container on resource failures */}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#FAF9F6] to-[#E8DCC8]/20 border border-[#e8dcc8]/20 p-4 ${roundedClasses}`}
          >
            <div className="flex flex-col items-center text-center max-w-[85%] select-none pointer-events-none">
              <Heart className="w-4 h-4 mb-1 text-[#cca062]/50 animate-pulse" strokeWidth={1.5} />
              <span className="text-[8px] uppercase tracking-[0.25em] text-[#6d5443]/40 font-black leading-none">Exclusivo</span>
              <span className="text-[7px] uppercase tracking-widest text-[#6d5443]/20 font-bold mt-1">Garantia Ateliê</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* State 3: Gracefully transitioning high speed actual img layer when scrolled into screen view */}
      {currentSrc && isInView && (
        <img
          src={currentSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          fetchPriority={fetchPriority as any}
          className={`w-full h-full transition-all duration-500 ease-out ${
            status === 'loaded' 
              ? 'opacity-100 scale-100 blur-0' 
              : 'opacity-0 scale-98 blur-xs'
          } ${isObjectFitProvided ? '' : 'object-cover'} ${className} ${roundedClasses}`}
          style={{
            ...props.style,
            visibility: status === 'error' ? 'hidden' : 'visible'
          }}
          {...props}
        />
      )}

      {/* Embedded optimized shimmer css definition */}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
    </div>
  );
};
