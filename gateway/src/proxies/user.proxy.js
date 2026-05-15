import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// Route to user-service
router.use("/api/users", createProxy(env.USER_SERVICE_URL));

export default router;
