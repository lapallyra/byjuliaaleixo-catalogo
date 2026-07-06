import React from 'react';
import { SiteSettings } from '../../types';
import { ImageWithFallback } from '../ImageWithFallback';

interface AtelierImageProps {
  atelier: SiteSettings | undefined;
  className?: string;
  alt?: string;
}

export const AtelierImage: React.FC<AtelierImageProps> = ({ atelier, className, alt }) => {
  const isotipo = atelier?.store_isotipo;

  // STRICT RULE: Only isotipo is allowed for public UI.
  // If no isotipo, fallback to broken heart icon.
  if (!isotipo) {
    return (
      <div className={`flex items-center justify-center bg-gray-50 border border-gray-200 ${className}`}>
        💔
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={isotipo}
      alt={alt || atelier?.store_name || 'Atelier'}
      className={className}
    />
  );
};
