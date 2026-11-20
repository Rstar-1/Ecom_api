import { ENV } from "../../config/env";
import { logger } from "../../utils";
import type { DispatchResult } from "./twilio.service";

/* =====================================================================
   WhatsApp Cloud API (Meta Graph API)
   POST https://graph.facebook.com/<version>/<phone-number-id>/messages
   ===================================================================== */

export interface WhatsAppTemplate {
  /** Approved template name, e.g. "hello_world" */
  name: string;
  /** Template language code, e.g. "en_US" */
  language: string;
  /** Values for {{1}}, {{2}}… in the template body (already personalised) */
  bodyParams?: string[];
}

export interface CloudSendInput {
  to: string;
  /** Free-form text (only delivered inside the 24h customer-service window) */
  body: string;
  /** Business-initiated messages must use an approved template */
  template?: WhatsAppTemplate | undefined;
  /** Sent as an image message with `body` as caption (free-form only) */
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

export const isWhatsAppCloudConfigured = (): boolean =>
  !!ENV.WHATSAPP_ACCESS_TOKEN && !!ENV.WHATSAPP_PHONE_NUMBER_ID;

/** Cloud API wants digits only with country code, e.g. "918318096514". 10-digit numbers are treated as Indian. */
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

/** Sends one WhatsApp message through Meta's Cloud API. Never throws; failures come back as status "failed". */
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
