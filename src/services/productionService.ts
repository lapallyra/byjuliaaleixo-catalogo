import { doc, runTransaction, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Product, Componente, ComponenteMovement } from "../types";

export const startProductProduction = async (
  orderId: string,
  product: Product,
  userId: string
) => {
  const recipe = product.insumos || [];
  if (recipe.length === 0) return { success: true, warnings: [] };

  const warnings: string[] = [];

  await runTransaction(db, async (transaction) => {
    // 1. Check availability
    const componentRefs = recipe.map((r) => doc(db, "componentes", r.insumoId));
    const componentDocs = await Promise.all(componentRefs.map((ref) => transaction.get(ref)));

    const components = componentDocs.map((doc) => ({
      ...doc.data() as Componente,
      id: doc.id
    }));

    recipe.forEach((item) => {
      const comp = components.find((c) => c.id === item.insumoId);
      if (comp && comp.quantity < item.quantity) {
        warnings.push(`⚠ Estoque insuficiente para: ${comp.name}. Disponível: ${comp.quantity}, Necessário: ${item.quantity}`);
      }
    });

    // 2. Deduct stock and log movement
    for (const item of recipe) {
      const comp = components.find((c) => c.id === item.insumoId);
      if (comp) {
        const newQty = comp.quantity - item.quantity;
        
        // Update Component
        transaction.update(doc(db, "componentes", comp.id), {
          quantity: newQty,
          updatedAt: serverTimestamp()
        });

        // Log Movement
        const movementRef = doc(collection(db, "componente_movements"));
        transaction.set(movementRef, {
          componenteId: comp.id,
          date: serverTimestamp(),
          type: 'saida',
          quantity: item.quantity,
          previousQuantity: comp.quantity,
          newQuantity: newQty,
          origin: `Pedido ${orderId} - Produto ${product.product_name}`,
          userId: userId
        } as ComponenteMovement);
      }
    }
  });

  return { success: true, warnings };
};
