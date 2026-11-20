import { Router } from "express";
import { authMiddleware, optionalAuth, upload } from "../../middlewares";
import {
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  test,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "./auth.controller";

const router = Router();

/* ================= AUTH ================= */
router.post(
  "/register",
  optionalAuth, // an admin's token lets them choose any role / pre-verify the user
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "shopPhoto", maxCount: 1 },
  ]),
  register
);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);

/* ================= FORGOT / RESET PASSWORD ================= */
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-otp", verifyForgotPasswordOtp);
router.post("/verify-forgot-password-otp", verifyForgotPasswordOtp);
router.post("/reset-password", resetPassword);

router.get("/test00", test);

export default router;
