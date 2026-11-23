import twilio from "twilio";
import { ENV } from "../../config/env";
import { logger } from "../../utils";
import type { DispatchResult } from "../email/email.service";

export type { DispatchResult };

export interface TemplateContext {
  name?: string;
  code?: string;
  link?: string;
  shortUrl?: string;
  company?: string;
}

const hasTwilioCredentials =
  !!ENV.TWILIO_ACCOUNT_SID?.startsWith("AC") &&
  !ENV.TWILIO_ACCOUNT_SID.includes("dummy") &&
  !!ENV.TWILIO_AUTH_TOKEN &&
  !ENV.TWILIO_AUTH_TOKEN.includes("dummy");

let client: ReturnType<typeof twilio> | null = null;
if (hasTwilioCredentials && ENV.TWILIO_ACCOUNT_SID && ENV.TWILIO_AUTH_TOKEN) {
  try {
    client = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
    logger.info("Twilio client initialised for SMS");
  } catch (error) {
    logger.warn(`Failed to initialise Twilio client: ${(error as Error).message}`);
  }
} else {
  logger.info("Twilio not configured: SMS sends are simulated");
}

const DEFAULT_LINK = "https://yourbrand.in/s/x7Qa";

export const interpolateTemplate = (template: string, context: TemplateContext = {}): string =>
  template
    .replace(/\{\{?name\}?\}/gi, context.name || "Customer")
    .replace(/\{\{?code\}?\}/gi, context.code || "546372")
    .replace(/\{\{?(link|shortUrl)\}?\}/gi, context.shortUrl || context.link || DEFAULT_LINK)
    .replace(/\{\{?company\}?\}/gi, context.company || "Company");

export const calculateSmsSegments = (body = ""): number => (body.length <= 160 ? 1 : Math.ceil(body.length / 153));

export const formatPhoneNumber = (phone = ""): string => {
  const clean = phone.replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean;
  return clean.length === 10 ? `+91${clean}` : `+${clean}`;
};

const twilioError = (error: unknown, fallbackCode: number) => {
  const err = error as { message?: string; code?: number | string };
  return { errorMessage: err.message ?? "Twilio send failed", errorCode: String(err.code ?? fallbackCode) };
};

export const sendSMS = async ({
  to,
  body,
  from = ENV.TWILIO_PHONE_NUMBER,
  statusCallback = ENV.TWILIO_STATUS_CALLBACK_URL,
}: {
  to: string;
  body: string;
  from?: string | undefined;
  statusCallback?: string | undefined;
}): Promise<DispatchResult> => {
  const formattedTo = formatPhoneNumber(to);
  const segmentsCount = calculateSmsSegments(body);

  if (client && from) {
    try {
      const message = await client.messages.create({
        body,
        to: formattedTo,
        from,
        ...(statusCallback ? { statusCallback } : {}),
      });
      logger.info(`[TWILIO SMS] Sent to ${formattedTo} | SID: ${message.sid}`);
      return { sid: message.sid, status: message.status || "queued", segmentsCount };
    } catch (error) {
      logger.error(`[TWILIO SMS ERROR] ${formattedTo}: ${(error as Error).message}`);
      return { sid: null, status: "failed", segmentsCount, ...twilioError(error, 30008) };
    }
  }

  const sid = `SM_SIM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  logger.info(`[SIMULATED SMS] To: ${formattedTo} | Segments: ${segmentsCount}`);
  return { sid, status: "sent", segmentsCount };
};
