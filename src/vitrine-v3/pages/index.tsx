import React, { useState } from 'react';
import { useCartV3 } from '../core/cart/useCart';
import { getActiveCampaign, getCampaignProducts, getHighlightProduct } from '../campaigns/campaign-engine';
import { PRODUCTS_V3 } from '../data/products';
import { CampaignBannerV3 } from '../components/CampaignBanner';
import { ProductCardV3 } from '../components/ProductCard';
import { CartDrawerV3 } from '../components/CartDrawer';
import { VitrineHeaderV3 } from '../components/VitrineHeader';
import { VitrineFooterV3 } from '../components/VitrineFooter';
import { Sparkles, ArrowRight, Gift, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VitrineIndexPage: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const activeCampaign = getActiveCampaign();
  const campaignProducts = getCampaignProducts(activeCampaign);
  const highlightProduct = getHighlightProduct(activeCampaign);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1C1B1A] flex flex-col font-sans">
      {/* Dynamic Header */}
      <VitrineHeaderV3 onOpenCart={() => setIsCartOpen(true)} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-16">
        
        {/* Weekly Campaign Banner */}
        <section className="animate-fade-in">
          <CampaignBannerV3 
            campaign={activeCampaign}
            highlightProductImage={highlightProduct?.images[0]}
            highlightProductId={highlightProduct?.id}
          />
        </section>

        {/* Emotion Intro */}
        <section className="text-center space-y-3 max-w-2xl mx-auto py-4 select-none">
          <span className="text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.25em] block">
            A Arte da Escolha Sublime
          </span>
          <h1 className="font-serif text-2.5xl sm:text-3.5xl font-extrabold text-[#111111] uppercase tracking-wide">
            Acervo Especial Ateliê
          </h1>
          <p className="font-sans text-xs sm:text-xs.1 text-[#6D5443] leading-relaxed">
            Nossa curadoria semanal une fragrâncias envolventes, bordados primorosos em linho belga original e acessórios de legitima procedência, prontos para receber suas inscrições sob encomenda.
          </p>
        </section>

        {/* Featured Campaign Product Shelf */}
        {highlightProduct && (
          <section className="bg-white border border-[#E8DCC8]/40 p-6 sm:p-10 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-8 items-center shadow-xs">
            
            <div className="md:col-span-5 relative aspect-square rounded-2xl overflow-hidden bg-[#FAF8F5] border border-[#E8DCC8]/20">
              <span className="absolute top-3 left-3 z-10 bg-[#D4AF37] text-neutral-950 font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded">
                Destaque Especial da Semana
              </span>
              <img 
                src={highlightProduct.images[0]} 
                alt={highlightProduct.name} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-7 space-y-5">
              <div className="space-y-1">
                <span className="text-[#D4AF37] text-[9.5px] font-bold uppercase tracking-widest block">
                  {highlightProduct.category} • Campanha Especial
                </span>
                <h2 className="font-serif text-xl sm:text-2.5xl font-extrabold text-[#111111] uppercase tracking-wide leading-tight">
                  {highlightProduct.name}
                </h2>
                <div className="flex items-center gap-1 my-2">
                  <div className="flex text-[#D4AF37]">
                    ★★★★★
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">({highlightProduct.reviewsCount} avaliações autorais)</span>
                </div>
              </div>

              <p className="text-xs sm:text-xs.1 text-[#6D5443] leading-relaxed">
                {highlightProduct.description}
              </p>

              <div className="border-t border-[#E8DCC8]/25 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
                <div className="space-y-1">
                  <span className="text-[10px] text-neutral-400 block">Investimento para a Vida Toda</span>
                  <span className="text-xl font-mono font-black text-[#111111]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(highlightProduct.price)}
                  </span>
                </div>

                <Link
                  to={`/vitrine-v3/produto/${highlightProduct.id}`}
                  className="bg-[#111111] hover:bg-[#D4AF37] text-white text-[10.5px] font-bold uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all text-center inline-block"
                >
                  Personalizar & Encomendar
                </Link>
              </div>

            </div>

          </section>
        )}

        {/* All Products Grid in This Campaign */}
        <section className="space-y-6">
          <div className="flex items-end justify-between border-b border-[#E8DCC8]/30 pb-3 select-none">
            <div>
              <span className="text-[#D4AF37] text-[9.5px] font-bold uppercase tracking-widest block">Peças Selecionadas</span>
              <h2 className="font-serif text-lg sm:text-xl font-extrabold text-[#111111] uppercase tracking-wider">
                Explore o Acervo Completo
              </h2>
            </div>
            
            <Link 
              to="/vitrine-v3/catalogo"
              className="group text-[10px] sm:text-[11px] font-black uppercase tracking-widest text-[#111111] hover:text-[#D4AF37] transition-colors flex items-center gap-1"
            >
              <span>Ver Todo o Ateliê</span>
              <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {PRODUCTS_V3.slice(0, 6).map((product) => {
              const isCampaign = activeCampaign.productIds.includes(product.id);
              return (
                <ProductCardV3 
                  key={product.id} 
                  product={product} 
                  isCampaignActive={isCampaign}
                />
              );
            })}
          </div>
        </section>

        {/* Brand values / Emotional Experience banner */}
        <section className="bg-neutral-950 text-white rounded-3xl p-6 sm:p-10 border border-[#D4AF37]/20 select-none relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full filter blur-3xl pointer-events-none" />
          
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Sparkles size={25} className="text-[#D4AF37] mx-auto animate-pulse" />
            <div className="space-y-2">
              <h3 className="font-serif text-xl sm:text-2xl font-bold uppercase tracking-widest text-white">
                Como funciona o Ateliê Julia Aleixo?
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed font-light">
                Cada presente é concebido de forma lenta e individualizada. Após escolher suas peças e informar os dados do monograma ou personalização, sua bolsa é direcionada à conclusão simulada. O ateliê irá gerar o código e os artífices farão contato subsequente para selar os detalhes de fabricação.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-left">
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider block">1. Escolha d\'Arte</span>
                <p className="text-[10px] text-neutral-400">Insira monogramas, cores ou tamanhos especiais para as velas ou álbuns.</p>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider block">2. Embalagem Perfumada</span>
                <p className="text-[10px] text-neutral-400">Embalamos os pedidos com ramos de lavanda seca e lacre de cera clássico.</p>
              </div>
              <div className="bg-neutral-900/60 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider block">3. Ouro Líquido</span>
                <p className="text-[10px] text-neutral-400">Gravações manuais pintadas cuidadosamente com pó metálico importado de alta fixação.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Cart Drawer */}
      <CartDrawerV3 isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Footer */}
      <VitrineFooterV3 />
    </div>
  );
};
