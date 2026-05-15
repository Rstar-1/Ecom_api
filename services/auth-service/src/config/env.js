import { utils } from "../../../../shared/index.js";
const { loadEnv } = utils;

// Load centralized environment variables
loadEnv();

const requiredEnv = ["DATABASE", "JWT_SECRET"];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
});

export const ENV = {
  PORT: process.env.AUTH_PORT || process.env.PORT || 8080,
  DATABASE: process.env.DATABASE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVICE_NAME: process.env.SERVICE_NAME || "auth-service",
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || "7d",
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES || 5,
  BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS || 10,
};