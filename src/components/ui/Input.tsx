import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  themeColor?: string; // Optional brand color for focus ring
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, themeColor, icon, style, ...props }, ref) => {
    
    const dynamicStyle = {
      ...style,
      ...(themeColor && !error ? { '--tw-ring-color': `${themeColor}50`, '--focus-border': themeColor } as any : {})
    };

    return (
      <div className="relative w-full">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            "w-full bg-[#F8F5F2] border rounded-2xl p-4 outline-none transition-all text-sm font-medium text-gray-800 placeholder:text-gray-400",
            icon ? "pl-11" : "",
            error 
              ? "border-rose-300 focus:ring-2 focus:ring-rose-100" 
              : themeColor 
                ? "border-transparent focus:ring-2 focus:border-[var(--focus-border)]"
                : "border-transparent focus:ring-2 focus:ring-gray-200",
            className
          )}
          style={dynamicStyle}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
