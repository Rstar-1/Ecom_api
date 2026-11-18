import twilio from "twilio";
import { ENV } from "../../config/env.js";
import { utils } from "../../../../../shared/index.js";

const { info, warn, error } = utils;

// Initialize Twilio client if valid credentials exist
let twilioClient = null;
const hasValidTwilioCreds =
  ENV.TWILIO_ACCOUNT_SID &&
  ENV.TWILIO_ACCOUNT_SID.startsWith("AC") &&
  !ENV.TWILIO_ACCOUNT_SID.includes("dummy") &&
  ENV.TWILIO_AUTH_TOKEN &&
  !ENV.TWILIO_AUTH_TOKEN.includes("dummy");

if (hasValidTwilioCreds) {
  try {
    twilioClient = twilio(ENV.TWILIO_ACCOUNT_SID, ENV.TWILIO_AUTH_TOKEN);
    info("✅ Twilio SDK client initialized for SMS and WhatsApp");
  } catch (err) {
    warn(`⚠️ Failed to initialize Twilio client: ${err.message}`);
  }
} else {
  info("ℹ️ Twilio running in simulated dispatch mode for SMS and WhatsApp (dev/test credentials)");
}

/**
 * Replaces placeholders like {name}, {code}, {link}, {shortUrl}, {company}
 */
export const interpolateTemplate = (template = "", context = {}) => {
  if (!template || typeof template !== "string") return "";

  return template
    .replace(/\{name\}|\{\{name\}\}/gi, context.name || "Customer")
    .replace(/\{code\}|\{\{code\}\}/gi, context.code || context.otpCode || "546372")
    .replace(
      /\{link\}|\{\{link\}\}|\{shortUrl\}|\{\{shortUrl\}\}/gi,
      context.shortUrl || context.link || "https://yourbrand.in/s/x7Qa"
    )
    .replace(/\{company\}|\{\{company\}\}/gi, context.company || "Company");
};

/**
 * Calculates SMS segment count (GSM 160 chars / segment standard)
 */
export const calculateSmsSegments = (body = "") => {
  const len = (body || "").length;
  if (len <= 160) return 1;
  return Math.ceil(len / 153);
};

/**
 * Formats phone number for E.164 (Twilio requirement)
 */
export const formatPhoneNumber = (phone = "") => {
  const clean = String(phone).replace(/[^\d+]/g, "");
  if (!clean) return "";
  if (clean.startsWith("+")) return clean;
  // Default to +91 (India) if 10 digits
  if (clean.length === 10) return `+91${clean}`;
  return `+${clean}`;
};

/**
 * ============================================================================
 * DISPATCH SMS VIA TWILIO
 * ============================================================================
 */
export const sendSMS = async ({
  to,
  body,
  from = ENV.TWILIO_PHONE_NUMBER,
  statusCallback = ENV.STATUS_CALLBACK_URL,
}) => {
  const formattedTo = formatPhoneNumber(to);
  const segments = calculateSmsSegments(body);

  if (twilioClient && from) {
    try {
      const message = await twilioClient.messages.create({
        body,
        to: formattedTo,
        from,
        ...(statusCallback ? { statusCallback } : {}),
      });

      info(`[TWILIO SMS] Sent to ${formattedTo} | SID: ${message.sid}`);
      return {
        sid: message.sid,
        status: message.status || "queued",
        segmentsCount: segments,
      };
    } catch (err) {
      error(`[TWILIO SMS ERROR] ${formattedTo}: ${err.message}`);
      return {
        sid: `SM_ERR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: "failed",
        segmentsCount: segments,
        errorMessage: err.message,
        errorCode: String(err.code || 30008),
      };
    }
  }

  // Simulated Dispatch for Development
  const mockSid = `SM_SIM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  info(`[SIMULATED SMS] To: ${formattedTo} | Segments: ${segments} | Body: "${body.slice(0, 40)}..."`);
  return {
    sid: mockSid,
    status: "sent",
    segmentsCount: segments,
  };
};

/**
 * ============================================================================
 * DISPATCH WHATSAPP VIA TWILIO
 * ============================================================================
 */
export const sendWhatsApp = async ({
  to,
  body,
  from = ENV.TWILIO_WHATSAPP_NUMBER,
  mediaUrl,
  statusCallback = ENV.STATUS_CALLBACK_URL,
}) => {
  const rawPhone = formatPhoneNumber(to);
  const formattedTo = rawPhone.startsWith("whatsapp:") ? rawPhone : `whatsapp:${rawPhone}`;
  const formattedFrom = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;

  if (twilioClient && from) {
    try {
      const payload = {
        body,
        to: formattedTo,
        from: formattedFrom,
        ...(mediaUrl ? { mediaUrl: [mediaUrl] } : {}),
        ...(statusCallback ? { statusCallback } : {}),
      };

      const message = await twilioClient.messages.create(payload);
      info(`[TWILIO WHATSAPP] Sent to ${formattedTo} | SID: ${message.sid}`);
      return {
        sid: message.sid,
        status: message.status || "queued",
        segmentsCount: 1,
      };
    } catch (err) {
      error(`[TWILIO WHATSAPP ERROR] ${formattedTo}: ${err.message}`);
      return {
        sid: `MM_ERR_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        status: "failed",
        segmentsCount: 1,
        errorMessage: err.message,
        errorCode: String(err.code || 63007),
      };
    }
  }

  // Simulated Dispatch for Development
  const mockSid = `MM_SIM_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  info(`[SIMULATED WHATSAPP] To: ${formattedTo} | Body: "${body.slice(0, 40)}..."`);
  return {
    sid: mockSid,
    status: "sent",
    segmentsCount: 1,
  };
};

export default {
  interpolateTemplate,
  calculateSmsSegments,
  formatPhoneNumber,
  sendSMS,
  sendWhatsApp,
};
