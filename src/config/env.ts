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
});
