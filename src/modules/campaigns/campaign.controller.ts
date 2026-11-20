import twilio from "twilio";
import type { NextFunction, Request, Response } from "express";
import { ENV } from "../../config/env";
import { HTTP_STATUS } from "../../constants";
import type { ApiHandler, EmptyParams, IdParams } from "../../types/http";
import { AppError, successResponse, toBool } from "../../utils";
import type {
  AudienceQuery,
  CampaignBody,
  CampaignListQuery,
  DeleteQuery,
  TemplateQuery,
  TwilioStatusPayload,
} from "./campaign.types";
import * as service from "./campaign.service";

/* GET /api/campaigns/recipients?type=all|leads|customers&channel=sms|whatsapp|gmail&search= */
export const getAudienceRecipients: ApiHandler<EmptyParams, never, AudienceQuery> = async (req, res, next) => {
  try {
    const data = await service.getAudienceRecipients(req.query);
    successResponse(res, data, "Recipients fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* GET /api/campaigns/templates?channel=sms|whatsapp|gmail */
export const getTemplates: ApiHandler<EmptyParams, never, TemplateQuery> = async (req, res, next) => {
  try {
    successResponse(res, service.getTemplates(req.query.channel || "sms"), "Templates fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* POST /api/campaigns */
export const createCampaign: ApiHandler<EmptyParams, CampaignBody> = async (req, res, next) => {
  try {
    const data = await service.createCampaign(req.body ?? {}, req.user?.id);
    successResponse(res, data, "Campaign created successfully", HTTP_STATUS.CREATED);
  } catch (error) {
    next(error);
  }
};

/* POST /api/campaigns/send ({ campaignId } to send an existing one, or a full campaign body) */
export const sendCampaign: ApiHandler<EmptyParams, CampaignBody> = async (req, res, next) => {
  try {
    const campaign = await service.sendCampaign(req.body ?? {}, req.user?.id);
    successResponse(res, campaign, service.sendSummary(campaign));
  } catch (error) {
    next(error);
  }
};

/* GET /api/campaigns?page=&limit=&search=&channel=&status=&templateType= */
export const getCampaigns: ApiHandler<EmptyParams, never, CampaignListQuery> = async (req, res, next) => {
  try {
    const data = await service.getCampaigns(req.query);
    successResponse(res, data, "Campaigns fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* GET /api/campaigns/:id */
export const getCampaignById: ApiHandler<IdParams> = async (req, res, next) => {
  try {
    const data = await service.getCampaignById(req.params.id);
    successResponse(res, data, "Campaign fetched successfully");
  } catch (error) {
    next(error);
  }
};

/* PUT|PATCH /api/campaigns/:id */
export const updateCampaign: ApiHandler<IdParams, CampaignBody> = async (req, res, next) => {
  try {
    const data = await service.updateCampaign(req.params.id, req.body ?? {});
    successResponse(res, data, "Campaign updated successfully");
  } catch (error) {
    next(error);
  }
};

/* DELETE /api/campaigns/:id?permanent=true */
export const deleteCampaign: ApiHandler<IdParams, never, DeleteQuery> = async (req, res, next) => {
  try {
    const data = await service.deleteCampaign(req.params.id, toBool(req.query.permanent));
    successResponse(res, data, "Campaign deleted successfully");
  } catch (error) {
    next(error);
  }
};

/**
 * When Twilio and a public callback URL are configured, only accept webhooks
 * signed by Twilio (X-Twilio-Signature).
 */
const isTrustedTwilioRequest = (req: Request, params: Record<string, unknown>): boolean => {
  const token = ENV.TWILIO_AUTH_TOKEN;
  const url = ENV.TWILIO_STATUS_CALLBACK_URL;
  if (!token || !url) return true; // simulated / local mode
  const signature = req.header("x-twilio-signature");
  return !!signature && twilio.validateRequest(token, signature, url, params);
};

/* POST|GET /api/campaigns/webhook/twilio (Twilio StatusCallback; replies with TwiML, not JSON) */
export const handleTwilioWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const body: TwilioStatusPayload = (req.body as TwilioStatusPayload | undefined) ?? {};
    if (!isTrustedTwilioRequest(req, body)) throw AppError.forbidden("Invalid Twilio signature");
    await service.handleTwilioWebhook({ ...body, ...(req.query as TwilioStatusPayload) });
    res.status(HTTP_STATUS.OK).type("text/xml").send("<Response></Response>");
  } catch (error) {
    next(error);
  }
};
