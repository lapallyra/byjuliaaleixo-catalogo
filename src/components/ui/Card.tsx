import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  themeColor?: string; // If provided, adds a glowing frame effect on hover
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, glass, themeColor, style, children, ...props }, ref) => {
    
    // Base styles: Clean Premium UI, smooth transitions
    const baseStyles = "rounded-[24px] transition-all duration-300 relative bg-white border border-gray-100 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.02),0_1px_4px_rgba(0,0,0,0.02)]";
    
    const glassStyles = glass ? "bg-white/70 backdrop-blur-xl border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.08)]" : "";
    
    // Hover glow effect classes (we set the border color via inline style)
    const glowClasses = themeColor ? "border-2 border-transparent hover:shadow-[0_0_20px_-5px_var(--glow-color)] focus-within:shadow-[0_0_20px_-5px_var(--glow-color)] hover:border-[var(--glow-color)] focus-within:border-[var(--glow-color)]" : "";

    const dynamicStyle: React.CSSProperties = {
      ...style,
      ...(themeColor ? { '--glow-color': themeColor } as any : {})
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, glassStyles, glowClasses, className)}
        style={dynamicStyle}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
