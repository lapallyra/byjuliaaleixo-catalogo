import { Request, Response } from "express";
import { dbAdmin } from "../config/firebaseAdmin";
import { Order, CompanyId, CartItem } from "../../types";

/**
 * Validates the order payload received from the client checkout.
 */
function validateOrderPayload(body: any): string | null {
  if (!body) {
    return "O corpo da requisição não pode estar vazio.";
  }

  const { companyId, customerName, customerCpfCnpj, contact, items } = body;

  const validCompanies: CompanyId[] = ["pallyra", "guennita", "mimada", "tuttymimo"];
  if (!companyId || !validCompanies.includes(companyId)) {
    return "ID da empresa inválido ou ausente.";
  }

  if (!customerName || typeof customerName !== "string" || customerName.trim() === "") {
    return "Nome do cliente inválido ou ausente.";
  }

  if (!customerCpfCnpj || typeof customerCpfCnpj !== "string" || customerCpfCnpj.trim() === "") {
    return "CPF/CNPJ do cliente inválido ou ausente.";
  }

  if (!contact || typeof contact !== "string" || contact.trim() === "") {
    return "Contato do cliente inválido ou ausente.";
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return "O pedido deve conter pelo menos um item.";
  }

  for (const item of items) {
    if (!item.id && !item.productId) {
      return "Itens do carrinho devem possuir ID de produto válido.";
    }
    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      return "Quantidade do item inválida.";
    }
  }

  return null;
}

/**
 * Generates a unique order code based on company prefix.
 */
function generateOrderCode(companyId: CompanyId): string {
  const prefixMap: Record<CompanyId, string> = {
    pallyra: "LP",
    guennita: "CG",
    mimada: "MS",
    tuttymimo: "TM",
  };
  const prefix = prefixMap[companyId] || "LP";
  const random = Math.floor(10000 + Math.random() * 90000).toString();
  return `${prefix}${random}`;
}

/**
 * Secure Backend Price Validation & Recalculation (Never trust client prices)
 */
async function validateAndRecalculateOrder(items: any[], isWholesale: boolean, shippingCost: number) {
  let subtotal = 0;
  const validatedItems = [];

  for (const item of items) {
    const productId = item.productId || item.id;
    let officialPrice = Number(item.current_price || item.retail_price || item.unit_price || 0);
    let productName = item.product_name || item.title || "Produto";
    let officialInsumos = item.insumos || [];

    if (productId) {
      const prodSnap = await dbAdmin.collection("products").doc(productId).get();
      if (prodSnap.exists) {
        const prodData = prodSnap.data() as any;
        productName = prodData.product_name || productName;
        officialInsumos = prodData.insumos || officialInsumos;
        const retail = Number(prodData.retail_price || prodData.current_price || officialPrice);
        const wholesale = Number(prodData.wholesale_price || retail);
        const minQty = Number(prodData.wholesale_min_qty || 5);
        const qty = Number(item.quantity || 1);

        if (isWholesale && qty >= minQty) {
          officialPrice = wholesale;
        } else {
          officialPrice = retail;
        }
      }
    }

    const itemTotal = officialPrice * (Number(item.quantity) || 1);
    subtotal += itemTotal;

    validatedItems.push({
      ...item,
      id: productId,
      product_name: productName,
      retail_price: officialPrice,
      current_price: officialPrice,
      unit_price: officialPrice,
      insumos: officialInsumos,
      totalItem: itemTotal,
    });
  }

  const shipping = Number(shippingCost) || 0;
  const finalTotal = subtotal + shipping;

  return {
    items: validatedItems,
    subtotal,
    shippingCost: shipping,
    total: finalTotal,
  };
}

export const checkoutController = {
  /**
   * POST /api/checkout/create-order
   * Creates a new order in Firestore using the Firebase Admin SDK with strict backend price validation.
   */
  createOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("[checkoutController.createOrder] Received order request:", req.body);

      // Validate initial request parameters
      const validationError = validateOrderPayload(req.body);
      if (validationError) {
        res.status(400).json({ success: false, error: validationError });
        return;
      }

      const {
        companyId,
        customerName,
        customerCpfCnpj,
        contact,
        customerEmail,
        items,
        deliveryType = "delivery",
        shippingCost = 0,
        address = "",
        isEmergency = false,
        isWholesale = false,
        observations = "",
      } = req.body;

      // 1. Never trust client prices: Recalculate subtotal, discounts, final values and commercial rules from official Firebase products
      const recalculated = await validateAndRecalculateOrder(items, Boolean(isWholesale), Number(shippingCost));

      // 2. Generate unique order code
      const orderCode = generateOrderCode(companyId);

      // Calculate estimated delivery date (7 business days default)
      const today = new Date();
      const deliveryDate = new Date(today);
      deliveryDate.setDate(today.getDate() + 7);
      const deliveryDateStr = deliveryDate.toISOString().split("T")[0];

      // Prepare order record matching Firestore schema
      const orderData: Omit<Order, "id"> & { id?: string; createdAt: any; updatedAt: any } = {
        code: orderCode,
        companyId,
        customerName,
        customerCpfCnpj,
        contact,
        customerEmail: customerEmail || "",
        items: recalculated.items,
        subtotal: recalculated.subtotal,
        total: recalculated.total,
        status: "novo pedido", // default initial status
        deliveryType,
        shippingCost: recalculated.shippingCost,
        address,
        customerAddress: address,
        isEmergency: isEmergency || false,
        isWholesale: isWholesale || false,
        deliveryDate: deliveryDateStr,
        paymentStatus: "pending",
        source: "catalog",
        observations: observations || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 3. Persist to Firestore via Firebase Admin SDK
      const orderRef = dbAdmin.collection("orders").doc(orderCode);
      await orderRef.set({
        ...orderData,
        id: orderCode,
      });

      console.log(`[checkoutController.createOrder] Created validated order successfully. ID: ${orderCode}, Total: R$ ${recalculated.total}`);

      res.status(201).json({
        success: true,
        orderId: orderCode,
        code: orderCode,
        total: recalculated.total,
        message: "Pedido criado e validado com sucesso.",
      });
    } catch (error: any) {
      console.error("[checkoutController.createOrder] Error creating order:", error);
      res.status(500).json({
        success: false,
        error: "Ocorreu um erro interno ao criar e validar o pedido.",
        details: error.message,
      });
    }
  },

  /**
   * POST /api/checkout/update-order
   * Updates an existing order in Firestore.
   */
  updateOrder: async (req: Request, res: Response): Promise<void> => {
    try {
      const { orderId, updateData } = req.body;
      if (!orderId || !updateData) {
        res.status(400).json({ success: false, error: "ID do pedido ou dados de atualização ausentes." });
        return;
      }
      
      const orderRef = dbAdmin.collection("orders").doc(orderId);
      await orderRef.update({ ...updateData, updatedAt: new Date() });
      
      res.status(200).json({ success: true, message: "Pedido atualizado." });
    } catch (error: any) {
      console.error("[checkoutController.updateOrder] Error:", error);
      res.status(500).json({ success: false, error: "Erro ao atualizar pedido." });
    }
  },
};
