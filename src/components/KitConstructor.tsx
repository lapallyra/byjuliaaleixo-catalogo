import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { ShoppingCart } from 'lucide-react';
import { formatCurrency } from '../lib/currencyUtils';

interface KitConstructorProps {
  allProducts: Product[];
}

export const KitConstructor: React.FC<KitConstructorProps> = ({ allProducts }) => {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, { product: Product; quantity: number }>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    return Array.from(new Set(allProducts.map(p => p.category))).sort();
  }, [allProducts]);

  const total = useMemo(() => {
    return Object.values(selectedProducts).reduce((sum, item) => sum + (item.product.retail_price * item.quantity), 0);
  }, [selectedProducts]);

  const toggleCategory = (cat: string) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const handleProductSelection = (product: Product, quantity: number) => {
    setSelectedProducts(prev => {
      const next = { ...prev };
      if (quantity === 0) {
        delete next[product.id];
      } else {
        next[product.id] = { product, quantity };
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] pb-24">
      <div className="p-4 bg-white border-b border-neutral-100 sticky top-0 z-20">
        <h1 className="text-2xl font-serif font-black text-[#6d5443] text-center">Monte seu Presente</h1>
      </div>

      {categories.map(cat => (
        <div key={cat} className="border-b border-neutral-200">
          <button 
            className="w-full p-4 flex justify-between font-black uppercase text-xs tracking-widest text-[#6d5443]"
            onClick={() => toggleCategory(cat)}
          >
            {cat}
            <span>{expandedCategory === cat ? '−' : '+'}</span>
          </button>
          {expandedCategory === cat && (
            <div className="p-4 grid grid-cols-2 gap-4">
              {allProducts.filter(p => p.category === cat).map(product => (
                <div key={product.id} className="bg-white p-2 border border-neutral-100 rounded-xl" onClick={() => handleProductSelection(product, (selectedProducts[product.id]?.quantity || 0) + 1)}>
                   <img src={product.image} className="w-full aspect-square object-cover rounded-lg mb-2" />
                   <p className="text-[10px] font-bold text-[#6d5443] truncate">{product.product_name}</p>
                   <p className="text-[10px] text-neutral-500">{formatCurrency(product.retail_price)}</p>
                   {selectedProducts[product.id] && <span className="text-[8px] bg-[#cca062] text-white px-2 py-0.5 rounded-full mt-1 inline-block">Selecionado: {selectedProducts[product.id].quantity}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-neutral-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-30">
        <div className="flex justify-between items-center">
            <span className="text-lg font-black text-[#6d5443]">{formatCurrency(total)}</span>
            <button className="flex items-center gap-2 bg-[#cca062] text-white px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest">
                <ShoppingCart size={14} />
                Finalizar Kit
            </button>
        </div>
      </div>
    </div>
  );
};
