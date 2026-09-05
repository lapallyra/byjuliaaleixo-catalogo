import { CompanyId } from '../types';

/**
 * Classificação formal dos tipos de escopo multi-ateliê:
 * - exclusive: Registro pertence estritamente ao ateliê ativo.
 * - shared: Recurso compartilhado ou com suporte a transmissão global ('all').
 * - unscoped: Recurso global/sem vínculo restritivo de ateliê (comum da oficina).
 * - hybrid: Recurso com segregação mista (ex.: produtos exclusivos vs. insumos compartilhados).
 */
export type ScopeClassification = 'exclusive' | 'shared' | 'unscoped' | 'hybrid';

export interface ResourceScopeInfo {
  resource: string;
  classification: ScopeClassification;
  identifierField: string;
  description: string;
  notes?: string;
}

/**
 * Mapeamento e governança central dos 14 recursos fundamentais do Admin:
 */
export const ATELIER_SCOPE_REGISTRY: Record<string, ResourceScopeInfo> = {
  produtos: {
    resource: 'produtos',
    classification: 'exclusive',
    identifierField: 'company / companyId',
    description: 'Catálogo de produtos segmentado estritamente por ateliê.',
    notes: 'Registros legados sem identificador são atribuídos retroativamente a "pallyra" para preservação do histórico.'
  },
  kits: {
    resource: 'kits',
    classification: 'exclusive',
    identifierField: 'company (isKit: true)',
    description: 'Kits montados ou prontos pertencentes ao catálogo do ateliê ativo.'
  },
  coleções: {
    resource: 'coleções',
    classification: 'unscoped',
    identifierField: 'product_collections',
    description: 'Agrupamentos visuais e editoriais no Admin; produtos referenciados preservam seu próprio escopo.'
  },
  insumos: {
    resource: 'insumos',
    classification: 'unscoped',
    identifierField: 'insumos',
    description: 'Matérias-primas e componentes de papelaria e cartonagem compartilhados na oficina de produção.'
  },
  estoque: {
    resource: 'estoque',
    classification: 'hybrid',
    identifierField: 'Product.stock (exclusivo) / Insumo.quantity (compartilhado)',
    description: 'Estoque de produto acabado é exclusivo por ateliê; estoque e movimentações de insumos são de uso comum.'
  },
  clientes: {
    resource: 'clientes',
    classification: 'shared',
    identifierField: 'companyId (opcional)',
    description: 'Base única e compartilhada de clientes por toda a empresa. O vínculo comercial é identificado através dos pedidos realizados.',
  },
  pedidos: {
    resource: 'pedidos',
    classification: 'exclusive',
    identifierField: 'companyId',
    description: 'Vendas, orçamentos e operações de investimento restritos ao ateliê emissor.'
  },
  financeiro: {
    resource: 'financeiro',
    classification: 'exclusive',
    identifierField: 'companyId',
    description: 'Lançamentos de receita, despesa, DRE e fluxo de caixa segregados por ateliê.'
  },
  cupons: {
    resource: 'cupons',
    classification: 'exclusive',
    identifierField: 'companyId',
    description: 'Cupons de desconto restritos às compras e campanhas do respectivo ateliê.'
  },
  campanhas: {
    resource: 'campanhas',
    classification: 'shared',
    identifierField: 'companyId (CompanyId | "all")',
    description: 'Campanhas promocionais com opção de veiculação em ateliê específico ou global ("all").'
  },
  configurações: {
    resource: 'configurações',
    classification: 'hybrid',
    identifierField: 'SiteSettings (exclusivo) / AppConfig (compartilhado)',
    description: 'SiteSettings (identidade visual, Pix, frete) exclusivo por ateliê; AppConfig compartilhado no nível do sistema.'
  },
  fornecedores: {
    resource: 'fornecedores',
    classification: 'unscoped',
    identifierField: 'companyId (opcional)',
    description: 'Fornecedores cadastrados centralizados e disponíveis para toda a empresa.'
  },
  compras: {
    resource: 'compras',
    classification: 'shared',
    identifierField: 'companyId (opcional / centro de custo)',
    description: 'Compras compartilhadas gerais da empresa ou destinadas a ateliês específicos.'
  },
  produção: {
    resource: 'produção',
    classification: 'exclusive',
    identifierField: 'companyId',
    description: 'Lotes de produção (productionBatches) e fila de itens vinculados aos pedidos do ateliê.'
  },
  auditoria: {
    resource: 'auditoria',
    classification: 'exclusive',
    identifierField: 'companyId',
    description: 'Histórico de trilha de auditoria registrado por ateliê, preservando logs operacionais segmentados.'
  }
};

