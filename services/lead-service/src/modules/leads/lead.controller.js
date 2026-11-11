import * as service from "./lead.service.js";
import { utils } from "../../../../../shared/index.js";

const { asyncHandler, successResponse, jwt } = utils;

const resolveReqCreator = (req) => {
  if (req.body?.createdBy) return req.body.createdBy;
  if (req.user) return req.user.id || req.user._id || req.user.userId;
  const authHeader = req.headers?.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      const token = authHeader.split(" ")[1];
      const decoded = jwt?.verifyToken
        ? jwt.verifyToken(token, process.env.JWT_SECRET)
        : null;
      if (decoded) {
        return decoded.id || decoded.userId || decoded._id || decoded.email;
      }
    } catch {}
  }
  return null;
};

// ================= CREATE LEAD =================
export const createLead = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }
  const data = await service.createLead(body);
  return successResponse(res, data, "Lead created", 201);
});

// ================= GET ALL LEADS =================
export const getLeads = asyncHandler(async (req, res) => {
  const data = await service.getLeads(req.query);
  return successResponse(res, data, "Leads fetched");
});

// ================= GET LEAD BY ID =================
export const getLeadById = asyncHandler(async (req, res) => {
  const data = await service.getLeadById(req.params.id);
  return successResponse(res, data, "Lead fetched");
});

// ================= UPDATE LEAD =================
export const updateLead = asyncHandler(async (req, res) => {
  const data = await service.updateLead(req.params.id, req.body);
  return successResponse(res, data, "Lead updated");
});

// ================= UPDATE LEAD SEVERITY =================
export const updateLeadSeverity = asyncHandler(async (req, res) => {
  const data = await service.updateLeadSeverity(req.params.id, req.body.severity);
  return successResponse(res, data, "Lead severity updated");
});

// ================= DELETE LEAD =================
export const deleteLead = asyncHandler(async (req, res) => {
  const permanent = req.query.permanent === "true" || req.query.permanent === true;
  const data = await service.deleteLead(req.params.id, permanent);
  return successResponse(res, data, "Lead deleted");
});

// ================= BULK DELETE LEADS =================
export const bulkDeleteLeads = asyncHandler(async (req, res) => {
  const data = await service.bulkDeleteLeads(req.body);
  return successResponse(res, data, "Leads deleted successfully");
});

