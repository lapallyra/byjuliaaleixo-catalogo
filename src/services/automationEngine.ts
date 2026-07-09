import { eventBus } from './eventBus';
import { createAuditLog } from './auditService';
import { updateOrderStatus } from './firebaseService';
import { Order, Product, Customer } from '../types';

/**
 * ERP-070: Motor de Automação Inteligente (Automation Rule Engine)
 * This service handles IF/THEN business logic based on ERP events.
 */
class AutomationEngine {
  private initialized = false;
  private processedOrders = new Set<string>();

  init() {
    if (this.initialized) return;
    this.initialized = true;

    console.log('%c[AutomationEngine] Smart Rule Engine Booted.', 'color: #007AFF; font-weight: bold;');

    // RULE 1: IF ORDER_CREATED -> THEN Create Log & Console Trace
    eventBus.on('ORDER_CREATED', ({ order }: { order: Order }) => {
      console.log(`[Automation] Rule Triggered: ORDER_CREATED for ${order.code}`);
      
      createAuditLog(
        'Pedidos',
        'Criação',
        order.id || order.code || 'S/N',
        `Pedido ${order.code || 'Recém-criado'}`,
        { 
          newData: order, 
          details: 'Automação: Registro de auditoria gerado automaticamente via Motor de Regras ERP-070.' 
        },
        order.companyId
      );
    });

    // RULE 2: IF ORDER_PAID -> THEN Update Status + Log
    // This handles transitions from 'waiting_payment' or 'novo pedido' to 'paid'
    eventBus.on('ORDER_PAID', async ({ order }: { order: Order }) => {
      if (!order.id) return;
      
      console.log(`[Automation] Rule Triggered: ORDER_PAID for ${order.code}`);

      // Avoid double processing in same session
      const processKey = `${order.id}-paid`;
      if (this.processedOrders.has(processKey)) return;
      this.processedOrders.add(processKey);

      try {
        // If status isn't already paid or higher, advance it
        if (!['paid', 'fully_paid', 'production', 'ready', 'delivered'].includes(order.status || '')) {
          await updateOrderStatus(order.id, 'paid');
          
          createAuditLog(
            'Pedidos',
            'Atualização',
            order.id,
            `Pedido ${order.code || order.id}`,
            { 
              details: 'Automação: Status avançado para PAGO automaticamente após confirmação de pagamento (Regra ERP-070).' 
            },
            order.companyId
          );
        }
      } catch (err) {
        console.error('[Automation] Failed to execute ORDER_PAID rule:', err);
      }
    });

    // RULE 3: IF STOCK_LOW -> THEN Log Warning Audit
    eventBus.on('STOCK_LOW', ({ product, currentStock }: { product: Product; currentStock: number }) => {
      console.log(`[Automation] Rule Triggered: STOCK_LOW for ${product.product_name}`);

      createAuditLog(
        'Estoque',
        'Alerta',
        product.id || 'S/N',
        `Produto ${product.product_name}`,
        { 
          details: `Automação: Alerta de estoque crítico detectado. Apenas ${currentStock} unidades restantes (Regra ERP-070).` 
        },
        product.company || 'pallyra'
      );
    });

    // RULE 4: IF CLIENT_CREATED -> THEN Register in History Audit
    eventBus.on('CLIENT_CREATED', ({ customer }: { customer: Customer }) => {
      console.log(`[Automation] Rule Triggered: CLIENT_CREATED for ${customer.name}`);

      createAuditLog(
        'Clientes',
        'Criação',
        customer.id || 'S/N',
        `Cliente ${customer.name}`,
        { 
          newData: customer, 
          details: 'Automação: Novo cliente detectado e registrado no histórico de auditoria (Regra ERP-070).' 
        },
        customer.companyId
      );
    });

    // RULE 5: IF ORDER_CANCELLED -> THEN Log for Analytics
    eventBus.on('ORDER_CANCELLED', ({ order }: { order: Order }) => {
      console.log(`[Automation] Rule Triggered: ORDER_CANCELLED for ${order.code}`);

      createAuditLog(
        'Pedidos',
        'Cancelamento',
        order.id || order.code || 'S/N',
        `Pedido ${order.code || 'S/N'}`,
        { 
          details: 'Automação: Cancelamento de pedido registrado no feed de auditoria (Regra ERP-070).' 
        },
        order.companyId
      );
    });
  }
}

export const automationEngine = new AutomationEngine();
