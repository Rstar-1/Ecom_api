import express from "express";
import { 
  authProxy, 
  userProxy, 
  roleProxy,
  productProxy,
  blogProxy,
  leadProxy,
  cmsProxy,
  seoProxy
} from "../proxies/index.js";
import healthRoutes from "./health.routes.js";

const router = express.Router();

router.use(authProxy);
router.use(userProxy);
router.use(roleProxy);
router.use(productProxy);
router.use(blogProxy);
router.use(leadProxy);
router.use(cmsProxy);
router.use(seoProxy);
router.use("/healthgateway", healthRoutes);

export default router;
