const {onRequest} = require("firebase-functions/v2/https");

exports.createPreference = onRequest(
    {secrets: ["MERCADOPAGO_ACCESS_TOKEN"]},
    async (req, res) => {
      res.status(200).json({test: "ok"});
    },
);

