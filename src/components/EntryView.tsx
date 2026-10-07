import React, { useState } from 'react';
import { AppConfig, Product } from '../types';
import { useHomeData } from './Home/useHomeData';
import { OpeningCurtain } from './Home/OpeningCurtain';
import { HomeCommemorativeBanner } from './Home/HomeCommemorativeBanner';
import { HomeAtelierDividers, StoreDividerId } from './Home/HomeAtelierDividers';
import { HomeCuratedProducts } from './Home/HomeCuratedProducts';
import { HomeCompanyLanding } from './Home/HomeCompanyLanding';
import { HomeFAQSection } from './Home/HomeFAQSection';
import { HomeFooterSignature } from './Home/HomeFooterSignature';

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
  onOpenSearch?: () => void;
}

/**
 * EntryView — Ponto de Entrada Oficial da Home (Rota `/`)
 * Estrutura:
 * - Aba "HOME": Landing page ultra elegante com faixas institucionais e explicativas para cada tema da empresa
 *   (Banner Comemorativo, Os 4 Ateliês, Monte seu Kit, Personalize, Sobre Nós, Feedbacks, Lista de Presentes, FAQ e Rodapé).
 * - Outras Abas ("Loja Completa", "La Pallyra", "Mimada Sim", "com amor, Guennita", "Tutty Mimo"): Vitrines exclusivas dos produtos com filtros, busca e ordenação.
 */
export const EntryView: React.FC<EntryViewProps> = ({ config, allProducts = [], onOpenSearch }) => {
  const {
    customSettings,
    realFeedbacks,
    activeCampaigns,
    commemorativeDates
  } = useHomeData(allProducts);

  const [curtainKey, setCurtainKey] = useState<number>(0);
  // Default fixado na aba 'home'
  const [activeDivider, setActiveDivider] = useState<StoreDividerId>('home');

  const handleReopenCurtain = () => {
    sessionStorage.removeItem('seen_opening_curtain_v1');
    setCurtainKey((prev) => prev + 1);
  };

  const isHomeView = activeDivider === 'home';

  return (
    <div
      id="home-entry-view"
      className="home-root bg-[#FDFCFA] min-h-[100dvh] w-full relative text-[#2C1810] selection:bg-[#FAF0DC] selection:text-[#2C1810] overflow-x-hidden antialiased"
    >
      {/* 1. Cortina dramática de abertura */}
      <OpeningCurtain
        key={curtainKey}
        siteName={config.site_name || config.site_title || "Madrinha"}
      />

      {/* 
        2. DIVISÓRIAS ESTILO FICHÁRIO (NO TOPO)
        Abas: Home / Loja Completa / La Pallyra / Mimada Sim / com amor, Guennita / Tutty Mimo
      */}
      <HomeAtelierDividers 
        activeTab={activeDivider}
        onSelectTab={setActiveDivider}
      />

      {/* SE ESTIVER NA ABA "HOME": Exibe a landing page explicativa e elegante sobre a empresa */}
      {isHomeView ? (
        <>
          {/* Banner Comemorativo Sazonal */}
          <HomeCommemorativeBanner 
            activeCampaigns={activeCampaigns} 
            commemorativeDates={commemorativeDates}
          />

          {/* Faixas Editoriais Explicativas (Ateliês, Monte seu Kit, Personalize, Sobre Nós, Feedbacks, Lista de Presentes) */}
          <HomeCompanyLanding customSettings={customSettings} />

          {/* FAQ / Perguntas Frequentes */}
          <HomeFAQSection />

          {/* Rodapé & Gatilho da Cortina */}
          <HomeFooterSignature onReopenCurtain={handleReopenCurtain} />
        </>
      ) : (
        /* SE ESTIVER EM OUTRA DIVISÓRIA: Exibe EXCLUSIVAMENTE a vitrine dos produtos daquela marca com logotipo */
        <div className="min-h-[70vh] flex flex-col justify-between">
          <HomeCuratedProducts 
            allProducts={allProducts} 
            activeDivider={activeDivider}
            customSettings={customSettings}
          />
          <HomeFooterSignature onReopenCurtain={handleReopenCurtain} />
        </div>
      )}
    </div>
  );
};
