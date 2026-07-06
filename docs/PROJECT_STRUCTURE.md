# PROJECT_STRUCTURE.md - Documentação Técnica do Projeto

Este documento serve como a referência oficial da arquitetura, estrutura e padrões do projeto. Ele deve ser atualizado sempre que houver mudanças estruturais significativas.

---

# 1. VISÃO GERAL

## Resumo do Projeto
Uma plataforma integrada composta por um **ERP Administrativo** e um **Site de Vendas (Catálogo/Vitrine)**, desenvolvida especificamente para o ecossistema de ateliês de luxo.

## Objetivos
- **ERP**: Focado em produtividade, controle de produção, gestão financeira e estoque.
- **Site**: Focado em conversão de vendas, experiência do cliente e apresentação premium de produtos e kits.

## Arquitetura
- **Frontend**: React com TypeScript, utilizando Vite como bundler.
- **Backend**: Serverless utilizando Firebase (Firestore para banco de dados e Authentication para gestão de usuários).
- **Roteamento**: React Router para gestão de rotas SPA.
- **Estilização**: Tailwind CSS com foco em dois Design Systems distintos.
- **Notificações**: Integração com Telegram para eventos críticos (novos pedidos, estoque baixo, etc.).

## Tecnologias Utilizadas
- **Core**: React 18+, TypeScript.
- **UI & Animações**: Tailwind CSS, Lucide React (ícones), Framer Motion (animações).
- **Backend/Database**: Firebase Firestore, Firebase Auth.
- **Utilitários**: D3 (visualização de dados), Recharts (gráficos), Lucide React.

---

# 2. ESTRUTURA DE PASTAS

```text
/
├── docs/                 # Documentação oficial do projeto
│   ├── AGENTS.md         # Filosofia, metodologia e diretrizes
│   ├── PROJECT_STRUCTURE.md # Este documento (Arquitetura e Módulos)
│   └── ROADMAP.md        # Planejamento e Status
├── public/               # Assets públicos estáticos
├── src/                  # Código-fonte da aplicação
│   ├── assets/           # Imagens e ícones estáticos
│   ├── components/       # Componentes React (Organizados por domínio)
│   │   ├── Admin/        # Módulos exclusivos do ERP (Clean Glass 3D)
│   │   ├── Site/         # Módulos exclusivos do Site (Soft Neumorphism Premium)
│   │   ├── ui/           # Componentes de UI básicos e reutilizáveis
│   │   └── ...           # Componentes de visualização e lógica compartilhada
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Configurações de bibliotecas (Firebase, dateUtils, etc.)
│   ├── services/         # Serviços de comunicação (Firebase, Telegram, Audit, Produção)
│   ├── types/            # Definições de tipos TypeScript
│   ├── utils/            # Funções utilitárias (formatação, áudio, etc.)
│   ├── App.tsx           # Orquestrador principal de rotas
│   ├── main.tsx          # Ponto de entrada da aplicação
│   └── index.css         # Estilos globais e configuração do Tailwind
```

---

# 3. ROTAS

O sistema utiliza um padrão de **Isolamento de Módulos** através de sub-roteamento.

## ERP (Área Administrativa)
Acessível através do prefixo `/admin`.
- `/admin/login`: Tela de autenticação administrativa.
- `/admin/*`: Dashboard principal e todas as abas internas (protegidas por Auth).

## SITE (Páginas Públicas)
Acessível através de todas as outras rotas.
- `/`: Página de entrada (EntryView).
- `/vitrine`: Galeria de produtos geral.
- `/atelies`: Apresentação dos ateliês do grupo.
- `/colecoes`: Visualização por coleções.
- `/kits`: Listagem de kits prontos.
- `/kit-meukit`: Construtor dinâmico de kits.
- `/sobrenos`: Página institucional.
- `/listadepresentes-info`: Informações sobre lista de presentes.
- `/listadepresentes/:code`: Página individual de uma lista de presentes.
- `/lapallyra`, `/comamorguennita`, `/mimadasim`, `/tuttymimo`: Catálogos específicos por marca.
- `/checkout/:id`: Fluxo de finalização de compra.
- `/ped-:code`: Acompanhamento de pedido.
- `/rastreamento`: Consulta de status de entrega.
- `/studiomockup`: Ferramenta de visualização de produtos.

