import express from "express";
import {
  getUsers,
  getUserById,
  getProfile,
  updateUser,
  deleteUser,
  bulkDeleteUser,
  uploadDocuments,
} from "./user.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { authMiddleware, upload, uploadErrorHandler } = middleware;

const router = express.Router();

/* ================= PROFILE ================= */
router.get("/profile", authMiddleware, getProfile);

/* ================= USERS CRUD ================= */
// List users (supports ?page=1&limit=5&isDeleted=false)
router.get("/", getUsers);

// Bulk delete (must be placed before /:id)
router.post("/bulk-delete", bulkDeleteUser);
router.delete("/bulk-delete", bulkDeleteUser);

// Read single user
router.get("/:id", getUserById);

// Update user
router.put("/:id", updateUser);

// Delete user
router.delete("/:id", deleteUser);

/* ================= UPLOAD ================= */
router.post(
  "/upload-documents",
  authMiddleware,
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadErrorHandler,
  uploadDocuments
);

export default router;
