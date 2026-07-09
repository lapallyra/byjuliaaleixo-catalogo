# AUDITORIA TÉCNICA E UX DA VITRINE (STOREFRONT)

Este documento apresenta o diagnóstico completo da experiência do usuário (UX), consistência visual, usabilidade, acessibilidade e desempenho técnico da **Vitrine da Julia Aleixo**. 

Toda a análise foi conduzida sem alterações de código-fonte no sistema, servindo exclusivamente como **Roteiro e Relação de Oportunidades de Melhoria** para a próxima etapa de refinamento.

---

## 🛠️ RESUMO EXECUTIVO DO DIAGNÓSTICO

| Severidade | Quantidade | Impacto Primário | Foco de Ação |
| :--- | :---: | :--- | :--- |
| 🔴 **Crítico** | 2 | Quebra de fluxos de navegação e links âncoras órfãos. | Atualização do Header e Footer. |
| 🟡 **Alto** | 3 | Recargas de página desnecessárias (flicker) e uso de popups de sistema. | SPA Routing e Toast Notifications. |
| 🟢 **Médio** | 3 | Inconsistência estética e de componentes de cards de produto. | Alinhamento do Design System (Quiet Luxury). |
| 🔵 **Baixo** | 2 | Falta de tags de acessibilidade (ARIA) nos formulários de Checkout. | Acessibilidade & Semântica HTML. |

---

## 🔍 DETALHAMENTO DAS INCONSISTÊNCIAS IDENTIFICADAS

### 1. Navegação & Fluxos de Link (🔴 Gravidade: CRÍTICO)
*   **Inconsistência 1.1: Links Âncoras Quebrados na Barra de Navegação (Header)**
    *   **Arquivo:** `/src/components/EntryView.tsx` (Linha 308)
    *   **Impacto:** O link `"campanhas"` na barra de navegação superior tenta rolar até `#campanhas`. Como a seção de campanhas foi removida por diretiva de arquitetura ERP-116, clicar no link não gera ação (no-op), frustrando o usuário.
    *   **Recomendação Futura:** Remover o item `"campanhas"` do array ou menu de navegação da barra de cabeçalho.
*   **Inconsistência 1.2: Link Quebrado no Rodapé (Footer)**
    *   **Arquivo:** `/src/components/Footer.tsx` (Linha 47)
    *   **Impacto:** O link do rodapé `"Produtos"` direciona o usuário para `/#produtos`. Como a seção de grade geral de produtos foi removida para dar lugar exclusivamente aos Kits Prontos e Monte seu Kit, esse link âncora agora está quebrado.
    *   **Recomendação Futura:** Remover ou redirecionar o link do rodapé para a página exclusiva `/vitrine` ou `/colecoes`.

---

### 2. Transições e SPA Routing (🟡 Gravidade: ALTO)
*   **Inconsistência 2.1: Recarga Total de Página na Busca de Documentos**
    *   **Arquivo:** `/src/components/DocumentSearch.tsx` (Linhas 34, 42)
    *   **Impacto:** Ao localizar com sucesso um pedido ou lista de presentes, o componente executa redirecionamento através de `window.location.href`. Isso anula o roteamento do React Router, forçando uma recarga completa (flicker visual de tela branca) e destruindo qualquer estado temporário em cache de memória do SPA.
    *   **Recomendação Futura:** Substituir `window.location.href = ...` pela chamada nativa do hook `navigate(...)` do `react-router-dom`.

---

### 3. Usabilidade e Feedback de Ações (🟡 Gravidade: ALTO)
*   **Inconsistência 3.1: Alertas Nativos de Navegador (Alert Popups)**
    *   **Arquivos:** `/src/components/KitsView.tsx` (Linha 42) e `/src/components/KitConstructor.tsx` (Linha 78)
    *   **Impacto:** Quando o usuário clica em adicionar um kit pronto ou personalizado ao carrinho, o sistema dispara a função nativa `alert(...)` do navegador. Isso quebra drasticamente a estética elegante e imersiva do design *Quiet Luxury*, além de bloquear temporariamente o fluxo do usuário na tela.
    *   **Recomendação Futura:** Substituir por um componente personalizado de feedback rápido (Custom Toast Notification / Modal Flutuante com micro-animação).

