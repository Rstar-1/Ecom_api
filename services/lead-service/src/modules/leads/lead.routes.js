import express from "express";
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadSeverity,
  deleteLead,
  bulkDeleteLeads,
} from "./lead.controller.js";

import { middleware } from "../../../../../shared/index.js";
const { upload, uploadErrorHandler } = middleware;

const router = express.Router();

// CREATE (handles both JSON and multipart/form-data)
router.post("/", upload.none(), uploadErrorHandler, createLead);

// READ ALL (supports ?page=1&limit=10&severity=pending&search=...)
router.get("/", getLeads);

// BULK DELETE (must be before /:id)
router.post("/bulk-delete", bulkDeleteLeads);
router.delete("/bulk-delete", bulkDeleteLeads);

// READ ONE
router.get("/:id", getLeadById);

// UPDATE
router.put("/:id", upload.none(), uploadErrorHandler, updateLead);

// UPDATE SEVERITY
router.patch("/:id/severity", updateLeadSeverity);

// DELETE ONE (?permanent=true for hard delete)
router.delete("/:id", deleteLead);

export default router;

