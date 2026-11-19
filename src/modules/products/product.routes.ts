import { Router } from "express";
import { authMiddleware, checkPermission } from "../../middlewares";
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from "./product.controller";

const router = Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", authMiddleware, checkPermission("PRODUCT_CREATE"), createProduct);
router.put("/:id", authMiddleware, checkPermission("PRODUCT_UPDATE"), updateProduct);
router.delete("/:id", authMiddleware, checkPermission("PRODUCT_DELETE"), deleteProduct);

export default router;
