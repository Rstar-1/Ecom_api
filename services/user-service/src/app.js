import express from "express";
import mainRoutes from "./routes/index.js";
import { middleware, utils, constants } from "../../../shared/index.js";

const { statusCodes } = constants;
const { ensureDir } = utils;

const app = express();

/* CONFIGURE APP */
utils.configureApp(app);

/* RATE LIMIT */
app.use(middleware.rateLimiter);

/* FILE STORAGE (COMMON ROOT UPLOADS OUTSIDE SERVICES) */
const uploadDir = middleware.uploadPath;
ensureDir(uploadDir);

app.use("/uploads", express.static(uploadDir));

/* BASE ROUTE */
app.use("/api", mainRoutes);

/* ROOT */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "User Service Running 🚀",
  });
});

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({
    success: true,
    service: "user-service",
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
