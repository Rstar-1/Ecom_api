import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import mainRoutes from "./routes/index.js";
import { middleware, utils, constants } from "../../../shared/index.js";
const { statusCodes } = constants;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

/* CONFIGURE APP */
utils.configureApp(app);

/* RATE LIMIT */
app.use(middleware.rateLimiter);

/* BASE ROUTE */
app.use("/api", mainRoutes);

/* ROOT */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Role Service Running 🚀",
  });
});

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "role-service",
  });
});

/* 404 */
app.use((req, res) => {
  res.status(statusCodes.HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: "Route not found",
  });
});

/* ERROR HANDLER */
app.use(middleware.errorMiddleware);

export default app;
