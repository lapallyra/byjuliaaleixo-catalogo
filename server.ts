import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { MercadoPagoConfig, Preference } from "mercadopago";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON body parsing middleware
  app.use(express.json());

  // Handle CORS and OPTIONS properly to prevent 405s
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.post("/api/createPreference", async (req, res) => {
    console.log("HIT /api/createPreference POST", req.body);
    try {
      const accessToken = req.body.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error("MERCADOPAGO_ACCESS_TOKEN is missing. Please configure it in the Admin Settings.");
      }

      const client = new MercadoPagoConfig({
        accessToken: accessToken,
      });
      const preference = new Preference(client);

      const items = req.body.items || [];
      // Make sure auto_return is correctly passed to Mercado Pago
      const preferenceData = {
        body: {
          items: items.map((item: any) => ({
            title: item.title,
            quantity: item.quantity,
            unit_price: item.unit_price,
            currency_id: item.currency_id,
          })),
          payer: req.body.payer,
          external_reference: req.body.orderId,
          metadata: {
            companyId: req.body.companyId,
          },
          back_urls: req.body.back_urls,
          auto_return: req.body.auto_return,
        },
      };

      const result = await preference.create(preferenceData);
      
      res.json({
        id: result.id,
        init_point: result.init_point,
      });
    } catch (e: any) {
      console.error("========================");
      console.error("API /createPreference Error Caught!");
      console.error("Message:", e.message);
      if (e.response) {
         console.error("Response Data:", e.response.data);
         console.error("Response Status:", e.response.status);
      }
      console.error("Stack:", e.stack);
      console.error("========================");
      res.status(500).json({ error: e.message || "Internal server error" });
    }
  });

  app.post("/api/sendTelegram", async (req, res) => {
    const { botToken, chatId, message, inlineButtons } = req.body;
    
    // Fallback to env vars if not provided in body
    const finalBotToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
    const finalChatId = chatId || process.env.TELEGRAM_CHAT_ID;

    if (!finalBotToken || !finalChatId || !message) {
      return res.status(400).json({ error: "Missing required fields (botToken, chatId, or message)" });
    }

    try {
      const url = `https://api.telegram.org/bot${finalBotToken}/sendMessage`;
      const body: any = {
        chat_id: finalChatId,
        text: message,
        parse_mode: 'HTML'
      };

      if (inlineButtons) {
        body.reply_markup = {
          inline_keyboard: inlineButtons
        };
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      if (!data.ok) {
          console.error("Telegram API Error:", data);
          return res.status(500).json({ error: data.description || "Telegram API Error" });
      }

      res.json({ success: true, message: "Telegram notification sent" });
    } catch (error: any) {
      console.error("Server Telegram error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
