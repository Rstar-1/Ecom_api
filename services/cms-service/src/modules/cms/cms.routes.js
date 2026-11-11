import express from "express";
import {
  createCms,
  getCmsList,
  getCmsBySectionName,
  getCmsById,
  updateCms,
  addOrUpdateCmsItem,
  deleteCmsItem,
  deleteCms,
  bulkDeleteCms,
  uploadMedia,
} from "./cms.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// UPLOAD MEDIA (for CMS images)
router.post("/upload", upload.single("image"), uploadErrorHandler, uploadMedia);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteCms);
router.delete("/bulk-delete", bulkDeleteCms);

// GET SECTION BY SECTION NAME (must be before /:id)
router.get("/section/:sectionName", getCmsBySectionName);

// CREATE (supports JSON and FormData)
router.post("/", upload.none(), uploadErrorHandler, createCms);

// READ ALL (supports ?page=1&limit=10&search=...&isDeleted=false)
router.get("/", getCmsList);

// READ ONE
router.get("/:id", getCmsById);

// UPDATE SECTION
router.put("/:id", upload.none(), uploadErrorHandler, updateCms);

// ADD OR UPDATE SINGLE ITEM IN SECTION
router.post("/:id/data", addOrUpdateCmsItem);
router.patch("/:id/data", addOrUpdateCmsItem);

// DELETE SINGLE ITEM IN SECTION
router.delete("/:id/data/:cmsId", deleteCmsItem);

// DELETE SECTION (?permanent=true for hard delete)
router.delete("/:id", deleteCms);

export default router;

