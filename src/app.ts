import cors from "cors";
import express from "express";
import morgan from "morgan";
import { corsOptions } from "./config/cors";
import { securityMiddleware } from "./config/security";
import { errorMiddleware, notFoundMiddleware, rateLimiter, UPLOAD_DIR } from "./middlewares";
import apiRoutes from "./routes";
import { accessLogStream } from "./utils/logger";

const app = express();

app.set("trust proxy", 1);

/* Security & CORS */
app.use(securityMiddleware);
app.use(cors(corsOptions));

/* Body Parsers */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* Logging (Console + logs/access.log) */
app.use(morgan("dev"));
app.use(morgan("combined", { stream: accessLogStream }));

/* Rate Limiting & Static Files */
app.use(rateLimiter);
app.use("/uploads", express.static(UPLOAD_DIR));

/* Root & Health */
app.get("/", (_req, res) => {
  res.json({ success: true, message: "Ecom API running 🚀" });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", uptime: process.uptime() });
});

/* API Endpoints */
app.use("/api", apiRoutes);

/* 404 & Error Middlewares */
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
