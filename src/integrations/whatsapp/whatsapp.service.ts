import twilio from "twilio";
import { ENV } from "../../config/env";
import { logger } from "../../utils";
import type { DispatchResult } from "../email/email.service";
import { formatPhoneNumber } from "../sms/sms.service";

export type { DispatchResult };

export interface WhatsAppTemplate {
  name: string;
  language: string;
  bodyParams?: string[];
}

export interface CloudSendInput {
  to: string;
  body: string;
  template?: WhatsAppTemplate | undefined;
  imageUrl?: string | undefined;
}

type CloudMessage =
  | { type: "template"; template: { name: string; language: { code: string }; components?: unknown[] } }
  | { type: "image"; image: { link: string; caption: string } }
  | { type: "text"; text: { body: string; preview_url: boolean } };

interface GraphSuccess {
  messages?: Array<{ id: string; message_status?: string }>;
}

interface GraphError {
  error?: { message?: string; code?: number; error_data?: { details?: string } };
}

const hasTwilioCredentials =
  !!ENV.TWILIO_ACCOUNT_SID?.startsWith("AC") &&
  !ENV.TWILIO_ACCOUNT_SID.includes("dummy") &&
  !!ENV.TWILIO_AUTH_TOKEN &&
  !ENV.TWILIO_AUTH_TOKEN.includes("dummy");

let twilioClient: ReturnType<typeof twilio> | null = null;
if (hasTwilioCredentials && ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
  } catch (error) {
    logger.warn(`Failed to initialise Twilio WhatsApp client: ${(error as Error).message}`);
  }
}

export const isWhatsAppCloudConfigured = (): boolean =>
  !!ENV.WHATSAPP_ACCESS_TOKEN && !!ENV.WHATSAPP_PHONE_NUMBER_ID;

export const toWhatsAppNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits;
};

const buildMessage = ({ body, template, imageUrl }: CloudSendInput): CloudMessage => {
  if (template?.name) {
    const params = template.bodyParams ?? [];
    return {
      type: "template",
      template: {
        name: template.name,
        language: { code: template.language || ENV.WHATSAPP_TEMPLATE_LANGUAGE },
        ...(params.length
          ? { components: [{ type: "body", parameters: params.map((text) => ({ type: "text", text })) }] }
          : {}),
      },
    };
  }
  if (imageUrl && /^https?:\/\//i.test(imageUrl)) {
    return { type: "image", image: { link: imageUrl, caption: body } };
  }
  return { type: "text", text: { body, preview_url: true } };
};

export const sendWhatsAppCloud = async (input: CloudSendInput): Promise<DispatchResult> => {
  const to = toWhatsAppNumber(input.to);
  if (!to) {
    return { sid: null, status: "failed", segmentsCount: 1, errorMessage: "Invalid phone number", errorCode: "INVALID_NUMBER" };
  }

  const url = `https://graph.facebook.com/${ENV.WHATSAPP_API_VERSION}/${ENV.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  const message = buildMessage(input);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENV.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", to, ...message }),
      signal: AbortSignal.timeout(15000),
    });

    const json = (await response.json().catch(() => ({}))) as GraphSuccess & GraphError;

    if (!response.ok || json.error) {
      const err = json.error;
      const errorMessage = [err?.message, err?.error_data?.details].filter(Boolean).join(" – ") || `HTTP ${response.status}`;
      logger.error(`[WHATSAPP CLOUD ERROR] ${to}: ${errorMessage}`);
      return { sid: null, status: "failed", segmentsCount: 1, errorMessage, errorCode: String(err?.code ?? response.status) };
    }

    const id = json.messages?.[0]?.id ?? null;
    logger.info(`[WHATSAPP CLOUD] Sent ${message.type} to ${to} | ID: ${id}`);
    return { sid: id, status: "sent", segmentsCount: 1 };
  } catch (error) {
    const errorMessage = (error as Error).message || "WhatsApp Cloud API request failed";
    logger.error(`[WHATSAPP CLOUD ERROR] ${to}: ${errorMessage}`);
    return { sid: null, status: "failed", segmentsCount: 1, errorMessage, errorCode: "NETWORK_ERROR" };
  }
};

export const sendWhatsAppTwilio = async ({
  to,
  body,
  from = ENV.TWILIO_WHATSAPP_NUMBER,
  mediaUrl,
  statusCallback = ENV.TWILIO_STATUS_CALLBACK_URL,
}: {
  to: string;
  body: string;
  from?: string;
  mediaUrl?: string | undefined;
  statusCallback?: string | undefined;
}): Promise<DispatchResult> => {
  const phone = formatPhoneNumber(to);
  const formattedTo = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
  const formattedFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  if (twilioClient && from) {
    try {
      const message = await twilioClient.messages.create({
        body,
        to: formattedTo,
        from: formattedFrom,
        ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
        ...(statusCallback ? { statusCallback } : {}),
      });
      logger.info(`[TWILIO WHATSAPP] Sent to ${formattedTo} | SID: ${message.sid}`);
      return { sid: message.sid, status: message.status || "queued", segmentsCount: 1 };
    } catch (error) {
      logger.error(`[TWILIO WHATSAPP ERROR] ${formattedTo}: ${(error as Error).message}`);
      return { sid: null, status: "failed", segmentsCount: 1, errorMessage: (error as Error).message, errorCode: "63007" };
    }
  }

  const sid = `MM_SIM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  logger.info(`[SIMULATED WHATSAPP] To: ${formattedTo}`);
  return { sid, status: "sent", segmentsCount: 1 };
};

export const sendWhatsApp = sendWhatsAppTwilio;
