import express from "express";
import { 
  authProxy, 
  userProxy, 
  roleProxy 
} from "../proxies/index.js";
import healthRoutes from "./health.routes.js";

const router = express.Router();

router.use(authProxy);
router.use(userProxy);
router.use(roleProxy);
router.use("/healthgateway", healthRoutes);

export default router;
