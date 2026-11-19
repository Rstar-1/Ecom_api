import { Router } from "express";
import { authMiddleware, upload } from "../../middlewares";
import { login, logout, register, verifyOtp,test } from "./auth.controller";

const router = Router();

router.post(
  "/register",
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
router.get("/test", test);

router.post("/logout", authMiddleware, logout);

export default router;
