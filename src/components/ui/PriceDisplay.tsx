import React from 'react';
import { formatCurrency } from '../../lib/currencyUtils';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  installments?: number;
  accentColor?: string;
  className?: string; // Container classes for positioning
  priceClassName?: string; // For the price span
  isDark?: boolean;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({ 
  price, 
  originalPrice, 
  installments = 2,
  accentColor,
  className = "",
  priceClassName = "",
  isDark = false
}) => {
  const installmentValue = price / installments;
  const displayAccentColor = accentColor || 'inherit';
  
  return (
    <div className={`flex flex-col gap-0.5 ${className} font-tahoma`}>
      <div className="flex flex-col items-start gap-y-0.5">
        {originalPrice && originalPrice > price && (
          <span 
            className="text-[10px] line-through font-bold uppercase tracking-tighter"
            style={{ color: displayAccentColor, opacity: 0.6 }}
          >
            DE: {formatCurrency(originalPrice)}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          {originalPrice && originalPrice > price && (
            <span 
              className="text-[10px] font-bold uppercase tracking-tighter"
              style={{ color: displayAccentColor, opacity: 0.6 }}
            >
              POR:
            </span>
          )}
          <span 
            className={`text-xl md:text-2xl font-black ${priceClassName} tracking-tight`}
            style={{ color: displayAccentColor }}
          >
            {formatCurrency(price)}
          </span>
        </div>
      </div>
      <span 
        className="text-[10px] font-black font-tahoma uppercase tracking-tight"
        style={{ 
          color: displayAccentColor,
          opacity: 0.75 // More legible
        }}
      >
        {installments}x {formatCurrency(installmentValue)}
      </span>
    </div>
  );
};
