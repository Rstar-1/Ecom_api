import express from "express";
import { 
  authProxy, 
  userProxy, 
  roleProxy,
  leadProxy,
  campaignProxy,
  productProxy,
  blogProxy,
  seoProxy,
} from "../proxies/index.js";
import healthRoutes from "./health.routes.js";

const router = express.Router();

router.use(authProxy);
router.use(userProxy);
router.use(roleProxy);
router.use(leadProxy);
router.use(campaignProxy);
router.use(productProxy);
router.use(blogProxy);
router.use(seoProxy);
router.use("/healthgateway", healthRoutes);

export default router;
