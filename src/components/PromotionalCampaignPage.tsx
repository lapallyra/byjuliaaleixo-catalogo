import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Megaphone, ShoppingBag, Info } from 'lucide-react';
import { ProductCard } from './ui/ProductCard';
import { promotionalCampaignService } from '../services/promotionalCampaignService';
import { Product, PromotionalCampaign } from '../types';

interface PromotionalCampaignPageProps {
  allProducts: Product[];
}

export function PromotionalCampaignPage({ allProducts }: PromotionalCampaignPageProps) {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null);
  const [loading, setLoading] = useState(true);

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
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1F1F1F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
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
    <div className="min-h-screen bg-[#FAF8F5] selection:bg-[#EAE4DC] selection:text-[#1F1F1F]">
      <header className="fixed top-0 inset-x-0 h-20 bg-[#FAF8F5]/80 backdrop-blur-xl z-50 border-b border-[#EAE4DC] flex items-center px-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white border border-[#EAE4DC] flex items-center justify-center text-[#1F1F1F] hover:bg-[#F4EFE8] transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="ml-6 text-lg font-serif text-[#1F1F1F] truncate">{campaign.name}</h1>
      </header>

      <main className="pt-20 pb-24">
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
              className="text-4xl md:text-6xl font-serif font-medium mb-6 leading-tight"
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
          <div className="max-w-xl mx-auto mt-16 p-8 bg-white border border-[#EAE4DC] rounded-3xl text-center shadow-sm">
            <div className="w-16 h-16 bg-[#F4EFE8] rounded-full flex items-center justify-center mx-auto mb-6 text-[#8A8A8A]">
              <Info size={24} />
            </div>
            <h2 className="text-xl font-serif text-[#1F1F1F] mb-3">Promoção Encerrada</h2>
            <p className="text-[#8A8A8A] font-sans text-sm mb-8 leading-relaxed">
              Esta campanha promocional não está mais ativa. Fique de olho em nossas próximas novidades!
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#1F1F1F] text-white px-8 py-4 rounded-full font-sans text-xs uppercase tracking-widest hover:bg-[#333333] transition-colors"
            >
              Ver Outros Produtos
            </button>
          </div>
        ) : (
          <section className="max-w-[1400px] mx-auto px-6 mt-16">
            <div className="flex items-center gap-3 mb-12">
              <ShoppingBag className="text-[#1F1F1F]" size={24} />
              <h2 className="text-2xl font-serif text-[#1F1F1F]">
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
    </div>
  );
}
