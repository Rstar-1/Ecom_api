import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import blogCategoryRoutes from "../modules/blog-categories/blog-category.routes";
import blogRoutes from "../modules/blogs/blog.routes";
import campaignRoutes from "../modules/campaigns/campaign.routes";
import categoryRoutes from "../modules/categories/category.routes";
import leadRoutes from "../modules/leads/lead.routes";
import productRoutes from "../modules/products/product.routes";
import roleRoutes from "../modules/roles/role.routes";
import seoRoutes from "../modules/seo/seo.routes";
import userRoutes from "../modules/users/user.routes";

const router = Router();

/* Accounts */
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);

/* Catalog */
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/product-categories", categoryRoutes);

/* Content & marketing */
router.use("/blogs", blogRoutes);
router.use("/blog-categories", blogCategoryRoutes);
router.use("/leads", leadRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/seo", seoRoutes);

export default router;

