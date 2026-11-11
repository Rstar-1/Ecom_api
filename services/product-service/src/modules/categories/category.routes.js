import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategory,
} from "./category.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// CREATE
router.post(
  "/",
  upload.single("image"),
  uploadErrorHandler,
  createCategory
);

// READ ALL (supports pagination ?page=1&limit=10)
router.get("/", getCategories);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteCategory);
router.delete("/bulk-delete", bulkDeleteCategory);

// READ ONE
router.get("/:id", getCategoryById);

// UPDATE
router.put(
  "/:id",
  upload.single("image"),
  uploadErrorHandler,
  updateCategory
);

// DELETE ONE
router.delete("/:id", deleteCategory);

export default router;

