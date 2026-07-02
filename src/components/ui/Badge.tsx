import React, { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'outline' | 'brand';
  themeColor?: string; // Used for brand variant
}

export const Badge: React.FC<BadgeProps> = ({ 
  className, 
  variant = 'default', 
  themeColor,
  style,
  children, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-colors";
  
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    error: "bg-rose-100 text-rose-800",
    outline: "border border-gray-200 text-gray-800",
    brand: "", // Styles applied dynamically
  };

  const dynamicStyle: React.CSSProperties = { ...style };

  if (variant === 'brand' && themeColor) {
    dynamicStyle.backgroundColor = `${themeColor}15`; // 15% opacity
    dynamicStyle.color = themeColor;
  } else if (variant === 'brand') {
    // Fallback if no themeColor provided
    variantStyles.brand = "bg-gray-900 text-white";
  }

  return (
    <span
      className={cn(baseStyles, variantStyles[variant], className)}
      style={dynamicStyle}
      {...props}
    >
      {children}
    </span>
  );
};
