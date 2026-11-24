import path from "path";
import dotenv from "dotenv";

/* Load env/<dev|staging|prod>.env (same files the old services used).
   Variables already set in the real environment (shell, Docker -e) take priority. */
const envType = process.env.NODE_ENV ?? "development";
const fileName =
  envType === "development" ? "dev.env" : envType === "staging" ? "staging.env" : "prod.env";
const envPath = path.resolve(process.cwd(), "env", fileName);
const result = dotenv.config({ path: envPath, override: false, quiet: true });
if (result.error) {
  console.warn(`⚠️ Could not load env file from ${envPath}: ${result.error.message}`);
}

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`❌ Missing environment variable: ${key}`);
  return value;
};

const optional = (key: string): string | undefined => process.env[key] || undefined;

const toNumber = (key: string, fallback: number): number => {
  const n = Number(process.env[key]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export interface Env {
  readonly PORT: number;
  readonly NODE_ENV: string;
  readonly DATABASE: string;
  readonly JWT_SECRET: string;
  readonly JWT_EXPIRES_IN: string;
  readonly REFRESH_TOKEN_SECRET: string | undefined;
  readonly REFRESH_TOKEN_EXPIRES_IN: string;
  readonly OTP_EXPIRY_MINUTES: number;
  readonly RATE_LIMIT_WINDOW_MS: number;
  readonly RATE_LIMIT_MAX: number;
  readonly RAZORPAY_KEY_ID: string | undefined;
  readonly RAZORPAY_KEY_SECRET: string | undefined;
  readonly TWILIO_ACCOUNT_SID: string | undefined;
  readonly TWILIO_AUTH_TOKEN: string | undefined;
  readonly TWILIO_PHONE_NUMBER: string | undefined;
  readonly TWILIO_WHATSAPP_NUMBER: string;
  readonly TWILIO_STATUS_CALLBACK_URL: string | undefined;
  readonly WHATSAPP_ACCESS_TOKEN: string | undefined;
  readonly WHATSAPP_PHONE_NUMBER_ID: string | undefined;
  readonly WHATSAPP_API_VERSION: string;
  readonly WHATSAPP_DEFAULT_TEMPLATE: string | undefined;
  readonly WHATSAPP_TEMPLATE_LANGUAGE: string;
  readonly SMTP_HOST: string;
  readonly SMTP_PORT: number;
  readonly SMTP_SECURE: boolean;
  readonly SMTP_USER: string | undefined;
  readonly SMTP_PASS: string | undefined;
  readonly SENDER_EMAIL: string;
  readonly SENDER_NAME: string;
  readonly GITHUB_TOKEN: string | undefined;
  readonly GITHUB_OWNER: string;
  readonly GITHUB_REPO: string;
  readonly GITHUB_BRANCH: string;
  readonly GITHUB_FOLDER: string;
}

export const ENV: Env = Object.freeze({
  PORT: toNumber("PORT", 3000),
  NODE_ENV: envType,
  DATABASE: required("DATABASE"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: optional("JWT_EXPIRES_IN") ?? "1d",
  REFRESH_TOKEN_SECRET: optional("REFRESH_TOKEN_SECRET"),
  REFRESH_TOKEN_EXPIRES_IN: optional("REFRESH_TOKEN_EXPIRES_IN") ?? "7d",
  OTP_EXPIRY_MINUTES: toNumber("OTP_EXPIRY_MINUTES", 5),
  RATE_LIMIT_WINDOW_MS: toNumber("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000),
  RATE_LIMIT_MAX: toNumber("RATE_LIMIT_MAX", 100),
  RAZORPAY_KEY_ID: optional("RAZORPAY_KEY_ID"),
  RAZORPAY_KEY_SECRET: optional("RAZORPAY_KEY_SECRET"),
  TWILIO_ACCOUNT_SID: optional("TWILIO_ACCOUNT_SID"),
  TWILIO_AUTH_TOKEN: optional("TWILIO_AUTH_TOKEN"),
  TWILIO_PHONE_NUMBER: optional("TWILIO_PHONE_NUMBER"),
  TWILIO_WHATSAPP_NUMBER: optional("TWILIO_WHATSAPP_NUMBER") ?? "whatsapp:+14155238886",
  TWILIO_STATUS_CALLBACK_URL: optional("TWILIO_STATUS_CALLBACK_URL"),
  WHATSAPP_ACCESS_TOKEN: optional("WHATSAPP_ACCESS_TOKEN"),
  WHATSAPP_PHONE_NUMBER_ID: optional("WHATSAPP_PHONE_NUMBER_ID"),
  WHATSAPP_API_VERSION: optional("WHATSAPP_API_VERSION") ?? "v25.0",
  WHATSAPP_DEFAULT_TEMPLATE: optional("WHATSAPP_DEFAULT_TEMPLATE"),
  WHATSAPP_TEMPLATE_LANGUAGE: optional("WHATSAPP_TEMPLATE_LANGUAGE") ?? "en_US",
  SMTP_HOST: optional("SMTP_HOST") ?? "smtp.gmail.com",
  SMTP_PORT: toNumber("SMTP_PORT", 587),
  SMTP_SECURE: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
  SMTP_USER: optional("SMTP_USER"),
  SMTP_PASS: optional("SMTP_PASS")?.replace(/\s+/g, ""),
  SENDER_EMAIL: optional("SENDER_EMAIL") ?? optional("SMTP_USER") ?? "offers@yourbrand.in",
  SENDER_NAME: optional("SENDER_NAME") ?? "Company",
  GITHUB_TOKEN: optional("GITHUB_TOKEN"),
  GITHUB_OWNER: optional("GITHUB_OWNER") ?? "Rstar-1",
  GITHUB_REPO: optional("GITHUB_REPO") ?? "generic_images",
  GITHUB_BRANCH: optional("GITHUB_BRANCH") ?? "main",
  GITHUB_FOLDER: optional("GITHUB_FOLDER") ?? "ashmita",
});
