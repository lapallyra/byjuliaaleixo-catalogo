# 10 — ARQUITETURA TÉCNICA OFICIAL
**BY JULIA ALEIXO PLATFORM**

> **Data de Emissão**: 2026-07-24  
> **Sistema**: By Julia Aleixo Platform  
> **Status**: Arquitetura Técnica Aprovada & Documentada  

---

## 1. VISÃO GERAL DA ARQUITETURA

A **BY JULIA ALEIXO PLATFORM** adota uma arquitetura Full-Stack moderna, fortemente desacoplada e orientada ao domínio de ateliês artesanais de luxo. A solução é composta por:

1. **Frontend (E-commerce / Storefront PWA + Painel Administrativo ERP)**:
   - Desenvolvido em **React 18** com **TypeScript** e **Vite**.
   - Interface adaptativa (Mobile-first PWA e Desktop Workstation), rápida e responsiva, utilizando **Tailwind CSS** e animações fluidas com **Framer Motion**.
   - Suporte offline para consulta de catálogo e rascunhos de pedidos via Service Worker.

2. **Backend & Camada de Serviços (API Server)**:
   - Servidor **Node.js** com **Express** em TypeScript.
   - Padrão arquitetural em camadas bem definidas (**Controllers**, **Services**, **Routes**, e **Middlewares**).
   - Validações rigorosas de entrada de dados e tratamento centralizado de erros.
   - Execução Serverless na nuvem (Vercel / Cloud Run) com fallback para desenvolvimento local.

3. **Banco de Dados & Persistência de Dados**:
   - **Firestore** (Firebase as a Service) como *Single Source of Truth* documental e em tempo real.
   - Suporte a transações atômicas (ACID) para garantia de consistência entre atualização de pedidos, baixa de estoque e auditoria.

4. **Comunicação & Notificações**:
   - Comunicação RESTful padronizada JSON entre Client e Server.
   - Event Bus interno para acionamento de autômatos e automações de bastidores.
   - Notificações Web Push via VAPID e alertas operacionais via Bot do Telegram.

---

## 2. FRONTEND (STOREFRONT & ERP PWA)

### 2.1 Tecnologias & Bibliotecas
- **React 18** (Functional Components + Hooks).
- **Lucide React** para iconografia técnica e elegante.
- **Tailwind CSS** para estilização utilitária e design tokens.
- **Framer Motion** (`motion/react`) para transições de rotas e microinterações.
- **Recharts** para gráficos financeiros e relatórios de vendas.

### 2.2 Estrutura da Aplicação
- **App Principal (`src/App.tsx`)**: Gerencia o roteamento de páginas do cliente e do ERP.
- **Storefront (`src/components/Site/SiteApp.tsx`)**: Experiência do cliente (Catálogo, Personalização de Kits, Carrinho, Checkout, Rastreamento e Listas de Presentes).
- **Painel Administrativo (`src/components/Admin/AdminApp.tsx`)**: ERP centralizador de operações (Gestão de Pedidos, Lotes de Produção, Insumos BOM, Financeiro, CRM, Campanhas e Notificações).

---

## 3. BACKEND & CAMADA DE SERVIÇOS (API SERVER)

### 3.1 Arquitetura em Camadas
```
Client (Storefront / ERP)
       │
       ▼
Routes (`/src/server/routes/api.ts`)
       │
       ▼
Controllers (`/src/server/controllers/*`)
  ├── checkoutController.ts
  ├── orderController.ts
  ├── inventoryController.ts
  ├── paymentController.ts
  ├── productController.ts
  ├── productionController.ts
  └── dataController.ts
       │
       ▼
Services & Admin SDK (`/src/services/*`)
  ├── firebaseService.ts
  ├── auditService.ts
  ├── telegramService.ts
  └── automationEngine.ts
       │
       ▼
Firestore / Storage / Mercado Pago API
```

### 3.2 Regras de Entrada & Segurança Backend
- Validação e higienização de payload em todos os controllers antes de persistência no Firestore.
- Execução isolada no ambiente Node.js garantindo que segredos e chaves de API (Mercado Pago, Telegram Bot Token, Firebase Admin Service Account) nunca sejam expostos ao navegador.

---

## 4. BANCO DE DADOS & PERSISTÊNCIA

### 4.1 Coleções Orientadas ao Domínio
- **`products`**: Catálogo, variações, preços e links com Ficha Técnica (BOM).
- **`orders`**: Registro imutável de pedidos com histórico de versões.
- **`insumos` & `insumo_movements`**: Matérias-primas e log de entradas/saídas de estoque.
- **`productionBatches`**: Lotes de fabricação ativos na bancada do ateliê.
- **`customers`**: CRM, indicadores de valor do cliente (LTV) e histórico.
- **`finance`**: Fluxo de caixa, receitas e despesas operacionais.
- **`audit_logs`**: Trilha de auditoria das ações realizadas por usuários e administradores.

### 4.2 Transações e Consistência
- Operações de baixa de estoque e reserva de insumos utilizam transações atômicas para prevenir condições de corrida (*race conditions*) em acessos concorrentes.

---

## 5. AUTENTICAÇÃO, AUTORIZAÇÃO & RBAC

### 5.1 Sistema de Autenticação
- Integração com **Firebase Authentication** para verificação de credenciais de administradores e artesãos.
- Cookies de sessão HTTP-Only e validação de Tokens em chamadas protegidas.

### 5.2 Papéis de Acesso (RBAC)
- **`CLIENTE`**: Acesso à área de acompanhamento de pedidos, criação de listas de presentes e checkout.
- **`ARTESAO`**: Acesso ao módulo de bancada/produção, leitura de pedidos e atualização de status de montagem.
- **`ATENDIMENTO`**: Gestão de cadastros de clientes, atualização de status e acompanhamento de entrega.
- **`GERENTE`**: Gestão de estoque, compras, lançamentos financeiros e relatórios operacionais.
- **`ADMIN_MASTER`**: Acesso total ao sistema, configurações globais, integrações e logs de auditoria.

---

## 6. PWA & NOTIFICAÇÕES

### 6.1 Progressive Web App (PWA)
- Suporte a instalação na tela inicial através do **Web App Manifest** (`manifest.json`).
- Estratégias de Caching via **Service Worker**:
  - *Cache-First* para assets estáticos, fontes e ícones.
  - *Network-First* para APIs de catálogo e status de pedidos.

### 6.2 Notificações Push & Alertas
- **Web Push API (VAPID)** para envio de atualizações em tempo real no dispositivo do cliente.
- **Telegram Bot API** para notificação instantânea dos artesãos e equipe sobre novos pedidos e estoques críticos.

---

## 7. MÍDIA & CLOUD STORAGE

- Armazenamento descentralizado e otimizado de imagens no **Firebase Storage**.
- Compressão automática de foto enviada pela bancada do ateliê para acompanhamento visual do cliente.
- Fallback elegante para imagens com erro de carregamento (`ImageWithFallback.tsx`).

---

*Documentação oficial de Arquitetura Técnica do projeto By Julia Aleixo Platform.*
