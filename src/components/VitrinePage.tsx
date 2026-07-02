import React, { useState, useMemo } from 'react';
import { PRODUCTS } from '../constants';
import { Product } from '../types';
import { ProductCard } from './ui/ProductCard';
import { themes } from '../lib/theme';
import { useNavigate } from 'react-router-dom';

export function VitrinePage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');

  const categories = useMemo(() => {
    const cats = Array.from(new Set(PRODUCTS.map(p => p.category)));
    return ['Todos', ...cats];
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'Todos') return PRODUCTS;
    return PRODUCTS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const campaignProducts = PRODUCTS.filter(p => p.isFeatured).slice(0, 8);
  const featuredProduct = campaignProducts[0];
  const otherCampaignProducts = campaignProducts.slice(1, 8);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Campaign Section */}
        <section className="mb-20">
          <h1 className="text-4xl md:text-5xl font-light mb-4 text-center">Campanha da Semana</h1>
          <p className="text-center text-gray-500 mb-10 text-lg">Descubra nossas seleções exclusivas desta semana.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 p-6 rounded-2xl">
            {featuredProduct && (
              <div className="space-y-4">
                <div className="text-sm font-semibold tracking-widest uppercase text-gray-400">Destaque</div>
                <h2 className="text-3xl font-medium">{featuredProduct.product_name}</h2>
                <p className="text-gray-600">{featuredProduct.description}</p>
                <p className="text-2xl font-semibold">R$ {featuredProduct.current_price.toFixed(2)}</p>
                <button className="bg-gray-900 text-white px-8 py-3 rounded-full hover:bg-gray-800 transition">Comprar Agora</button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {otherCampaignProducts.map(p => (
                <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm text-center">
                  <div className="text-4xl mb-2">{p.image}</div>
                  <div className="text-sm font-medium">{p.product_name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="mb-12">
          <div className="flex flex-wrap justify-center gap-4">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full border ${selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-900'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Products Grid */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredProducts.map(p => (
              <ProductCard 
                key={p.id}
                product={p}
                theme={themes[p.company || 'pallyra']}
                onAddToCart={(prod) => {
                  const targetRoute = prod.company === 'pallyra' ? '/lapallyra' 
                                    : prod.company === 'guennita' ? '/comamorguennita' 
                                    : prod.company === 'mimada' ? '/mimadasim' 
                                    : '/tuttymimo';
                  navigate(`${targetRoute}?product=${prod.id}`);
                }}
                onClick={(prod) => {
                  const targetRoute = prod.company === 'pallyra' ? '/lapallyra' 
                                    : prod.company === 'guennita' ? '/comamorguennita' 
                                    : prod.company === 'mimada' ? '/mimadasim' 
                                    : '/tuttymimo';
                  navigate(`${targetRoute}?product=${prod.id}`);
                }}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
