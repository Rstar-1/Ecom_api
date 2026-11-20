import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission, handleFormData, optionalAuth } from "../../middlewares";
import {
  bulkDeleteLeads,
  createLead,
  deleteLead,
  getLeadById,
  getLeads,
  updateLead,
  updateLeadSeverity,
} from "./lead.controller";

const router = Router();

/* Public: website "connect" form can submit leads */
router.post("/", optionalAuth, handleFormData, createLead);

/* Everything else is for the dashboard */
router.get("/", authMiddleware, checkPermission(PERMISSIONS.LEAD_VIEW), getLeads);
router.post("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.LEAD_DELETE), bulkDeleteLeads);
router.delete("/bulk-delete", authMiddleware, checkPermission(PERMISSIONS.LEAD_DELETE), bulkDeleteLeads);
router.get("/:id", authMiddleware, checkPermission(PERMISSIONS.LEAD_VIEW), getLeadById);
router.put("/:id", authMiddleware, checkPermission(PERMISSIONS.LEAD_UPDATE), handleFormData, updateLead);
router.patch("/:id", authMiddleware, checkPermission(PERMISSIONS.LEAD_UPDATE), handleFormData, updateLead);
router.patch("/:id/severity", authMiddleware, checkPermission(PERMISSIONS.LEAD_UPDATE), updateLeadSeverity);
router.delete("/:id", authMiddleware, checkPermission(PERMISSIONS.LEAD_DELETE), deleteLead);

export default router;
