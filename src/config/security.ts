import helmet from "helmet";

export const securityMiddleware = helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Allows cross-origin image & asset serving
});
