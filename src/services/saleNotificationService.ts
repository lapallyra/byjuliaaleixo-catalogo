import { SaleNotification, CompanyId, Product } from '../types';
import { PRODUCTS } from '../constants';

const CUSTOMER_NAMES = [
  'Monica B.', 'Luiz Carlos N.', 'Priscila O.', 'Juliana S.', 'Guilherme M.',
  'Ana Paula R.', 'Felipe A.', 'Camila G.', 'Matheus K.', 'Beatriz L.',
  'Rodrigo F.', 'Patricia T.', 'Lucas H.', 'Gabriela M.', 'Thiago C.',
  'Larissa P.', 'Breno V.', 'Isabela D.', 'Vitor Hugo S.', 'Leticia J.',
  'Fernanda E.', 'Ricardo A.', 'Sandra M.', 'Claudio G.', 'Amanda B.',
  'Roberto Carlos S.', 'Aline D.', 'Paulo Henrique F.', 'Renata O.', 'Eduardo J.',
  'Tatiana C.', 'Carla B.', 'Leonardo M.', 'Simone T.', 'Henrique S.',
  'Viviane P.', 'Diego R.', 'Vanessa G.', 'Mauricio N.', 'Julio Cesar M.'
];

export const generateRandomNotification = (companyId: CompanyId): SaleNotification => {
  const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
  const seconds = Math.floor(Math.random() * 16) + 5; // 5 to 20 seconds
  
  const regions = [
    'São Paulo - SP', 'Rio de Janeiro - RJ', 'Curitiba - PR', 'Florianópolis - SC', 
    'Belo Horizonte - MG', 'Goiânia - GO', 'Brasília - DF', 'Porto Alegre - RS',
    'Salvador - BA', 'Fortaleza - CE', 'Recife - PE', 'Manaus - AM', 'Vitória - ES'
  ];
  const region = regions[Math.floor(Math.random() * regions.length)];

  const productsInCompany = Object.values(PRODUCTS).filter(p => p.company === companyId);
  const genericItems = {
    pallyra: ['Placa de Porta Maternidade', 'Kit Higiene Luxo', 'Álbum do Bebê Bordado', 'Quadro de Nascimento', 'Lembrancinha Batizado'],
    guennita: ['Planner 2026', 'Caderno de Receitas', 'Diário Devocional', 'Box Colecionador', 'Pasta Executiva', 'Caderneta Cinderela Luxo'],
    mimada: ['Sacola Personalizada', 'Papel de Seda Premium', 'Lacre de Cera', 'Etiqueta Adesiva Ouro', 'Cartão de Agradecimento']
  };

  const pool = productsInCompany.length > 0 ? productsInCompany.map(p => p.product_name) : (genericItems[companyId as keyof typeof genericItems] || ['um item especial']);
  const product = pool[Math.floor(Math.random() * pool.length)];
  
  return {
    id: crypto.randomUUID(),
    customerName: name,
    productName: product, // just the product name now
    timeAgo: `há ${seconds} segundos em ${region}`,
    companyId
  };
};

export const createRealNotification = (name: string, products: string[], companyId: CompanyId): SaleNotification => {
  const regions = ['São Paulo - SP', 'Rio de Janeiro - RJ', 'Curitiba - PR', 'Belo Horizonte - MG'];
  const region = regions[Math.floor(Math.random() * regions.length)];
  return {
    id: crypto.randomUUID(),
    customerName: name,
    productName: products.join(', '),
    timeAgo: `há 1 segundo em ${region}`, // Simulating the region slightly for real notifications if we don't have it
    companyId
  };
};
