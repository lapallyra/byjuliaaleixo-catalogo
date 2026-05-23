import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {

  try {

    // 🔥 TESTE
    if (req.method === "GET") {

      return res.status(200).json({
        ok: true,
        message: "API funcionando"
      });
    }

    const { product, price, quantity } = req.body;

    const total =
      Number(price) * Number(quantity || 1);

    // 🔥 REGRA SINAL
    const LIMITE = 100;
    const TAXA_SINAL = 0.5;

    let valorCobrado;
    let saldoRestante;

    if (total > LIMITE) {

      valorCobrado = total * TAXA_SINAL;
      saldoRestante = total - valorCobrado;

    } else {

      valorCobrado = total;
      saldoRestante = 0;
    }

    // 🔥 ROLETA
    let premioRoleta = null;

    if (total >= 300) {

      const premios = [
        "Frete grátis",
        "10% OFF",
        "Brinde especial",
        "Sem prêmio"
      ];

      premioRoleta =
        premios[
          Math.floor(Math.random() * premios.length)
        ];
    }

    const preference = new Preference(client);

    const response = await preference.create({
      body: {

        items: [
          {
            title: product,
            quantity: 1,
            unit_price: Number(
              valorCobrado.toFixed(2)
            ),
          },
        ],

        metadata: {
          total,
          valorCobrado,
          saldoRestante,
          premioRoleta,
        },

        back_urls: {
          success:
            "https://www.byjuliaaleixo.online/sucesso",

          failure:
            "https://www.byjuliaaleixo.online/erro",

          pending:
            "https://www.byjuliaaleixo.online/pendente",
        },

        auto_return: "approved",
      },
    });

    return res.status(200).json({
      init_point: response.init_point,
      total,
      valorCobrado,
      saldoRestante,
      premioRoleta,
    });

  } catch (error) {

    console.error("ERRO MP:");
    console.error(error);

    return res.status(500).json({
      error: error.message,
      cause: error.cause || null,
    });
  }
}