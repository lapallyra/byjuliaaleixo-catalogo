export type CompanyId = 'pallyra' | 'guennita' | 'mimada' | 'tuttymimo';

export interface CrmSettings {
  id?: string;
  companyId: CompanyId;
  usePhoneId: boolean;
  requireCpf: boolean;
  alertIncomplete: boolean;
  allowEditCheckout: boolean;
}

export interface Product {
  id: string;
  code: string;
  company: CompanyId;
  product_name: string;
  description: string;
  isWholesaleEnabled?: boolean;
  retail_price: number;
  wholesale_price: number;
  wholesale_min_qty: number;
  wholesale_max_qty?: number;
  original_price: number;
  current_price: number;
  image: string;
  image_hover?: string;
  images?: string[];
  category: string;
  subcategory: string;
  isVisible: boolean;
  isFeatured: boolean;
  stock?: number;
  insumos?: { insumoId: string; quantity: number }[];
  variations?: Variation[];
  estimatedCost?: number;
  activeInCatalog?: boolean;
  salesCount?: number;
  clicksCount?: number;
  isLastUnits?: boolean;
  createdAt?: any;
  giftInfo?: string;
  imageSettings?: {
    scale?: number;
    translateX?: number;
    translateY?: number;
    rotate?: number;
  };
  emotionalScore?: number;
  isKit?: boolean;
  kitType?: 'kit_pronto' | 'monte_seu_kit';
  kitItems?: { type: 'product' | 'insumo' | 'addon'; id: string; quantity: number }[];
  kitDiscountPercentage?: number;
  price?: number;
  type?: 'fabricado' | 'revenda' | 'kit' | 'digital' | 'servico';
  main_image?: string; // Legacy or alternative field used in some components
  
  // Custom properties for advanced editor tabs
  brand?: string;
  isExclusive?: boolean;
  collection?: string;
  collectionCoverImage?: string;
  minStock?: number;
  tags?: string[];
  displayOrder?: number;
  relatedProductId?: string;
  recommendedProductIds?: string[];
  seoTitle?: string;
  slug?: string;
  seoDescription?: string;
  seoKeywords?: string;
  personalizationSettings?: {
    id: string;
    type: 'text' | 'image' | 'select';
    label: string;
    placeholder?: string;
    charLimit?: number;
    isRequired: boolean;
    options?: string[];
  }[];
  productionTime?: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
}

export interface Variation {
  id: string;
  name: string; // Cor, Tamanho, etc
  type: 'single' | 'multiple';
  options: {
    name: string;
    price: number;
    sku?: string;
    stock?: number;
    weight?: number;
    image?: string;
    stockId?: string;
  }[];
}

export interface Componente {
  id: string;
  code?: string;
  name: string;
  category: string;
  supplier?: string;
  brand?: string;
  unit: 'unid' | 'folha' | 'mt' | 'cm' | 'mm' | 'rolo' | 'pct' | 'cx' | 'kg' | 'g' | 'lt' | 'ml' | 'outro';
  quantity: number;
  minQuantity: number;
  criticalLimit: number;
  unitCost: number;
  costPrice: number;
  unitValue: number;
  location?: string;
  description?: string;
  isActive: boolean;
  updatedAt: any;
  createdAt: any;
  classification?: "componente" | "variacao" | "insumo";
  investimento?: number;
}

export type Insumo = Componente;

export interface ComponenteMovement {
  id: string;
  componenteId: string;
  date: any;
  type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  origin?: string;
  description?: string;
  userId: string;
}

export type OrderApprovalStatus = 'pending' | 'approved' | 'adjustments_requested';

export interface OrderVersion {
  id: string;
  orderId: string;
  version: number;
  data: Partial<Order>;
  comment?: string;
  author: 'admin' | 'customer';
  createdAt: any;
}

export interface OrderPayment {
  id: string;
  date: string;
  amount: number;
  method: string;
  notes?: string;
}

export interface OrderTimelineEvent {
  id: string;
  date: string;
  time: string;
  description: string;
  user?: string;
  timestamp?: any;
}

