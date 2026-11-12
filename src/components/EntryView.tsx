import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Gift, Sparkles, Layers, ArrowRight } from 'lucide-react';
import { AppConfig, Product } from '../types';
import { useHomeData } from './Home/useHomeData';
import { HomeCommemorativeBanner } from './Home/HomeCommemorativeBanner';
import { HomeCompanyLanding } from './Home/HomeCompanyLanding';
import { HomeFAQSection } from './Home/HomeFAQSection';
import { HomeFooterSignature } from './Home/HomeFooterSignature';

interface EntryViewProps {
  config: AppConfig;
  allProducts?: Product[];
  onOpenSearch?: () => void;
}

/**
 * EntryView — Landing Page Comercial da Madrinha dos Personalizados (Rota `/`)
 * Experiência de venda elegante, contínua e editorial sem cortina de abertura.
 */
export const EntryView: React.FC<EntryViewProps> = ({ allProducts = [] }) => {
  const navigate = useNavigate();
  const {
    customSettings,
    activeCampaigns,
    commemorativeDates
  } = useHomeData(allProducts);

  const navCards = [
    {
      title: "Loja",
      subtitle: "Catálogo Completo",
      desc: "Todos os produtos disponíveis com personalização exclusiva.",
      route: "/loja",
      icon: ShoppingBag,
      btnText: "Explorar Loja",
      bgClass: "bg-[#0F2038] text-white border-[#1A3150]",
      badge: "Todos os Produtos",
      accent: "#D4AF37"
    },
    {
      title: "Monte seu Kit",
      subtitle: "Experiência Interativa",
      desc: "Escolha a caixa e combine itens afetivos sob medida.",
      route: "/monte-seu-kit",
      icon: Sparkles,
      btnText: "Montar Agora",
      bgClass: "bg-white text-[#1B2537] border-[#E8E2D5]",
      badge: "Personalizável",
      accent: "#C5A869"
    },
    {
      title: "Kit Pronto",
      subtitle: "Pronto para Presentear",
      desc: "Composições harmoniosas e presentes já montados com carinho.",
      route: "/kits",
      icon: Gift,
      btnText: "Ver Kits",
      bgClass: "bg-white text-[#1B2537] border-[#E8E2D5]",
      badge: "Combinações",
      accent: "#B38F4D"
    },
    {
      title: "Lista de Presentes",
      subtitle: "Eventos & Celebrações",
      desc: "Crie ou consulte listas de casamentos, batizados e festas.",
      route: "/listadepresentes",
      icon: Layers,
      btnText: "Acessar Listas",
      bgClass: "bg-white text-[#1B2537] border-[#E8E2D5]",
      badge: "100% Gratuita",
      accent: "#4A5568"
    }
  ];

  return (
    <div
      id="home-landing-view"
      className="home-root bg-[#FAF8F5] min-h-[100dvh] w-full relative text-[#1B2537] selection:bg-[#FAF0DC] selection:text-[#1B2537] overflow-x-hidden antialiased"
    >
      {/* 1. Hero Principal Comercial da Marca */}
      <section className="w-full bg-gradient-to-b from-[#FAF8F5] via-white to-[#FAF8F5] py-12 sm:py-16 md:py-20 px-3 sm:px-4 text-center relative border-b border-[#E8E2D5]">
        <div className="max-w-4xl mx-auto space-y-6">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-[#0F2C59] bg-[#0F2C59]/5 px-4 py-1.5 rounded-full inline-block border border-[#0F2C59]/10">
            Ateliê de Lembranças Afetivas & Papelaria Nobre
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-mea-culpa text-[#0F2C59] tracking-tight leading-none drop-shadow-xs">
            Madrinha dos Personalizados
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-[#4A5568] font-light max-w-2xl mx-auto leading-relaxed">
            Eternizamos momentos especiais através de peças artesanais criadas à mão sob demanda, com aprovação prévia de arte, hot stamping e acabamentos em tecidos nobres.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/loja')}
              className="px-8 py-4 rounded-full bg-[#0F2C59] hover:bg-[#081220] text-white text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg hover:scale-105 cursor-pointer flex items-center gap-2.5"
            >
              <span>Explorar Catálogo Completo</span>
              <ArrowRight size={15} className="text-[#D4AF37]" />
            </button>
            <button
              onClick={() => navigate('/monte-seu-kit')}
              className="px-8 py-4 rounded-full bg-white hover:bg-[#FAF6F0] text-[#1B2537] border border-[#E8E2D5] text-xs font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-xs"
            >
              Monte Seu Kit Personalizado
            </button>
          </div>
        </div>
      </section>

      {/* 2. Caminhos Principais de Compra (Editorial Grid) */}
      <section className="w-full max-w-[1850px] mx-auto px-3 sm:px-4 md:px-6 py-12 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-mea-culpa text-[#0F2C59] tracking-tight">
            Descubra Nossas Experiências
          </h2>
          <p className="text-xs sm:text-sm text-[#4A5568] font-light mt-2">
            Escolha o caminho ideal para o seu presente ou celebração
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {navCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                onClick={() => navigate(card.route)}
                className={`group flex flex-col justify-between p-6 sm:p-7 rounded-3xl border ${card.bgClass} shadow-[0_4px_24px_rgba(15,44,89,0.04)] hover:shadow-[0_12px_36px_rgba(15,44,89,0.1)] transition-all duration-300 cursor-pointer hover:-translate-y-1`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-current/10 border border-current opacity-80">
                      {card.badge}
                    </span>
                    <Icon size={20} style={{ color: card.accent }} />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-mea-culpa tracking-tight mb-1">
                    {card.title}
                  </h3>
                  <p className="text-[11px] font-semibold opacity-70 mb-3 font-sans uppercase tracking-wider">
                    {card.subtitle}
                  </p>
                  <p className="text-xs opacity-80 font-light leading-relaxed mb-6">
                    {card.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-current/10 text-xs font-bold uppercase tracking-wider">
                  <span>{card.btnText}</span>
                  <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Banner Comemorativo Sazonal */}
      <HomeCommemorativeBanner 
        activeCampaigns={activeCampaigns} 
        commemorativeDates={commemorativeDates}
      />

      {/* 4. Faixas Editoriais da Marca (Especialidades, Artesanato, Júlia Aleixo, Depoimentos) */}
      <HomeCompanyLanding customSettings={customSettings} />

      {/* 5. FAQ Institucional da Marca */}
      <HomeFAQSection />

      {/* 6. Rodapé com Assinatura */}
      <HomeFooterSignature />
    </div>
  );
};
