import express from "express";
import categoryRoutes from "../modules/categories/category.routes.js";
import productRoutes from "../modules/products/product.routes.js";

const router = express.Router();

/* PUBLIC CATEGORY ROUTES (supports /categories and /product-categories) */
router.use("/categories", categoryRoutes);
router.use("/product-categories", categoryRoutes);

/* PUBLIC PRODUCT ROUTES */
router.use("/products", productRoutes);

export default router;

