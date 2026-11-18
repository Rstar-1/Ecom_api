import { utils } from "../../../../shared/index.js";
const { loadEnv } = utils;

// Load centralized environment variables
loadEnv();

const requiredEnv = ["DATABASE"];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
});

export const ENV = {
  PORT: Number(process.env.CAMPAIGN_PORT) || 8087,
  DATABASE: process.env.DATABASE,
  JWT_SECRET: process.env.JWT_SECRET || "default_secret",
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVICE_NAME: "campaign-service",

  // Twilio Configuration (SMS & WhatsApp ONLY)
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || "",
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || "",
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || "",
  TWILIO_WHATSAPP_NUMBER: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
  STATUS_CALLBACK_URL: process.env.TWILIO_STATUS_CALLBACK_URL || "",

  // Nodemailer / SMTP Configuration (for Gmail & Email campaigns)
  get SMTP_HOST() {
    return process.env.SMTP_HOST || "smtp.gmail.com";
  },
  get SMTP_PORT() {
    return Number(process.env.SMTP_PORT) || 587;
  },
  get SMTP_SECURE() {
    return process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465";
  },
  get SMTP_USER() {
    return process.env.SMTP_USER || process.env.GMAIL_USER || process.env.EMAIL_USER || "";
  },
  get SMTP_PASS() {
    return process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS || "";
  },
  get SENDER_EMAIL() {
    return process.env.SENDER_EMAIL || process.env.SMTP_USER || "offers@yourbrand.in";
  },
  get SENDER_NAME() {
    return process.env.SENDER_NAME || "Company";
  },
};
