import { Order, Product, ProductionBatch, Componente } from '../types';

export const suggestBatches = (orders: Order[], products: Product[]): Partial<ProductionBatch>[] => {
  const suggestions: Partial<ProductionBatch>[] = [];
  
  // Only consider orders waiting for production or in early production stages
  const eligibleOrders = orders.filter(o => 
    ['novo pedido', 'pending', 'waiting_production', 'production', 'assembly'].includes(o.status) && !o.batchId
  );

  // Group by Product Name (simplest grouping)
  const groupedByProduct: Record<string, Order[]> = {};
  eligibleOrders.forEach(order => {
    order.items.forEach(item => {
      const productName = item.product_name;
      if (!groupedByProduct[productName]) {
        groupedByProduct[productName] = [];
      }
      if (!groupedByProduct[productName].some(o => o.id === order.id)) {
        groupedByProduct[productName].push(order);
      }
    });
  });

  Object.entries(groupedByProduct).forEach(([productName, productOrders]) => {
    if (productOrders.length >= 2) {
      const product = products.find(p => p.product_name === productName);
      const totalQty = productOrders.reduce((sum, o) => {
        const item = o.items.find(i => i.product_name === productName);
        return sum + (item?.quantity || 0);
      }, 0);

      suggestions.push({
        code: `AUTO-${productName.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
        productNames: [productName],
        productIds: product ? [product.id] : [],
        orderIds: productOrders.map(o => o.id),
        totalQuantity: totalQty,
        estimatedProductionTime: Math.round((product?.productionTime || 30) * totalQty * 0.8), // 20% efficiency gain
        status: 'aberto'
      });
    }
  });

  return suggestions;
};

export const consolidateBatchInsumos = (batchOrders: Order[], products: Product[], insumos: Componente[]) => {
  const consolidated: Record<string, { insumoId: string, quantity: number, name: string, unit: string }> = {};

  batchOrders.forEach(order => {
    order.items.forEach(item => {
      const product = products.find(p => p.id === (item.productId || item.id));
      if (product?.insumos) {
        product.insumos.forEach(pInsumo => {
          const insumo = insumos.find(i => i.id === pInsumo.insumoId);
          if (insumo) {
            const totalNeeded = pInsumo.quantity * item.quantity;
            if (consolidated[insumo.id]) {
              consolidated[insumo.id].quantity += totalNeeded;
            } else {
              consolidated[insumo.id] = {
                insumoId: insumo.id,
                quantity: totalNeeded,
                name: insumo.name,
                unit: insumo.unit
              };
            }
          }
        });
      }
    });
  });

  return Object.values(consolidated);
};
