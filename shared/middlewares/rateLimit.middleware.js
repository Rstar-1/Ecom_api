import rateLimit from "express-rate-limit";
import { loadEnv } from "../utils/envLoader.js";

// Ensure environment variables are loaded
loadEnv();

const isDev = (process.env.NODE_ENV || "development") === "development";

const windowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || (isDev ? 60 * 1000 : 15 * 60 * 1000);

const max =
  Number(process.env.RATE_LIMIT_MAX) || (isDev ? 10000 : 1000);

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // In development or for localhost/internal traffic, do not throttle requests
    if (isDev) return true;
    const ip = req.ip || req.connection?.remoteAddress || "";
    return (
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip === "::ffff:127.0.0.1" ||
      req.hostname === "localhost"
    );
  },
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
