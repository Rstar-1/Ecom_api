import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

router.use("/api/cart", createProxy(env.CART_SERVICE_URL));

export default router;
