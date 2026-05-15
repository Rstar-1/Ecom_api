import { utils } from "../../../shared/index.js";
const { loadEnv } = utils;

// Load centralized environment variables
loadEnv();

export const env = {
  PORT: Number(process.env.GATEWAY_PORT) || Number(process.env.PORT) || 3000,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8080",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:8082",
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || "http://localhost:8083",
  CART_SERVICE_URL: process.env.CART_SERVICE_URL || "http://localhost:5004",
  ORDER_SERVICE_URL: process.env.ORDER_SERVICE_URL || "http://localhost:5005",
  PAYMENT_SERVICE_URL: process.env.PAYMENT_SERVICE_URL || "http://localhost:5006",
  ROLE_SERVICE_URL: process.env.ROLE_SERVICE_URL || "http://localhost:5007",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100
};