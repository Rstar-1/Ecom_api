import express from "express";
import * as orderController from "../modules/orders/order.controller.js";
import { middleware } from "../../../../shared/index.js";

const { authMiddleware, authorizeRoles } = middleware;
const router = express.Router();

router.use(authMiddleware);

router.post("/", orderController.createOrder);
router.get("/user", orderController.getUserOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);

// Admin/Vendor routes
router.put("/:id/status", authorizeRoles("admin", "vendor"), orderController.updateStatus);

// Internal route for payment service
router.put("/:id/payment", orderController.updatePayment);

export default router;
