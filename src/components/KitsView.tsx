import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { CatalogHeader } from './Catalog/CatalogHeader';
import { CatalogProductCard } from './Catalog/CatalogProductCard';
import { themes } from '../lib/theme';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

interface KitsViewProps {
  allProducts: Product[];
}

export const KitsView: React.FC<KitsViewProps> = ({ allProducts }) => {
  const navigate = useNavigate();
  const kits = useMemo(() => allProducts.filter(p => p.isKit && p.kitType === 'kit_pronto'), [allProducts]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 text-center">
      <h1 className="text-3xl font-serif font-black text-[#6d5443] mb-8">Nossos Kits Exclusivos</h1>
      {kits.length === 0 ? (
        <p className="text-neutral-500">Nenhum kit pronto disponível no momento.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {kits.map(kit => (
            <CatalogProductCard 
              key={kit.id}
              product={kit}
              theme={themes[kit.company || 'pallyra']}
              onAddToCart={() => navigate(`/kits?product=${kit.id}`)}
              onClick={() => navigate(`/kits?product=${kit.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
