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
  PORT: process.env.PRODUCT_PORT || process.env.PORT || 8083,
  DATABASE: process.env.DATABASE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVICE_NAME: process.env.SERVICE_NAME || "product-service",
};
