import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// Forward category and product routes to product-service
router.use("/api/categories", createProxy(env.PRODUCT_SERVICE_URL));
router.use("/api/product-categories", createProxy(env.PRODUCT_SERVICE_URL));
router.use("/api/products", createProxy(env.PRODUCT_SERVICE_URL));

export default router;