export interface Order {
  id: string;
  code: string; // MS12345
  companyId: CompanyId;
  customerName: string;
  customerCpfCnpj: string;
  contact: string;
  customerEmail?: string;
  customerCity?: string;
  address?: string;
  customerAddress?: string;
  responsible?: string;
  priority?: 'baixa' | 'normal' | 'alta' | 'urgente';
  customizationName?: string;
  customizationTheme?: string;
  customizationColors?: string;
  customizationArtText?: string;
  customizationEventDate?: string;
  customizationNotes?: string;
  payments?: OrderPayment[];
  timeline?: OrderTimelineEvent[];
  updatedBy?: string;
  items: CartItem[];
  subtotal?: number;
  total: number;
  discount?: number;
  paymentMethod?: string;
  status: 'novo pedido' | 'approved' | 'adjustments_requested' | 'quote' | 'approval' | 'waiting_deposit' | 'waiting_production' | 'production' | 'conferencing' | 'assembly' | 'ready' | 'packaging' | 'delivered' | 'cancelled' | 'pending' | 'delivery' | 'waiting_payment' | 'planned_payment' | 'paid' | 'waiting_remaining' | 'planned_active' | 'fully_paid' | 'finalized';
  createdAt: any; 
  deliveryDate: string;
  productionDate?: string;
  deliveryType?: 'retirada' | 'delivery' | 'shipping';
  shippingCost?: number;
  isEmergency: boolean;
  paymentStatus?: 'pending' | 'paid' | 'cancelled' | 'partial' | 'refunded';
  paymentMode?: 'full' | 'planned';
  payment_method?: 'full' | 'planned';
  updatedAt?: any;
  plannedMethod?: 'credit_card' | 'digital_booklet';
  remainingAmount?: number;
  remainingInstallments?: number;
  remainingInstallmentValue?: number;
  remainingFee?: number;
  remainingValue?: number;
  isWholesale: boolean;
  observations: string;
  photos?: string[];
  hasSignal?: boolean;
  signalValue?: number;
  payAmount?: number;
  source?: 'catalog' | 'admin';
  giftInfo?: string;
  giftName?: string;
  giftTheme?: string;
  giftColors?: string;
  insumosDeducted?: boolean;
  marketplace?: string;
  marketplaceTax?: number;
  couponCode?: string;
  discountAmount?: number;
  deliveryChecklist?: {
    productsChecked: boolean;
    quantityCorrect: boolean;
    packagingApplied: boolean;
    personalizationChecked: boolean;
    internalNoteValidated: boolean;
  };
  deliveryRating?: {
    quality: number;
    time: number;
    margin: number;
    notes?: string;
  };
  history?: {
    status: Order['status'];
    timestamp: any;
    updatedBy?: string;
    notes?: string;
  }[];
  approvalStatus?: OrderApprovalStatus;
  currentVersion?: number;
  trackingCode?: string;
  shippingLabelUrl?: string;
  productionPriority?: 'normal' | 'alta' | 'urgente';
  assignee?: string;
  atelier?: string;
  batchId?: string;
  customerId?: string;
}

export interface ProductionBatch {
  id: string;
  code: string; // LOTE-0001
  companyId: CompanyId;
  orderIds: string[];
  productIds: string[];
  productNames: string[];
  totalQuantity: number;
  status: 'aberto' | 'em_producao' | 'em_separacao' | 'concluido';
  createdAt: any;
  updatedAt: any;
  startedAt?: any;
  finishedAt?: any;
  estimatedProductionTime?: number; // in minutes
  notes?: string;
  consolidatedInsumos?: { insumoId: string; quantity: number; name: string; unit: string }[];
  history?: {
    status: ProductionBatch['status'];
    timestamp: any;
    updatedBy?: string;
    notes?: string;
  }[];
}

export interface CustomerAddress {
  id: string;
  alias?: string;
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  isMain: boolean;
}

export interface CustomerContact {
  id: string;
  name?: string;
  phone: string;
  email?: string;
  type: 'Principal' | 'Financeiro' | 'Entrega' | 'Outro';
  isMain: boolean;
}

export interface CustomerTag {
  id: string;
  name: string;
  color: string;
  active: boolean;
}





export interface CustomerInteraction {
  id: string;
  date: string;
  userId: string;
  userName: string;
  actionType: 'contato' | 'mensagem' | 'observacao' | 'campanha';
  description: string;
}

