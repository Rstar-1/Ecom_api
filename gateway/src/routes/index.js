import express from "express";
import { 
  authProxy, 
  userProxy, 
  productProxy, 
  cartProxy, 
  orderProxy, 
  paymentProxy,
  roleProxy 
} from "../proxies/index.js";
import healthRoutes from "./health.routes.js";

const router = express.Router();

router.use(authProxy);
router.use(userProxy);
router.use(productProxy);
router.use(cartProxy);
router.use(orderProxy);
router.use(paymentProxy);
router.use(roleProxy);
router.use("/healthgateway", healthRoutes);

export default router;