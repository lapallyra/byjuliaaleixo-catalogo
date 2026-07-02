import express from "express";
import path from "node:path";
import { MercadoPagoConfig, Preference } from "mercadopago";

async function startServer() {
  const app = express();
  const PORT = 3000;
  console.log("Starting server process...");

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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    console.log("Vite dev server created.");
    app.use(vite.middlewares);
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
    // Use regex catch-all to guarantee direct navigation to SPA paths (e.g. /admin) never 404
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
