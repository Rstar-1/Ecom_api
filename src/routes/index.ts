import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import blogCategoryRoutes from "../modules/blog-categories/blogCategory.routes";
import blogRoutes from "../modules/blogs/blog.routes";
import campaignRoutes from "../modules/campaigns/campaign.routes";
import cartRoutes from "../modules/cart/cart.routes";
import categoryRoutes from "../modules/categories/category.routes";
import leadRoutes from "../modules/leads/lead.routes";
import orderRoutes from "../modules/orders/order.routes";
import paymentRoutes from "../modules/payments/payment.routes";
import productRoutes from "../modules/products/product.routes";
import roleRoutes from "../modules/roles/role.routes";
import seoRoutes from "../modules/seo/seo.routes";
import userRoutes from "../modules/users/user.routes";

/* Same URL paths the old API gateways exposed, so clients don't need to change */
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
router.use("/blogs", blogRoutes); // also serves /blogs/categories
router.use("/blog-categories", blogCategoryRoutes);
router.use("/leads", leadRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/seo", seoRoutes);

/* Shop */
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

export default router;
