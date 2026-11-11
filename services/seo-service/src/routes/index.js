import express from "express";
import seoRoutes from "../modules/seo/seo.routes.js";

const router = express.Router();

/* PUBLIC SEO ROUTES */
router.use("/seo", seoRoutes);

export default router;

