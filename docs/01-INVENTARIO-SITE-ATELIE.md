# 01 — INVENTÁRIO COMPLETO DO LEGADO SITE ATELIÊ
**Fase 1 — Arqueologia do Projeto**

> **Data da Análise**: 2026-07-24  
> **Sistema**: Site Ateliê (By Julia Aleixo Platform)  
> **Status**: Legado Auditado & Mapeado  

---

## 1. ARQUITETURA DO PROJETO

### Tech Stack Principal
- **Frontend Framework**: React 18 (Vite 5)
- **Linguagem**: TypeScript 5.5
- **Backend**: Node.js com Express (executando via Vercel Serverless Function em `/api/index.ts` e servidor local em `server.ts`)
- **Estilização**: Tailwind CSS v3 / Custom CSS
- **Animações & UI**: Framer Motion (`motion/react`), Lucide React Icons
- **Banco de Dados & Backend as a Service**: Firebase (Firestore, Auth, Storage) + Firebase Admin SDK no servidor Express
- **Visualização de Dados**: Recharts
- **Relatórios & PDFs**: jsPDF, html2canvas, XLSX

### Estrutura de Diretórios
```
/
├── api/                   # Entrypoint Serverless para Vercel (api/index.ts)
├── docs/                  # Documentação e Governança do Projeto
├── src/
│   ├── components/        # Interfaces e Telas
│   │   ├── Admin/         # Painel Administrativo / ERP (38+ abas e componentes)
│   │   ├── Catalog/       # Componentes da Vitrine e Banners
│   │   ├── Checkout/      # Modais e Telas do Fluxo de Compra
│   │   ├── Cliente/       # Painel e Área do Cliente
│   │   ├── Site/          # Wrappers e Estrutura Principal do E-commerce
│   │   ├── UI/            # Componentes visuais básicos
│   │   └── Shared/        # Componentes compartilhados
│   ├── db/                # Drizzle ORM / Configurações relacionais (Legado/Inativo)
│   ├── hooks/             # Custom Hooks (useProducts, useOrders, useCustomer, useMemories)
│   ├── lib/               # Libs utilitárias (firebase.ts, dateUtils, currencyUtils, finance)
│   ├── server/            # Servidor Express (controllers, routes, config)
│   ├── services/          # Serviços de integração (firebaseService, telegramService, etc)
│   ├── studiomockup/      # Protótipos estáticos (Legado/Candidato a Remoção)
│   ├── App.tsx            # Roteamento e Inicializador SPA
│   └── main.tsx           # Ponto de Entrada React
└── server.ts              # Servidor Express Backend & Middleware Vite
```

---

## 2. ROTAS E PÁGINAS

| Rota | Objetivo | Tipo | Status | Observações |
|---|---|---|---|---|
| `/` | Seleção de Ateliê / Portal de Entrada | Pública | 🟢 Ativo | Tela inicial de acolhimento (`EntryView.tsx`) |
| `/site` | Vitrine Principal do Ateliê | Pública | 🟢 Ativo | Carrosséis, destaques e depoimentos (`SiteApp.tsx`) |
| `/catalogo` | Catálogo Completo de Produtos | Pública | 🟢 Ativo | Filtros, busca e navegação (`CatalogView.tsx`) |
| `/kits` | Galeria de Kits Prontos | Pública | 🟢 Ativo | Exibição de conjuntos e presentes (`KitsView.tsx`) |
| `/monte-seu-kit` | Construtor Interativo de Kits | Pública | 🟢 Ativo | Seleção passo a passo de caixa e itens (`KitConstructor.tsx`) |
| `/como-funciona-kit` | Guia Explicativo do Construtor | Pública | 🟢 Ativo | Orientações de montagem (`HowToBuildKitView.tsx`) |
| `/colecoes` | Exibição de Coleções Temáticas | Pública | 🟢 Ativo | Mídia e produtos agrupativos (`ColecoesView.tsx`) |
| `/lista-de-presentes` | Sistema de Lista de Presentes | Pública | 🟢 Ativo | Busca e reserva de itens (`GiftListView.tsx`) |
| `/lista-de-presentes/info` | Informações da Lista de Mães/Noivas | Pública | 🟢 Ativo | Apresentação do serviço (`GiftListInfoView.tsx`) |
| `/lista-de-presentes/como-funciona` | Instruções da Lista de Presentes | Pública | 🟢 Ativo | Guia passo a passo (`GiftListHowItWorksView.tsx`) |
| `/produto/:id` | Detalhe do Produto | Pública | 🟢 Ativo | Ficha do produto, fotos e CTA (`ProductDetailPage.tsx`) |
| `/sobre-mim` | História da Fundadora / Marca | Pública | 🟢 Ativo | Storytelling institucional (`AboutMeView.tsx`) |
| `/nossos-ateliers` | Apresentação dos Ateliês | Pública | 🟢 Ativo | Endereços e proposta (`AteliersPresentationView.tsx`) |
| `/rastreamento` | Rastreamento de Pedidos | Pública | 🟢 Ativo | Consulta por código de pedido (`TrackingView.tsx`) |
| `/documentos` | Consulta de NF-e / Documentos | Pública | 🟢 Ativo | Busca por CPF/CNPJ (`DocumentSearch.tsx`) |
| `/feedbacks` | Depoimentos e Avaliações | Pública | 🟢 Ativo | Envio e leitura de resenhas (`CustomerFeedbackView.tsx`) |
| `/campanha/:slug` | Página de Campanha Promocional | Pública | 🟢 Ativo | Landing page temática (`PromotionalCampaignPage.tsx`) |
| `/datas-comemorativas/:id` | Campanha de Data Festiva | Pública | 🟢 Ativo | Páginas direcionadas (`CommemorativeCampaignPage.tsx`) |
| `/checkout` | Página Dedicada de Checkout | Pública | 🟢 Ativo | Fluxo direto de fechamento (`CheckoutPage.tsx`) |
| `/admin/login` | Login Administrativo | Pública | 🟢 Ativo | Autenticação do ERP (`AdminLoginView.tsx`) |
| `/admin/*` | Painel de Gestão ERP | Privada | 🟢 Ativo | Dashboard, Pedidos, Estoque, Financeiro, CRM (`AdminApp.tsx`) |
| `/studiomockup/*` | Protótipos / Wireframes | Pública | 🔴 Descontinuado | Telas estáticas sem integração real (`src/studiomockup`) |

