import express from "express";
import * as paymentController from "../modules/payments/payment.controller.js";
import { middleware } from "../../../../shared/index.js";

const { authMiddleware } = middleware;
const router = express.Router();

router.use(authMiddleware);

router.post("/create-order", paymentController.createOrder);
router.post("/verify", paymentController.verifyPayment);
router.post("/cod", paymentController.handleCod);
router.get("/:id", paymentController.getPayment);

export default router;
