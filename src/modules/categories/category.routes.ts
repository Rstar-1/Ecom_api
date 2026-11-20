import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, upload } from "../../middlewares";
import {
  bulkDeleteCategories,
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from "./category.controller";

const router = Router();

router.get("/", getCategories);
router.post("/", authMiddleware, checkPermission(PERMISSIONS.CATEGORY_CREATE), upload.single("image"), createCategory);

router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.CATEGORY_DELETE), bulkDeleteCategories);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.CATEGORY_DELETE), bulkDeleteCategories);

router.get("/:id", getCategoryById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.CATEGORY_UPDATE), upload.single("image"), updateCategory);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.CATEGORY_DELETE), deleteCategory);

export default router;
