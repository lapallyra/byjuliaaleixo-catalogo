import React, { useState } from 'react';
import { AppConfig, Product } from '../types';
import { useHomeData } from './Home/useHomeData';
import { OpeningCurtain } from './Home/OpeningCurtain';
import { HomeCommemorativeBanner } from './Home/HomeCommemorativeBanner';
import { HomeAteliersFlipGrid } from './Home/HomeAteliersFlipGrid';
import { HomeCuratedProducts } from './Home/HomeCuratedProducts';
import { HomeKitsSplitSection } from './Home/HomeKitsSplitSection';
import { HomeHowItWorksSection } from './Home/HomeHowItWorksSection';
import { HomeBehindTheCraft } from './Home/HomeBehindTheCraft';
import { HomeFAQSection } from './Home/HomeFAQSection';
import { HomeFooterSignature } from './Home/HomeFooterSignature';

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
  onOpenSearch?: () => void;
}

/**
 * EntryView — Ponto de Entrada Oficial da Home (Rota `/`)
 * Direção Visual: Luxo Silencioso (Silent Luxury)
 * Abertura: Cortina dramática em preto profundo e dourado
 * Sequência Refinada: Abertura -> Faixa de Avisos -> Banner Comemorativo -> 4 Ateliês (Hover Flip) -> Criações -> Kits -> Como Funciona -> Por Trás -> FAQ -> Rodapé
 */
export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [], onOpenSearch }) => {
  const {
    customSettings,
    realFeedbacks,
    activeCampaigns,
    commemorativeDates,
    kits
  } = useHomeData(allProducts);

  const [curtainKey, setCurtainKey] = useState<number>(0);

  const handleReopenCurtain = () => {
    sessionStorage.removeItem('seen_opening_curtain_v1');
    setCurtainKey((prev) => prev + 1);
  };

  return (
    <div
      id="home-entry-view"
      className="home-root bg-[#FDFCFA] min-h-[100dvh] w-full relative text-[#2C1810] selection:bg-[#FAF0DC] selection:text-[#2C1810] overflow-x-hidden antialiased"
    >
      {/* 1. Dramatic Opening Curtain in Deep Black & Gold */}
      <OpeningCurtain
        key={curtainKey}
        siteName={config.site_name || config.site_title || "by Júlia Aleixo"}
      />

      {/* 2. Commemorative Seasonal Banner */}
      <HomeCommemorativeBanner 
        activeCampaigns={activeCampaigns} 
        commemorativeDates={commemorativeDates}
      />

      {/* 4. The 4 Ateliers Rectangular Cards with Hover Flip & Isotype */}
      <HomeAteliersFlipGrid customSettings={customSettings} />

      {/* 5. Curated Products Selection & [ VER LOJA ] CTA */}
      <HomeCuratedProducts allProducts={allProducts} />

      {/* 6. Kit Pronto | Monte Seu Kit Split Section */}
      <HomeKitsSplitSection kits={kits} />

      {/* 7. Como Funciona (4 Steps with ◇ markers) */}
      <HomeHowItWorksSection />

      {/* 8. Por Trás dos Detalhes / Essência Artesanal */}
      <HomeBehindTheCraft customSettings={customSettings} />

      {/* 9. FAQ / Perguntas Frequentes */}
      <HomeFAQSection />

      {/* 10. Footer Signature & Reopen Curtain Trigger */}
      <HomeFooterSignature onReopenCurtain={handleReopenCurtain} />
    </div>
  );
};


