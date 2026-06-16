export type CompanyId = 'pallyra' | 'guennita' | 'mimada' | 'tuttymimo';

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
  isKit?: boolean;
  kitType?: 'kit_pronto' | 'monte_seu_kit';
  kitItems?: { type: 'product' | 'insumo' | 'addon'; id: string; quantity: number }[];
  kitDiscountPercentage?: number;
}

export interface Variation {
  id: string;
  name: string; // Cor, Tamanho, etc
  type: 'single' | 'multiple';
  options: {
    name: string;
    price: number;
    stockId?: string;
  }[];
}

export interface Insumo {
  id: string;
  code: string;
  name: string;
  unit: 'mt' | 'cx' | 'pct' | 'unid';
  quantity: number;
  costPrice: number;
  unitValue: number;
  description: string;
  criticalLimit: number;
  category?: string;
  subcategory?: string;
}

export interface Order {
  id: string;
  code: string; // MS12345
  companyId: CompanyId;
  customerName: string;
  customerCpfCnpj: string;
  contact: string;
  address?: string;
  items: CartItem[];
  total: number;
  status: 'quote' | 'approval' | 'waiting_deposit' | 'production' | 'assembly' | 'ready' | 'delivered' | 'cancelled' | 'pending' | 'delivery' | 'waiting_payment' | 'planned_payment' | 'paid' | 'waiting_remaining' | 'planned_active' | 'fully_paid';
  createdAt: any; 
  deliveryDate: string;
  deliveryType?: 'retirada' | 'delivery' | 'shipping';
  shippingCost?: number;
  isEmergency: boolean;
  paymentStatus?: 'pending' | 'paid' | 'cancelled' | 'partial' | 'refunded';
  paymentMode?: 'full' | 'planned';
  payment_method?: 'full' | 'planned';
  plannedMethod?: 'credit_card' | 'digital_booklet';
  remainingAmount?: number;
  remainingInstallments?: number;
  remainingInstallmentValue?: number;
  remainingFee?: number;
  isWholesale: boolean;
  observations: string;
  photos?: string[];
  hasSignal?: boolean;
  signalValue?: number;
  source?: 'catalog' | 'admin';
  giftInfo?: string;
  giftName?: string;
  giftTheme?: string;
  giftColors?: string;
  insumosDeducted?: boolean;
  marketplace?: string;
  marketplaceTax?: number;
  history?: {
    status: Order['status'];
    timestamp: any;
    updatedBy?: string;
    notes?: string;
  }[];
}

export interface Customer {
  id: string;
  code: string; // 5 digits
  name: string;
  contact: string;
  email?: string;
  cpfCnpj: string;
  birthDate: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  totalSpent: number;
  ordersCount: number;
  pendingBalance?: number;
  createdAt: any;
  companyId: CompanyId;
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
}

export interface CartItem extends Product {
  quantity: number;
  productId?: string;
  observations?: string;
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
  createdAt: any;
  updatedAt: any;
}
