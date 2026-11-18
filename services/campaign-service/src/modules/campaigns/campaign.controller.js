import * as service from "./campaign.service.js";
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
        ? jwt.verifyToken(token, process.env.JWT_SECRET || "default_secret")
        : null;
      if (decoded) {
        return decoded.id || decoded.userId || decoded._id || decoded.email;
      }
    } catch {}
  }
  return null;
};

// ================= AUDIENCE RECIPIENTS =================
export const getAudienceRecipients = asyncHandler(async (req, res) => {
  const data = await service.getAudienceRecipients(req.query);
  return successResponse(res, data, "Recipients fetched successfully");
});

// ================= PRE-APPROVED TEMPLATES =================
export const getTemplates = asyncHandler(async (req, res) => {
  const channel = req.query.channel || "sms";
  const data = await service.getTemplates(channel);
  return successResponse(res, data, "Templates fetched successfully");
});

// ================= CREATE CAMPAIGN (DRAFT) =================
export const createCampaign = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const creator = resolveReqCreator(req);
  if (creator) {
    body.createdBy = creator;
  }
  const data = await service.createCampaign(body);
  return successResponse(res, data, "Campaign created successfully", 201);
});

// ================= SEND CAMPAIGN (DIRECT TRIGGER) =================
export const sendCampaign = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  const creator = resolveReqCreator(req);
  if (creator && !body.createdBy) {
    body.createdBy = creator;
  }
  const data = await service.sendCampaign(body);
  const anyFailed = data.recipients?.some((r) => r.status === "failed");
  const allFailed = data.recipients?.length > 0 && data.recipients.every((r) => r.status === "failed");
  const failureReason = data.recipients?.find((r) => r.errorMessage)?.errorMessage || "";

  const responseMessage = allFailed
    ? `Campaign created, but delivery failed: ${failureReason}`
    : anyFailed
    ? `Campaign partially sent: some recipients failed (${failureReason})`
    : "Campaign sent successfully";

  return successResponse(res, data, responseMessage, 200);
});

// ================= GET ALL CAMPAIGNS =================
export const getCampaigns = asyncHandler(async (req, res) => {
  const data = await service.getCampaigns(req.query);
  return successResponse(res, data, "Campaigns fetched successfully");
});

// ================= GET CAMPAIGN BY ID =================
export const getCampaignById = asyncHandler(async (req, res) => {
  const data = await service.getCampaignById(req.params.id);
  return successResponse(res, data, "Campaign fetched successfully");
});

// ================= UPDATE CAMPAIGN =================
export const updateCampaign = asyncHandler(async (req, res) => {
  const data = await service.updateCampaign(req.params.id, req.body);
  return successResponse(res, data, "Campaign updated successfully");
});

// ================= DELETE CAMPAIGN =================
export const deleteCampaign = asyncHandler(async (req, res) => {
  const permanent = req.query.permanent === "true" || req.query.permanent === true;
  const data = await service.deleteCampaign(req.params.id, permanent);
  return successResponse(res, data, "Campaign deleted successfully");
});

// ================= TWILIO WEBHOOK =================
export const handleTwilioWebhook = asyncHandler(async (req, res) => {
  const payload = { ...req.body, ...req.query };
  const result = await service.handleTwilioWebhook(payload);
  // Twilio requires TwiML or 200 OK
  return res.status(200).type("text/xml").send("<Response></Response>");
});
