import { getDoc, doc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';

export const validateProductStock = async (product: Product, requestedQuantity: number = 1): Promise<{ valid: boolean; reason?: string }> => {
  // 1. Normal Product Stock
  if (!product.isKit) {
    if (typeof product.stock === 'number') {
      if (product.stock < requestedQuantity) {
        return { valid: false, reason: `Estoque insuficiente para ${product.product_name} (Disponível: ${product.stock})` };
      }
    }
    // Also check its insumos
    if (product.insumos && product.insumos.length > 0) {
      for (const req of product.insumos) {
         const insumoRef = doc(db, 'insumos', req.insumoId);
         const insumoSnap = await getDoc(insumoRef);
         if (insumoSnap.exists()) {
            const currentQty = insumoSnap.data().quantity || 0;
            const requiredQty = req.quantity * requestedQuantity;
            if (currentQty < requiredQty) {
              return { valid: false, reason: `Insumo insuficiente: ${insumoSnap.data()?.name}` };
            }
         }
      }
    }
    return { valid: true };
  }

  // 2. Kit Stock
  if (product.isKit && product.kitItems && product.kitItems.length > 0) {
    for (const ki of product.kitItems) {
      const requiredQty = ki.quantity * requestedQuantity;
      if (ki.type === 'product') {
         const prodRef = doc(db, 'products', ki.id);
         const prodSnap = await getDoc(prodRef);
         if (prodSnap.exists()) {
            const pData = prodSnap.data();
            if (typeof pData.stock === 'number' && pData.stock < requiredQty) {
               return { valid: false, reason: `Estoque insuficiente no item do kit: ${pData.product_name}` };
            }
         } else {
             return { valid: false, reason: `Item de kit não encontrado.` };
         }
      } else if (ki.type === 'insumo') {
         const insumoRef = doc(db, 'insumos', ki.id);
         const insumoSnap = await getDoc(insumoRef);
         if (insumoSnap.exists()) {
            const currentQty = insumoSnap.data().quantity || 0;
            if (currentQty < requiredQty) {
              return { valid: false, reason: `Estoque insuficiente em insumo do kit: ${insumoSnap.data()?.name}` };
            }
         } else {
            return { valid: false, reason: `Insumo de kit não encontrado.` };
         }
      } else if (ki.type === 'addon') {
         const addonRef = doc(db, 'addons', ki.id);
         const addonSnap = await getDoc(addonRef);
         if (addonSnap.exists()) {
            const aData = addonSnap.data();
            if (typeof aData.stock === 'number' && aData.stock < requiredQty) {
               return { valid: false, reason: `Estoque insuficiente no item adicional do kit: ${aData.name}` };
            }
         } else {
            return { valid: false, reason: `Item adicional do kit não encontrado.` };
         }
      }
    }
  }

  return { valid: true };
};
