import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Check } from 'lucide-react';
import { AppConfig, Product } from '../types';
import { useHomeData } from './Home/useHomeData';
import { HomeCommemorativeBanner } from './Home/HomeCommemorativeBanner';
import { HomeCompanyLanding } from './Home/HomeCompanyLanding';
import { HomeFAQSection } from './Home/HomeFAQSection';
import { HomeFooterSignature } from './Home/HomeFooterSignature';
import { ProductCard } from './ui/ProductCard';

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
  onOpenSearch?: () => void;
}

/**
 * EntryView — Landing Page Editorial de Luxo & Alta Conversão (Rota `/`)
 * Transição contínua sem divisões brutas, apresentando papelaria fina,
 * presentes afetivos e personalização sob demanda.
 */
export const EntryView: React.FC<EntryViewProps> = ({ allProducts = [] }) => {
  const navigate = useNavigate();
  const {
    customSettings,
    activeCampaigns,
    commemorativeDates
  } = useHomeData(allProducts);

  const featuredLuxuryProducts = useMemo(() => {
    return [...allProducts]
      .filter(p => p.isVisible !== false && p.activeInCatalog !== false && !p.isKit && (p.image || p.main_image))
      .sort((a, b) => {
        if (Boolean(b.isFeatured) !== Boolean(a.isFeatured)) {
          return Number(Boolean(b.isFeatured)) - Number(Boolean(a.isFeatured));
        }
        return (b.salesCount || 0) - (a.salesCount || 0);
      })
      .slice(0, 4);
  }, [allProducts]);

  return (
    <div
      id="home-landing-view"
      className="home-root bg-[#FAF8F5] min-h-[100dvh] w-full relative text-[#1B2537] selection:bg-[#FAF0DC] selection:text-[#1B2537] overflow-x-hidden antialiased"
    >
      {/* 1. Banner Comemorativo Sazonal no Topo (Subido 2 blocos, integrado logo abaixo do Header) */}
      <HomeCommemorativeBanner 
        activeCampaigns={activeCampaigns} 
        commemorativeDates={commemorativeDates}
      />

      {/* 2. Hero Editorial de Luxo — Corpo Contínuo com o Header */}
      <section className="w-full bg-[#FAF8F5] relative overflow-hidden pt-4 pb-12 sm:pt-6 sm:pb-16 md:pt-8 md:pb-18 px-3 sm:px-4">
        {/* Aura champanhe extremamente sutil ao fundo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgba(212,175,55,0.06)_0%,rgba(250,248,245,0)_75%)]"
        />

        <div className="relative z-10 max-w-[1850px] mx-auto">
          <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-[#0F2C59]/75 mb-5 sm:mb-7">
              <span className="w-6 h-px bg-[#D4AF37]/80" />
              <span>Ateliê Exclusivo · Desde 2025</span>
              <span className="w-6 h-px bg-[#D4AF37]/80" />
            </div>

            <h1 className="whitespace-nowrap text-[clamp(1.65rem,4.5vw,4.15rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.12] mb-5 sm:mb-6">
              Lembranças Afetivas &amp; Papelaria Nobre
            </h1>

            <p className="text-sm sm:text-base text-[#1B2537]/75 font-light max-w-xl leading-[1.85] mb-8 sm:mb-9">
              Eternizamos casamentos, batizados e celebrações através de peças artesanais criadas à mão sob demanda, com aprovação prévia de arte, hot stamping dourado e acabamentos em tecidos nobres.
            </p>

            {/* CTAs Delicados com Alta Conversão */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
              <button
                onClick={() => navigate('/loja')}
                className="group px-6 py-3 rounded-full bg-[#D4AF37]/14 hover:bg-[#0F2C59] text-[#0F2C59] hover:text-[#FAF8F5] border border-[#D4AF37] text-[10.5px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer flex items-center gap-2.5"
              >
                <span>Explorar Catálogo Completo</span>
                <ArrowRight size={13} className="text-[#D4AF37] transition-transform duration-300 group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={() => navigate('/monte-seu-kit')}
                className="px-6 py-3 rounded-full bg-transparent hover:bg-[#D4AF37]/10 text-[#0F2C59]/90 hover:text-[#0F2C59] border border-[#D4AF37]/45 hover:border-[#D4AF37] text-[10.5px] font-semibold uppercase tracking-[0.22em] transition-all duration-300 cursor-pointer"
              >
                Monte Seu Kit Personalizado
              </button>
            </div>

            {/* Micro Barra de Confiança para Conversão */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] text-[#1B2537]/70 font-light">
              <span className="inline-flex items-center gap-1.5">
                <Check size={12} className="text-[#D4AF37]" />
                Arte aprovada antes da produção
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Sparkles size={12} className="text-[#D4AF37]" />
                Hot stamping &amp; selos artesanais
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-[#D4AF37]" />
                Envio seguro para todo o Brasil
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Vitrine Curada de Alta Conversão — Peças Mais Desejadas */}
      {featuredLuxuryProducts.length > 0 && (
        <section className="w-full bg-[linear-gradient(180deg,#FAF8F5_0%,rgba(243,236,223,0.55)_50%,#FAF8F5_100%)] py-14 sm:py-18 px-3 sm:px-4">
          <div className="max-w-[1850px] mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#0F2C59]/75 mb-3">
                <span className="w-5 h-px bg-[#D4AF37]/70" />
                <span>Seleção do Ateliê</span>
                <span className="w-5 h-px bg-[#D4AF37]/70" />
              </div>
              <h2 className="whitespace-nowrap text-[clamp(1.9rem,4vw,3rem)] font-mea-culpa text-[#0F2C59] tracking-tight leading-[1.15]">
                Peças Mais Desejadas
              </h2>
              <p className="text-xs sm:text-sm text-[#1B2537]/70 mt-2 font-light">
                Criações assinadas prontas para receber a sua identidade e história
              </p>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredLuxuryProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onClick={() => navigate(`/loja?product=${prod.id}`)}
                  onAddToCart={(item, qty) => {
                    try {
                      const saved = localStorage.getItem('unified_cart_v2');
                      const parsed = saved ? JSON.parse(saved) : [];
                      const existingIdx = parsed.findIndex((i: any) => i.id === item.id);
                      const updated = existingIdx > -1
                        ? parsed.map((i: any, idx: number) => idx === existingIdx ? { ...i, quantity: (i.quantity || 1) + qty } : i)
                        : [...parsed, { ...item, productId: item.id, quantity: qty }];
                      localStorage.setItem('unified_cart_v2', JSON.stringify(updated));
                      window.dispatchEvent(new Event('cart-updated'));
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  onAddToGiftList={(item) => {
                    try {
                      const saved = localStorage.getItem('unified_gift_list_v2');
                      const parsed = saved ? JSON.parse(saved) : [];
                      if (!parsed.find((i: any) => i.id === item.id)) {
                        localStorage.setItem('unified_gift_list_v2', JSON.stringify([...parsed, item]));
                        window.dispatchEvent(new Event('giftlist-updated'));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
              ))}
            </div>

            <div className="mt-9 text-center">
              <button
                onClick={() => navigate('/loja')}
                className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0F2C59] hover:text-[#D4AF37] underline underline-offset-4 decoration-[#D4AF37]/50 transition-colors cursor-pointer"
              >
                <span>Ver Toda a Coleção na Loja</span>
                <ArrowRight size={13} className="text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4. Faixas Editoriais da Marca (Linhas de Criação, Kits, Personalização, História, Depoimentos, Listas) */}
      <HomeCompanyLanding customSettings={customSettings} />

      {/* 5. FAQ Institucional da Marca */}
      <HomeFAQSection />

      {/* 6. Rodapé com Assinatura */}
      <HomeFooterSignature />
    </div>
  );
};
