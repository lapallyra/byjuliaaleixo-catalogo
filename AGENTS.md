# Regras de Desenvolvimento do Ateliê

## Bloqueio de Estabilidade (Stability Lock)

- **HOME (EntryView.tsx)** e **CATALOGO (CatalogView.tsx)**: Estes componentes estão considerados ESTÁVEIS e BLOQUEADOS.
- **Regra**: Nenhuma alteração deve ser feita no código da Home ou do Catálogo ao trabalhar em outras áreas (especialmente no ADMIN), a menos que seja explicitamente solicitado para um desses componentes.
- **Isolamento**: O desenvolvimento do ADMIN deve ser estritamente contido em seus próprios componentes e serviços, sem efeitos colaterais na interface do usuário final (Home/Catálogo).

## Estrutura de Componentes

- **FeaturedProductCard.tsx**: Exclusivo para a Home (Vitrine de Destaques).
- **CatalogProductCard.tsx**: Exclusivo para o Catálogo.
- **Admin**: Todo o código administrativo reside em `src/components/Admin` e `AdminDashboard.tsx`.
