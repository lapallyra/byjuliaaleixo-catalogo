export interface VitrineV3Product {
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
  badge?: 'Mais Vendido' | 'Edição Limitada' | 'Lançamento';
  variants?: {
    colors?: string[];
    sizes?: string[];
  };
}

export const PRODUCTS_V3: VitrineV3Product[] = [
  {
    id: 'decor-vela-imperial',
    name: 'Vela Aromática Imperial Lavanda & Ouro',
    tagline: 'Pétalas secas e cera infundida em pó de ouro cintilante',
    description: 'Vela ultra-aromática com cera de soja vegetal premium, aromatizada com lavanda francesa e jasmim branco em copo jateado com tampa de ouro polido.',
    longDescription: 'A Vela Imperial Lavanda & Ouro traz o máximo requinte sensorial para ambientes íntimos. Sua essência exclusiva é destilada à mão usando óleo de lavanda originário da Provença e notas profundas de sândalo. A cera vegetal queima de forma limpa, liberando micropartículas de mica dourada que encantam o olhar enquanto a chama crepita suavemente.',
    price: 198.00,
    originalPrice: 245.00,
    category: 'Home & Decor',
    images: [
      'https://images.unsplash.com/photo-1603006905393-0d1fc06aef88?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601924582970-d24faf911ae2?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Cera de soja premium com queima uniforme e limpa',
      'Pavio duplo de algodão egípcio orgânico',
      'Aroma concentrado terapêutico com óleos importados',
      'Tampa especial maciça banhada a ouro 18k'
    ],
    dimensions: '9.0 cm diâmetro × 10.0 cm altura',
    materials: ['Cera Ecológica de Soja', 'Óleo Essencial Puro de Lavanda', 'Metal Banhado'],
    stock: 14,
    rating: 4.9,
    reviewsCount: 42,
    badge: 'Mais Vendido',
    variants: {
      colors: ['Ouro Clássico', 'Dourado Rosé', 'Preto Matte'],
      sizes: ['Padrão 240g', 'Família 480g']
    }
  },
  {
    id: 'joias-organizer-realeza',
    name: 'Estojo Porta-Joias Imperial Realeza',
    tagline: 'Divisórias estofadas sob medida em camurça e dourado',
    description: 'Porta-joias de extrema sofisticação com ferragens folheadas, forração interna aveludada e espaço para iniciais personalizadas.',
    longDescription: 'Para proteger seus tesouros mais preciosos com a dignidade que eles merecem. O Organizador Realeza é estruturado em MDF de reflorestamento, revestido de veludo nobre e finalizado com cantoneiras de latão dourado polido. Um organizador eterno de cabeceira projetado pela arquiteta de interiores do ateliê.',
    price: 360.00,
    category: 'Acessórios Prime',
    images: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Forro protetor com tratamento contra oxidação de metais',
      'Capacidade otimizada: 16 anéis, 8 colares, gaveta secreta',
      'Plaqueta metálica externa personalizável por gravação a laser',
      'Espelho interno bisotado sob a tampa de abertura'
    ],
    dimensions: '24 cm (L) × 18 cm (P) × 9.0 cm (A)',
    materials: ['Estrutura Rígida de MDF', 'Veludo Cotelê Italiano', 'Dobradiças de Latão Banhado'],
    stock: 6,
    rating: 5.0,
    reviewsCount: 38,
    badge: 'Mais Vendido',
    variants: {
      colors: ['Veludo Esmeralda', 'Veludo Vinho', 'Nude Perolado'],
      sizes: ['Luxo Standard']
    }
  },
  {
    id: 'decor-porcelana-monograma-v3',
    name: 'Cálice de Porcelana Fina com Monograma Ouro 24k',
    tagline: 'Pintura livre de filete duplo com banho real líquido',
    description: 'Conjunto requintado contendo duas xícaras/cálices de porcelana translúcida pintados à mão por artistas plásticos convidados.',
    longDescription: 'O café ou chá da tarde adquirem uma atmosfera puramente palaciana. Estes belíssimos cálices de porcelana são queimados a 1300°C para obter uma textura translúcida insuperável em brancura e delicadeza. O filete de ouro 24k líquido é desenhado e assinado uma a uma sob as bordas e pés da xícara.',
    price: 285.00,
    originalPrice: 340.00,
    category: 'Home & Decor',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1577937927133-66ef06acdf18?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Porcelana de cinza de osso autêntica, textura aveludada',
      'Filetado duplo em ouro líquido 24 quilates alemão',
      'Monograma ou brasão customizado pintado com bico de pena',
      'Opção para caixa de madeira gravada a fogo com palha decorativa'
    ],
    dimensions: '180 ml de capacidade por cálice',
    materials: ['Porcelana Importada', 'Ouro Puro 24K para Joalheria'],
    stock: 9,
    rating: 4.8,
    reviewsCount: 29,
    badge: 'Edição Limitada',
    variants: {
      colors: ['Monograma Dourado', 'Monograma Rosé', 'Monograma Platina'],
      sizes: ['Set com 2 Unidades']
    }
  },
  {
    id: 'couro-bolseria-singular',
    name: 'Organizer Prático Slim em Couro Amaciado',
    tagline: 'Design livre para transporte de cartões de luxo e passaporte',
    description: 'Porta-documentos minimalista em legítimo couro de alta gramatura curtido organicamente, com costura manual encerada seladora.',
    longDescription: 'Feito para quem valoriza a simplicidade impecável das belas linhas de design. Cada peça de couro é impermeabilizada com óleos naturais e ceras de abelha selvagem, garantindo uma pátina belíssima e maciez única ao longo de décadas de uso constante.',
    price: 210.00,
    category: 'Acessórios Prime',
    images: [
      'https://images.unsplash.com/photo-1622560480654-d96214fdc887?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1601924582962-d2aa49c12480?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Couro de flor integral curtido sem aditivos de cromo',
      'Tratamento especial anti-mofo e repelente a pingos',
      'Costura reforçada de sela com linha de algodão encerado',
      'Gravação em baixo relevo das iniciais inclusa'
    ],
    dimensions: '17 cm (L) × 11.5 cm (A) × 1.2 cm (Pomb)',
    materials: ['Couro Legítimo Nobre', 'Fios de Costura Encerados'],
    stock: 12,
    rating: 4.9,
    reviewsCount: 16,
    badge: 'Lançamento',
    variants: {
      colors: ['Caramelo Ateliê', 'Preto Absoluto', 'Café Imperial'],
      sizes: ['Tamanho Único']
    }
  },
  {
    id: 'enxoval-lavabo-fiorito',
    name: 'Toalhas de Lavabo Premium em Linho Belga',
    tagline: 'Bordados delicados campestres com tramas de renda milenar',
    description: 'Conjunto de duas toalhas de lavabo exclusivas feitas de linho com trama densa italiana e detalhes primorosos tecidos à mão.',
    longDescription: 'O carinho em receber bem as suas visitas através da clássica e intemporal barra de renda. Este produto é tecido com linho belga original que fica mais macio e encorpado a cada lavagem. O enxoval perfetto para noivas, bodas ou para compor um lavabo de luxo romântico.',
    price: 340.00,
    originalPrice: 380.00,
    category: 'Especiais do Ateliê',
    images: [
      'https://images.unsplash.com/photo-1616627547584-bf28cee262db?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Puro linho europeu escovado, toque macio insuperável',
      'Desenhos em bordado ponto cheio florais delicados',
      'Renda de bico tradicional tecida por fiandeiras do nordeste',
      'Acompanha saches aromáticos florais de capim-limão do ateliê'
    ],
    dimensions: '40 cm (L) × 60 cm (C)',
    materials: ['Linho Natural Belga', 'Renda Tradicional de Bilros', 'Fibras Orgânicas de Algodão'],
    stock: 5,
    rating: 5.0,
    reviewsCount: 22,
    badge: 'Edição Limitada',
    variants: {
      colors: ['Branco Imaculado', 'Off-White Ateliê'],
      sizes: ['Set com 2 Unidades']
    }
  },
  {
    id: 'memorias-album-v3',
    name: 'Álbum Ateliê de Memórias em Linho e Fitas',
    tagline: 'Para guardar impressos e poesias que merecem eternidade',
    description: 'Álbum costurado artesanalmente com linho rústico e amarração em fitas de cetim douradas, proteção vegetal acid-free para fotografias.',
    longDescription: 'Em tempos de memórias virtuais efêmeras, o Álbum Ateliê resgata a tátil doçura de sentar e folhear histórias reais de amor. Perfeito para casamentos, gravidez ou histórias de gerações, este álbum possui folhas internas de algodão espessas para receber colagens e anotações livres.',
    price: 395.00,
    originalPrice: 420.00,
    category: 'Especiais do Ateliê',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=800&auto=format&fit=crop'
    ],
    features: [
      'Costura manual no clássico formato lombada oculta',
      'Papel de algodão de ph neutro 240g de alta resistência',
      'Folhas intercaladas com papel manteiga de seda translúcido',
      'Laço de fechamento em fio de seda dourada trançado'
    ],
    dimensions: '28 cm (L) × 28 cm (A) × 5.0 cm (Espessura)',
    materials: ['Linho Natural Rústico', 'Fitas de Organza Belga', 'Papel Algodão Livre de Ácido'],
    stock: 4,
    rating: 5.0,
    reviewsCount: 15,
    badge: 'Mais Vendido',
    variants: {
      colors: ['Linho Cru Nativo', 'Linho Azul Provence', 'Linho Rosa Chá'],
      sizes: ['Álbum Família (80 Páginas)']
    }
  }
];
