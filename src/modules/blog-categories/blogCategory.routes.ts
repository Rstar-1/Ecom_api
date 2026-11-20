import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, handleFormData } from "../../middlewares";
import {
  bulkDeleteBlogCategories,
  createBlogCategory,
  deleteBlogCategory,
  getBlogCategories,
  getBlogCategoryById,
  updateBlogCategory,
} from "./blogCategory.controller";

const router = Router();

router.get("/", getBlogCategories);
router.post("/", authMiddleware, checkPermission(PERMISSIONS.BLOG_CREATE), handleFormData, createBlogCategory);

router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), bulkDeleteBlogCategories);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), bulkDeleteBlogCategories);

router.get("/:id", getBlogCategoryById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.BLOG_UPDATE), handleFormData, updateBlogCategory);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.BLOG_DELETE), deleteBlogCategory);

export default router;
