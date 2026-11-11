import { utils } from "../../../shared/index.js";
const { loadEnv } = utils;

// Load centralized environment variables
loadEnv();

export const env = {
  PORT: Number(process.env.GATEWAY_PORT) || Number(process.env.PORT) || 5000,
  AUTH_SERVICE_URL: process.env.AUTH_SERVICE_URL || "http://localhost:8082",
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || "http://localhost:8083",
  ROLE_SERVICE_URL: process.env.ROLE_SERVICE_URL || "http://localhost:8081",
  PRODUCT_SERVICE_URL: process.env.PRODUCT_SERVICE_URL || "http://localhost:8084",
  BLOG_SERVICE_URL: process.env.BLOG_SERVICE_URL || "http://localhost:8085",
  LEAD_SERVICE_URL: process.env.LEAD_SERVICE_URL || "http://localhost:8086",
  CMS_SERVICE_URL: process.env.CMS_SERVICE_URL || "http://localhost:8087",
  SEO_SERVICE_URL: process.env.SEO_SERVICE_URL || "http://localhost:8088",
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 10000
};
