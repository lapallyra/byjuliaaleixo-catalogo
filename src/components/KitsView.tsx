import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { CatalogHeader } from './Catalog/CatalogHeader';
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {kits.map(kit => (
             <div key={kit.id} className="bg-white p-6 rounded-3xl border border-[#cca062]/20 shadow-lg text-left">
                <img src={kit.image} alt={kit.product_name} className="w-full h-48 object-cover rounded-2xl mb-4" />
                <h3 className="font-bold text-lg text-[#6d5443]">{kit.product_name}</h3>
                <p className="text-sm text-[#6d5443]/70 mb-4">{kit.description}</p>
                <div className="flex justify-between items-center">
                    <span className="font-black text-xl text-[#6d5443]">R$ {kit.retail_price.toFixed(2)}</span>
                    <button className="bg-[#cca062] text-white px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">Ver</button>
                </div>
             </div>
          ))}
        </div>
      )}
    </div>
  );
};
