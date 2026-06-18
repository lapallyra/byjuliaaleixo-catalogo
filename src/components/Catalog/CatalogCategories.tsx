import React from 'react';
import { LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';

interface CatalogCategoriesProps {
  categories: string[];
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
  theme: any;
  getCategoryIcon: (category: string) => React.ReactNode;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

export function CatalogCategories({
  categories,
  selectedCategory,
  onSelectCategory,
  theme,
  getCategoryIcon,
  isSidebarCollapsed,
  setIsSidebarCollapsed,
}: CatalogCategoriesProps) {
  return (
    <>
      {/* Vertical Collapsible Category Sidebar (Desktop) */}
      <aside 
        className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} hidden md:flex flex-col border-r transition-all duration-500 bg-white/60 backdrop-blur-md sticky top-0 h-full overflow-hidden shrink-0`}
        style={{ borderColor: `${theme.accentColor}12` }}
      >
        <div 
          className="p-4 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${theme.accentColor}12` }}
        >
          {!isSidebarCollapsed && (
            <span className="text-[9px] font-bold uppercase tracking-[0.22em]" style={{ color: theme.accentColor }}>Categorias</span>
          )}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
            className="p-2 rounded-lg transition-colors hover:bg-black/[0.02]"
            style={{ color: theme.accentColor }}
          >
              {isSidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 scrollbar-none">
          <button
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${!selectedCategory ? 'text-white font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.06),_inset_0_1.5px_0_rgba(255,255,255,0.25),_inset_0_-2px_0_rgba(0,0,0,0.12)]' : 'text-[#6d5443] hover:scale-[1.01] border border-transparent'}`}
            style={{ 
              backgroundColor: !selectedCategory ? theme.accentColor : 'transparent',
              borderColor: !selectedCategory ? `${theme.accentColor}40` : 'transparent',
              borderWidth: '1px'
            }}
            onMouseEnter={(e) => {
              if (selectedCategory) {
                e.currentTarget.style.backgroundColor = `${theme.accentColor}0e`;
                e.currentTarget.style.borderColor = `${theme.accentColor}18`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedCategory) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <LayoutGrid size={16} />
            {!isSidebarCollapsed && <span className="text-xs font-semibold tracking-wider whitespace-nowrap">Tudo</span>}
          </button>
          
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={`side-${category}`}
                onClick={() => onSelectCategory(category)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'text-white font-extrabold shadow-[0_4px_12px_rgba(0,0,0,0.06),_inset_0_1.5px_0_rgba(255,255,255,0.25),_inset_0_-2px_0_rgba(0,0,0,0.12)]' : 'text-[#5c4a3d]/85 hover:scale-[1.01] border border-transparent'}`}
                style={{ 
                  backgroundColor: isActive ? theme.accentColor : 'transparent',
                  borderColor: isActive ? `${theme.accentColor}40` : 'transparent',
                  borderWidth: '1px'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = `${theme.accentColor}0e`;
                    e.currentTarget.style.borderColor = `${theme.accentColor}18`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {getCategoryIcon(category)}
                {!isSidebarCollapsed && <span className="text-xs font-semibold tracking-wider whitespace-nowrap line-clamp-1">{category}</span>}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Horizontal Category Pill Menu for Mobile */}
      <div className="md:hidden flex overflow-x-auto gap-2 pb-6 scrollbar-none snap-x">
        <button
          onClick={() => onSelectCategory(null)}
          className={`px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-300 ${!selectedCategory ? 'text-white shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.25),_inset_0_-2px_0_rgba(0,0,0,0.12)]' : 'bg-white text-[#6d5443]'}`}
          style={{ 
            backgroundColor: !selectedCategory ? theme.accentColor : '#ffffff',
            borderColor: !selectedCategory ? `${theme.accentColor}30` : `${theme.accentColor}12`,
            borderWidth: '1px'
          }}
        >
          Tudo
        </button>
        {categories.map((category) => {
          const isActive = selectedCategory === category;
          return (
            <button
              key={`pill-${category}`}
              onClick={() => onSelectCategory(category)}
              className={`px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-[0.16em] whitespace-nowrap transition-all duration-300 ${isActive ? 'text-white shadow-[0_4px_10px_rgba(0,0,0,0.1),_inset_0_1px_0_rgba(255,255,255,0.25),_inset_0_-2px_0_rgba(0,0,0,0.12)]' : 'bg-white text-[#5c4a3d]'}`}
              style={{ 
                backgroundColor: isActive ? theme.accentColor : '#ffffff',
                borderColor: isActive ? `${theme.accentColor}30` : `${theme.accentColor}12`,
                borderWidth: '1px'
              }}
            >
              {category}
            </button>
          );
        })}
      </div>
    </>
  );
}
