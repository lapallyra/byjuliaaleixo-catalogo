const fs = require('fs');
const file = 'src/services/firebaseService.ts';
let code = fs.readFileSync(file, 'utf8');

const startStr = 'export const adjustStockForOrderItems = async (orderId: string, orderCode: string, oldItems: CartItem[], newItems: CartItem[]) => {';
const startIdx = code.indexOf(startStr);
if (startIdx === -1) throw new Error('Not found');

const endStr = '};\n\nexport const deductStockForOrder = async';
const endIdx = code.indexOf(endStr, startIdx);
if (endIdx === -1) throw new Error('End not found');

const newBody = `export const adjustStockForOrderItems = async (orderId: string, orderCode: string, oldItems: CartItem[], newItems: CartItem[]) => {
  const oldReqs = getStockRequirements(oldItems);
  const newReqs = getStockRequirements(newItems);

  const allProductIds = new Set([...Object.keys(oldReqs.products), ...Object.keys(newReqs.products)]);
  const allInsumoIds = new Set([...Object.keys(oldReqs.insumos), ...Object.keys(newReqs.insumos)]);
  const allAddonIds = new Set([...Object.keys(oldReqs.addons), ...Object.keys(newReqs.addons)]);

  if (allProductIds.size === 0 && allInsumoIds.size === 0 && allAddonIds.size === 0) return;

  try {
    await runTransaction(db, async (transaction) => {
      const refsToRead = [];
      const refMap = new Map();

      const addRef = (colName, id) => {
        const path = \`\${colName}/\${id}\`;
        if (!refMap.has(path)) {
          const r = doc(db, colName, id);
          refMap.set(path, r);
          refsToRead.push(r);
        }
      };

      allProductIds.forEach(id => addRef('products', id));
      allInsumoIds.forEach(id => { addRef('insumos', id); addRef('componentes', id); });
      allAddonIds.forEach(id => addRef('addons', id));

      const snapsMap = new Map();
      for (const r of refsToRead) {
         const snap = await transaction.get(r);
         snapsMap.set(\`\${r.parent.id}/\${r.id}\`, snap);
      }

      // 1. Adjust Products
      for (const prodId of allProductIds) {
        const oldQty = oldReqs.products[prodId] || 0;
        const newQty = newReqs.products[prodId] || 0;
        const delta = newQty - oldQty;
        if (delta !== 0) {
          const snap = snapsMap.get(\`products/\${prodId}\`);
          if (snap && snap.exists()) {
            const stock = snap.data().stock || 0;
            transaction.update(refMap.get(\`products/\${prodId}\`), { stock: Math.max(0, stock - delta) });
          }
        }
      }

      // 2. Adjust Insumos
      for (const insumoId of allInsumoIds) {
        const oldQty = oldReqs.insumos[insumoId] || 0;
        const newQty = newReqs.insumos[insumoId] || 0;
        const delta = newQty - oldQty;
        if (delta !== 0) {
          const snap = snapsMap.get(\`insumos/\${insumoId}\`);
          if (snap && snap.exists()) {
            const qty = snap.data().quantity || 0;
            const newQuantity = Math.max(0, qty - delta);
            transaction.update(refMap.get(\`insumos/\${insumoId}\`), { quantity: newQuantity });
            
            const compSnap = snapsMap.get(\`componentes/\${insumoId}\`);
            if (compSnap && compSnap.exists()) {
               transaction.update(refMap.get(\`componentes/\${insumoId}\`), { quantity: newQuantity });
            }

            // Log movement
            const moveRef = doc(collection(db, 'insumo_movements'));
            transaction.set(moveRef, sanitize({
              insumoId: insumoId,
              insumoName: snap.data()?.name || 'Material',
              orderId: orderId,
              orderCode: orderCode || orderId,
              productName: 'Ajuste de Pedido',
              quantityDeducted: Math.abs(delta),
              timestamp: new Date().toISOString(),
              type: delta > 0 ? 'out' : 'in'
            }));
          }
        }
      }

      // 3. Adjust Addons
      for (const addonId of allAddonIds) {
        const oldQty = oldReqs.addons[addonId] || 0;
        const newQty = newReqs.addons[addonId] || 0;
        const delta = newQty - oldQty;
        if (delta !== 0) {
          const snap = snapsMap.get(\`addons/\${addonId}\`);
          if (snap && snap.exists()) {
            const stock = snap.data().stock || 0;
            transaction.update(refMap.get(\`addons/\${addonId}\`), { stock: Math.max(0, stock - delta) });
          }
        }
      }
    });
  } catch (err) {
    console.error("Error in adjustStockForOrderItems transaction:", err);
  }
`;

code = code.substring(0, startIdx) + newBody + code.substring(endIdx);
fs.writeFileSync(file, code);
