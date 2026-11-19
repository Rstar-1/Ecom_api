import { Router } from "express";
import { authMiddleware } from "../../middlewares";
import * as cartController from "./cart.controller";

const router = Router();

router.use(authMiddleware);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/update", cartController.updateCart);
router.delete("/remove/:productId", cartController.removeFromCart);
router.delete("/clear", cartController.clearCart);

export default router;
