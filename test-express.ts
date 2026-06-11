import express from "express";

const app = express();
try {
  app.get('/(.*)', (req, res) => res.send("ok"));
  console.log("Regex param worked!");
} catch (e) {
  console.error("Regex param failed:", e.message);
}

try {
  app.get('*all', (req, res) => res.send("ok"));
  console.log("*all param worked!");
} catch (e) {
  console.error("*all param failed:", e.message);
}

try {
  app.get('*', (req, res) => res.send("ok"));
  console.log("* param worked!");
} catch (e) {
  console.error("* param failed:", e.message);
}
