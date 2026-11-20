import nodemailer, { type Transporter } from "nodemailer";
import { ENV } from "../../config/env";
import { logger } from "../../utils";
import type { DispatchResult } from "./twilio.service";

export interface EmailContent {
  to: string;
  subject: string;
  body: string;
  replyTo?: string;
  templateType?: string;
  bannerIncluded?: boolean;
  bannerType?: string;
  bannerImageUrl?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  otpCode?: string;
  footer?: string;
  previewText?: string;
}

const SMTP_NOT_CONFIGURED =
  "SMTP is not configured. Set SMTP_USER and SMTP_PASS (for Gmail, a 16-character App Password from myaccount.google.com/apppasswords) in env/dev.env.";

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  const user = ENV.SMTP_USER;
  const pass = ENV.SMTP_PASS;
  if (!user || !pass || user.includes("dummy") || pass.includes("dummy")) return null;
  if (transporter) return transporter;

  const isGmail = ENV.SMTP_HOST.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");
  transporter = nodemailer.createTransport(
    isGmail
      ? { service: "gmail", auth: { user, pass } }
      : { host: ENV.SMTP_HOST, port: ENV.SMTP_PORT, secure: ENV.SMTP_SECURE, auth: { user, pass } }
  );
  logger.info(`SMTP transporter initialised for ${user} (${isGmail ? "Gmail" : `${ENV.SMTP_HOST}:${ENV.SMTP_PORT}`})`);
  return transporter;
};

/** Escapes text before it is placed in the HTML email (recipient names come from public forms). */
const escapeHtml = (value = ""): string =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const safeUrl = (value = ""): string => (/^https?:\/\//i.test(value) ? escapeHtml(value) : "");

/** Builds the branded campaign email (promotion / welcome / OTP layouts). */
export const buildCampaignHtml = (content: EmailContent, companyName = ENV.SENDER_NAME): string => {
  const company = escapeHtml(companyName);
  const paragraphs = content.body
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;line-height:1.6;color:#374151;font-size:15px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");

  const type = content.templateType ?? "promotion";
  let banner = "";
  if (type === "welcome" || content.bannerType === "welcome") {
    banner = `<div style="background:linear-gradient(135deg,#065f46 0%,#047857 100%);border-radius:12px;padding:28px 20px;text-align:center;margin-bottom:24px;color:#fff;"><h2 style="margin:0;font-size:24px;font-weight:800;">Welcome to ${company}</h2><p style="margin:8px 0 0 0;font-size:15px;">We're so glad you're here</p></div>`;
  } else if (type === "otp" || content.bannerType === "otp") {
    banner = `<div style="background:#f8fafc;border:2px dashed #047857;border-radius:12px;padding:24px 20px;text-align:center;margin-bottom:24px;"><div style="font-size:13px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">Verification Code</div><div style="font-size:34px;font-weight:900;letter-spacing:6px;color:#047857;font-family:monospace;">${escapeHtml(content.otpCode || "546372")}</div><p style="margin:10px 0 0 0;font-size:12px;color:#9ca3af;">Valid for 10 minutes. Do not share this code.</p></div>`;
  } else if (content.bannerIncluded || type === "promotion") {
    const image = safeUrl(content.bannerImageUrl);
    banner = `<div style="background:linear-gradient(135deg,#065f46 0%,#047857 100%);border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;color:#fff;"><span style="display:inline-block;background:#facc15;color:#1f2937;font-weight:800;font-size:12px;padding:4px 10px;border-radius:9999px;text-transform:uppercase;margin-bottom:12px;">Limited Time Only</span><h2 style="margin:0;font-size:24px;font-weight:800;">SPECIAL OFFER</h2>${image ? `<div style="margin-top:16px;"><img src="${image}" alt="Special Offer" style="max-width:100%;height:auto;border-radius:8px;max-height:200px;object-fit:cover;"/></div>` : ""}</div>`;
  }

  const buttonUrl = safeUrl(content.buttonUrl);
  const button =
    content.buttonLabel && buttonUrl
      ? `<div style="margin:28px 0;"><a href="${buttonUrl}" target="_blank" style="display:inline-block;background:#047857;color:#fff;padding:12px 28px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">${escapeHtml(content.buttonLabel)} &rarr;</a></div>`
      : "";

  const preheader = content.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(content.previewText)}</div>`
    : "";

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(content.subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${preheader}
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:30px 15px;"><tr><td align="center">
<table width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:12px;overflow:hidden;">
<tr><td style="padding:24px 32px;border-bottom:1px solid #f3f4f6;font-size:20px;font-weight:800;color:#111827;">${company}</td></tr>
<tr><td style="padding:32px;">${banner}${paragraphs}${button}</td></tr>
<tr><td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;text-align:center;color:#6b7280;font-size:13px;"><p style="margin:0 0 6px 0;">${escapeHtml(content.footer || "You received this because you opted in. Unsubscribe")}</p><p style="margin:0;font-size:12px;color:#9ca3af;">&copy; ${new Date().getFullYear()} ${company}. All rights reserved.</p></td></tr>
</table></td></tr></table></body></html>`;
};

export const sendEmail = async (content: EmailContent): Promise<DispatchResult> => {
  const to = content.to.trim().toLowerCase();
  const mailer = getTransporter();

  if (!mailer || !ENV.SMTP_USER) {
    logger.warn(`[EMAIL NOT SENT] To: ${to} | ${SMTP_NOT_CONFIGURED}`);
    return { sid: null, status: "failed", segmentsCount: 1, errorMessage: SMTP_NOT_CONFIGURED, errorCode: "SMTP_AUTH_MISSING" };
  }

  try {
    const result = await mailer.sendMail({
      from: `"${ENV.SENDER_NAME}" <${ENV.SMTP_USER}>`,
      to,
      replyTo: content.replyTo || ENV.SMTP_USER,
      subject: content.subject || `Update from ${ENV.SENDER_NAME}`,
      text: content.body,
      html: buildCampaignHtml(content),
    });
    const messageId = String(result.messageId || `EM_${Date.now()}`);
    logger.info(`[EMAIL] Sent to ${to} | MessageID: ${messageId}`);
    return { sid: messageId, status: "sent", segmentsCount: 1 };
  } catch (error) {
    let message = (error as Error).message || "Failed to send email via SMTP";
    if (message.includes("535") || message.includes("Username and Password not accepted")) {
      message = `SMTP authentication failed (535) for ${ENV.SMTP_USER}: check SMTP_PASS (Gmail needs 2-Step Verification and an App Password).`;
    }
    logger.error(`[EMAIL ERROR] ${to}: ${message}`);
    return { sid: null, status: "failed", segmentsCount: 1, errorMessage: message, errorCode: "SMTP_SEND_FAILED" };
  }
};
