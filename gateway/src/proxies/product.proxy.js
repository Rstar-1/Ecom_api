import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

// Route to product-service for products and categories
router.use("/api/products", createProxy(env.PRODUCT_SERVICE_URL));
router.use("/api/categories", createProxy(env.PRODUCT_SERVICE_URL));

export default router;
