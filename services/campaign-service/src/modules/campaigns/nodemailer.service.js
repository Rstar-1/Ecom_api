import nodemailer from "nodemailer";
import { ENV } from "../../config/env.js";
import { utils } from "../../../../../shared/index.js";

const { info, warn, error, loadEnv } = utils;

let cachedTransporter = null;
let cachedCredentialsKey = null;

/**
 * ============================================================================
 * DYNAMIC TRANSPORTER INITIALIZER
 * ============================================================================
 * Dynamically resolves SMTP credentials from environment (reloading env if needed)
 * Sanitizes Google App Passwords (stripping spaces) and optimizes for Gmail.
 */
export const getTransporter = () => {
  // Try reloading env if SMTP_PASS is currently blank
  if (!process.env.SMTP_PASS && typeof loadEnv === "function") {
    try {
      loadEnv();
    } catch {}
  }

  const host = process.env.SMTP_HOST || ENV.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || ENV.SMTP_PORT) || 587;
  const secure = (process.env.SMTP_SECURE || ENV.SMTP_SECURE) === true || String(process.env.SMTP_SECURE) === "true" || port === 465;

  const rawUser = process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || ENV.SMTP_USER || "";
  const rawPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || ENV.SMTP_PASS || "";

  const user = String(rawUser).trim();
  // Strip all whitespace from App Password (e.g., 'abcd efgh ijkl mnop' -> 'abcdefghijklmnop')
  const pass = String(rawPass).trim().replace(/\s+/g, "");

  if (!user || !pass || user.includes("dummy") || pass.includes("dummy")) {
    return {
      transporter: null,
      user,
      error:
        "Gmail SMTP Password is not configured in env/dev.env. Please generate a 16-character Google App Password (myaccount.google.com/apppasswords) and set SMTP_PASS in env/dev.env to deliver live emails.",
    };
  }

  const credentialsKey = `${host}:${port}:${user}:${pass}:${secure}`;
  if (cachedTransporter && cachedCredentialsKey === credentialsKey) {
    return { transporter: cachedTransporter, user, error: null };
  }

  try {
    const isGmail = host.toLowerCase().includes("gmail") || user.toLowerCase().endsWith("@gmail.com");

    const transportOptions = isGmail
      ? {
          service: "gmail",
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        }
      : {
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: false,
          },
        };

    cachedTransporter = nodemailer.createTransport(transportOptions);
    cachedCredentialsKey = credentialsKey;
    info(`✅ Nodemailer SMTP transporter initialized for ${user} (${isGmail ? "Gmail Service" : `${host}:${port}`})`);

    return { transporter: cachedTransporter, user, error: null };
  } catch (err) {
    error(`⚠️ Failed to initialize Nodemailer transporter: ${err.message}`);
    return { transporter: null, user, error: err.message };
  }
};

/**
 * Test SMTP connection readiness
 */
export const verifySmtpConnection = async () => {
  const { transporter, error: initError } = getTransporter();
  if (!transporter) {
    return { success: false, message: initError || "No SMTP credentials configured" };
  }
  try {
    await transporter.verify();
    return { success: true, message: "SMTP server connection verified successfully" };
  } catch (err) {
    return { success: false, message: `SMTP verification failed: ${err.message}` };
  }
};

/**
 * ============================================================================
 * BUILD RESPONSIVE HTML EMAIL TEMPLATE (MATCHING DASHBOARD UI PREVIEW)
 * ============================================================================
 */
