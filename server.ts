import express from "express";
import path from "node:path";
import { MercadoPagoConfig, Preference } from "mercadopago";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { apiRouter } from "./src/server/routes/api";

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    projectId: "gen-lang-client-0841512066",
  });
}
const dbAdmin = getFirestore("ai-studio-c4cc2b71-da7b-4f2b-a88e-7badffe10d83");

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("Starting server process...");

  // Add JSON body parsing middleware
  app.use(express.json());

  // Mount Checkout and Payment modular routers
  app.use("/api", apiRouter);

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
      let accessToken = req.body.accessToken || process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
      if (!accessToken) {
        const companyId = req.body.companyId || "pallyra";
        const settingsSnap = await dbAdmin.collection("settings").doc(companyId).get();
        if (settingsSnap.exists) {
          accessToken = settingsSnap.data()?.mercadopago_token;
        }
        if (!accessToken) {
          const globalSnap = await dbAdmin.collection("settings").doc("global").get();
          if (globalSnap.exists) {
            accessToken = globalSnap.data()?.mercadopago_token;
          }
        }
      }

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

  app.post("/api/telegram/send", async (req, res) => {
    try {
      const { type, message } = req.body;
      const token = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!token || !chatId) {
        return res.status(500).json({ error: "Telegram credentials not configured on server" });
      }

      // Read config from Firestore using Admin SDK (bypassing security rules)
      const configDoc = await dbAdmin.collection('system_notifications').doc('settings').get();
      const tgConfig = configDoc.exists ? configDoc.data() : null;

      if (tgConfig) {
        if (!tgConfig.telegram_enabled) {
          return res.json({ success: true, status: 'disabled_by_config' });
        }
        
        // Check specific preferences
        const preferences: Record<string, string> = {
          'new_order': 'notify_new_order',
          'payment_confirmed': 'notify_payment_confirmed',
          'order_canceled': 'notify_order_canceled',
          'order_completed': 'notify_order_completed',
          'low_stock': 'notify_low_stock',
          'new_client': 'notify_new_client'
        };

        const prefKey = preferences[type];
        if (prefKey && tgConfig[prefKey] === false) {
          return res.json({ success: true, status: 'muted_by_preference' });
        }
      }

      const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        }),
      });

      if (response.ok) {
        res.json({ success: true });
      } else {
        const err = await response.text();
        res.status(response.status).json({ error: err });
      }
    } catch (error: any) {
      console.error("Error sending Telegram message:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("Vite dev server created.");
    app.use(vite.middlewares);

    // Fallback for SPA routing in development
    app.get(/.*/, async (req, res, next) => {
      // Don't intercept API calls or static assets/file requests with extensions
      if (req.originalUrl.startsWith("/api") || req.originalUrl.includes(".")) {
        return next();
      }
      try {
        const fs = await import("node:fs");
        let template = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        // Apply Vite HTML transforms (e.g. injecting react-refresh, etc.)
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    // Production static serving with robust path resolution
    let distPath = path.join(process.cwd(), 'dist');
    
    // Support running from inside 'dist' directly or via custom bundlers
    if (process.cwd().endsWith('dist') || process.cwd().endsWith('dist/')) {
      distPath = process.cwd();
    } else if (typeof __dirname !== 'undefined') {
      distPath = __dirname.endsWith('dist') ? __dirname : path.join(__dirname, 'dist');
    }

    console.log(`Production mode: serving static files from resolved path: "${distPath}"`);

    app.use(express.static(distPath));
    // Use standard catch-all to guarantee direct navigation to SPA paths (e.g. /admin) never 404
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'), (err) => {
        if (err) {
          console.error(`Error sending index.html from "${distPath}":`, err);
          res.status(404).send("Error: index.html not found. Please ensure the app is fully built.");
        }
      });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
