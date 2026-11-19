import { Router } from "express";
import { authMiddleware } from "../../middlewares";
import * as paymentController from "./payment.controller";

const router = Router();

router.use(authMiddleware);

router.post("/create-order", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.post("/cod", paymentController.handleCod);
router.get("/:id", paymentController.getPayment);

export default router;
