import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Insumo, ComponenteMovement } from "../../types";

// Helper to notify low stock via Telegram (replicates sendTelegramNotification)
const notifyLowStock = async (insumoName: string, quantity: number) => {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    // Check system preference from Firestore
    const configDoc = await dbAdmin.collection('system_notifications').doc('settings').get();
    const tgConfig = configDoc.exists ? configDoc.data() : null;
    if (tgConfig && (!tgConfig.telegram_enabled || tgConfig.notify_low_stock === false)) {
      return;
    }

    const message = `⚠️ ESTOQUE BAIXO\n\nMaterial:\n${insumoName}\n\nQuantidade Atual:\n${quantity}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      }),
    });
  } catch (error) {
    console.error("[notifyLowStock] Error sending low stock notification:", error);
  }
};

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
    console.error("[createAuditLog] Error:", error);
  }
};

export const inventoryController = {
  /**
   * GET /api/inventory/insumos
   * Lists all insumos from the primary 'insumos' collection.
   */
  listInsumos: async (req: Request, res: Response): Promise<void> => {
    try {
      const insumosSnap = await dbAdmin.collection("insumos").get();
      const insumos = insumosSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      res.status(200).json({ success: true, insumos });
    } catch (error: any) {
      console.error("[inventoryController.listInsumos] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao listar insumos." });
    }
  },

  /**
   * POST /api/inventory/insumos
   * Creates a new insumo in both 'insumos' and 'componentes' collections.
   */
  createInsumo: async (req: Request, res: Response): Promise<void> => {
    try {
      const insumoData = req.body;
      if (!insumoData || !insumoData.name) {
        res.status(400).json({ success: false, error: "O nome do insumo é obrigatório." });
        return;
      }

      const newDocRef = dbAdmin.collection("insumos").doc();
      const id = newDocRef.id;

      const payload = {
        ...insumoData,
        id,
        isActive: insumoData.isActive !== undefined ? insumoData.isActive : true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // Set identical document in both collections (Option A syncing)
      await dbAdmin.collection("insumos").doc(id).set(payload);
      await dbAdmin.collection("componentes").doc(id).set(payload);

      await createAuditLog('Estoque', 'Criação', id, insumoData.name, { newData: insumoData }, insumoData.companyId);

      res.status(201).json({ success: true, id, insumo: payload });
    } catch (error: any) {
      console.error("[inventoryController.createInsumo] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao criar insumo." });
    }
  },

  /**
   * POST /api/inventory/insumos/:id/update
   * Updates an insumo in both 'insumos' and 'componentes' collections.
   */
  updateInsumo: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const data = req.body;

      if (!id) {
        res.status(400).json({ success: false, error: "ID do insumo é obrigatório." });
        return;
      }

      const insumoRef = dbAdmin.collection("insumos").doc(id);
      const compRef = dbAdmin.collection("componentes").doc(id);

      const snap = await insumoRef.get();
      if (!snap.exists) {
        res.status(404).json({ success: false, error: "Insumo não encontrado." });
        return;
      }

      const oldData = snap.data() || {};
      const payload = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await insumoRef.update(payload);
      const compSnap = await compRef.get();
      if (compSnap.exists) {
        await compRef.update(payload);
      } else {
        await compRef.set({ ...oldData, ...payload });
      }

      const action = data.quantity !== undefined ? 'Entrada de Estoque' : 'Alteração';

      await createAuditLog(
        'Estoque',
        action,
        id,
        (data.name || oldData.name || id),
        {
          oldData: oldData,
          newData: { ...oldData, ...data },
          details: { observations: data.quantity !== undefined ? `Alteração de estoque: ${oldData.quantity || 0} -> ${data.quantity}` : undefined }
        },
        data.companyId || oldData.companyId
      );

      res.status(200).json({ success: true, id });
    } catch (error: any) {
      console.error("[inventoryController.updateInsumo] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao atualizar insumo." });
    }
  },

  /**
   * POST /api/inventory/insumos/:id/delete
   * Deletes an insumo from both 'insumos' and 'componentes' collections.
   */
  deleteInsumo: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({ success: false, error: "ID do insumo é obrigatório." });
        return;
      }

      const insumoRef = dbAdmin.collection("insumos").doc(id);
      const compRef = dbAdmin.collection("componentes").doc(id);

      const snap = await insumoRef.get();
      const oldData = snap.exists ? snap.data() : null;

      await insumoRef.delete();
      await compRef.delete();

      if (oldData) {
        await createAuditLog('Estoque', 'Exclusão', id, oldData.name || id, { oldData }, oldData.companyId);
      }

      res.status(200).json({ success: true, id });
    } catch (error: any) {
      console.error("[inventoryController.deleteInsumo] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao excluir insumo." });
    }
  },

  /**
   * POST /api/inventory/movement
   * Records a manual inventory movement and updates the current stock.
   */
  recordMovement: async (req: Request, res: Response): Promise<void> => {
    try {
      const { componenteId, type, quantity, reason, origin, cost, user, componenteName, companyId } = req.body;

      if (!componenteId || !type || typeof quantity !== "number" || quantity <= 0) {
        res.status(400).json({ success: false, error: "Parâmetros de movimentação inválidos ou incompletos." });
        return;
      }

      const insumoRef = dbAdmin.collection("insumos").doc(componenteId);
      const compRef = dbAdmin.collection("componentes").doc(componenteId);

      let newQty = 0;
      let finalName = componenteName || "Insumo";

      await dbAdmin.runTransaction(async (transaction) => {
        const insumoSnap = await transaction.get(insumoRef);
        if (!insumoSnap.exists) {
          throw new Error(`Insumo com ID ${componenteId} não encontrado.`);
        }

        const currentQty = insumoSnap.data()?.quantity || 0;
        finalName = insumoSnap.data()?.name || finalName;

        if (type === "entrada") {
          newQty = currentQty + quantity;
        } else if (type === "saida" || type === "ajuste") {
          // If "ajuste", quantity could mean setting the exact value or offset.
          // In ComponentsTab it was 'entrada' or 'saida'. We handle both:
          newQty = currentQty - quantity;
          if (newQty < 0) {
            throw new Error("O estoque não pode ficar negativo!");
          }
        }

        const updatePayload: any = {
          quantity: newQty,
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (type === "entrada" && typeof cost === "number" && cost > 0) {
          updatePayload.unitCost = cost;
        }

        transaction.update(insumoRef, updatePayload);
        transaction.update(compRef, updatePayload);

        // Record movement in 'insumo_movements' collection inside transaction
        const movementRef = dbAdmin.collection("insumo_movements").doc();
        const movementPayload = {
          insumoId: componenteId,
          componenteId,
          insumoName: finalName,
          componenteName: finalName,
          companyId: companyId || insumoSnap.data()?.companyId || null,
          date: FieldValue.serverTimestamp(),
          type,
          quantity,
          reason: reason || (type === "entrada" ? "Entrada Manual" : "Saída Manual"),
          origin: origin || "Ateliê Principal",
          cost: cost || insumoSnap.data()?.unitCost || 0,
          user: user || "Ateliê Admin",
        };
        transaction.set(movementRef, movementPayload);
      });

      // Audit Log and Telegram alerts outside transaction
      await createAuditLog(
        'Estoque',
        type === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque',
        componenteId,
        finalName,
        {
          details: {
            type,
            quantity,
            reason,
            origin,
            newQuantity: newQty
          }
        },
        companyId
      );

      if (newQty <= 10) {
        notifyLowStock(finalName, newQty);
      }

      res.status(200).json({ success: true, newQuantity: newQty });
    } catch (error: any) {
      console.error("[inventoryController.recordMovement] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro ao registrar movimentação." });
    }
  },

  /**
   * POST /api/inventory/deduct-order
   * Deducts products and insumos stock automatically based on a new or updated order.
   */
  deductOrderStock: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, orderData } = req.body;

      if (!orderId || !orderData) {
        res.status(400).json({ success: false, error: "ID do pedido e dados do pedido são obrigatórios." });
        return;
      }

      const orderRef = dbAdmin.collection("orders").doc(orderId);
      let alreadyDeducted = false;

      // Map to hold unique low stock alerts to send after transaction succeeds
      const lowStockAlerts: { name: string; qty: number }[] = [];

      await dbAdmin.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (orderSnap.exists && orderSnap.data()?.insumosDeducted === true) {
          alreadyDeducted = true;
          return;
        }

        const refsToRead: any[] = [];
        const refMap = new Map<string, any>(); // path -> ref

        const addRef = (colName: string, id: string) => {
          const path = `${colName}/${id}`;
          if (!refMap.has(path)) {
            const ref = dbAdmin.collection(colName).doc(id);
            refMap.set(path, ref);
            refsToRead.push(ref);
          }
        };

        const items = orderData.items || [];
        for (const item of items) {
          if (item.productId && !item.isKit) {
            addRef("products", item.productId);
          }
          if (item.insumos && item.insumos.length > 0 && !item.isKit) {
            for (const requiredInsumo of item.insumos) {
              addRef("insumos", requiredInsumo.insumoId);
              addRef("componentes", requiredInsumo.insumoId);
            }
          }
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              if (ki.type === "product") {
                addRef("products", ki.id);
              } else if (ki.type === "insumo") {
                addRef("insumos", ki.id);
                addRef("componentes", ki.id);
              } else if (ki.type === "addon") {
                addRef("addons", ki.id);
              }
            }
          }
        }

        // Fetch all dependencies at once
        const snaps = refsToRead.length > 0 ? await transaction.getAll(...refsToRead) : [];
        const snapMap = new Map<string, any>();
        snaps.forEach((snap, idx) => {
          snapMap.set(refsToRead[idx].path, snap);
        });

        // Calculate needed quantities and pre-validate to prevent negative stock (EST-02)
        const requiredProducts = new Map<string, number>();
        const requiredInsumos = new Map<string, number>();
        const requiredAddons = new Map<string, number>();

        for (const item of items) {
          const qtyMultiplier = item.quantity || 1;
          if (item.productId && !item.isKit) {
            const path = `products/${item.productId}`;
            requiredProducts.set(path, (requiredProducts.get(path) || 0) + qtyMultiplier);
          }
          if (item.insumos && item.insumos.length > 0 && !item.isKit) {
            for (const requiredInsumo of item.insumos) {
              const path = `insumos/${requiredInsumo.insumoId}`;
              requiredInsumos.set(path, (requiredInsumos.get(path) || 0) + (requiredInsumo.quantity * qtyMultiplier));
            }
          }
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              const qtyToDeduct = ki.quantity * qtyMultiplier;
              if (ki.type === "product") {
                const path = `products/${ki.id}`;
                requiredProducts.set(path, (requiredProducts.get(path) || 0) + qtyToDeduct);
              } else if (ki.type === "insumo") {
                const path = `insumos/${ki.id}`;
                requiredInsumos.set(path, (requiredInsumos.get(path) || 0) + qtyToDeduct);
              } else if (ki.type === "addon") {
                const path = `addons/${ki.id}`;
                requiredAddons.set(path, (requiredAddons.get(path) || 0) + qtyToDeduct);
              }
            }
          }
        }

        const warnings: string[] = [];

        requiredProducts.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.exists ? (snap.data()?.stock || 0) : 0;
          if (currentStock < qtyNeeded) {
            warnings.push(`Estoque de produto insuficiente: ${snap?.data()?.product_name || path.split('/')[1]}. Disponível: ${currentStock}, Necessário: ${qtyNeeded}`);
          }
        });

        requiredInsumos.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentQty = snap?.exists ? (snap.data()?.quantity || 0) : 0;
          if (currentQty < qtyNeeded) {
            warnings.push(`Estoque de insumo insuficiente: ${snap?.data()?.name || path.split('/')[1]}. Disponível: ${currentQty}, Necessário: ${qtyNeeded}`);
          }
        });

        requiredAddons.forEach((qtyNeeded, path) => {
          const snap = snapMap.get(path);
          const currentStock = snap?.exists ? (snap.data()?.stock || 0) : 0;
          if (currentStock < qtyNeeded) {
            warnings.push(`Estoque de opcional/addon insuficiente: ${snap?.data()?.name || path.split('/')[1]}. Disponível: ${currentStock}, Necessário: ${qtyNeeded}`);
          }
        });

        if (warnings.length > 0) {
          const errorObj = new Error("Estoque insuficiente para faturamento/dedução do pedido.");
          (errorObj as any).warnings = warnings;
          (errorObj as any).isValidationError = true;
          throw errorObj;
        }

        // Update order deduction state
        transaction.update(orderRef, { insumosDeducted: true });

        // Update stocks & Record movements
        for (const item of items) {
          // 1. Regular Product Stock
          if (item.productId && !item.isKit) {
            const path = `products/${item.productId}`;
            const prodSnap = snapMap.get(path);
            if (prodSnap && prodSnap.exists) {
              const pData = prodSnap.data();
              if (typeof pData?.stock === 'number') {
                const newStock = Math.max(0, pData.stock - (item.quantity || 1));
                transaction.update(refMap.get(path), { stock: newStock });
              }
            }
          }

          // 2. Regular Product Insumos
          if (item.insumos && item.insumos.length > 0 && !item.isKit) {
            for (const requiredInsumo of item.insumos) {
              const pathInsumo = `insumos/${requiredInsumo.insumoId}`;
              const pathComp = `componentes/${requiredInsumo.insumoId}`;
              const insumoSnap = snapMap.get(pathInsumo);

              if (insumoSnap && insumoSnap.exists) {
                const currentQty = insumoSnap.data()?.quantity || 0;
                const reduction = requiredInsumo.quantity * item.quantity;
                const newQty = Math.max(0, currentQty - reduction);

                transaction.update(refMap.get(pathInsumo), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                if (refMap.has(pathComp)) {
                  transaction.update(refMap.get(pathComp), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                }

                // Add insumo movement log
                const moveRef = dbAdmin.collection("insumo_movements").doc();
                transaction.set(moveRef, {
                  insumoId: requiredInsumo.insumoId,
                  insumoName: insumoSnap.data()?.name || 'Material',
                  orderId: orderId,
                  orderCode: orderData.code || orderId,
                  companyId: orderData.companyId || null,
                  productName: item.product_name || 'Produto',
                  quantityDeducted: reduction,
                  timestamp: new Date().toISOString(),
                  type: 'out'
                });

                if (newQty <= 10) {
                  lowStockAlerts.push({ name: insumoSnap.data()?.name || 'Material', qty: newQty });
                }
              }
            }
          }

          // 3. Kit Items Stock
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              const qtyToDeduct = ki.quantity * item.quantity;

              if (ki.type === 'product') {
                const path = `products/${ki.id}`;
                const prodSnap = snapMap.get(path);
                if (prodSnap && prodSnap.exists) {
                  const pData = prodSnap.data();
                  if (typeof pData?.stock === 'number') {
                    const newStock = Math.max(0, pData.stock - qtyToDeduct);
                    transaction.update(refMap.get(path), { stock: newStock });
                  }
                }
              } else if (ki.type === 'insumo') {
                const pathInsumo = `insumos/${ki.id}`;
                const pathComp = `componentes/${ki.id}`;
                const insumoSnap = snapMap.get(pathInsumo);

                if (insumoSnap && insumoSnap.exists) {
                  const currentQty = insumoSnap.data()?.quantity || 0;
                  const newQty = Math.max(0, currentQty - qtyToDeduct);

                  transaction.update(refMap.get(pathInsumo), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                  if (refMap.has(pathComp)) {
                    transaction.update(refMap.get(pathComp), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                  }

                  const moveRef = dbAdmin.collection("insumo_movements").doc();
                  transaction.set(moveRef, {
                    insumoId: ki.id,
                    insumoName: insumoSnap.data()?.name || 'Material Kit',
                    orderId: orderId,
                    orderCode: orderData.code || orderId,
                    companyId: orderData.companyId || null,
                    productName: `[Kit] ${item.product_name}`,
                    quantityDeducted: qtyToDeduct,
                    timestamp: new Date().toISOString(),
                    type: 'out'
                  });

                  if (newQty <= 10) {
                    lowStockAlerts.push({ name: insumoSnap.data()?.name || 'Material Kit', qty: newQty });
                  }
                }
              } else if (ki.type === 'addon') {
                const path = `addons/${ki.id}`;
                const addonSnap = snapMap.get(path);
                if (addonSnap && addonSnap.exists) {
                  const aData = addonSnap.data();
                  if (typeof aData?.stock === 'number') {
                    const newStock = Math.max(0, aData.stock - qtyToDeduct);
                    transaction.update(refMap.get(path), { stock: newStock });
                  }
                }
              }
            }
          }
        }
      });

      if (alreadyDeducted) {
        res.status(200).json({ success: true, message: "Estoque já havia sido deduzido." });
        return;
      }

      // Send alerts & create audit log
      for (const alert of lowStockAlerts) {
        notifyLowStock(alert.name, alert.qty);
      }

      await createAuditLog('Estoque', 'Baixa por Pedido', orderId, orderData.code || orderId, {
        details: { orderId, code: orderData.code }
      }, orderData.companyId);

      res.status(200).json({ success: true, message: "Estoque deduzido com sucesso." });
    } catch (error: any) {
      console.error("[inventoryController.deductOrderStock] Error:", error);
      if (error.isValidationError) {
        res.status(400).json({
          success: false,
          error: error.message,
          warnings: error.warnings
        });
        return;
      }
      res.status(500).json({ success: false, error: "Erro ao deduzir estoque." });
    }
  },

  /**
   * POST /api/inventory/restore-order
   * Restores products and insumos stock automatically (reversal of deduction).
   */
  restoreOrderStock: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, orderData } = req.body;

      if (!orderId || !orderData) {
        res.status(400).json({ success: false, error: "ID do pedido e dados do pedido são obrigatórios." });
        return;
      }

      const orderRef = dbAdmin.collection("orders").doc(orderId);
      let alreadyRestored = false;

      await dbAdmin.runTransaction(async (transaction) => {
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists || orderSnap.data()?.insumosDeducted !== true) {
          alreadyRestored = true;
          return;
        }

        const refsToRead: any[] = [];
        const refMap = new Map<string, any>(); // path -> ref

        const addRef = (colName: string, id: string) => {
          const path = `${colName}/${id}`;
          if (!refMap.has(path)) {
            const ref = dbAdmin.collection(colName).doc(id);
            refMap.set(path, ref);
            refsToRead.push(ref);
          }
        };

        const items = orderData.items || [];
        for (const item of items) {
          if (item.productId && !item.isKit) {
            addRef("products", item.productId);
          }
          if (item.insumos && item.insumos.length > 0 && !item.isKit) {
            for (const requiredInsumo of item.insumos) {
              addRef("insumos", requiredInsumo.insumoId);
              addRef("componentes", requiredInsumo.insumoId);
            }
          }
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              if (ki.type === "product") {
                addRef("products", ki.id);
              } else if (ki.type === "insumo") {
                addRef("insumos", ki.id);
                addRef("componentes", ki.id);
              } else if (ki.type === "addon") {
                addRef("addons", ki.id);
              }
            }
          }
        }

        // Fetch all dependencies at once
        const snaps = refsToRead.length > 0 ? await transaction.getAll(...refsToRead) : [];
        const snapMap = new Map<string, any>();
        snaps.forEach((snap, idx) => {
          snapMap.set(refsToRead[idx].path, snap);
        });

        // Update order deduction state
        transaction.update(orderRef, { insumosDeducted: false });

        // Restore stocks & Log reversal movements
        for (const item of items) {
          // 1. Regular Product Stock
          if (item.productId && !item.isKit) {
            const path = `products/${item.productId}`;
            const prodSnap = snapMap.get(path);
            if (prodSnap && prodSnap.exists) {
              const pData = prodSnap.data();
              if (typeof pData?.stock === 'number') {
                const newStock = pData.stock + (item.quantity || 1);
                transaction.update(refMap.get(path), { stock: newStock });
              }
            }
          }

          // 2. Regular Product Insumos
          if (item.insumos && item.insumos.length > 0 && !item.isKit) {
            for (const requiredInsumo of item.insumos) {
              const pathInsumo = `insumos/${requiredInsumo.insumoId}`;
              const pathComp = `componentes/${requiredInsumo.insumoId}`;
              const insumoSnap = snapMap.get(pathInsumo);

              if (insumoSnap && insumoSnap.exists) {
                const currentQty = insumoSnap.data()?.quantity || 0;
                const addition = requiredInsumo.quantity * item.quantity;
                const newQty = currentQty + addition;

                transaction.update(refMap.get(pathInsumo), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                if (refMap.has(pathComp)) {
                  transaction.update(refMap.get(pathComp), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                }

                // Log inbound recovery movement
                const moveRef = dbAdmin.collection("insumo_movements").doc();
                transaction.set(moveRef, {
                  insumoId: requiredInsumo.insumoId,
                  insumoName: insumoSnap.data()?.name || 'Material',
                  orderId: orderId,
                  orderCode: orderData.code || orderId,
                  companyId: orderData.companyId || null,
                  productName: item.product_name || 'Produto',
                  quantityDeducted: addition,
                  timestamp: new Date().toISOString(),
                  type: 'in'
                });
              }
            }
          }

          // 3. Kit Items Stock
          if (item.isKit && item.kitItems && item.kitItems.length > 0) {
            for (const ki of item.kitItems) {
              const qtyToRestore = ki.quantity * item.quantity;

              if (ki.type === 'product') {
                const path = `products/${ki.id}`;
                const prodSnap = snapMap.get(path);
                if (prodSnap && prodSnap.exists) {
                  const pData = prodSnap.data();
                  if (typeof pData?.stock === 'number') {
                    const newStock = pData.stock + qtyToRestore;
                    transaction.update(refMap.get(path), { stock: newStock });
                  }
                }
              } else if (ki.type === 'insumo') {
                const pathInsumo = `insumos/${ki.id}`;
                const pathComp = `componentes/${ki.id}`;
                const insumoSnap = snapMap.get(pathInsumo);

                if (insumoSnap && insumoSnap.exists) {
                  const currentQty = insumoSnap.data()?.quantity || 0;
                  const newQty = currentQty + qtyToRestore;

                  transaction.update(refMap.get(pathInsumo), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                  if (refMap.has(pathComp)) {
                    transaction.update(refMap.get(pathComp), { quantity: newQty, updatedAt: FieldValue.serverTimestamp() });
                  }

                  const moveRef = dbAdmin.collection("insumo_movements").doc();
                  transaction.set(moveRef, {
                    insumoId: ki.id,
                    insumoName: insumoSnap.data()?.name || 'Material Kit',
                    orderId: orderId,
                    orderCode: orderData.code || orderId,
                    companyId: orderData.companyId || null,
                    productName: `[Kit] ${item.product_name}`,
                    quantityDeducted: qtyToRestore,
                    timestamp: new Date().toISOString(),
                    type: 'in'
                  });
                }
              } else if (ki.type === 'addon') {
                const path = `addons/${ki.id}`;
                const addonSnap = snapMap.get(path);
                if (addonSnap && addonSnap.exists) {
                  const aData = addonSnap.data();
                  if (typeof aData?.stock === 'number') {
                    const newStock = aData.stock + qtyToRestore;
                    transaction.update(refMap.get(path), { stock: newStock });
                  }
                }
              }
            }
          }
        }
      });

      if (alreadyRestored) {
        res.status(200).json({ success: true, message: "Estoque já havia sido restaurado." });
        return;
      }

      await createAuditLog('Estoque', 'Restauração de Estoque', orderId, orderData.code || orderId, {
        details: { orderId, code: orderData.code }
      }, orderData.companyId);

      res.status(200).json({ success: true, message: "Estoque restaurado com sucesso." });
    } catch (error: any) {
      console.error("[inventoryController.restoreOrderStock] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao restaurar estoque." });
    }
  }
};
