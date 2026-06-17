export interface VitrineProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  price: number;
  originalPrice?: number;
  category: string;
  images: string[];
  features: string[];
  dimensions: string;
  materials: string[];
  stock: number;
  rating: number;
  reviewsCount: number;
}

export const PRODUCTS: VitrineProduct[] = [
  {
    id: 'portfolio-velas',
    name: 'Vela Aromática Infundida em Ouro',
    tagline: 'Sutileza sensorial com tampa de metal gravada à mão',
    description: 'Vela artesanal produzida com cera de coco pura e óleos essenciais nobres, em frasco de vidro fosco com gravação personalizada e pavio de madeira crepitante.',
    longDescription: 'Nossa Vela Aromática Infundida em Ouro é a tradução definitiva do aconchego sofisticado. Cada vela é derramada individualmente no ateliê e leva uma infusão delicada de fragrâncias de sândalo e jasmim real. A tampa metálica é banhada em ouro polido e pode ser gravada sob demanda com as iniciais ou palavras de sua celebração.',
    price: 189.00,
    originalPrice: 220.00,
    category: 'Home & Decor',
    images: [
      'https://images.unsplash.com/photo-1603006905393-0d1fc06aef88?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601924582970-d24faf911ae2?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Cera de coco 100% biodegradável e livre de parafina',
      'Pavio de madeira de reflorestamento com som de lareira',
      'Frasco de vidro importado com acabamento acetinado',
      'Tempo de queima estimado em 42 horas'
    ],
    dimensions: '8.5 cm de diâmetro × 9.0 cm de altura',
    materials: ['Cera Ecológica de Coco', 'Óleos Essenciais Puros', 'Tampa Metálica Banhada'],
    stock: 12,
    rating: 4.9,
    reviewsCount: 28
  },
  {
    id: 'porta-joias-premium',
    name: 'Porta-Joias de Veludo e Ouro Ateliê',
    tagline: 'O porto seguro das suas memórias mais valiosas',
    description: 'Organizador com revestimento em veludo italiano cotelê, divisórias sob medida e fecho personalizado banhado a ouro escovado.',
    longDescription: 'Criado para abrigar suas peças mais especiais de forma primorosa. Com uma estrutura rígida artesanal revestida em veludo super macio e detalhes em ferragens exclusivas, este porta-joias exala elegância discreta. Suas iniciais ou uma data memorável podem ser marcadas a quente na tampa interior.',
    price: 349.00,
    originalPrice: 389.00,
    category: 'Acessórios Prime',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Forro interno anti-risco de toque ultra-macio',
      'Espaço dedicado para 12 anéis, 6 colares e brincos',
      'Gravação em Hot Stamping dourado inclusa',
      'Fecho magnético suave de alta precisão'
    ],
    dimensions: '22 cm (L) × 15 cm (P) × 6.5 cm (A)',
    materials: ['Veludo Italiano', 'Estrutura MDF Premium', 'Ferragens Banhadas a Ouro'],
    stock: 5,
    rating: 5.0,
    reviewsCount: 41
  },
  {
    id: 'estojo-couro-fino',
    name: 'Estojo Organizer em Couro Nobre',
    tagline: 'Minimalismo tátil e utilidade incomparável',
    description: 'Estojo utilitário multifuncional costurado à mão, perfeito para acessórios de alta tecnologia ou joias delicadas na sua bolsa.',
    longDescription: 'O Estojo Organizer nasceu da busca pela união entre a durabilidade extrema e o design minimalista orgânico. Produzido a partir de raspas selecionadas de couro genuíno amaciado e costurado com agulhas tradicionais, ele serve como o companheiro perfeito de viagem para carregar seus fones de ouvido de luxo, adaptadores, joias ou passaporte.',
    price: 245.00,
    category: 'Acessórios Prime',
    images: [
      'https://images.unsplash.com/photo-1622560480654-d96214fdc887?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601924582962-d2aa49c12480?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Acabamento interno resinado e resistente a poeira',
      'Zíper japonês YKK banhado na cor champanhe',
      'Design slim com encaixes precisos e flexíveis',
      'Gravação em relevo em couro sob consulta'
    ],
    dimensions: '19 cm (L) × 8.5 cm (A) × 4 cm (P)',
    materials: ['Couro Genuíno de Curtume Sustentável', 'Linha de Alta Tenacidade', 'Zíper YKK'],
    stock: 8,
    rating: 4.8,
    reviewsCount: 15
  },
  {
    id: 'porcelana-monograma',
    name: 'Par de Canecas Porcelana com Monograma e Filete',
    tagline: 'O ritual da manhã envolto em requinte e toque artístico',
    description: 'Canecas confeccionadas em porcelana branca translúcida de alta temperatura, com monograma exclusivo pintado à mão em ouro líquido 12k.',
    longDescription: 'Eleve o início do seu dia ou presenteie quem você ama com este conjunto artesanal belíssimo de duas canecas de porcelana. Cada peça passa por três queimas em forno especial e recebe o toque final de filete de ouro 12k pintado com pincéis finos alemães. Produto eterno que sobrevive a gerações.',
    price: 298.00,
    originalPrice: 350.00,
    category: 'Home & Decor',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Porcelana genuína translúcida de altíssima pureza',
      'Gravação em pintura manual exclusiva de iniciais',
      'Filetamento completo na borda e na alça',
      'Inclui caixa de presente rígida preta forrada em cetim'
    ],
    dimensions: '200ml de capacidade por caneca',
    materials: ['Porcelana de Alta Temperatura', 'Ouro Líquido 12K para Decoração'],
    stock: 14,
    rating: 4.9,
    reviewsCount: 33
  },
  {
    id: 'album-couro-artesanal',
    name: 'Álbum Fotográfico Memorável em Linho e Couro',
    tagline: 'Onde as maiores poesias visuais da família repousam',
    description: 'Álbum com lombada exposta em costura copta artesanal, revestimento em linho rústico e detalhes em couro cru com presilha metálica retrô.',
    longDescription: 'Para guardar impressões reais que nunca evaporam no digital. Este álbum fotográfico luxuoso traz papel algodão livre de ácido de 240g/m² intercalado com folhas de papel vegetal de proteção, permitindo a colagem perfeita de retratos, cartões e dedicatórias com segurança museológica de preservação.',
    price: 380.00,
    category: 'Especiais do Ateliê',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Costura manual robusta que permite abertura total 180°',
      'Papel interno acid-free que não amarela as fotografias',
      'Estojo de proteção em linho idêntico ao álbum incluído',
      'Até 40 páginas (80 faces) espessas de alta gramatura'
    ],
    dimensions: '25 cm (L) × 25 cm (A) × 4.5 cm (Lombada)',
    materials: ['Linho Natural Certificado', 'Papel Algodão Acid-Free', 'Fecho em Metal e Couro'],
    stock: 4,
    rating: 5.0,
    reviewsCount: 19
  },
  {
    id: 'toalhas-linho-bordadas',
    name: 'Dupla de Toalhas de Lavabo com Renda Renascença',
    tagline: 'A delicadeza do enxoval real no seu lavabo',
    description: 'Toalhas em puro linho belga com bordados finos manuais de ramos florais e acabamento rico em autêntica renda renascença.',
    longDescription: 'Um resgate sublime de tradição e requinte para a sua recepção ou toalete. Confeccionadas em linho imaculado de fios encorpados, estas duas peças trazem a lendária renda renascença tecida manualmente com agulhas finas por artesãs credenciadas. Uma peça de enxoval verdadeiramente colecionável.',
    price: 320.00,
    originalPrice: 360.00,
    category: 'Especiais do Ateliê',
    images: [
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Linho natural belga com caimento e textura nobres',
      'Bordados exclusivos de padrão floral campestre',
      'Acabamento integral em barra bainha aberta aberta',
      'Kit perfumado com saches de lavanda seca inclusos'
    ],
    dimensions: '35 cm (L) × 50 cm (C)',
    materials: ['Linho Puro', 'Linha de Algodão Egípcio', 'Renda Manual Renascença'],
    stock: 6,
    rating: 5.0,
    reviewsCount: 12
  }
];
