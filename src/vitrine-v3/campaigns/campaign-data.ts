export interface WeeklyCampaign {
  id: string;
  name: string;
  emocionalTitle: string;
  description: string;
  emoji: string;
  backgroundGradient: string;
  tagline: string;
  badgeAccent: string;
  highlightProductId: string;
  productIds: string[];
  daysRemainingDefault: number;
}

export const CAMPAIGNS_DATA: WeeklyCampaign[] = [
  {
    id: 'campanha-ateliê-ouro',
    name: 'Herança & Ouro 24k d\'Ateliê',
    emocionalTitle: 'A Poesia do Próprio Nome Gravado em Fios de Ouro',
    description: 'Campanha de personalização artesanal gratuita e frete especial. Em cada peça encomendada nos próximos dias, nossos artífices esculpem e pintam suas iniciais com ouro fino líquido original.',
    emoji: '🍂',
    backgroundGradient: 'from-[#111111] via-[#1d1b18] to-[#111111]',
    tagline: 'Uma homenagem eterna à identidade e à arte dos pequenos detalhes.',
    badgeAccent: '#D4AF37', // Gold 
    highlightProductId: 'decor-porcelana-monograma-v3',
    productIds: ['decor-vela-imperial', 'joias-organizer-realeza', 'decor-porcelana-monograma-v3', 'enxoval-lavabo-fiorito', 'memorias-album-v3'],
    daysRemainingDefault: 7
  },
  {
    id: 'campanha-linho-romance',
    name: 'Romance Intemporal no Linho',
    emocionalTitle: 'A Maciez do Linho Belga em Enxovais Intemporais',
    description: 'Uma curadoria de mimos de costura que aquecem os corações. Toalhas, álbuns de afeto e fragrâncias florais para abraçar quem você mais ama com as mais ricas texturas.',
    emoji: '🌸',
    backgroundGradient: 'from-[#1b1715] via-[#2A231F] to-[#1b1715]',
    tagline: 'Costuras feitas à luz de velas para perdurarem por muitas gerações.',
    badgeAccent: '#A78B71',
    highlightProductId: 'enxoval-lavabo-fiorito',
    productIds: ['enxoval-lavabo-fiorito', 'memorias-album-v3', 'decor-vela-imperial', 'couro-bolseria-singular'],
    daysRemainingDefault: 5
  }
];
