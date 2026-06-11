import React from 'react';
import { OptimizedImage } from './ui/OptimizedImage';

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
      let optimized = src;
      if (optimized.includes('auto=format')) {
        optimized = optimized.replace('auto=format', 'fm=webp');
      } else if (!optimized.includes('fm=')) {
        optimized += optimized.includes('?') ? '&fm=webp' : '?fm=webp';
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
  fallbackSrc = '/logo_placeholder.png',
  containerClassName = "",
  isThumbnail = false,
  ...props
}) => {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      className={className}
      containerClassName={containerClassName}
      fallbackSrc={fallbackSrc}
      isThumbnail={isThumbnail}
      // Deduce aspect ratio if class names contain custom layout dimensions or aspect tags
      aspectRatio={className.includes('aspect-') ? undefined : "aspect-none"}
      {...props}
    />
  );
};

