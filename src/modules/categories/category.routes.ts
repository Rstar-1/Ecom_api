import { Router } from "express";
import { authMiddleware, checkPermission } from "../../middlewares";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "./category.controller";

const router = Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);
router.post("/", authMiddleware, checkPermission("CATEGORY_CREATE"), createCategory);
router.put("/:id", authMiddleware, checkPermission("CATEGORY_UPDATE"), updateCategory);
router.delete("/:id", authMiddleware, checkPermission("CATEGORY_DELETE"), deleteCategory);

export default router;
