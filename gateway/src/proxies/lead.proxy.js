import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// Forward /api/leads to lead-service
router.use("/api/leads", createProxy(env.LEAD_SERVICE_URL));

export default router;
