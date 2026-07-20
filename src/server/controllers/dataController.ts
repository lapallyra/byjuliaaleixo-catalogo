import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";

export const dataController = {
  getPickupSlots: async (req: Request, res: Response): Promise<void> => {
    try {
      const ordersSnap = await dbAdmin.collection("orders").get();
      const slots: string[] = [];
      ordersSnap.forEach((doc) => {
        const ms = doc.data();
        if (ms && ms.deliveryType === "retirada" && ms.retiradaDate && ms.retiradaTime) {
          slots.push(`${ms.retiradaDate}_${ms.retiradaTime}`);
        }
      });
      res.json({ success: true, slots });
    } catch (error: any) {
      console.error("[dataController.getPickupSlots] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao buscar agendamentos." });
    }
  },

  getCustomerByCPF: async (req: Request, res: Response): Promise<void> => {
    const { cpf } = req.query;
    if (!cpf || typeof cpf !== "string") {
      res.status(400).json({ success: false, error: "CPF inválido." });
      return;
    }
    try {
      const customersSnap = await dbAdmin.collection("customers").where("cpfCnpj", "==", cpf).get();
      if (customersSnap.empty) {
        res.json({ success: true, customer: null });
        return;
      }
      res.json({ success: true, customer: customersSnap.docs[0].data() });
    } catch (error: any) {
      console.error("[dataController.getCustomerByCPF] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao buscar cliente." });
    }
  },

  syncCustomer: async (req: Request, res: Response): Promise<void> => {
    const { data, companyId } = req.body;
    try {
      const customersRef = dbAdmin.collection("customers");
      const snap = await customersRef.where("contact", "==", data.contact).where("companyId", "==", companyId).get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const existingData = doc.data();
        const updateData: any = {};
        if (data.name && !existingData.name) updateData.name = data.name;
        if (data.cpfCnpj && !existingData.cpfCnpj) updateData.cpfCnpj = data.cpfCnpj;
        if (data.email && !existingData.email) updateData.email = data.email;
        // ... (other fields)
        if (Object.keys(updateData).length > 0) {
          await doc.ref.update(updateData);
        }
        res.json({ success: true, customer: doc.data() });
      } else {
        const newCustomerData = { ...data, createdAt: new Date() };
        const docRef = await customersRef.add(newCustomerData);
        res.json({ success: true, customer: { id: docRef.id, ...newCustomerData } });
      }
    } catch (error: any) {
      console.error("[dataController.syncCustomer] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao sincronizar cliente." });
    }
  },
};