---

# 4. MÓDULOS ERP

O ERP é organizado em abas (Tabs) dentro do componente `AdminDashboard`, utilizando o Design System **Clean Glass 3D**.

- **Dashboard (Resumo Geral)**: Visão consolidada de vendas, clientes e alertas.
- **Operação**:
  - **Pedidos**: Gestão completa de vendas, aprovações e status.
  - **Produtos**: Cadastro, edição e controle de visibilidade.
  - **Clientes**: Base de dados de consumidores e histórico.
  - **Lista de Presentes**: Gestão de listas criadas por clientes.
- **Produção**:
  - **Painel de Operação (Control Center)**: Monitoramento em tempo real da linha de produção.
  - **Produção (Inventory)**: Gestão de insumos, materiais e ordens de fabricação.
  - **Eficiência Operacional**: Métricas de produtividade.
  - **Entregas**: Logística e status de envio/retirada.
  - **Engenharia & Custos (Auditoria)**: Análise técnica de custos de produtos.
  - **Kits & Combos**: Criação de ofertas combinadas.
- **Estoque**:
  - **Estoque (Purchases)**: Gestão de compras com fornecedores e entrada de materiais.
- **Financeiro**:
  - **Financeiro**: Fluxo de caixa, receitas e despesas.
  - **Checkout & Pagamentos (Funnel)**: Logs de eventos de abandono e conversão no checkout.
  - **Relatórios**: BI e exportação de dados.
- **Marketing**:
  - **Campanhas**: Gestão de banners e promoções.
  - **Coleções**: Organização temática de produtos.
  - **Avaliações (Feedbacks)**: Moderação de reviews de clientes.
  - **Cupons**: Gestão de códigos de desconto.
- **Sistema**:
  - **Configurações**: Ajustes globais, branding de marcas e tokens.
  - **Notificações**: Log de notificações enviadas (Telegram).
  - **Integrações**: Configurações de API (Mercado Pago, Pixel, etc).
  - **Atividades (Audit Logs)**: Trilha de auditoria de todas as alterações.

---

# 5. PÁGINAS DO SITE

O Site utiliza o Design System **Soft Neumorphism Premium** para todas as páginas públicas.

- **EntryView**: Landing page de entrada com transição de marcas.
- **CatalogView**: O coração das vendas. Listagem dinâmica com filtros e busca.
- **ProductDetail**: Visualização expandida (frequentemente em modal no catálogo).
- **Checkout**: Formulário de finalização com suporte a PIX, Cartão e Pagamento Planejado.
- **GiftListView**: Visualização premium de listas de presentes com reserva e compra online.
- **KitConstructor**: Interface interativa para montagem de kits personalizados.

---

# 6. COMPONENTES REUTILIZÁVEIS

Localizados em `src/components/ui/` e na raiz de `src/components/`.

- **ProductCard**: Card de produto premium (utilizado em todos os catálogos).
- **AdminOrchestratorSystem**: Provedor de contexto para gerenciar o estado global do ERP.
- **AuthProvider**: Gestão de sessão e permissões.
- **ErrorBoundary**: Captura de falhas e fallback visual premium.
- **ImageWithFallback**: Gestão de carregamento de imagens com placeholders.
- **CheckoutSteps**: Indicadores de progresso no checkout.

---

# 7. SERVICES

A lógica de negócio é centralizada na pasta `src/services/`.

