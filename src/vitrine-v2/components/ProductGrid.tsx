import React from 'react';
import { ProductCard } from './ProductCard';
import { VitrineProduct } from '../data/products';

interface ProductGridProps {
  products: VitrineProduct[];
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-20 px-4 select-none">
        <span className="text-4xl text-[#D4AF37]/45 mb-4 block animate-bounce-short">✨</span>
        <h3 className="font-serif text-lg font-bold text-[#111111] uppercase tracking-wide">
          Nenhum presente localizado
        </h3>
        <p className="font-sans text-xs text-[#6D5443] max-w-sm mx-auto mt-1.5 leading-relaxed">
          Tente alterar seus filtros de categoria ou busque por novidades exclusivas em nossa curadoria especial.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
