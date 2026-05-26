import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items, orderId, customer } = req.body;

    if (!items || !orderId) {
      return res.status(400).json({ error: "Missing items or orderId" });
    }

    const preferenceBody = {
      items: items.map((item: any) => ({
        title: item.title,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        currency_id: "BRL",
      })),

      external_reference: orderId,

      payer: customer
        ? {
            name: customer.name,
            email: customer.email,
          }
        : undefined,

      back_urls: {
        success: `${process.env.FRONTEND_URL}/success`,
        failure: `${process.env.FRONTEND_URL}/failure`,
        pending: `${process.env.FRONTEND_URL}/pending`,
      },

      auto_return: "approved",

      notification_url: `${process.env.FRONTEND_URL}/api/webhook`,
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferenceBody),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "Mercado Pago error",
        details: data,
      });
    }

    return res.status(200).json({
      init_point: data.init_point,
      preference_id: data.id,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
}