export interface CustomerNote {
  id: string;
  date: string;
  userId: string;
  userName: string;
  note: string;
  type: 'internal' | 'commercial';
}

export interface Customer {
  id: string;
  code: string; // 5 digits
  name: string;
  contact?: string; // Legacy field
  phone?: string;
  email?: string; // Legacy field
  cpfCnpj?: string;
  birthDate?: string;
  address?: string; // Legacy field
  number?: string; // Legacy field
  neighborhood?: string; // Legacy field
  city?: string; // Legacy field
  state?: string; // Legacy field
  zipCode?: string; // Legacy field
  contacts?: CustomerContact[]; // New field
  addresses?: CustomerAddress[]; // New field
  tags?: CustomerTag[];
  internalNotes?: CustomerNote[];
  commercialNotes?: CustomerNote[];
  interactions?: CustomerInteraction[];
  totalSpent: number;
  ordersCount: number;
  pendingBalance?: number;
  createdAt: any;
  companyId: CompanyId;
  status?: 'Ativo' | 'Inativo' | 'Cadastro Incompleto';
  notes?: string; // Legacy field
  avatarUrl?: string;
  lastPurchaseDate?: string;
  favoriteProductIds?: string[];
}

export interface Memory {
  id?: string;
  customerId: string;
  customerEmail?: string;
  customerName?: string;
  personName: string;
  date: string; // ISO Date (YYYY-MM-DD)
  eventType: 'Aniversário' | 'Casamento' | 'Maternidade' | 'Outro';
  notes?: string;
  giftPreferences?: string;
  themeOrColors?: string;
  createdAt: any; // Firestore Timestamp
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  adminReply?: string;
  createdAt: any;
}

export interface FinanceEntry {
  id: string;
  type: 'revenue' | 'expense';
  category: string;
  description: string;
  value: number;
  date: string;
  status: 'paid' | 'pending';
  companyId: CompanyId;
  orderId?: string;
  paymentMethod?: string;
  marketplace?: string;
  marketplaceTax?: number;
}

export interface SystemNotificationConfig {
  id?: string;
  telegram_enabled: boolean;
  telegram_bot_token: string;
  telegram_chat_id: string;
  notify_new_order?: boolean;
  notify_payment_confirmed?: boolean;
  notify_order_canceled?: boolean;
  notify_order_completed?: boolean;
  notify_low_stock?: boolean;
  notify_new_client?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  companyId: CompanyId;
  logoUrl?: string;
  pixQrCode?: string;
  pixType?: 'cpf' | 'cnpj' | 'email' | 'phone' | 'random';
  pixKey?: string;
  pixBeneficiary?: string;
  facebookPixelId?: string;
  waMainMessage?: string;
  waCatalogMessage?: string;
  templateReceipt?: string;
  templateQuote?: string;
  templateCoupon?: string;

  // Additional fields for branding and config
  store_logo?: string;
  store_isotipo?: string;
  store_logo_scale?: number;
  store_logo_rotate?: number;
  store_logo_x?: number;
  store_logo_y?: number;
  store_name?: string;
  store_legal_name?: string;
  store_slogan?: string;
  store_cnpj?: string;
  store_contact?: string;
  store_address?: string;
  store_qrcode?: string;
  store_pix_key?: string;
  store_pix_name?: string;
  facebook_pixel?: string;
  whatsapp_main_message?: string;
  whatsapp_product_message?: string;
  receipt_footer?: string;
  quote_footer?: string;
  receipt_message?: string;
  coupon_message?: string;
  monthly_goal?: number;
  roulette_prizes?: { id: string; name: string; active: boolean; weight: number }[];
  customDates?: { name: string; day: number; month: number }[];
  theme_primary_color?: string;
  theme_accent_color?: string;
  theme_text_color?: string;
  checkout_banner?: string;
  instagram?: string;
  about_me_photo?: string;
  about_me_title?: string;
  about_me_bio?: string;
  about_me_purpose?: string;
  
  // Mercado Pago Pix Automatic
  mercadopago_token?: string;
  pix_automatico_active?: boolean;
  
  shipping_rules?: {
    id: string;
    region: string;
    cep_start: string;
    cep_end: string;
    price: number;
    active: boolean;
  }[];

