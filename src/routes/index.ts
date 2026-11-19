import { Router } from "express";
import authRoutes from "../modules/auth/auth.routes";
import cartRoutes from "../modules/cart/cart.routes";
import categoryRoutes from "../modules/categories/category.routes";
import orderRoutes from "../modules/orders/order.routes";
import paymentRoutes from "../modules/payments/payment.routes";
import productRoutes from "../modules/products/product.routes";
import roleRoutes from "../modules/roles/role.routes";
import userRoutes from "../modules/users/user.routes";

/* Same URL paths the API gateway exposed, so clients don't need to change */
const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/roles", roleRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);
router.use("/payments", paymentRoutes);

export default router;
