import { Schema, model, type InferSchemaType } from "mongoose";
import { applySequentialId } from "../utils/crud";
import { aliasVirtual, withVirtuals } from "./plugins";

export const CAMPAIGN_CHANNELS = ["whatsapp", "sms", "gmail"] as const;
export const CAMPAIGN_TEMPLATE_TYPES = ["promotion", "otp", "welcome", "custom"] as const;
export const CAMPAIGN_STATUSES = ["draft", "scheduled", "in_progress", "completed", "failed", "cancelled"] as const;
export const RECIPIENT_STATUSES = [
  "pending",
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
  "undelivered",
] as const;
export const BUTTON_TYPES = ["reply", "url", "copy_code", "none"] as const;

export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];
export type CampaignTemplateType = (typeof CAMPAIGN_TEMPLATE_TYPES)[number];
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];
export type RecipientStatus = (typeof RECIPIENT_STATUSES)[number];
export type ButtonType = (typeof BUTTON_TYPES)[number];

/* ================= RECIPIENT (lead / customer + delivery tracking) ================= */
const recipientSchema = new Schema(
  {
    leadId: { type: Schema.Types.ObjectId, ref: "Lead", default: null },
    userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    name: { type: String, required: true, trim: true },
    // Phone number (SMS / WhatsApp) or email (Gmail)
    recipientAddress: { type: String, required: true, trim: true },
    recipientType: { type: String, enum: ["Lead", "Customer", "Other"], default: "Lead", trim: true },
    status: { type: String, enum: RECIPIENT_STATUSES, default: "pending", lowercase: true, trim: true },
    twilioMessageSid: { type: String, default: "", trim: true, index: true },
    errorCode: { type: String, default: "", trim: true },
    errorMessage: { type: String, default: "", trim: true },
    segmentsCount: { type: Number, default: 1, min: 1 },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
  },
  { _id: true, timestamps: false, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

aliasVirtual(recipientSchema, "mobile", "recipientAddress");
aliasVirtual(recipientSchema, "phone", "recipientAddress");
aliasVirtual(recipientSchema, "email", "recipientAddress");

/* ================= CAMPAIGN ================= */
const campaignSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, trim: true, index: true }, // CMP-001
    name: { type: String, required: true, trim: true },
    channel: { type: String, required: true, enum: CAMPAIGN_CHANNELS, lowercase: true, trim: true, index: true },
    templateType: {
      type: String,
      enum: CAMPAIGN_TEMPLATE_TYPES,
      default: "promotion",
      lowercase: true,
      trim: true,
      index: true,
    },
    status: { type: String, enum: CAMPAIGN_STATUSES, default: "draft", lowercase: true, trim: true, index: true },

    /* Template & message content */
    header: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
    previewText: { type: String, default: "", trim: true },
    body: { type: String, required: true, trim: true },
    footer: { type: String, default: "", trim: true },
    bannerIncluded: { type: Boolean, default: false },
    bannerType: { type: String, default: "special_offer", trim: true },
    bannerImageUrl: { type: String, default: "", trim: true },
    buttonLabel: { type: String, default: "", trim: true },
    buttonType: { type: String, enum: BUTTON_TYPES, default: "none", lowercase: true, trim: true },
    buttonUrl: { type: String, default: "", trim: true },
    shortUrl: { type: String, default: "", trim: true },
    otpCode: { type: String, default: "", trim: true },
    securityNote: { type: String, default: "", trim: true },

    /* Sender configuration */
    twilioConfig: {
      fromNumber: { type: String, default: "", trim: true },
      fromEmail: { type: String, default: "", trim: true, lowercase: true },
      messagingServiceSid: { type: String, default: "", trim: true },
      whatsappContentSid: { type: String, default: "", trim: true },
      statusCallbackUrl: { type: String, default: "", trim: true },
      accountSid: { type: String, default: "", trim: true },
    },

    /* WhatsApp Cloud API approved template (business-initiated messages need one) */
    whatsappTemplate: {
      name: { type: String, default: "", trim: true },
      language: { type: String, default: "en_US", trim: true },
      // Values for {{1}}, {{2}}… in the template body; may contain {name}, {link}…
      params: { type: [String], default: [] },
    },

    recipients: [recipientSchema],

    metrics: {
      totalRecipients: { type: Number, default: 0 },
      queuedCount: { type: Number, default: 0 },
      sentCount: { type: Number, default: 0 },
      deliveredCount: { type: Number, default: 0 },
      readCount: { type: Number, default: 0 },
      failedCount: { type: Number, default: 0 },
    },

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    scheduledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  withVirtuals
);

/* UI field names used by the dashboard (Campaign.jsx) */
aliasVirtual(campaignSchema, "campaignName", "name");
aliasVirtual(campaignSchema, "fromEmail", "twilioConfig.fromEmail");
aliasVirtual(campaignSchema, "senderEmailAddress", "twilioConfig.fromEmail");
aliasVirtual(campaignSchema, "trackableShortLink", "shortUrl");
aliasVirtual(campaignSchema, "smsMessageBody", "body");
aliasVirtual(campaignSchema, "subjectLine", "subject");
aliasVirtual(campaignSchema, "specialOfferBannerIncluded", "bannerIncluded");

campaignSchema.virtual("targetAudienceCount").get(function () {
  return this.recipients.length;
});

campaignSchema.virtual("deliveryRate").get(function () {
  const total = this.metrics?.totalRecipients || this.recipients.length;
  return total ? Math.round(((this.metrics?.deliveredCount ?? 0) / total) * 100) : 0;
});

applySequentialId(campaignSchema, "CMP", "campaigns");

/* Keep aggregate metrics in sync with the recipients list */
campaignSchema.pre("validate", function () {
  const counts = { queued: 0, sent: 0, delivered: 0, read: 0, failed: 0 };
  for (const r of this.recipients) {
    if (r.status === "queued" || r.status === "pending") counts.queued++;
    else if (r.status === "sent" || r.status === "sending") counts.sent++;
    else if (r.status === "delivered") counts.delivered++;
    else if (r.status === "read") counts.read++;
    else if (r.status === "failed" || r.status === "undelivered") counts.failed++;
  }
  this.set("metrics", {
    totalRecipients: this.recipients.length,
    queuedCount: counts.queued,
    sentCount: counts.sent,
    deliveredCount: counts.delivered,
    readCount: counts.read,
    failedCount: counts.failed,
  });
});

export const Campaign = model("Campaign", campaignSchema, "campaigns");

export type ICampaign = InferSchemaType<typeof campaignSchema>;
export type CampaignDocument = ReturnType<(typeof Campaign)["hydrate"]>;
