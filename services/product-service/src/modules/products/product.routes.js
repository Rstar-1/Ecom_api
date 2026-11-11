import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProduct,
  addReview,
  deleteReview,
} from "./product.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// CREATE
router.post(
  "/",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  uploadErrorHandler,
  createProduct
);

// READ ALL (supports pagination ?page=1&limit=10)
router.get("/", getProducts);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteProduct);
router.delete("/bulk-delete", bulkDeleteProduct);

// ADD REVIEW
router.post("/:id/reviews", addReview);

// DELETE REVIEW
router.delete("/:id/reviews/:reviewId", deleteReview);

// READ ONE
router.get("/:id", getProductById);

// UPDATE
router.put(
  "/:id",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  uploadErrorHandler,
  updateProduct
);

// DELETE ONE
router.delete("/:id", deleteProduct);

export default router;