---

### 4. Consistência Visual do Design System (🟢 Gravidade: MÉDIO)
*   **Inconsistência 4.1: Coexistência de Cards de Produto Dispares**
    *   **Arquivos:** `/src/components/ui/ProductCard.tsx` e `/src/components/Catalog/FeaturedProductCard.tsx`
    *   **Impacto:** O sistema carrega dois designs de cards de produto totalmente distintos:
        *   `ProductCard` (Horizontal): visualização dividida de 50% foto e 50% conteúdo, com barra inferior grossa na cor café escuro (`#3A312D`) e tipografia bold em ouro.
        *   `FeaturedProductCard` (Vertical): cantos mais suaves, tipografia clássica Playfair, espaçamento editorial clássico.
        *   Essa mistura de estilos e layouts na mesma aplicação quebra a harmonia visual da vitrine.
    *   **Recomendação Futura:** Padronizar as grades de produtos sob um único modelo visual ou definir papéis estritamente diferentes e complementares para cada um.
*   **Inconsistência 4.2: Cores Semânticas de Alerta Genéricas**
    *   **Arquivos:** `/src/components/ui/ProductCard.tsx` (e layouts compartilhados)
    *   **Impacto:** Uso de cores padrões do Tailwind (como `text-green-500` para sucesso e `text-rose-500` para favoritos) em botões de ação rápida. Essas cores altamente saturadas entram em conflito direto com as paletas pastéis e elegantes (tons de areia, bege, ouro e marrom sutil) do conceito *Quiet Luxury*.
    *   **Recomendação Futura:** Suavizar as tonalidades de feedback usando variações elegantes de verde sálvia, rosa seco e dourados amenos.

---

### 5. Estrutura de Interação do "Monte seu Kit" (🟢 Gravidade: MÉDIO)
*   **Inconsistência 5.1: Accordion de Categorias Simplificado**
    *   **Arquivo:** `/src/components/KitConstructor.tsx` (Linha 117)
    *   **Impacto:** Os botões de expansão de categorias utilizam caracteres de texto cru (`+` e `−`) para indicar estado. Isso reduz o refinamento visual da interface.
    *   **Recomendação Futura:** Substituir os caracteres de texto simples por ícones animados (como o `ChevronDown` do `lucide-react`) controlados via `motion` do Framer Motion para uma transição suave.

---

### 6. Acessibilidade & Semântica HTML (🔵 Gravidade: BAIXO)
*   **Inconsistência 6.1: Ausência de Identificadores de Acessibilidade em Formulários**
    *   **Arquivo:** `/src/components/Checkout/ClientCheckout.tsx` (Linhas 81 a 85)
    *   **Impacto:** Elementos de `<input>` de dados do cliente estão dispostos apenas com propriedades `placeholder` visuais, sem elementos `<label>` semânticos ou atributos `aria-label`. Isso dificulta a navegação de leitores de tela e prejudica o preenchimento automático em navegadores modernos.
    *   **Recomendação Futura:** Adicionar `<label>` visuais em tamanho pequeno ou, no mínimo, mapear atributos `aria-label` adequados para garantir total conformidade WCAG/Acessibilidade.

---

## 📈 SÍNTESE DO PLANO DE REFINAMENTO (ETAPA SEGUINTE)

1.  **Fase 1 (Navegação):** Ajustar menus do Header e Footer, eliminando as âncoras não funcionais e limpando o fluxo de links.
2.  **Fase 2 (Navegação SPA):** Refatorar o roteamento da busca rápida para usar `navigate` nativo do React Router.
3.  **Fase 3 (Visual e Imersão):** Remover popups de alertas do sistema, implementando uma barra de feedback ou toast minimalista de luxo.
4.  **Fase 4 (Acessibilidade & Semântica):** Injetar labels e atributos de acessibilidade nos formulários de entrada de dados de entrega e busca.
