# Diretrizes Oficiais do Projeto

## Filosofia do Projeto
Este projeto não é um software genérico. Ele foi desenvolvido exclusivamente para atender às necessidades do ecossistema dos ateliês.
- **Evolução Contínua**: Sempre evoluir a arquitetura existente. Nunca reinventar funcionalidades, criar módulos paralelos, páginas duplicadas, collections duplicadas ou services duplicados.
- **Reutilização**: Sempre procurar primeiro por componentes, páginas, services e fluxos já existentes antes de implementar qualquer nova funcionalidade.

## Metodologia de Desenvolvimento
Toda nova funcionalidade deve seguir obrigatoriamente esta sequência:
1. Diagnóstico técnico
2. Implementação
3. Refinamento
4. Homologação
5. Próxima etapa

## Design Systems Oficiais

### 1. ERP (Área Administrativa)
- **Padrão**: Clean Glass 3D
- **Contexto**: Dashboard, Pedidos, Clientes, Produtos, Estoque, Produção, Compras, Financeiro, Marketing, Auditoria, Configurações.
- **Características**: 
  - Interface voltada para produtividade.
  - Glassmorphism discreto e cards volumétricos.
  - Blur apenas externo aos cards e botões volumétricos.
  - Visual técnico, limpo e profissional.
- **Regra**: Nunca utilizá-lo nas páginas públicas.

### 2. Site (Home, Catálogos e Páginas Públicas)
- **Padrão**: Soft Neumorphism Premium
- **Contexto**: Todas as páginas acessíveis ao público final.
- **Características**:
  - Aparência acolhedora e luxo acessível.
  - Sombras suaves e botões macios com bordas arredondadas.
  - Layout leve, elegante e responsivo.
  - **Cores**: Tons de Creme, Bege e Marrom.
  - **Identidade**: Cada ateliê aplica automaticamente sua identidade visual através dos tokens de tema existentes. Nunca fixar cores diretamente nos componentes.

## Hierarquia de Prioridades
Toda decisão deve respeitar esta ordem:
1. **Funcionalidade**
2. **Conversão (Vendas)**
3. **UX (Experiência do Usuário)**
4. **Performance**
5. **Estética**

*A estética nunca poderá prejudicar a facilidade de compra. O objetivo principal do site é vender e o do ERP é produtividade.*

## Regras de Implementação
Antes de criar qualquer funcionalidade, verificar:
- Já existe algo semelhante?
- Existe alguma página, componente, service ou collection que possa ser reutilizada?
- Existe alguma regra de negócio já implementada?
**Evitar duplicidades a todo custo.**

## Padrão dos Prompts
- Interpretar prompts considerando todo o contexto acumulado.
- Evoluir sobre a arquitetura existente, nunca substituir funcionalidades sem motivo.
- Informar conflitos com implementações anteriores antes de agir.

## Objetivo Final
Construir uma plataforma única, consistente, escalável e organizada, sem versões paralelas ou perda de identidade visual/arquitetônica.
