import { Router } from "express";
import { roles } from "../../constants";
import { authMiddleware, authorizeRoles } from "../../middlewares";
import * as orderController from "./order.controller";

const router = Router();

router.use(authMiddleware);

router.post("/", orderController.createOrder);
router.get("/user", orderController.getUserOrders);
router.get("/:id", orderController.getOrder);
router.put("/:id/cancel", orderController.cancelOrder);

// Admin / Vendor
router.put("/:id/status", authorizeRoles(roles.ADMIN, roles.VENDOR), orderController.updateStatus);

export default router;
