import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: "TEST-8748255036550408-051807-a0d25e1df0755decf51e038ea4f23026-163294559",
});

export default async function handler(req, res) {

  try {

    // 🔥 TESTE GET
    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        message: "API funcionando"
      });
    }

    const { product, price, quantity } = req.body;

    const total =
      Number(price) * Number(quantity || 1);

    // 🔥 REGRAS
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

    // 🔥 PREFERENCE
    const preference = {
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
    };

    const response =
      await mercadopago.preferences.create(
        preference
      );

    return res.status(200).json({
      init_point: response.body.init_point,
      total,
      valorCobrado,
      saldoRestante,
      premioRoleta,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: error.message,
    });
  }
}