  global_fixed_costs?: number;
  global_labor_cost_per_hour?: number;
  global_tax_rate?: number;
  fixed_costs_list?: { id: string; name: string; value: number }[];
  taxes_list?: { id: string; name: string; value: number; type?: string }[];
  labor_list?: { id: string; name: string; value: number }[];
  test_mode?: boolean;
  sound_notifications_active?: boolean;
  urgency_price?: number;
  urgency_description?: string;
}

export interface CartItem extends Product {
  quantity: number;
  productId?: string;
  observations?: string;
  selectedVariation?: string;
  selectedAddons?: any[];
  personalizationValues?: Record<string, string>;
  customization?: {
    name?: string;
    text?: string;
    notes?: string;
  };
  // Production tracking
  productionStatus?: 'nao_iniciado' | 'em_producao' | 'concluido';
  productionStartedAt?: any;
  productionFinishedAt?: any;
}

export interface AppConfig {
  company_1_name: string;
  company_1_slogan: string;
  company_1_logo?: string;
  company_2_name: string;
  company_2_slogan: string;
  company_2_logo?: string;
  company_3_name: string;
  company_3_slogan: string;
  company_3_logo?: string;
  company_4_name: string;
  company_4_slogan: string;
  company_4_logo?: string;
  whatsapp_number: string;
  background_color: string;
  text_color: string;
  checkout_banner?: string;
  store_cnpj: string;
  store_qrcode: string;
  discord_webhook: string;
  telegram_bot_token: string;
  telegram_chat_id: string;
  email_para_pedidos: string;
  
  site_title?: string;
  site_subtitle?: string;
  site_name?: string;

  global_fixed_costs?: number;
  global_labor_cost_per_hour?: number;
  global_tax_rate?: number;
  fixed_costs_list?: { id: string; name: string; value: number }[];
  taxes_list?: { id: string; name: string; value: number; type?: string }[];
  labor_list?: { id: string; name: string; value: number }[];
}

export interface SaleNotification {
  id: string;
  customerName: string;
  productName: string;
  timeAgo: string;
  cityState?: string;
  companyId: CompanyId;
}

export interface CheckoutData {
  name: string;
  birthDate: string;
  cpfCnpj: string;
  contact: string;
  deliveryType: 'retirada' | 'delivery' | 'shipping';
  address: string;
  city: string;
  state: string;
  zipCode: string;
  paymentMethod: 'pix' | 'credit_card' | 'pix_parcelado' | 'cash' | 'mercadopago' | 'planned';
  paymentMode?: 'full' | 'planned';
  plannedMethod?: 'credit_card' | 'digital_booklet';
  installments?: number;
  needsChange?: 'SIM' | 'NÃO';
  changeAmount?: string;
  observations: string;
  isEmergency?: boolean;
  wonPrize?: string;
  roulettePrize?: string;
  roulettePlayed?: boolean;
  selectedAddons?: string[];
  addonMessage?: string;
}

export interface CheckoutAddon {
  id: string;
  name: string;
  price: number;
  image: string;
  active: boolean;
  companyId: CompanyId;
}

export interface Suggestion {
  id: string;
  companyId: string;
  message: string;
  createdAt: any;
  read: boolean;
}

export type CategoryId = 'comercial' | 'profissional' | 'religiosa' | 'sazonal' | 'marketing' | 'social' | 'evento' | 'emocional' | 'feminina' | 'masculina' | 'infantil' | 'escolar' | 'empresarial' | 'casamento' | 'maternidade';

export interface CommemorativeDate {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  day: number;
  month: number;
  year_fixed: boolean; 
  recurrent: boolean;
  active: boolean;
  theme_color: string;
  icon: string;
  banner?: string;
  hashtags: string[];
  marketing_phrase: string;
  priority: number;
  mobile_id?: 'carnaval' | 'pascoa' | 'corpus_christi' | 'mothers_day' | 'fathers_day' | 'black_friday';
  is_national?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface ProductAsset {
  id: string;
  name: string;
  type: 'front_art' | 'back_art' | 'cut_file' | 'mask' | 'template' | 'pdf_print' | 'auxiliary' | 'font' | 'assembly_instruction';
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  lastModifiedAt: string;
  observations?: string;
}

export interface CustomField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'image' | 'date';
  value: string;
  font: string;
  fontSize: number;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scale: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  limitCharacters?: number;
  uppercase?: boolean;
}

