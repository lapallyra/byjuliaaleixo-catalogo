const functions = require("firebase-functions");

exports.createPreference = functions.https.onRequest((req, res) => {
  res.send("FUNCIONANDO");
});