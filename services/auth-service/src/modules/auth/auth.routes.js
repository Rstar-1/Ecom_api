import express from "express";

import {
  register,
  verifyOtp,
  login,
  logout,
} from "./auth.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { authMiddleware, upload, uploadErrorHandler } = middleware;

const router = express.Router();

/* ================= AUTH ================= */

router.post(
  "/register",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  uploadErrorHandler,
  register
);

router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

export default router;