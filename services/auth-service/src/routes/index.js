import express from "express";

import authRoutes from "../modules/auth/auth.routes.js";

import { middleware, constants } from "../../../../shared/index.js";
const { authMiddleware, checkPermission } = middleware;
const { roles } = constants;

const router = express.Router();

/* PUBLIC ROUTES */
router.use("/auth", authRoutes);

export default router;