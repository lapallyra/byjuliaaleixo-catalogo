import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  themeColor?: string; // Hex color from active theme (e.g., accentColor)
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, themeColor, children, disabled, style, ...props }, ref) => {
    
    // Base styles:
    // - Smooth transitions (180ms - 220ms matches standard UI guidelines)
    // - Pressed scale effect (active:scale-[0.98])
    // - Clear focus states
    const baseStyles = "inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";
    
    // Size variants
    const sizeStyles = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    };

    // Construct the final inline style to apply theme colors when variants need them
    // Primary: bg-theme, text-white
    // Secondary: bg-theme/10, text-theme
    // Ghost: text-theme, hover:bg-theme/10
    // Danger: hardcoded rose (can still use tailwind classes)

    const dynamicStyle: React.CSSProperties = { ...style };
    
    // We will use classes for Danger, but inline styles for Primary/Secondary/Ghost using themeColor
    const variantClasses = {
      primary: themeColor ? "" : "bg-gray-900 text-white hover:bg-gray-800 shadow-sm",
      secondary: themeColor ? "" : "bg-gray-100 text-gray-900 hover:bg-gray-200",
      ghost: themeColor ? "" : "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
      danger: "bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700",
    };

    if (themeColor) {
      if (variant === 'primary') {
        dynamicStyle.backgroundColor = themeColor;
        dynamicStyle.color = '#fff';
      } else if (variant === 'secondary') {
        dynamicStyle.backgroundColor = `${themeColor}15`; // 15% opacity
        dynamicStyle.color = themeColor;
      } else if (variant === 'ghost') {
        dynamicStyle.color = themeColor;
      }
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          sizeStyles[size],
          variantClasses[variant],
          // Apply some conditional hover opacity if using dynamic theme background for primary
          variant === 'primary' && themeColor && "hover:opacity-90 shadow-sm",
          variant === 'ghost' && themeColor && "hover:opacity-80",
          className
        )}
        style={dynamicStyle}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
