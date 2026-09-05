import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalScrollProps {
  children: React.ReactNode;
  className?: string;
  itemWidth?: number; // Optional: amount to scroll on click, defaults to 300
}

export const HorizontalScroll: React.FC<HorizontalScrollProps> = ({ children, className = '', itemWidth = 300 }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    // Use a small threshold (e.g. 1px) to prevent precision issues
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 1);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [children]); // Re-check if children change

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -itemWidth : itemWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="relative group/hscroll w-full flex items-center min-w-0">
      {showLeft && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scroll('left');
          }}
          className="absolute left-1 z-20 w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-slate-300 rounded-full shadow-md text-slate-700 hover:text-black hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/hscroll:opacity-100"
          aria-label="Rolar para a esquerda"
        >
          <ChevronLeft size={18} />
        </button>
      )}
      
      {/* Scrollable Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className={`w-full overflow-x-auto scrollbar-none scroll-smooth ${className}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {showRight && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            scroll('right');
          }}
          className="absolute right-1 z-20 w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-sm border border-slate-300 rounded-full shadow-md text-slate-700 hover:text-black hover:bg-white hover:scale-105 transition-all opacity-0 group-hover/hscroll:opacity-100"
          aria-label="Rolar para a direita"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};
