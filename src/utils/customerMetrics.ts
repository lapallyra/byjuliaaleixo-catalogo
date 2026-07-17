import { Customer, Order } from "../types";

export interface CustomerMetrics {
  ordersCount: number;
  ltv: number;
  avgTicket: number;
  lastPurchaseDate?: Date;
  daysSinceLastPurchase?: number;
  frequency: number;
  segment: 'Novo' | 'Recorrente' | 'VIP' | 'Inativo' | 'Orçamento';
}

export const calculateCustomerMetrics = (customer: Customer, customerOrders: Order[]): CustomerMetrics => {
  const orders = customerOrders;
  const ordersCount = orders.length;
  const ltv = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgTicket = ordersCount > 0 ? ltv / ordersCount : 0;
  
  let lastPurchaseDate: Date | undefined;
  if (orders.length > 0) {
    lastPurchaseDate = new Date(Math.max(...orders.map(o => new Date(o.createdAt).getTime())));
  }

  const daysSinceLastPurchase = lastPurchaseDate 
    ? Math.floor((new Date().getTime() - lastPurchaseDate.getTime()) / (1000 * 60 * 60 * 24))
    : undefined;

  const frequency = daysSinceLastPurchase && ordersCount > 1 
    ? Math.floor(daysSinceLastPurchase / ordersCount)
    : 0;

  let segment: CustomerMetrics['segment'] = 'Orçamento';
  if (ordersCount === 0) {
    segment = 'Orçamento';
  } else if (daysSinceLastPurchase !== undefined && daysSinceLastPurchase > 90) {
    segment = 'Inativo';
  } else if (ltv > 2000 || ordersCount > 10) {
    segment = 'VIP';
  } else if (ordersCount > 1) {
    segment = 'Recorrente';
  } else {
    segment = 'Novo';
  }

  return {
    ordersCount,
    ltv,
    avgTicket,
    lastPurchaseDate,
    daysSinceLastPurchase,
    frequency,
    segment
  };
};
