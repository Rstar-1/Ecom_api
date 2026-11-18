import express from "express";
import { createProxy } from "../utils/proxy.js";
import { env } from "../config/env.js";

const router = express.Router();

router.use("/api/blogs", createProxy(env.BLOG_SERVICE_URL));
router.use("/api/blog-categories", createProxy(env.BLOG_SERVICE_URL));

export default router;
