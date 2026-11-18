import mongoose from "mongoose";
import { models, utils } from "../../../../../shared/index.js";
import {
  sendSMS,
  sendWhatsApp,
  interpolateTemplate,
  calculateSmsSegments,
  formatPhoneNumber,
} from "./twilio.service.js";
import { sendEmailViaNodemailer } from "./nodemailer.service.js";
import { getTemplatesByChannel } from "./template.data.js";
import { ENV } from "../../config/env.js";

const { Campaign, Lead, User } = models;
const { info, warn, error, generateCampaignId, buildCampaignQuery } = utils;

/* ================= RESOLVE RECIPIENTS FROM LEADS & USERS ================= */
export const getAudienceRecipients = async (query = {}) => {
  const { type = "all", channel = "sms", search = "", page, limit } = query;

  const results = [];
  const searchRegex = search ? new RegExp(String(search).trim(), "i") : null;

  // 1. Fetch Leads
  if (type === "all" || type === "leads") {
    const leadFilter = { isDeleted: false, isActive: true };
    if (searchRegex) {
      leadFilter.$or = [
        { name: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { id: searchRegex },
      ];
    }
    const leads = await Lead.find(leadFilter)
      .select("id name mobile email location severity")
      .lean();

    for (const l of leads) {
      const address = channel === "gmail" ? l.email : l.mobile;
      if (address) {
        results.push({
          id: String(l._id),
          customId: l.id,
          name: l.name,
          mobile: l.mobile,
          email: l.email,
          recipientAddress: address,
          recipientType: "Lead",
          leadId: l._id,
          userId: null,
          location: l.location || "",
          severity: l.severity || "low",
        });
      }
    }
  }

  // 2. Fetch Users (Customers)
  if (type === "all" || type === "customers") {
    const userFilter = { isDeleted: false, isActive: true };
    if (searchRegex) {
      userFilter.$or = [
        { fullname: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { id: searchRegex },
      ];
    }
    const users = await User.find(userFilter)
      .select("id fullname email mobile")
      .lean();

    for (const u of users) {
      const address = channel === "gmail" ? u.email : u.mobile;
      if (address) {
        results.push({
          id: String(u._id),
          customId: u.id,
          name: u.fullname || "Customer",
          mobile: u.mobile || "",
          email: u.email || "",
          recipientAddress: address,
          recipientType: "Customer",
          leadId: null,
          userId: u._id,
        });
      }
    }
  }

  // Optional Pagination
  if (page !== undefined || limit !== undefined) {
    const currentPage = Math.max(1, parseInt(page, 10) || 1);
    const currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;
    const paginated = results.slice(skip, skip + currentLimit);

    return {
      recipients: paginated,
      total: results.length,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(results.length / currentLimit),
    };
  }

  return results;
};

/* ================= GET PRE-APPROVED TEMPLATES ================= */
export const getTemplates = async (channel = "sms") => {
  return getTemplatesByChannel(channel);
};

/* ================= RESOLVE RECIPIENT DATA ================= */
const normalizeRecipients = async (recipientsInput = [], channel = "sms") => {
  if (!Array.isArray(recipientsInput) || !recipientsInput.length) {
    return [];
  }

  const normalized = [];

  for (const item of recipientsInput) {
    // If item is already an object
    if (typeof item === "object" && item !== null) {
      const name = item.name || item.leadFullName || item.fullname || "Customer";
      const address =
        channel === "gmail"
          ? item.email || item.emailAddress || item.recipientAddress || ""
          : item.mobile || item.mobileNumber || item.phone || item.recipientAddress || "";

      if (address) {
        normalized.push({
          name,
          recipientAddress: address,
          recipientType: item.recipientType || (item.leadId ? "Lead" : item.userId ? "Customer" : "Lead"),
          leadId: item.leadId || null,
          userId: item.userId || null,
          status: "pending",
          segmentsCount: 1,
        });
      }
    }
    // If item is an ID string (Lead ID or User ID)
    else if (typeof item === "string" && mongoose.Types.ObjectId.isValid(item)) {
      const lead = await Lead.findById(item).lean();
      if (lead) {
        const addr = channel === "gmail" ? lead.email : lead.mobile;
        if (addr) {
          normalized.push({
            name: lead.name,
            recipientAddress: addr,
            recipientType: "Lead",
            leadId: lead._id,
            userId: null,
            status: "pending",
            segmentsCount: 1,
          });
        }
      } else {
        const user = await User.findById(item).lean();
        if (user) {
          const addr = channel === "gmail" ? user.email : user.mobile;
          if (addr) {
            normalized.push({
              name: user.fullname || "Customer",
              recipientAddress: addr,
              recipientType: "Customer",
              leadId: null,
              userId: user._id,
              status: "pending",
              segmentsCount: 1,
            });
          }
        }
      }
    }
  }

  return normalized;
};

/* ================= CREATE CAMPAIGN (DRAFT OR QUEUED) ================= */
export const createCampaign = async (data = {}) => {
  const name = (data.name || data.campaignName || "").trim();
  const channel = String(data.channel || "sms").toLowerCase().trim();
  const templateType = String(data.templateType || "promotion").toLowerCase().trim();

  if (!name) {
    const err = new Error("Campaign name is required");
    err.statusCode = 400;
    throw err;
  }

  const rawBody =
    data.body ||
    data.smsMessageBody ||
    (templateType === "promotion"
      ? "Enjoy 20% OFF on select items at Company. This limited-time offer is valid until 30 Nov 2026."
      : "Welcome to Company!");

  const rawRecipients = data.recipients || data.selectedUsers || data.targetUsers || [];
  const recipients = await normalizeRecipients(rawRecipients, channel);

  const campaignId = (data.id && data.id.trim()) || (await generateCampaignId());

  const campaign = await Campaign.create({
    id: campaignId,
    name,
    channel,
    templateType,
    status: data.status || "draft",
    subject: data.subject || data.subjectLine || "",
    previewText: data.previewText || "",
    body: rawBody,
    header: data.header || "",
    footer: data.footer || "",
    bannerIncluded:
      data.bannerIncluded !== undefined
        ? Boolean(data.bannerIncluded)
        : data.specialOfferBannerIncluded !== undefined
        ? Boolean(data.specialOfferBannerIncluded)
        : templateType === "promotion",
    bannerType: data.bannerType || "special_offer",
    bannerImageUrl: data.bannerImageUrl || "",
    buttonLabel: data.buttonLabel || (channel === "gmail" ? "Shop now" : ""),
    buttonType: data.buttonType || "none",
    buttonUrl: data.buttonUrl || data.shortUrl || data.trackableShortLink || "",
    shortUrl: data.shortUrl || data.trackableShortLink || "https://yourbrand.in/s/x7Qa",
    otpCode: data.otpCode || "",
    securityNote: data.securityNote || "",
    twilioConfig: {
      fromNumber: data.fromNumber || (data.twilioConfig && data.twilioConfig.fromNumber) || "",
      fromEmail: data.fromEmail || data.senderEmailAddress || "offers@yourbrand.in",
      messagingServiceSid: data.messagingServiceSid || "",
      statusCallbackUrl: data.statusCallbackUrl || "",
    },
    recipients,
    createdBy: data.createdBy || null,
  });

  info(`CAMPAIGN_CREATED: ${campaign.name} (${campaign.id}) | Channel: ${campaign.channel}`);
  return campaign;
};

/* ================= SEND CAMPAIGN (DIRECT OR SCHEDULED EXECUTION) ================= */
export const sendCampaign = async (data = {}) => {
  let campaign;

  // If campaignId was provided, load existing campaign
  if (data.campaignId) {
    campaign = await Campaign.findOne(buildCampaignQuery(data.campaignId, true));
    if (!campaign) {
      const err = new Error("Campaign not found");
      err.statusCode = 404;
      throw err;
    }
  } else {
    // Create new campaign directly from payload
    campaign = await createCampaign({ ...data, status: "in_progress" });
  }

  // If new recipients are passed in payload to add/override
  if (data.recipients && Array.isArray(data.recipients) && data.recipients.length) {
    campaign.recipients = await normalizeRecipients(data.recipients, campaign.channel);
  }

  if (!campaign.recipients || campaign.recipients.length === 0) {
    const err = new Error("At least one recipient is required to send campaign");
    err.statusCode = 400;
    throw err;
  }

  campaign.status = "in_progress";
  info(`CAMPAIGN_SEND_STARTED: ${campaign.name} (${campaign.id}) to ${campaign.recipients.length} recipients`);

  // Execute dispatch to each recipient concurrently
  const dispatchPromises = campaign.recipients.map(async (recipient) => {
    const context = {
      name: recipient.name || "Customer",
      code: campaign.otpCode || "546372",
      link: campaign.shortUrl || "https://yourbrand.in/s/x7Qa",
      shortUrl: campaign.shortUrl || "https://yourbrand.in/s/x7Qa",
      company: "Company",
    };

    const personalizedBody = interpolateTemplate(campaign.body, context);
    const personalizedSubject = interpolateTemplate(campaign.subject || "Special Offer from Company", context);

    let dispatchResult;

    if (campaign.channel === "sms") {
      dispatchResult = await sendSMS({
        to: recipient.recipientAddress,
        body: personalizedBody,
        from: campaign.twilioConfig?.fromNumber,
        statusCallback: campaign.twilioConfig?.statusCallbackUrl,
      });
    } else if (campaign.channel === "whatsapp") {
      dispatchResult = await sendWhatsApp({
        to: recipient.recipientAddress,
        body: personalizedBody,
        mediaUrl: campaign.bannerIncluded ? campaign.bannerImageUrl : undefined,
        statusCallback: campaign.twilioConfig?.statusCallbackUrl,
      });
    } else if (
      campaign.channel === "gmail" ||
      campaign.channel === "email" ||
      campaign.channel === "mail"
    ) {
      // Dispatched strictly via Nodemailer (SMTP/Gmail)
      dispatchResult = await sendEmailViaNodemailer({
        to: recipient.recipientAddress,
        subject: personalizedSubject,
        body: personalizedBody,
        from: campaign.twilioConfig?.fromEmail || campaign.fromEmail || ENV.SENDER_EMAIL,
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
    }

    if (dispatchResult) {
      recipient.twilioMessageSid = dispatchResult.sid || dispatchResult.messageId || "";
      recipient.status = dispatchResult.status === "failed" ? "failed" : "sent";
      recipient.sentAt = new Date();
      recipient.segmentsCount = dispatchResult.segmentsCount || calculateSmsSegments(personalizedBody);
      if (dispatchResult.errorMessage) {
        recipient.errorMessage = dispatchResult.errorMessage;
        recipient.errorCode = dispatchResult.errorCode || "DISPATCH_FAILED";
      }
    }
  });

  await Promise.all(dispatchPromises);

  // Mark status based on results
  const allFailed = campaign.recipients.length > 0 && campaign.recipients.every((r) => r.status === "failed");
  const anySent = campaign.recipients.some((r) => r.status === "sent" || r.status === "delivered");

  if (allFailed) {
    campaign.status = "failed";
  } else if (anySent) {
    campaign.status = "completed";
    campaign.completedAt = new Date();
  } else {
    campaign.status = "completed";
  }

  await campaign.save();

  if (allFailed) {
    const errorDetail =
      campaign.recipients[0]?.errorMessage || "Failed to dispatch campaign messages to recipients";
    warn(`CAMPAIGN_SEND_FAILED: ${campaign.name} (${campaign.id}) | Reason: ${errorDetail}`);
  }

  info(`CAMPAIGN_SEND_FINISHED: ${campaign.name} (${campaign.id}) | Delivered/Sent: ${campaign.metrics?.sentCount || 0}`);
  return campaign;
};

/* ================= GET ALL CAMPAIGNS (PAGINATED & FILTERED) ================= */
export const getCampaigns = async (query = {}) => {
  const { channel, status, templateType, search, isDeleted, page, limit } = query;

  const filter = {};
  if (isDeleted !== undefined) {
    if (isDeleted !== "all") filter.isDeleted = isDeleted === "true" || isDeleted === true;
  } else {
    filter.isDeleted = false;
  }

  if (channel) {
    filter.channel = String(channel).toLowerCase().trim();
  }

  if (status) {
    filter.status = String(status).toLowerCase().trim();
  }

  if (templateType) {
    filter.templateType = String(templateType).toLowerCase().trim();
  }

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { id: { $regex: s, $options: "i" } },
      { name: { $regex: s, $options: "i" } },
      { subject: { $regex: s, $options: "i" } },
      { body: { $regex: s, $options: "i" } },
    ];
  }

  const isPaginated = page !== undefined || limit !== undefined;
  let queryBuilder = Campaign.find(filter)
    .populate("createdBy", "id fullname email mobile image")
    .sort({ createdAt: -1 });

  let currentPage = 1;
  let currentLimit = 10;
  let total = 0;

  if (isPaginated) {
    currentPage = Math.max(1, parseInt(page, 10) || 1);
    currentLimit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (currentPage - 1) * currentLimit;
    total = await Campaign.countDocuments(filter);
    queryBuilder = queryBuilder.skip(skip).limit(currentLimit);
  }

  const campaigns = await queryBuilder.lean({ virtuals: true });

  if (isPaginated) {
    return {
      campaigns,
      total,
      page: currentPage,
      limit: currentLimit,
      totalPages: Math.ceil(total / currentLimit),
      pagination: {
        total,
        page: currentPage,
        limit: currentLimit,
        totalPages: Math.ceil(total / currentLimit),
      },
    };
  }

  return campaigns;
};

/* ================= GET CAMPAIGN BY ID ================= */
export const getCampaignById = async (identifier) => {
  const campaign = await Campaign.findOne(buildCampaignQuery(identifier, true)).populate(
    "createdBy",
    "id fullname email mobile image"
  );

  if (!campaign) {
    const err = new Error("Campaign not found");
    err.statusCode = 404;
    throw err;
  }
  return campaign;
};

/* ================= UPDATE CAMPAIGN ================= */
export const updateCampaign = async (identifier, data = {}) => {
  const campaign = await Campaign.findOne(buildCampaignQuery(identifier, true));
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.statusCode = 404;
    throw err;
  }

  if (data.name !== undefined) campaign.name = String(data.name).trim();
  if (data.campaignName !== undefined) campaign.name = String(data.campaignName).trim();
  if (data.channel !== undefined) campaign.channel = String(data.channel).toLowerCase().trim();
  if (data.templateType !== undefined) campaign.templateType = String(data.templateType).toLowerCase().trim();
  if (data.status !== undefined) campaign.status = String(data.status).toLowerCase().trim();
  if (data.subject !== undefined) campaign.subject = String(data.subject).trim();
  if (data.subjectLine !== undefined) campaign.subject = String(data.subjectLine).trim();
  if (data.previewText !== undefined) campaign.previewText = String(data.previewText).trim();
  if (data.body !== undefined) campaign.body = String(data.body).trim();
  if (data.smsMessageBody !== undefined) campaign.body = String(data.smsMessageBody).trim();
  if (data.header !== undefined) campaign.header = String(data.header).trim();
  if (data.footer !== undefined) campaign.footer = String(data.footer).trim();
  if (data.shortUrl !== undefined) campaign.shortUrl = String(data.shortUrl).trim();
  if (data.trackableShortLink !== undefined) campaign.shortUrl = String(data.trackableShortLink).trim();
  if (data.otpCode !== undefined) campaign.otpCode = String(data.otpCode).trim();
  if (data.securityNote !== undefined) campaign.securityNote = String(data.securityNote).trim();

  if (data.bannerIncluded !== undefined) campaign.bannerIncluded = Boolean(data.bannerIncluded);
  if (data.specialOfferBannerIncluded !== undefined) {
    campaign.bannerIncluded = Boolean(data.specialOfferBannerIncluded);
  }
  if (data.bannerImageUrl !== undefined) campaign.bannerImageUrl = String(data.bannerImageUrl).trim();
  if (data.buttonLabel !== undefined) campaign.buttonLabel = String(data.buttonLabel).trim();
  if (data.buttonUrl !== undefined) campaign.buttonUrl = String(data.buttonUrl).trim();

  if (data.fromEmail !== undefined || data.senderEmailAddress !== undefined) {
    if (!campaign.twilioConfig) campaign.twilioConfig = {};
    campaign.twilioConfig.fromEmail = String(data.fromEmail || data.senderEmailAddress).trim();
  }

  if (data.recipients && Array.isArray(data.recipients)) {
    campaign.recipients = await normalizeRecipients(data.recipients, campaign.channel);
  }

  if (data.isActive !== undefined) campaign.isActive = Boolean(data.isActive);
  if (data.isDeleted !== undefined) campaign.isDeleted = Boolean(data.isDeleted);

  await campaign.save();
  info(`CAMPAIGN_UPDATED: ${campaign.name} (${campaign.id})`);
  return campaign;
};

/* ================= DELETE CAMPAIGN ================= */
export const deleteCampaign = async (identifier, permanent = false) => {
  const campaign = await Campaign.findOne(buildCampaignQuery(identifier, true));
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.statusCode = 404;
    throw err;
  }

  if (permanent) {
    await Campaign.deleteOne({ _id: campaign._id });
    info(`CAMPAIGN_PERMANENTLY_DELETED: ${campaign.name} (${campaign.id})`);
    return { message: "Campaign permanently deleted", id: campaign.id };
  }

  campaign.isDeleted = true;
  await campaign.save();
  info(`CAMPAIGN_SOFT_DELETED: ${campaign.name} (${campaign.id})`);
  return { message: "Campaign deleted", id: campaign.id };
};

/* ================= HANDLE TWILIO STATUSCALLBACK WEBHOOK ================= */
export const handleTwilioWebhook = async (payload = {}) => {
  const messageSid = payload.MessageSid || payload.SmsSid;
  const messageStatus = String(payload.MessageStatus || payload.SmsStatus || "").toLowerCase();

  if (!messageSid || !messageStatus) {
    return { received: false, reason: "Missing MessageSid or MessageStatus" };
  }

  const campaign = await Campaign.findByTwilioSid(messageSid);
  if (!campaign) {
    warn(`[TWILIO WEBHOOK] No campaign found with MessageSid: ${messageSid}`);
    return { received: true, updated: false };
  }

  const updated = campaign.updateRecipientTwilioStatus(messageSid, messageStatus, {
    errorCode: payload.ErrorCode,
    errorMessage: payload.ErrorMessage,
  });

  if (updated) {
    await campaign.save();
    info(`[TWILIO WEBHOOK UPDATED] Sid: ${messageSid} -> ${messageStatus} for Campaign ${campaign.id}`);
  }

  return { received: true, updated };
};
