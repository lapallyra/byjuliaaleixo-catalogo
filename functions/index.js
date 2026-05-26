const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const axios = require("axios");

exports.createPreference = onRequest(async (req, res) => {
  try {
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");

    if (req.method === "OPTIONS") {
      return res.status(204).send("");
    }

    logger.info("BODY RECEBIDO:", req.body);

    const { items, payer, back_urls, orderId } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Itens inválidos" });
    }

    const preference = {
      items: items.map((item) => ({
        title: item.title || "Produto",
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        currency_id: "BRL",
      })),

      payer: {
        name: payer?.name || "Cliente",
        email: payer?.email || "test@test.com",
        identification: {
          type: "CPF",
          number: payer?.identification?.number || "00000000000",
        },
      },

      back_urls,
      auto_return: "approved",
      external_reference: orderId,
    };

    const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

    if (!MP_ACCESS_TOKEN) {
      throw new Error("Token do Mercado Pago não configurado");
    }

    const mpResponse = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      preference,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({
      id: mpResponse.data.id,
      init_point: mpResponse.data.init_point,
    });

  } catch (error) {
    logger.error(error);
    return res.status(500).json({
      error: "Erro ao criar preferência",
      details: error.message,
    });
  }
});