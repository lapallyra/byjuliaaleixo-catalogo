import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, ShoppingBag, Info, Sparkles } from 'lucide-react';
import { ProductCard } from './ui/ProductCard';
import { promotionalCampaignService } from '../services/promotionalCampaignService';
import { Product, PromotionalCampaign } from '../types';
import { LoadingScreen } from './LoadingScreen';
import { ProductDetailModal } from './ProductDetailModal';

interface PromotionalCampaignPageProps {
  allProducts: Product[];
}

export function PromotionalCampaignPage({ allProducts }: PromotionalCampaignPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModalProduct, setSelectedModalProduct] = useState<Product | null>(null);

  useEffect(() => {
    async function fetchCampaign() {
      if (!slug) return;
      try {
        const data = await promotionalCampaignService.getBySlug(slug);
        setCampaign(data);
      } catch (error) {
        console.error("Error loading promotional campaign:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [slug]);

  const isActive = useMemo(() => {
    if (!campaign) return false;
    if (!campaign.active) return false;
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) return false;
    if (campaign.endDate && new Date(campaign.endDate) < now) return false;
    return true;
  }, [campaign]);

  const linkedProducts = useMemo(() => {
    if (!campaign || !campaign.products) return [];
    return allProducts.filter(p => campaign.products.includes(p.id));
  }, [campaign, allProducts]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#FCFAF7] flex flex-col items-center justify-center p-6 text-center">
        <Megaphone size={48} className="text-[#8A8A8A] mb-6" />
        <h1 className="text-2xl font-serif text-[#1F1F1F] mb-4">Campanha não encontrada</h1>
        <p className="text-[#8A8A8A] mb-8 font-sans">
          A campanha que você está procurando não existe ou foi removida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-[#1F1F1F] text-white px-8 py-4 rounded-full font-sans text-xs uppercase tracking-widest hover:bg-[#333333] transition-colors"
        >
          Voltar para Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFAF7] selection:bg-[#EAE4DC] selection:text-[#1F1F1F] relative overflow-x-hidden select-none">
      {/* BACKGROUND GRAPHICS */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#E8DCC8]/10 via-[#FCFAF7] to-transparent pointer-events-none -z-10" />

      <main className="pb-24 relative z-10">
        {/* Banner Section */}
        <section 
          className="relative min-h-[40vh] md:min-h-[50vh] flex flex-col items-center justify-center p-8 overflow-hidden text-center"
          style={{ backgroundColor: campaign.theme_color || '#1F1F1F' }}
        >
          {campaign.banner && (
            <div className="absolute inset-0 z-0">
              <picture>
                <source media="(max-width: 768px)" srcSet={campaign.bannerMobile || campaign.banner} />
                <img 
                   src={campaign.banner} 
                   alt={campaign.name} 
                   className="w-full h-full object-cover opacity-60 mix-blend-overlay"
                />
              </picture>
              <div className="absolute inset-0 bg-black/30" />
            </div>
          )}

          <div className="relative z-10 max-w-4xl mx-auto text-white">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-mea-culpa font-normal mb-4 leading-tight whitespace-nowrap overflow-hidden text-ellipsis max-w-full"
            >
              {campaign.name}
            </motion.h1>
            
            {campaign.marketing_phrase && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-2xl font-serif italic text-white/90 mb-6"
              >
                "{campaign.marketing_phrase}"
              </motion.p>
            )}

            {campaign.description && (
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm md:text-base font-sans text-white/80 max-w-2xl mx-auto leading-relaxed"
              >
                {campaign.description}
              </motion.p>
            )}
          </div>
        </section>

        {!isActive ? (
          <div className="max-w-xl mx-auto mt-16 p-8 bg-white border border-[#EAE4DC] rounded-3xl text-center shadow-xs">
            <div className="w-16 h-16 bg-[#F4EFE8] rounded-full flex items-center justify-center mx-auto mb-6 text-[#8A8A8A]">
              <Info size={24} />
            </div>
            <h2 className="text-xl font-serif text-[#1F1F1F] mb-3">Promoção Encerrada</h2>
            <p className="text-[#8A8A8A] font-sans text-sm mb-8 leading-relaxed">
              Esta campanha promocional não está mais ativa. Fique de olho em nossas próximas novidades!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1F1F1F] text-white px-8 py-4 rounded-full font-sans text-xs uppercase tracking-widest hover:bg-[#333333] transition-colors cursor-pointer"
            >
              Ver Outros Produtos
            </button>
          </div>
        ) : (
          <section className="max-w-[1850px] mx-auto px-4 sm:px-6 md:px-8 mt-12 sm:mt-16">
            <div className="flex items-center gap-3 mb-12">
              <ShoppingBag className="text-[#6d5443]" size={24} />
              <h2 className="text-2xl font-serif text-[#6d5443]">
                Produtos em Destaque
              </h2>
            </div>

            {linkedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
                {linkedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ProductCard 
                      product={product} 
                      onClick={() => setSelectedModalProduct(product)}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white border border-[#EAE4DC] rounded-3xl">
                <p className="text-[#8A8A8A] font-sans">Nenhum produto vinculado a esta campanha no momento.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedModalProduct && (
          <ProductDetailModal
            product={selectedModalProduct}
            isExclusive={selectedModalProduct.id === campaign.exclusive_product_id || Boolean(selectedModalProduct.isExclusive)}
            campaignYear={campaign.edition_year || new Date().getFullYear()}
            companyId={selectedModalProduct.company}
            allProducts={allProducts}
            onClose={() => setSelectedModalProduct(null)}
            onAddToCart={(prod, qty) => {
              try {
                const saved = localStorage.getItem('unified_cart_v2');
                const cart = saved ? JSON.parse(saved) : [];
                const existing = cart.find((i: any) => i.product.id === prod.id);
                if (existing) {
                  existing.quantity += qty;
                } else {
                  cart.push({ product: prod, quantity: qty });
                }
                localStorage.setItem('unified_cart_v2', JSON.stringify(cart));
                window.dispatchEvent(new Event('cart-updated'));
              } catch (e) {
                console.error(e);
              }
              setSelectedModalProduct(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
