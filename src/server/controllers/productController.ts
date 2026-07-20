import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";
import { Product } from "../../types";

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
    console.error("[createAuditLog] Error in product audit:", error);
  }
};

// Helper to sanitize payload for Firestore (converts undefined values to null or deletes them)
const sanitize = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  if (typeof obj === 'object') {
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const val = obj[key];
        if (val === undefined) {
          continue; // skip undefined keys
        }
        newObj[key] = sanitize(val);
      }
    }
    return newObj;
  }
  return obj;
};

export const productController = {
  /**
   * POST /api/products
   */
  createProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const productData = req.body as Product;
      const { id, ...data } = productData;

      const sanitizedData = sanitize({
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        salesCount: data.salesCount ?? 0,
        clicksCount: data.clicksCount ?? 0
      });

      let finalId = id;
      if (id) {
        await dbAdmin.collection('products').doc(id).set(sanitizedData);
        await createAuditLog(
          'Produtos',
          'Criação',
          id,
          productData.product_name || 'Novo Produto',
          { newData: sanitizedData },
          productData.company
        );
      } else {
        const docRef = await dbAdmin.collection('products').add(sanitizedData);
        finalId = docRef.id;
        await createAuditLog(
          'Produtos',
          'Criação',
          docRef.id,
          productData.product_name || 'Novo Produto',
          { newData: sanitizedData },
          productData.company
        );
      }

      res.status(201).json({ success: true, id: finalId });
    } catch (error: any) {
      console.error("[createProduct] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao criar produto." });
    }
  },

  /**
   * POST /api/products/:id/update
   */
  updateProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      const productData = req.body as Partial<Product>;

      if (!id) {
        res.status(400).json({ success: false, error: "ID do produto é obrigatório." });
        return;
      }

      const prodRef = dbAdmin.collection('products').doc(id);
      const snap = await prodRef.get();
      const oldData = snap.exists ? snap.data() : {};

      const { id: _, ...dataWithoutId } = productData as any;
      const sanitizedData = sanitize({
        ...dataWithoutId,
        updatedAt: FieldValue.serverTimestamp()
      });

      await prodRef.update(sanitizedData);

      // Setup details for pricing change audit if any
      const priceObservations = productData.current_price !== undefined && oldData?.current_price !== productData.current_price
        ? `Alteração de preço: R$ ${oldData?.current_price || 0} -> R$ ${productData.current_price}`
        : undefined;

      await createAuditLog(
        'Produtos',
        'Alteração',
        id,
        productData.product_name || oldData?.product_name || id,
        {
          oldData: oldData,
          newData: { ...oldData, ...sanitizedData },
          details: {
            observations: priceObservations
          }
        },
        productData.company || oldData?.company
      );

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("[updateProduct] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao atualizar produto." });
    }
  },

  /**
   * POST /api/products/:id/delete
   */
  deleteProduct: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({ success: false, error: "ID do produto é obrigatório." });
        return;
      }

      const prodRef = dbAdmin.collection('products').doc(id);
      const snap = await prodRef.get();
      if (!snap.exists) {
        res.status(404).json({ success: false, error: "Produto não encontrado." });
        return;
      }
      const oldData = snap.data() || {};

      // EXCLUSÃO LÓGICA (Soft Delete / Inativar)
      // sets isVisible to false as requested by "exclusão lógica / inativar"
      const updateData = {
        isVisible: false,
        updatedAt: FieldValue.serverTimestamp()
      };
      await prodRef.update(updateData);

      await createAuditLog(
        'Produtos',
        'Exclusão Lógica',
        id,
        oldData.product_name || id,
        { oldData: oldData },
        oldData.company
      );

      res.status(200).json({ success: true });
    } catch (error: any) {
      console.error("[deleteProduct] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao excluir produto." });
    }
  },

  /**
   * GET /api/products/:id/bom
   */
  getProductBOM: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "ID do produto é obrigatório." });
        return;
      }

      const prodRef = dbAdmin.collection('products').doc(id);
      const snap = await prodRef.get();
      if (!snap.exists) {
        res.status(404).json({ success: false, error: "Produto não encontrado." });
        return;
      }

      const product = snap.data() as Product;

      if (product.isKit) {
        const kitItems = product.kitItems || [];
        const items = await Promise.all(
          kitItems.map(async (item) => {
            let detail: any = null;
            let unitCost = 0;
            if (item.type === 'product') {
              const d = await dbAdmin.collection('products').doc(item.id).get();
              if (d.exists) {
                detail = d.data();
                unitCost = detail.current_price || 0;
              }
            } else if (item.type === 'insumo') {
              const d = await dbAdmin.collection('insumos').doc(item.id).get();
              if (d.exists) {
                detail = d.data();
                unitCost = detail.unitValue || detail.unitCost || 0;
              }
            } else if (item.type === 'addon') {
              const d = await dbAdmin.collection('addons').doc(item.id).get();
              if (d.exists) {
                detail = d.data();
                unitCost = detail.price || 0;
              }
            }

            const itemName = detail ? (detail.product_name || detail.name || 'Desconhecido') : 'Desconhecido';
            const unit = detail?.unit || 'unid';

            return {
              id: item.id,
              type: item.type,
              name: itemName,
              unit: unit,
              quantity: item.quantity,
              unitCost: unitCost,
              totalCost: unitCost * item.quantity
            };
          })
        );

        const totalCostCalculated = items.reduce((acc, curr) => acc + curr.totalCost, 0);

        res.status(200).json({
          success: true,
          isKit: true,
          composition: kitItems,
          insumosUtilizados: items,
          custoTotalCalculado: totalCostCalculated
        });
      } else {
        const insumosList = product.insumos || [];
        const items = await Promise.all(
          insumosList.map(async (item) => {
            const d = await dbAdmin.collection('insumos').doc(item.insumoId).get();
            let detail: any = null;
            let unitCost = 0;
            if (d.exists) {
              detail = d.data();
              unitCost = detail.unitCost || 0;
            }

            const itemName = detail ? (detail.name || 'Desconhecido') : 'Desconhecido';
            const unit = detail?.unit || 'unid';

            return {
              insumoId: item.insumoId,
              name: itemName,
              unit: unit,
              quantity: item.quantity,
              unitCost: unitCost,
              totalCost: unitCost * item.quantity
            };
          })
        );

        const totalCostCalculated = items.reduce((acc, curr) => acc + curr.totalCost, 0);

        res.status(200).json({
          success: true,
          isKit: false,
          composition: insumosList,
          insumosUtilizados: items,
          custoTotalCalculado: totalCostCalculated
        });
      }
    } catch (error: any) {
      console.error("[getProductBOM] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao buscar ficha técnica." });
    }
  },

  /**
   * POST /api/products/:id/bom
   */
  updateProductBOM: async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        res.status(400).json({ success: false, error: "ID do produto é obrigatório." });
        return;
      }

      const prodRef = dbAdmin.collection('products').doc(id);
      const snap = await prodRef.get();
      if (!snap.exists) {
        res.status(404).json({ success: false, error: "Produto não encontrado." });
        return;
      }

      const product = snap.data() as Product;

      if (product.isKit) {
        // Validation of payload
        const { kitItems } = req.body;
        if (!kitItems || !Array.isArray(kitItems)) {
          res.status(400).json({ success: false, error: "O campo 'kitItems' é obrigatório e deve ser um array." });
          return;
        }

        // Validate references and quantities
        for (const item of kitItems) {
          if (!item.id || !item.type || typeof item.quantity !== 'number' || item.quantity <= 0) {
            res.status(400).json({ success: false, error: `Item inválido: ${JSON.stringify(item)}. Quantidade deve ser positiva.` });
            return;
          }

          let exists = false;
          if (item.type === 'product') {
            const doc = await dbAdmin.collection('products').doc(item.id).get();
            exists = doc.exists;
          } else if (item.type === 'insumo') {
            const doc = await dbAdmin.collection('insumos').doc(item.id).get();
            exists = doc.exists;
          } else if (item.type === 'addon') {
            const doc = await dbAdmin.collection('addons').doc(item.id).get();
            exists = doc.exists;
          }

          if (!exists) {
            res.status(400).json({ success: false, error: `Referência inexistente para o item de ID ${item.id} e tipo ${item.type}.` });
            return;
          }
        }

        const sanitizedKitItems = sanitize(kitItems);

        // Update the composition in the document
        await prodRef.update({
          kitItems: sanitizedKitItems,
          updatedAt: FieldValue.serverTimestamp()
        });

        // Register Audit Log
        await createAuditLog(
          'Ficha Técnica',
          'Alteração de Ficha Técnica',
          id,
          product.product_name || id,
          {
            oldData: { kitItems: product.kitItems || [] },
            newData: { kitItems: sanitizedKitItems },
            details: { isKit: true }
          },
          product.company
        );

        res.status(200).json({ success: true, message: "Composição do kit atualizada com sucesso." });
      } else {
        // Validation of payload
        const { insumos } = req.body;
        if (!insumos || !Array.isArray(insumos)) {
          res.status(400).json({ success: false, error: "O campo 'insumos' é obrigatório e deve ser um array para produtos fabricados." });
          return;
        }

        // Validate references and quantities
        for (const item of insumos) {
          if (!item.insumoId || typeof item.quantity !== 'number' || item.quantity <= 0) {
            res.status(400).json({ success: false, error: `Item inválido: ${JSON.stringify(item)}. Quantidade deve ser positiva.` });
            return;
          }

          const doc = await dbAdmin.collection('insumos').doc(item.insumoId).get();
          if (!doc.exists) {
            res.status(400).json({ success: false, error: `Insumo com ID ${item.insumoId} não existe no banco de dados.` });
            return;
          }
        }

        const sanitizedInsumos = sanitize(insumos);

        // Update the composition in the document
        await prodRef.update({
          insumos: sanitizedInsumos,
          updatedAt: FieldValue.serverTimestamp()
        });

        // Register Audit Log
        await createAuditLog(
          'Ficha Técnica',
          'Alteração de Ficha Técnica',
          id,
          product.product_name || id,
          {
            oldData: { insumos: product.insumos || [] },
            newData: { insumos: sanitizedInsumos },
            details: { isKit: false }
          },
          product.company
        );

        res.status(200).json({ success: true, message: "Ficha técnica atualizada com sucesso." });
      }
    } catch (error: any) {
      console.error("[updateProductBOM] Error:", error);
      res.status(500).json({ success: false, error: error.message || "Erro interno ao atualizar ficha técnica." });
    }
  }
};
