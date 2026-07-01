import { SaleNotification, CompanyId, Product } from '../types';

const BRAZILIAN_NAMES = [
  'Ana Clara', 'Beatriz', 'Camila', 'Daniela', 'Fernanda', 
  'Gabriela', 'Helena', 'Isabella', 'Juliana', 'Larissa',
  'Maria V.', 'Mariana', 'Natalia', 'Patricia', 'Renata',
  'Sofia', 'Thais', 'Vitoria', 'Yasmin', 'Amanda'
];

const PR_CITIES = [
  'Querência do Norte - PR', 'Curitiba - PR', 'Londrina - PR', 'Maringá - PR', 
  'Ponta Grossa - PR', 'Cascavel - PR', 'São José dos Pinhais - PR', 'Foz do Iguaçu - PR',
  'Colombo - PR', 'Guarapuava - PR', 'Paranaguá - PR', 'Apucarana - PR', 'Toledo - PR',
  'Araucária - PR', 'Pinhais - PR', 'Campo Largo - PR', 'Almirante Tamandaré - PR', 'Piraquara - PR',
  'Umuarama - PR', 'Cambé - PR'
];

const OTHER_CITIES = [
  'São Paulo - SP', 'Rio de Janeiro - RJ', 'Belo Horizonte - MG', 
  'Salvador - BA', 'Porto Alegre - RS', 'Brasília - DF', 'Fortaleza - CE', 
  'Manaus - AM', 'Recife - PE', 'Goiânia - GO', 'Guarulhos - SP', 'Campinas - SP'
];

export const generateRandomNotification = (companyId: CompanyId, products: Product[] = []): SaleNotification => {
  const randomName = BRAZILIAN_NAMES[Math.floor(Math.random() * BRAZILIAN_NAMES.length)];
  
  // 70% chance of being from Paraná
  const isParana = Math.random() < 0.7;
  const citiesArray = isParana ? PR_CITIES : OTHER_CITIES;
  const randomCity = citiesArray[Math.floor(Math.random() * citiesArray.length)];
  
  const randomSeconds = Math.floor(Math.random() * 50) + 5; // 5 to 54 seconds
  
  let productName = 'um item exclusivo';
  if (products.length > 0) {
    const companyProducts = products.filter(p => p.company === companyId);
    if (companyProducts.length > 0) {
      productName = companyProducts[Math.floor(Math.random() * companyProducts.length)].product_name;
    }
  }

  return {
    id: Math.random().toString(36).substring(2, 9),
    customerName: randomName,
    productName: productName,
    timeAgo: `há ${randomSeconds} segundos`,
    cityState: randomCity,
    companyId: companyId
  };
};
