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

/* Middleware to safely parse multipart form data if submitted as FormData without interfering with JSON */
const handleFormData = (req, res, next) => {
  if (req.is("multipart/form-data")) {
    return upload.none()(req, res, (err) => {
      if (err) return uploadErrorHandler(err, req, res, next);
      next();
    });
  }
  next();
};

/* ================= ROUTES ================= */

// CREATE LEAD (handles JSON & FormData)
router.post("/", handleFormData, createLead);

// GET ALL LEADS (supports pagination, filtering by severity/status, search)
router.get("/", getLeads);

// BULK DELETE (must be defined before /:id)
router.post("/bulk-delete", bulkDeleteLeads);
router.delete("/bulk-delete", bulkDeleteLeads);

// GET SINGLE LEAD BY ID / MOBILE / EMAIL
router.get("/:id", getLeadById);

// UPDATE LEAD (PUT & PATCH)
router.put("/:id", handleFormData, updateLead);
router.patch("/:id", handleFormData, updateLead);

// UPDATE LEAD SEVERITY
router.patch("/:id/severity", updateLeadSeverity);

// DELETE SINGLE LEAD
router.delete("/:id", deleteLead);

export default router;
