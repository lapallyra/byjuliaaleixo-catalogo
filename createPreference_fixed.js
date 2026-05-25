const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { MercadoPagoConfig, Preference } = require("mercadopago");

exports.createPreference = onCall(
  {
    cors: true,
    enforceAppCheck: false,
  },
  async (req) => {
    try {
      console.log("Starting createPreference");
      console.log(req.body); // Fallback to raw if using express, but in onCall data is in req.data
      console.log("req.body", req.data);
      console.log("Auth context:", req.auth);

      // 1. Validação do Access Token
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        console.error(
          "ERRO: MERCADOPAGO_ACCESS_TOKEN não está definido nas variáveis de ambiente!",
        );
        throw new HttpsError(
          "failed-precondition",
          "MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.",
        );
      }

      // 2. Validação do body/data recebido
      if (
        !req.data ||
        !req.data.items ||
        req.data.items.length === 0
      ) {
        console.error(
          "ERRO: Nenhum 'items' foi recebido do frontend.",
          req.data,
        );
        throw new HttpsError(
          "invalid-argument",
          "Carrinho vazio ou formato incorreto.",
        );
      }

      // Inicializa o Mercado Pago v2
      const client = new MercadoPagoConfig({
        accessToken: accessToken,
        options: { timeout: 10000 },
      });
      console.log("Mercado Pago initialized");

      const preference = new Preference(client);

      console.log("Creating preference...");

      // 3. Monta e valida o payload da preferência
      const preferenceData = {
        body: {
          items: req.data.items,
          payer: req.data.payer || undefined,
          external_reference: req.data.orderId,
          metadata: {
            companyId: req.data.companyId,
          },
          back_urls: req.data.back_urls,
          auto_return: req.data.auto_return,
        },
      };

      console.log("preferenceData");
      console.log(preferenceData);

      // 4. Criação da preferência na API do MP
      const result = await preference.create(preferenceData);

      console.log("Preference created");
      console.log("Preference result:", result);
      console.log("init_point");
      console.log(result.init_point);

      // Retorna exatamente o que o frontend espera
      return {
        init_point: result.init_point,
        id: result.id,
      };
    } catch (error) {
      console.error(error);
      console.error(error.response?.data);
      console.error(error.stack);

      // Extract serializable details
      let errorDetails = "N/A";
      if (error.response && error.response.data) {
        errorDetails = error.response.data;
      } else if (error.cause) {
        errorDetails = String(error.cause);
      }

      throw new HttpsError(
        "invalid-argument",
        `Erro MP: ${error.message || "Erro desconhecido"}`,
        errorDetails,
      );
    }
  },
);
