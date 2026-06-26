
import React from 'react';
import { useEditorStore } from '../store/editorStore';

export const ProductLibrary: React.FC = () => {
  const { setProduct } = useEditorStore();
  
  // Here we would fetch products and show them
  const products = [
    { id: '1', name: 'Fundo do Mar', category: 'Sacolas' },
  ];

  return (
    <div className="space-y-4">
      {products.map(p => (
        <button 
          key={p.id}
          onClick={() => setProduct(p)}
          className="w-full p-3 bg-gray-50 rounded-lg border hover:border-gray-300 text-left font-sans text-sm"
        >
          {p.name} - {p.category}
        </button>
      ))}
    </div>
  );
};
