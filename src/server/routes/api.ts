import { Router } from "express";
import { checkoutController } from "../controllers/checkoutController";
import { paymentController } from "../controllers/paymentController";
import { dataController } from "../controllers/dataController";
import { orderController } from "../controllers/orderController";
import { inventoryController } from "../controllers/inventoryController";
import { productController } from "../controllers/productController";
import { productionController } from "../controllers/productionController";

const apiRouter = Router();

// Checkout Routes
apiRouter.post("/checkout/create-order", checkoutController.createOrder);
apiRouter.post("/checkout/update-order", checkoutController.updateOrder);

// Order Routes
apiRouter.get("/orders", orderController.listOrders);
apiRouter.get("/orders/:id", orderController.getOrder);
apiRouter.post("/orders/:id/update", orderController.updateOrder);
apiRouter.post("/orders/:id/version", orderController.addVersion);

// Payment Routes
apiRouter.post("/payment/create-preference", paymentController.createPreference);
apiRouter.post("/payment/webhook", paymentController.webhook);

// Data Helper Routes
apiRouter.get("/data/pickup-slots", dataController.getPickupSlots);
apiRouter.get("/data/customer-by-cpf", dataController.getCustomerByCPF);
apiRouter.post("/data/sync-customer", dataController.syncCustomer);

// Inventory Routes
apiRouter.get("/inventory/insumos", inventoryController.listInsumos);
apiRouter.post("/inventory/insumos", inventoryController.createInsumo);
apiRouter.post("/inventory/insumos/:id/update", inventoryController.updateInsumo);
apiRouter.post("/inventory/insumos/:id/delete", inventoryController.deleteInsumo);
apiRouter.post("/inventory/movement", inventoryController.recordMovement);
apiRouter.post("/inventory/deduct-order", inventoryController.deductOrderStock);
apiRouter.post("/inventory/restore-order", inventoryController.restoreOrderStock);

// Product Routes
apiRouter.post("/products", productController.createProduct);
apiRouter.post("/products/:id/update", productController.updateProduct);
apiRouter.post("/products/:id/delete", productController.deleteProduct);
apiRouter.get("/products/:id/bom", productController.getProductBOM);
apiRouter.post("/products/:id/bom", productController.updateProductBOM);

// Production Routes
apiRouter.post("/production/start", productionController.startProduction);
apiRouter.post("/production/cancel", productionController.cancelProduction);

export { apiRouter };
