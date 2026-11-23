import type { CorsOptions } from "cors";

export const corsOptions: CorsOptions = {
  origin: true, // Reflect request origin, allows dashboard & frontend across ports
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
};
