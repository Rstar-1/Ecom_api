import express from "express";
import blogCategoryRoutes from "../modules/blog-categories/blogCategory.routes.js";
import blogRoutes from "../modules/blogs/blog.routes.js";

const router = express.Router();

/* PUBLIC BLOG CATEGORY ROUTES */
router.use("/blog-categories", blogCategoryRoutes);
router.use("/blogs/categories", blogCategoryRoutes);

/* PUBLIC BLOG ROUTES */
router.use("/blogs", blogRoutes);

export default router;

