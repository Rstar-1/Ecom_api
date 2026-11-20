import { ENV } from "../../config/env";
import {
  BUTTON_TYPES,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  CAMPAIGN_TEMPLATE_TYPES,
  Campaign,
  Lead,
  RECIPIENT_STATUSES,
  User,
  type CampaignChannel,
  type CampaignDocument,
  type RecipientStatus,
} from "../../models";
import {
  AppError,
  baseListFilter,
  containsCi,
  exactCi,
  identifierFilter,
  isObjectId,
  logger,
  pagedResult,
  readPagination,
  searchFilter,
  str,
  toBool,
  type Filter,
} from "../../utils";
import { CREATOR_POPULATE } from "../roles/role.helpers";
import { getTemplatesByChannel } from "./campaign.templates";
import type {
  AudienceQuery,
  CampaignBody,
  CampaignListQuery,
  RecipientInput,
  TwilioStatusPayload,
} from "./campaign.types";
import { sendEmail } from "./mailer.service";
import { calculateSmsSegments, interpolateTemplate, sendSMS, sendWhatsApp, type DispatchResult } from "./twilio.service";

const DEFAULT_SHORT_URL = "https://yourbrand.in/s/x7Qa";

/** Validates a value against an allowed list (case-insensitive). */
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], field: string): T => {
  const v = str(value).toLowerCase();
  if (!(allowed as readonly string[]).includes(v)) {
    throw AppError.badRequest(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return v as T;
};

const findCampaign = async (identifier: string): Promise<CampaignDocument> => {
  const campaign = await Campaign.findOne(identifierFilter(identifier, (v) => [{ name: exactCi(v) }]));
  if (!campaign) throw AppError.notFound("Campaign not found");
  return campaign;
};

/* ================= AUDIENCE (leads + customers that can receive this channel) ================= */
export interface AudienceMember {
  id: string;
  customId: string;
  name: string;
  mobile: string;
  email: string;
  recipientAddress: string;
  recipientType: "Lead" | "Customer";
  leadId: string | null;
  userId: string | null;
  location?: string;
  severity?: string;
}

export const getAudienceRecipients = async (query: AudienceQuery = {}) => {
  const type = str(query.type) || "all";
  const channel = str(query.channel) || "sms";
  const term = str(query.search);
  const results: AudienceMember[] = [];

  if (type === "all" || type === "leads") {
    const filter: Filter = { isDeleted: false, isActive: true };
    if (term) filter.$or = ["name", "mobile", "email", "id"].map((f) => ({ [f]: containsCi(term) }));
    const leads = await Lead.find(filter).select("id name mobile email location severity").lean();
    for (const l of leads) {
      const address = channel === "gmail" ? l.email : l.mobile;
      if (!address) continue;
      results.push({
        id: String(l._id),
        customId: l.id,
        name: l.name,
        mobile: l.mobile,
        email: l.email,
        recipientAddress: address,
        recipientType: "Lead",
        leadId: String(l._id),
        userId: null,
        location: l.location,
        severity: l.severity,
      });
    }
  }

  if (type === "all" || type === "customers") {
    const filter: Filter = { isDeleted: false, isActive: true };
    if (term) filter.$or = ["fullname", "email", "mobile", "id"].map((f) => ({ [f]: containsCi(term) }));
    const users = await User.find(filter).select("id fullname email mobile").lean();
    for (const u of users) {
      const address = channel === "gmail" ? u.email : u.mobile;
      if (!address) continue;
      results.push({
        id: String(u._id),
        customId: u.id,
        name: u.fullname || "Customer",
        mobile: u.mobile || "",
        email: u.email || "",
        recipientAddress: address,
        recipientType: "Customer",
        leadId: null,
        userId: String(u._id),
      });
    }
  }

  const paging = readPagination(query, 10);
  return paging.isPaginated
    ? pagedResult("recipients", results.slice(paging.skip, paging.skip + paging.limit), results.length, paging)
    : results;
};

export const getTemplates = (channel = "sms") => getTemplatesByChannel(channel);

/* ================= RECIPIENTS ================= */
interface NewRecipient {
  name: string;
  recipientAddress: string;
  recipientType: "Lead" | "Customer" | "Other";
  leadId: string | null;
  userId: string | null;
  status: RecipientStatus;
  segmentsCount: number;
}

const normalizeRecipients = async (inputs: RecipientInput[], channel: CampaignChannel): Promise<NewRecipient[]> => {
  const out: NewRecipient[] = [];

  for (const item of inputs) {
    if (typeof item === "object" && item !== null) {
      const address =
        channel === "gmail"
          ? item.email || item.emailAddress || item.recipientAddress
          : item.mobile || item.mobileNumber || item.phone || item.recipientAddress;
      if (!address) continue;
      out.push({
        name: item.name || item.leadFullName || item.fullname || "Customer",
        recipientAddress: address,
        recipientType: item.recipientType || (item.userId ? "Customer" : "Lead"),
        leadId: item.leadId ?? null,
        userId: item.userId ?? null,
        status: "pending",
        segmentsCount: 1,
      });
      continue;
    }

    if (typeof item === "string" && isObjectId(item)) {
      const lead = await Lead.findById(item).lean();
      if (lead) {
        const address = channel === "gmail" ? lead.email : lead.mobile;
        if (address) {
          out.push({ name: lead.name, recipientAddress: address, recipientType: "Lead", leadId: item, userId: null, status: "pending", segmentsCount: 1 });
        }
        continue;
      }
      const user = await User.findById(item).lean();
      const address = user ? (channel === "gmail" ? user.email : user.mobile) : "";
      if (user && address) {
        out.push({ name: user.fullname || "Customer", recipientAddress: address, recipientType: "Customer", leadId: null, userId: item, status: "pending", segmentsCount: 1 });
      }
    }
  }

  return out;
};

/* ================= CREATE ================= */
export const createCampaign = async (data: CampaignBody, createdBy?: string) => {
  const name = str(data.name || data.campaignName);
  if (!name) throw AppError.badRequest("Campaign name is required");

  const channel = oneOf(data.channel || "sms", CAMPAIGN_CHANNELS, "channel");
  const templateType = oneOf(data.templateType || "promotion", CAMPAIGN_TEMPLATE_TYPES, "templateType");
  const body =
    str(data.body || data.smsMessageBody) ||
    (templateType === "promotion"
      ? "Enjoy 20% OFF on select items at Company. This limited-time offer is valid until 30 Nov 2026."
      : "Welcome to Company!");

  const recipients = await normalizeRecipients(data.recipients ?? data.selectedUsers ?? data.targetUsers ?? [], channel);
  const banner = data.bannerIncluded ?? data.specialOfferBannerIncluded;
  const shortUrl = str(data.shortUrl || data.trackableShortLink);

  const campaign = await Campaign.create({
    ...(str(data.id) ? { id: str(data.id) } : {}),
    name,
    channel,
    templateType,
    status: data.status ? oneOf(data.status, CAMPAIGN_STATUSES, "status") : "draft",
    subject: str(data.subject || data.subjectLine),
    previewText: str(data.previewText),
    body,
    header: str(data.header),
    footer: str(data.footer),
    bannerIncluded: banner !== undefined ? toBool(banner) : templateType === "promotion",
    bannerType: str(data.bannerType) || "special_offer",
    bannerImageUrl: str(data.bannerImageUrl),
    buttonLabel: str(data.buttonLabel) || (channel === "gmail" ? "Shop now" : ""),
    buttonType: data.buttonType ? oneOf(data.buttonType, BUTTON_TYPES, "buttonType") : "none",
    buttonUrl: str(data.buttonUrl) || shortUrl,
    shortUrl: shortUrl || DEFAULT_SHORT_URL,
    otpCode: str(data.otpCode),
    securityNote: str(data.securityNote),
    twilioConfig: {
      fromNumber: str(data.fromNumber),
      fromEmail: str(data.fromEmail || data.senderEmailAddress) || ENV.SENDER_EMAIL,
      messagingServiceSid: str(data.messagingServiceSid),
      statusCallbackUrl: str(data.statusCallbackUrl),
    },
    recipients,
    createdBy: createdBy ?? null,
  });

  logger.info(`CAMPAIGN_CREATED: ${campaign.name} (${campaign.id}) | Channel: ${campaign.channel}`);
  return campaign;
};

/* ================= SEND (existing campaignId, or create + send) ================= */
const dispatch = async (campaign: CampaignDocument, to: string, body: string, subject: string): Promise<DispatchResult> => {
  const callback = campaign.twilioConfig?.statusCallbackUrl || undefined;
  if (campaign.channel === "sms") {
    return sendSMS({ to, body, from: campaign.twilioConfig?.fromNumber || undefined, statusCallback: callback });
  }
  if (campaign.channel === "whatsapp") {
    return sendWhatsApp({
      to,
      body,
      mediaUrl: campaign.bannerIncluded ? campaign.bannerImageUrl || undefined : undefined,
      statusCallback: callback,
    });
  }
  return sendEmail({
    to,
    subject,
    body,
    replyTo: campaign.twilioConfig?.fromEmail || ENV.SENDER_EMAIL,
    templateType: campaign.templateType,
    bannerIncluded: campaign.bannerIncluded,
    bannerType: campaign.bannerType,
    bannerImageUrl: campaign.bannerImageUrl,
    buttonLabel: campaign.buttonLabel,
    buttonUrl: campaign.buttonUrl,
    otpCode: campaign.otpCode,
    footer: campaign.footer,
    previewText: campaign.previewText,
  });
};

export const sendCampaign = async (data: CampaignBody, createdBy?: string) => {
  const campaign = data.campaignId
    ? await findCampaign(data.campaignId)
    : await createCampaign({ ...data, status: "in_progress" }, createdBy);

  if (data.campaignId && data.recipients?.length) {
    campaign.set("recipients", await normalizeRecipients(data.recipients, campaign.channel));
  }
  if (campaign.recipients.length === 0) {
    throw AppError.badRequest("At least one recipient is required to send campaign");
  }

  campaign.status = "in_progress";
  logger.info(`CAMPAIGN_SEND_STARTED: ${campaign.name} (${campaign.id}) to ${campaign.recipients.length} recipients`);

  await Promise.all(
    campaign.recipients.map(async (recipient) => {
      const context = {
        name: recipient.name || "Customer",
        code: campaign.otpCode || "546372",
        shortUrl: campaign.shortUrl || DEFAULT_SHORT_URL,
        company: ENV.SENDER_NAME,
      };
      const body = interpolateTemplate(campaign.body, context);
      const subject = interpolateTemplate(campaign.subject || `Special Offer from ${ENV.SENDER_NAME}`, context);

      const result = await dispatch(campaign, recipient.recipientAddress, body, subject);
      recipient.twilioMessageSid = result.sid ?? "";
      recipient.status = result.status === "failed" ? "failed" : "sent";
      recipient.sentAt = new Date();
      recipient.segmentsCount = result.segmentsCount || calculateSmsSegments(body);
      if (result.errorMessage) {
        recipient.errorMessage = result.errorMessage;
        recipient.errorCode = result.errorCode || "DISPATCH_FAILED";
      }
    })
  );

  const allFailed = campaign.recipients.every((r) => r.status === "failed");
  campaign.status = allFailed ? "failed" : "completed";
  if (!allFailed) campaign.completedAt = new Date();
  await campaign.save();

  if (allFailed) {
    logger.warn(`CAMPAIGN_SEND_FAILED: ${campaign.name} (${campaign.id}) | ${campaign.recipients[0]?.errorMessage ?? ""}`);
  }
  logger.info(`CAMPAIGN_SEND_FINISHED: ${campaign.name} (${campaign.id}) | Sent: ${campaign.metrics?.sentCount ?? 0}`);
  return campaign;
};

/** Message for the send response, e.g. "Campaign partially sent: some recipients failed (...)". */
export const sendSummary = (campaign: CampaignDocument): string => {
  const failed = campaign.recipients.filter((r) => r.status === "failed");
  const reason = failed.find((r) => r.errorMessage)?.errorMessage ?? "";
  if (failed.length && failed.length === campaign.recipients.length) return `Campaign created, but delivery failed: ${reason}`;
  if (failed.length) return `Campaign partially sent: some recipients failed (${reason})`;
  return "Campaign sent successfully";
};

/* ================= LIST ================= */
export const getCampaigns = async (query: CampaignListQuery = {}) => {
  const filter: Filter = {
    ...baseListFilter(query),
    ...searchFilter(query.search, ["id", "name", "subject", "body"]),
  };
  if (query.channel) filter.channel = str(query.channel).toLowerCase();
  if (query.status) filter.status = str(query.status).toLowerCase();
  if (query.templateType) filter.templateType = str(query.templateType).toLowerCase();

  const paging = readPagination(query, 10);
  const base = Campaign.find(filter).populate("createdBy", CREATOR_POPULATE).sort({ createdAt: -1 });
  const [campaigns, total] = await Promise.all([
    paging.isPaginated ? base.skip(paging.skip).limit(paging.limit) : base,
    paging.isPaginated ? Campaign.countDocuments(filter) : Promise.resolve(0),
  ]);

  return paging.isPaginated ? pagedResult("campaigns", campaigns, total, paging) : campaigns;
};

/* ================= GET ONE (Mongo _id, CMP-001 or name) ================= */
export const getCampaignById = async (identifier: string) =>
  (await findCampaign(identifier)).populate("createdBy", CREATOR_POPULATE);

/* ================= UPDATE ================= */
export const updateCampaign = async (identifier: string, data: CampaignBody) => {
  const campaign = await findCampaign(identifier);

  const name = data.name ?? data.campaignName;
  if (name !== undefined) campaign.name = str(name);
  if (data.channel !== undefined) campaign.channel = oneOf(data.channel, CAMPAIGN_CHANNELS, "channel");
  if (data.templateType !== undefined) {
    campaign.templateType = oneOf(data.templateType, CAMPAIGN_TEMPLATE_TYPES, "templateType");
  }
  if (data.status !== undefined) campaign.status = oneOf(data.status, CAMPAIGN_STATUSES, "status");

  const subject = data.subject ?? data.subjectLine;
  if (subject !== undefined) campaign.subject = str(subject);
  const body = data.body ?? data.smsMessageBody;
  if (body !== undefined) campaign.body = str(body);
  const shortUrl = data.shortUrl ?? data.trackableShortLink;
  if (shortUrl !== undefined) campaign.shortUrl = str(shortUrl);
  const banner = data.bannerIncluded ?? data.specialOfferBannerIncluded;
  if (banner !== undefined) campaign.bannerIncluded = toBool(banner);

  if (data.previewText !== undefined) campaign.previewText = str(data.previewText);
  if (data.header !== undefined) campaign.header = str(data.header);
  if (data.footer !== undefined) campaign.footer = str(data.footer);
  if (data.otpCode !== undefined) campaign.otpCode = str(data.otpCode);
  if (data.securityNote !== undefined) campaign.securityNote = str(data.securityNote);
  if (data.bannerImageUrl !== undefined) campaign.bannerImageUrl = str(data.bannerImageUrl);
  if (data.buttonLabel !== undefined) campaign.buttonLabel = str(data.buttonLabel);
  if (data.buttonType !== undefined) campaign.buttonType = oneOf(data.buttonType, BUTTON_TYPES, "buttonType");
  if (data.buttonUrl !== undefined) campaign.buttonUrl = str(data.buttonUrl);

  const fromEmail = data.fromEmail ?? data.senderEmailAddress;
  if (fromEmail !== undefined) campaign.set("twilioConfig.fromEmail", str(fromEmail));

  if (Array.isArray(data.recipients)) {
    campaign.set("recipients", await normalizeRecipients(data.recipients, campaign.channel));
  }
  if (data.isActive !== undefined) campaign.isActive = toBool(data.isActive);
  if (data.isDeleted !== undefined) campaign.isDeleted = toBool(data.isDeleted);

  await campaign.save();
  logger.info(`CAMPAIGN_UPDATED: ${campaign.name} (${campaign.id})`);
  return campaign;
};

/* ================= DELETE (?permanent=true for hard delete) ================= */
export const deleteCampaign = async (identifier: string, permanent: boolean) => {
  const campaign = await findCampaign(identifier);

  if (permanent) {
    await Campaign.deleteOne({ _id: campaign._id });
    logger.info(`CAMPAIGN_PERMANENTLY_DELETED: ${campaign.name} (${campaign.id})`);
    return { message: "Campaign permanently deleted", id: campaign.id };
  }

  campaign.isDeleted = true;
  await campaign.save();
  logger.info(`CAMPAIGN_SOFT_DELETED: ${campaign.name} (${campaign.id})`);
  return { message: "Campaign deleted", id: campaign.id };
};

/* ================= TWILIO STATUS WEBHOOK ================= */
export const handleTwilioWebhook = async (payload: TwilioStatusPayload) => {
  const sid = str(payload.MessageSid || payload.SmsSid);
  const status = str(payload.MessageStatus || payload.SmsStatus).toLowerCase();
  if (!sid || !status) return { received: false, reason: "Missing MessageSid or MessageStatus" };
  if (!(RECIPIENT_STATUSES as readonly string[]).includes(status)) return { received: true, updated: false };

  const campaign = await Campaign.findOne({ "recipients.twilioMessageSid": sid });
  const recipient = campaign?.recipients.find((r) => r.twilioMessageSid === sid);
  if (!campaign || !recipient) {
    logger.warn(`[TWILIO WEBHOOK] No campaign found with MessageSid: ${sid}`);
    return { received: true, updated: false };
  }

  recipient.status = status as RecipientStatus;
  if (status === "sent") recipient.sentAt = new Date();
  else if (status === "delivered") recipient.deliveredAt = new Date();
  else if (status === "read") recipient.readAt = new Date();
  else if (status === "failed" || status === "undelivered") {
    recipient.errorCode = str(payload.ErrorCode);
    recipient.errorMessage = str(payload.ErrorMessage);
  }

  const finished = campaign.recipients.every((r) => ["delivered", "read", "failed", "undelivered"].includes(r.status));
  if (finished) {
    campaign.status = "completed";
    campaign.completedAt = new Date();
  }

  await campaign.save(); // metrics are recalculated in the pre-validate hook
  logger.info(`[TWILIO WEBHOOK] ${sid} -> ${status} (campaign ${campaign.id})`);
  return { received: true, updated: true };
};
