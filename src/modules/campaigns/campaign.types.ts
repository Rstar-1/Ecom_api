import type { ListQuery } from "../../utils";

/** A recipient may be an object (lead/customer shape from the dashboard) or a Lead/User Mongo _id. */
export type RecipientInput =
  | string
  | {
      name?: string;
      leadFullName?: string;
      fullname?: string;
      email?: string;
      emailAddress?: string;
      mobile?: string;
      mobileNumber?: string;
      phone?: string;
      recipientAddress?: string;
      recipientType?: "Lead" | "Customer" | "Other";
      leadId?: string | null;
      userId?: string | null;
    };

/** Accepts API field names and the dashboard (Campaign.jsx) aliases. */
export interface CampaignBody {
  id?: string;
  /** Send an existing campaign instead of creating a new one */
  campaignId?: string;
  name?: string;
  campaignName?: string;
  channel?: string;
  templateType?: string;
  status?: string;
  subject?: string;
  subjectLine?: string;
  previewText?: string;
  body?: string;
  smsMessageBody?: string;
  header?: string;
  footer?: string;
  bannerIncluded?: boolean | string;
  specialOfferBannerIncluded?: boolean | string;
  bannerType?: string;
  bannerImageUrl?: string;
  buttonLabel?: string;
  buttonType?: string;
  buttonUrl?: string;
  shortUrl?: string;
  trackableShortLink?: string;
  otpCode?: string;
  securityNote?: string;
  fromNumber?: string;
  fromEmail?: string;
  senderEmailAddress?: string;
  messagingServiceSid?: string;
  statusCallbackUrl?: string;
  /** WhatsApp Cloud API template (e.g. "hello_world"). Without one, free-form text is sent. */
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
  /** Values for {{1}}, {{2}}… in the template body; may use {name}, {link}, {code}, {company} */
  whatsappTemplateParams?: string[] | string;
  recipients?: RecipientInput[];
  selectedUsers?: RecipientInput[];
  targetUsers?: RecipientInput[];
  isActive?: boolean | string;
  isDeleted?: boolean | string;
}

export interface CampaignListQuery extends ListQuery {
  channel?: string;
  status?: string;
  templateType?: string;
}

export interface AudienceQuery {
  /** all | leads | customers */
  type?: string;
  channel?: string;
  search?: string;
  page?: string;
  limit?: string;
}

export interface TemplateQuery {
  channel?: string;
}

export interface DeleteQuery {
  permanent?: string;
}

/** Twilio StatusCallback payload (form-encoded). */
export interface TwilioStatusPayload {
  MessageSid?: string;
  SmsSid?: string;
  MessageStatus?: string;
  SmsStatus?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  [key: string]: unknown;
}
