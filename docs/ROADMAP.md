# ROADMAP.md - Planejamento e Status do Projeto

Este documento detalha o estado atual da plataforma, os módulos implementados e o planejamento de evolução técnica.

---

# 1. OBJETIVO DO PROJETO
Desenvolver uma plataforma robusta e integrada para o ecossistema de ateliês, composta por:
- **ERP Administrativo**: Gestão centralizada de produção, estoque, financeiro e operações.
- **Site (Vitrine)**: Interface premium para experiência do cliente e conversão de vendas.

Ambos os sistemas compartilham a mesma arquitetura de dados via Firebase, garantindo sincronização em tempo real entre a venda no site e a operação no ERP.

---

# 2. STATUS GERAL
- ✅ **Concluído**: Estrutura base, roteamento, integração Firebase, core de vendas e core de gestão.
- 🚧 **Em desenvolvimento**: Refinamentos estéticos Soft Neumorphism e automação avançada de insumos.
- 🧪 **Em validação**: Módulo de auditoria de custos e simulador de margem.
- 📅 **Planejado**: Integração profunda com APIs de logística externa e inteligência de estoque preditiva.

---

# 3. ERP (Módulos Administrativos)
| Módulo | Status | Conclusão | Observações |
| :--- | :--- | :--- | :--- |
| **Dashboard** | ✅ Concluído | 100% | Visão geral e KPIs principais ativos. |
| **Pedidos** | ✅ Concluído | 100% | Fluxo completo de aprovação e gestão. |
| **Clientes** | ✅ Concluído | 100% | CRM base e histórico de compras. |
| **Produtos** | ✅ Concluído | 100% | Cadastro técnico e precificação. |
| **Estoque/Insumos** | 🚧 Em andamento | 90% | Baixa automática de itens simples ok; kits em refino. |
| **Produção** | ✅ Concluído | 100% | Control Center e fluxo de ordens de produção. |
| **Financeiro** | ✅ Concluído | 95% | Fluxo de caixa e DRE operacional ativos. |
| **Marketing** | ✅ Concluído | 100% | Campanhas, coleções e cupons funcionais. |
| **Auditoria** | 🧪 Em validação | 85% | Registro de logs ok; análise de custos em teste. |
| **Configurações** | ✅ Concluído | 100% | Gestão de branding e tokens de integração. |

---

# 4. SITE (Páginas Públicas)
| Página | Status | Conclusão | Observações |
| :--- | :--- | :--- | :--- |
| **Home (Entry)** | ✅ Concluído | 100% | Transição de marcas e entrada premium. |
| **Catálogo Principal**| ✅ Concluído | 100% | Filtros, busca e visualização premium. |
| **Checkout** | ✅ Concluído | 100% | Fluxo multi-etapa com pagamentos integrados. |
| **Lista de Presentes**| ✅ Concluído | 100% | Reserva, compra e mensagens do anfitrião. |
| **Monte seu Kit** | ✅ Concluído | 100% | Construtor interativo de presentes. |
| **Kits Prontos** | ✅ Concluído | 100% | Vitrine de combinações exclusivas. |
| **Acompanhamento** | ✅ Concluído | 100% | Status de pedido em tempo real para o cliente. |

---

# 5. FUNCIONALIDADES

### ✅ IMPLEMENTADAS
- Sincronização em tempo real (snapshots) ERP/Site.
- Notificações automatizadas via Telegram (Bot).
- Design System duplo (ERP: Clean Glass / Site: Neumorphism).
- Sistema de auditoria de alterações (Audit Logs).
- Gestão de kits dinâmicos e estáticos.

### 🧪 EM VALIDAÇÃO
- Algoritmo de cálculo de eficiência operacional.
- Auditoria técnica de custos por insumo.
- Fluxo de "Pagamento Planejado" no checkout.

### 📅 PLANEJADAS
- Dashboard de Business Intelligence avançado.
- Sistema de pontuação/fidelidade para clientes.
- Integração direta com gateways de frete dinâmico.

---

# 6. MELHORIAS FUTURAS (Backlog Técnico)
- **Refatoração de Kits**: Centralizar lógica de baixa de estoque de kits personalizados no service.
- **Performance**: Implementação de lazy loading agressivo em módulos pesados do ERP.
- **UX**: Padronização final de microanimações (180ms-220ms) em todo o site.

---

# 7. PENDÊNCIAS REAIS
- Revisão da exportação de etiquetas de envio em PDF em dispositivos iOS.
- Ajuste fino na responsividade da tabela de auditoria em resoluções de tablet.

---

# 8. HISTÓRICO DE ETAPAS
- **Fase 1**: Fundação (Firebase + Auth + Estrutura Base).
- **Fase 2**: Core Operacional (Pedidos + Produtos + Dashboard).
- **Fase 3**: Experiência do Cliente (Catálogos + Checkout + Kits).
- **Fase 4**: Especialização (Lista de Presentes + Produção + Auditoria).
- **Fase 5 (Atual)**: Refinamento Premium e Consolidação de Dados.

---

# 9. PRÓXIMOS PASSOS
1. Finalização da validação do módulo de Auditoria de Custos.
2. Homologação final do fluxo de baixa de insumos para Kits Personalizados.
3. Padronização estética final do Site sob o padrão **Soft Neumorphism Premium**.

---

# 10. CHECKLIST GERAL
- [✅] Estrutura de Rotas ERP/Site
- [✅] Autenticação Administrativa
- [✅] Gestão de Pedidos e Fluxo de Produção
- [✅] Gestão de Insumos e Materiais
- [✅] Catálogo Premium de Vendas
- [✅] Sistema de Checkout Integrado
- [✅] Lista de Presentes Premium
- [✅] Módulo de Kits (Prontos e Personalizados)
- [🚧] Auditoria Técnica de Custos (Em validação)
- [✅] Notificações via Telegram
- [✅] Trilha de Auditoria (Logs)
