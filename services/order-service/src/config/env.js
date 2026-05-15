import { utils } from "../../../../shared/index.js";
const { loadEnv } = utils;

// Load centralized environment variables
loadEnv();

const requiredEnv = ["DATABASE", "JWT_SECRET", "CART_SERVICE_URL"];

requiredEnv.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`❌ Missing environment variable: ${key}`);
  }
});

export const ENV = {
  PORT: process.env.ORDER_PORT || process.env.PORT || 5005,
  DATABASE: process.env.DATABASE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "1d",
  NODE_ENV: process.env.NODE_ENV || "development",
  SERVICE_NAME: process.env.SERVICE_NAME || "order-service",
  CART_SERVICE_URL: process.env.CART_SERVICE_URL,
};