export const buildCampaignHtml = ({
  subject = "",
  body = "",
  templateType = "promotion",
  bannerIncluded = false,
  bannerType = "special_offer",
  bannerImageUrl = "",
  buttonLabel = "",
  buttonUrl = "",
  otpCode = "",
  footer = "You received this because you opted in. Unsubscribe",
  companyName = "Company",
  previewText = "",
}) => {
  const formattedBody = (body || "")
    .split("\n\n")
    .map((paragraph) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #374151; font-size: 15px;">${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("");

  // Top Visual Banner based on template type
  let bannerHtml = "";

  if (templateType === "welcome" || bannerType === "welcome") {
    bannerHtml = `
      <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); border-radius: 12px; padding: 28px 20px; text-align: center; margin-bottom: 24px; color: #ffffff;">
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.01em;">Welcome to ${companyName}</h2>
        <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95; font-weight: 500;">We're so glad you're here</p>
      </div>
    `;
  } else if (templateType === "otp" || bannerType === "otp") {
    bannerHtml = `
      <div style="background-color: #f8fafc; border: 2px dashed #047857; border-radius: 12px; padding: 24px 20px; text-align: center; margin-bottom: 24px;">
        <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.05em; margin-bottom: 8px;">Verification Code</div>
        <div style="font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #047857; font-family: monospace;">${otpCode || "546372"}</div>
        <p style="margin: 10px 0 0 0; font-size: 12px; color: #9ca3af;">Valid for 10 minutes. Do not share this code.</p>
      </div>
    `;
  } else if (bannerIncluded || templateType === "promotion") {
    bannerHtml = `
      <div style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; color: #ffffff;">
        <span style="display: inline-block; background-color: #facc15; color: #1f2937; font-weight: 800; font-size: 12px; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px;">Limited Time Only</span>
        <h2 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.02em;">SPECIAL OFFER</h2>
        ${
          bannerImageUrl
            ? `<div style="margin-top: 16px;"><img src="${bannerImageUrl}" alt="Special Offer" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 200px; object-fit: cover;" /></div>`
            : ""
        }
      </div>
    `;
  }

  const buttonHtml =
    buttonLabel && buttonUrl
      ? `
      <div style="margin: 28px 0; text-align: left;">
        <a href="${buttonUrl}" target="_blank" style="display: inline-block; background-color: #047857; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">${buttonLabel} &rarr;</a>
      </div>
    `
      : "";

  const preheaderHtml = previewText
    ? `<div style="display: none; max-height: 0px; overflow: hidden; font-size: 1px; line-height: 1px; color: #fff; opacity: 0;">${previewText}</div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheaderHtml}
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- HEADER -->
          <tr>
            <td style="padding: 24px 32px; border-bottom: 1px solid #f3f4f6; background-color: #ffffff;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 20px; font-weight: 800; color: #111827; letter-spacing: -0.02em;">
                    <span style="display: inline-block; width: 32px; height: 32px; line-height: 32px; text-align: center; background-color: #047857; color: #ffffff; border-radius: 50%; margin-right: 8px; font-size: 16px;">C</span>
                    ${companyName}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CONTENT -->
          <tr>
            <td style="padding: 32px;">
              ${bannerHtml}
              ${formattedBody}
              ${buttonHtml}
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #f3f4f6; text-align: center; color: #6b7280; font-size: 13px;">
              <p style="margin: 0 0 6px 0;">${footer}</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">&copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

/**
 * ============================================================================
 * DISPATCH EMAIL VIA NODEMAILER (STRICTLY NON-TWILIO)
 * ============================================================================
 */
export const sendEmailViaNodemailer = async ({
  to,
  subject,
  body,
  from = ENV.SENDER_EMAIL,
  templateType = "promotion",
  bannerIncluded = false,
  bannerType = "special_offer",
  bannerImageUrl = "",
  buttonLabel = "",
  buttonUrl = "",
  otpCode = "",
  footer = "You received this because you opted in. Unsubscribe",
  previewText = "",
}) => {
  const recipientEmail = String(to || "").trim().toLowerCase();
  const { transporter, user: authUser, error: initError } = getTransporter();

  const htmlContent = buildCampaignHtml({
    subject,
    body,
    templateType,
    bannerIncluded,
    bannerType,
    bannerImageUrl,
    buttonLabel,
    buttonUrl,
    otpCode,
    footer,
    companyName: ENV.SENDER_NAME || "Company",
    previewText,
  });

  // If transporter is not configured, do NOT fake delivery. Return failure with clear instructions.
  if (!transporter) {
    const errorMsg =
      initError ||
      "Gmail SMTP password (SMTP_PASS) is not configured in env/dev.env. For Gmail (rajshetye.5855@gmail.com), please generate a 16-character Google App Password (myaccount.google.com/apppasswords) and set SMTP_PASS in env/dev.env.";

    warn(`[NODEMAILER NOT SENT] To: ${recipientEmail} | Reason: ${errorMsg}`);

    return {
      sid: null,
      messageId: null,
      status: "failed",
      segmentsCount: 1,
      errorMessage: errorMsg,
      errorCode: "SMTP_AUTH_MISSING",
    };
  }

  // Gmail SMTP envelope sender must match the authenticated account to guarantee delivery
  const senderDisplayName = ENV.SENDER_NAME || "Company";
  const fromHeader = `"${senderDisplayName}" <${authUser}>`;

  try {
    const mailOptions = {
      from: fromHeader,
      to: recipientEmail,
      replyTo: from && from !== authUser ? from : authUser,
      subject: subject || "Update from Company",
      text: body,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    const messageId = result.messageId || `EM_NODEMAILER_${Date.now()}`;
    info(`[NODEMAILER] Email dispatched successfully to ${recipientEmail} | MessageID: ${messageId}`);

    return {
      sid: messageId,
      messageId,
      status: "sent",
      segmentsCount: 1,
    };
  } catch (err) {
    let detailedErrorMessage = err.message || "Failed to send email via SMTP";

    // Detect Gmail invalid credentials error
    if (detailedErrorMessage.includes("535") || detailedErrorMessage.includes("Username and Password not accepted")) {
      detailedErrorMessage = `Gmail SMTP Authentication Failed (535): Invalid username or App Password. For ${authUser}, make sure 2-Step Verification is ON, generate a 16-character App Password at myaccount.google.com/apppasswords, and put it into SMTP_PASS in env/dev.env.`;
    }

    error(`[NODEMAILER ERROR] Failed sending to ${recipientEmail}: ${detailedErrorMessage}`);

    return {
      sid: null,
      messageId: null,
      status: "failed",
      segmentsCount: 1,
      errorMessage: detailedErrorMessage,
      errorCode: "SMTP_SEND_FAILED",
    };
  }
};

export const sendGmail = sendEmailViaNodemailer;
export const sendMail = sendEmailViaNodemailer;

export default {
  getTransporter,
  verifySmtpConnection,
  buildCampaignHtml,
  sendEmailViaNodemailer,
  sendGmail,
  sendMail,
};
