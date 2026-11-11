import { env } from "./env.js";

export const services = {
  auth: env.AUTH_SERVICE_URL || "http://localhost:8082",
  user: env.USER_SERVICE_URL || "http://localhost:8083",
  role: env.ROLE_SERVICE_URL || "http://localhost:8081",
  product: env.PRODUCT_SERVICE_URL || "http://localhost:8084",
  blog: env.BLOG_SERVICE_URL || "http://localhost:8085",
  lead: env.LEAD_SERVICE_URL || "http://localhost:8086",
  cms: env.CMS_SERVICE_URL || "http://localhost:8087",
  seo: env.SEO_SERVICE_URL || "http://localhost:8088",
};
