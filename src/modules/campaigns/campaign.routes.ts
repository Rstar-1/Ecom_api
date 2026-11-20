import { Router } from "express";
import { PERMISSIONS } from "../../constants";
import { authMiddleware, checkPermission } from "../../middlewares";
import {
  createCampaign,
  deleteCampaign,
  getAudienceRecipients,
  getCampaignById,
  getCampaigns,
  getTemplates,
  handleTwilioWebhook,
  sendCampaign,
  updateCampaign,
} from "./campaign.controller";

const router = Router();

/* Twilio calls this directly (no login); verified by X-Twilio-Signature when configured */
router.post("/webhook/twilio", handleTwilioWebhook);
router.get("/webhook/twilio", handleTwilioWebhook);

/* Dashboard */
router.use(authMiddleware);

router.get("/templates", checkPermission(PERMISSIONS.CAMPAIGN_VIEW), getTemplates);
router.get("/recipients", checkPermission(PERMISSIONS.CAMPAIGN_VIEW), getAudienceRecipients);
router.post("/send", checkPermission(PERMISSIONS.CAMPAIGN_SEND), sendCampaign);

router.get("/", checkPermission(PERMISSIONS.CAMPAIGN_VIEW), getCampaigns);
router.post("/", checkPermission(PERMISSIONS.CAMPAIGN_MANAGE), createCampaign);
router.get("/:id", checkPermission(PERMISSIONS.CAMPAIGN_VIEW), getCampaignById);
router.put("/:id", checkPermission(PERMISSIONS.CAMPAIGN_MANAGE), updateCampaign);
router.patch("/:id", checkPermission(PERMISSIONS.CAMPAIGN_MANAGE), updateCampaign);
router.delete("/:id", checkPermission(PERMISSIONS.CAMPAIGN_MANAGE), deleteCampaign);

export default router;
