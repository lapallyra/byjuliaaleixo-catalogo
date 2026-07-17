import { Customer, Order } from '../types';

/**
 * Normalizes a phone number by removing non-numeric characters.
 */
export const normalizePhone = (phone?: string): string => {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
};

/**
 * Resolves the customer for a given order using customerId or legacy fields.
 * This is the central source of truth for linking orders to customers.
 */
export const resolveOrderCustomer = (order: Order, customers: Customer[]): Customer | undefined => {
  // 1. Direct match by customerId
  if (order.customerId) {
    const matched = customers.find(c => c.id === order.customerId);
    if (matched) return matched;
  }

  // 2. Fallback to legacy fields
  const orderEmail = order.customerEmail?.toLowerCase().trim();
  const orderCpf = normalizePhone(order.customerCpfCnpj);
  const orderPhone = normalizePhone(order.contact);
  const orderName = order.customerName?.toLowerCase().trim();

  return customers.find(c => {
    const custEmail = c.email?.toLowerCase().trim();
    const custCpf = normalizePhone(c.cpfCnpj);
    const custPhone = normalizePhone(c.contact);
    const custName = c.name?.toLowerCase().trim();

    return (custEmail && orderEmail === custEmail) ||
           (custCpf && orderCpf === custCpf) ||
           (custPhone && orderPhone === custPhone) ||
           (custName && orderName === custName);
  });
};

/**
 * Checks if an order matches a specific customer.
 */
export const isOrderFromCustomer = (order: Order, customer: Customer): boolean => {
  if (order.customerId === customer.id) return true;

  const orderEmail = order.customerEmail?.toLowerCase().trim();
  const orderCpf = normalizePhone(order.customerCpfCnpj);
  const orderPhone = normalizePhone(order.contact);
  const orderName = order.customerName?.toLowerCase().trim();

  const custEmail = customer.email?.toLowerCase().trim();
  const custCpf = normalizePhone(customer.cpfCnpj);
  const custPhone = normalizePhone(customer.contact);
  const custName = customer.name?.toLowerCase().trim();

  return (custEmail && orderEmail === custEmail) ||
         (custCpf && orderCpf === custCpf) ||
         (custPhone && orderPhone === custPhone) ||
         (custName && orderName === custName);
};
