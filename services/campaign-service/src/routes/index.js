import express from "express";
import campaignRoutes from "../modules/campaigns/campaign.routes.js";

const router = express.Router();

/* PUBLIC CAMPAIGN ROUTES */
router.use("/campaigns", campaignRoutes);

export default router;
