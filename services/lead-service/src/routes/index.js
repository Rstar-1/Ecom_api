import express from "express";
import leadRoutes from "../modules/leads/lead.routes.js";

const router = express.Router();

/* PUBLIC LEAD ROUTES */
router.use("/leads", leadRoutes);

export default router;

