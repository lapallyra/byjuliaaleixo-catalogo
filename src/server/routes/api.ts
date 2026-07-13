import { Router } from "express";
import { checkoutController } from "../controllers/checkoutController";
import { paymentController } from "../controllers/paymentController";

const apiRouter = Router();

// Checkout Routes
apiRouter.post("/checkout/create-order", checkoutController.createOrder);

// Payment Routes
apiRouter.post("/payment/create-preference", paymentController.createPreference);
apiRouter.post("/payment/webhook", paymentController.webhook);

export { apiRouter };
