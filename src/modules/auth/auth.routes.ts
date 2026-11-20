import { Router } from "express";
import { authMiddleware } from "../../middlewares";
import { login, logout, register, verifyOtp,test } from "./auth.controller";

const router = Router();

router.post(
  "/register",
  register
);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.get("/test00", test);

router.post("/logout", authMiddleware, logout);

export default router;
