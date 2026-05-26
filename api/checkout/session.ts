import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const sessionId = randomUUID();

  // aqui só cria a sessão inicial
  return res.status(200).json({
    sessionId
  });
}