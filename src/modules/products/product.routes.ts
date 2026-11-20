import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import {
  addReview,
  bulkDeleteProducts,
  createProduct,
  deleteProduct,
  deleteReview,
  getProductById,
  getProducts,
  updateProduct,
} from "./product.controller";

const router = Router();

const productFiles = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.get("/", getProducts);
router.post("/", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_CREATE), productFiles, createProduct);

router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_DELETE), bulkDeleteProducts);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_DELETE), bulkDeleteProducts);

/* Reviews: any logged-in user can review; removing needs product update rights */
router.post("/:id/reviews", authMiddleware, addReview);
router.delete("/:id/reviews/:reviewId", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_UPDATE), deleteReview);

router.get("/:id", getProductById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_UPDATE), productFiles, updateProduct);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.PRODUCT_DELETE), deleteProduct);

export default router;
