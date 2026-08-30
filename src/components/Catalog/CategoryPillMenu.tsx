
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkle, Palette, Stamp, CupSoda as Cup, ShoppingBasket, Diamond, Heart, Briefcase, Flower2, Coffee } from 'lucide-react';
import { HorizontalScroll } from '../shared/HorizontalScroll';

interface CategoryPillMenuProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
}

// Map the icons beautifully for a cohesive theme
const iconMap: Record<string, any> = {
  'Todos': Sparkle,
  'Papelaria': Stamp,
  'Decoração': Palette,
  'Home Decor': Flower2,
  'Luxo': Diamond,
  'Beleza': Sparkle,
  'Fashion': ShoppingBasket,
  'Acessórios': Heart,
  'Utensílios': Cup || Coffee,
  'Corporativo': Briefcase,
};

export const CategoryPillMenu: React.FC<CategoryPillMenuProps> = ({ categories, selectedCategory, onSelectCategory }) => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const allCategories = ['Todos', ...categories];

  return (
    <div className="flex justify-center my-1 px-2 max-w-full">
      <HorizontalScroll className="flex flex-row flex-nowrap bg-white/40 backdrop-blur-xl p-1 rounded-full gap-1.5 w-fit shadow-[0_4px_20px_rgba(58,49,45,0.04)] border border-white/30 h-12 items-center">
        {allCategories.map((cat) => {
          const IconComponent = iconMap[cat] || Sparkle;
          const isSelected = selectedCategory === (cat === 'Todos' ? null : cat);
          const isExpanded = isSelected || hoveredCat === cat;

          return (
            <motion.button
              key={cat}
              onMouseEnter={() => setHoveredCat(cat)}
              onMouseLeave={() => setHoveredCat(null)}
              onClick={() => onSelectCategory(cat === 'Todos' ? null : cat)}
              className={`relative flex items-center justify-center rounded-full h-10 cursor-pointer outline-none transition-all duration-300 select-none shrink-0 px-2.5 ${
                isSelected 
                  ? 'text-white shadow-sm shadow-[#3A312D]/20' 
                  : 'text-[#3A312D] hover:bg-white/60'
              }`}
              animate={{
                width: isExpanded ? 'auto' : 40,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-[#3A312D] rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                />
              )}

              <div className="relative z-10 flex items-center gap-1.5 overflow-visible">
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 shrink-0 ${isSelected ? 'bg-white/10' : 'bg-[#3A312D]/5'}`}>
                  <IconComponent 
                    size={16} 
                    className={`transition-transform duration-300 ${isSelected ? 'scale-105 text-[#cca062]' : 'text-[#3A312D]'}`}
                  />
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10.5px] font-black tracking-[0.08em] whitespace-nowrap uppercase pr-1.5"
                    >
                      {cat}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </motion.button>
          );
        })}
      </HorizontalScroll>
    </div>
  );
};

