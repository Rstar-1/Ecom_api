import express from "express";
import * as cartController from "../modules/cart/cart.controller.js";
import { middleware } from "../../../../shared/index.js";

const { authMiddleware } = middleware;
const router = express.Router();

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/update", cartController.updateCart);
router.delete("/remove/:productId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

export default router;