export interface ProductLayer {
  id: string;
  name: string;
  isVisible: boolean;
  isLocked: boolean;
  index: number;
}

export interface ProductModel extends Product {
  assets: ProductAsset[];
  fields: CustomField[];
  layers: ProductLayer[];
  canvasWidth: number;
  canvasHeight: number;
}

export interface Coupon {
  id: string;
  companyId: CompanyId;
  name: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue?: number;
  startDate?: string;
  endDate?: string;
  maxUses?: number;
  usesCount: number;
  limitPerClient?: number;
  status: 'active' | 'inactive' | 'archived';
  scope: 'all' | 'products' | 'categories' | 'collections';
  appliedProducts?: string[];
  appliedCategories?: string[];
  appliedCollections?: string[];
  excludedProducts?: string[];
  createdAt: any;
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone: string;
  email?: string;
  cnpj?: string;
  address?: string;
  rating?: number;
  tags?: string[];
  companyId: CompanyId;
  createdAt: any;
}

export interface PurchaseItem {
  insumoId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  companyId: CompanyId;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalValue: number;
  status: 'pendente' | 'comprado' | 'recebido' | 'cancelado';
  notes?: string;
  orderDate: any;
  deliveryDate?: any;
  createdAt: any;
  updatedAt: any;
}

export interface PromotionalCampaign {
  id: string;
  slug: string;
  name: string;
  description: string;
  marketing_phrase?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  banner?: string;
  bannerMobile?: string;
  theme_color?: string;
  products: string[]; // Product IDs
  priority: number;
  createdAt: any;
  updatedAt: any;
}

export interface Campaign {
  id: string;
  internalName?: string;
  title: string;
  subtitle?: string;
  description?: string;
  type: 'banner' | 'carousel' | 'product_highlight' | 'seasonal_campaign';
  active: boolean;
  startDate?: string;
  endDate?: string;
  priority: number;
  companyId: CompanyId | 'all';
  items: string[]; // array of productId or banner data (as JSON string or ID)
  targetPages: ('home' | 'catalog' | 'product')[];
  highlightProductId?: string;
  imageUrl?: string;
  mobileImageUrl?: string;
  colorTheme?: string;
  linkUrl?: string;
  createdAt: any;
  updatedAt?: any;
}

export type AuditModule = 
  | 'Clientes' 
  | 'Produtos' 
  | 'Pedidos' 
  | 'Vendas'
  | 'Produção' 
  | 'Estoque' 
  | 'Compras' 
  | 'Financeiro' 
  | 'Entregas' 
  | 'Configurações' 
  | 'Usuários';

export type AuditActionType = 
  | 'Criação' 
  | 'Alteração' 
  | 'Atualização'
  | 'Exclusão Lógica' 
  | 'Mudança de Status' 
  | 'Registro de Pagamento' 
  | 'Entrada de Estoque' 
  | 'Saída de Estoque'
  | 'Cancelamento' 
  | 'Aprovação' 
  | 'Alerta'
  | 'Alteração de Preço' 
  | 'Alteração de Ficha Técnica' 
  | 'Alteração de Prazo'
  | 'Exportação'
  | 'Restauração';

export interface AuditLog {
  id?: string;
  correlationId: string;
  timestamp: any;
  date: string;
  time: string;
  user: {
    uid: string;
    email: string;
    name?: string;
    role: 'Administrador' | 'Gerente' | 'Funcionário';
  };
  module: AuditModule;
  action: AuditActionType;
  resourceId: string;
  resourceName: string;
  oldData?: any;
  newData?: any;
  origin: 'Web' | 'Sistema' | 'API' | 'Automação';
  companyId?: CompanyId;
  details?: any;
}



export type UserRole = 'ADMINISTRADOR' | 'ATENDIMENTO' | 'PRODUCAO' | 'FINANCEIRO';

export interface AdminUser {
  id?: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  lastLogin?: any; // Firestore timestamp
  createdAt: any;
}
