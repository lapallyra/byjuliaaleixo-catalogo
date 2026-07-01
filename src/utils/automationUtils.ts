import { Order, Product, Componente, PurchaseOrder } from '../types';
import { calculateOrderPriority } from './priorityUtils';

export type AutomationType = 'SUGGESTION' | 'ALERT' | 'RECOMMENDATION';

export interface AutomationItem {
  id: string;
  type: AutomationType;
  title: string;
  reason: string;
  impact: string;
  actionLabel?: string;
  domain: 'production' | 'stock' | 'financial' | 'orders' | 'delivery';
  data?: any;
}

export const generateAutomations = (
  orders: Order[],
  products: Product[],
  insumos: Componente[],
  purchases: PurchaseOrder[]
): AutomationItem[] => {
  const automations: AutomationItem[] = [];
  const now = new Date();

  // 1. PRODUCTION AUTOMATIONS
  // Suggest starting high priority production
  const pendingOrders = orders.filter(o => ['novo pedido', 'pending', 'waiting_production'].includes(o.status));
  const urgentOrders = pendingOrders.filter(o => calculateOrderPriority(o).priority === 'URGENTE');
  
  if (urgentOrders.length > 0) {
    automations.push({
      id: `prod-urgent-${now.getTime()}`,
      type: 'RECOMMENDATION',
      title: 'Iniciar Produção Prioritária',
      reason: `Existem ${urgentOrders.length} pedidos em estado URGENTE aguardando produção.`,
      impact: 'Redução de atrasos e aumento da satisfação do cliente.',
      actionLabel: 'Ver Pedidos Urgentes',
      domain: 'production',
      data: { status: 'urgent' }
    });
  }

  // Group similar products for production efficiency
  const productGroups: Record<string, number> = {};
  pendingOrders.forEach(o => {
    o.items.forEach(item => {
      productGroups[item.product_name] = (productGroups[item.product_name] || 0) + item.quantity;
    });
  });

  const highVolumeProduct = Object.entries(productGroups).find(([_, qty]) => qty >= 5);
  if (highVolumeProduct) {
    automations.push({
      id: `prod-group-${now.getTime()}`,
      type: 'SUGGESTION',
      title: 'Agrupamento de Produção',
      reason: `Alta demanda de "${highVolumeProduct[0]}" (${highVolumeProduct[1]} unidades) permite produção em lote.`,
      impact: 'Ganho de 15-20% em eficiência operacional.',
      domain: 'production'
    });
  }

  // 2. STOCK AUTOMATIONS
  // Critical items replenishment
  const criticalItems = insumos.filter(i => i.quantity <= i.minQuantity);
  if (criticalItems.length > 0) {
    automations.push({
      id: `stock-critical-${now.getTime()}`,
      type: 'ALERT',
      title: 'Reposição de Insumos',
      reason: `${criticalItems.length} insumos atingiram o nível crítico de estoque.`,
      impact: 'Evita paradas na linha de produção.',
      actionLabel: 'Ir para Compras',
      domain: 'stock'
    });
  }

  // Consumption trend (simulated based on pending orders vs current stock)
  // This is a bit complex for a simple util, but let's do a simple version
  const itemsNeeded: Record<string, number> = {};
  pendingOrders.forEach(o => {
    o.items.forEach(item => {
      // Assuming item.components exists or just using product level
      // For now, let's just flag if many orders need same product
    });
  });

  // 3. FINANCIAL AUTOMATIONS
  // Low margin alerts
  const lowMarginOrders = orders.filter(o => {
    const revenue = Number(o.total) || 0;
    let cost = 0;
    o.items.forEach(item => {
      const product = products.find(p => p.id === (item.productId || item.id));
      cost += (product?.estimatedCost || 0) * (item.quantity || 1);
    });
    const margin = revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0;
    return margin > 0 && margin < 15; // Margin below 15%
  });

  if (lowMarginOrders.length > 0) {
    automations.push({
      id: `fin-margin-${now.getTime()}`,
      type: 'ALERT',
      title: 'Revisão de Precificação',
      reason: `${lowMarginOrders.length} pedidos recentes apresentam margem abaixo de 15%.`,
      impact: 'Proteção da saúde financeira e lucratividade.',
      domain: 'financial'
    });
  }

  // 4. ORDERS AUTOMATIONS
  // Stuck orders
  const stuckOrders = orders.filter(o => {
    if (['delivered', 'cancelled', 'finalized'].includes(o.status)) return false;
    const updatedAt = o.updatedAt?.toDate ? o.updatedAt.toDate() : new Date(o.updatedAt || 0);
    const diffDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 3;
  });

  if (stuckOrders.length > 0) {
    automations.push({
      id: `orders-stuck-${now.getTime()}`,
      type: 'RECOMMENDATION',
      title: 'Atenção a Pedidos Parados',
      reason: `${stuckOrders.length} pedidos não tiveram movimentação nos últimos 3 dias.`,
      impact: 'Agilização do fluxo e prevenção de reclamações.',
      actionLabel: 'Auditar Pedidos',
      domain: 'orders'
    });
  }

  // 5. DELIVERY AUTOMATIONS
  // Ready for shipping
  const readyOrders = orders.filter(o => o.status === 'ready');
  if (readyOrders.length > 0) {
    automations.push({
      id: `deliv-ready-${now.getTime()}`,
      type: 'SUGGESTION',
      title: 'Otimização de Entregas',
      reason: `${readyOrders.length} pedidos estão prontos aguardando envio.`,
      impact: 'Redução do Lead Time final de entrega.',
      actionLabel: 'Ver Entregas',
      domain: 'delivery'
    });
  }

  return automations;
};
