const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { MercadoPagoConfig, Preference } = require("mercadopago");

exports.createPreference = onCall(
  {
    cors: true,
    enforceAppCheck: false
  },
  async (request) => {
    try {
      console.log("Starting createPreference");
      console.log("Request body:", request.data);
      console.log("Auth context:", request.auth);

      // 1. Validação do Access Token
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        console.error("ERRO: MERCADOPAGO_ACCESS_TOKEN não está definido nas variáveis de ambiente!");
        throw new HttpsError("failed-precondition", "MERCADOPAGO_ACCESS_TOKEN não configurado no servidor.");
      }

      // 2. Validação do body/data recebido
      if (!request.data || !request.data.items || request.data.items.length === 0) {
        console.error("ERRO: Nenhum 'items' foi recebido do frontend.", request.data);
        throw new HttpsError("invalid-argument", "Carrinho vazio ou formato incorreto.");
      }

      // Inicializa o Mercado Pago v2
      const client = new MercadoPagoConfig({ 
        accessToken: accessToken,
        options: { timeout: 10000 }
      });
      console.log("Mercado Pago initialized");

      const preference = new Preference(client);

      console.log("Creating preference...");
      
      // 3. Monta e valida o payload da preferência
      const preferencePayload = {
        body: {
          items: request.data.items,
          payer: request.data.payer || undefined,
          external_reference: request.data.orderId,
          metadata: {
            companyId: request.data.companyId
          },
          back_urls: request.data.back_urls,
          auto_return: request.data.auto_return
        }
      };

      console.log("Preference payload sending to MP:", JSON.stringify(preferencePayload));

      // 4. Criação da preferência na API do MP
      const result = await preference.create(preferencePayload);
      
      console.log("Preference created");
      console.log("Preference result:", result);

      // Retorna exatamente o que o frontend espera
      return {
        init_point: result.init_point,
        id: result.id
      };

    } catch (error) {
      console.error(error);
      console.error("Erro detalhado na Function:", error.message);
      
      if (error.cause) {
        console.error("Causa original:", error.cause);
      }

      // IMPORTANTE: Não usar "internal" pois o Firebase oculta a mensagem no frontend!
      // Usar "unknown" ou "aborted" permite que o client veja o error.message.
      throw new HttpsError(
        "unknown", 
        error.message || "Erro desconhecido ao criar preferência no Mercado Pago",
        error.cause
      );
    }
  }
);
