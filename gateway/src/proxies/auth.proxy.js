import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// 🔥 MUST BE EXACT PREFIX
router.use("/api/auth", createProxy(env.AUTH_SERVICE_URL));

export default router;