import express from "express";
import {
  createSeo,
  getSeoList,
  getSeoByPage,
  getSeoByPath,
  getSeoById,
  updateSeo,
  deleteSeo,
  bulkDeleteSeo,
  seedSeo,
  uploadImage,
} from "./seo.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// UPLOAD OG IMAGE
router.post("/upload", upload.single("image"), uploadErrorHandler, uploadImage);

// SEED INITIAL 12 RECORDS
router.post("/seed", seedSeo);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteSeo);
router.delete("/bulk-delete", bulkDeleteSeo);

// GET BY PATH (e.g. /api/seo/by-path?path=/about)
router.get("/by-path", getSeoByPath);

// GET BY PAGE NAME (e.g. /api/seo/page/home)
router.get("/page/:page", getSeoByPage);

// CREATE (handles both JSON and multipart/form-data)
router.post("/", upload.single("image"), uploadErrorHandler, createSeo);

// READ ALL (supports ?page=1&limit=20&search=...&type=website)
router.get("/", getSeoList);

// READ ONE BY ID OR IDENTIFIER
router.get("/:id", getSeoById);

// UPDATE (handles both JSON and multipart/form-data)
router.put("/:id", upload.single("image"), uploadErrorHandler, updateSeo);

// DELETE ONE (?permanent=true for hard delete)
router.delete("/:id", deleteSeo);

export default router;

