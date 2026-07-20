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
      
      const payload: any = { ...updateData, updatedAt: new Date() };
      
      if (payload.history) {
        payload.history = FieldValue.arrayUnion(payload.history);
      }
      
      await dbAdmin.collection("orders").doc(id).update(payload);
      
      res.status(200).json({ success: true, message: "Pedido atualizado." });
    } catch (error: any) {
      console.error("[orderController.updateOrder] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao atualizar pedido." });
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