---

## 3. COMPONENTES E CLASSIFICAÇÃO

### Componentes Globais / Reutilizáveis
- `CartSidebar.tsx` 🟢 **REAPROVEITAR**: Carrinho lateral dinâmico.
- `GiftListSidebar.tsx` 🟢 **REAPROVEITAR**: Carrinho especial para presentes.
- `ImageWithFallback.tsx` 🟢 **REAPROVEITAR**: Tratamento de imagem com fallback.
- `BotaoVoltar.tsx` 🟢 **REAPROVEITAR**: Botão navegação simples.
- `PrizeRouletteModal.tsx` 🟢 **REAPROVEITAR**: Gamificação e prêmios na roleta.
- `CookieBanner.tsx` 🟢 **REAPROVEITAR**: Aviso LGPD.
- `CustomerSocialProofToast.tsx` 🟢 **REAPROVEITAR**: Prova social em tempo real.

### Componentes de Gestão ERP (Admin)
- `Sidebar.tsx` 🟢 **REAPROVEITAR**: Menu lateral responsivo.
- `AdminDashboard.tsx` 🟡 **ANALISAR**: Monólito com 1100+ linhas; deve ser faturado em módulos menores.
- `OrderControlCenterTab.tsx`, `OrdersTab.tsx`, `OrderWizardModal.tsx` 🟢 **REAPROVEITAR**: Gestão centralizada de pedidos.
- `InventoryTab.tsx`, `InsumoFormModal.tsx` 🟢 **REAPROVEITAR**: Controle de estoque e insumos.
- `FinanceTab.tsx`, `PurchasesTab.tsx` 🟢 **REAPROVEITAR**: Fluxo de caixa e compras.
- `ClientsTab.tsx`, `CustomerFormSections.tsx` 🟢 **REAPROVEITAR**: Gestão de clientes/CRM.
- `CSVHandler.tsx` 🟡 **ANALISAR**: Importador CSV com regras diretas no client-side.

### Duplicidades & Candidatos a Descarte
- `CheckoutModal.tsx` x `CheckoutPage.tsx` 🟡 **ANALISAR**: Duplicação da lógica de checkout (Modal vs Página dedicada).
- `src/studiomockup/*` 🔴 **DESCARTAR**: Módulos de mockup desvinculados do sistema real.
- Scripts utilitários soltos na raiz (`fix*.js`, `replace*.cjs`, `test_*.ts`) 🔴 **DESCARTAR**: Scripts de manutenção rápida que já cumpriram seu papel.

---

## 4. FUNCIONALIDADES DO SISTEMA

1. **Catálogo & E-Commerce**:
   - Listagem de produtos, filtros por categorias e coleções.
   - Detalhamento de itens com opções de personalização e mimos extras.
   - Construtor interativo de kits com montagem dinâmica de caixas.

2. **Checkout & Pagamentos**:
   - Cálculo de frete (regras de ateliê / integrações).
   - Aplicação de cupons de desconto e verificação de roleta de prêmios.
   - Integração completa de pagamentos via Mercado Pago (PIX e Cartão) processada via API backend (`/api/payment/*` e `/api/checkout/*`).

3. **Lista de Presentes**:
   - Criação de listas personalizadas para mães/noivas.
   - Busca por código da lista e compra de presentes por convidados.

