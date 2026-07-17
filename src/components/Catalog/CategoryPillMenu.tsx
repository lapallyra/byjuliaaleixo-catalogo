
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
    <div className="flex justify-center my-10 px-4 max-w-full">
      <HorizontalScroll className="flex flex-row flex-nowrap bg-white/40 backdrop-blur-xl p-1.5 rounded-full gap-2 w-fit shadow-[0_10px_30px_rgba(58,49,45,0.06)] border border-white/30 h-14 items-center">
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
              className={`relative flex items-center justify-center rounded-full h-11 cursor-pointer outline-none transition-all duration-500 select-none shrink-0 px-3 ${
                isSelected 
                  ? 'text-white shadow-md shadow-[#3A312D]/20' 
                  : 'text-[#3A312D] hover:bg-white/60'
              }`}
              animate={{
                width: isExpanded ? 'auto' : 44,
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

              <div className="relative z-10 flex items-center gap-2 overflow-visible">
                <div className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-500 shrink-0 ${isSelected ? 'bg-white/10' : 'bg-[#3A312D]/5 shadow-inner'}`}>
                  <IconComponent 
                    size={18} 
                    className={`transition-transform duration-500 ${isSelected ? 'scale-110 text-[#cca062]' : 'text-[#3A312D]'}`}
                  />
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-[11px] font-black tracking-[0.08em] whitespace-nowrap uppercase pr-2"
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

