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

  const { companyId, customerName, customerCpfCnpj, contact, items, total } = body;

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
    if (!item.id || !item.product_name || typeof item.quantity !== "number" || item.quantity <= 0) {
      return "Itens do carrinho inválidos ou incompletos.";
    }
  }

  if (typeof total !== "number" || total <= 0) {
    return "Valor total do pedido inválido.";
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

export const checkoutController = {
  /**
   * POST /api/checkout/create-order
   * Creates a new order in Firestore using the Firebase Admin SDK.
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
        total,
        deliveryType = "delivery",
        shippingCost = 0,
        address = "",
        isEmergency = false,
        isWholesale = false,
        observations = "",
      } = req.body;

      // 1. Generate unique order code
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
        items,
        total,
        status: "novo pedido", // default initial status
        deliveryType,
        shippingCost,
        address,
        customerAddress: address,
        isEmergency: isEmergency || false,
        isWholesale: isWholesale || false,
        deliveryDate: deliveryDateStr,
        paymentStatus: "pending",
        source: "catalog",
        observations: observations || "",
        createdAt: new Date(), // Stored as ISO Date / Timestamp by Admin SDK
        updatedAt: new Date(),
      };

      // 2. Persist to Firestore via Firebase Admin SDK
      // Use the generated code as the document ID for absolute consistency
      const orderRef = dbAdmin.collection("orders").doc(orderCode);
      await orderRef.set({
        ...orderData,
        id: orderCode, // Ensure document ID is self-referenced
      });

      console.log(`[checkoutController.createOrder] Created order successfully. ID: ${orderCode}`);

      res.status(201).json({
        success: true,
        orderId: orderCode,
        code: orderCode,
        message: "Pedido criado com sucesso.",
      });
    } catch (error: any) {
      console.error("[checkoutController.createOrder] Error creating order:", error);
      res.status(500).json({
        success: false,
        error: "Ocorreu um erro interno ao criar o pedido.",
        details: error.message,
      });
    }
  },
};
