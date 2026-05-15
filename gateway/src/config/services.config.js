import { env } from "./env.js";

export const services = {
  auth: env.AUTH_SERVICE_URL || "http://localhost:8080",
};