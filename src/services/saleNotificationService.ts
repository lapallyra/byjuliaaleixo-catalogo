import { SaleNotification, CompanyId, Product } from '../types';
import { PRODUCTS } from '../constants';

const CUSTOMER_NAMES = [
  'Maria Lins', 'João Felipe', 'Luana Mattos', 'Ana Beatriz', 'Lucas Santos',
  'Mariana Costa', 'Guilherme Alves', 'Beatriz Silva', 'Felipe Oliveira', 'Camila Rocha',
  'Rafael Lima', 'Juliana Souza', 'Thiago Pereira', 'Larissa Mendes', 'Breno Ferraz',
  'Isabela Gomes', 'Vitor Hugo', 'Letícia Castro', 'Matheus Duarte', 'Gabriela Borges',
  'Bruno Martins', 'Ricardo Fonseca', 'Fernanda Andrade', 'Patrícia Koster', 'Cláudia Monteiro',
  'Sérgio Valente', 'Amanda Ribeiro', 'Roberto Carlos', 'Aline Moraes', 'Paulo Ricardo',
  'Rodrigo Mello', 'Julia Azevedo', 'Renata Nogueira', 'Eduardo Torres', 'Tatiana Reis',
  'Fábio Lins', 'Carla Machado', 'Leonardo Vieira', 'Simone Tavares', 'Henrique Bueno'
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
