import { Request, Response } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import { dbAdmin } from "../config/firebaseAdmin";
import { Order } from "../../types";

/**
 * Controller for managing payment-related processes, including preference generation
 * and payment provider webhook callbacks.
 */
export const paymentController = {
  /**
   * POST /api/payment/create-preference
   * Creates a payment preference/session for Mercado Pago.
   * Verifies the order first in Firestore using the Admin SDK.
   */
  createPreference: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("[paymentController.createPreference] Received payload:", req.body);
      const { orderId } = req.body;

      if (!orderId || typeof orderId !== "string") {
        res.status(400).json({
          success: false,
          error: "O ID do pedido é obrigatório e deve ser uma string.",
        });
        return;
      }

      // 1. Fetch the order using Firebase Admin SDK to ensure legitimacy and security
      const orderRef = dbAdmin.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        res.status(404).json({
          success: false,
          error: `Pedido com o ID '${orderId}' não foi encontrado no sistema.`,
        });
        return;
      }

      const orderData = orderSnap.data() as Order;

      // 2. Perform validation on order details
      if (!orderData.items || orderData.items.length === 0) {
        res.status(400).json({
          success: false,
          error: "O pedido associado não possui itens válidos para pagamento.",
        });
        return;
      }

      const totalValue = orderData.total || 0;
      if (totalValue <= 0) {
        res.status(400).json({
          success: false,
          error: "O valor total do pedido deve ser maior que zero.",
        });
        return;
      }

      console.log(`[paymentController.createPreference] Order '${orderId}' verified. Total: R$ ${totalValue}`);

      // 3. Initialize Mercado Pago with dynamic key from environment (Lazy initialization to prevent app crash if missing)
      const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("O token de acesso do Mercado Pago (MP_ACCESS_TOKEN) não está configurado nas variáveis de ambiente.");
      }

      const client = new MercadoPagoConfig({
        accessToken: accessToken,
      });
      const mpPreference = new Preference(client);

      // 4. Map cart items from order data for preference creation
      const items = orderData.items.map((item) => {
        const itemPrice = typeof item.current_price === "number" ? item.current_price : (typeof item.retail_price === "number" ? item.retail_price : 0);
        return {
          id: item.id || item.code || `item_${Math.random().toString(36).substr(2, 9)}`,
          title: item.product_name,
          quantity: Number(item.quantity) || 1,
          unit_price: Number(itemPrice) || 0,
          currency_id: "BRL",
        };
      });

      // Include shipping as an item if present and > 0
      if (orderData.shippingCost && orderData.shippingCost > 0) {
        items.push({
          id: "shipping_cost",
          title: `Frete - ${orderData.deliveryType || "Entrega"}`,
          quantity: 1,
          unit_price: Number(orderData.shippingCost),
          currency_id: "BRL",
        });
      }

      // 5. Determine base URL origin for redirection
      const origin = req.get("origin") || req.get("referer") || "https://ais-pre-eufupgb5rvr3qh75xja6pl-583398540969.us-east1.run.app";

      const preferenceData = {
        body: {
          items,
          external_reference: orderData.code || orderId,
          payer: {
            name: orderData.customerName,
            email: orderData.customerEmail || "cliente@exemplo.com",
          },
          back_urls: {
            success: `${origin}/checkout/${orderId}`,
            failure: `${origin}/checkout/${orderId}`,
            pending: `${origin}/checkout/${orderId}`,
          },
          auto_return: "approved",
          metadata: {
            orderId: orderId,
            companyId: orderData.companyId,
          },
        },
      };

      console.log("[paymentController.createPreference] Creating preference via official Mercado Pago SDK...");
      const result = await mpPreference.create(preferenceData);

      console.log("[paymentController.createPreference] Preference created successfully with ID:", result.id);

      res.status(200).json({
        success: true,
        preferenceId: result.id,
        initPoint: result.init_point,
        message: "Preferência de pagamento criada com sucesso.",
      });
    } catch (error: any) {
      console.error("[paymentController.createPreference] Error:", error);
      res.status(500).json({
        success: false,
        error: "Ocorreu um erro interno ao gerar a preferência de pagamento.",
        details: error.message,
      });
    }
  },

  /**
   * POST /api/payment/webhook
   * Webhook endpoint to receive notification triggers from Mercado Pago (IPN / Webhooks).
   * Validates notification, queries the official SDK for full payment status, handles order state changes,
   * registers financial transactions, logs audits, and avoids duplicate processing.
   */
  webhook: async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("[paymentController.webhook] Received webhook event payload:", JSON.stringify(req.body));
      console.log("[paymentController.webhook] Headers:", JSON.stringify(req.headers));

      // 1. Initial request validation (Check query params or body)
      // Mercado Pago webhooks can be:
      // - Body (v1+): { action: "payment.created" / "payment.updated", type: "payment", data: { id: "12345" } }
      // - Query (IPN): ?topic=payment&id=12345
      const action = req.body?.action || req.query?.action || "payment.updated";
      const paymentId = req.body?.data?.id || req.query?.id || req.body?.id;
      const type = req.body?.type || req.query?.topic || "payment";

      if (!paymentId) {
        console.log("[paymentController.webhook] Missing payment ID. Responding 200 to acknowledge receipt.");
        res.status(200).json({
          success: true,
          message: "Recebido, porém ID do pagamento ausente.",
        });
        return;
      }

      // Filter events to only process payment types
      if (type !== "payment") {
        console.log(`[paymentController.webhook] Non-payment event type '${type}' ignored.`);
        res.status(200).json({
          success: true,
          message: `Evento do tipo '${type}' ignorado. Apenas processamos eventos de pagamento.`,
        });
        return;
      }

      console.log(`[paymentController.webhook] Processing real payment update: ID '${paymentId}', Action '${action}'`);

      // 2. Initialize Mercado Pago SDK dynamically (lazy load to prevent crashes if key is not set)
      const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("O token de acesso do Mercado Pago (MP_ACCESS_TOKEN) não está configurado nas variáveis de ambiente.");
      }

      const client = new MercadoPagoConfig({
        accessToken: accessToken,
      });
      const payment = new Payment(client);

      // 3. Query payment details from official Mercado Pago API
      console.log(`[paymentController.webhook] Querying payment details for ID: ${paymentId}`);
      let paymentDetails;
      try {
        paymentDetails = await payment.get({ id: String(paymentId) });
      } catch (mpError: any) {
        console.error(`[paymentController.webhook] Error fetching payment ${paymentId} from MP API:`, mpError);
        // We return a 400 or 500 so MP will retry sending the webhook later if it was a transient error
        res.status(500).json({
          success: false,
          error: "Erro ao consultar detalhes do pagamento no Mercado Pago.",
          details: mpError.message,
        });
        return;
      }

      const externalReference = paymentDetails.external_reference;
      const paymentStatus = paymentDetails.status;
      const statusDetail = paymentDetails.status_detail;

      console.log(`[paymentController.webhook] MP Payment Details - ExtRef: '${externalReference}', Status: '${paymentStatus}', Detail: '${statusDetail}'`);

      if (!externalReference) {
        console.warn(`[paymentController.webhook] Payment ${paymentId} has no external_reference. Responding with 200.`);
        res.status(200).json({
          success: true,
          message: "Notificação recebida, mas o pagamento não possui external_reference para associar ao pedido.",
        });
        return;
      }

      // 4. Locate order in Firestore (First by document ID, then fallback to 'code' query)
      const orderRef = dbAdmin.collection("orders").doc(externalReference);
      let orderSnap = await orderRef.get();
      let orderDocId = externalReference;

      if (!orderSnap.exists) {
        console.log(`[paymentController.webhook] Order ID '${externalReference}' not found directly. Querying by 'code'...`);
        const querySnap = await dbAdmin.collection("orders").where("code", "==", externalReference).limit(1).get();
        if (querySnap.empty) {
          console.error(`[paymentController.webhook] Associated order not found for external_reference '${externalReference}'.`);
          res.status(404).json({
            success: false,
            error: `Pedido associado '${externalReference}' não encontrado no sistema.`,
          });
          return;
        }
        orderSnap = querySnap.docs[0];
        orderDocId = orderSnap.id;
      }

      const orderData = orderSnap.data() as any;
      console.log(`[paymentController.webhook] Order found. Doc ID: '${orderDocId}', Code: '${orderData.code}', Current Payment Status: '${orderData.paymentStatus}'`);

      // 5. Prevent duplicate processing
      const webhookLogs = orderData.webhookLogs || [];
      const alreadyProcessed = webhookLogs.some((log: any) => String(log.paymentId) === String(paymentId) && log.approved === true);

      if (alreadyProcessed || orderData.paymentStatus === "paid") {
        console.log(`[paymentController.webhook] Payment ID ${paymentId} has already been fully processed for order '${externalReference}'. Skipping duplicate.`);
        res.status(200).json({
          success: true,
          message: "Esta transação já foi processada anteriormente. Duplicata ignorada com sucesso.",
        });
        return;
      }

      // 6. Update order only after official confirmation of payment
      if (paymentStatus === "approved") {
        console.log(`[paymentController.webhook] Payment confirmed as 'approved' for order '${externalReference}'. Updating status and registering finance.`);

        // Update the order status to approved/paid
        await dbAdmin.collection("orders").doc(orderDocId).update({
          paymentStatus: "paid",
          status: "approved",
          updatedAt: new Date(),
          webhookLogs: FieldValue.arrayUnion({
            paymentId,
            action: "approved",
            statusDetail: statusDetail || "accredited",
            receivedAt: new Date().toISOString(),
            approved: true,
          }),
        });

        // Register transaction in finance collection
        await dbAdmin.collection("finance").add({
          type: "revenue",
          category: "Venda de Produto",
          description: `Venda via Mercado Pago - Pedido ${orderData.code || externalReference}`,
          value: Number(paymentDetails.transaction_amount || orderData.total || 0),
          date: new Date().toISOString().split("T")[0],
          status: "paid",
          companyId: orderData.companyId || "pallyra",
          orderId: orderDocId,
          createdAt: new Date(),
        });

        // Register event in audit logs
        await dbAdmin.collection("audit_logs").add({
          module: "Pedidos",
          action: "Webhook (Aprovado)",
          documentId: orderDocId,
          description: `Pagamento aprovado via Webhook Mercado Pago. ID: ${paymentId}. Status do pedido atualizado para aprovado/pago.`,
          companyId: orderData.companyId || "pallyra",
          createdAt: new Date(),
        });

        console.log(`[paymentController.webhook] Order '${externalReference}' successfully updated to approved/paid.`);
      } else {
        console.log(`[paymentController.webhook] Payment status is '${paymentStatus}' (not 'approved'). Logging event and leaving order status unchanged.`);
        
        // Log the unapproved event in webhookLogs to keep track of payment attempts
        await dbAdmin.collection("orders").doc(orderDocId).update({
          webhookLogs: FieldValue.arrayUnion({
            paymentId,
            action: paymentStatus,
            statusDetail: statusDetail || "pending_or_other",
            receivedAt: new Date().toISOString(),
            approved: false,
          }),
          updatedAt: new Date(),
        });

        // Log to audit logs for transparency
        await dbAdmin.collection("audit_logs").add({
          module: "Pedidos",
          action: "Webhook (Atualização de Status)",
          documentId: orderDocId,
          description: `Notificação recebida do Mercado Pago com status '${paymentStatus}'. ID: ${paymentId}. Pedido inalterado.`,
          companyId: orderData.companyId || "pallyra",
          createdAt: new Date(),
        });
      }

      // Always return 200 OK when processed correctly
      res.status(200).json({
        success: true,
        message: `Webhook processado com sucesso. Status do pagamento: ${paymentStatus}.`,
        paymentId,
        status: paymentStatus,
      });
    } catch (error: any) {
      console.error("[paymentController.webhook] Unexpected error handling webhook:", error);
      res.status(500).json({
        success: false,
        error: "Erro interno no servidor ao processar o webhook.",
        details: error.message,
      });
    }
  },
};
