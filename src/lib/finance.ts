import { Product, Componente } from "../types";

export const calculateProductCost = (product: Product, componentes: Componente[]) => {
  if (!product.insumos) return 0;
  return product.insumos.reduce((acc, item) => {
    const comp = componentes.find(c => c.id === item.insumoId);
    return acc + ((comp?.unitCost || 0) * item.quantity);
  }, 0);
};

export const calculateSuggestedPrice = (cost: number, multiplier = 2.0) => {
  return cost * multiplier;
};
