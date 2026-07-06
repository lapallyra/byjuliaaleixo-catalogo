import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS } from '../constants';
import { Product, Campaign } from '../types';
import { ProductCard } from './ui/ProductCard';
import { themes } from '../lib/theme';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscribeToCampaigns, subscribeToProducts } from '../services/firebaseService';

export function VitrinePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'Todos';

  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [allProducts, setAllProducts] = useState<Product[]>(PRODUCTS);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const unsubProducts = subscribeToProducts(setAllProducts);
    const unsubCampaigns = subscribeToCampaigns(setCampaigns);
    return () => {
      unsubProducts();
      unsubCampaigns();
    };
  }, []);

  // Update category when URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    }
  }, [searchParams]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(allProducts.map(p => p.category)));
    return ['Todos', ...cats];
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    
    if (selectedCategory !== 'Todos') {
      result = result.filter(p => p.category === selectedCategory);
    }

    const filter = searchParams.get('filter');
    if (filter === 'top') {
      result = result.sort((a, b) => (b.clicksCount || 0) - (a.clicksCount || 0));
    } else if (filter === 'new') {
      result = result.sort((a, b) => {
        const dateA = a.createdAt?.seconds || new Date(a.createdAt || 0).getTime();
        const dateB = b.createdAt?.seconds || new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
    }

    return result;
  }, [selectedCategory, allProducts, searchParams]);

  const catalogCampaign = useMemo(() => {
    const campaignId = searchParams.get('campaign');
    if (campaignId) {
      const specific = campaigns.find(c => c.id === campaignId);
      if (specific) return specific;
    }

    const now = new Date();
    return campaigns
      .filter(c => 
        c.active && 
        c.targetPages?.includes('catalog') &&
        (!c.startDate || new Date(c.startDate) <= now) &&
        (!c.endDate || new Date(c.endDate) >= now)
      )
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];
  }, [campaigns, searchParams]);

  const campaignProducts = useMemo(() => {
    if (catalogCampaign && catalogCampaign.items) {
      return allProducts.filter(p => catalogCampaign.items.includes(p.id));
    }
    return allProducts.filter(p => p.isFeatured).slice(0, 8);
  }, [catalogCampaign, allProducts]);

  const featuredProduct = useMemo(() => {
    if (catalogCampaign?.highlightProductId) {
      return allProducts.find(p => p.id === catalogCampaign.highlightProductId);
    }
    return campaignProducts[0];
  }, [catalogCampaign, campaignProducts, allProducts]);

  const otherCampaignProducts = campaignProducts.filter(p => p.id !== featuredProduct?.id).slice(0, 8);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Campaign Section */}
        <section className="mb-20">
          <h1 className="text-4xl md:text-5xl font-light mb-4 text-center">
            {catalogCampaign?.title || "Campanha da Semana"}
          </h1>
          <p className="text-center text-gray-500 mb-10 text-lg">
            {catalogCampaign?.description || "Descubra nossas seleções exclusivas desta semana."}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-50 p-8 rounded-3xl border border-gray-100">
            {featuredProduct && (
              <div className="space-y-6">
                <div className="text-xs font-bold tracking-[0.2em] uppercase text-[#cca062]">Destaque da Campanha</div>
                <h2 className="text-4xl font-medium tracking-tight text-gray-900">{featuredProduct.product_name}</h2>
                <p className="text-gray-600 leading-relaxed">{featuredProduct.description}</p>
                <p className="text-3xl font-light text-gray-900">R$ {featuredProduct.current_price.toFixed(2)}</p>
                <button 
                  onClick={() => {
                    const targetRoute = featuredProduct.company === 'pallyra' ? '/lapallyra' : featuredProduct.company === 'guennita' ? '/comamorguennita' : featuredProduct.company === 'mimada' ? '/mimadasim' : '/tuttymimo';
                    navigate(`${targetRoute}?product=${featuredProduct.id}`);
                  }}
                  className="bg-gray-900 text-white px-10 py-4 rounded-full hover:bg-black transition-all shadow-lg active:scale-95"
                >
                  Comprar Agora
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              {otherCampaignProducts.map(p => (
                <div 
                  key={p.id} 
                  onClick={() => {
                    const targetRoute = p.company === 'pallyra' ? '/lapallyra' : p.company === 'guennita' ? '/comamorguennita' : p.company === 'mimada' ? '/mimadasim' : '/tuttymimo';
                    navigate(`${targetRoute}?product=${p.id}`);
                  }}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center group cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-gray-50">
                    <img src={p.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-900 truncate px-1">{p.product_name}</div>
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
