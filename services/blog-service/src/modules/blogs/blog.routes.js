import express from "express";
import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  bulkDeleteBlog,
  addReview,
  deleteReview,
} from "./blog.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// CREATE
router.post(
  "/",
  upload.single("image"),
  uploadErrorHandler,
  createBlog
);

// READ ALL (supports pagination ?page=1&limit=10)
router.get("/", getBlogs);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteBlog);
router.delete("/bulk-delete", bulkDeleteBlog);

// REVIEWS
router.post("/:id/reviews", addReview);
router.delete("/:id/reviews/:reviewId", deleteReview);

// READ ONE
router.get("/:id", getBlogById);

// UPDATE
router.put(
  "/:id",
  upload.single("image"),
  uploadErrorHandler,
  updateBlog
);

// DELETE ONE
router.delete("/:id", deleteBlog);

export default router;

