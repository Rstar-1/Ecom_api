import express from "express";
import {
  getUsers,
  getProfile,
  updateUser,
  uploadDocuments,
} from "./user.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { authMiddleware, upload, uploadErrorHandler, checkPermission } = middleware;

const router = express.Router();

/* ================= USERS ================= */

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.get(
  "/",
  authMiddleware,
  checkPermission("USER_VIEW"),
  getUsers
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission("USER_UPDATE"),
  updateUser
);

/* ================= UPLOAD ================= */

router.post(
  "/upload-documents",
  authMiddleware,
  checkPermission("USER_UPDATE"),
  upload.fields([
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadErrorHandler,
  uploadDocuments
);

export default router;
