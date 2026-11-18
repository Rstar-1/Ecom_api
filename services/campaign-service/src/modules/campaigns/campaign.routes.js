import express from "express";
import {
  getAudienceRecipients,
  getTemplates,
  createCampaign,
  sendCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  handleTwilioWebhook,
} from "./campaign.controller.js";

const router = express.Router();

/* ================= SPECIALIZED ENDPOINTS (MUST BE BEFORE /:id) ================= */

// 1. Get Pre-approved Templates (?channel=sms|gmail|whatsapp)
router.get("/templates", getTemplates);

// 2. Get Audience Recipients from Leads & Users (?type=all|leads|customers&search=...&channel=sms|gmail)
router.get("/recipients", getAudienceRecipients);

// 3. Direct Send Action (Matches Dashboard "Send to N Users" button)
router.post("/send", sendCampaign);

// 4. Twilio StatusCallback Webhook
router.post("/webhook/twilio", handleTwilioWebhook);
router.get("/webhook/twilio", handleTwilioWebhook);

/* ================= STANDARD CRUD ================= */

// List Campaigns (with search, pagination, channel filter)
router.get("/", getCampaigns);

// Create Campaign Draft
router.post("/", createCampaign);

// Get Single Campaign
router.get("/:id", getCampaignById);

// Update Campaign
router.put("/:id", updateCampaign);
router.patch("/:id", updateCampaign);

// Delete Campaign (?permanent=true for hard delete)
router.delete("/:id", deleteCampaign);

export default router;
