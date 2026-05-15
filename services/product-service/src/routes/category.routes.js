import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../modules/categories/category.controller.js";

import { middleware } from "../../../../shared/index.js";
const { authMiddleware, checkPermission } = middleware;

const router = express.Router();

router.get("/", getCategories);
router.get("/:id", getCategoryById);

router.post(
  "/",
  authMiddleware,
  checkPermission("CATEGORY_CREATE"),
  createCategory
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission("CATEGORY_UPDATE"),
  updateCategory
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission("CATEGORY_DELETE"),
  deleteCategory
);

export default router;
