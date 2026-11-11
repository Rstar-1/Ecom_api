import express from "express";
import roleRoutes from "../modules/roles/role.routes.js";

const router = express.Router();

/* PUBLIC ROLE ROUTES */
router.use("/roles", roleRoutes);

export default router;
