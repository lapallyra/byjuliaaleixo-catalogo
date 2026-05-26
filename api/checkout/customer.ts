import { db } from "@/firebase"; // ajuste se seu firebase estiver em outro lugar
import { doc, setDoc } from "firebase/firestore";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { sessionId, name, phone, address } = req.body;

  const customerId = randomUUID();

  await setDoc(doc(db, "customers", customerId), {
    sessionId,
    name,
    phone,
    address,
    createdAt: new Date()
  });

  return res.status(200).json({ customerId });
}