- **firebaseService.ts**: CRUD completo, assinaturas em tempo real (snapshots) e gestão de erro Firestore.
- **telegramService.ts**: Orquestração de notificações via bot do Telegram.
- **auditService.ts**: Sistema de registro de logs de auditoria detalhados.
- **productionService.ts**: Lógica específica para transição de pedidos para a linha de produção.
- **mercadopagoService.ts**: Integração com API de pagamentos (quando disponível).

---

# 8. ESTRUTURA FIRESTORE

## Collections Principais
- `products`: Catálogo central de itens.
- `orders`: Base de dados de todos os pedidos realizados.
- `customers`: Registro de clientes e comportamento de compra.
- `insumos`: Materiais de produção e componentes de estoque.
- `finance`: Lançamentos de receita (vendas) e despesas.
- `settings`: Configurações globais e específicas de cada ateliê.
- `giftLists`: Listas de presentes vinculadas a clientes.
- `audit_logs`: Registros de ações administrativas.
- `coupons`: Regras de descontos ativos.

---

# 9. TYPES

Centralizados em `src/types.ts`.
- `Product`: Interface completa do produto, incluindo ficha técnica.
- `Order`: Detalhes do pedido, itens e status logístico.
- `Customer`: Dados cadastrais e CRM.
- `CompanyId`: Enum para as marcas ('pallyra' | 'guennita' | 'mimada' | 'tuttymimo').
- `FinanceEntry`: Estrutura de lançamentos financeiros.

---

# 10. FLUXOS PRINCIPAIS

## Fluxo de Compra (Site)
1. Navegação no Catálogo -> 2. Adição ao Carrinho -> 3. Checkout (Dados e Entrega) -> 4. Pagamento -> 5. Notificação Telegram -> 6. Registro no ERP.

## Fluxo de Produção (ERP)
1. Novo Pedido -> 2. Aprovação/Pagamento -> 3. Produção (Baixa automática de estoque) -> 4. Conferência -> 5. Envio/Retirada -> 6. Finalização.

---

# 11. DESIGN SYSTEMS

## ERP: Clean Glass 3D
- **Visual**: Glassmorphism, cards volumétricos, blur externo.
- **Objetivo**: Produtividade e precisão técnica.
- **Cores**: Neutros profundos, bordas translúcidas, tons de realce neon suaves.

## SITE: Soft Neumorphism Premium
- **Visual**: Sombras suaves (convex/concave), bordas arredondadas, aspecto "macio".
- **Objetivo**: Acolhimento, luxo acessível e facilidade de compra.
- **Cores**: Creme, Bege, Marrom e tons pastéis das marcas.

---

# 12. PADRÕES DE DESENVOLVIMENTO

- **Isolamento**: Modais e componentes devem ser encapsulados para evitar efeitos colaterais.
- **Estado Reativo**: Uso intensivo de `onSnapshot` para manter ERP e Site sempre sincronizados com o banco de dados.
- **Surgical Edits**: Edições diretas em componentes pequenos; extração de sub-componentes para arquivos maiores.
- **Type Safety**: Uso rigoroso de interfaces para garantir integridade dos dados entre Site e ERP.
- **Audit-First**: Toda alteração crítica no ERP deve gerar um log de auditoria via `createAuditLog`.

---

# 13. DEPENDÊNCIAS ENTRE MÓDULOS

O `SiteApp` depende de `firebaseService` para dados em tempo real.
O `AdminDashboard` depende de sub-componentes especializados na pasta `/Admin/`.
Ambos compartilham o `types.ts` e o `lib/firebase.ts`.

---

# 14. DIAGNÓSTICO FINAL

## Estado Atual
- Estrutura de roteamento robusta e isolada.
- ERP altamente funcional com módulos de gestão avançados.
- Site premium com fluxo de catálogo e checkout integrado.

## Pendências Identificadas
- Centralização de algumas lógicas de "kits" que ainda estão duplicadas entre módulos.
- Expansão da automação de baixa de estoque para todos os tipos de kits.
- Refinamento da exportação de relatórios PDF em alguns navegadores mobile.

---
**Documento gerado em: 2024-07-03**