4. **Gestão Operacional ERP**:
   - **Pedidos**: Centro de Controle com visualização Kanban/Tabela, atualização de status, emissão de comprovantes A6 e etiquetas de produção.
   - **Ficha Técnica & Insumos**: Cadastro de BOM (Bill of Materials) associando produtos a insumos e baixa automática de estoque.
   - **Produção**: Lotes de produção (`productionBatches`) com reserva e dedução automática de insumos.
   - **Financeiro**: Lançamento de receitas/despesas, extrato de vendas e indicadores de margem.
   - **CRM**: Histórico de compras do cliente, LTV, ticket médio e notas de atendimento.
   - **Notificações**: Integração automática com Telegram Bot para envio de alertas de vendas e estoque baixo.

---

## 5. BANCO DE DADOS (FIRESTORE)

### Coleções Principais em Uso:
- `products`: Catálogo de produtos e variação.
- `orders`: Registro consolidado de pedidos.
- `customers`: Base de clientes e métricas.
- `insumos`: Matérias-primas e itens de estoque.
- `insumo_movements`: Histórico de movimentação de estoque.
- `productionBatches`: Lotes de produção ativos e concluídos.
- `finance`: Entradas e saídas financeiras.
- `giftLists`: Listas de presentes cadastradas.
- `campaigns` / `promotional_campaigns`: Campanhas ativas.
- `coupons`: Cupons de desconto.
- `addons`: Mimos e adicionais do pedido.
- `prizes`: Prêmios da roleta.
- `feedbacks`: Avaliações dos clientes.
- `suggestions`: Caixinha de sugestões do ateliê.
- `audit_logs`: Logs de auditoria do ERP.
- `telegram_logs`: Histórico de mensagens enviadas.
- `settings` / `crmSettings` / `appConfig`: Configurações globais do sistema.

### Observações sobre o Banco de Dados:
- A API Backend (`/api/*` via Express) utiliza o **Firebase Admin SDK** para operações críticas (Checkout, Atualização de Pedidos, Estoque e Produção).
- Algumas abas administrativas e leituras públicas continuam utilizando leituras em tempo real via `firebaseService.ts` no frontend.

---

## 6. EXPERIÊNCIA DO USUÁRIO (UX/UI)

- **Pontos Fortes**:
  - Estética refinada, acolhedora e alinhada ao posicionamento de luxo e afeto da marca.
  - Animações suaves de abertura de modais e carrinho lateral (`motion`).
  - Navegação fluida e responsiva em dispositivos móveis.
- **Pontos Confusos / Oportunidades**:
  - Presença de dois fluxos paralelos de checkout (Modal em overlay e Página `/checkout`).
  - Painel administrativo denso, necessitando de modularização para melhor tempo de carregamento.

---

## 7. INFRAESTRUTURA & TECNOLOGIA

- **Frontend Hosting**: Vercel (SPA estático compilado via Vite).
- **Backend Hosting**: Vercel Serverless Functions (rota `/api/*` mapeada para `api/index.ts`).
- **Dev Server Local**: Express + Vite Middleware (`server.ts` na porta 3000).
- **Autenticação**: Firebase Authentication (Email/Senha para Admin).
- **Armazenamento de Imagens**: Firebase Storage.
- **Integradores Externos**: Mercado Pago API, Telegram Bot API.

---

## 8. CLASSIFICAÇÃO FINAL DO LEGADO

| Item | Decisão | Motivo |
|---|---|---|
| `api/index.ts` + `server.ts` | 🟢 REAPROVEITAR | Arquitetura Serverless + Express híbrida estável e compatível com Vercel. |
| `src/server/controllers/*` | 🟢 REAPROVEITAR | Controllers backend consolidados com Firebase Admin SDK. |
| `src/components/Admin/*` | 🟢 REAPROVEITAR | Abas funcionais do ERP cobrindo todas as necessidades operacionais. |
| `src/components/CheckoutPage.tsx` | 🟢 REAPROVEITAR | Fluxo oficial e isolado de fechamento de vendas. |
| `src/services/firebaseService.ts` | 🟡 APRIMORAR | Arquivo denso com 2700+ linhas; gradual migração de escritas para a API backend. |
| `src/components/AdminDashboard.tsx` | 🟡 APRIMORAR | Arquivo monólito; recomendada extração de componentes menores. |
| `src/components/CheckoutModal.tsx` | 🟡 APRIMORAR | Avaliar unificação completa com `CheckoutPage.tsx`. |
| `src/studiomockup/*` | 🔴 DESCARTAR | Código de protótipo antigo e sem utilidade no ambiente de produção. |
| Scripts `fix*.js` / `replace*.cjs` na raiz | 🔴 DESCARTAR | Scripts temporários de correção de código mantidos como lixo no diretório. |
| `src/db/schema.ts` e `drizzle.config.ts` | 🔴 DESCARTAR | Estrutura relacional não utilizada (projeto é 100% Firestore). |

---

*Documento gerado como resultado oficial da Fase 1 — Arqueologia do Projeto.*
