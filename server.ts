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
    console.log('HIT /api/sendTelegram');
    console.log("----------------------------------------");
    console.log("HIT /api/sendTelegram POST");
    try {
      const { botToken, chatId, message, inlineButtons } = req.body;
      
      const finalBotToken = botToken || process.env.TELEGRAM_BOT_TOKEN;
      const finalChatId = chatId || process.env.TELEGRAM_CHAT_ID;

      if (!finalBotToken) {
        console.error("Telegram error: Telegram Bot Token is missing or not configured");
        return res.status(200).json({ 
          success: false, 
          message: "Token do Telegram não está configurado." 
        });
      }

      if (!finalChatId) {
        console.error("Telegram error: Telegram Chat ID is missing or not configured");
        return res.status(200).json({ 
          success: false, 
          message: "Chat ID do Telegram não está configurado." 
        });
      }

      if (!message) {
        console.error("Telegram error: Message content is missing");
        return res.status(200).json({ 
          success: false, 
          message: "Mensagem vazia." 
        });
      }

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

      console.log(`Forwarding request to Telegram API: chat_id=${finalChatId}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      // Avoid calling response.json() on invalid responses
      if (!response.ok) {
        let details = "Nenhum detalhe adicional obtido.";
        try {
          const errData = await response.json();
          details = errData.description || JSON.stringify(errData);
        } catch {
          try {
            details = await response.text() || `Status: ${response.status}`;
          } catch {}
        }
        console.error(`Telegram API responded with HTTP error: status=${response.status}, details=${details}`);
        return res.status(200).json({ 
          success: false, 
          message: `O Telegram retornou um erro: ${details}` 
        });
      }

      // Try parsing JSON safely
      let data: any;
      try {
        data = await response.json();
      } catch (jsonErr: any) {
        console.error("Error parsing success payload from Telegram:", jsonErr);
        return res.status(200).json({ 
          success: false, 
          message: "A resposta do Telegram não pôde ser lida como JSON válido." 
        });
      }

      if (!data || !data.ok) {
          console.error("Telegram responded with data.ok == false:", data);
          return res.status(200).json({ 
            success: false, 
            message: data?.description || "Resposta de falha da API do Telegram" 
          });
      }

      console.log("Telegram notification delivered successfully!");
      return res.status(200).json({ 
        success: true, 
        message: "Telegram conectado com sucesso" 
      });
    } catch (error: any) {
      console.error("Critical server error in /api/sendTelegram loop:", error);
      return res.status(200).json({ 
        success: false, 
        message: `Falha interna no servidor ao enviar para o Telegram: ${error.message || "Erro desconhecido"}` 
      });
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
