import express from "express";

import roleRoutes from "../modules/roles/role.routes.js";

import { middleware, constants } from "../../../../shared/index.js";
const { authMiddleware, checkPermission } = middleware;
const { roles } = constants;

const router = express.Router();

/* PROTECTED */
router.use(
  "/roles",
  authMiddleware,
  checkPermission(roles.ADMIN),
  roleRoutes
);

export default router;
