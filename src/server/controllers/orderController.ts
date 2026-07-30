import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { FieldValue } from 'firebase-admin/firestore';

export const orderController = {
  /**
   * GET /api/orders
   * Lists orders for a company.
   */
  listOrders: async (req: Request, res: Response): Promise<void> => {
    try {
      const companyId = req.query.companyId as string;
      if (!companyId) {
        res.status(400).json({ success: false, error: "companyId é obrigatório" });
        return;
      }
      
      const ordersSnap = await dbAdmin.collection("orders")
        .where("companyId", "==", companyId)
        .where("status", "not-in", ["delivered", "cancelled"])
        .get();
      
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json({ success: true, orders });
    } catch (error: any) {
      console.error("[orderController.listOrders] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao listar pedidos." });
    }
  },

  /**
   * GET /api/orders/:id
   * Gets a specific order.
   */
  getOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const orderDoc = await dbAdmin.collection("orders").doc(id).get();
      
      if (!orderDoc.exists) {
        res.status(404).json({ success: false, error: "Pedido não encontrado." });
        return;
      }
      
      res.status(200).json({ success: true, order: { id: orderDoc.id, ...orderDoc.data() } });
    } catch (error: any) {
      console.error("[orderController.getOrder] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao buscar pedido." });
    }
  },

  /**
   * POST /api/orders/:id/update
   * Updates an order.
   */
  updateOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { updateData } = req.body;
      
      const orderRef = dbAdmin.collection("orders").doc(id);

      await dbAdmin.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists) {
          throw new Error("Pedido não encontrado.");
        }

        const currentOrder = orderSnap.data() as any;
        const oldStatus = currentOrder.status;
        const newStatus = updateData.status || oldStatus;

        const payload: any = { ...updateData, updatedAt: new Date() };
        if (payload.history) {
          payload.history = FieldValue.arrayUnion(payload.history);
        }

        // Check if we need to deduct stock atomically
        const activeDeducedStatuses = ['approved', 'paid', 'fully_paid', 'waiting_production', 'production', 'ready', 'delivered'];
        const shouldDeduct = activeDeducedStatuses.includes(newStatus);
        const wasDeducted = currentOrder.insumosDeducted === true;

        if (shouldDeduct && !wasDeducted) {
          const items = currentOrder.items || updateData.items || [];
          for (const item of items) {
            if (item.productId && !item.isKit) {
              const pRef = dbAdmin.collection("products").doc(item.productId);
              const pSnap = await transaction.get(pRef);
              if (pSnap.exists) {
                const pData = pSnap.data() as any;
                const newStock = Math.max(0, (pData.stock || 0) - (item.quantity || 1));
                transaction.update(pRef, { stock: newStock, updatedAt: FieldValue.serverTimestamp() });
              }
            }
            if (item.insumos && item.insumos.length > 0) {
              for (const reqInsumo of item.insumos) {
                const iRef = dbAdmin.collection("insumos").doc(reqInsumo.insumoId);
                const iSnap = await transaction.get(iRef);
                if (iSnap.exists) {
                  const iData = iSnap.data() as any;
                  const reduction = reqInsumo.quantity * (item.quantity || 1);
                  const newQty = Math.max(0, (iData.quantity || 0) - reduction);
                  transaction.update(iRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                  
                  const cRef = dbAdmin.collection("componentes").doc(reqInsumo.insumoId);
                  transaction.set(cRef, { quantity: newQty, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                }
              }
            }
          }
          payload.insumosDeducted = true;
        } else if (!shouldDeduct && wasDeducted && (newStatus === 'cancelled' || newStatus === 'novo pedido')) {
          const items = currentOrder.items || [];
          for (const item of items) {
            if (item.productId && !item.isKit) {
              const pRef = dbAdmin.collection("products").doc(item.productId);
              const pSnap = await transaction.get(pRef);
              if (pSnap.exists) {
                const pData = pSnap.data() as any;
                const restoredStock = (pData.stock || 0) + (item.quantity || 1);
                transaction.update(pRef, { stock: restoredStock, updatedAt: FieldValue.serverTimestamp() });
              }
            }
            if (item.insumos && item.insumos.length > 0) {
              for (const reqInsumo of item.insumos) {
                const iRef = dbAdmin.collection("insumos").doc(reqInsumo.insumoId);
                const iSnap = await transaction.get(iRef);
                if (iSnap.exists) {
                  const iData = iSnap.data() as any;
                  const restoration = reqInsumo.quantity * (item.quantity || 1);
                  const restoredQty = (iData.quantity || 0) + restoration;
                  transaction.update(iRef, { quantity: restoredQty, updatedAt: FieldValue.serverTimestamp() });

                  const cRef = dbAdmin.collection("componentes").doc(reqInsumo.insumoId);
                  transaction.set(cRef, { quantity: restoredQty, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
                }
              }
            }
          }
          payload.insumosDeducted = false;
        }

        transaction.update(orderRef, payload);
      });

      res.status(200).json({ success: true, message: "Pedido atualizado e transação de estoque executada com sucesso." });
    } catch (error: any) {
      console.error("[orderController.updateOrder] Transaction Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao atualizar pedido com transação atômica." });
    }
  },

  /**
   * POST /api/orders/:id/version
   * Adds a version to order history.
   */
  addVersion: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const { versionData } = req.body;
      
      await dbAdmin.collection("orders").doc(id).collection("versions").add({
        ...versionData,
        createdAt: new Date()
      });
      
      res.status(200).json({ success: true, message: "Versão adicionada." });
    } catch (error: any) {
      console.error("[orderController.addVersion] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao adicionar versão." });
    }
  },
};
