
import React from 'react';
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
  const allCategories = ['Todos', ...categories];

  return (
    <div className="flex justify-start my-8 px-4 md:px-8 max-w-full">
      <HorizontalScroll className="bg-[#FAF9F6]/80 backdrop-blur-md p-1.5 rounded-full border border-[#e8dcc8]/60 gap-1.5 shadow-sm max-w-full">
        {allCategories.map((cat, index) => {
          // Resolve correct icon with fallbacks
          const IconComponent = iconMap[cat] || Sparkle;
          const isSelected = selectedCategory === (cat === 'Todos' ? null : cat);

          return (
            <motion.button
              key={cat}
              onClick={() => onSelectCategory(cat === 'Todos' ? null : cat)}
              className={`relative flex items-center justify-center rounded-full py-2.5 px-4 cursor-pointer outline-none transition-colors duration-300 select-none ${
                isSelected 
                  ? 'text-white' 
                  : 'text-[#3A312D] hover:bg-[#3A312D]/5'
              }`}
            >
              {/* Active Slide Background */}
              {isSelected && (
                <motion.div
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-[#3A312D] rounded-full z-0"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon and Label Container */}
              <div className="relative z-10 flex items-center">
                <IconComponent 
                  size={18} 
                  className={`transition-transform duration-300 ${isSelected ? 'scale-110 text-white' : 'text-[#3A312D]/80'}`}
                />
                
                {/* Expand and Pin Active Category Name */}
                <motion.span
                  initial={{ width: 0, opacity: 0, marginLeft: 0 }}
                  animate={{ 
                    width: isSelected ? 'auto' : 0, 
                    opacity: isSelected ? 1 : 0,
                    marginLeft: isSelected ? 8 : 0
                  }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="text-xs md:text-sm font-semibold tracking-wide whitespace-nowrap overflow-hidden uppercase font-poppins"
                >
                  {cat}
                </motion.span>
              </div>
            </motion.button>
          );
        })}
      </HorizontalScroll>
    </div>
  );
};

