import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Order, ProductionBatch, Insumo, Product, Componente } from "../../types";

// Helper to create audit logs on the server side
const createAuditLog = async (
  module: string,
  action: string,
  resourceId: string,
  resourceName: string,
  data?: {
    oldData?: any;
    newData?: any;
    details?: any;
  },
  companyId?: string
) => {
  try {
    const now = new Date();
    const auditData = {
      correlationId: Math.random().toString(36).substring(2, 15),
      timestamp: FieldValue.serverTimestamp(),
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('pt-BR'),
      user: {
        uid: 'backend-system',
        email: 'backend@erp.com',
        name: 'Sistema Backend',
        role: 'Administrador'
      },
      module,
      action,
      resourceId,
      resourceName,
      oldData: data?.oldData || null,
      newData: data?.newData || null,
      origin: 'Backend API',
      details: data?.details || null,
      companyId: companyId || null
    };

    await dbAdmin.collection('audit_logs').add(auditData);
  } catch (error) {
    console.error("[createAuditLog] Error in production audit:", error);
  }
};

export const productionController = {
  /**
   * POST /api/production/start
   * Starts production for an order or a production batch.
   */
  startProduction: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, batchId, userId } = req.body;

      if (!orderId && !batchId) {
        res.status(400).json({ success: false, error: "Identificador (orderId ou batchId) é obrigatório." });
        return;
      }

      const ordersToProcess: { id: string; ref: any; data: any }[] = [];
      let batchDoc: any = null;
      let batchRef: any = null;

      // 1. Resolve which orders need production and check if already deducted
      if (batchId) {
        batchRef = dbAdmin.collection("productionBatches").doc(batchId);
        const bSnap = await batchRef.get();
        if (!bSnap.exists) {
          res.status(404).json({ success: false, error: "Lote de produção não encontrado." });
          return;
        }
        batchDoc = bSnap.data() as ProductionBatch;
        const orderIds = batchDoc.orderIds || [];

        for (const oid of orderIds) {
          const oRef = dbAdmin.collection("orders").doc(oid);
          const oSnap = await oRef.get();
          if (oSnap.exists) {
            ordersToProcess.push({ id: oid, ref: oRef, data: oSnap.data() });
          }
        }
      } else if (orderId) {
        const oRef = dbAdmin.collection("orders").doc(orderId);
        const oSnap = await oRef.get();
        if (!oSnap.exists) {
          res.status(404).json({ success: false, error: "Pedido não encontrado." });
          return;
        }
        ordersToProcess.push({ id: orderId, ref: oRef, data: oSnap.data() });
      }

      // Filter out orders that are already processed or don't need deduction
      const pendingOrders = ordersToProcess.filter(o => o.data.insumosDeducted !== true);

      // If all orders are already deducted, we can just update status and finish
      if (pendingOrders.length === 0) {
        // Just transition status to production
        await dbAdmin.runTransaction(async (transaction) => {
          for (const o of ordersToProcess) {
            transaction.update(o.ref, { status: 'production', updatedAt: FieldValue.serverTimestamp() });
          }
          if (batchRef) {
            transaction.update(batchRef, {
              status: 'em_producao',
              startedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              history: FieldValue.arrayUnion({
                status: 'em_producao',
                timestamp: new Date().toISOString(),
                notes: 'Status alterado para em produção (estoque já deduzido).'
              })
            });
          }
        });

        res.status(200).json({ success: true, message: "Produção iniciada com sucesso (estoque já estava deduzido)." });
        return;
      }

      // 2. Map and resolve all required quantities of materials/products
      const requiredProducts = new Map<string, number>(); // path -> quantity
      const requiredInsumos = new Map<string, number>(); // path -> quantity (insumos & componentes)
      const requiredAddons = new Map<string, number>(); // path -> quantity

      // Key helpers to track references for reading in transaction
      const refsToRead: any[] = [];
      const refMap = new Map<string, any>(); // path -> DocumentReference

      const addRef = (colName: string, id: string) => {
        const path = `${colName}/${id}`;
        if (!refMap.has(path)) {
          const ref = dbAdmin.collection(colName).doc(id);
          refMap.set(path, ref);
          refsToRead.push(ref);
        }
      };

      for (const o of pendingOrders) {
        const items = o.data.items || [];
        for (const item of items) {
          const qtyMultiplier = item.quantity || 1;

          // Standard Product
          if (item.productId && !item.isKit) {
            addRef("products", item.productId);
            const path = `products/${item.productId}`;
            requiredProducts.set(path, (requiredProducts.get(path) || 0) + qtyMultiplier);
          }

          // Direct recipe / Insumos
          if (item.insumos && item.insumos.length > 0) {
            for (const requiredInsumo of item.insumos) {
              const insumoId = requiredInsumo.insumoId;
              addRef("insumos", insumoId);
              addRef("componentes", insumoId);
              const path = `insumos/${insumoId}`;
              requiredInsumos.set(path, (requiredInsumos.get(path) || 0) + (requiredInsumo.quantity * qtyMultiplier));
            }
          }

          // Kit Items
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              const qtyToDeduct = ki.quantity * qtyMultiplier;
              if (ki.type === 'product') {
                addRef("products", ki.id);
                const path = `products/${ki.id}`;
                requiredProducts.set(path, (requiredProducts.get(path) || 0) + qtyToDeduct);
              } else if (ki.type === 'insumo') {
                addRef("insumos", ki.id);
                addRef("componentes", ki.id);
                const path = `insumos/${ki.id}`;
                requiredInsumos.set(path, (requiredInsumos.get(path) || 0) + qtyToDeduct);
              } else if (ki.type === 'addon') {
                addRef("addons", ki.id);
                const path = `addons/${ki.id}`;
                requiredAddons.set(path, (requiredAddons.get(path) || 0) + qtyToDeduct);
              }
            }
          }
        }
      }

      // 3. Perform pre-validation to "impedir estoque negativo"
      const snaps = refsToRead.length > 0 ? await dbAdmin.getAll(...refsToRead) : [];
      const snapMap = new Map<string, any>();
      snaps.forEach((snap, idx) => {
        snapMap.set(refsToRead[idx].path, snap);
      });

      const warnings: string[] = [];

      // Validate products availability
      requiredProducts.forEach((qtyNeeded, path) => {
        const snap = snapMap.get(path);
        const pData = snap?.exists ? snap.data() : null;
        const currentStock = pData?.stock || 0;
        if (currentStock < qtyNeeded) {
          warnings.push(`Estoque de produto insuficiente: ${pData?.product_name || path.split('/')[1]}. Disponível: ${currentStock}, Necessário: ${qtyNeeded}`);
        }
      });

      // Validate insumos availability
      requiredInsumos.forEach((qtyNeeded, path) => {
        const snap = snapMap.get(path);
        const iData = snap?.exists ? snap.data() : null;
        const currentQty = iData?.quantity || 0;
        if (currentQty < qtyNeeded) {
          warnings.push(`Estoque de insumo insuficiente: ${iData?.name || path.split('/')[1]}. Disponível: ${currentQty}, Necessário: ${qtyNeeded}`);
        }
      });

      // Validate addons availability
      requiredAddons.forEach((qtyNeeded, path) => {
        const snap = snapMap.get(path);
        const aData = snap?.exists ? snap.data() : null;
        const currentStock = aData?.stock || 0;
        if (currentStock < qtyNeeded) {
          warnings.push(`Estoque de opcional/addon insuficiente: ${aData?.name || path.split('/')[1]}. Disponível: ${currentStock}, Necessário: ${qtyNeeded}`);
        }
      });

      if (warnings.length > 0) {
        res.status(400).json({
          success: false,
          error: "Estoque insuficiente para iniciar a produção.",
          warnings
        });
        return;
      }

      // 4. Run Transaction to commit stock deductions & logging movements
      await dbAdmin.runTransaction(async (transaction) => {
        // Reduct and update Products
        requiredProducts.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.data()?.stock || 0;
          const newStock = Math.max(0, currentStock - qtyNeeded);
          transaction.update(refMap.get(path), { stock: newStock, updatedAt: FieldValue.serverTimestamp() });
        });

        // Reduct and update Insumos & Componentes in sync
        requiredInsumos.forEach((qtyNeeded, path) => {
          const insumoId = path.split('/')[1];
          const snap = snapMap.get(path);
          const currentQty = snap?.data()?.quantity || 0;
          const newQty = Math.max(0, currentQty - qtyNeeded);

          const insumoRef = refMap.get(`insumos/${insumoId}`);
          const compRef = refMap.get(`componentes/${insumoId}`);

          transaction.update(insumoRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
          if (compRef) {
            transaction.update(compRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
          }

          // Register Unified movement inside 'insumo_movements'
          const moveRef = dbAdmin.collection("insumo_movements").doc();
          transaction.set(moveRef, {
            insumoId: insumoId,
            componenteId: insumoId, // for double compatibility
            insumoName: snap?.data()?.name || 'Insumo',
            date: FieldValue.serverTimestamp(),
            type: 'saida',
            quantity: qtyNeeded,
            previousQuantity: currentQty,
            newQuantity: newQty,
            reason: batchDoc ? `Lote ${batchDoc.code || batchId}` : `Pedido ${orderId || 'avulso'}`,
            origin: "Ateliê Principal",
            user: "Ateliê Admin"
          });
        });

        // Reduct and update Addons
        requiredAddons.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.data()?.stock || 0;
          const newStock = Math.max(0, currentStock - qtyNeeded);
          transaction.update(refMap.get(path), { stock: newStock, updatedAt: FieldValue.serverTimestamp() });
        });

        // Transition Order statuses & flags
        for (const o of pendingOrders) {
          transaction.update(o.ref, {
            insumosDeducted: true,
            status: 'production',
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        // Transition Batch status if applicable
        if (batchRef) {
          transaction.update(batchRef, {
            status: 'em_producao',
            startedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            history: FieldValue.arrayUnion({
              status: 'em_producao',
              timestamp: new Date().toISOString(),
              notes: 'Produção do lote iniciada, insumos baixados com sucesso.'
            })
          });
        }
      });

      // 5. Register Audit Logs for the process
      if (batchDoc) {
        await createAuditLog(
          'Produção',
          'Início de Produção por Lote',
          batchId,
          `Lote ${batchDoc.code}`,
          {
            details: { batchId, code: batchDoc.code, orderIds: batchDoc.orderIds }
          },
          batchDoc.companyId
        );
      } else {
        const orderData = ordersToProcess[0]?.data;
        await createAuditLog(
          'Produção',
          'Início de Produção de Pedido',
          orderId,
          orderData?.code || orderId,
          {
            details: { orderId, code: orderData?.code }
          },
          orderData?.companyId
        );
      }

      res.status(200).json({ success: true, message: "Produção iniciada e insumos baixados com sucesso." });
    } catch (error: any) {
      console.error("[startProduction] Error starting production:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao iniciar produção." });
    }
  },

  /**
   * POST /api/production/cancel
   * Cancels production of an order or batch, restoring all physical stocks.
   */
  cancelProduction: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, batchId, userId } = req.body;

      if (!orderId && !batchId) {
        res.status(400).json({ success: false, error: "Identificador (orderId ou batchId) é obrigatório." });
        return;
      }

      const ordersToProcess: { id: string; ref: any; data: any }[] = [];
      let batchDoc: any = null;
      let batchRef: any = null;

      if (batchId) {
        batchRef = dbAdmin.collection("productionBatches").doc(batchId);
        const bSnap = await batchRef.get();
        if (!bSnap.exists) {
          res.status(404).json({ success: false, error: "Lote não encontrado." });
          return;
        }
        batchDoc = bSnap.data() as ProductionBatch;
        const orderIds = batchDoc.orderIds || [];

        for (const oid of orderIds) {
          const oRef = dbAdmin.collection("orders").doc(oid);
          const oSnap = await oRef.get();
          if (oSnap.exists) {
            ordersToProcess.push({ id: oid, ref: oRef, data: oSnap.data() });
          }
        }
      } else if (orderId) {
        const oRef = dbAdmin.collection("orders").doc(orderId);
        const oSnap = await oRef.get();
        if (!oSnap.exists) {
          res.status(404).json({ success: false, error: "Pedido não encontrado." });
          return;
        }
        ordersToProcess.push({ id: orderId, ref: oRef, data: oSnap.data() });
      }

      // Filter to only those orders that actually had insumos deducted
      const deductedOrders = ordersToProcess.filter(o => o.data.insumosDeducted === true);

      if (deductedOrders.length === 0) {
        // Just revert status if needed
        await dbAdmin.runTransaction(async (transaction) => {
          for (const o of ordersToProcess) {
            transaction.update(o.ref, { status: 'waiting_production', updatedAt: FieldValue.serverTimestamp() });
          }
          if (batchRef) {
            transaction.update(batchRef, {
              status: 'aberto',
              updatedAt: FieldValue.serverTimestamp(),
              history: FieldValue.arrayUnion({
                status: 'aberto',
                timestamp: new Date().toISOString(),
                notes: 'Status de lote revertido para aberto.'
              })
            });
          }
        });

        res.status(200).json({ success: true, message: "Produção cancelada com sucesso (estoque não precisava de restauração)." });
        return;
      }

      // Resolve stock to restore
      const restoreProducts = new Map<string, number>();
      const restoreInsumos = new Map<string, number>();
      const restoreAddons = new Map<string, number>();

      const refsToRead: any[] = [];
      const refMap = new Map<string, any>();

      const addRef = (colName: string, id: string) => {
        const path = `${colName}/${id}`;
        if (!refMap.has(path)) {
          const ref = dbAdmin.collection(colName).doc(id);
          refMap.set(path, ref);
          refsToRead.push(ref);
        }
      };

      for (const o of deductedOrders) {
        const items = o.data.items || [];
        for (const item of items) {
          const qtyMultiplier = item.quantity || 1;

          if (item.productId && !item.isKit) {
            addRef("products", item.productId);
            const path = `products/${item.productId}`;
            restoreProducts.set(path, (restoreProducts.get(path) || 0) + qtyMultiplier);
          }

          if (item.insumos && item.insumos.length > 0) {
            for (const requiredInsumo of item.insumos) {
              const insumoId = requiredInsumo.insumoId;
              addRef("insumos", insumoId);
              addRef("componentes", insumoId);
              const path = `insumos/${insumoId}`;
              restoreInsumos.set(path, (restoreInsumos.get(path) || 0) + (requiredInsumo.quantity * qtyMultiplier));
            }
          }

          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              const qtyToRestore = ki.quantity * qtyMultiplier;
              if (ki.type === 'product') {
                addRef("products", ki.id);
                const path = `products/${ki.id}`;
                restoreProducts.set(path, (restoreProducts.get(path) || 0) + qtyToRestore);
              } else if (ki.type === 'insumo') {
                addRef("insumos", ki.id);
                addRef("componentes", ki.id);
                const path = `insumos/${ki.id}`;
                restoreInsumos.set(path, (restoreInsumos.get(path) || 0) + qtyToRestore);
              } else if (ki.type === 'addon') {
                addRef("addons", ki.id);
                const path = `addons/${ki.id}`;
                restoreAddons.set(path, (restoreAddons.get(path) || 0) + qtyToRestore);
              }
            }
          }
        }
      }

      // Read current stocks
      const snaps = refsToRead.length > 0 ? await dbAdmin.getAll(...refsToRead) : [];
      const snapMap = new Map<string, any>();
      snaps.forEach((snap, idx) => {
        snapMap.set(refsToRead[idx].path, snap);
      });

      // Run restore Transaction
      await dbAdmin.runTransaction(async (transaction) => {
        // Restore products
        restoreProducts.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.data()?.stock || 0;
          transaction.update(refMap.get(path), { stock: currentStock + qtyNeeded, updatedAt: FieldValue.serverTimestamp() });
        });

        // Restore insumos & componentes
        restoreInsumos.forEach((qtyNeeded, path) => {
          const insumoId = path.split('/')[1];
          const snap = snapMap.get(path);
          const currentQty = snap?.data()?.quantity || 0;
          const newQty = currentQty + qtyNeeded;

          const insumoRef = refMap.get(`insumos/${insumoId}`);
          const compRef = refMap.get(`componentes/${insumoId}`);

          transaction.update(insumoRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
          if (compRef) {
            transaction.update(compRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
          }

          // Register restore log inside unified 'insumo_movements'
          const moveRef = dbAdmin.collection("insumo_movements").doc();
          transaction.set(moveRef, {
            insumoId: insumoId,
            componenteId: insumoId,
            insumoName: snap?.data()?.name || 'Insumo',
            date: FieldValue.serverTimestamp(),
            type: 'entrada',
            quantity: qtyNeeded,
            previousQuantity: currentQty,
            newQuantity: newQty,
            reason: batchDoc ? `Cancelamento Lote ${batchDoc.code || batchId}` : `Cancelamento Pedido ${orderId || 'avulso'}`,
            origin: "Ateliê Principal",
            user: "Ateliê Admin"
          });
        });

        // Restore addons
        restoreAddons.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.data()?.stock || 0;
          transaction.update(refMap.get(path), { stock: currentStock + qtyNeeded, updatedAt: FieldValue.serverTimestamp() });
        });

        // Update Order states
        for (const o of deductedOrders) {
          transaction.update(o.ref, {
            insumosDeducted: false,
            status: 'waiting_production',
            updatedAt: FieldValue.serverTimestamp()
          });
        }

        // Revert Batch status
        if (batchRef) {
          transaction.update(batchRef, {
            status: 'aberto',
            updatedAt: FieldValue.serverTimestamp(),
            history: FieldValue.arrayUnion({
              status: 'aberto',
              timestamp: new Date().toISOString(),
              notes: 'Produção cancelada, estoque restaurado com sucesso.'
            })
          });
        }
      });

      // Audit log
      if (batchDoc) {
        await createAuditLog(
          'Produção',
          'Cancelamento de Lote e Extorno de Estoque',
          batchId,
          `Lote ${batchDoc.code}`,
          {
            details: { batchId, code: batchDoc.code, orderIds: batchDoc.orderIds }
          },
          batchDoc.companyId
        );
      } else {
        const orderData = ordersToProcess[0]?.data;
        await createAuditLog(
          'Produção',
          'Cancelamento de Pedido e Extorno de Estoque',
          orderId,
          orderData?.code || orderId,
          {
            details: { orderId, code: orderData?.code }
          },
          orderData?.companyId
        );
      }

      res.status(200).json({ success: true, message: "Produção cancelada e estoque estornado com sucesso." });
    } catch (error: any) {
      console.error("[cancelProduction] Error cancelling production:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao cancelar produção." });
    }
  }
};
