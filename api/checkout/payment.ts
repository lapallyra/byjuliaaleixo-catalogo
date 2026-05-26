export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ error: "sessionId obrigatório" });
  }

  // simulação do Mercado Pago (depois conectamos real)
  const paymentUrl = "https://mercadopago.com/checkout/test";

  return res.status(200).json({
    url: paymentUrl
  });
}