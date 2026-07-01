import { Order } from "../types";
import { differenceInHours, differenceInDays } from "date-fns";

export type IntelligentPriority = 'URGENTE' | 'ALTA' | 'NORMAL' | 'BAIXA';

export interface PriorityResult {
  priority: IntelligentPriority;
  score: number;
  remainingTime: string;
  isDelayed: boolean;
}

export const calculateOrderPriority = (order: Order): PriorityResult => {
  const now = new Date();
  const deliveryDateStr = order.deliveryDate ? (order.deliveryDate.includes('T') ? order.deliveryDate : order.deliveryDate + "T23:59:59") : null;
  const deliveryDate = deliveryDateStr ? new Date(deliveryDateStr) : null;
  const createdAt = order.createdAt?.toDate ? order.createdAt.toDate() : (order.createdAt ? new Date(order.createdAt) : now);
  
  let score = 0;
  let priority: IntelligentPriority = 'NORMAL';
  let isDelayed = false;

  // 1. Time logic
  if (deliveryDate) {
    const diffHours = differenceInHours(deliveryDate, now);
    const diffDays = differenceInDays(deliveryDate, now);

    if (diffHours < 0) {
      priority = 'URGENTE';
      score += 2000; // Delayed is absolute top priority
      isDelayed = true;
    } else if (diffHours <= 24) {
      priority = 'URGENTE';
      score += 1000;
    } else if (diffDays <= 3) {
      priority = 'ALTA';
      score += 500;
    } else if (diffDays > 10) {
      priority = 'BAIXA';
      score -= 200;
    }
  }

  // 2. Financial impact (Order Value)
  // Assuming 500+ is high value for this context, but we can scale it
  if (order.total > 1000) {
    score += 100;
    if (priority === 'NORMAL' && ['production', 'assembly'].includes(order.status)) {
        priority = 'ALTA';
    }
  } else if (order.total < 100 && priority === 'BAIXA') {
    score -= 50;
  }

  // 3. Status logic
  if (order.status === 'production' || order.status === 'assembly') {
    score += 100; // Already in progress, keep moving
  } else if (order.status === 'waiting_production' || order.status === 'pending') {
    score += 50; // Needs to start
  }

  // 4. Manual override (if any)
  if (order.productionPriority === 'urgente') {
    priority = 'URGENTE';
    score += 1500;
  } else if (order.productionPriority === 'alta') {
    if (priority !== 'URGENTE') priority = 'ALTA';
    score += 700;
  }

  // 5. Queue age (Time since creation)
  const hoursSinceCreation = differenceInHours(now, createdAt);
  score += hoursSinceCreation * 0.5; // Every hour adds 0.5 points to ensure older orders don't rot

  // Formatting remaining time
  let remainingTime = "Sem prazo";
  if (deliveryDate) {
    const diffHours = differenceInHours(deliveryDate, now);
    if (diffHours < 0) {
      const absHours = Math.abs(diffHours);
      if (absHours < 24) remainingTime = `Atrasado ${absHours}h`;
      else remainingTime = `Atrasado ${Math.floor(absHours / 24)}d`;
    } else if (diffHours < 24) {
      remainingTime = `${diffHours}h rest.`;
    } else {
      remainingTime = `${Math.floor(diffHours / 24)}d rest.`;
    }
  }

  return { priority, score, remainingTime, isDelayed };
};

export const getPriorityStyles = (priority: IntelligentPriority) => {
  switch (priority) {
    case 'URGENTE':
      return {
        bg: 'bg-rose-100',
        text: 'text-rose-700',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        iconColor: 'text-rose-600'
      };
    case 'ALTA':
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-200',
        dot: 'bg-orange-500',
        iconColor: 'text-orange-600'
      };
    case 'NORMAL':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        iconColor: 'text-blue-600'
      };
    case 'BAIXA':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-600',
        border: 'border-slate-200',
        dot: 'bg-slate-400',
        iconColor: 'text-slate-500'
      };
    default:
      return {
        bg: 'bg-slate-50',
        text: 'text-slate-500',
        border: 'border-slate-100',
        dot: 'bg-slate-300',
        iconColor: 'text-slate-400'
      };
  }
};
