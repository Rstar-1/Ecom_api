import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// Forward /api/campaigns to campaign-service
router.use("/api/campaigns", createProxy(env.CAMPAIGN_SERVICE_URL));

export default router;
