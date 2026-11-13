# Regras de Desenvolvimento do Projeto

## Layout & Margens
- **Margem Lateral Mínima (REGRA OBRIGATÓRIA)**: Sempre que criar ou modificar uma página, a margem lateral (paddings/margins horizontais esquerdo e direito) deve ser **mínima** (`px-2` ou `px-3`), usando largura total (`w-full`, sem `max-w-3xl`/`max-w-5xl` restritivos em blocos principais) para aproveitar toda a largura da tela sem lacunas em branco nas laterais.

## Tipografia & Títulos
- **REGRA #1 — Títulos em Linha Única (OBRIGATÓRIA)**: Todos os títulos (`<h1>`, `<h2>` e cabeçalhos de destaque) devem ser exibidos em **apenas 1 linha**, sem quebras de linha. Utilize sempre `whitespace-nowrap` combinado com escala responsiva (`text-[clamp(...)]`) e container com largura adequada para evitar quebra ou corte de texto em qualquer tamanho de tela.

## Identidade Visual & Cores
- **REGRA #2 — Cores da Página Principal (OBRIGATÓRIA)**: Toda nova página ou seção criada (e páginas secundárias atualizadas) deve acompanhar rigorosamente a paleta oficial da página principal:
  - Fundo principal: `#FAF8F5` (variações suaves em `#F3ECDF` / `#FCF9F3`)
  - Cor primária da marca (títulos e ações principais): `#0F2C59` (Azul Royal Profundo)
  - Destaque e detalhes: `#D4AF37` (Dourado Nobre; acentos de texto dourado `#A88334`)
  - Texto base: `#1B2537`