export const SUPPORTED_ATELIERS: CompanyId[] = [
  'pallyra',
  'guennita',
  'mimada',
  'tuttymimo',
  'madrinha'
];

export const LEGACY_DEFAULT_ATELIER: CompanyId = 'pallyra';

/**
 * Verifica se um registro qualquer atende ao escopo do ateliê alvo.
 * Preserva histórico: registros sem identificador técnico são mantidos em 'pallyra'.
 */
export function matchesAtelierScope<T>(
  item: T, 
  targetAtelier?: CompanyId | 'all', 
  resourceName?: string
): boolean {
  if (!targetAtelier || targetAtelier === 'all') {
    return true;
  }

  if (!item || typeof item !== 'object') {
    return false;
  }

  // Se o recurso for explicitamente sem escopo ou compartilhado em toda a empresa, permite leitura comum
  if (resourceName && (resourceName === 'insumos' || resourceName === 'coleções' || resourceName === 'fornecedores')) {
    return true;
  }

  const record = item as Record<string, any>;
  const companyId = record.companyId;
  const company = record.company;

  // Se o item tem companyId 'all' ou 'shared' (como campanhas ou compras globais), é acessível a todos
  if (companyId === 'all' || companyId === 'shared' || company === 'all' || company === 'shared') {
    return true;
  }

  // Clientes pertencem à base única da empresa; leitura é compartilhada
  if (resourceName === 'clientes') {
    return true;
  }

  // Compras sem ateliê especificado são compras compartilhadas da empresa
  if (resourceName === 'compras' && !companyId && !company) {
    return true;
  }

  // Correspondência direta em companyId ou company
  if (companyId === targetAtelier || company === targetAtelier) {
    return true;
  }

  // Se há um ateliê explícito no registro e difere do alvo, descarta
  if ((companyId && companyId !== targetAtelier) || (company && company !== targetAtelier)) {
    return false;
  }

  // Regra de preservação de histórico para registros sem identificador (legado pré-multi-empresa)
  if (!companyId && !company) {
    // Para produtos, pedidos e financeiro: o ateliê original é pallyra
    return targetAtelier === LEGACY_DEFAULT_ATELIER;
  }

  return false;
}

/**
 * Filtra uma coleção de itens garantindo a aplicação da política central de escopo.
 */
export function filterByAtelierScope<T>(
  items: T[], 
  targetAtelier?: CompanyId | 'all', 
  resourceName?: string
): T[] {
  if (!targetAtelier || targetAtelier === 'all') {
    return items;
  }
  return items.filter((item) => matchesAtelierScope(item, targetAtelier, resourceName));
}

/**
 * Assegura que um payload a ser gravado no Firestore possua o companyId do ateliê ativo.
 */
export function ensureAtelierScope<T extends Record<string, any>>(
  data: T, 
  targetAtelier: CompanyId
): T & { companyId: CompanyId } {
  return {
    ...data,
    companyId: data.companyId || targetAtelier
  };
}

/**
 * Nome amigável de apresentação de cada ateliê.
 */
export function getAtelierDisplayName(companyId: CompanyId): string {
  switch (companyId) {
    case 'pallyra': return 'La Pallyra';
    case 'guennita': return 'Guennita';
    case 'mimada': return 'Mimada';
    case 'tuttymimo': return 'Tuttymimo';
    case 'madrinha': return 'Madrinha';
    default: return String(companyId);
  }
}
