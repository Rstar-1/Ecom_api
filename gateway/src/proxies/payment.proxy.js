import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

router.use("/api/payments", createProxy(env.PAYMENT_SERVICE_URL));

export default router;
