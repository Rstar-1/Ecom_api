import express from "express";
import {
  createBlogCategory,
  getBlogCategories,
  getBlogCategoryById,
  updateBlogCategory,
  deleteBlogCategory,
  bulkDeleteBlogCategory,
} from "./blogCategory.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// CREATE (supports both JSON and multipart/form-data)
router.post(
  "/",
  upload.single("image"),
  uploadErrorHandler,
  createBlogCategory
);

// READ ALL (supports pagination ?page=1&limit=10)
router.get("/", getBlogCategories);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteBlogCategory);
router.delete("/bulk-delete", bulkDeleteBlogCategory);

// READ ONE
router.get("/:id", getBlogCategoryById);

// UPDATE (supports both JSON and multipart/form-data)
router.put(
  "/:id",
  upload.single("image"),
  uploadErrorHandler,
  updateBlogCategory
);

// DELETE ONE
router.delete("/:id", deleteBlogCategory);

export default router;
